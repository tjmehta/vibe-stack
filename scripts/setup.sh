#!/bin/bash

# Vibe Stack Setup
# Connects your app to Convex for database, auth, and real-time sync

set -e

echo ""
echo "Vibe Stack Setup"
echo "================"
echo ""

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
  echo "pnpm not found. Installing..."
  npm install -g pnpm
fi

# Install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  pnpm install
  echo ""
fi

# Connect to Convex
echo "Connecting to Convex..."
echo ""
echo "This will:"
echo "  1. Open your browser to sign in with GitHub"
echo "  2. Create a new Convex project"
echo "  3. Generate .env.local with your backend URL"
echo ""
npx convex dev --once --configure

echo ""

# Generate AUTH_SECRET
if [ -f ".env.local" ] && ! grep -q "AUTH_SECRET=" .env.local 2>/dev/null; then
  echo ""
  echo "Generating AUTH_SECRET..."
  AUTH_SECRET=$(openssl rand -base64 32)
  echo "AUTH_SECRET=$AUTH_SECRET" >> .env.local
  echo "Added AUTH_SECRET to .env.local"
fi

echo ""
echo "Setup complete!"
echo ""
echo "Start developing:"
echo ""
echo "  Terminal 1:  pnpm dev"
echo "  Terminal 2:  npx convex dev"
echo ""
echo "Then open http://localhost:3000"
echo ""
echo "---"
echo ""
echo "Optional next steps:"
echo ""
echo "  Stripe:  Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to .env.local"
echo "  Vercel:  Push to GitHub, import at vercel.com/new"
echo ""
echo "See README.md for details."
echo ""
