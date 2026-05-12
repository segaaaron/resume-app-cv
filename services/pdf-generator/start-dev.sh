#!/bin/bash
# Local dev script for pdf-generator microservice
# Reads PDF_SERVICE_SECRET from ../../.env.local automatically

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_LOCAL="$SCRIPT_DIR/../../.env.local"

# Load .env.local if it exists
if [ -f "$ENV_LOCAL" ]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    # Only export if not already set in environment
    key="$(echo "$key" | xargs)"
    value="$(echo "$value" | xargs)"
    [[ -z "${!key}" ]] && export "$key=$value"
  done < "$ENV_LOCAL"
fi

export PUPPETEER_EXECUTABLE_PATH="${PUPPETEER_EXECUTABLE_PATH:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
export PORT="${PORT:-3001}"
export MAX_CONCURRENT_PAGES="${MAX_CONCURRENT_PAGES:-2}"

if [ -z "$PDF_SERVICE_SECRET" ]; then
  echo "[pdf-generator] ERROR: PDF_SERVICE_SECRET not found in .env.local or environment"
  exit 1
fi

echo "[pdf-generator] Starting on port $PORT"
echo "[pdf-generator] Chrome: $PUPPETEER_EXECUTABLE_PATH"
echo "[pdf-generator] Secret: ${PDF_SERVICE_SECRET:0:8}..."

cd "$SCRIPT_DIR"
npx ts-node src/index.ts
