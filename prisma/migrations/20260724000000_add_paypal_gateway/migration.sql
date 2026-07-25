-- PayPal as a second payment gateway alongside Stripe. Fully ADDITIVE and
-- backward-compatible: new nullable columns, a new enum, and a new dedup table.
-- Existing rows default paymentProvider to STRIPE (they were provisioned by Stripe).
-- The internal plan state (plan/subscriptionStatus/subscriptionEndsAt) is unchanged
-- and stays gateway-agnostic — PayPal writes the same fields Stripe does.

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL');

-- AlterTable: PayPal-specific IDs never overload the Stripe columns (separate IDs,
-- shared internal state).
ALTER TABLE "User" ADD COLUMN "paymentProvider" "PaymentProvider" DEFAULT 'STRIPE';
ALTER TABLE "User" ADD COLUMN "paypalSubscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN "paypalPlanId" TEXT;
ALTER TABLE "User" ADD COLUMN "paypalOrderId" TEXT;

-- Unique guarantees one user per PayPal subscription (mirror of subscriptionId).
-- Postgres treats NULLs as distinct, so unpaid/Stripe users (NULL) coexist freely.
CREATE UNIQUE INDEX "User_paypalSubscriptionId_key" ON "User"("paypalSubscriptionId");

-- PaypalEvent: idempotency/dedup mirror of StripeEvent. PayPal delivers events out
-- of order, duplicated, and late — each event id is processed exactly once.
CREATE TABLE "PaypalEvent" (
    "id" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "resourceId" TEXT,

    CONSTRAINT "PaypalEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaypalEvent_processedAt_idx" ON "PaypalEvent"("processedAt");
CREATE INDEX "PaypalEvent_userId_idx" ON "PaypalEvent"("userId");
