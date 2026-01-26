#!/bin/bash
# Push local .env files to Convex environment variables
# Usage: ./scripts/convex/env-push.sh <development|production|preview> [preview-name] [--dry-run]
#
# --dry-run: Prints what commands would run, doesn't execute
# WARNING: This will overwrite existing values in Convex!
#
# For preview: Also checks that dev/prod have overrides for each var
# (since preview vars become defaults that dev/prod should override)
#
# NOTE: Convex CLI does NOT support multiline env vars natively.
# This script uses the `--` flag to handle values starting with `-` (like PEM keys).
# See: https://github.com/get-convex/convex-backend/issues/128

set -e

DRY_RUN=false
ENV_TARGET=""
PREVIEW_NAME=""

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=true
      ;;
    *)
      if [[ -z "$ENV_TARGET" ]]; then
        ENV_TARGET="$arg"
      else
        PREVIEW_NAME="$arg"
      fi
      ;;
  esac
done

# Check if value contains newlines (multiline)
is_multiline() {
  local value="$1"
  [[ "$value" == *$'\n'* ]]
}

# Extract just the key names from an env file (handles multiline values)
get_env_keys() {
  local file="$1"
  local in_multiline=false

  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$in_multiline" == "true" ]]; then
      # Check if this line ends the multiline value
      if [[ "$line" == *'"' ]] && [[ "$line" != *'\"' ]]; then
        in_multiline=false
      fi
      continue
    fi

    # Skip comments and empty lines
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue

    # Extract key
    local key="${line%%=*}"
    local value="${line#*=}"

    # Check if this starts a multiline value
    if [[ "$value" == '"'* ]] && [[ "$value" != *'"' || "$value" == '""' ]]; then
      local temp_value="${value#\"}"
      if [[ "$temp_value" != *'"' ]]; then
        in_multiline=true
      fi
    fi

    echo "$key"
  done < "$file"
}

# Check if dev and prod have overrides for preview vars
check_dev_prod_overrides() {
  local preview_file="$1"
  local missing_dev=""
  local missing_prod=""

  # Get current dev and prod vars
  local dev_vars=$(npx convex env list 2>/dev/null | cut -d= -f1)
  local prod_vars=$(npx convex env list --env-file .env.convex-cli.production 2>/dev/null | cut -d= -f1)

  echo "=== Checking dev/prod have overrides ==="
  echo ""

  # Get keys from preview file (properly handling multiline values)
  local preview_keys=$(get_env_keys "$preview_file")

  while IFS= read -r key || [[ -n "$key" ]]; do
    [[ -z "$key" ]] && continue

    if ! echo "$dev_vars" | grep -q "^${key}$"; then
      missing_dev="$missing_dev $key"
    fi
    if ! echo "$prod_vars" | grep -q "^${key}$"; then
      missing_prod="$missing_prod $key"
    fi
  done <<< "$preview_keys"

  local has_missing=false

  if [[ -n "$missing_dev" ]]; then
    echo "⚠️  Dev missing overrides for:$missing_dev"
    has_missing=true
  else
    echo "✓ Dev has all overrides"
  fi

  if [[ -n "$missing_prod" ]]; then
    echo "⚠️  Prod missing overrides for:$missing_prod"
    has_missing=true
  else
    echo "✓ Prod has all overrides"
  fi

  echo ""

  if [[ "$has_missing" == "true" ]]; then
    echo "Preview vars become defaults - dev/prod should override them!"
    echo "Add missing vars to dev/prod before pushing to preview."
    echo ""
    if [[ "$DRY_RUN" == "false" ]]; then
      read -p "Continue anyway? (y/N) " -n 1 -r
      echo ""
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
      fi
    fi
  fi
}

push_env_file() {
  local file="$1"
  local cli_args="$2"

  if [[ ! -f "$file" ]]; then
    echo "Error: $file not found"
    exit 1
  fi

  echo "=== Push $file ==="
  echo ""

  # Parse .env file properly handling multiline values
  # Uses a state machine to track when we're inside a multiline quoted value
  local key=""
  local value=""
  local in_multiline=false

  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$in_multiline" == "true" ]]; then
      # We're continuing a multiline value
      value+=$'\n'"$line"
      # Check if this line ends the multiline (ends with closing quote)
      if [[ "$line" == *'"' ]] && [[ "$line" != *'\"' ]]; then
        # Remove trailing quote
        value="${value%\"}"
        in_multiline=false
        # Now set the value
        set_single_env "$key" "$value" "$cli_args"
        key=""
        value=""
      fi
      continue
    fi

    # Skip comments and empty lines
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue

    # Extract key and value
    key="${line%%=*}"
    value="${line#*=}"

    # Check if value starts with quote but doesn't end with one (multiline)
    if [[ "$value" == '"'* ]] && [[ "$value" != *'"' || "$value" == '""' ]]; then
      # Check if it's not a single-line quoted value
      local temp_value="${value#\"}"
      if [[ "$temp_value" != *'"' ]]; then
        # Multiline value starts
        in_multiline=true
        value="${value#\"}"  # Remove leading quote
        continue
      fi
    fi

    # Single-line value - remove surrounding quotes if present
    if [[ "$value" == '"'*'"' ]]; then
      value="${value#\"}"
      value="${value%\"}"
    elif [[ "$value" == "'"*"'" ]]; then
      value="${value#\'}"
      value="${value%\'}"
    fi

    # Unescape internal quotes
    value=$(echo "$value" | sed 's/\\"/"/g')

    set_single_env "$key" "$value" "$cli_args"
    key=""
    value=""
  done < "$file"
}

set_single_env() {
  local key="$1"
  local value="$2"
  local cli_args="$3"

  if [[ "$DRY_RUN" == "true" ]]; then
    if is_multiline "$value"; then
      echo "[dry-run] npx convex env $cli_args set -- \"$key\" <multiline value>"
    else
      echo "[dry-run] npx convex env $cli_args set \"$key\" <value>"
    fi
    return
  fi

  echo "Setting $key..."

  # For values starting with - (like PEM keys), use -- to stop option parsing
  # This also works for multiline values
  if [[ "$value" == -* ]] || is_multiline "$value"; then
    npx convex env $cli_args set -- "$key" "$value" 2>/dev/null || {
      echo "  Warning: Failed to set $key"
    }
  else
    # Use CLI for simple values
    npx convex env $cli_args set "$key" "$value" 2>/dev/null || {
      echo "  Warning: Failed to set $key"
    }
  fi
}

case "$ENV_TARGET" in
  development|dev)
    push_env_file ".env.convex.development" ""
    ;;
  production|prod)
    push_env_file ".env.convex.production" "--env-file .env.convex-cli.production"
    ;;
  preview)
    preview_name="${PREVIEW_NAME:-preview}"
    # Check dev/prod have overrides before pushing preview vars
    check_dev_prod_overrides ".env.convex.preview"
    push_env_file ".env.convex.preview" "--env-file .env.convex-cli.preview --preview-name $preview_name"
    echo ""
    echo "📋 Remember: Set these as Project Defaults in Convex Dashboard"
    echo "   (CLI can only push to specific preview, not defaults)"
    ;;
  *)
    echo "Usage: $0 <development|production|preview> [preview-name] [--dry-run]"
    echo ""
    echo "Examples:"
    echo "  $0 development              # Push .env.convex.development to dev deployment"
    echo "  $0 production               # Push .env.convex.production to prod deployment"
    echo "  $0 preview                  # Push .env.convex.preview to preview deployment"
    echo "  $0 preview v1.0.0           # Push .env.convex.preview to v1.0.0 preview"
    echo "  $0 development --dry-run    # Show what would be pushed"
    echo ""
    echo "WARNING: This will overwrite existing values in Convex!"
    echo ""
    echo "NOTE: Multiline values (like JWT_PRIVATE_KEY) require the -- flag"
    echo "      to prevent CLI from interpreting ----- as options."
    exit 1
    ;;
esac

echo ""
echo "Done!"
