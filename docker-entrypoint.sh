#!/bin/sh
set -e

echo "▶ Running Prisma db push..."
DATABASE_URL="$DATABASE_URL" node node_modules/prisma/build/index.js db push --accept-data-loss

echo "▶ Starting Next.js..."
exec node server.js
