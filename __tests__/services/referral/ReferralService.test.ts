import { describe, it, expect, vi, beforeEach } from "vitest"
import { ReferralService } from "@/lib/services/referral/ReferralService"
import type { ILogger } from "@/lib/interfaces/ILogger"

// ─── Mock DB ──────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update:     vi.fn(),
      findMany:   vi.fn(),
    },
    referralConversion: {
      findMany: vi.fn().mockResolvedValue([]),
      count:    vi.fn().mockResolvedValue(0),
    },
  },
}))

// ─── Mock nanoid ──────────────────────────────────────────────────────────────

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "abc12345"),
}))

// ─── Mock plans ───────────────────────────────────────────────────────────────

vi.mock("@/lib/plans", () => ({
  isActive: vi.fn(),
}))

// ─── Mock referral-rewards ────────────────────────────────────────────────────

vi.mock("@/lib/referral-rewards", () => ({
  REFERRAL_TIERS: [
    { tier: 1, threshold: 3,  label: "30% descuento", creditCents: 450 },
    { tier: 2, threshold: 5,  label: "50% descuento", creditCents: 300 },
    { tier: 3, threshold: 10, label: "1 mes gratis",  creditCents: 750 },
  ],
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockLogger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const makeService = () => new ReferralService(mockLogger)

const USER_ID = "user-1"

const makeUserRow = (overrides: Record<string, unknown> = {}) => ({
  id: USER_ID,
  referralCode: "existcode",
  referralRewardTier: 0,
  referralCycleOffset: 0,
  ...overrides,
})

beforeEach(() => vi.clearAllMocks())

// ─────────────────────────────────────────────────────────────────────────────
// getStatus
// ─────────────────────────────────────────────────────────────────────────────

describe("ReferralService.getStatus", () => {
  it("throws not_found when user does not exist", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue(null as never)

    await expect(makeService().getStatus(USER_ID)).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    })
  })

  it("returns status with existing referral code", async () => {
    const { db } = await import("@/lib/db")
    const { isActive } = await import("@/lib/plans")
    vi.mocked(db.user.findUnique).mockResolvedValue(makeUserRow() as never)
    vi.mocked(db.user.findMany).mockResolvedValue([])
    vi.mocked(isActive).mockReturnValue(false)

    const result = await makeService().getStatus(USER_ID)

    expect(result.referralCode).toBe("existcode")
    expect(result.totalReferred).toBe(0)
    expect(result.totalPaid).toBe(0)
    expect(result.cycleCount).toBe(0)
    expect(result.rewardTier).toBe(0)
  })

  it("auto-generates referral code when missing", async () => {
    const { db } = await import("@/lib/db")
    const { isActive } = await import("@/lib/plans")
    const noCode = makeUserRow({ referralCode: null })
    const withCode = makeUserRow({ referralCode: "abc12345" })

    vi.mocked(db.user.findUnique).mockResolvedValue(noCode as never)
    vi.mocked(db.user.update).mockResolvedValue(withCode as never)
    vi.mocked(db.user.findMany).mockResolvedValue([])
    vi.mocked(isActive).mockReturnValue(false)

    const result = await makeService().getStatus(USER_ID)

    expect(vi.mocked(db.user.update)).toHaveBeenCalledOnce()
    expect(result.referralCode).toBe("abc12345")
  })

  it("does not call update when referral code already exists", async () => {
    const { db } = await import("@/lib/db")
    const { isActive } = await import("@/lib/plans")
    vi.mocked(db.user.findUnique).mockResolvedValue(makeUserRow() as never)
    vi.mocked(db.user.findMany).mockResolvedValue([])
    vi.mocked(isActive).mockReturnValue(false)

    await makeService().getStatus(USER_ID)

    expect(vi.mocked(db.user.update)).not.toHaveBeenCalled()
  })

  it("counts totalReferred and totalPaid correctly", async () => {
    const { db } = await import("@/lib/db")
    const { isActive } = await import("@/lib/plans")
    vi.mocked(db.user.findUnique).mockResolvedValue(makeUserRow() as never)

    const referred = [
      { plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionEndsAt: new Date(Date.now() + 10_000) },
      { plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionEndsAt: new Date(Date.now() + 10_000) },
      { plan: "UNSUBSCRIBED", subscriptionStatus: "NONE", subscriptionEndsAt: null },
    ]
    vi.mocked(db.user.findMany).mockResolvedValue(referred as never)
    vi.mocked(isActive).mockImplementation((_plan, _ends, _status) => {
      // first two active, third not
      return (_plan === "PRO" && _status === "ACTIVE")
    })

    const result = await makeService().getStatus(USER_ID)

    expect(result.totalReferred).toBe(3)
    expect(result.totalPaid).toBe(2)
  })

  it("computes cycleCount as totalPaid minus cycleOffset", async () => {
    const { db } = await import("@/lib/db")
    const { isActive } = await import("@/lib/plans")
    vi.mocked(db.user.findUnique).mockResolvedValue(
      makeUserRow({ referralCycleOffset: 3 }) as never
    )
    vi.mocked(db.user.findMany).mockResolvedValue([
      { plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionEndsAt: new Date() },
      { plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionEndsAt: new Date() },
      { plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionEndsAt: new Date() },
      { plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionEndsAt: new Date() },
    ] as never)
    vi.mocked(isActive).mockReturnValue(true)

    const result = await makeService().getStatus(USER_ID)

    expect(result.totalPaid).toBe(4)
    expect(result.cycleCount).toBe(1) // 4 - 3 offset
  })

  it("returns correct nextTier when not at max tier", async () => {
    const { db } = await import("@/lib/db")
    const { isActive } = await import("@/lib/plans")
    vi.mocked(db.user.findUnique).mockResolvedValue(
      makeUserRow({ referralRewardTier: 1 }) as never
    )
    vi.mocked(db.user.findMany).mockResolvedValue([])
    vi.mocked(isActive).mockReturnValue(false)

    const result = await makeService().getStatus(USER_ID)

    expect(result.nextTier).not.toBeNull()
    expect(result.nextTier?.tier).toBe(2)
  })

  it("returns null nextTier when at max tier", async () => {
    const { db } = await import("@/lib/db")
    const { isActive } = await import("@/lib/plans")
    vi.mocked(db.user.findUnique).mockResolvedValue(
      makeUserRow({ referralRewardTier: 3 }) as never
    )
    vi.mocked(db.user.findMany).mockResolvedValue([])
    vi.mocked(isActive).mockReturnValue(false)

    const result = await makeService().getStatus(USER_ID)

    expect(result.nextTier).toBeNull()
  })
})
