-- Migration: add_performance_indexes
-- Created: 2026-05-19 22:07:07

CREATE INDEX IF NOT EXISTS "User_plan_subscriptionStatus_subscriptionEndsAt_idx"
ON "User"("plan", "subscriptionStatus", "subscriptionEndsAt");

CREATE INDEX IF NOT EXISTS "User_subscriptionStatus_idx"
ON "User"("subscriptionStatus");

CREATE INDEX IF NOT EXISTS "ReferralConversion_referrerId_idx"
ON "ReferralConversion"("referrerId");

CREATE INDEX IF NOT EXISTS "ReferralConversion_referredId_idx"
ON "ReferralConversion"("referredId");

CREATE INDEX IF NOT EXISTS "AIUsageLog_userId_createdAt_idx"
ON "AIUsageLog"("userId", "createdAt");
