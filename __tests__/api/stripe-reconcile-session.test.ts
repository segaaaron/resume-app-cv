import { describe, it, expect, vi, beforeEach } from "vitest"

// Reconcile-session route — the success-page half of Stripe's belt-and-suspenders
// fulfillment. Auth + same-origin come from requireAuth; the route's own job is the
// owner check and delegating to the (idempotent) provisioning path.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/stripe", () => ({ stripeEnabled: vi.fn().mockReturnValue(true) }))
vi.mock("@/lib/controllers/stripe-deps", () => ({
  stripeClient: { retrieveCheckoutSession: vi.fn() },
  stripeWebhookService: { provisionCheckoutSession: vi.fn() },
}))

import { auth } from "@/lib/auth"
import { stripeClient, stripeWebhookService } from "@/lib/controllers/stripe-deps"

const ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.valhallaresume.com"

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/stripe/reconcile-session", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify(body),
  })
}

async function call(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/stripe/reconcile-session/route")
  return POST(makeRequest(body))
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_APP_URL = ORIGIN
})

describe("POST /api/stripe/reconcile-session", () => {
  it("unauthenticated → 401, never touches Stripe", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const res = await call({ sessionId: "cs_123" })
    expect(res.status).toBe(401)
    expect(stripeClient.retrieveCheckoutSession).not.toHaveBeenCalled()
  })

  it("invalid session id (not cs_) → 400, never touches Stripe", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" } } as never)
    const res = await call({ sessionId: "evil_123" })
    expect(res.status).toBe(400)
    expect(stripeClient.retrieveCheckoutSession).not.toHaveBeenCalled()
  })

  it("session belongs to another user → 403, does NOT provision", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" } } as never)
    vi.mocked(stripeClient.retrieveCheckoutSession).mockResolvedValue({ id: "cs_x", metadata: { userId: "u2" } } as never)
    const res = await call({ sessionId: "cs_x" })
    expect(res.status).toBe(403)
    expect(stripeWebhookService.provisionCheckoutSession).not.toHaveBeenCalled()
  })

  it("own paid session → provisions, returns the result", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" } } as never)
    const session = { id: "cs_ok", metadata: { userId: "u1" } }
    vi.mocked(stripeClient.retrieveCheckoutSession).mockResolvedValue(session as never)
    vi.mocked(stripeWebhookService.provisionCheckoutSession).mockResolvedValue({ provisioned: true, plan: "PRO" })
    const res = await call({ sessionId: "cs_ok" })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ provisioned: true, plan: "PRO" })
    expect(stripeWebhookService.provisionCheckoutSession).toHaveBeenCalledWith(session)
  })

  it("own session not yet paid → provisioned:false (webhook stays the safety net)", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" } } as never)
    vi.mocked(stripeClient.retrieveCheckoutSession).mockResolvedValue({ id: "cs_np", metadata: { userId: "u1" } } as never)
    vi.mocked(stripeWebhookService.provisionCheckoutSession).mockResolvedValue({ provisioned: false, plan: null })
    const res = await call({ sessionId: "cs_np" })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ provisioned: false, plan: null })
  })
})
