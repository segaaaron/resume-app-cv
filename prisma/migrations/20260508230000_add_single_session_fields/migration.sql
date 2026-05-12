-- Single Active Session fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "activeSessionToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionChallengeCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionChallengeExp" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionChallengeAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionChallengeBlockedUntil" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "User_activeSessionToken_key" ON "User"("activeSessionToken");
