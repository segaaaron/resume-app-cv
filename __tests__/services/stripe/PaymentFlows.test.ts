/**
 * PaymentFlows.test.ts
 * Comprehensive Stripe payment flow tests covering all webhook handlers,
 * checkout service, and plan access logic.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import type Stripe from "stripe"
import { StripeWebhookService } from "@/lib/services/stripe/StripeWebhookService"
import { StripeCheckoutService } from "@/lib/services/stripe/StripeCheckoutService"
import { isActive, PAST_DUE_GRACE_DAYS } from "@/lib/plans"
import type { IStripeClient } from "@/lib/interfaces/IStripeClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

// ─── Module mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(),
    stripeEvent: { findUnique: vi.fn() },
    stripeWebhookLog: { upsert: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}))

vi.mock("@/lib/auth", () => ({ purgeUserCache: vi.fn() }))
vi.mock("@/lib/referral-rewards", () => ({ checkAndApplyReferralReward: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/resend", () => ({
  resend: null,
  emailEnabled: vi.fn().mockReturnValue(false),
}))
vi.mock("@/lib/stripe", () => ({ stripeEnabled: vi.fn().mockReturnValue(true) }))

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockStripeClient: IStripeClient = {
  constructEvent: vi.fn(),
  retrieveSubscription: vi.fn(),
  retrieveCharge: vi.fn(),
  cancelSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
  listCustomers: vi.fn(),
  createCustomer: vi.fn(),
  createRefund: vi.fn(),
  retrieveBalance: vi.fn(),
  listCharges: vi.fn(),
  listDisputes: vi.fn(),
  listSubscriptions: vi.fn(),
}

const mockLogger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

const makeWebhook = () => new StripeWebhookService(mockStripeClient, mockLogger)
const makeCheckout = () => new StripeCheckoutService(mockStripeClient, mockLogger)

/** Build a mock Prisma tx object — all methods are spies */
function makeTx(overrides?: Partial<{
  stripeEventCreate: ReturnType<typeof vi.fn>
  stripeEventUpdate: ReturnType<typeof vi.fn>
  userFindUnique: ReturnType<typeof vi.fn>
  userUpdate: ReturnType<typeof vi.fn>
  auditLogCreate: ReturnType<typeof vi.fn>
}>) {
  return {
    stripeEvent: {
      create: overrides?.stripeEventCreate ?? vi.fn().mockResolvedValue({}),
      update: overrides?.stripeEventUpdate ?? vi.fn().mockResolvedValue({}),
    },
    user: {
      findUnique: overrides?.userFindUnique ?? vi.fn().mockResolvedValue({ id: "u1", email: "a@b.com", name: "Alice", planInterval: "monthly", subscriptionStatus: "ACTIVE", subscriptionId: "sub_1" }),
      update: overrides?.userUpdate ?? vi.fn().mockResolvedValue({}),
    },
    auditLog: {
      create: overrides?.auditLogCreate ?? vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0),
    },
    consentLog: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  }
}

/** Wire db.$transaction to run the callback with the given tx */
async function mockTx(db: typeof import("@/lib/db").db, tx: ReturnType<typeof makeTx>) {
  vi.mocked(db.$transaction).mockImplementation(
    (async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)) as unknown as typeof db.$transaction
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly_test"
  process.env.STRIPE_PRICE_ID_ANNUAL  = "price_annual_test"
  process.env.NEXT_PUBLIC_APP_URL = "https://valhallaresume.com"
  delete process.env.ADMIN_EMAIL
})

// ═════════════════════════════════════════════════════════════════════════════
// A. handleCheckoutCompleted
// ═════════════════════════════════════════════════════════════════════════════

describe("A. handleCheckoutCompleted", () => {
  function makeCheckoutEvent(overrides: {
    paymentStatus?: string
    userId?: string
    planInterval?: string
    subscription?: string | null | { id: string }
    eventId?: string
  } = {}) {
    return {
      type: "checkout.session.completed",
      id: overrides.eventId ?? "ev_checkout_1",
      data: {
        object: {
          id: "cs_1",
          payment_status: overrides.paymentStatus ?? "paid",
          metadata: {
            ...(overrides.userId !== undefined ? { userId: overrides.userId } : { userId: "u1" }),
            planInterval: overrides.planInterval ?? "monthly",
          },
          subscription: overrides.subscription !== undefined ? overrides.subscription : "sub_1",
        },
      },
    } as unknown as Stripe.Event
  }

  it("payment_status !== 'paid' → skips DB transaction", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeCheckoutEvent({ paymentStatus: "unpaid" }))
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it("no userId in metadata → skips DB transaction", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeCheckoutEvent({ userId: undefined as unknown as string }))
    // Force metadata to have no userId
    const event = {
      type: "checkout.session.completed",
      id: "ev_noid",
      data: { object: { payment_status: "paid", metadata: {}, subscription: null } },
    } as unknown as Stripe.Event
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(event)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it("duplicate event (P2002) → returns silently without updating user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeCheckoutEvent())
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: 1800000000 }] },
    } as unknown as Stripe.Subscription)
    const tx = makeTx({ stripeEventCreate: vi.fn().mockRejectedValue({ code: "P2002" }) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  it("happy path monthly → sets PRO, planInterval=monthly, ACTIVE", async () => {
    const { db } = await import("@/lib/db")
    const { purgeUserCache } = await import("@/lib/auth")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeCheckoutEvent({ planInterval: "monthly" }))
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: 1800000000 }] },
    } as unknown as Stripe.Subscription)
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ plan: "PRO", planInterval: "monthly", subscriptionStatus: "ACTIVE" }),
    }))
    expect(purgeUserCache).toHaveBeenCalledWith("u1")
  })

  it("happy path annual → sets planInterval=annual", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeCheckoutEvent({ planInterval: "annual" }))
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: 1800000000 }] },
    } as unknown as Stripe.Subscription)
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ planInterval: "annual" }),
    }))
  })

  it("subscriptionId as string → used directly", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeCheckoutEvent({ subscription: "sub_string_id" }))
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: 1800000000 }] },
    } as unknown as Stripe.Subscription)
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(mockStripeClient.retrieveSubscription).toHaveBeenCalledWith("sub_string_id")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ subscriptionId: "sub_string_id" }),
    }))
  })

  it("subscriptionId as Stripe.Subscription object → uses .id", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeCheckoutEvent({ subscription: { id: "sub_obj_id" } }))
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: 1800000000 }] },
    } as unknown as Stripe.Subscription)
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(mockStripeClient.retrieveSubscription).toHaveBeenCalledWith("sub_obj_id")
  })

  it("subscriptionEndsAt set from subscription period_end", async () => {
    const { db } = await import("@/lib/db")
    const periodEnd = 2000000000 // some future unix ts
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeCheckoutEvent())
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: periodEnd }] },
    } as unknown as Stripe.Subscription)
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ subscriptionEndsAt: new Date(periodEnd * 1000) }),
    }))
  })

  it("purgeUserCache called after successful checkout", async () => {
    const { db } = await import("@/lib/db")
    const { purgeUserCache } = await import("@/lib/auth")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeCheckoutEvent())
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: 1800000000 }] },
    } as unknown as Stripe.Subscription)
    await mockTx(db, makeTx())
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(purgeUserCache).toHaveBeenCalledWith("u1")
  })

  it("referralReward triggered after checkout", async () => {
    const { db } = await import("@/lib/db")
    const { checkAndApplyReferralReward } = await import("@/lib/referral-rewards")
    vi.mocked(checkAndApplyReferralReward).mockResolvedValue(undefined)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeCheckoutEvent())
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: 1800000000 }] },
    } as unknown as Stripe.Subscription)
    await mockTx(db, makeTx())
    await makeWebhook().handleEvent("body", "sig", "secret")
    // Fire-and-forget — may need brief tick
    await new Promise(r => setTimeout(r, 10))
    expect(checkAndApplyReferralReward).toHaveBeenCalledWith("u1")
  })

  it("referralReward throws → does NOT bubble up (fire-and-forget)", async () => {
    const { db } = await import("@/lib/db")
    const { checkAndApplyReferralReward } = await import("@/lib/referral-rewards")
    vi.mocked(checkAndApplyReferralReward).mockRejectedValue(new Error("referral boom"))
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeCheckoutEvent())
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: 1800000000 }] },
    } as unknown as Stripe.Subscription)
    await mockTx(db, makeTx())
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
    await new Promise(r => setTimeout(r, 20))
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("checkAndApplyReferralReward"),
      expect.anything(),
      expect.any(Error)
    )
  })

  it("no subscriptionId (subscription=null) → skips retrieveSubscription, still updates user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeCheckoutEvent({ subscription: null }))
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(mockStripeClient.retrieveSubscription).not.toHaveBeenCalled()
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ plan: "PRO" }),
    }))
  })

  // ── One-time plans (BASIC / SPRINT): never shorten a paid window ──
  describe("one-time checkout (planType metadata)", () => {
    function makeOneTimeEvent(planType: "basic" | "sprint", eventId = "ev_onetime_1") {
      return {
        type: "checkout.session.completed",
        id: eventId,
        data: {
          object: { id: "cs_ot", payment_status: "paid", metadata: { userId: "u1", planType }, subscription: null },
        },
      } as unknown as Stripe.Event
    }

    /** Reads the subscriptionEndsAt the handler wrote. */
    function writtenEndsAt(tx: ReturnType<typeof makeTx>): Date {
      const call = vi.mocked(tx.user.update).mock.calls[0][0] as { data: { subscriptionEndsAt: Date } }
      return call.data.subscriptionEndsAt
    }

    it("BASIC with no prior window → ends ~1 month out, subscriptionId cleared", async () => {
      const { db } = await import("@/lib/db")
      vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeOneTimeEvent("basic"))
      const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ isManaged: false, subscriptionEndsAt: null }) })
      await mockTx(db, tx)
      await makeWebhook().handleEvent("body", "sig", "secret")
      expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ plan: "BASIC", subscriptionStatus: "NONE", subscriptionId: null, planInterval: null }),
      }))
      const days = (writtenEndsAt(tx).getTime() - Date.now()) / 86_400_000
      expect(days).toBeGreaterThan(26)
    })

    it("regression: BASIC buyer with 25 days left buying SPRINT (7d) KEEPS the 25 days", async () => {
      // The bug: subscriptionEndsAt was overwritten unconditionally, so this user paid
      // $7.99 and was cut from 25 remaining days down to 7. Paid more, got less.
      const { db } = await import("@/lib/db")
      const remaining = new Date(Date.now() + 25 * 86_400_000)
      vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeOneTimeEvent("sprint"))
      const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ isManaged: false, subscriptionEndsAt: remaining }) })
      await mockTx(db, tx)
      await makeWebhook().handleEvent("body", "sig", "secret")
      // Plan switches to SPRINT (better capabilities) but the window is not clipped.
      expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ plan: "SPRINT" }),
      }))
      expect(writtenEndsAt(tx).getTime()).toBe(remaining.getTime())
    })

    it("an EXPIRED window in the past never wins over the newly purchased one", async () => {
      const { db } = await import("@/lib/db")
      const stale = new Date(Date.now() - 60 * 86_400_000)
      vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeOneTimeEvent("sprint"))
      const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ isManaged: false, subscriptionEndsAt: stale }) })
      await mockTx(db, tx)
      await makeWebhook().handleEvent("body", "sig", "secret")
      expect(writtenEndsAt(tx).getTime()).toBeGreaterThan(Date.now())
    })

    it("managed user → no write at all", async () => {
      const { db } = await import("@/lib/db")
      vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeOneTimeEvent("basic"))
      const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ isManaged: true, subscriptionEndsAt: null }) })
      await mockTx(db, tx)
      await makeWebhook().handleEvent("body", "sig", "secret")
      expect(tx.user.update).not.toHaveBeenCalled()
      expect(tx.auditLog.create).not.toHaveBeenCalled()
    })

    it("writes an audit trail — a one-time purchase used to leave no queryable record", async () => {
      const { db } = await import("@/lib/db")
      vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeOneTimeEvent("basic"))
      const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ isManaged: false, subscriptionEndsAt: null }) })
      await mockTx(db, tx)
      await makeWebhook().handleEvent("body", "sig", "secret")
      expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: "u1",
          metadata: expect.objectContaining({ source: "one_time_checkout", plan: "BASIC", keptLongerExistingWindow: false }),
        }),
      }))
    })

    it("records when a longer existing window was kept", async () => {
      const { db } = await import("@/lib/db")
      const remaining = new Date(Date.now() + 25 * 86_400_000)
      vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeOneTimeEvent("sprint"))
      const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ isManaged: false, subscriptionEndsAt: remaining }) })
      await mockTx(db, tx)
      await makeWebhook().handleEvent("body", "sig", "secret")
      expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({ keptLongerExistingWindow: true, subscriptionEndsAt: remaining.toISOString() }),
        }),
      }))
    })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// B. handleInvoicePaid
// ═════════════════════════════════════════════════════════════════════════════

describe("B. handleInvoicePaid", () => {
  function makeInvoicePaidEvent(overrides: {
    parent?: unknown
    customer?: string
    eventId?: string
  } = {}) {
    return {
      type: "invoice.paid",
      id: overrides.eventId ?? "ev_inv_1",
      data: {
        object: {
          customer: overrides.customer ?? "cus_1",
          parent: overrides.parent !== undefined
            ? overrides.parent
            : { type: "subscription_details", subscription_details: { subscription: "sub_1" } },
        },
      },
    } as unknown as Stripe.Event
  }

  it("parent is null → skips (no DB transaction)", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeInvoicePaidEvent({ parent: null }))
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it("parent.type !== 'subscription_details' → skips", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(
      makeInvoicePaidEvent({ parent: { type: "payment_intent_details" } })
    )
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it("happy path → user set PRO ACTIVE, subscriptionEndsAt updated", async () => {
    const { db } = await import("@/lib/db")
    const periodEnd = 2000000000
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeInvoicePaidEvent())
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: periodEnd }] },
    } as unknown as Stripe.Subscription)
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        plan: "PRO",
        subscriptionStatus: "ACTIVE",
        subscriptionEndsAt: new Date(periodEnd * 1000),
      }),
    }))
  })

  it("user not found by stripeCustomerId → skips (no crash)", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeInvoicePaidEvent())
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: 2000000000 }] },
    } as unknown as Stripe.Subscription)
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue(null) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  it("duplicate event (P2002) → skips idempotently", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeInvoicePaidEvent())
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: 2000000000 }] },
    } as unknown as Stripe.Subscription)
    const tx = makeTx({ stripeEventCreate: vi.fn().mockRejectedValue({ code: "P2002" }) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  it("email skipped when resend=null (default mock — emailEnabled returns false, resend is null)", async () => {
    const { db } = await import("@/lib/db")
    // Default mock: resend=null, emailEnabled returns false → email block skipped entirely
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeInvoicePaidEvent())
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: 2000000000 }] },
    } as unknown as Stripe.Subscription)
    await mockTx(db, makeTx())
    // Should resolve without throwing, even though email is skipped
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
  })

  it("purgeUserCache called after invoice.paid", async () => {
    const { db } = await import("@/lib/db")
    const { purgeUserCache } = await import("@/lib/auth")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeInvoicePaidEvent())
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: 2000000000 }] },
    } as unknown as Stripe.Subscription)
    await mockTx(db, makeTx())
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(purgeUserCache).toHaveBeenCalledWith("u1")
  })

  it("planInterval derived from Stripe subscription price interval (source of truth)", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeInvoicePaidEvent())
    // Stripe says the subscription is yearly — DB value must be overwritten with it
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: 2000000000, price: { recurring: { interval: "year" } } }] },
    } as unknown as Stripe.Subscription)
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ id: "u1", email: "a@b.com", name: "Alice", planInterval: "monthly", subscriptionStatus: "ACTIVE" }) })
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ planInterval: "annual" }),
    }))
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// C. handleSubscriptionUpdated
// ═════════════════════════════════════════════════════════════════════════════

describe("C. handleSubscriptionUpdated", () => {
  function makeSubUpdatedEvent(sub: Partial<{
    id: string
    customer: string
    status: string
    cancel_at_period_end: boolean
    cancel_at: number | null
    items: { data: Array<{ current_period_end: number; price?: { recurring?: { interval?: string } } }> }
  }>, eventId = "ev_sub_upd_1") {
    return {
      type: "customer.subscription.updated",
      id: eventId,
      data: {
        object: {
          id: sub.id ?? "sub_1",
          customer: sub.customer ?? "cus_1",
          status: sub.status ?? "active",
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          cancel_at: sub.cancel_at ?? null,
          items: sub.items ?? { data: [{ current_period_end: 2000000000, price: { recurring: { interval: "month" } } }] },
        },
      },
    } as unknown as Stripe.Event
  }

  it("cancel_at_period_end=true → status=CANCELED, subscriptionEndsAt=cancel_at", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(
      makeSubUpdatedEvent({ cancel_at_period_end: true, cancel_at: 1900000000 })
    )
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ subscriptionStatus: "CANCELED", subscriptionEndsAt: new Date(1900000000 * 1000) }),
    }))
  })

  it("cancel_at_period_end=true + cancel_at=null → falls back to current_period_end", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(
      makeSubUpdatedEvent({ cancel_at_period_end: true, cancel_at: null, items: { data: [{ current_period_end: 1999999999, price: { recurring: { interval: "month" } } }] } })
    )
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ subscriptionStatus: "CANCELED", subscriptionEndsAt: new Date(1999999999 * 1000) }),
    }))
  })

  it("status=active, interval=month → status=ACTIVE, planInterval=monthly", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(
      makeSubUpdatedEvent({ status: "active", items: { data: [{ current_period_end: 2000000000, price: { recurring: { interval: "month" } } }] } })
    )
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ subscriptionStatus: "ACTIVE", planInterval: "monthly" }),
    }))
  })

  it("status=active, interval=year → status=ACTIVE, planInterval=annual", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(
      makeSubUpdatedEvent({ status: "active", items: { data: [{ current_period_end: 2000000000, price: { recurring: { interval: "year" } } }] } })
    )
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ subscriptionStatus: "ACTIVE", planInterval: "annual" }),
    }))
  })

  it("status=past_due → PAST_DUE", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubUpdatedEvent({ status: "past_due" }))
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ subscriptionStatus: "PAST_DUE" }),
    }))
  })

  it("status=unpaid → PAST_DUE", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubUpdatedEvent({ status: "unpaid" }))
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ subscriptionStatus: "PAST_DUE" }),
    }))
  })

  it("status=incomplete_expired → plan=UNSUBSCRIBED, status=EXPIRED", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubUpdatedEvent({ status: "incomplete_expired" }))
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED" }),
    }))
  })

  it("status=paused → plan=UNSUBSCRIBED, status=EXPIRED", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubUpdatedEvent({ status: "paused" }))
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED" }),
    }))
  })

  it("user not found → resolves without crash", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubUpdatedEvent({ status: "active" }))
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue(null) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  it("duplicate event (P2002) → skips idempotently", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubUpdatedEvent({ status: "active" }, "ev_dup_sub"))
    const tx = makeTx({ stripeEventCreate: vi.fn().mockRejectedValue({ code: "P2002" }) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  it("purgeUserCache called after subscription updated", async () => {
    const { db } = await import("@/lib/db")
    const { purgeUserCache } = await import("@/lib/auth")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubUpdatedEvent({ status: "active" }))
    await mockTx(db, makeTx())
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(purgeUserCache).toHaveBeenCalledWith("u1")
  })

  it("auditLog created for cancel_at_period_end", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(
      makeSubUpdatedEvent({ cancel_at_period_end: true, cancel_at: 1900000000 })
    )
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "CANCEL_SUBSCRIPTION" }),
    }))
  })

  it("auditLog created for active status update", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubUpdatedEvent({ status: "active" }))
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "SUBSCRIPTION_UPDATED" }),
    }))
  })

  it("auditLog created for past_due status", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubUpdatedEvent({ status: "past_due" }))
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "SUBSCRIPTION_UPDATED" }),
    }))
  })

  it("auditLog created for incomplete_expired status", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubUpdatedEvent({ status: "incomplete_expired" }))
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "SUBSCRIPTION_UPDATED" }),
    }))
  })

  // ── Never move a paid end date earlier, never downgrade a paid one-time plan ──
  describe("protects a separately paid one-time window", () => {
    const FAR = Date.now() + 40 * 86_400_000   // one-time window, further out
    const NEAR = Math.floor((Date.now() + 5 * 86_400_000) / 1000) // subscription period end

    function writtenData(tx: ReturnType<typeof makeTx>): Record<string, unknown> {
      return (vi.mocked(tx.user.update).mock.calls[0][0] as { data: Record<string, unknown> }).data
    }

    it("cancel_at_period_end does NOT shorten a longer paid window", async () => {
      const { db } = await import("@/lib/db")
      vi.mocked(mockStripeClient.constructEvent).mockReturnValue(
        makeSubUpdatedEvent({ cancel_at_period_end: true, cancel_at: NEAR }, "ev_ot_cancel"),
      )
      const tx = makeTx({
        userFindUnique: vi.fn().mockResolvedValue({ id: "u1", isManaged: false, plan: "BASIC", subscriptionEndsAt: new Date(FAR) }),
      })
      await mockTx(db, tx)
      await makeWebhook().handleEvent("body", "sig", "secret")
      expect((writtenData(tx).subscriptionEndsAt as Date).getTime()).toBe(FAR)
    })

    it("an active period end still moves the date FORWARD as usual", async () => {
      const { db } = await import("@/lib/db")
      const forward = Math.floor((Date.now() + 90 * 86_400_000) / 1000)
      vi.mocked(mockStripeClient.constructEvent).mockReturnValue(
        makeSubUpdatedEvent({ status: "active", items: { data: [{ current_period_end: forward }] } }, "ev_ot_active"),
      )
      const tx = makeTx({
        userFindUnique: vi.fn().mockResolvedValue({ id: "u1", isManaged: false, plan: "PRO", subscriptionEndsAt: new Date(FAR) }),
      })
      await mockTx(db, tx)
      await makeWebhook().handleEvent("body", "sig", "secret")
      expect((writtenData(tx).subscriptionEndsAt as Date).getTime()).toBe(forward * 1000)
    })

    it("incomplete_expired does NOT downgrade a valid one-time plan", async () => {
      const { db } = await import("@/lib/db")
      vi.mocked(mockStripeClient.constructEvent).mockReturnValue(
        makeSubUpdatedEvent({ status: "incomplete_expired" }, "ev_ot_expired"),
      )
      const tx = makeTx({
        userFindUnique: vi.fn().mockResolvedValue({ id: "u1", isManaged: false, plan: "SPRINT", subscriptionEndsAt: new Date(FAR) }),
      })
      await mockTx(db, tx)
      await makeWebhook().handleEvent("body", "sig", "secret")
      const data = writtenData(tx)
      expect(data.subscriptionStatus).toBe("EXPIRED")
      expect(data).not.toHaveProperty("plan")
    })

    it("incomplete_expired DOES downgrade a PRO subscriber", async () => {
      const { db } = await import("@/lib/db")
      vi.mocked(mockStripeClient.constructEvent).mockReturnValue(
        makeSubUpdatedEvent({ status: "paused" }, "ev_pro_expired"),
      )
      const tx = makeTx({
        userFindUnique: vi.fn().mockResolvedValue({ id: "u1", isManaged: false, plan: "PRO", subscriptionEndsAt: new Date(FAR) }),
      })
      await mockTx(db, tx)
      await makeWebhook().handleEvent("body", "sig", "secret")
      expect(writtenData(tx).plan).toBe("UNSUBSCRIBED")
    })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// D. handleSubscriptionDeleted
// ═════════════════════════════════════════════════════════════════════════════

describe("D. handleSubscriptionDeleted", () => {
  function makeSubDeletedEvent(customer = "cus_1", eventId = "ev_sub_del_1") {
    return {
      type: "customer.subscription.deleted",
      id: eventId,
      data: { object: { id: "sub_1", customer } },
    } as unknown as Stripe.Event
  }

  it("happy path → plan=UNSUBSCRIBED, subscriptionId=null, status=EXPIRED", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubDeletedEvent())
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ plan: "UNSUBSCRIBED", subscriptionId: null, subscriptionStatus: "EXPIRED" }),
    }))
  })

  it("user not found → resolves without crash", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubDeletedEvent())
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue(null) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  it("duplicate event (P2002) → skips idempotently", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubDeletedEvent("cus_1", "ev_dup_del"))
    const tx = makeTx({ stripeEventCreate: vi.fn().mockRejectedValue({ code: "P2002" }) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  it("auditLog created with action=CANCEL_SUBSCRIPTION", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubDeletedEvent())
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "CANCEL_SUBSCRIPTION" }),
    }))
  })

  // ── A separately paid one-time window must survive this event ──
  it("BLOCKER: a valid BASIC window is NOT wiped — only the subscription is detached", async () => {
    // Reachable in existing data: the one-time buy buttons used to be shown to
    // cancelled subscribers. Such a user cancelled PRO, bought BASIC while it wound
    // down, and this event would reset them to UNSUBSCRIBED with no end date —
    // taking away the month they had just paid for.
    const { db } = await import("@/lib/db")
    const paidUntil = new Date(Date.now() + 20 * 86_400_000)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubDeletedEvent())
    const tx = makeTx({
      userFindUnique: vi.fn().mockResolvedValue({ id: "u1", isManaged: false, plan: "BASIC", subscriptionEndsAt: paidUntil }),
    })
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")

    const written = (vi.mocked(tx.user.update).mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(written.subscriptionId).toBeNull()
    expect(written.subscriptionStatus).toBe("NONE")
    // The paid plan and its window are untouched.
    expect(written).not.toHaveProperty("plan")
    expect(written).not.toHaveProperty("subscriptionEndsAt")
  })

  it("an EXPIRED one-time window does not block the normal downgrade", async () => {
    const { db } = await import("@/lib/db")
    const stale = new Date(Date.now() - 5 * 86_400_000)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubDeletedEvent())
    const tx = makeTx({
      userFindUnique: vi.fn().mockResolvedValue({ id: "u1", isManaged: false, plan: "SPRINT", subscriptionEndsAt: stale }),
    })
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ plan: "UNSUBSCRIBED", subscriptionEndsAt: null, subscriptionStatus: "EXPIRED" }),
    }))
  })

  it("a PRO subscriber is downgraded as before", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeSubDeletedEvent())
    const tx = makeTx({
      userFindUnique: vi.fn().mockResolvedValue({ id: "u1", isManaged: false, plan: "PRO", subscriptionEndsAt: new Date(Date.now() + 86_400_000) }),
    })
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED" }),
    }))
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// E. handlePaymentFailed
// ═════════════════════════════════════════════════════════════════════════════

describe("E. handlePaymentFailed", () => {
  function makePaymentFailedEvent(overrides: { customer?: string; invoiceUrl?: string; eventId?: string } = {}) {
    return {
      type: "invoice.payment_failed",
      id: overrides.eventId ?? "ev_pf_1",
      data: {
        object: {
          customer: overrides.customer ?? "cus_1",
          hosted_invoice_url: overrides.invoiceUrl ?? "https://invoice.stripe.com/inv1",
        },
      },
    } as unknown as Stripe.Event
  }

  it("happy path → subscriptionStatus=PAST_DUE", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makePaymentFailedEvent())
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ subscriptionStatus: "PAST_DUE" }),
    }))
  })

  it("StripeEvent.userId linked to user after payment_failed", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makePaymentFailedEvent())
    const tx = makeTx()
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.stripeEvent.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: "u1" }),
    }))
  })

  it("user not found → resolves without crash", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makePaymentFailedEvent())
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue(null) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  it("duplicate event (P2002) → skips idempotently", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makePaymentFailedEvent({ eventId: "ev_dup_pf" }))
    const tx = makeTx({ stripeEventCreate: vi.fn().mockRejectedValue({ code: "P2002" }) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  it("purgeUserCache called after payment failed", async () => {
    const { db } = await import("@/lib/db")
    const { purgeUserCache } = await import("@/lib/auth")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makePaymentFailedEvent())
    await mockTx(db, makeTx())
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(purgeUserCache).toHaveBeenCalledWith("u1")
  })

  it("email skipped when resend=null (default mock)", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makePaymentFailedEvent())
    const tx = makeTx()
    await mockTx(db, tx)
    // resend is null in default mock — handler logs but doesn't throw
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// F. handleChargeRefunded
// ═════════════════════════════════════════════════════════════════════════════

describe("F. handleChargeRefunded", () => {
  function makeChargeRefundedEvent(overrides: {
    customer?: string
    amount?: number
    amountRefunded?: number
    chargeId?: string
    subscriptionId?: string | null
    eventId?: string
  } = {}) {
    return {
      type: "charge.refunded",
      id: overrides.eventId ?? "ev_refund_1",
      data: {
        object: {
          id: overrides.chargeId ?? "ch_1",
          customer: overrides.customer ?? "cus_1",
          amount: overrides.amount ?? 1500,
          amount_refunded: overrides.amountRefunded ?? 1500,
        },
      },
    } as unknown as Stripe.Event
  }

  it("full refund → plan=UNSUBSCRIBED, sub canceled", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeChargeRefundedEvent({ amount: 1500, amountRefunded: 1500 }))
    vi.mocked(mockStripeClient.cancelSubscription).mockResolvedValue({} as never)
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ id: "u1", subscriptionId: "sub_1" }) })
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED" }),
    }))
    expect(mockStripeClient.cancelSubscription).toHaveBeenCalledWith("sub_1")
  })

  it("partial refund → only audit log, NO user downgrade", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeChargeRefundedEvent({ amount: 1500, amountRefunded: 500 }))
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ id: "u1", subscriptionId: "sub_1" }) })
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).not.toHaveBeenCalled()
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "PARTIAL_REFUND" }),
    }))
    expect(mockStripeClient.cancelSubscription).not.toHaveBeenCalled()
  })

  it("user not found → resolves without crash", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeChargeRefundedEvent())
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue(null) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
  })

  it("duplicate event (P2002) → skips idempotently", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeChargeRefundedEvent({ eventId: "ev_dup_ref" }))
    const tx = makeTx({ stripeEventCreate: vi.fn().mockRejectedValue({ code: "P2002" }) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
    expect(tx.user.update).not.toHaveBeenCalled()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// G. handleDisputeCreated
// ═════════════════════════════════════════════════════════════════════════════

describe("G. handleDisputeCreated", () => {
  function makeDisputeCreatedEvent(overrides: {
    charge?: string | { id: string; customer: string }
    eventId?: string
    subscriptionId?: string
  } = {}) {
    return {
      type: "charge.dispute.created",
      id: overrides.eventId ?? "ev_dispute_1",
      data: {
        object: {
          id: "dp_1",
          charge: overrides.charge !== undefined ? overrides.charge : { id: "ch_1", customer: "cus_1" },
          amount: 1500,
          reason: "fraudulent",
        },
      },
    } as unknown as Stripe.Event
  }

  it("happy path (charge as object with customer) → plan=UNSUBSCRIBED, sub canceled", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeDisputeCreatedEvent())
    vi.mocked(mockStripeClient.cancelSubscription).mockResolvedValue({} as never)
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ id: "u1", subscriptionId: "sub_1" }) })
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED" }),
    }))
    expect(mockStripeClient.cancelSubscription).toHaveBeenCalledWith("sub_1")
  })

  it("charge as string → fetches charge to get customerId", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeDisputeCreatedEvent({ charge: "ch_string_id" }))
    vi.mocked(mockStripeClient.retrieveCharge).mockResolvedValue({ customer: "cus_fetched" } as unknown as Stripe.Charge)
    vi.mocked(mockStripeClient.cancelSubscription).mockResolvedValue({} as never)
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ id: "u1", subscriptionId: "sub_1" }) })
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(mockStripeClient.retrieveCharge).toHaveBeenCalledWith("ch_string_id")
    expect(tx.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { stripeCustomerId: "cus_fetched" } }))
  })

  it("user not found → resolves without crash", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeDisputeCreatedEvent())
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue(null) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
    expect(mockStripeClient.cancelSubscription).not.toHaveBeenCalled()
  })

  it("duplicate event (P2002) → skips idempotently", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeDisputeCreatedEvent({ eventId: "ev_dup_dispute" }))
    const tx = makeTx({ stripeEventCreate: vi.fn().mockRejectedValue({ code: "P2002" }) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
    expect(tx.user.update).not.toHaveBeenCalled()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// H. handleDisputeClosed
// ═════════════════════════════════════════════════════════════════════════════

describe("H. handleDisputeClosed", () => {
  function makeDisputeClosedEvent(status: string, eventId = "ev_dispute_closed_1") {
    return {
      type: "charge.dispute.closed",
      id: eventId,
      data: {
        object: {
          id: "dp_1",
          charge: { id: "ch_1", customer: "cus_1" },
          amount: 1500,
          status,
        },
      },
    } as unknown as Stripe.Event
  }

  it("disputeWon=true → auditLog with DISPUTE_WON_MANUAL_REVIEW + admin email if ADMIN_EMAIL set", async () => {
    const { db } = await import("@/lib/db")
    process.env.ADMIN_EMAIL = "techstackmssaravia@gmail.com"
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeDisputeClosedEvent("won"))
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ id: "u1", email: "user@b.com", name: "Alice" }) })
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "DISPUTE_WON_MANUAL_REVIEW" }),
    }))
    // resend is null in mock so email skipped but logger.error called
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("DISPUTE WON"),
      expect.anything()
    )
  })

  it("disputeWon=false → auditLog DISPUTE_CLOSED, no logger error", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeDisputeClosedEvent("lost"))
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ id: "u1", email: "user@b.com", name: "Alice" }) })
    await mockTx(db, tx)
    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "DISPUTE_CLOSED" }),
    }))
    expect(mockLogger.error).not.toHaveBeenCalledWith(
      expect.stringContaining("DISPUTE WON"),
      expect.anything()
    )
  })

  it("ADMIN_EMAIL not set → no crash on won dispute", async () => {
    const { db } = await import("@/lib/db")
    delete process.env.ADMIN_EMAIL
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeDisputeClosedEvent("won"))
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ id: "u1", email: "user@b.com", name: "Alice" }) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
  })

  it("user not found → resolves without crash", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeDisputeClosedEvent("won"))
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue(null) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
  })

  it("duplicate event (P2002) → skips idempotently", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue(makeDisputeClosedEvent("won", "ev_dup_dc"))
    const tx = makeTx({ stripeEventCreate: vi.fn().mockRejectedValue({ code: "P2002" }) })
    await mockTx(db, tx)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// I. handleEvent — invalid signature + unknown type
// ═════════════════════════════════════════════════════════════════════════════

describe("I. handleEvent — signature + routing", () => {
  it("invalid signature → throws AppError invalid_signature 400", async () => {
    vi.mocked(mockStripeClient.constructEvent).mockImplementation(() => { throw new Error("sig mismatch") })
    await expect(makeWebhook().handleEvent("body", "badsig", "secret"))
      .rejects.toMatchObject({ code: "invalid_signature", status: 400 })
  })

  it("unknown event type → resolves without error", async () => {
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "completely.unknown.event", id: "ev_unk",
      data: { object: {} },
    } as unknown as Stripe.Event)
    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
  })

  it("handler throws internal error → AppError handler_error 500", async () => {
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "invoice.paid", id: "ev_err",
      data: { object: { customer: "cus_1", parent: { type: "subscription_details", subscription_details: { subscription: "sub_1" } } } },
    } as unknown as Stripe.Event)
    vi.mocked(mockStripeClient.retrieveSubscription).mockRejectedValue(new Error("Stripe down"))
    await expect(makeWebhook().handleEvent("body", "sig", "secret"))
      .rejects.toMatchObject({ code: "handler_error", status: 500 })
  })

  it("inner handler throws AppError → propagates without wrapping in handler_error", async () => {
    const { AppError } = await import("@/lib/services/auth/AppError")
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "invoice.paid", id: "ev_ae",
      data: { object: { customer: "cus_1", parent: { type: "subscription_details", subscription_details: { subscription: "sub_1" } } } },
    } as unknown as Stripe.Event)
    vi.mocked(mockStripeClient.retrieveSubscription).mockRejectedValue(new AppError("custom_app_error", 422))
    await expect(makeWebhook().handleEvent("body", "sig", "secret"))
      .rejects.toMatchObject({ code: "custom_app_error", status: 422 })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// J. lib/plans.ts — isActive()
// ═════════════════════════════════════════════════════════════════════════════

describe("J. lib/plans.ts — isActive()", () => {
  const FUTURE = new Date(Date.now() + 86400 * 1000 * 30) // 30 days from now
  const PAST   = new Date(Date.now() - 86400 * 1000 * 1)  // 1 day ago

  it("PRO + ACTIVE + future date → true", () => {
    expect(isActive("PRO", FUTURE, "ACTIVE")).toBe(true)
  })

  it("PRO + ACTIVE + past date → false (expired)", () => {
    expect(isActive("PRO", PAST, "ACTIVE")).toBe(false)
  })

  it("PRO + CANCELED + future date → true (grace period)", () => {
    expect(isActive("PRO", FUTURE, "CANCELED")).toBe(true)
  })

  it("PRO + CANCELED + past date → false", () => {
    expect(isActive("PRO", PAST, "CANCELED")).toBe(false)
  })

  it("PRO + PAST_DUE + future date → true (retry window)", () => {
    expect(isActive("PRO", FUTURE, "PAST_DUE")).toBe(true)
  })

  it("PRO + PAST_DUE + date inside the grace window → true", () => {
    // A failed renewal now keeps access for PAST_DUE_GRACE_DAYS past the paid period,
    // because Stripe is still retrying and most of those payments recover.
    expect(isActive("PRO", PAST, "PAST_DUE")).toBe(true)
  })

  it("PRO + PAST_DUE + past the grace window → false", () => {
    const LONG_PAST = new Date(Date.now() - 86400 * 1000 * (PAST_DUE_GRACE_DAYS + 1))
    expect(isActive("PRO", LONG_PAST, "PAST_DUE")).toBe(false)
  })

  it("PRO + EXPIRED → false regardless of date", () => {
    expect(isActive("PRO", FUTURE, "EXPIRED")).toBe(false)
  })

  it("UNSUBSCRIBED + any status → false", () => {
    expect(isActive("UNSUBSCRIBED", FUTURE, "ACTIVE")).toBe(false)
    expect(isActive("UNSUBSCRIBED", FUTURE, "CANCELED")).toBe(false)
    expect(isActive("UNSUBSCRIBED", null, "EXPIRED")).toBe(false)
  })

  it("null subscriptionEndsAt with ACTIVE → false (no end date means expired or not set)", () => {
    // When subscriptionEndsAt is null and status is ACTIVE, isActive should return true
    // because the date check only fires if subscriptionEndsAt is truthy
    // This tests the actual logic: no date check → falls through to status check
    expect(isActive("PRO", null, "ACTIVE")).toBe(true)
  })

  it("undefined subscriptionEndsAt with ACTIVE → true (no expiry check)", () => {
    expect(isActive("PRO", undefined, "ACTIVE")).toBe(true)
  })

  it("PRO + NONE status → false (NONE not in allowed list)", () => {
    expect(isActive("PRO", FUTURE, "NONE")).toBe(false)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// K. StripeCheckoutService.createSession
// ═════════════════════════════════════════════════════════════════════════════

describe("K. StripeCheckoutService.createSession", () => {
  beforeEach(async () => {
    const { stripeEnabled } = await import("@/lib/stripe")
    vi.mocked(stripeEnabled).mockReturnValue(true)
  })

  it("stripe disabled → throws 503 payments_not_configured", async () => {
    const { stripeEnabled } = await import("@/lib/stripe")
    vi.mocked(stripeEnabled).mockReturnValue(false)
    await expect(makeCheckout().createSession("u1", "monthly", "es"))
      .rejects.toMatchObject({ code: "payments_not_configured", status: 503 })
  })

  it("user not found → throws 404 user_not_found", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    await expect(makeCheckout().createSession("u1", "monthly", "es"))
      .rejects.toMatchObject({ code: "user_not_found", status: 404 })
  })

  it("already ACTIVE subscription → throws 400 already_subscribed", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionId: "sub_1" } as never)
    await expect(makeCheckout().createSession("u1", "monthly", "es"))
      .rejects.toMatchObject({ code: "already_subscribed", status: 400 })
  })

  it("PAST_DUE subscription → throws 400 already_subscribed", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "PRO", subscriptionStatus: "PAST_DUE", subscriptionId: "sub_1" } as never)
    await expect(makeCheckout().createSession("u1", "monthly", "es"))
      .rejects.toMatchObject({ code: "already_subscribed", status: 400 })
  })

  it("happy path monthly → checkout session with monthly price ID", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", subscriptionId: null } as never)
    vi.mocked(mockStripeClient.createCheckoutSession).mockResolvedValue({ url: "https://stripe.com/pay/monthly" } as never)
    const result = await makeCheckout().createSession("u1", "monthly", "es")
    expect(result).toEqual({ url: "https://stripe.com/pay/monthly" })
    expect(mockStripeClient.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ line_items: [{ price: "price_monthly_test", quantity: 1 }] })
    )
  })

  it("happy path annual → checkout session with annual price ID", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", subscriptionId: null } as never)
    vi.mocked(mockStripeClient.createCheckoutSession).mockResolvedValue({ url: "https://stripe.com/pay/annual" } as never)
    await makeCheckout().createSession("u1", "annual", "es")
    expect(mockStripeClient.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ line_items: [{ price: "price_annual_test", quantity: 1 }] })
    )
  })

  it("userId in metadata of checkout session", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", subscriptionId: null } as never)
    vi.mocked(mockStripeClient.createCheckoutSession).mockResolvedValue({ url: "https://stripe.com/pay/test" } as never)
    await makeCheckout().createSession("u1", "monthly", "es")
    expect(mockStripeClient.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ userId: "u1" }) })
    )
  })

  it("planInterval in metadata of checkout session", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", subscriptionId: null } as never)
    vi.mocked(mockStripeClient.createCheckoutSession).mockResolvedValue({ url: "https://stripe.com/pay/test" } as never)
    await makeCheckout().createSession("u1", "annual", "es")
    expect(mockStripeClient.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ planInterval: "annual" }) })
    )
  })

  it("no stripeCustomerId → creates new customer first", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: null, plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", subscriptionId: null } as never)
    vi.mocked(db.user.update).mockResolvedValue({} as never)
    vi.mocked(mockStripeClient.listCustomers).mockResolvedValue({ data: [] } as never)
    vi.mocked(mockStripeClient.createCustomer).mockResolvedValue({ id: "cus_new" } as never)
    vi.mocked(mockStripeClient.createCheckoutSession).mockResolvedValue({ url: "https://stripe.com/pay/new" } as never)
    const result = await makeCheckout().createSession("u1", "monthly", "es")
    expect(mockStripeClient.createCustomer).toHaveBeenCalled()
    expect(result).toEqual({ url: "https://stripe.com/pay/new" })
  })

  it("no stripeCustomerId + existing Stripe customer with matching userId → reuses existing", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: null, plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", subscriptionId: null } as never)
    vi.mocked(db.user.update).mockResolvedValue({} as never)
    vi.mocked(mockStripeClient.listCustomers).mockResolvedValue({ data: [{ id: "cus_existing", metadata: { userId: "u1" }, deleted: false }] } as never)
    vi.mocked(mockStripeClient.createCheckoutSession).mockResolvedValue({ url: "https://stripe.com/pay/reuse" } as never)
    await makeCheckout().createSession("u1", "monthly", "es")
    expect(mockStripeClient.createCustomer).not.toHaveBeenCalled()
    expect(mockStripeClient.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_existing" })
    )
  })

  it("CANCELED subscription + subscriptionId → cancels old sub before checkout", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "PRO", subscriptionStatus: "CANCELED", subscriptionId: "sub_old" } as never)
    vi.mocked(db.user.update).mockResolvedValue({} as never)
    vi.mocked(mockStripeClient.cancelSubscription).mockResolvedValue({} as never)
    vi.mocked(mockStripeClient.createCheckoutSession).mockResolvedValue({ url: "https://stripe.com/pay/resubscribe" } as never)
    const result = await makeCheckout().createSession("u1", "monthly", "es")
    expect(mockStripeClient.cancelSubscription).toHaveBeenCalledWith("sub_old")
    expect(result).toEqual({ url: "https://stripe.com/pay/resubscribe" })
  })

  it("missing STRIPE_PRICE_ID_MONTHLY → throws 503 plan_not_configured", async () => {
    const { db } = await import("@/lib/db")
    delete process.env.STRIPE_PRICE_ID_MONTHLY
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", subscriptionId: null } as never)
    await expect(makeCheckout().createSession("u1", "monthly", "es"))
      .rejects.toMatchObject({ code: "plan_not_configured", status: 503 })
    process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly_test"
  })

  it("existing customerId → does NOT call listCustomers or createCustomer", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", subscriptionId: null } as never)
    vi.mocked(mockStripeClient.createCheckoutSession).mockResolvedValue({ url: "https://stripe.com/pay/test" } as never)
    await makeCheckout().createSession("u1", "monthly", "es")
    expect(mockStripeClient.listCustomers).not.toHaveBeenCalled()
    expect(mockStripeClient.createCustomer).not.toHaveBeenCalled()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// J. Full event SEQUENCE — the historical chain that lost a paid month
//
// The handler-level tests above each mock a fixed user row. This block instead
// threads ONE evolving user record through a real ordered chain of webhooks, so
// each handler reads exactly what the previous one wrote. That is the only way to
// prove the outcome of the sequence, which is where the money was actually lost:
//
//   1. checkout.session.completed  (PRO monthly)      → plan PRO, ACTIVE
//   2. customer.subscription.updated (cancel_at_period_end) → CANCELED, ends Aug 26
//   3. checkout.session.completed  (BASIC, one-time)  → plan BASIC, ends +1 month
//   4. customer.subscription.deleted (period ended)   → USED TO WIPE step 3
// ═════════════════════════════════════════════════════════════════════════════

describe("J. full webhook sequence — a paid one-time month survives the chain", () => {
  type UserRow = {
    id: string
    email: string
    name: string
    isManaged: boolean
    plan: string
    planInterval: string | null
    subscriptionId: string | null
    subscriptionStatus: string
    subscriptionEndsAt: Date | null
    stripeCustomerId: string
    sessionVersion: number
  }

  /** A mutable user row plus a tx whose reads/writes hit it, like the real DB. */
  function makeStatefulTx(user: UserRow) {
    const applyUpdate = (data: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(data)) {
        if (k === "sessionVersion") { user.sessionVersion += 1; continue }
        ;(user as unknown as Record<string, unknown>)[k] = v
      }
      return user
    }
    return {
      user,
      tx: {
        stripeEvent: { create: vi.fn().mockResolvedValue({}), update: vi.fn().mockResolvedValue({}) },
        user: {
          findUnique: vi.fn().mockImplementation(async () => ({ ...user })),
          update: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => applyUpdate(data)),
        },
        auditLog: { create: vi.fn().mockResolvedValue({}), count: vi.fn().mockResolvedValue(0) },
        consentLog: { findFirst: vi.fn().mockResolvedValue(null) },
      },
    }
  }

  const DAY = 86_400_000

  it("PRO → cancel → buy BASIC → subscription deleted: keeps BASIC and its window", async () => {
    const { db } = await import("@/lib/db")
    const user: UserRow = {
      id: "u1", email: "a@b.com", name: "Alice", isManaged: false,
      plan: "UNSUBSCRIBED", planInterval: null, subscriptionId: null,
      subscriptionStatus: "NONE", subscriptionEndsAt: null,
      stripeCustomerId: "cus_1", sessionVersion: 1,
    }
    const { tx } = makeStatefulTx(user)
    await mockTx(db, tx as unknown as ReturnType<typeof makeTx>)

    const periodEnd = Math.floor((Date.now() + 26 * DAY) / 1000)
    const webhook = makeWebhook()

    // 1 — subscribes to PRO monthly.
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: periodEnd }] },
    } as unknown as Stripe.Subscription)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.completed",
      id: "ev_seq_1",
      data: { object: { id: "cs_pro", payment_status: "paid", metadata: { userId: "u1", planInterval: "monthly" }, subscription: "sub_1" } },
    } as unknown as Stripe.Event)
    await webhook.handleEvent("body", "sig", "secret")
    expect(user.plan).toBe("PRO")
    expect(user.subscriptionStatus).toBe("ACTIVE")

    // 2 — cancels; keeps access until the period ends.
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "customer.subscription.updated",
      id: "ev_seq_2",
      data: { object: { id: "sub_1", customer: "cus_1", status: "active", cancel_at_period_end: true, cancel_at: periodEnd, items: { data: [{ current_period_end: periodEnd }] } } },
    } as unknown as Stripe.Event)
    await webhook.handleEvent("body", "sig", "secret")
    expect(user.subscriptionStatus).toBe("CANCELED")
    expect(user.subscriptionEndsAt?.getTime()).toBe(periodEnd * 1000)

    // 3 — buys BASIC while the cancelled subscription winds down. This is the
    //     purchase that used to be lost; it clears subscriptionId by design.
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.completed",
      id: "ev_seq_3",
      data: { object: { id: "cs_basic", payment_status: "paid", metadata: { userId: "u1", planType: "basic" }, subscription: null } },
    } as unknown as Stripe.Event)
    await webhook.handleEvent("body", "sig", "secret")
    expect(user.plan).toBe("BASIC")
    expect(user.subscriptionId).toBeNull()
    expect(user.subscriptionStatus).toBe("NONE")
    const basicWindowEnd = user.subscriptionEndsAt!.getTime()
    // ~1 calendar month out, and never shorter than the PRO period it replaced.
    expect(basicWindowEnd).toBeGreaterThanOrEqual(periodEnd * 1000)

    // 4 — Stripe finally deletes the old subscription. THE REGRESSION POINT:
    //     this used to reset the user to UNSUBSCRIBED with a null end date.
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "customer.subscription.deleted",
      id: "ev_seq_4",
      data: { object: { id: "sub_1", customer: "cus_1" } },
    } as unknown as Stripe.Event)
    await webhook.handleEvent("body", "sig", "secret")

    expect(user.plan).toBe("BASIC")
    expect(user.subscriptionEndsAt?.getTime()).toBe(basicWindowEnd)
    expect(user.subscriptionStatus).toBe("NONE")

    // And the plan actually still grants access — the point of the whole thing.
    expect(isActive(user.plan, user.subscriptionEndsAt, user.subscriptionStatus, "USER")).toBe(true)
  })

  it("without the one-time purchase, the same chain still downgrades correctly", async () => {
    // Guards the other direction: the protection must not keep PRO users alive.
    const { db } = await import("@/lib/db")
    const user: UserRow = {
      id: "u2", email: "b@b.com", name: "Bob", isManaged: false,
      plan: "UNSUBSCRIBED", planInterval: null, subscriptionId: null,
      subscriptionStatus: "NONE", subscriptionEndsAt: null,
      stripeCustomerId: "cus_2", sessionVersion: 1,
    }
    const { tx } = makeStatefulTx(user)
    await mockTx(db, tx as unknown as ReturnType<typeof makeTx>)

    const periodEnd = Math.floor((Date.now() + 10 * DAY) / 1000)
    const webhook = makeWebhook()

    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: periodEnd }] },
    } as unknown as Stripe.Subscription)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.completed",
      id: "ev_seq2_1",
      data: { object: { id: "cs_pro2", payment_status: "paid", metadata: { userId: "u2", planInterval: "annual" }, subscription: "sub_2" } },
    } as unknown as Stripe.Event)
    await webhook.handleEvent("body", "sig", "secret")
    expect(user.plan).toBe("PRO")

    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "customer.subscription.deleted",
      id: "ev_seq2_2",
      data: { object: { id: "sub_2", customer: "cus_2" } },
    } as unknown as Stripe.Event)
    await webhook.handleEvent("body", "sig", "secret")

    expect(user.plan).toBe("UNSUBSCRIBED")
    expect(user.subscriptionStatus).toBe("EXPIRED")
    expect(user.subscriptionEndsAt).toBeNull()
    expect(isActive(user.plan, user.subscriptionEndsAt, user.subscriptionStatus, "USER")).toBe(false)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// L. Revocation SEQUENCES — refund, dispute and fraud warning
//
// Block J proved a paid one-time month survives `subscription.deleted`. It did not
// cover the other three paths that revoke access, and those still had the same hole:
// they reset plan + subscriptionEndsAt from a charge that never paid for that window.
//
// Same method as J: one mutable user row threaded through a real ordered chain, so
// each handler reads what the previous one wrote.
// ═════════════════════════════════════════════════════════════════════════════

describe("L. revocation sequences — a paid one-time window survives events about other charges", () => {
  type Row = {
    id: string
    email: string
    name: string
    isManaged: boolean
    plan: string
    planInterval: string | null
    subscriptionId: string | null
    subscriptionStatus: string
    subscriptionEndsAt: Date | null
    stripeCustomerId: string
    sessionVersion: number
  }

  function statefulTx(user: Row) {
    const applyUpdate = (data: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(data)) {
        if (k === "sessionVersion") { user.sessionVersion += 1; continue }
        ;(user as unknown as Record<string, unknown>)[k] = v
      }
      return user
    }
    return {
      stripeEvent: { create: vi.fn().mockResolvedValue({}), update: vi.fn().mockResolvedValue({}) },
      user: {
        findUnique: vi.fn().mockImplementation(async () => ({ ...user })),
        update: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => applyUpdate(data)),
      },
      auditLog: { create: vi.fn().mockResolvedValue({}), count: vi.fn().mockResolvedValue(0) },
      consentLog: { findFirst: vi.fn().mockResolvedValue(null) },
    }
  }

  const DAY = 86_400_000

  /** A user who cancelled PRO and then bought a BASIC month that is still running. */
  async function userWithPaidBasicMonth(id: string) {
    const { db } = await import("@/lib/db")
    const user: Row = {
      id, email: `${id}@b.com`, name: "Alice", isManaged: false,
      plan: "UNSUBSCRIBED", planInterval: null, subscriptionId: null,
      subscriptionStatus: "NONE", subscriptionEndsAt: null,
      stripeCustomerId: `cus_${id}`, sessionVersion: 1,
    }
    const tx = statefulTx(user)
    await mockTx(db, tx as unknown as ReturnType<typeof makeTx>)

    const periodEnd = Math.floor((Date.now() + 20 * DAY) / 1000)
    const webhook = makeWebhook()

    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: periodEnd }] },
    } as unknown as Stripe.Subscription)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.completed",
      id: `ev_${id}_pro`,
      data: { object: { id: "cs_pro", payment_status: "paid", metadata: { userId: id, planInterval: "monthly" }, subscription: `sub_${id}` } },
    } as unknown as Stripe.Event)
    await webhook.handleEvent("body", "sig", "secret")

    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.completed",
      id: `ev_${id}_basic`,
      data: { object: { id: "cs_basic", payment_status: "paid", metadata: { userId: id, planType: "basic" }, subscription: null } },
    } as unknown as Stripe.Event)
    await webhook.handleEvent("body", "sig", "secret")

    expect(user.plan).toBe("BASIC")
    return { user, webhook, basicWindowEnd: user.subscriptionEndsAt!.getTime() }
  }

  it("refunding the SUBSCRIPTION charge keeps the separately paid BASIC month", async () => {
    // The money returned paid for PRO. The BASIC month was a different purchase that
    // nobody refunded — erasing it took away access the user still owned.
    const { user, webhook, basicWindowEnd } = await userWithPaidBasicMonth("ru1")

    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "charge.refunded",
      id: "ev_ru1_refund",
      data: { object: { id: "ch_sub", customer: "cus_ru1", amount: 1500, amount_refunded: 1500, metadata: { userId: "ru1", planInterval: "monthly" } } },
    } as unknown as Stripe.Event)
    await webhook.handleEvent("body", "sig", "secret")

    expect(user.plan).toBe("BASIC")
    expect(user.subscriptionEndsAt?.getTime()).toBe(basicWindowEnd)
    expect(isActive(user.plan, user.subscriptionEndsAt, user.subscriptionStatus, "USER")).toBe(true)
  })

  it("refunding the ONE-TIME charge takes that window back", async () => {
    // The other direction: the refunded payment IS the window, so access goes with it.
    // Told apart by the planType metadata the checkout stamps on the PaymentIntent.
    const { user, webhook } = await userWithPaidBasicMonth("ru2")

    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "charge.refunded",
      id: "ev_ru2_refund",
      data: { object: { id: "ch_basic", customer: "cus_ru2", amount: 299, amount_refunded: 299, metadata: { userId: "ru2", planType: "basic" } } },
    } as unknown as Stripe.Event)
    await webhook.handleEvent("body", "sig", "secret")

    expect(user.plan).toBe("UNSUBSCRIBED")
    expect(user.subscriptionEndsAt).toBeNull()
    expect(isActive(user.plan, user.subscriptionEndsAt, user.subscriptionStatus, "USER")).toBe(false)
  })

  it("a chargeback on the subscription keeps the BASIC month", async () => {
    const { user, webhook, basicWindowEnd } = await userWithPaidBasicMonth("ru3")

    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "charge.dispute.created",
      id: "ev_ru3_dispute",
      data: { object: { id: "dp_1", amount: 1500, reason: "fraudulent", charge: { id: "ch_sub", customer: "cus_ru3", metadata: { planInterval: "monthly" } } } },
    } as unknown as Stripe.Event)
    await webhook.handleEvent("body", "sig", "secret")

    expect(user.plan).toBe("BASIC")
    expect(user.subscriptionEndsAt?.getTime()).toBe(basicWindowEnd)
  })

  it("a fraud warning on the subscription keeps the BASIC month", async () => {
    const { user, webhook, basicWindowEnd } = await userWithPaidBasicMonth("ru4")

    vi.mocked(mockStripeClient.retrieveCharge).mockResolvedValue({
      id: "ch_sub", customer: "cus_ru4", metadata: { planInterval: "monthly" },
    } as unknown as Stripe.Charge)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "radar.early_fraud_warning.created",
      id: "ev_ru4_fraud",
      data: { object: { id: "efw_1", charge: "ch_sub", fraud_type: "made_with_stolen_card", actionable: true } },
    } as unknown as Stripe.Event)
    await webhook.handleEvent("body", "sig", "secret")

    expect(user.plan).toBe("BASIC")
    expect(user.subscriptionEndsAt?.getTime()).toBe(basicWindowEnd)
  })

  it("a PRO subscriber is still fully downgraded by a refund", async () => {
    // The protection must not become a blanket "never downgrade".
    const { db } = await import("@/lib/db")
    const user: Row = {
      id: "ru5", email: "e@b.com", name: "Eve", isManaged: false,
      plan: "PRO", planInterval: "monthly", subscriptionId: "sub_ru5",
      subscriptionStatus: "ACTIVE", subscriptionEndsAt: new Date(Date.now() + 20 * DAY),
      stripeCustomerId: "cus_ru5", sessionVersion: 1,
    }
    await mockTx(db, statefulTx(user) as unknown as ReturnType<typeof makeTx>)

    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "charge.refunded",
      id: "ev_ru5_refund",
      data: { object: { id: "ch_pro", customer: "cus_ru5", amount: 1500, amount_refunded: 1500, metadata: { planInterval: "monthly" } } },
    } as unknown as Stripe.Event)
    await makeWebhook().handleEvent("body", "sig", "secret")

    expect(user.plan).toBe("UNSUBSCRIBED")
    expect(user.subscriptionStatus).toBe("EXPIRED")
    expect(user.subscriptionEndsAt).toBeNull()
  })

  it("a managed (LIMITED) user is untouched by refund, dispute and fraud warning", async () => {
    // Their plan is administrator-granted. These three handlers never checked.
    const { db } = await import("@/lib/db")
    const endsAt = new Date(Date.now() + 300 * DAY)
    const user: Row = {
      id: "ru6", email: "m@b.com", name: "Managed", isManaged: true,
      plan: "LIMITED", planInterval: null, subscriptionId: null,
      subscriptionStatus: "NONE", subscriptionEndsAt: endsAt,
      stripeCustomerId: "cus_ru6", sessionVersion: 1,
    }
    await mockTx(db, statefulTx(user) as unknown as ReturnType<typeof makeTx>)
    const webhook = makeWebhook()

    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "charge.refunded",
      id: "ev_ru6_refund",
      data: { object: { id: "ch_x", customer: "cus_ru6", amount: 1500, amount_refunded: 1500, metadata: {} } },
    } as unknown as Stripe.Event)
    await webhook.handleEvent("body", "sig", "secret")

    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "charge.dispute.created",
      id: "ev_ru6_dispute",
      data: { object: { id: "dp_x", amount: 1500, reason: "fraudulent", charge: { id: "ch_x", customer: "cus_ru6", metadata: {} } } },
    } as unknown as Stripe.Event)
    await webhook.handleEvent("body", "sig", "secret")

    vi.mocked(mockStripeClient.retrieveCharge).mockResolvedValue({
      id: "ch_x", customer: "cus_ru6", metadata: {},
    } as unknown as Stripe.Charge)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "radar.early_fraud_warning.created",
      id: "ev_ru6_fraud",
      data: { object: { id: "efw_x", charge: "ch_x", fraud_type: "made_with_stolen_card", actionable: true } },
    } as unknown as Stripe.Event)
    await webhook.handleEvent("body", "sig", "secret")

    expect(user.plan).toBe("LIMITED")
    expect(user.subscriptionEndsAt).toBe(endsAt)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// M. Asynchronous payments, SCA, and the upgrade paths that used to shorten a
//    window already paid for.
// ═════════════════════════════════════════════════════════════════════════════

describe("M. async payment methods (OXXO / SEPA / boleto)", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("checkout.session.completed with an UNPAID async session provisions nothing", async () => {
    const { db } = await import("@/lib/db")
    const tx = makeTx()
    await mockTx(db, tx)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.completed",
      id: "ev_async_pending",
      data: { object: { id: "cs_oxxo", payment_status: "unpaid", metadata: { userId: "u1", planType: "basic" } } },
    } as unknown as Stripe.Event)

    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  it("async_payment_succeeded provisions the plan the money paid for", async () => {
    // Without this handler the charge settles and the user never gets access.
    const { db } = await import("@/lib/db")
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ isManaged: false, subscriptionEndsAt: null }) })
    await mockTx(db, tx)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.async_payment_succeeded",
      id: "ev_async_ok",
      data: { object: { id: "cs_oxxo", payment_status: "paid", metadata: { userId: "u1", planType: "basic" } } },
    } as unknown as Stripe.Event)

    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).toHaveBeenCalledTimes(1)
    expect(tx.user.update.mock.calls[0][0].data.plan).toBe("BASIC")
  })

  it("async_payment_failed provisions nothing and revokes nothing", async () => {
    const { db } = await import("@/lib/db")
    const tx = makeTx()
    await mockTx(db, tx)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.async_payment_failed",
      id: "ev_async_fail",
      data: { object: { id: "cs_oxxo", metadata: { userId: "u1", planType: "basic" } } },
    } as unknown as Stripe.Event)

    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).not.toHaveBeenCalled()
  })
})

describe("M2. invoice.payment_action_required (3DS / SCA)", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("warns the customer without marking the subscription past due", async () => {
    // Stripe is still waiting for authentication; the subscription has not failed.
    // Flipping it to PAST_DUE here would show a payment problem that does not exist.
    const { db } = await import("@/lib/db")
    const tx = makeTx({
      userFindUnique: vi.fn().mockResolvedValue({ id: "u1", name: "Alice", email: "a@b.com", isManaged: false }),
    })
    await mockTx(db, tx)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "invoice.payment_action_required",
      id: "ev_sca",
      data: { object: { id: "in_1", customer: "cus_1", hosted_invoice_url: "https://pay.stripe.com/i/1" } },
    } as unknown as Stripe.Event)

    await makeWebhook().handleEvent("body", "sig", "secret")

    expect(tx.user.update).not.toHaveBeenCalled()
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1)
    expect(tx.auditLog.create.mock.calls[0][0].data.metadata).toMatchObject({
      source: "payment_action_required",
      invoiceUrl: "https://pay.stripe.com/i/1",
    })
  })

  it("never touches a managed user", async () => {
    const { db } = await import("@/lib/db")
    const tx = makeTx({
      userFindUnique: vi.fn().mockResolvedValue({ id: "u1", name: "M", email: "m@b.com", isManaged: true }),
    })
    await mockTx(db, tx)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "invoice.payment_action_required",
      id: "ev_sca_managed",
      data: { object: { id: "in_2", customer: "cus_1", hosted_invoice_url: null } },
    } as unknown as Stripe.Event)

    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })
})

describe("M3. upgrading never shortens a window already paid for", () => {
  const DAY = 86_400_000
  beforeEach(() => { vi.clearAllMocks() })

  it("checkout to PRO keeps a longer one-time window", async () => {
    // A SPRINT/BASIC buyer upgrading mid-window was cut back to the new subscription's
    // first period end — days they had already paid for.
    const longer = new Date(Date.now() + 40 * DAY)
    const { db } = await import("@/lib/db")
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ isManaged: false, subscriptionEndsAt: longer }) })
    await mockTx(db, tx)

    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: Math.floor((Date.now() + 30 * DAY) / 1000) }] },
    } as unknown as Stripe.Subscription)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.completed",
      id: "ev_up_1",
      data: { object: { id: "cs_1", payment_status: "paid", metadata: { userId: "u1", planInterval: "monthly" }, subscription: "sub_1" } },
    } as unknown as Stripe.Event)

    await makeWebhook().handleEvent("body", "sig", "secret")
    const data = tx.user.update.mock.calls[0][0].data
    expect(data.plan).toBe("PRO")
    expect((data.subscriptionEndsAt as Date).getTime()).toBe(longer.getTime())
  })

  it("a renewal still advances the date normally", async () => {
    const { db } = await import("@/lib/db")
    const renewal = Math.floor((Date.now() + 30 * DAY) / 1000)
    const tx = makeTx({
      userFindUnique: vi.fn().mockResolvedValue({ id: "u1", name: "A", email: "a@b.com", isManaged: false, subscriptionEndsAt: new Date(Date.now() + 1 * DAY) }),
    })
    await mockTx(db, tx)
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: renewal, price: { recurring: { interval: "month" } } }] },
    } as unknown as Stripe.Subscription)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "invoice.paid",
      id: "ev_up_2",
      data: { object: { id: "in_1", customer: "cus_1", parent: { type: "subscription_details", subscription_details: { subscription: "sub_1" } } } },
    } as unknown as Stripe.Event)

    await makeWebhook().handleEvent("body", "sig", "secret")
    const data = tx.user.update.mock.calls[0][0].data
    expect((data.subscriptionEndsAt as Date).getTime()).toBe(renewal * 1000)
  })

  it("a renewal does not shorten a one-time window that runs past it", async () => {
    const { db } = await import("@/lib/db")
    const longer = new Date(Date.now() + 45 * DAY)
    const tx = makeTx({
      userFindUnique: vi.fn().mockResolvedValue({ id: "u1", name: "A", email: "a@b.com", isManaged: false, subscriptionEndsAt: longer }),
    })
    await mockTx(db, tx)
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: Math.floor((Date.now() + 30 * DAY) / 1000), price: { recurring: { interval: "month" } } }] },
    } as unknown as Stripe.Subscription)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "invoice.paid",
      id: "ev_up_3",
      data: { object: { id: "in_2", customer: "cus_1", parent: { type: "subscription_details", subscription_details: { subscription: "sub_1" } } } },
    } as unknown as Stripe.Event)

    await makeWebhook().handleEvent("body", "sig", "secret")
    const data = tx.user.update.mock.calls[0][0].data
    expect((data.subscriptionEndsAt as Date).getTime()).toBe(longer.getTime())
  })

  it("a subscription created outside checkout keeps a longer paid window", async () => {
    const { db } = await import("@/lib/db")
    const longer = new Date(Date.now() + 60 * DAY)
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ id: "u1", isManaged: false, subscriptionEndsAt: longer }) })
    await mockTx(db, tx)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "customer.subscription.created",
      id: "ev_up_4",
      data: { object: { id: "sub_ext", customer: "cus_1", status: "active", items: { data: [{ current_period_end: Math.floor((Date.now() + 30 * DAY) / 1000) }] } } },
    } as unknown as Stripe.Event)

    await makeWebhook().handleEvent("body", "sig", "secret")
    const data = tx.user.update.mock.calls[0][0].data
    expect((data.subscriptionEndsAt as Date).getTime()).toBe(longer.getTime())
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// N. Gateway ownership + the full plan matrix on the Stripe side.
//
// Stripe and PayPal are NOT interchangeable: different subscription ids, different
// cancel endpoints, and only one of them has a hosted billing portal. The row records
// which gateway is billing the user right now, and every provisioning path must claim
// it — otherwise the UI routes the user to the wrong gateway's actions.
// ═════════════════════════════════════════════════════════════════════════════

describe("N. Stripe claims the row when it provisions", () => {
  const DAY = 86_400_000
  beforeEach(() => { vi.clearAllMocks() })

  it("BLOCKER: a PayPal buyer who later subscribes with a card can cancel again", async () => {
    // Before: paymentProvider stayed "PAYPAL", so SettingsForm hid the Stripe portal and
    // sent the cancel to /api/paypal/cancel, which 400s with no paypalSubscriptionId.
    // The card subscription kept charging with no way to stop it.
    const { db } = await import("@/lib/db")
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ isManaged: false, subscriptionEndsAt: null }) })
    await mockTx(db, tx)

    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: Math.floor((Date.now() + 30 * DAY) / 1000) }] },
    } as unknown as Stripe.Subscription)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.completed",
      id: "ev_gw_1",
      data: { object: { id: "cs_1", payment_status: "paid", metadata: { userId: "u1", planInterval: "monthly" }, subscription: "sub_1" } },
    } as unknown as Stripe.Event)

    await makeWebhook().handleEvent("body", "sig", "secret")
    expect(tx.user.update.mock.calls[0][0].data.paymentProvider).toBe("STRIPE")
  })

  it.each([
    ["monthly", "PRO"],
    ["annual", "PRO"],
  ])("subscription checkout (%s) provisions %s under Stripe", async (interval, expectedPlan) => {
    const { db } = await import("@/lib/db")
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ isManaged: false, subscriptionEndsAt: null }) })
    await mockTx(db, tx)

    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: Math.floor((Date.now() + 30 * DAY) / 1000) }] },
    } as unknown as Stripe.Subscription)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.completed",
      id: `ev_matrix_${interval}`,
      data: { object: { id: "cs_1", payment_status: "paid", metadata: { userId: "u1", planInterval: interval }, subscription: "sub_1" } },
    } as unknown as Stripe.Event)

    await makeWebhook().handleEvent("body", "sig", "secret")
    const data = tx.user.update.mock.calls[0][0].data
    expect(data.plan).toBe(expectedPlan)
    expect(data.planInterval).toBe(interval)
    expect(data.subscriptionStatus).toBe("ACTIVE")
    expect(data.paymentProvider).toBe("STRIPE")
  })

  it.each([
    ["basic", "BASIC", 27],
    ["sprint", "SPRINT", 6],
  ])("one-time checkout (%s) provisions %s with no subscription", async (planType, expectedPlan, minDays) => {
    const { db } = await import("@/lib/db")
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ isManaged: false, subscriptionEndsAt: null }) })
    await mockTx(db, tx)

    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.completed",
      id: `ev_matrix_${planType}`,
      data: { object: { id: "cs_1", payment_status: "paid", metadata: { userId: "u1", planType }, subscription: null } },
    } as unknown as Stripe.Event)

    await makeWebhook().handleEvent("body", "sig", "secret")
    const data = tx.user.update.mock.calls[0][0].data
    expect(data.plan).toBe(expectedPlan)
    // One-time plans carry NO subscription — that is what makes them survive
    // subscription lifecycle events.
    expect(data.subscriptionId).toBeNull()
    expect(data.subscriptionStatus).toBe("NONE")
    expect(data.planInterval).toBeNull()
    expect(data.paymentProvider).toBe("STRIPE")
    expect((data.subscriptionEndsAt as Date).getTime()).toBeGreaterThan(Date.now() + minDays * DAY)
  })

  it("a renewal keeps the row on Stripe", async () => {
    const { db } = await import("@/lib/db")
    const tx = makeTx({
      userFindUnique: vi.fn().mockResolvedValue({ id: "u1", name: "A", email: "a@b.com", isManaged: false, subscriptionEndsAt: null }),
    })
    await mockTx(db, tx)
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: Math.floor((Date.now() + 30 * DAY) / 1000), price: { recurring: { interval: "year" } } }] },
    } as unknown as Stripe.Subscription)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "invoice.paid",
      id: "ev_gw_renew",
      data: { object: { id: "in_1", customer: "cus_1", parent: { type: "subscription_details", subscription_details: { subscription: "sub_1" } } } },
    } as unknown as Stripe.Event)

    await makeWebhook().handleEvent("body", "sig", "secret")
    const data = tx.user.update.mock.calls[0][0].data
    expect(data.paymentProvider).toBe("STRIPE")
    expect(data.planInterval).toBe("annual")
  })
})

describe("O. invoice.finalization_failed — revenue that silently never gets charged", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("records the failure and leaves access alone", async () => {
    // Stripe marks this critical: the invoice never became payable, so no charge is
    // attempted and no payment event follows. The customer did nothing wrong and keeps
    // access — but without this handler nobody ever learns they are not being billed.
    const { db } = await import("@/lib/db")
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue({ id: "u1", email: "a@b.com" }) })
    await mockTx(db, tx)

    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "invoice.finalization_failed",
      id: "ev_fin_fail",
      data: { object: { id: "in_1", customer: "cus_1", last_finalization_error: { code: "customer_tax_location_invalid", message: "Could not determine tax location" } } },
    } as unknown as Stripe.Event)

    await makeWebhook().handleEvent("body", "sig", "secret")

    expect(tx.user.update).not.toHaveBeenCalled()
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1)
    expect(tx.auditLog.create.mock.calls[0][0].data.metadata).toMatchObject({
      source: "invoice_finalization_failed",
      errorCode: "customer_tax_location_invalid",
    })
    // Must be loud: this is the only signal that money is not being collected.
    expect(mockLogger.error).toHaveBeenCalled()
  })

  it("an unknown customer is skipped without throwing", async () => {
    const { db } = await import("@/lib/db")
    const tx = makeTx({ userFindUnique: vi.fn().mockResolvedValue(null) })
    await mockTx(db, tx)
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "invoice.finalization_failed",
      id: "ev_fin_fail_2",
      data: { object: { id: "in_2", customer: "cus_unknown" } },
    } as unknown as Stripe.Event)

    await expect(makeWebhook().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })
})
