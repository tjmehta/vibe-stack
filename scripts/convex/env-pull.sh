#!/bin/bash
# Pull Convex environment variables to local .env files
# Usage: ./scripts/convex/env-pull.sh [development|production|preview|all] [--dry-run]
#
# --dry-run: Fetches from cloud and prints output, but doesn't write to file

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

ENV_TARGET="${ENV_TARGET:-all}"

# Format env vars for .env file, handling multiline values
# convex env list outputs KEY=value where value can span multiple lines
# We need to detect multiline values and quote them properly
format_env_output() {
  local current_key=""
  local current_value=""
  local in_value=false

  while IFS= read -r line || [[ -n "$line" ]]; do
    # Check if this line starts a new KEY=value pair
    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      # Output previous key-value if we had one
      if [[ -n "$current_key" ]]; then
        output_env_var "$current_key" "$current_value"
      fi
      # Start new key-value
      current_key="${line%%=*}"
      current_value="${line#*=}"
      in_value=true
    elif [[ "$in_value" == "true" ]]; then
      # This is a continuation of a multiline value
      current_value+=$'\n'"$line"
    fi
  done

  # Output the last key-value
  if [[ -n "$current_key" ]]; then
    output_env_var "$current_key" "$current_value"
  fi
}

# Output a single env var in proper format
output_env_var() {
  local key="$1"
  local value="$2"

  # Check if value contains newlines (multiline)
  if [[ "$value" == *$'\n'* ]]; then
    # Multiline value - output with quotes, preserve newlines
    echo "$key=\"$value\""
  elif [[ "$value" == "{"* ]] || [[ "$value" == "["* ]]; then
    # JSON value - use single quotes to avoid escaping issues
    echo "$key='$value'"
  else
    # Simple value - just quote it
    local escaped_value=$(echo "$value" | sed 's/"/\\"/g')
    echo "$key=\"$escaped_value\""
  fi
}

pull_convex_env() {
  local name="$1"
  local cmd="$2"
  local output="$3"

  echo "=== Convex $name ==="
  echo "Command: $cmd"
  echo ""

  if [[ "$DRY_RUN" == "true" ]]; then
    # Fetch and print to stdout, don't write file
    echo "# Convex $name Environment Variables"
    echo "# Would write to: $output"
    echo ""
    eval "$cmd" 2>/dev/null | format_env_output
  else
    {
      echo "# Convex $name Environment Variables"
      echo "# Pulled from Convex dashboard - DO NOT COMMIT"
      echo ""
      eval "$cmd" 2>/dev/null | format_env_output
    } > "$output"
    echo "Created $output"
  fi
  echo ""
}

pull_development() {
  pull_convex_env "Development" \
    "npx convex env list" \
    ".env.convex.development"
}

pull_production() {
  pull_convex_env "Production" \
    "npx convex env list --env-file .env.convex-cli.production" \
    ".env.convex.production"
}

pull_preview() {
  local preview_name="${1:-preview}"
  pull_convex_env "Preview ($preview_name)" \
    "npx convex env list --env-file .env.convex-cli.preview --preview-name $preview_name" \
    ".env.convex.preview"
}

case "$ENV_TARGET" in
  development|dev)
    pull_development
    ;;
  production|prod)
    pull_production
    ;;
  preview)
    pull_preview "${PREVIEW_NAME:-preview}"
    ;;
  all)
    pull_development
    pull_production
    pull_preview
    ;;
  *)
    echo "Usage: $0 [development|production|preview|all] [--dry-run]"
    echo "  preview accepts optional branch name: $0 preview v1.0.0"
    exit 1
    ;;
esac

echo "Done!"
