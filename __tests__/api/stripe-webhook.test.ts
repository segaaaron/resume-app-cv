import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"
import { AppError } from "@/lib/services/auth/AppError"

// Set required env vars before any module is imported
beforeAll(() => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
})

// ─── Mock the service — route only delegates to it, no direct DB access ──────
vi.mock("@/lib/controllers/stripe-deps", () => ({
  stripeWebhookService: { handleEvent: vi.fn() },
}))

vi.mock("@/lib/stripe", () => ({
  stripeEnabled: vi.fn().mockReturnValue(true),
}))

// auth is transitively imported via handleError → shared.ts
vi.mock("@/lib/auth", () => ({ auth: vi.fn(), purgeUserCache: vi.fn() }))

import { POST } from "@/app/api/stripe/webhook/route"
import { stripeWebhookService } from "@/lib/controllers/stripe-deps"
import { stripeEnabled } from "@/lib/stripe"

const mockHandleEvent = stripeWebhookService.handleEvent as ReturnType<typeof vi.fn>
const mockStripeEnabled = stripeEnabled as ReturnType<typeof vi.fn>

function makeWebhookRequest(body = "{}", sig = "t=1,v1=abc") {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": sig, "Content-Type": "application/json" },
    body,
  })
}

describe("Stripe webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStripeEnabled.mockReturnValue(true)
  })

  it("stripe not configured → 503", async () => {
    mockStripeEnabled.mockReturnValue(false)
    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(503)
  })

  it("missing stripe-signature → 400", async () => {
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("successful event → 200 + { received: true }", async () => {
    mockHandleEvent.mockResolvedValue(undefined)
    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
    expect(mockHandleEvent).toHaveBeenCalledWith("{}", "t=1,v1=abc", "whsec_test")
  })

  it("invalid_signature AppError → 400", async () => {
    mockHandleEvent.mockRejectedValue(new AppError("invalid_signature", 400))
    const res = await POST(makeWebhookRequest("{}", "bad-sig"))
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: "Invalid signature" })
  })

  it("handler_error AppError → 500", async () => {
    mockHandleEvent.mockRejectedValue(new AppError("handler_error", 500))
    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(500)
  })

  it("unexpected error → 500", async () => {
    mockHandleEvent.mockRejectedValue(new Error("DB down"))
    const res = await POST(makeWebhookRequest())
    expect(res.status).toBe(500)
  })

  it("idempotent (service already returned void) → 200, no side effects visible at route level", async () => {
    mockHandleEvent.mockResolvedValue(undefined)
    const res1 = await POST(makeWebhookRequest())
    const res2 = await POST(makeWebhookRequest())
    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
    expect(mockHandleEvent).toHaveBeenCalledTimes(2)
  })
})
