import { describe, it, expect, vi, beforeEach } from "vitest"
import type Stripe from "stripe"
import { StripeWebhookService } from "@/lib/services/stripe/StripeWebhookService"
import type { IStripeClient } from "@/lib/interfaces/IStripeClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(),
    stripeEvent: { findUnique: vi.fn() },
  },
}))
vi.mock("@/lib/auth", () => ({ purgeUserCache: vi.fn() }))
vi.mock("@/lib/referral-rewards", () => ({ checkAndApplyReferralReward: vi.fn() }))
vi.mock("@/lib/resend", () => ({ resend: null, emailEnabled: vi.fn().mockReturnValue(false) }))

const mockStripeClient: IStripeClient = {
  constructEvent: vi.fn(), retrieveSubscription: vi.fn(), retrieveCharge: vi.fn(),
  cancelSubscription: vi.fn(), updateSubscription: vi.fn(),
  createCheckoutSession: vi.fn(), createPortalSession: vi.fn(),
  listCustomers: vi.fn(), createCustomer: vi.fn(), createRefund: vi.fn(),
}
const mockLogger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

describe("debug", () => {
  it("debug the issue", async () => {
    vi.clearAllMocks()
    const { db } = await import("@/lib/db")
    
    vi.mocked(mockStripeClient.constructEvent).mockReturnValue({
      type: "checkout.session.completed",
      id: "ev_1",
      data: { object: { payment_status: "paid", metadata: { userId: "u1", planInterval: "monthly" }, subscription: "sub_1" } },
    } as unknown as Stripe.Event)
    
    vi.mocked(mockStripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: 1800000000 }] },
    } as unknown as Stripe.Subscription)
    
    const tx = {
      stripeEvent: { create: vi.fn().mockResolvedValue({}), update: vi.fn().mockResolvedValue({}) },
      user: { update: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    }
    
    vi.mocked(db.$transaction).mockImplementation(
      (async (fn: (tx: unknown) => Promise<unknown>) => {
        console.log("$transaction called!")
        return fn(tx)
      }) as unknown as typeof db.$transaction
    )
    
    try {
      await new StripeWebhookService(mockStripeClient, mockLogger).handleEvent("body", "sig", "secret")
      console.log("Success!")
      console.log("tx.user.update called:", tx.user.update.mock.calls)
    } catch (e) {
      console.log("Error:", e)
      // Check what the real error is
      if (mockLogger.error.mock.calls.length > 0) {
        console.log("Logger errors:", JSON.stringify(mockLogger.error.mock.calls))
      }
    }
  })
})
