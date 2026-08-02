import { describe, it, expect, vi, beforeEach } from "vitest"
import { StripeCheckoutService } from "@/lib/services/stripe/StripeCheckoutService"
import type { IStripeClient } from "@/lib/interfaces/IStripeClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

vi.mock("@/lib/db", () => ({ db: { user: { findUnique: vi.fn(), update: vi.fn() } } }))
vi.mock("@/lib/stripe", () => ({ stripeEnabled: vi.fn().mockReturnValue(true) }))

const mockStripeClient: IStripeClient = {
  constructEvent: vi.fn(), retrieveSubscription: vi.fn(), retrieveCharge: vi.fn(),
  cancelSubscription: vi.fn(), updateSubscription: vi.fn(),
  createCheckoutSession: vi.fn(),
  retrieveCheckoutSession: vi.fn(), createPortalSession: vi.fn(),
  listCustomers: vi.fn(), createCustomer: vi.fn(), createRefund: vi.fn(),
  retrieveBalance: vi.fn(), listCharges: vi.fn(), listDisputes: vi.fn(), listSubscriptions: vi.fn(),
}
const mockLogger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const makeService = () => new StripeCheckoutService(mockStripeClient, mockLogger)

beforeEach(async () => {
  vi.clearAllMocks()
  process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly_test"
  // Needed by the plan-direction tests below: createSession resolves the price BEFORE
  // the subscription guard, so an unset price masks the guard with plan_not_configured.
  process.env.STRIPE_PRICE_ID_ANNUAL = "price_annual_test"
  process.env.STRIPE_PRICE_ID_BASIC = "price_basic_test"
  process.env.STRIPE_PRICE_ID_SPRINT = "price_sprint_test"
  process.env.NEXT_PUBLIC_APP_URL = "https://www.valhallaresume.com"
  const { stripeEnabled } = await import("@/lib/stripe")
  vi.mocked(stripeEnabled).mockReturnValue(true)
})

describe("StripeCheckoutService.createSession", () => {
  it("stripe disabled → throws 503 payments_not_configured", async () => {
    const { stripeEnabled } = await import("@/lib/stripe")
    vi.mocked(stripeEnabled).mockReturnValue(false)
    await expect(makeService().createSession("u1", "monthly", "es")).rejects.toMatchObject({ code: "payments_not_configured", status: 503 })
  })

  it("user not found → throws 404 user_not_found", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    await expect(makeService().createSession("u1", "monthly", "es")).rejects.toMatchObject({ code: "user_not_found", status: 404 })
  })

  it("already subscribed ACTIVE → throws 400 already_subscribed", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionId: "sub_1" } as unknown as import("@prisma/client").User)
    await expect(makeService().createSession("u1", "monthly", "es")).rejects.toMatchObject({ code: "already_subscribed", status: 400 })
  })

  it("PAST_DUE → throws 400 already_subscribed (Stripe still retrying the charge)", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "PRO", subscriptionStatus: "PAST_DUE", subscriptionId: "sub_1" } as unknown as import("@prisma/client").User)
    await expect(makeService().createSession("u1", "monthly", "es")).rejects.toMatchObject({ code: "already_subscribed", status: 400 })
  })

  // ── Direction of the move decides whether checkout is allowed ──
  // These pin the rule the pricing UI mirrors via blocksNewPurchase(): going UP is
  // immediate, going DOWN to a one-time plan has to wait for the period to end.

  it("UPGRADE: a one-time BASIC buyer (status NONE) can buy PRO immediately", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "BASIC", subscriptionStatus: "NONE", subscriptionId: null } as unknown as import("@prisma/client").User)
    vi.mocked(mockStripeClient.createCheckoutSession).mockResolvedValue({ url: "https://stripe.com/pay/upgrade" } as never)
    await expect(makeService().createSession("u1", "monthly", "es")).resolves.toEqual({ url: "https://stripe.com/pay/upgrade" })
  })

  it("SWITCH: a CANCELED subscriber can check out, and the old sub is cancelled first", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "PRO", subscriptionStatus: "CANCELED", subscriptionId: "sub_old" } as unknown as import("@prisma/client").User)
    vi.mocked(mockStripeClient.cancelSubscription).mockResolvedValue({ id: "sub_old" } as never)
    vi.mocked(mockStripeClient.createCheckoutSession).mockResolvedValue({ url: "https://stripe.com/pay/annual" } as never)
    await expect(makeService().createSession("u1", "annual", "es")).resolves.toEqual({ url: "https://stripe.com/pay/annual" })
    // No double billing: the old subscription must be gone before the new one starts.
    expect(mockStripeClient.cancelSubscription).toHaveBeenCalledWith("sub_old")
  })

  it("DOWNGRADE: an ACTIVE subscriber cannot buy a one-time plan (would orphan the sub)", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionId: "sub_1" } as unknown as import("@prisma/client").User)
    await expect(makeService().createSession("u1", "basic", "es")).rejects.toMatchObject({ code: "already_subscribed", status: 400 })
    expect(mockStripeClient.createCheckoutSession).not.toHaveBeenCalled()
  })

  it("DOWNGRADE: a CANCELED subscriber still cannot buy a one-time plan", async () => {
    // Stricter than the recurring path on purpose: the cancelled subscription is still
    // live, and its later customer.subscription.deleted event resets the user to
    // UNSUBSCRIBED with subscriptionEndsAt=null — wiping the one-time month they paid.
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "PRO", subscriptionStatus: "CANCELED", subscriptionId: "sub_old" } as unknown as import("@prisma/client").User)
    await expect(makeService().createSession("u1", "sprint", "es")).rejects.toMatchObject({ code: "already_subscribed", status: 400 })
    expect(mockStripeClient.createCheckoutSession).not.toHaveBeenCalled()
    // And it must NOT have touched the old subscription on the way out.
    expect(mockStripeClient.cancelSubscription).not.toHaveBeenCalled()
  })

  it("a fully expired user CAN buy a one-time plan", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", subscriptionId: null } as unknown as import("@prisma/client").User)
    vi.mocked(mockStripeClient.createCheckoutSession).mockResolvedValue({ url: "https://stripe.com/pay/basic" } as never)
    await expect(makeService().createSession("u1", "basic", "es")).resolves.toEqual({ url: "https://stripe.com/pay/basic" })
  })

  it("happy path with existing customerId → returns { url }", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", subscriptionId: null } as unknown as import("@prisma/client").User)
    vi.mocked(mockStripeClient.createCheckoutSession).mockResolvedValue({ url: "https://stripe.com/pay/test" } as never)
    const result = await makeService().createSession("u1", "monthly", "es")
    expect(result).toEqual({ url: "https://stripe.com/pay/test" })
    expect(mockStripeClient.listCustomers).not.toHaveBeenCalled()
  })

  // ── Stale customer recovery (Stripe account/mode switch, or deleted customer) ──

  it("stale stored customer (resource_missing) → clears id, recreates, retries once, returns { url }", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_stale", plan: "UNSUBSCRIBED", subscriptionStatus: "NONE", subscriptionId: null } as unknown as import("@prisma/client").User)
    vi.mocked(db.user.update).mockResolvedValue({} as never)
    // First attempt fails because the stored customer does not exist in this Stripe account.
    vi.mocked(mockStripeClient.createCheckoutSession)
      .mockRejectedValueOnce(Object.assign(new Error("No such customer: 'cus_stale'"), { code: "resource_missing", param: "customer" }))
      .mockResolvedValueOnce({ url: "https://stripe.com/pay/recovered" } as never)
    vi.mocked(mockStripeClient.listCustomers).mockResolvedValue({ data: [] } as never)
    vi.mocked(mockStripeClient.createCustomer).mockResolvedValue({ id: "cus_fresh" } as never)

    const result = await makeService().createSession("u1", "monthly", "es")
    expect(result).toEqual({ url: "https://stripe.com/pay/recovered" })
    // Stale id nulled, fresh customer created and used on the retry.
    expect(db.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { stripeCustomerId: null } })
    expect(mockStripeClient.createCustomer).toHaveBeenCalledOnce()
    expect(mockStripeClient.createCheckoutSession).toHaveBeenCalledTimes(2)
    expect(vi.mocked(mockStripeClient.createCheckoutSession).mock.calls[1][0].customer).toBe("cus_fresh")
  })

  it("resource_missing that is NOT the customer (e.g. price) → does NOT retry, rethrows", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "UNSUBSCRIBED", subscriptionStatus: "NONE", subscriptionId: null } as unknown as import("@prisma/client").User)
    vi.mocked(mockStripeClient.createCheckoutSession)
      .mockRejectedValueOnce(Object.assign(new Error("No such price: 'price_x'"), { code: "resource_missing", param: "line_items[0][price]" }))

    await expect(makeService().createSession("u1", "monthly", "es")).rejects.toThrow(/No such price/)
    expect(mockStripeClient.createCheckoutSession).toHaveBeenCalledTimes(1)
    expect(mockStripeClient.createCustomer).not.toHaveBeenCalled()
  })
})
