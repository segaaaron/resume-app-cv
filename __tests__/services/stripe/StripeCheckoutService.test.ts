import { describe, it, expect, vi, beforeEach } from "vitest"
import { StripeCheckoutService } from "@/lib/services/stripe/StripeCheckoutService"
import type { IStripeClient } from "@/lib/interfaces/IStripeClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

vi.mock("@/lib/db", () => ({ db: { user: { findUnique: vi.fn(), update: vi.fn() } } }))
vi.mock("@/lib/stripe", () => ({ stripeEnabled: vi.fn().mockReturnValue(true) }))

const mockStripeClient: IStripeClient = {
  constructEvent: vi.fn(), retrieveSubscription: vi.fn(), retrieveCharge: vi.fn(),
  cancelSubscription: vi.fn(), updateSubscription: vi.fn(),
  createCheckoutSession: vi.fn(), createPortalSession: vi.fn(),
  listCustomers: vi.fn(), createCustomer: vi.fn(), createRefund: vi.fn(),
}
const mockLogger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const makeService = () => new StripeCheckoutService(mockStripeClient, mockLogger)

beforeEach(async () => {
  vi.clearAllMocks()
  process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly_test"
  process.env.NEXT_PUBLIC_APP_URL = "https://readycvv.com"
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

  it("happy path with existing customerId → returns { url }", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", stripeCustomerId: "cus_1", plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", subscriptionId: null } as unknown as import("@prisma/client").User)
    vi.mocked(mockStripeClient.createCheckoutSession).mockResolvedValue({ url: "https://stripe.com/pay/test" } as never)
    const result = await makeService().createSession("u1", "monthly", "es")
    expect(result).toEqual({ url: "https://stripe.com/pay/test" })
    expect(mockStripeClient.listCustomers).not.toHaveBeenCalled()
  })
})
