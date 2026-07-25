import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ILogger } from "@/lib/interfaces/ILogger"

vi.mock("@/lib/paypal", () => ({ paypalEnabled: () => true }))
vi.mock("@/lib/auth", () => ({ purgeUserCache: vi.fn() }))

const state: {
  user: { paypalSubscriptionId: string | null; subscriptionStatus: string; isManaged: boolean } | null
  claimedCount: number
} = {
  user: { paypalSubscriptionId: "I-SUB1", subscriptionStatus: "ACTIVE", isManaged: false },
  claimedCount: 1,
}
type UpdateManyArgs = { where: Record<string, unknown>; data: Record<string, unknown> }
const updateMany = vi.fn(async (_args: UpdateManyArgs) => ({ count: state.claimedCount }))
const auditCreate = vi.fn(async (_args: unknown) => ({}))

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn(async () => state.user), updateMany: (a: UpdateManyArgs) => updateMany(a) },
    auditLog: { create: (a: unknown) => auditCreate(a) },
  },
}))

import { PayPalBillingService } from "@/lib/services/paypal/PayPalBillingService"

const logger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

beforeEach(() => {
  vi.clearAllMocks()
  state.user = { paypalSubscriptionId: "I-SUB1", subscriptionStatus: "ACTIVE", isManaged: false }
  state.claimedCount = 1
})

describe("PayPalBillingService.cancelSubscription", () => {
  it("cancels at PayPal, marks CANCELED, and audits it", async () => {
    const cancelSubscription = vi.fn().mockResolvedValue(undefined)
    const svc = new PayPalBillingService({ cancelSubscription } as never, logger)
    await expect(svc.cancelSubscription("u1")).resolves.toEqual({ success: true })
    expect(cancelSubscription).toHaveBeenCalledWith("I-SUB1", "User requested cancellation")
    // Access is NOT revoked here — plan stays PRO until subscriptionEndsAt.
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ subscriptionStatus: "CANCELED" }) }),
    )
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "CANCEL_SUBSCRIPTION" }) }),
    )
  })

  it("never downgrades the plan or clears subscriptionEndsAt (paid period is kept)", async () => {
    const svc = new PayPalBillingService({ cancelSubscription: vi.fn() } as never, logger)
    await svc.cancelSubscription("u1")
    const written = updateMany.mock.calls[0][0]
    expect(written.data).not.toHaveProperty("plan")
    expect(written.data).not.toHaveProperty("subscriptionEndsAt")
  })

  it("no PayPal subscription → 400, never calls PayPal", async () => {
    state.user = { paypalSubscriptionId: null, subscriptionStatus: "ACTIVE", isManaged: false }
    const cancelSubscription = vi.fn()
    const svc = new PayPalBillingService({ cancelSubscription } as never, logger)
    await expect(svc.cancelSubscription("u1")).rejects.toMatchObject({ code: "no_active_subscription", status: 400 })
    expect(cancelSubscription).not.toHaveBeenCalled()
  })

  it("managed (LIMITED) user → 403, never calls PayPal", async () => {
    state.user = { paypalSubscriptionId: "I-SUB1", subscriptionStatus: "ACTIVE", isManaged: true }
    const cancelSubscription = vi.fn()
    const svc = new PayPalBillingService({ cancelSubscription } as never, logger)
    await expect(svc.cancelSubscription("u1")).rejects.toMatchObject({ code: "managed_account", status: 403 })
    expect(cancelSubscription).not.toHaveBeenCalled()
  })

  it("already CANCELED → 400, never calls PayPal twice", async () => {
    state.user = { paypalSubscriptionId: "I-SUB1", subscriptionStatus: "CANCELED", isManaged: false }
    const cancelSubscription = vi.fn()
    const svc = new PayPalBillingService({ cancelSubscription } as never, logger)
    await expect(svc.cancelSubscription("u1")).rejects.toMatchObject({ code: "already_canceled", status: 400 })
    expect(cancelSubscription).not.toHaveBeenCalled()
  })

  it("concurrent cancel (CAS claims 0 rows) → no duplicate audit entry", async () => {
    state.claimedCount = 0
    const svc = new PayPalBillingService({ cancelSubscription: vi.fn() } as never, logger)
    await expect(svc.cancelSubscription("u1")).resolves.toEqual({ success: true })
    expect(auditCreate).not.toHaveBeenCalled()
  })
})
