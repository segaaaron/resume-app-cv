-- Migration: rename_plan_enum_to_unsubscribed
-- Created: 2026-05-04 13:48:32

-- Rename FREE → UNSUBSCRIBED and remove TRIAL from Plan enum
-- PostgreSQL requires recreating the enum to remove values.
-- UNSUBSCRIBED may already exist if a previous partial run added it.

-- Step 1: Add UNSUBSCRIBED only if it doesn't exist yet
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'Plan' AND e.enumlabel = 'UNSUBSCRIBED') THEN
    EXECUTE 'ALTER TYPE "Plan" ADD VALUE ''UNSUBSCRIBED''';
  END IF;
END $$;

-- Step 2: Migrate existing rows
UPDATE "User" SET plan = 'UNSUBSCRIBED' WHERE plan IN ('FREE', 'TRIAL');

-- Step 3: Drop column default before type change
ALTER TABLE "User" ALTER COLUMN plan DROP DEFAULT;

-- Step 4: Recreate enum with only desired values
ALTER TYPE "Plan" RENAME TO "Plan_old";
CREATE TYPE "Plan" AS ENUM ('UNSUBSCRIBED', 'PRO');
ALTER TABLE "User" ALTER COLUMN plan TYPE "Plan" USING plan::text::"Plan";
DROP TYPE "Plan_old";

-- Step 5: Restore column default with new enum
ALTER TABLE "User" ALTER COLUMN plan SET DEFAULT 'UNSUBSCRIBED';

