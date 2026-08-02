import { describe, it, expect, vi, beforeEach } from "vitest"
import { StripeBillingService } from "@/lib/services/stripe/StripeBillingService"
import type { IStripeClient } from "@/lib/interfaces/IStripeClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

vi.mock("@/lib/db", () => ({ db: { user: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn().mockResolvedValue({ count: 1 }) }, auditLog: { create: vi.fn() }, $transaction: vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)) } }))
vi.mock("@/lib/auth", () => ({ purgeUserCache: vi.fn() }))
vi.mock("@/lib/stripe", () => ({ stripeEnabled: vi.fn().mockReturnValue(true) }))

const mockStripeClient: IStripeClient = {
  constructEvent: vi.fn(), retrieveSubscription: vi.fn(), retrieveCharge: vi.fn(),
  cancelSubscription: vi.fn(), updateSubscription: vi.fn(),
  createCheckoutSession: vi.fn(), createPortalSession: vi.fn(),
  listCustomers: vi.fn(), createCustomer: vi.fn(), createRefund: vi.fn(),
  retrieveBalance: vi.fn(), listCharges: vi.fn(), listDisputes: vi.fn(), listSubscriptions: vi.fn(),
}
const mockLogger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const makeService = () => new StripeBillingService(mockStripeClient, mockLogger)

beforeEach(async () => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_APP_URL = "https://www.valhallaresume.com"
  const { stripeEnabled } = await import("@/lib/stripe")
  vi.mocked(stripeEnabled).mockReturnValue(true)
})

describe("StripeBillingService.createPortalSession", () => {
  it("no stripeCustomerId → throws 400 no_active_subscription", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ stripeCustomerId: null } as unknown as import("@prisma/client").User)
    await expect(makeService().createPortalSession("u1", "es")).rejects.toMatchObject({ code: "no_active_subscription", status: 400 })
  })

  it("happy path → returns { url }", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ stripeCustomerId: "cus_1" } as unknown as import("@prisma/client").User)
    vi.mocked(mockStripeClient.createPortalSession).mockResolvedValue({ url: "https://billing.stripe.com/session/test" } as never)
    const result = await makeService().createPortalSession("u1", "es")
    expect(result).toEqual({ url: "https://billing.stripe.com/session/test" })
  })
})

describe("StripeBillingService.cancelSubscription", () => {
  it("no subscriptionId → throws 400 no_active_subscription", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ subscriptionId: null, subscriptionStatus: "EXPIRED" } as unknown as import("@prisma/client").User)
    await expect(makeService().cancelSubscription("u1")).rejects.toMatchObject({ code: "no_active_subscription", status: 400 })
  })

  it("already canceled → throws 400 already_canceled", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ subscriptionId: "sub_1", subscriptionStatus: "CANCELED" } as unknown as import("@prisma/client").User)
    await expect(makeService().cancelSubscription("u1")).rejects.toMatchObject({ code: "already_canceled", status: 400 })
  })

  it("happy path → calls updateSubscription cancel_at_period_end, returns { success: true }", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ subscriptionId: "sub_1", subscriptionStatus: "ACTIVE" } as unknown as import("@prisma/client").User)
    vi.mocked(mockStripeClient.updateSubscription).mockResolvedValue({} as never)
    vi.mocked(db.user.update).mockResolvedValue({} as never)
    const result = await makeService().cancelSubscription("u1")
    expect(result).toEqual({ success: true })
    expect(mockStripeClient.updateSubscription).toHaveBeenCalledWith("sub_1", { cancel_at_period_end: true })
  })
})

describe("StripeBillingService.createRefund", () => {
  it("no stripeCustomerId → throws 404 user_not_found", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ stripeCustomerId: null } as unknown as import("@prisma/client").User)
    await expect(makeService().createRefund("admin1", "u1")).rejects.toMatchObject({ code: "user_not_found", status: 404 })
  })

  it("happy path → calls createRefund + auditLog, returns { success: true }", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ stripeCustomerId: "cus_1" } as unknown as import("@prisma/client").User)
    vi.mocked(mockStripeClient.createRefund).mockResolvedValue({} as never)
    vi.mocked(db.auditLog.create).mockResolvedValue({} as never)
    const result = await makeService().createRefund("admin1", "u1", 5000)
    expect(result).toEqual({ success: true })
    expect(mockStripeClient.createRefund).toHaveBeenCalledWith({ customer: "cus_1", amount: 5000 })
  })
})
