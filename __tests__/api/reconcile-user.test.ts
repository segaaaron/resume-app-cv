import { describe, it, expect, vi, beforeEach } from "vitest"

// Admin reconcile-user — resyncs a user's plan from Stripe (source of truth). The guard
// under test: a one-time (BASIC/SPRINT) buyer has NO subscription by design, so "no
// subscription found" must NOT downgrade them and wipe a window they paid for.
vi.mock("@/lib/auth", () => ({ auth: vi.fn(), purgeUserCache: vi.fn() }))
vi.mock("@/lib/csrf", () => ({ checkOrigin: () => true }))
vi.mock("@/lib/stripe", () => ({
  stripeEnabled: () => true,
  stripe: { subscriptions: { list: vi.fn() } },
}))
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}))

import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

const FUTURE = new Date(Date.now() + 20 * 86400 * 1000)

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/billing/reconcile-user", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://www.valhallaresume.com" },
    body: JSON.stringify(body),
  })
}
async function call(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/admin/billing/reconcile-user/route")
  return POST(makeRequest(body))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({ user: { id: "admin1", role: "SUPER_ADMIN" } } as never)
})

describe("POST /api/admin/billing/reconcile-user — one-time window protection", () => {
  it("BASIC buyer with a valid window and no subscription → keeps the window, no downgrade", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "u1", stripeCustomerId: "cus_1", plan: "BASIC", subscriptionStatus: "NONE", subscriptionEndsAt: FUTURE, deletedAt: null,
    } as never)
    // @ts-expect-error partial Stripe list mock
    vi.mocked(stripe!.subscriptions.list).mockResolvedValue({ data: [] })

    const res = await call({ userId: "u1" })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ source: "one_time_window_kept" })
    // The paid window must be untouched.
    expect(db.user.update).not.toHaveBeenCalled()
  })

  it("UNSUBSCRIBED user with no subscription → still downgraded to EXPIRED (no window to protect)", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "u2", stripeCustomerId: "cus_2", plan: "UNSUBSCRIBED", subscriptionStatus: "NONE", subscriptionEndsAt: null, deletedAt: null,
    } as never)
    // @ts-expect-error partial Stripe list mock
    vi.mocked(stripe!.subscriptions.list).mockResolvedValue({ data: [] })
    vi.mocked(db.user.update).mockResolvedValue({ plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", subscriptionEndsAt: null, sessionVersion: 2 } as never)

    const res = await call({ userId: "u2" })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ source: "no_stripe_subscription" })
    expect(db.user.update).toHaveBeenCalled()
  })
})
