import { describe, it, expect } from "vitest"
import { interpretEvent, type PlanIdMap } from "@/lib/services/paypal/event-interpreter"

const PLANS: PlanIdMap = { monthly: "P-MONTHLY", annual: "P-ANNUAL" }

const ev = (event_type: string, resource: Record<string, unknown>) => ({ id: "WH-x", event_type, resource })

describe("paypal event interpreter · subscriptions", () => {
  it("ACTIVATED → provision-pro with interval from plan_id + custom_id userId", () => {
    const a = interpretEvent(
      ev("BILLING.SUBSCRIPTION.ACTIVATED", {
        id: "I-SUB1",
        custom_id: "user-123",
        plan_id: "P-ANNUAL",
        billing_info: { next_billing_time: "2027-07-24T00:00:00Z" },
      }),
      PLANS,
    )
    expect(a).toEqual({
      kind: "provision-pro",
      userId: "user-123",
      subscriptionId: "I-SUB1",
      interval: "annual",
      endsAt: "2027-07-24T00:00:00Z",
    })
  })

  it("unknown plan_id → interval null (still provisions, interval unknown)", () => {
    const a = interpretEvent(ev("BILLING.SUBSCRIPTION.ACTIVATED", { id: "I-1", plan_id: "P-XXX" }), PLANS)
    expect(a).toMatchObject({ kind: "provision-pro", interval: null })
  })

  it("PAYMENT.SALE.COMPLETED with billing_agreement_id → renew-pro", () => {
    const a = interpretEvent(ev("PAYMENT.SALE.COMPLETED", { billing_agreement_id: "I-SUB1" }), PLANS)
    expect(a).toEqual({ kind: "renew-pro", subscriptionId: "I-SUB1" })
  })

  it("PAYMENT.SALE.COMPLETED WITHOUT billing_agreement_id → ignore (not a subscription sale)", () => {
    const a = interpretEvent(ev("PAYMENT.SALE.COMPLETED", { id: "SALE-1" }), PLANS)
    expect(a).toMatchObject({ kind: "ignore" })
  })

  it("CANCELLED / SUSPENDED / PAYMENT.FAILED / EXPIRED map to the right kinds", () => {
    expect(interpretEvent(ev("BILLING.SUBSCRIPTION.CANCELLED", { id: "I-1" }), PLANS).kind).toBe("cancel-pro")
    expect(interpretEvent(ev("BILLING.SUBSCRIPTION.SUSPENDED", { id: "I-1" }), PLANS).kind).toBe("suspend-pro")
    expect(interpretEvent(ev("BILLING.SUBSCRIPTION.PAYMENT.FAILED", { id: "I-1" }), PLANS).kind).toBe("payment-failed")
    expect(interpretEvent(ev("BILLING.SUBSCRIPTION.EXPIRED", { id: "I-1" }), PLANS).kind).toBe("expire-pro")
  })
})

describe("paypal event interpreter · one-time (BASIC/SPRINT)", () => {
  it("CAPTURE.COMPLETED with custom_id '<user>|BASIC' → provision-onetime BASIC", () => {
    const a = interpretEvent(ev("PAYMENT.CAPTURE.COMPLETED", { id: "CAP-1", custom_id: "user-9|BASIC" }), PLANS)
    expect(a).toEqual({ kind: "provision-onetime", userId: "user-9", plan: "BASIC", orderId: "CAP-1" })
  })

  it("CAPTURE.COMPLETED '<user>|SPRINT' → provision-onetime SPRINT", () => {
    const a = interpretEvent(ev("PAYMENT.CAPTURE.COMPLETED", { id: "CAP-2", custom_id: "user-9|SPRINT" }), PLANS)
    expect(a).toMatchObject({ kind: "provision-onetime", plan: "SPRINT" })
  })

  it("CAPTURE.COMPLETED without a valid custom_id → ignore (can't map)", () => {
    expect(interpretEvent(ev("PAYMENT.CAPTURE.COMPLETED", { id: "CAP-3" }), PLANS).kind).toBe("ignore")
    expect(interpretEvent(ev("PAYMENT.CAPTURE.COMPLETED", { id: "CAP-4", custom_id: "user-9" }), PLANS).kind).toBe("ignore")
  })
})

describe("paypal event interpreter · refunds & noise", () => {
  it("SALE.REFUNDED → refund by subscription, scoped to the subscription only", () => {
    // A SALE is a RECURRING charge. Its refund must not reach a BASIC/SPRINT window the
    // user bought separately and nobody refunded — the scope carries that decision to
    // revokeAccess().
    expect(interpretEvent(ev("PAYMENT.SALE.REFUNDED", { billing_agreement_id: "I-1" }), PLANS)).toEqual({
      kind: "refund",
      subscriptionId: "I-1",
      scope: "subscription",
    })
  })
  it("CAPTURE.REFUNDED → refund by userId parsed from custom_id (resource.id is the refund's own id, never the stored order id)", () => {
    // A CAPTURE *is* the one-time purchase, so the paid window goes back with the money.
    expect(interpretEvent(ev("PAYMENT.CAPTURE.REFUNDED", { id: "RE-1", custom_id: "u1|BASIC" }), PLANS)).toEqual({
      kind: "refund",
      userId: "u1",
      scope: "everything",
    })
  })
  it("unhandled event type → ignore with reason", () => {
    const a = interpretEvent(ev("PAYMENT.PAYOUTS.ITEM.SUCCEEDED", { id: "PO-1" }), PLANS)
    expect(a).toMatchObject({ kind: "ignore", reason: "unhandled:PAYMENT.PAYOUTS.ITEM.SUCCEEDED" })
  })
  it("garbage input → ignore, never throws", () => {
    expect(interpretEvent(null, PLANS).kind).toBe("ignore")
    expect(interpretEvent({ event_type: "X" }, PLANS).kind).toBe("ignore")
  })
})

describe("paypal event interpreter · chargebacks", () => {
  // A reversal takes the money back exactly like a refund does, so it must revoke the
  // same access. Stripe has charge.dispute.created for this; PayPal had no mapping at
  // all, so a customer could charge back and keep PRO for as long as they liked.
  it("SALE.REVERSED → same revocation as SALE.REFUNDED (subscription scope)", () => {
    expect(interpretEvent(ev("PAYMENT.SALE.REVERSED", { billing_agreement_id: "I-1" }), PLANS)).toEqual({
      kind: "refund",
      subscriptionId: "I-1",
      scope: "subscription",
    })
  })

  it("CAPTURE.REVERSED → same revocation as CAPTURE.REFUNDED (window goes back)", () => {
    expect(interpretEvent(ev("PAYMENT.CAPTURE.REVERSED", { id: "RE-2", custom_id: "u1|SPRINT" }), PLANS)).toEqual({
      kind: "refund",
      userId: "u1",
      scope: "everything",
    })
  })

  it("CAPTURE.DENIED stays ignored — nothing was ever collected to revoke", () => {
    expect(interpretEvent(ev("PAYMENT.CAPTURE.DENIED", { id: "CAP-X", custom_id: "u1|BASIC" }), PLANS))
      .toMatchObject({ kind: "ignore" })
  })
})
