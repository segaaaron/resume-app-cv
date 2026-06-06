-- CreateIndex: composite (userId, processedAt) on StripeEvent for per-user event history queries
CREATE INDEX IF NOT EXISTS "StripeEvent_userId_processedAt_idx" ON "StripeEvent"("userId", "processedAt");

-- CreateIndex: composite (userId, acceptedAt) on ConsentLog for per-user consent history queries
CREATE INDEX IF NOT EXISTS "ConsentLog_userId_acceptedAt_idx" ON "ConsentLog"("userId", "acceptedAt");
