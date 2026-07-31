-- Admin-configurable per-user caps for LIMITED (managed) accounts: how many
-- resumes and cover letters they may create. Additive, nullable. NULL means
-- "use the LIMITED default (5)", enforced in code (lib/plans.ts). Mirrors
-- managedDownloadLimit. No effect on BASIC/SPRINT/PRO/UNSUBSCRIBED.
ALTER TABLE "User" ADD COLUMN "managedResumeLimit" INTEGER;
ALTER TABLE "User" ADD COLUMN "managedCoverLetterLimit" INTEGER;
