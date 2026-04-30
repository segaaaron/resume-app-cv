import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"

// Set required env vars before module is imported
beforeAll(() => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
})

// ─── Mock stripe ──────────────────────────────────────────────────────────────
// vi.mock is hoisted — factories cannot close over top-level variables.
vi.mock("@/lib/stripe", () => ({
  stripe: { webhooks: { constructEvent: vi.fn() } },
  stripeEnabled: () => true,
}))

// ─── Mock db ──────────────────────────────────────────────────────────────────
vi.mock("@/lib/db", () => ({
  db: {
    stripeEvent: { create: vi.fn() },
    user: { findFirst: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}))

// ─── Mock resend + emails ────────────────────────────────────────────────────
vi.mock("@/lib/resend", () => ({ resend: null, emailEnabled: () => false }))
vi.mock("@/lib/emails/subscriptionConfirmation", () => ({
  subscriptionConfirmationHtml: vi.fn(() => "<html/>"),
  subscriptionConfirmationText: vi.fn(() => "text"),
}))
vi.mock("@/lib/referral-rewards", () => ({
  checkAndApplyReferralReward: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from "@/app/api/stripe/webhook/route"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

const mockConstructEvent = (stripe as { webhooks: { constructEvent: ReturnType<typeof vi.fn> } }).webhooks.constructEvent
const mockStripeEventCreate = db.stripeEvent.create as ReturnType<typeof vi.fn>
const mockUserFindFirst = db.user.findFirst as ReturnType<typeof vi.fn>
const mockUserUpdate = db.user.update as ReturnType<typeof vi.fn>
const mockAuditLogCreate = db.auditLog.create as ReturnType<typeof vi.fn>

// Helper — build request with stripe-signature header
function makeWebhookRequest(body: string, sig = "t=1,v1=abc") {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": sig, "Content-Type": "application/json" },
    body,
  })
}

// Helper — build a minimal Stripe event
function makeEvent(type: string, data: Record<string, unknown>, id = "evt_test") {
  return { id, type, data: { object: data } }
}

describe("Stripe webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuditLogCreate.mockResolvedValue({})
    mockUserUpdate.mockResolvedValue({})
  })

  it("first delivery of event → processes and creates StripeEvent row", async () => {
    const event = makeEvent("checkout.session.completed", {
      metadata: { userId: "user-1", planInterval: "monthly" },
      subscription: "sub_123",
    })
    mockConstructEvent.mockReturnValue(event)
    mockStripeEventCreate.mockResolvedValue({})

    const res = await POST(makeWebhookRequest(JSON.stringify(event)))

    expect(res.status).toBe(200)
    expect(mockStripeEventCreate).toHaveBeenCalledWith({ data: { id: "evt_test" } })
    expect(mockUserUpdate).toHaveBeenCalledOnce()
  })

  it("duplicate delivery (P2002 on StripeEvent.create) → returns 200 without processing side effects", async () => {
    const event = makeEvent("checkout.session.completed", {
      metadata: { userId: "user-1", planInterval: "monthly" },
      subscription: "sub_123",
    })
    mockConstructEvent.mockReturnValue(event)
    const p2002 = Object.assign(new Error("Unique constraint"), { code: "P2002" })
    mockStripeEventCreate.mockRejectedValue(p2002)

    const res = await POST(makeWebhookRequest(JSON.stringify(event)))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
    // Should NOT process the event (no user update)
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })

  it("checkout.session.completed sets plan PRO and subscriptionStatus ACTIVE", async () => {
    const event = makeEvent("checkout.session.completed", {
      metadata: { userId: "user-2", planInterval: "annual" },
      subscription: "sub_456",
    })
    mockConstructEvent.mockReturnValue(event)
    mockStripeEventCreate.mockResolvedValue({})

    await POST(makeWebhookRequest(JSON.stringify(event)))

    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-2" },
        data: expect.objectContaining({
          plan: "PRO",
          subscriptionStatus: "ACTIVE",
          planInterval: "annual",
        }),
      })
    )
  })

  it("customer.subscription.deleted sets plan FREE and subscriptionStatus EXPIRED", async () => {
    const event = makeEvent("customer.subscription.deleted", {
      customer: "cus_abc",
      status: "canceled",
    })
    mockConstructEvent.mockReturnValue(event)
    mockStripeEventCreate.mockResolvedValue({})
    mockUserFindFirst.mockResolvedValue({ id: "user-3", stripeCustomerId: "cus_abc" })

    await POST(makeWebhookRequest(JSON.stringify(event)))

    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-3" },
        data: expect.objectContaining({
          plan: "FREE",
          subscriptionStatus: "EXPIRED",
        }),
      })
    )
  })

  it("missing stripe-signature → 400", async () => {
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("invalid signature (constructEvent throws) → 400", async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error("Bad sig") })
    const res = await POST(makeWebhookRequest("{}", "bad-sig"))
    expect(res.status).toBe(400)
  })
})
