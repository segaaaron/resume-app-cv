-- Track highest referral reward tier achieved (0=none, 1=30%, 2=50%, 3=free month)
ALTER TABLE "User" ADD COLUMN "referralRewardTier" INTEGER NOT NULL DEFAULT 0;

