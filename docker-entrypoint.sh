#!/bin/sh
set -e

echo "▶ Running Prisma db push..."
DATABASE_URL="$DATABASE_URL" node node_modules/prisma/build/index.js db push --accept-data-loss

echo "▶ Creating admin user..."
DATABASE_URL="$DATABASE_URL" node prisma/create-admin.js

echo "▶ Starting Next.js..."
exec node server.js
