-- Backfill: ensure managed columns exist in PROD (may have been baselined without running)
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "isManaged"            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "managedExpiresAt"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "managedDownloadLimit" INTEGER,
  ADD COLUMN IF NOT EXISTS "managedDownloadsUsed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "managedCreatedBy"     TEXT,
  ADD COLUMN IF NOT EXISTS "managedNote"          TEXT,
  ADD COLUMN IF NOT EXISTS "managedBlocked"       BOOLEAN NOT NULL DEFAULT false;
