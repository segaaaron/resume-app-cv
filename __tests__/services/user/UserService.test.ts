import { describe, it, expect, vi, beforeEach } from "vitest"
import { UserService } from "@/lib/services/user/UserService"
import type { ILogger } from "@/lib/interfaces/ILogger"

// ─── Mock DB ──────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update:     vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    verificationToken: {
      findUnique: vi.fn(),
      delete:     vi.fn(),
    },
    referralConversion: {
      findMany: vi.fn(),
    },
  },
}))

// ─── Mock auth ───────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({
  purgeUserCache: vi.fn(),
}))

// ─── Mock ai-client (checkRateLimit) ─────────────────────────────────────────

vi.mock("@/lib/ai-client", () => ({
  checkRateLimit: vi.fn(),
}))

// ─── Mock unsubscribe-token ───────────────────────────────────────────────────

vi.mock("@/lib/unsubscribe-token", () => ({
  verifyUnsubscribeToken: vi.fn(),
}))

// ─── Mock gateway availability (stop-billing reads these) ─────────────────────

vi.mock("@/lib/stripe", () => ({ stripeEnabled: vi.fn(() => true) }))
vi.mock("@/lib/paypal", () => ({ paypalEnabled: vi.fn(() => true) }))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockLogger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const makeService = () => new UserService(mockLogger)

const USER_ID = "user-1"

beforeEach(() => vi.clearAllMocks())

// ─────────────────────────────────────────────────────────────────────────────
// updateProfile
// ─────────────────────────────────────────────────────────────────────────────

describe("UserService.updateProfile", () => {
  it("updates name and returns success", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.update).mockResolvedValue({} as never)

    const result = await makeService().updateProfile(USER_ID, { name: "Ana García" })

    expect(result).toEqual({ success: true })
    const call = vi.mocked(db.user.update).mock.calls[0][0] as { data: { name: string }; where: { id: string } }
    expect(call.data.name).toBe("Ana García")
    expect(call.where.id).toBe(USER_ID)
  })

  it("throws invalid_name when name is too short", async () => {
    await expect(makeService().updateProfile(USER_ID, { name: "A" })).rejects.toMatchObject({
      code: "invalid_name",
      status: 400,
    })
  })

  it("throws invalid_name when name is empty", async () => {
    await expect(makeService().updateProfile(USER_ID, { name: "" })).rejects.toMatchObject({
      code: "invalid_name",
      status: 400,
    })
  })

  it("trims whitespace from name", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.update).mockResolvedValue({} as never)

    await makeService().updateProfile(USER_ID, { name: "  Ana García  " })

    const call = vi.mocked(db.user.update).mock.calls[0][0] as { data: { name: string } }
    expect(call.data.name).toBe("Ana García")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// deleteAccount
// ─────────────────────────────────────────────────────────────────────────────

describe("UserService.deleteAccount", () => {
  /** Row shape stop-billing selects. Default: nothing to cancel (one-time or free user). */
  const billingRow = (over: { subscriptionId?: string | null; paypalSubscriptionId?: string | null } = {}) => ({
    subscriptionId: null,
    paypalSubscriptionId: null,
    ...over,
  })

  it("creates audit log and soft-deletes user, clears session and purges cache", async () => {
    const { db } = await import("@/lib/db")
    const { purgeUserCache } = await import("@/lib/auth")
    vi.mocked(db.user.findUnique).mockResolvedValue(billingRow() as never)
    vi.mocked(db.auditLog.create).mockResolvedValue({} as never)
    vi.mocked(db.user.update).mockResolvedValue({} as never)

    const result = await makeService().deleteAccount(USER_ID)

    expect(result).toEqual({ success: true })
    expect(vi.mocked(db.auditLog.create)).toHaveBeenCalledWith({
      data: { userId: USER_ID, action: "DELETE_ACCOUNT", metadata: { subscriptionCanceled: false } },
    })

    const updateCall = vi.mocked(db.user.update).mock.calls[0][0] as { data: { deletedAt: Date; activeSessionToken: null; forceLogoutAt: Date }; where: { id: string } }
    expect(updateCall.where.id).toBe(USER_ID)
    expect(updateCall.data.deletedAt).toBeInstanceOf(Date)
    expect(updateCall.data.activeSessionToken).toBeNull()
    expect(updateCall.data.forceLogoutAt).toBeInstanceOf(Date)
    expect(purgeUserCache).toHaveBeenCalledWith(USER_ID)
  })

  it("creates audit log BEFORE the soft-delete (ordering)", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue(billingRow() as never)
    const order: string[] = []
    vi.mocked(db.auditLog.create).mockImplementation((() => { order.push("audit"); return Promise.resolve({} as never) }) as never)
    vi.mocked(db.user.update).mockImplementation((() => { order.push("update"); return Promise.resolve({} as never) }) as never)

    await makeService().deleteAccount(USER_ID)

    expect(order).toEqual(["audit", "update"])
  })

  // ── The account must never outlive its billing ─────────────────────────────
  // A soft-deleted row cannot log in (lib/auth.ts), so a subscription that survives
  // the deletion charges a card whose owner has no way to reach a cancel button.

  it("cancels the Stripe subscription BEFORE soft-deleting, and records it", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue(billingRow({ subscriptionId: "sub_123" }) as never)
    const order: string[] = []
    const cancelStripe = vi.fn(async () => { order.push("cancel") })
    vi.mocked(db.auditLog.create).mockImplementation((() => { order.push("audit"); return Promise.resolve({} as never) }) as never)
    vi.mocked(db.user.update).mockImplementation((() => { order.push("update"); return Promise.resolve({} as never) }) as never)

    await makeService().deleteAccount(USER_ID, { cancelStripe })

    expect(cancelStripe).toHaveBeenCalledWith("sub_123")
    expect(order).toEqual(["cancel", "audit", "update"])
    expect(vi.mocked(db.auditLog.create)).toHaveBeenCalledWith({
      data: { userId: USER_ID, action: "DELETE_ACCOUNT", metadata: { subscriptionCanceled: true, provider: "STRIPE", subscriptionId: "sub_123" } },
    })
  })

  it("does NOT delete the account when the gateway refuses the cancel", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue(billingRow({ subscriptionId: "sub_123" }) as never)
    const cancelStripe = vi.fn(async () => { throw new Error("stripe down") })

    await expect(makeService().deleteAccount(USER_ID, { cancelStripe }))
      .rejects.toMatchObject({ code: "cancel_failed", status: 409 })

    expect(vi.mocked(db.user.update)).not.toHaveBeenCalled()
    expect(vi.mocked(db.auditLog.create)).not.toHaveBeenCalled()
  })

  it("cancels a PayPal subscription through the PayPal path", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue(billingRow({ paypalSubscriptionId: "I-PP1" }) as never)
    const cancelPayPal = vi.fn(async () => {})
    const cancelStripe = vi.fn(async () => {})
    vi.mocked(db.auditLog.create).mockResolvedValue({} as never)
    vi.mocked(db.user.update).mockResolvedValue({} as never)

    await makeService().deleteAccount(USER_ID, { cancelPayPal, cancelStripe })

    expect(cancelPayPal).toHaveBeenCalledWith("I-PP1", expect.any(String))
    expect(cancelStripe).not.toHaveBeenCalled()
    expect(vi.mocked(db.user.update)).toHaveBeenCalled()
  })

  it("treats an already-gone Stripe subscription as cancelled and still deletes", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue(billingRow({ subscriptionId: "sub_gone" }) as never)
    const cancelStripe = vi.fn(async () => { throw Object.assign(new Error("No such subscription"), { code: "resource_missing" }) })
    vi.mocked(db.auditLog.create).mockResolvedValue({} as never)
    vi.mocked(db.user.update).mockResolvedValue({} as never)

    await expect(makeService().deleteAccount(USER_ID, { cancelStripe })).resolves.toEqual({ success: true })
    expect(vi.mocked(db.user.update)).toHaveBeenCalled()
  })

  it("refuses to delete when a subscription exists but its gateway is switched off", async () => {
    const { db } = await import("@/lib/db")
    const { stripeEnabled } = await import("@/lib/stripe")
    vi.mocked(stripeEnabled).mockReturnValueOnce(false)
    vi.mocked(db.user.findUnique).mockResolvedValue(billingRow({ subscriptionId: "sub_123" }) as never)

    await expect(makeService().deleteAccount(USER_ID))
      .rejects.toMatchObject({ code: "payments_not_configured", status: 503 })

    expect(vi.mocked(db.user.update)).not.toHaveBeenCalled()
  })

  it("deletes a one-time (BASIC/SPRINT) account with no subscription without calling any gateway", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue(billingRow() as never)
    const cancelStripe = vi.fn(async () => {})
    const cancelPayPal = vi.fn(async () => {})
    vi.mocked(db.auditLog.create).mockResolvedValue({} as never)
    vi.mocked(db.user.update).mockResolvedValue({} as never)

    await makeService().deleteAccount(USER_ID, { cancelStripe, cancelPayPal })

    expect(cancelStripe).not.toHaveBeenCalled()
    expect(cancelPayPal).not.toHaveBeenCalled()
    expect(vi.mocked(db.user.update)).toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// exportData
// ─────────────────────────────────────────────────────────────────────────────

describe("UserService.exportData", () => {
  const makeUserRow = () => ({
    id: USER_ID,
    name: "Ana",
    email: "ana@example.com",
    createdAt: new Date(),
    plan: "PRO",
    subscriptionStatus: "ACTIVE",
    subscriptionEndsAt: new Date(),
    planInterval: "monthly",
    resumes: [],
    coverLetters: [],
    applications: [],
    auditLogs: [],
  })

  it("throws rate_limited when rate limit exhausted", async () => {
    const { checkRateLimit } = await import("@/lib/ai-client")
    vi.mocked(checkRateLimit).mockResolvedValue(false)

    await expect(makeService().exportData(USER_ID)).rejects.toMatchObject({
      code: "rate_limited",
      status: 429,
    })
  })

  it("throws not_found when user does not exist", async () => {
    const { checkRateLimit } = await import("@/lib/ai-client")
    const { db } = await import("@/lib/db")
    vi.mocked(checkRateLimit).mockResolvedValue(true)
    vi.mocked(db.user.findUnique).mockResolvedValue(null as never)

    await expect(makeService().exportData(USER_ID)).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    })
  })

  it("returns export data with correct shape", async () => {
    const { checkRateLimit } = await import("@/lib/ai-client")
    const { db } = await import("@/lib/db")
    const userRow = makeUserRow()
    vi.mocked(checkRateLimit).mockResolvedValue(true)
    vi.mocked(db.user.findUnique).mockResolvedValue(userRow as never)
    vi.mocked(db.auditLog.create).mockResolvedValue({} as never)
    vi.mocked(db.referralConversion.findMany).mockResolvedValue([])

    const result = await makeService().exportData(USER_ID)

    expect(result.user.id).toBe(USER_ID)
    expect(result.user.email).toBe("ana@example.com")
    expect(result.resumes).toEqual([])
    expect(result.referralConversions).toEqual([])
    expect(result.exportedAt).toBeTruthy()
  })

  it("creates DATA_EXPORT audit log entry", async () => {
    const { checkRateLimit } = await import("@/lib/ai-client")
    const { db } = await import("@/lib/db")
    const userRow = makeUserRow()
    vi.mocked(checkRateLimit).mockResolvedValue(true)
    vi.mocked(db.user.findUnique).mockResolvedValue(userRow as never)
    vi.mocked(db.auditLog.create).mockResolvedValue({} as never)
    vi.mocked(db.referralConversion.findMany).mockResolvedValue([])

    await makeService().exportData(USER_ID)

    expect(vi.mocked(db.auditLog.create)).toHaveBeenCalledWith({
      data: { userId: USER_ID, action: "DATA_EXPORT" },
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// unsubscribeEmail
// ─────────────────────────────────────────────────────────────────────────────

describe("UserService.unsubscribeEmail", () => {
  it("sets emailOptOut to true on valid token", async () => {
    const { verifyUnsubscribeToken } = await import("@/lib/unsubscribe-token")
    const { db } = await import("@/lib/db")
    vi.mocked(verifyUnsubscribeToken).mockReturnValue(true)
    vi.mocked(db.user.update).mockResolvedValue({} as never)

    const result = await makeService().unsubscribeEmail(USER_ID, "valid-token")

    expect(result).toEqual({ success: true })
    const call = vi.mocked(db.user.update).mock.calls[0][0] as { data: { emailOptOut: boolean }; where: { id: string } }
    expect(call.data.emailOptOut).toBe(true)
    expect(call.where.id).toBe(USER_ID)
  })

  it("throws invalid_token on invalid token", async () => {
    const { verifyUnsubscribeToken } = await import("@/lib/unsubscribe-token")
    vi.mocked(verifyUnsubscribeToken).mockReturnValue(false)

    await expect(makeService().unsubscribeEmail(USER_ID, "bad-token")).rejects.toMatchObject({
      code: "invalid_token",
      status: 400,
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// verifyEmail
// ─────────────────────────────────────────────────────────────────────────────

describe("UserService.verifyEmail", () => {
  const VALID_TOKEN = "a".repeat(64)

  it("throws invalid_token when token length is wrong", async () => {
    await expect(makeService().verifyEmail("short")).rejects.toMatchObject({
      code: "invalid_token",
      status: 400,
    })
  })

  it("throws invalid_token when token not found in DB", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.verificationToken.findUnique).mockResolvedValue(null as never)

    await expect(makeService().verifyEmail(VALID_TOKEN)).rejects.toMatchObject({
      code: "invalid_token",
      status: 400,
    })
  })

  it("throws token_expired when token is past expiry", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.verificationToken.findUnique).mockResolvedValue({
      token: VALID_TOKEN,
      identifier: "ana@example.com",
      expires: new Date(Date.now() - 1000), // in the past
    } as never)
    vi.mocked(db.verificationToken.delete).mockResolvedValue({} as never)

    await expect(makeService().verifyEmail(VALID_TOKEN)).rejects.toMatchObject({
      code: "token_expired",
      status: 400,
    })
  })

  it("verifies email and cleans up token on success", async () => {
    const { db } = await import("@/lib/db")
    const identifier = "ana@example.com"
    vi.mocked(db.verificationToken.findUnique).mockResolvedValue({
      token: VALID_TOKEN,
      identifier,
      expires: new Date(Date.now() + 60_000), // in the future
    } as never)
    vi.mocked(db.user.update).mockResolvedValue({} as never)
    vi.mocked(db.verificationToken.delete).mockResolvedValue({} as never)

    const result = await makeService().verifyEmail(VALID_TOKEN)

    expect(result).toEqual({ success: true })
    const updateCall = vi.mocked(db.user.update).mock.calls[0][0] as { where: { email: string }; data: { emailVerified: Date } }
    expect(updateCall.where.email).toBe(identifier)
    expect(updateCall.data.emailVerified).toBeInstanceOf(Date)
    expect(vi.mocked(db.verificationToken.delete)).toHaveBeenCalledWith({ where: { token: VALID_TOKEN } })
  })
})
