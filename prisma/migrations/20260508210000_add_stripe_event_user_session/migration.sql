-- Add optional analytics columns to StripeEvent for debugging post-purchase race conditions
ALTER TABLE "StripeEvent" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "StripeEvent" ADD COLUMN IF NOT EXISTS "checkoutSessionId" TEXT;

CREATE INDEX IF NOT EXISTS "StripeEvent_userId_idx" ON "StripeEvent"("userId");
