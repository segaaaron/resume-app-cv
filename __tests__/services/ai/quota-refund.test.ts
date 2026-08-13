import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/rate-limit", () => ({ refundRateLimit: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/ai-client", () => ({
  checkAndIncrementAIQuota: vi.fn(),
  checkAndIncrementRateLimit: vi.fn(),
}))
vi.mock("@/lib/db", () => ({ db: { auditLog: { create: vi.fn().mockResolvedValue({}) } } }))

import { refundDailyQuota } from "@/lib/services/ai/shared/quota-enforcer"
import { refundRateLimit } from "@/lib/rate-limit"

describe("refundDailyQuota", () => {
  beforeEach(() => vi.mocked(refundRateLimit).mockClear())

  it("gives back the daily slot for a plan with unlimited use of the endpoint", async () => {
    // The cap exists to stop spending. A cached answer spends nothing, and
    // charging for it is what turned a day of testing into "you have reached
    // today's limit" without a single model call being made.
    await refundDailyQuota("u1", "ats-score", "PRO")
    expect(refundRateLimit).toHaveBeenCalledWith("u1", "ai-daily:ats-score")
  })

  it("never touches the counters of a plan that is metered, not capped", async () => {
    // Those are the paid boundary, not anti-abuse — refunding one would be
    // giving away quota.
    await refundDailyQuota("u1", "ats-score", "UNSUBSCRIBED")
    expect(refundRateLimit).not.toHaveBeenCalled()
  })
})
