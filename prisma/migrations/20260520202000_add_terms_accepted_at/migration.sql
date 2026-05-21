-- Add termsAcceptedAt to User
-- Backfill existing users so they are not interrupted by the new terms flow
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
UPDATE "User" SET "termsAcceptedAt" = NOW() WHERE "termsAcceptedAt" IS NULL;
