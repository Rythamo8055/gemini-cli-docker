#!/bin/bash
# setup-auth.sh - Authenticate Gemini CLI locally, then copy tokens for Docker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CREDENTIALS_DIR="$SCRIPT_DIR/credentials"

echo "🔐 Gemini CLI Docker Authentication Setup"
echo "==========================================="
echo ""

# Create credentials directory
mkdir -p "$CREDENTIALS_DIR/.gemini"

# Check if already authenticated
if [ -f "$HOME/.gemini/oauth_creds.json" ] || [ -f "$HOME/.gemini/settings.json" ]; then
    echo "✅ Found existing Gemini credentials in ~/.gemini/"
    echo ""
    read -p "Copy existing credentials to Docker? (y/n): " copy_existing
    
    if [ "$copy_existing" = "y" ]; then
        cp -r "$HOME/.gemini/"* "$CREDENTIALS_DIR/.gemini/"
        echo "✅ Credentials copied to $CREDENTIALS_DIR/.gemini/"
    fi
else
    echo "⚠️  No existing Gemini credentials found."
    echo ""
    echo "Please authenticate first by running:"
    echo "  npx @google/gemini-cli"
    echo ""
    echo "After authenticating in your browser, run this script again."
    exit 1
fi

echo ""
echo "==========================================="
echo "📋 NEXT STEPS:"
echo "==========================================="
echo ""
echo "Option 1: Use OAuth (Your Google Pro subscription)"
echo "  docker compose up gemini-cli"
echo ""
echo "Option 2: Use API Key"
echo "  export GEMINI_API_KEY='your-api-key'"
echo "  docker compose up gemini-cli"
echo ""
echo "Option 3: Use Service Account"
echo "  1. Create service account at GCP Console"
echo "  2. Download JSON key to: $CREDENTIALS_DIR/service-account.json"
echo "  3. docker compose up gemini-cli"
echo ""
echo "==========================================="
echo "🚀 Ready to deploy to cloud!"
echo "==========================================="
