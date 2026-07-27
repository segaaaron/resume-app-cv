import { describe, it, expect, vi, beforeEach } from "vitest"
import { PasswordResetService } from "@/lib/services/auth/PasswordResetService"
import { AppError } from "@/lib/services/auth/AppError"
import type { IUserRepository } from "@/lib/interfaces/IUserRepository"
import type { IPasswordResetRepository } from "@/lib/interfaces/IPasswordResetRepository"
import type { IEmailService } from "@/lib/interfaces/IEmailService"
import type { IRateLimitService } from "@/lib/interfaces/IRateLimitService"
import type { ILogger } from "@/lib/interfaces/ILogger"

vi.mock("@/lib/auth", () => ({ purgeUserCache: vi.fn() }))
vi.mock("@/lib/db", () => ({ db: { user: { update: vi.fn().mockResolvedValue({}) } } }))

const mockUsers: IUserRepository = {
  findByEmail: vi.fn(),
  findByReferralCode: vi.fn(),
  createFromPending: vi.fn(),
  findForReset: vi.fn(),
  updatePassword: vi.fn(),
  findForChallenge: vi.fn(),
  updateSessionChallenge: vi.fn(),
}

const mockResets: IPasswordResetRepository = {
  findByEmail: vi.fn(),
  upsert: vi.fn(),
  incrementAttempts: vi.fn(),
  markUsed: vi.fn(),
}

const mockEmail: IEmailService = {
  sendRegistrationOtp: vi.fn(),
  sendPasswordResetOtp: vi.fn(),
  sendSessionChallenge: vi.fn(),
  sendSessionChallengeFailed: vi.fn(),
  sendSessionChallengeBlocked: vi.fn(),
  sendSessionForced: vi.fn(),
}

const mockRateLimit: IRateLimitService = { check: vi.fn(), recordFailure: vi.fn() }
const mockLogger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

function makeService() {
  return new PasswordResetService(mockUsers, mockResets, mockRateLimit, mockEmail, mockLogger)
}

beforeEach(() => vi.clearAllMocks())

// ── requestReset ───────────────────────────────────────────────────────────────

describe("PasswordResetService.requestReset", () => {
  it("rate limited → throws 429 rate_limited", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(false)
    await expect(makeService().requestReset("1.2.3.4", "a@b.com")).rejects.toMatchObject({ code: "rate_limited", status: 429 })
  })

  it("email not registered → anti-enumeration: silent { sent: true }, records failure, no email", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockUsers.findForReset).mockResolvedValue(null)
    await expect(makeService().requestReset("1.2.3.4", "a@b.com")).resolves.toEqual({ sent: true })
    expect(mockRateLimit.recordFailure).toHaveBeenCalledWith("1.2.3.4", "reset-password-request")
    expect(mockEmail.sendPasswordResetOtp).not.toHaveBeenCalled()
  })

  it("Google-only account (no password) → anti-enumeration: silent { sent: true }, records failure, no email", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockUsers.findForReset).mockResolvedValue({ id: "u1", name: "Ana", hasPassword: false, plan: "PRO" })
    await expect(makeService().requestReset("1.2.3.4", "a@b.com")).resolves.toEqual({ sent: true })
    expect(mockRateLimit.recordFailure).toHaveBeenCalledWith("1.2.3.4", "reset-password-request")
    expect(mockEmail.sendPasswordResetOtp).not.toHaveBeenCalled()
  })

  it("happy path → upserts reset record, sends email, returns { sent: true }", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockUsers.findForReset).mockResolvedValue({ id: "u1", name: "Ana", hasPassword: true, plan: "PRO" })
    vi.mocked(mockResets.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendPasswordResetOtp).mockResolvedValue()
    const result = await makeService().requestReset("1.2.3.4", "a@b.com")
    expect(result).toEqual({ sent: true })
    expect(mockResets.upsert).toHaveBeenCalledOnce()
    expect(mockEmail.sendPasswordResetOtp).toHaveBeenCalledWith("a@b.com", "Ana", expect.stringMatching(/^\d{6}$/), undefined)
  })
})

// ── confirmReset ───────────────────────────────────────────────────────────────

describe("PasswordResetService.confirmReset", () => {
  const validInput = { email: "a@b.com", code: "654321", password: "NewPass123" }

  it("rate limited → throws 429 rate_limited", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(false)
    await expect(makeService().confirmReset(validInput)).rejects.toMatchObject({ code: "rate_limited", status: 429 })
  })

  it("no reset record → throws 400 no_reset_request", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockResets.findByEmail).mockResolvedValue(null)
    await expect(makeService().confirmReset(validInput)).rejects.toMatchObject({ code: "no_reset_request", status: 400 })
  })

  it("expired reset → throws 400 expired", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({ email: "a@b.com", otpHash: "h", expiresAt: new Date(Date.now() - 1000), attempts: 0, usedAt: null })
    await expect(makeService().confirmReset(validInput)).rejects.toMatchObject({ code: "expired", status: 400 })
  })

  it("already used → throws 400 already_used", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({ email: "a@b.com", otpHash: "h", expiresAt: new Date(Date.now() + 60000), attempts: 0, usedAt: new Date() })
    await expect(makeService().confirmReset(validInput)).rejects.toMatchObject({ code: "already_used", status: 400 })
  })

  it("max attempts reached → throws 400 too_many_attempts", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({ email: "a@b.com", otpHash: "h", expiresAt: new Date(Date.now() + 60000), attempts: 5, usedAt: null })
    await expect(makeService().confirmReset(validInput)).rejects.toMatchObject({ code: "too_many_attempts", status: 400 })
  })

  it("invalid code → increments attempts, throws 400 invalid_code with attemptsLeft", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({
      email: "a@b.com",
      otpHash: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      expiresAt: new Date(Date.now() + 60000), attempts: 1, usedAt: null,
    })
    vi.mocked(mockResets.incrementAttempts).mockResolvedValue()
    const err = await makeService().confirmReset(validInput).catch((e) => e) as AppError
    expect(err.code).toBe("invalid_code")
    expect(err.extra?.attemptsLeft).toBe(3)
    expect(mockResets.incrementAttempts).toHaveBeenCalledWith("a@b.com")
  })

  it("user not found after reset record exists → throws 400 user_not_found", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({ email: "a@b.com", otpHash: hash, expiresAt: new Date(Date.now() + 60000), attempts: 0, usedAt: null })
    vi.mocked(mockResets.incrementAttempts).mockResolvedValue()
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    await expect(makeService().confirmReset(validInput)).rejects.toMatchObject({ code: "user_not_found", status: 400 })
  })

  it("valid code → updates password, marks used, clears session, purges cache, returns { ok: true }", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({ email: "a@b.com", otpHash: hash, expiresAt: new Date(Date.now() + 60000), attempts: 0, usedAt: null })
    vi.mocked(mockResets.incrementAttempts).mockResolvedValue()
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({ id: "u1", name: "Ana", email: "a@b.com", hasPassword: true, referralCode: null, plan: "PRO" })
    vi.mocked(mockUsers.updatePassword).mockResolvedValue()
    vi.mocked(mockResets.markUsed).mockResolvedValue(true)
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.update).mockResolvedValue({} as never)

    const result = await makeService().confirmReset(validInput)

    expect(result).toEqual({ ok: true })
    expect(mockUsers.updatePassword).toHaveBeenCalledWith("u1", expect.stringMatching(/^\$2[aby]\$/))
    expect(mockResets.markUsed).toHaveBeenCalledWith("a@b.com")
    expect(vi.mocked(db.user.update)).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: {
        activeSessionToken:           null,
        sessionVersion:               { increment: 1 },
        sessionChallengeBlockedUntil: null,
        sessionChallengeAttempts:     0,
      },
    })
  })
})
