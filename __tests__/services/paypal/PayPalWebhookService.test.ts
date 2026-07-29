import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ILogger } from "@/lib/interfaces/ILogger"

// --- Mocks --------------------------------------------------------------
vi.mock("@/lib/paypal", () => ({
  paypalConfig: () => ({ clientId: "c", secret: "s", webhookId: "WH-1", planIdMonthly: "P-M", planIdAnnual: "P-A" }),
  paypalApiBase: () => "https://api-m.sandbox.paypal.com",
}))
vi.mock("@/lib/auth", () => ({ purgeUserCache: vi.fn() }))

const verifyWebhookOffline = vi.fn()
const readWebhookHeaders = vi.fn()
vi.mock("@/lib/services/paypal/verify-webhook", () => ({
  verifyWebhookOffline: (...a: unknown[]) => verifyWebhookOffline(...a),
  readWebhookHeaders: (...a: unknown[]) => readWebhookHeaders(...a),
}))

// Mock db: $transaction invokes the callback with a controllable tx; the
// standalone paypalEvent.create is used by the ignore/skip paths.
const txState: {
  claimThrows: boolean
  user: { id: string; isManaged: boolean; plan?: string; subscriptionEndsAt?: Date | null } | null
  updateSpy: ReturnType<typeof vi.fn>
} = { claimThrows: false, user: { id: "u1", isManaged: false }, updateSpy: vi.fn() }

const webhookLogUpsert = vi.fn().mockResolvedValue({})

vi.mock("@/lib/db", () => ({
  db: {
    paypalEvent: { create: vi.fn().mockResolvedValue({}) },
    paypalWebhookLog: { upsert: (...a: unknown[]) => webhookLogUpsert(...a) },
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => {
      const tx = {
        paypalEvent: {
          create: vi.fn(async () => {
            if (txState.claimThrows) throw { code: "P2002" }
            return {}
          }),
        },
        user: {
          findUnique: vi.fn(async () => txState.user),
          findFirst: vi.fn(async () => txState.user),
          update: txState.updateSpy,
        },
      }
      return cb(tx)
    }),
  },
}))

import { PayPalWebhookService } from "@/lib/services/paypal/PayPalWebhookService"

const logger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const makeClient = (getSubscription: unknown) => ({ getSubscription }) as never
const headers = new Headers()

beforeEach(() => {
  vi.clearAllMocks()
  txState.claimThrows = false
  txState.user = { id: "u1", isManaged: false }
  txState.updateSpy = vi.fn().mockResolvedValue({})
  readWebhookHeaders.mockReturnValue({ transmissionId: "t", transmissionTime: "x", transmissionSig: "s", certUrl: "https://api.paypal.com/c", authAlgo: "SHA256withRSA" })
  verifyWebhookOffline.mockResolvedValue(true)
})

const activatedBody = JSON.stringify({
  id: "WH-EVT-1",
  event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
  resource: { id: "I-SUB1", custom_id: "u1", plan_id: "P-A", billing_info: { next_billing_time: "2027-01-01T00:00:00Z" } },
})

describe("PayPalWebhookService — signature & payload (no silent errors)", () => {
  it("bad signature → throws invalid_signature 400, never provisions", async () => {
    verifyWebhookOffline.mockResolvedValue(false)
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await expect(svc.handleEvent(activatedBody, headers)).rejects.toMatchObject({ code: "invalid_signature", status: 400 })
    expect(txState.updateSpy).not.toHaveBeenCalled()
  })

  it("missing headers → throws invalid_signature 400", async () => {
    readWebhookHeaders.mockReturnValue(null)
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await expect(svc.handleEvent(activatedBody, headers)).rejects.toMatchObject({ code: "invalid_signature" })
  })

  it("malformed JSON body → throws invalid_payload (not a silent success)", async () => {
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await expect(svc.handleEvent("not-json", headers)).rejects.toMatchObject({ code: "invalid_payload" })
  })
})

describe("PayPalWebhookService — provisioning", () => {
  it("ACTIVATED + re-fetch ACTIVE → provisions PRO", async () => {
    const getSub = vi.fn().mockResolvedValue({ status: "ACTIVE", billing_info: { next_billing_time: "2027-01-01T00:00:00Z" } })
    const svc = new PayPalWebhookService(makeClient(getSub), logger)
    await svc.handleEvent(activatedBody, headers)
    expect(getSub).toHaveBeenCalledWith("I-SUB1")
    expect(txState.updateSpy).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ plan: "PRO", subscriptionStatus: "ACTIVE", paymentProvider: "PAYPAL" }) }))
  })

  it("ACTIVATED + re-fetch NOT active → THROWS (never silently skips the grant)", async () => {
    const getSub = vi.fn().mockResolvedValue({ status: "APPROVAL_PENDING" })
    const svc = new PayPalWebhookService(makeClient(getSub), logger)
    await expect(svc.handleEvent(activatedBody, headers)).rejects.toMatchObject({ code: "subscription_not_active" })
    expect(txState.updateSpy).not.toHaveBeenCalled()
  })

  it("re-fetch FAILS → throws refetch_failed 500 (retry, never grant on unverified)", async () => {
    const getSub = vi.fn().mockRejectedValue(new Error("network"))
    const svc = new PayPalWebhookService(makeClient(getSub), logger)
    await expect(svc.handleEvent(activatedBody, headers)).rejects.toMatchObject({ code: "refetch_failed", status: 500 })
  })

  it("duplicate event (claim P2002) → idempotent, no provisioning", async () => {
    txState.claimThrows = true
    const getSub = vi.fn().mockResolvedValue({ status: "ACTIVE" })
    const svc = new PayPalWebhookService(makeClient(getSub), logger)
    await svc.handleEvent(activatedBody, headers)
    expect(txState.updateSpy).not.toHaveBeenCalled()
  })

  it("managed (LIMITED) user → never overwritten", async () => {
    txState.user = { id: "u1", isManaged: true }
    const getSub = vi.fn().mockResolvedValue({ status: "ACTIVE" })
    const svc = new PayPalWebhookService(makeClient(getSub), logger)
    await svc.handleEvent(activatedBody, headers)
    expect(txState.updateSpy).not.toHaveBeenCalled()
  })

  it("EXPIRED → downgrades to UNSUBSCRIBED", async () => {
    const body = JSON.stringify({ id: "WH-2", event_type: "BILLING.SUBSCRIPTION.EXPIRED", resource: { id: "I-SUB1" } })
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await svc.handleEvent(body, headers)
    expect(txState.updateSpy).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED" }) }))
  })

  it("one-time CAPTURE COMPLETED → provisions BASIC (no re-fetch needed)", async () => {
    const body = JSON.stringify({ id: "WH-3", event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: "CAP-1", custom_id: "u1|BASIC" } })
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await svc.handleEvent(body, headers)
    expect(txState.updateSpy).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ plan: "BASIC", paymentProvider: "PAYPAL" }) }))
  })

  it("subscription SALE.REFUNDED → downgrades via billing_agreement_id (confirmed against PayPal's documented Refund resource schema — distinct from resource.id, which is the refund's own id)", async () => {
    const body = JSON.stringify({
      id: "WH-6",
      event_type: "PAYMENT.SALE.REFUNDED",
      resource: { id: "RE-2", billing_agreement_id: "I-SUB1" },
    })
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await svc.handleEvent(body, headers)
    expect(txState.updateSpy).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED" }) }))
  })

  it("one-time CAPTURE REFUNDED → downgrades via custom_id, not the refund's own id", async () => {
    // resource.id here is the REFUND id (RE-1), never the stored paypalOrderId
    // (CAP-1). Only custom_id correctly identifies the user.
    const body = JSON.stringify({
      id: "WH-5",
      event_type: "PAYMENT.CAPTURE.REFUNDED",
      resource: { id: "RE-1", custom_id: "u1|BASIC", links: [{ href: "https://api.paypal.com/v2/payments/captures/CAP-1", rel: "up" }] },
    })
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await svc.handleEvent(body, headers)
    expect(txState.updateSpy).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED" }) }))
  })

  it("unknown event type → resolves, claims, no provisioning (no silent crash)", async () => {
    const body = JSON.stringify({ id: "WH-4", event_type: "PAYMENT.PAYOUTS.ITEM.SUCCEEDED", resource: { id: "PO-1" } })
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await expect(svc.handleEvent(body, headers)).resolves.toBeUndefined()
    expect(txState.updateSpy).not.toHaveBeenCalled()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Paid one-time windows — the two money rules that only ever existed on the
// Stripe side (ad025fa, 9d00b92) and were missing here entirely.
//
// PayPal is not wired in production yet, so none of this ever ran with real money.
// It would have shipped broken on the day the credentials are set.
// ═════════════════════════════════════════════════════════════════════════════

const DAY = 86_400_000

const bodyFor = (id: string, event_type: string, resource: Record<string, unknown>) =>
  JSON.stringify({ id, event_type, resource })

describe("PayPalWebhookService — a paid one-time window is never shortened or erased", () => {
  it("buying SPRINT over a longer BASIC window keeps the longer end date", async () => {
    // A BASIC buyer (1 month) who buys SPRINT (7 days) on day 3 used to be cut from
    // ~27 remaining days to 7: paid more, got less. Stripe was fixed in ad025fa;
    // this path wrote the new date blindly.
    const longerWindow = new Date(Date.now() + 27 * DAY)
    txState.user = { id: "u1", isManaged: false, plan: "BASIC", subscriptionEndsAt: longerWindow }

    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await svc.handleEvent(
      bodyFor("WH-ONE-1", "PAYMENT.CAPTURE.COMPLETED", { id: "CAP-1", custom_id: "u1|SPRINT" }),
      headers,
    )

    expect(txState.updateSpy).toHaveBeenCalledTimes(1)
    const data = txState.updateSpy.mock.calls[0][0].data
    expect(data.plan).toBe("SPRINT")
    expect((data.subscriptionEndsAt as Date).getTime()).toBe(longerWindow.getTime())
  })

  it("buying BASIC with no window yet sets the purchased one", async () => {
    txState.user = { id: "u1", isManaged: false, plan: "UNSUBSCRIBED", subscriptionEndsAt: null }

    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await svc.handleEvent(
      bodyFor("WH-ONE-2", "PAYMENT.CAPTURE.COMPLETED", { id: "CAP-2", custom_id: "u1|BASIC" }),
      headers,
    )

    const data = txState.updateSpy.mock.calls[0][0].data
    expect(data.plan).toBe("BASIC")
    expect((data.subscriptionEndsAt as Date).getTime()).toBeGreaterThan(Date.now() + 25 * DAY)
  })

  it("subscription EXPIRED does not wipe a BASIC month bought separately", async () => {
    // Mirror of Stripe's 9d00b92. The one-time purchase carries no subscription, so
    // the subscription ending says nothing about it.
    const window = new Date(Date.now() + 20 * DAY)
    txState.user = { id: "u1", isManaged: false, plan: "BASIC", subscriptionEndsAt: window }

    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await svc.handleEvent(bodyFor("WH-EXP-1", "BILLING.SUBSCRIPTION.EXPIRED", { id: "I-SUB1" }), headers)

    const data = txState.updateSpy.mock.calls[0][0].data
    expect(data.plan).toBeUndefined()          // plan untouched
    expect(data.subscriptionEndsAt).toBeUndefined() // window untouched
    expect(data.paypalSubscriptionId).toBeNull()    // only the subscription is detached
    expect(data.subscriptionStatus).toBe("NONE")
  })

  it("subscription EXPIRED still downgrades a PRO user", async () => {
    txState.user = { id: "u1", isManaged: false, plan: "PRO", subscriptionEndsAt: new Date(Date.now() + 20 * DAY) }

    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await svc.handleEvent(bodyFor("WH-EXP-2", "BILLING.SUBSCRIPTION.EXPIRED", { id: "I-SUB1" }), headers)

    const data = txState.updateSpy.mock.calls[0][0].data
    expect(data.plan).toBe("UNSUBSCRIBED")
    expect(data.subscriptionEndsAt).toBeNull()
    expect(data.subscriptionStatus).toBe("EXPIRED")
  })

  it("refunding a RECURRING charge (SALE) keeps a separately paid BASIC month", async () => {
    const window = new Date(Date.now() + 20 * DAY)
    txState.user = { id: "u1", isManaged: false, plan: "BASIC", subscriptionEndsAt: window }

    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await svc.handleEvent(
      bodyFor("WH-REF-1", "PAYMENT.SALE.REFUNDED", { billing_agreement_id: "I-SUB1" }),
      headers,
    )

    const data = txState.updateSpy.mock.calls[0][0].data
    expect(data.plan).toBeUndefined()
    expect(data.subscriptionEndsAt).toBeUndefined()
  })

  it("refunding the ONE-TIME capture takes that window back", async () => {
    txState.user = { id: "u1", isManaged: false, plan: "BASIC", subscriptionEndsAt: new Date(Date.now() + 20 * DAY) }

    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await svc.handleEvent(
      bodyFor("WH-REF-2", "PAYMENT.CAPTURE.REFUNDED", { id: "RE-1", custom_id: "u1|BASIC" }),
      headers,
    )

    const data = txState.updateSpy.mock.calls[0][0].data
    expect(data.plan).toBe("UNSUBSCRIBED")
    expect(data.subscriptionEndsAt).toBeNull()
  })

  it("a managed (LIMITED) user is untouched by expiry and refunds", async () => {
    txState.user = { id: "u1", isManaged: true, plan: "LIMITED", subscriptionEndsAt: new Date(Date.now() + 300 * DAY) }
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)

    await svc.handleEvent(bodyFor("WH-MAN-1", "BILLING.SUBSCRIPTION.EXPIRED", { id: "I-SUB1" }), headers)
    await svc.handleEvent(bodyFor("WH-MAN-2", "PAYMENT.SALE.REFUNDED", { billing_agreement_id: "I-SUB1" }), headers)
    await svc.handleEvent(bodyFor("WH-MAN-3", "PAYMENT.CAPTURE.REFUNDED", { id: "RE-1", custom_id: "u1|BASIC" }), headers)

    expect(txState.updateSpy).not.toHaveBeenCalled()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// The four paid plans on the PayPal side — the mirror of the Stripe matrix.
//
// PayPal is NOT Stripe: subscriptions live in paypalSubscriptionId (not
// subscriptionId), one-time orders in paypalOrderId, there is no hosted billing
// portal, and the recurring charge event carries no next billing date (it is
// re-fetched). What must match is the RESULT written to the row, because the rest of
// the app reads plan / subscriptionStatus / subscriptionEndsAt without caring who
// collected the money.
// ═════════════════════════════════════════════════════════════════════════════

describe("PayPalWebhookService — the four paid plans", () => {
  const subFor = (status: string, next?: string) =>
    vi.fn().mockResolvedValue({ status, billing_info: next ? { next_billing_time: next } : undefined })

  it.each([
    ["P-M", "monthly"],
    ["P-A", "annual"],
  ])("ACTIVATED with plan %s → PRO %s, owned by PayPal", async (planId, interval) => {
    txState.user = { id: "u1", isManaged: false, plan: "UNSUBSCRIBED", subscriptionEndsAt: null }
    const svc = new PayPalWebhookService(makeClient(subFor("ACTIVE", "2027-01-01T00:00:00Z")), logger)

    await svc.handleEvent(
      bodyFor(`WH-MTX-${planId}`, "BILLING.SUBSCRIPTION.ACTIVATED", {
        id: "I-SUB1", custom_id: "u1", plan_id: planId, billing_info: { next_billing_time: "2027-01-01T00:00:00Z" },
      }),
      headers,
    )

    const data = txState.updateSpy.mock.calls[0][0].data
    expect(data.plan).toBe("PRO")
    expect(data.planInterval).toBe(interval)
    expect(data.subscriptionStatus).toBe("ACTIVE")
    expect(data.paymentProvider).toBe("PAYPAL")
    // PayPal's own column — never Stripe's.
    expect(data.paypalSubscriptionId).toBe("I-SUB1")
    expect(data).not.toHaveProperty("subscriptionId")
  })

  it.each([
    ["BASIC", 27],
    ["SPRINT", 6],
  ])("CAPTURE.COMPLETED → one-time %s with no subscription", async (plan, minDays) => {
    txState.user = { id: "u1", isManaged: false, plan: "UNSUBSCRIBED", subscriptionEndsAt: null }
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)

    await svc.handleEvent(
      bodyFor(`WH-MTX-${plan}`, "PAYMENT.CAPTURE.COMPLETED", { id: "CAP-9", custom_id: `u1|${plan}` }),
      headers,
    )

    const data = txState.updateSpy.mock.calls[0][0].data
    expect(data.plan).toBe(plan)
    expect(data.subscriptionStatus).toBe("NONE")
    expect(data.subscriptionId).toBeNull()
    expect(data.planInterval).toBeNull()
    expect(data.paymentProvider).toBe("PAYPAL")
    expect(data.paypalOrderId).toBe("CAP-9")
    expect((data.subscriptionEndsAt as Date).getTime()).toBeGreaterThan(Date.now() + minDays * DAY)
  })

  it("a recurring charge renews PRO and advances the date from the re-fetch", async () => {
    // PAYMENT.SALE.COMPLETED carries no next billing date, so the service re-fetches the
    // subscription. That is a PayPal-specific difference from Stripe's invoice.paid.
    txState.user = { id: "u1", isManaged: false, plan: "PRO", subscriptionEndsAt: new Date(Date.now() + DAY) }
    const svc = new PayPalWebhookService(makeClient(subFor("ACTIVE", "2028-03-01T00:00:00Z")), logger)

    await svc.handleEvent(
      bodyFor("WH-MTX-RENEW", "PAYMENT.SALE.COMPLETED", { billing_agreement_id: "I-SUB1" }),
      headers,
    )

    const data = txState.updateSpy.mock.calls[0][0].data
    expect(data.plan).toBe("PRO")
    expect(data.subscriptionStatus).toBe("ACTIVE")
    expect((data.subscriptionEndsAt as Date).toISOString()).toBe("2028-03-01T00:00:00.000Z")
  })

  it("CANCELLED keeps access until the paid period ends", async () => {
    // Same promise as Stripe: cancelling never takes away what is already paid for.
    txState.user = { id: "u1", isManaged: false, plan: "PRO", subscriptionEndsAt: new Date(Date.now() + 20 * DAY) }
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)

    await svc.handleEvent(bodyFor("WH-MTX-CANCEL", "BILLING.SUBSCRIPTION.CANCELLED", { id: "I-SUB1" }), headers)

    const data = txState.updateSpy.mock.calls[0][0].data
    expect(data.subscriptionStatus).toBe("CANCELED")
    expect(data.plan).toBeUndefined()
    expect(data.subscriptionEndsAt).toBeUndefined()
  })

  it.each([
    ["BILLING.SUBSCRIPTION.SUSPENDED"],
    ["BILLING.SUBSCRIPTION.PAYMENT.FAILED"],
  ])("%s marks PAST_DUE without dropping the plan", async (type) => {
    txState.user = { id: "u1", isManaged: false, plan: "PRO", subscriptionEndsAt: new Date(Date.now() + 5 * DAY) }
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)

    await svc.handleEvent(bodyFor(`WH-MTX-${type}`, type, { id: "I-SUB1" }), headers)

    const data = txState.updateSpy.mock.calls[0][0].data
    expect(data.subscriptionStatus).toBe("PAST_DUE")
    expect(data.plan).toBeUndefined()
  })

  it("a subscription that is not ACTIVE on re-fetch provisions nothing and lets PayPal retry", async () => {
    // PayPal-specific: the payload is never trusted for a grant. If the GET says the
    // subscription is not ACTIVE, the event must NOT be claimed — otherwise the retry
    // that would have granted access is silently killed.
    txState.user = { id: "u1", isManaged: false, plan: "UNSUBSCRIBED", subscriptionEndsAt: null }
    const svc = new PayPalWebhookService(makeClient(subFor("APPROVAL_PENDING")), logger)

    await expect(
      svc.handleEvent(bodyFor("WH-MTX-PENDING", "BILLING.SUBSCRIPTION.ACTIVATED", { id: "I-SUB1", custom_id: "u1", plan_id: "P-M" }), headers),
    ).rejects.toThrow()
    expect(txState.updateSpy).not.toHaveBeenCalled()
  })
})

describe("PayPalWebhookService — durable observability log (PayPal Health)", () => {
  it("records SUCCESS after a webhook is provisioned", async () => {
    const getSub = vi.fn().mockResolvedValue({ status: "ACTIVE", billing_info: { next_billing_time: "2027-01-01T00:00:00Z" } })
    const svc = new PayPalWebhookService(makeClient(getSub), logger)
    await svc.handleEvent(bodyFor("WH-LOG-OK", "BILLING.SUBSCRIPTION.ACTIVATED", { id: "I-SUB1", custom_id: "u1", plan_id: "P-A" }), headers)
    expect(webhookLogUpsert).toHaveBeenCalledTimes(1)
    const arg = webhookLogUpsert.mock.calls[0][0]
    expect(arg.where.paypalEventId).toBe("WH-LOG-OK")
    expect(arg.create.status).toBe("SUCCESS")
    expect(arg.create.type).toBe("BILLING.SUBSCRIPTION.ACTIVATED")
  })

  it("records SKIPPED for an intentionally-ignored event type", async () => {
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await svc.handleEvent(bodyFor("WH-LOG-SKIP", "SOME.UNHANDLED.EVENT", { id: "X" }), headers)
    expect(webhookLogUpsert).toHaveBeenCalledTimes(1)
    expect(webhookLogUpsert.mock.calls[0][0].create.status).toBe("SKIPPED")
  })

  it("records FAILED (and re-throws) when the handler errors", async () => {
    const getSub = vi.fn().mockRejectedValue(new Error("paypal down"))
    const svc = new PayPalWebhookService(makeClient(getSub), logger)
    await expect(
      svc.handleEvent(bodyFor("WH-LOG-FAIL", "BILLING.SUBSCRIPTION.ACTIVATED", { id: "I-SUB1", custom_id: "u1", plan_id: "P-A" }), headers),
    ).rejects.toThrow()
    expect(webhookLogUpsert).toHaveBeenCalledTimes(1)
    expect(webhookLogUpsert.mock.calls[0][0].create.status).toBe("FAILED")
    expect(webhookLogUpsert.mock.calls[0][0].create.errorMessage).toBeTruthy()
  })

  it("never lets a log-write failure break the money flow", async () => {
    webhookLogUpsert.mockRejectedValueOnce(new Error("db down"))
    const getSub = vi.fn().mockResolvedValue({ status: "ACTIVE", billing_info: { next_billing_time: "2027-01-01T00:00:00Z" } })
    const svc = new PayPalWebhookService(makeClient(getSub), logger)
    await expect(
      svc.handleEvent(bodyFor("WH-LOG-SAFE", "BILLING.SUBSCRIPTION.ACTIVATED", { id: "I-SUB1", custom_id: "u1", plan_id: "P-A" }), headers),
    ).resolves.toBeUndefined()
  })
})
