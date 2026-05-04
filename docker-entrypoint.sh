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
set +e
DEPLOY_OUTPUT=$(DATABASE_URL="$DATABASE_URL" node node_modules/prisma/build/index.js migrate deploy 2>&1)
DEPLOY_EXIT=$?
set -e

if echo "$DEPLOY_OUTPUT" | grep -q "P3005"; then
  echo "▶ Database not baselined — marking all existing migrations as applied..."
  for migration_dir in prisma/migrations/*/; do
    [ -d "$migration_dir" ] || continue
    migration_name=$(basename "$migration_dir")
    DATABASE_URL="$DATABASE_URL" node node_modules/prisma/build/index.js migrate resolve --applied "$migration_name" 2>&1 || true
  done
  echo "▶ Baseline complete — re-running migrate deploy..."
  DATABASE_URL="$DATABASE_URL" node node_modules/prisma/build/index.js migrate deploy
elif [ $DEPLOY_EXIT -ne 0 ]; then
  echo "$DEPLOY_OUTPUT"
  exit $DEPLOY_EXIT
else
  echo "$DEPLOY_OUTPUT"
fi

echo "▶ Starting Next.js..."
exec node server.js
