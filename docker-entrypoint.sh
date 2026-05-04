#!/bin/sh
set -e

echo "▶ Validating environment..."
for var in DATABASE_URL AUTH_SECRET NEXTAUTH_URL NEXT_PUBLIC_APP_URL; do
  eval val=\$$var
  if [ -z "$val" ]; then
    echo "✖ Missing required environment variable: $var"
    exit 1
  fi
done
echo "✔ Environment OK"

echo "▶ Running Prisma migrate deploy..."
DATABASE_URL="$DATABASE_URL" node node_modules/prisma/build/index.js migrate deploy

echo "▶ Starting Next.js..."
exec node server.js
