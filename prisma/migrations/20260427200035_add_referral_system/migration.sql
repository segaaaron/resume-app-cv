-- Add referral system fields to User
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN "referredBy" TEXT;

-- Unique constraint on referralCode
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- Index for looking up who referred whom
CREATE INDEX "User_referredBy_idx" ON "User"("referredBy");

-- Foreign key: referredBy → User.id
ALTER TABLE "User" ADD CONSTRAINT "User_referredBy_fkey"
  FOREIGN KEY ("referredBy") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

