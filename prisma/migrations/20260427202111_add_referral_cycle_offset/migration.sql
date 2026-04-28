-- Tracks how many paid referrals existed at the start of the current reward cycle
-- Used to compute cycleCount = totalPaidReferrals - referralCycleOffset
ALTER TABLE "User" ADD COLUMN "referralCycleOffset" INTEGER NOT NULL DEFAULT 0;

