-- WebhookStatus enum for StripeWebhookLog.status
CREATE TYPE "WebhookStatus" AS ENUM ('SUCCESS', 'FAILED', 'SKIPPED');

-- StripeWebhookLog: durable observability log for every Stripe webhook (success + failure).
-- Separate from StripeEvent (idempotency) — powers the admin "Stripe Health" panel.
CREATE TABLE "StripeWebhookLog" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "WebhookStatus" NOT NULL,
    "errorMessage" TEXT,
    "errorFingerprint" TEXT,
    "latencyMs" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "objectId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeWebhookLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StripeWebhookLog_stripeEventId_key" ON "StripeWebhookLog"("stripeEventId");
CREATE INDEX "StripeWebhookLog_type_createdAt_idx" ON "StripeWebhookLog"("type", "createdAt");
CREATE INDEX "StripeWebhookLog_status_createdAt_idx" ON "StripeWebhookLog"("status", "createdAt");
CREATE INDEX "StripeWebhookLog_createdAt_idx" ON "StripeWebhookLog"("createdAt");

-- Composite index for the admin billing-timeline query: WHERE action IN (...) ORDER BY createdAt.
-- AuditLog is high-write; billing actions are a small subset, so this keeps the timeline scan index-ordered at scale.
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
