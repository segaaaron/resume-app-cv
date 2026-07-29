-- PaypalWebhookLog: durable observability log for every PayPal webhook (success + failure).
-- Exact mirror of StripeWebhookLog. Separate from PaypalEvent (idempotency) — powers the
-- admin "PayPal Health" panel. Reuses the existing "WebhookStatus" enum.
CREATE TABLE "PaypalWebhookLog" (
    "id" TEXT NOT NULL,
    "paypalEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "WebhookStatus" NOT NULL,
    "errorMessage" TEXT,
    "latencyMs" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "objectId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaypalWebhookLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaypalWebhookLog_paypalEventId_key" ON "PaypalWebhookLog"("paypalEventId");
CREATE INDEX "PaypalWebhookLog_type_createdAt_idx" ON "PaypalWebhookLog"("type", "createdAt");
CREATE INDEX "PaypalWebhookLog_status_createdAt_idx" ON "PaypalWebhookLog"("status", "createdAt");
CREATE INDEX "PaypalWebhookLog_createdAt_idx" ON "PaypalWebhookLog"("createdAt");
