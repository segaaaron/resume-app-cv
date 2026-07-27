import { describe, it, expect, vi, beforeEach } from "vitest"
import { SessionChallengeService } from "@/lib/services/auth/SessionChallengeService"
import type { IUserRepository, SessionChallengeUser } from "@/lib/interfaces/IUserRepository"
import type { ISessionRepository } from "@/lib/interfaces/ISessionRepository"
import type { IEmailService } from "@/lib/interfaces/IEmailService"
import type { IRateLimitService } from "@/lib/interfaces/IRateLimitService"
import type { ILogger } from "@/lib/interfaces/ILogger"

vi.mock("@/lib/auth", () => ({ purgeUserCache: vi.fn() }))

const mockUsers: IUserRepository = {
  findByEmail: vi.fn(),
  findByReferralCode: vi.fn(),
  createFromPending: vi.fn(),
  findForReset: vi.fn(),
  updatePassword: vi.fn(),
  findForChallenge: vi.fn(),
  updateSessionChallenge: vi.fn(),
}

const mockSession: ISessionRepository = { clearActiveSession: vi.fn() }
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
  return new SessionChallengeService(mockUsers, mockSession, mockRateLimit, mockEmail, mockLogger)
}

const BASE_USER: SessionChallengeUser = {
  id: "u1", name: "Ana", activeSessionToken: "tok123",
  sessionChallengeCode: null, sessionChallengeExp: null,
  sessionChallengeAttempts: 0, sessionChallengeBlockedUntil: null,
}

beforeEach(() => vi.clearAllMocks())

// ── issueChallenge ─────────────────────────────────────────────────────────────

describe("SessionChallengeService.issueChallenge", () => {
  it("rate limited → throws 429 rate_limited", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(false)
    await expect(makeService().issueChallenge("a@b.com")).rejects.toMatchObject({ code: "rate_limited", status: 429 })
  })

  it("user not found → records failure, returns { sent: true } (anti-enumeration)", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue(null)
    const result = await makeService().issueChallenge("a@b.com")
    expect(result).toEqual({ sent: true })
    expect(mockRateLimit.recordFailure).toHaveBeenCalledWith("a@b.com", "session-challenge")
    expect(mockEmail.sendSessionChallenge).not.toHaveBeenCalled()
  })

  it("user is blocked → returns { sent: true } without sending email (anti-enumeration)", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({ ...BASE_USER, sessionChallengeBlockedUntil: new Date(Date.now() + 99999) })
    const result = await makeService().issueChallenge("a@b.com")
    expect(result).toEqual({ sent: true })
    expect(mockEmail.sendSessionChallenge).not.toHaveBeenCalled()
  })

  it("no active session → returns { sent: true } without sending email", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({ ...BASE_USER, activeSessionToken: null })
    const result = await makeService().issueChallenge("a@b.com")
    expect(result).toEqual({ sent: true })
    expect(mockEmail.sendSessionChallenge).not.toHaveBeenCalled()
  })

  it("happy path → stores OTP hash, sends email, returns { sent: true }", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({ ...BASE_USER })
    vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionChallenge).mockResolvedValue()
    const result = await makeService().issueChallenge("a@b.com")
    expect(result).toEqual({ sent: true })
    const updateCall = vi.mocked(mockUsers.updateSessionChallenge).mock.calls[0]
    expect(updateCall[0]).toBe("u1")
    expect(updateCall[1].sessionChallengeCode).toMatch(/^\$2[aby]\$/)
    expect(updateCall[1].sessionChallengeAttempts).toBe(0)
    expect(mockEmail.sendSessionChallenge).toHaveBeenCalledWith("a@b.com", "Ana", expect.stringMatching(/^\d{6}$/), undefined)
  })
})

// ── verifyChallenge ────────────────────────────────────────────────────────────

describe("SessionChallengeService.verifyChallenge", () => {
  it("rate limited → throws 429 rate_limited", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(false)
    await expect(makeService().verifyChallenge("a@b.com", "123456")).rejects.toMatchObject({ code: "rate_limited", status: 429 })
  })

  it("user not found → throws 400 invalid_or_no_challenge", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue(null)
    await expect(makeService().verifyChallenge("a@b.com", "123456")).rejects.toMatchObject({ code: "invalid_or_no_challenge", status: 400 })
  })

  it("user is blocked → throws 429 blocked with blockedUntil in extra", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    const blockedUntil = new Date(Date.now() + 99999)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({ ...BASE_USER, sessionChallengeBlockedUntil: blockedUntil })
    const err = await makeService().verifyChallenge("a@b.com", "123456").catch((e) => e)
    expect(err.code).toBe("blocked")
    expect(err.status).toBe(429)
    expect(err.extra?.blockedUntil).toBe(blockedUntil.toISOString())
  })

  it("no challenge code stored → throws 400 no_challenge", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({ ...BASE_USER, sessionChallengeCode: null })
    await expect(makeService().verifyChallenge("a@b.com", "123456")).rejects.toMatchObject({ code: "no_challenge", status: 400 })
  })

  it("expired challenge → throws 400 expired", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_USER, sessionChallengeCode: "hash", sessionChallengeExp: new Date(Date.now() - 1000),
    })
    await expect(makeService().verifyChallenge("a@b.com", "123456")).rejects.toMatchObject({ code: "expired", status: 400 })
  })

  it("invalid code below max_attempts → increments, sends failed email, throws 400 invalid with attemptsLeft", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_USER, sessionChallengeAttempts: 1,
      sessionChallengeCode: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      sessionChallengeExp: new Date(Date.now() + 60000),
    })
    vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionChallengeFailed).mockResolvedValue()
    const err = await makeService().verifyChallenge("a@b.com", "000000").catch((e) => e)
    expect(err.code).toBe("invalid")
    expect(err.extra?.attemptsLeft).toBe(3)
    expect(mockEmail.sendSessionChallengeFailed).toHaveBeenCalledWith("a@b.com", "Ana", 3, undefined)
  })

  it("invalid code at max_attempts → blocks user, sends blocked email, throws 429 blocked", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_USER, sessionChallengeAttempts: 4,
      sessionChallengeCode: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      sessionChallengeExp: new Date(Date.now() + 60000),
    })
    vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionChallengeBlocked).mockResolvedValue()
    const err = await makeService().verifyChallenge("a@b.com", "000000").catch((e) => e)
    expect(err.code).toBe("blocked")
    expect(err.status).toBe(429)
    expect(mockEmail.sendSessionChallengeBlocked).toHaveBeenCalledWith("a@b.com", "Ana", expect.any(Date), undefined)
  })

  it("valid code → clears session, sends forced email, returns { success: true }", async () => {
    vi.mocked(mockRateLimit.check).mockResolvedValue(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_USER, sessionChallengeCode: hash, sessionChallengeExp: new Date(Date.now() + 60000),
    })
    vi.mocked(mockSession.clearActiveSession).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionForced).mockResolvedValue()
    const result = await makeService().verifyChallenge("a@b.com", "654321")
    expect(result).toEqual({ success: true })
    expect(mockSession.clearActiveSession).toHaveBeenCalledWith("u1")
    expect(mockEmail.sendSessionForced).toHaveBeenCalledWith("a@b.com", "Ana", undefined)
  })
})
