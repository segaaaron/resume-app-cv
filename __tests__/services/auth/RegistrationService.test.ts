import { describe, it, expect, vi, beforeEach } from "vitest"
import { RegistrationService } from "@/lib/services/auth/RegistrationService"
import { AppError } from "@/lib/services/auth/AppError"
import type { IUserRepository } from "@/lib/interfaces/IUserRepository"
import type { IPendingRegistrationRepository } from "@/lib/interfaces/IPendingRegistrationRepository"
import type { IEmailService } from "@/lib/interfaces/IEmailService"
import type { IRateLimitService } from "@/lib/interfaces/IRateLimitService"
import type { ILogger } from "@/lib/interfaces/ILogger"

const mockUsers: IUserRepository = {
  findByEmail: vi.fn(),
  findByReferralCode: vi.fn(),
  createFromPending: vi.fn(),
  findForReset: vi.fn(),
  updatePassword: vi.fn(),
  findForChallenge: vi.fn(),
  updateSessionChallenge: vi.fn(),
}

const mockPending: IPendingRegistrationRepository = {
  findByEmail: vi.fn(),
  upsert: vi.fn(),
  updateAttempts: vi.fn(),
  deleteByEmail: vi.fn(),
}

const mockEmail: IEmailService = {
  sendRegistrationOtp: vi.fn(),
  sendPasswordResetOtp: vi.fn(),
  sendSessionChallenge: vi.fn(),
  sendSessionChallengeFailed: vi.fn(),
  sendSessionChallengeBlocked: vi.fn(),
  sendSessionForced: vi.fn(),
}

const mockRateLimit: IRateLimitService = { check: vi.fn(), consume: vi.fn() }
// The send paths (issueChallenge / requestOtp / requestReset) now go through the
// atomic `consume`; the confirm/verify paths still use `check`. Setting both keeps
// each test expressing one thing: "the limiter allows / refuses this call".
const setRateLimit = (allowed: boolean) => {
  vi.mocked(mockRateLimit.check).mockResolvedValue(allowed)
  vi.mocked(mockRateLimit.consume).mockResolvedValue(allowed)
}
const mockLogger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

function makeService() {
  return new RegistrationService(mockUsers, mockPending, mockRateLimit, mockEmail, mockLogger)
}

beforeEach(() => vi.clearAllMocks())

// ── requestOtp ────────────────────────────────────────────────────────────────

describe("RegistrationService.requestOtp", () => {
  const input = {
    name: "Ana García",
    email: "ana@example.com",
    password: "Secure123",
    marketingConsent: false,
    ageConsent: true as const,
    referralCode: undefined,
    ipAddress: "1.2.3.4",
  }

  it("rate limited → throws AppError 429 rate_limited", async () => {
    setRateLimit(false)
    await expect(makeService().requestOtp(input)).rejects.toMatchObject({ code: "rate_limited", status: 429 })
    expect(mockPending.upsert).not.toHaveBeenCalled()
  })

  it("email exists with password → throws 409 generic email_exists (no account-type leak)", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({ id: "u1", name: "Ana", email: input.email, hasPassword: true, referralCode: null, plan: "PRO" })
    await expect(makeService().requestOtp(input)).rejects.toMatchObject({ code: "email_exists", status: 409 })
    expect(mockRateLimit.consume).toHaveBeenCalledWith(input.email, "register", 3)
    expect(mockPending.upsert).not.toHaveBeenCalled()
  })

  it("email exists as Google account → throws 409 generic email_exists (no account-type leak)", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({ id: "u1", name: "Ana", email: input.email, hasPassword: false, referralCode: null, plan: "PRO" })
    await expect(makeService().requestOtp(input)).rejects.toMatchObject({ code: "email_exists", status: 409 })
  })

  it("happy path → upserts pending, sends email, returns { pending: true }", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockPending.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendRegistrationOtp).mockResolvedValue()
    const result = await makeService().requestOtp(input)
    expect(result).toEqual({ pending: true })
    expect(mockPending.upsert).toHaveBeenCalledOnce()
    expect(mockEmail.sendRegistrationOtp).toHaveBeenCalledWith(input.email, input.name, expect.stringMatching(/^\d{6}$/), undefined)
  })

  // Same two-key shape as password reset and as login (lib/auth.ts).
  it("counts against the ADDRESS and against the source IP", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockPending.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendRegistrationOtp).mockResolvedValue()

    await makeService().requestOtp(input)

    expect(mockRateLimit.consume).toHaveBeenCalledWith(input.email, "register", 3)
    expect(mockRateLimit.consume).toHaveBeenCalledWith(`ip:${input.ipAddress}`, "register", 20)
  })

  // Holding shift must not buy a fresh quota: mail delivery ignores case, so both
  // spellings reach the same inbox and have to share one counter.
  it("counts capitalisation variants of the same mailbox as ONE address", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockPending.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendRegistrationOtp).mockResolvedValue()

    await makeService().requestOtp({ ...input, email: "Victim@Gmail.com" })

    expect(mockRateLimit.consume).toHaveBeenCalledWith("victim@gmail.com", "register", 3)
    // and the address the mail actually goes to is NOT rewritten
    expect(mockEmail.sendRegistrationOtp).toHaveBeenCalledWith("Victim@Gmail.com", expect.anything(), expect.anything(), undefined)
  })

  it("an exhausted address is refused even from a fresh IP", async () => {
    vi.mocked(mockRateLimit.consume).mockImplementation(async (key: string) => key.startsWith("ip:"))

    await expect(makeService().requestOtp(input)).rejects.toMatchObject({ code: "rate_limited", status: 429 })
    expect(mockEmail.sendRegistrationOtp).not.toHaveBeenCalled()
  })

  // The bug this guards: usage was recorded ONLY when the email already existed, so the
  // branch that actually SENDS the mail left the counter at zero and could be replayed
  // for ever. Asserting `consume` (which counts) and NOT `check` (which only reads) is
  // what makes this test fail if anyone puts the read-only call back.
  it("counts the attempt on the branch that SENDS the email", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockPending.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendRegistrationOtp).mockResolvedValue()

    await makeService().requestOtp(input)

    expect(mockEmail.sendRegistrationOtp).toHaveBeenCalledOnce()
    expect(mockRateLimit.consume).toHaveBeenCalledWith(input.email, "register", 3)
    expect(mockRateLimit.check).not.toHaveBeenCalled()
  })

  it("OTP code is exactly 6 digits between 100000–999999", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockPending.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendRegistrationOtp).mockResolvedValue()
    await makeService().requestOtp(input)
    const sentCode = vi.mocked(mockEmail.sendRegistrationOtp).mock.calls[0][2]
    expect(sentCode).toMatch(/^\d{6}$/)
    expect(Number(sentCode)).toBeGreaterThanOrEqual(100000)
    expect(Number(sentCode)).toBeLessThanOrEqual(999999)
  })
})

// ── confirmOtp ────────────────────────────────────────────────────────────────

describe("RegistrationService.confirmOtp", () => {
  it("rate limited → throws 429 rate_limited", async () => {
    setRateLimit(false)
    await expect(makeService().confirmOtp({ email: "a@b.com", code: "123456" })).rejects.toMatchObject({ code: "rate_limited", status: 429 })
  })

  it("no pending registration → throws 400 no_pending", async () => {
    setRateLimit(true)
    vi.mocked(mockPending.findByEmail).mockResolvedValue(null)
    await expect(makeService().confirmOtp({ email: "a@b.com", code: "123456" })).rejects.toMatchObject({ code: "no_pending", status: 400 })
  })

  it("expired OTP → deletes pending, throws 400 expired", async () => {
    setRateLimit(true)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      email: "a@b.com", name: "Ana", passwordHash: "h", marketingConsent: false,
      ageConsent: true, referralCode: null,
      otpHash: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      attempts: 0, otpExp: new Date(Date.now() - 1000),
    })
    vi.mocked(mockPending.deleteByEmail).mockResolvedValue()
    await expect(makeService().confirmOtp({ email: "a@b.com", code: "123456" })).rejects.toMatchObject({ code: "expired", status: 400 })
    expect(mockPending.deleteByEmail).toHaveBeenCalledWith("a@b.com")
  })

  it("invalid code below max_attempts → increments attempts, throws 400 invalid with attemptsLeft", async () => {
    setRateLimit(true)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      email: "a@b.com", name: "Ana", passwordHash: "h", marketingConsent: false,
      ageConsent: true, referralCode: null,
      otpHash: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      attempts: 2, otpExp: new Date(Date.now() + 60000),
    })
    vi.mocked(mockPending.updateAttempts).mockResolvedValue()
    const svc = makeService()
    const err = await svc.confirmOtp({ email: "a@b.com", code: "000000" }).catch((e) => e) as AppError
    expect(err.code).toBe("invalid")
    expect(err.status).toBe(400)
    expect(err.extra?.attemptsLeft).toBe(2)
    expect(mockPending.updateAttempts).toHaveBeenCalledWith("a@b.com", 3)
  })

  it("invalid code at max_attempts → deletes pending, throws 429 max_attempts", async () => {
    setRateLimit(true)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      email: "a@b.com", name: "Ana", passwordHash: "h", marketingConsent: false,
      ageConsent: true, referralCode: null,
      otpHash: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      attempts: 4, otpExp: new Date(Date.now() + 60000),
    })
    vi.mocked(mockPending.deleteByEmail).mockResolvedValue()
    await expect(makeService().confirmOtp({ email: "a@b.com", code: "000000" })).rejects.toMatchObject({ code: "max_attempts", status: 429 })
    expect(mockPending.deleteByEmail).toHaveBeenCalledWith("a@b.com")
  })

  it("email taken (race condition) → deletes pending, throws 409 email_taken", async () => {
    setRateLimit(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      email: "a@b.com", name: "Ana", passwordHash: "h", marketingConsent: false,
      ageConsent: true, referralCode: null, otpHash: hash, attempts: 0,
      otpExp: new Date(Date.now() + 60000),
    })
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({ id: "u1", name: "Ana", email: "a@b.com", hasPassword: true, referralCode: null, plan: "PRO" })
    vi.mocked(mockPending.deleteByEmail).mockResolvedValue()
    await expect(makeService().confirmOtp({ email: "a@b.com", code: "654321" })).rejects.toMatchObject({ code: "email_taken", status: 409 })
  })

  it("valid code, no referral → creates user, returns { success: true }", async () => {
    setRateLimit(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      email: "a@b.com", name: "Ana", passwordHash: "h", marketingConsent: false,
      ageConsent: true, referralCode: null, otpHash: hash, attempts: 0,
      otpExp: new Date(Date.now() + 60000),
    })
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockUsers.createFromPending).mockResolvedValue()
    const result = await makeService().confirmOtp({ email: "a@b.com", code: "654321" })
    expect(result).toEqual({ success: true })
    expect(mockUsers.createFromPending).toHaveBeenCalledOnce()
    const callArgs = vi.mocked(mockUsers.createFromPending).mock.calls[0]
    expect(callArgs[1]).toMatch(/^[a-z0-9_-]{8}$/i)
    expect(callArgs[2]).toBeUndefined()
  })

  it("valid code with valid referralCode → creates user with referrerId", async () => {
    setRateLimit(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      email: "a@b.com", name: "Ana", passwordHash: "h", marketingConsent: false,
      ageConsent: true, referralCode: "REF001", otpHash: hash, attempts: 0,
      otpExp: new Date(Date.now() + 60000),
    })
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockUsers.findByReferralCode).mockResolvedValue({ id: "referrer-u1" })
    vi.mocked(mockUsers.createFromPending).mockResolvedValue()
    await makeService().confirmOtp({ email: "a@b.com", code: "654321" })
    expect(vi.mocked(mockUsers.createFromPending).mock.calls[0][2]).toBe("referrer-u1")
  })
})
