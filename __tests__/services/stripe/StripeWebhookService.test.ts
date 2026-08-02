import { describe, it, expect, vi, beforeEach } from "vitest"
import type Stripe from "stripe"
import { StripeWebhookService } from "@/lib/services/stripe/StripeWebhookService"
import type { IStripeClient } from "@/lib/interfaces/IStripeClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(),
    stripeEvent: { findUnique: vi.fn() },
    stripeWebhookLog: { upsert: vi.fn() },
  },
}))
vi.mock("@/lib/auth", () => ({ purgeUserCache: vi.fn() }))
vi.mock("@/lib/referral-rewards", () => ({ checkAndApplyReferralReward: vi.fn() }))
vi.mock("@/lib/resend", () => ({ resend: null, emailEnabled: vi.fn().mockReturnValue(false) }))

const mockStripeClient: IStripeClient = {
  constructEvent: vi.fn(),
  retrieveSubscription: vi.fn(),
  retrieveCharge: vi.fn(),
  cancelSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  createCheckoutSession: vi.fn(),
  retrieveCheckoutSession: vi.fn(),
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
const makeService = () => new StripeWebhookService(mockStripeClient, mockLogger)

beforeEach(() => vi.clearAllMocks())

describe("StripeWebhookService.handleEvent", () => {
  it("invalid signature → throws AppError invalid_signature 400", async () => {
    vi.mocked(mockStripeClient.constructEvent).mockImplementation(() => { throw new Error("sig mismatch") })
    await expect(makeService().handleEvent("body", "sig", "secret")).rejects.toMatchObject({ code: "invalid_signature", status: 400 })
  })

  it("unknown event type → resolves without error", async () => {
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({ type: "unknown.event", data: { object: {} }, id: "ev_1" } as unknown as Stripe.Event)
    await expect(makeService().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
  })

  it("checkout.session.completed with missing userId → resolves silently", async () => {
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.completed", id: "ev_1",
      data: { object: { payment_status: "paid", metadata: {}, subscription: null } },
    } as unknown as Stripe.Event)
    await expect(makeService().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
  })

  it("checkout.session.completed with unpaid status → skips DB transaction", async () => {
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.completed", id: "ev_1",
      data: { object: { payment_status: "unpaid", metadata: { userId: "u1" }, subscription: null } },
    } as unknown as Stripe.Event)
    const { db } = await import("@/lib/db")
    await makeService().handleEvent("body", "sig", "secret")
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it("invoice.paid with no subscriptionId → skips handler", async () => {
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "invoice.paid", id: "ev_2",
      data: { object: { customer: "cus_1", parent: null } },
    } as unknown as Stripe.Event)
    const { db } = await import("@/lib/db")
    await makeService().handleEvent("body", "sig", "secret")
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it("handler throws internal error → throws AppError handler_error 500", async () => {
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "invoice.paid", id: "ev_3",
      data: { object: { customer: "cus_1", parent: { type: "subscription_details", subscription_details: { subscription: "sub_1" } } } },
    } as unknown as Stripe.Event)
    vi.mocked(mockStripeClient.retrieveSubscription).mockRejectedValue(new Error("Stripe down"))
    await expect(makeService().handleEvent("body", "sig", "secret")).rejects.toMatchObject({ code: "handler_error", status: 500 })
  })
})

describe("StripeWebhookService — observability log (StripeWebhookLog)", () => {
  it("unknown event type → records SKIPPED", async () => {
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({ type: "unknown.event", data: { object: { id: "obj_1" } }, id: "ev_skip" } as unknown as Stripe.Event)
    const { db } = await import("@/lib/db")
    await makeService().handleEvent("body", "sig", "secret")
    expect(db.stripeWebhookLog.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { stripeEventId: "ev_skip" },
      create: expect.objectContaining({ stripeEventId: "ev_skip", type: "unknown.event", status: "SKIPPED", objectId: "obj_1" }),
    }))
  })

  it("successful handler → records SUCCESS", async () => {
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.completed", id: "ev_ok",
      data: { object: { id: "cs_1", payment_status: "unpaid", metadata: { userId: "u1" }, subscription: null } },
    } as unknown as Stripe.Event)
    const { db } = await import("@/lib/db")
    await makeService().handleEvent("body", "sig", "secret")
    expect(db.stripeWebhookLog.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ status: "SUCCESS", type: "checkout.session.completed", objectId: "cs_1", userId: "u1" }),
    }))
  })

  it("handler error → records FAILED with error message and re-throws", async () => {
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "invoice.paid", id: "ev_fail",
      data: { object: { id: "in_1", customer: "cus_1", parent: { type: "subscription_details", subscription_details: { subscription: "sub_1" } } } },
    } as unknown as Stripe.Event)
    vi.mocked(mockStripeClient.retrieveSubscription).mockRejectedValue(new Error("Stripe down"))
    const { db } = await import("@/lib/db")
    await expect(makeService().handleEvent("body", "sig", "secret")).rejects.toMatchObject({ code: "handler_error" })
    expect(db.stripeWebhookLog.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { stripeEventId: "ev_fail" },
      create: expect.objectContaining({ status: "FAILED", errorMessage: "Stripe down" }),
    }))
  })

  it("log write failure never masks the flow (best-effort)", async () => {
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({ type: "unknown.event", data: { object: {} }, id: "ev_logfail" } as unknown as Stripe.Event)
    const { db } = await import("@/lib/db")
    vi.mocked(db.stripeWebhookLog.upsert).mockRejectedValueOnce(new Error("db down"))
    await expect(makeService().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
  })
})

describe("StripeWebhookService — idempotency (P2002)", () => {
  it("checkout.session.completed duplicate event → returns silently (P2002 idempotency)", async () => {
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.completed",
      id: "ev_dup",
      data: { object: { payment_status: "paid", metadata: { userId: "u1", planInterval: "monthly" }, subscription: null } },
    } as unknown as Stripe.Event)
    const { db } = await import("@/lib/db")
    vi.mocked(db.$transaction).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (async (fn: (tx: unknown) => Promise<unknown>) => {
        const mockTx = {
          stripeEvent: { create: vi.fn().mockRejectedValue({ code: "P2002" }), update: vi.fn() },
          user: { update: vi.fn() },
          auditLog: { create: vi.fn() },
        }
        return fn(mockTx)
      }) as unknown as typeof db.$transaction
    )
    await expect(makeService().handleEvent("body", "sig", "secret")).resolves.toBeUndefined()
  })
})

describe("StripeWebhookService — AppError propagation", () => {
  it("inner handler throws AppError → propagates (not wrapped in handler_error)", async () => {
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "invoice.paid",
      id: "ev_apperr",
      data: { object: { customer: "cus_1", parent: { type: "subscription_details", subscription_details: { subscription: "sub_1" } } } },
    } as unknown as Stripe.Event)
    const { AppError } = await import("@/lib/services/auth/AppError")
    vi.mocked(mockStripeClient.retrieveSubscription).mockRejectedValue(new AppError("some_app_error", 422))
    await expect(makeService().handleEvent("body", "sig", "secret")).rejects.toMatchObject({ code: "some_app_error", status: 422 })
  })
})
