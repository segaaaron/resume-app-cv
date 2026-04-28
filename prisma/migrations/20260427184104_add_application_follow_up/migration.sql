-- Add followUpAt to Application for reminder scheduling
ALTER TABLE "Application" ADD COLUMN "followUpAt" TIMESTAMP(3);
ALTER TABLE "Application" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

CREATE INDEX "Application_followUpAt_idx" ON "Application"("followUpAt");
