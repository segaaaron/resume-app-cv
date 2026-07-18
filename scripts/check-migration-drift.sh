#!/usr/bin/env bash
#
# Migration drift guard.
# Fails if prisma/schema.prisma changed in this change-set without a matching
# migration file being added under prisma/migrations/. This catches the classic
# mistake — editing the schema (e.g. adding an enum value) and forgetting to run
# `prisma migrate dev` — which is what caused the LIMITED enum drift that 500'd
# the expire-subscriptions cron in production.
#
# The project's migrations are baselined (not self-contained), so a replay-based
# `prisma migrate diff` cannot run; this git-level check is the reliable guard.
#
# Usage:
#   CI: driven by env (EVENT_NAME / BASE_SHA / HEAD_SHA / PUSH_BEFORE / PUSH_AFTER)
#   Local: `bash scripts/check-migration-drift.sh`  (diffs HEAD~1..HEAD)
set -euo pipefail

SCHEMA="prisma/schema.prisma"
MIGRATION_RE='^prisma/migrations/.+/migration\.sql$'

resolve_range() {
  local base head
  if [ "${EVENT_NAME:-}" = "pull_request" ]; then
    base="${BASE_SHA:-}"
    head="${HEAD_SHA:-HEAD}"
  elif [ -n "${PUSH_AFTER:-}" ]; then
    base="${PUSH_BEFORE:-}"
    head="${PUSH_AFTER}"
  else
    # local default
    base="$(git rev-parse HEAD~1 2>/dev/null || echo '')"
    head="HEAD"
  fi
  # Guard against an empty / all-zero / unreachable base (first push, shallow clone)
  if [ -z "$base" ] || [ "$base" = "0000000000000000000000000000000000000000" ] || ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
    base="$(git rev-parse "${head}~1" 2>/dev/null || echo "$head")"
  fi
  echo "$base" "$head"
}

read -r BASE HEAD <<<"$(resolve_range)"
echo "Diffing ${BASE}..${HEAD}"

CHANGED="$(git diff --name-only "$BASE" "$HEAD")"

if echo "$CHANGED" | grep -qx "$SCHEMA"; then
  if echo "$CHANGED" | grep -qE "$MIGRATION_RE"; then
    echo "✔ schema.prisma changed and a migration file is included."
  else
    echo "✖ schema.prisma changed but NO migration file was added."
    echo "  Generate one before merging:  npx prisma migrate dev --name <describe_change>"
    echo "  (This prevents schema/DB drift like the LIMITED enum that broke the cron.)"
    exit 1
  fi
else
  echo "✔ No schema.prisma change — nothing to check."
fi
