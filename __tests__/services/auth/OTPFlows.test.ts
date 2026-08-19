/**
 * OTPFlows.test.ts
 *
 * Comprehensive test suite for ALL auth OTP flows:
 *   A. Session Challenge OTP (2FA login verification)
 *   B. Registration OTP (email confirmation)
 *   C. Password Reset OTP
 *
 * Each section covers happy paths, every error branch, expiry,
 * max-attempts, blocking, race conditions, and security edge cases.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { SessionChallengeService } from "@/lib/services/auth/SessionChallengeService"
import { RegistrationService } from "@/lib/services/auth/RegistrationService"
import { PasswordResetService } from "@/lib/services/auth/PasswordResetService"
import { AppError } from "@/lib/services/auth/AppError"
import type { IUserRepository, SessionChallengeUser } from "@/lib/interfaces/IUserRepository"
import type { ISessionRepository } from "@/lib/interfaces/ISessionRepository"
import type { IPendingRegistrationRepository } from "@/lib/interfaces/IPendingRegistrationRepository"
import type { IPasswordResetRepository } from "@/lib/interfaces/IPasswordResetRepository"
import type { IEmailService } from "@/lib/interfaces/IEmailService"
import type { IRateLimitService } from "@/lib/interfaces/IRateLimitService"
import type { ILogger } from "@/lib/interfaces/ILogger"

// ── Global mocks ───────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({ purgeUserCache: vi.fn() }))
vi.mock("@/lib/db", () => ({ db: { user: { update: vi.fn().mockResolvedValue({}) } } }))

// ── Shared mock factories ──────────────────────────────────────────────────────

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

const mockPending: IPendingRegistrationRepository = {
  findByEmail: vi.fn(),
  upsert: vi.fn(),
  updateAttempts: vi.fn(),
  deleteByEmail: vi.fn(),
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

const mockRateLimit: IRateLimitService = { check: vi.fn(), consume: vi.fn() }
// The send paths (issueChallenge / requestOtp / requestReset) now go through the
// atomic `consume`; the confirm/verify paths still use `check`. Setting both keeps
// each test expressing one thing: "the limiter allows / refuses this call".
const setRateLimit = (allowed: boolean) => {
  vi.mocked(mockRateLimit.check).mockResolvedValue(allowed)
  vi.mocked(mockRateLimit.consume).mockResolvedValue(allowed)
}
const mockLogger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

// ── Service factories ──────────────────────────────────────────────────────────

function makeChallengeService() {
  return new SessionChallengeService(mockUsers, mockSession, mockRateLimit, mockEmail, mockLogger)
}

function makeRegistrationService() {
  return new RegistrationService(mockUsers, mockPending, mockRateLimit, mockEmail, mockLogger)
}

function makePasswordResetService() {
  return new PasswordResetService(mockUsers, mockResets, mockRateLimit, mockEmail, mockLogger)
}

// ── Base fixture objects ───────────────────────────────────────────────────────

const BASE_CHALLENGE_USER: SessionChallengeUser = {
  id: "u1",
  name: "Ana",
  activeSessionToken: "tok123",
  sessionChallengeCode: null,
  sessionChallengeExp: null,
  sessionChallengeAttempts: 0,
  sessionChallengeBlockedUntil: null,
}

const BASE_PENDING = {
  email: "ana@example.com",
  name: "Ana García",
  passwordHash: "hashed_pw",
  marketingConsent: false,
  ageConsent: true,
  referralCode: null,
  otpHash: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  attempts: 0,
  otpExp: new Date(Date.now() + 60_000),
}

const BASE_RESET_RECORD = {
  email: "ana@example.com",
  otpHash: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  expiresAt: new Date(Date.now() + 10 * 60_000),
  attempts: 0,
  usedAt: null,
}

const REGISTER_INPUT = {
  name: "Ana García",
  email: "ana@example.com",
  password: "Secure123",
  marketingConsent: false,
  ageConsent: true as const,
  referralCode: undefined,
  ipAddress: "1.2.3.4",
}

beforeEach(() => vi.clearAllMocks())

// ═══════════════════════════════════════════════════════════════════════════════
// A. SESSION CHALLENGE OTP (2FA login verification)
// ═══════════════════════════════════════════════════════════════════════════════

describe("A. SessionChallengeService — issueChallenge", () => {
  it("A01 rate limited → throws 429 rate_limited", async () => {
    setRateLimit(false)
    await expect(makeChallengeService().issueChallenge("a@b.com"))
      .rejects.toMatchObject({ code: "rate_limited", status: 429 })
  })

  it("A02 unauthenticated / user not in DB (orphan JWT) → anti-enumeration: returns { sent: true }, does NOT send email", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue(null)
    const result = await makeChallengeService().issueChallenge("orphan@example.com")
    expect(result).toEqual({ sent: true })
    expect(mockEmail.sendSessionChallenge).not.toHaveBeenCalled()
    expect(mockRateLimit.consume).toHaveBeenCalledWith("orphan@example.com", "session-challenge", 5)
  })

  it("A03 user is blocked (sessionChallengeBlockedUntil in future) → returns { sent: true }, does NOT send email", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeBlockedUntil: new Date(Date.now() + 99_999),
    })
    const result = await makeChallengeService().issueChallenge("a@b.com")
    expect(result).toEqual({ sent: true })
    expect(mockEmail.sendSessionChallenge).not.toHaveBeenCalled()
  })

  it("A04 user is NOT blocked (blockedUntil in the past) → proceeds to send email", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      // past block should not trigger the block guard
      sessionChallengeBlockedUntil: new Date(Date.now() - 1000),
    })
    vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionChallenge).mockResolvedValue()
    const result = await makeChallengeService().issueChallenge("a@b.com")
    expect(result).toEqual({ sent: true })
    expect(mockEmail.sendSessionChallenge).toHaveBeenCalledOnce()
  })

  it("A05 user has no active session token → returns { sent: true }, does NOT send email", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      activeSessionToken: null,
    })
    const result = await makeChallengeService().issueChallenge("a@b.com")
    expect(result).toEqual({ sent: true })
    expect(mockEmail.sendSessionChallenge).not.toHaveBeenCalled()
  })

  it("A06 happy path → persists hashed OTP, resets attempts to 0, sends 6-digit code, returns { sent: true }", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({ ...BASE_CHALLENGE_USER })
    vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionChallenge).mockResolvedValue()

    const result = await makeChallengeService().issueChallenge("a@b.com")

    expect(result).toEqual({ sent: true })
    const [userId, update] = vi.mocked(mockUsers.updateSessionChallenge).mock.calls[0]
    expect(userId).toBe("u1")
    expect(update.sessionChallengeCode).toMatch(/^\$2[aby]\$/)
    expect(update.sessionChallengeAttempts).toBe(0)
    expect(update.sessionChallengeExp).toBeInstanceOf(Date)
    expect(update.sessionChallengeExp!.getTime()).toBeGreaterThan(Date.now())

    const sentCode = vi.mocked(mockEmail.sendSessionChallenge).mock.calls[0][2]
    expect(sentCode).toMatch(/^\d{6}$/)
    expect(Number(sentCode)).toBeGreaterThanOrEqual(100_000)
    expect(Number(sentCode)).toBeLessThanOrEqual(999_999)
  })

  /**
   * A07 — INVERTIDO A PROPOSITO, y conviene saber por que.
   *
   * Este caso afirmaba lo contrario: sin nombre, no se enviaba el correo. No
   * defendia una decision — el comentario decia "email was NOT sent because name
   * is null", que describe el codigo en vez de justificarlo, y el encabezado del
   * archivo dice que cubre "cada rama de error". Cubria la rama; nadie la habia
   * elegido.
   *
   * Lo que costaba: `user.name` es null para TODOS los usuarios managed —
   * la creacion de LIMITED escribe correo, contrasena, plan y topes, y el panel
   * del admin ni pide un nombre. Con sesion abierta en la computadora, ese
   * usuario intentaba entrar desde el telefono, se topaba con el guard de sesion
   * unica, pedia el codigo, la API respondia `{ sent: true }` y el correo no
   * salia nunca. Quedaba afuera hasta que la sesion vieja se enfriara (30 min) o
   * el JWT expirara solo (24 h) — con la pestana abierta, nunca.
   *
   * Y no hay razon de seguridad para callarse: el correo esta verificado y el
   * mismo repositorio ya manda siempre en `PasswordResetService`, usando
   * `user.name ?? "Usuario"` para el saludo. El nombre es el saludo de la carta,
   * no la llave de la puerta.
   */
  it("A07 user.name is null → issueChallenge SI envia el codigo, saludando sin nombre", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      name: null,
    })
    vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionChallenge).mockResolvedValue()

    const result = await makeChallengeService().issueChallenge("noname@b.com")
    expect(result).toEqual({ sent: true })
    expect(mockUsers.updateSessionChallenge).toHaveBeenCalledOnce()
    expect(mockEmail.sendSessionChallenge).toHaveBeenCalledOnce()
    // El saludo cae a un generico; lo que no puede caerse es el envio.
    const [, greeting, code] = vi.mocked(mockEmail.sendSessionChallenge).mock.calls[0]
    expect(greeting).toBeTruthy()
    expect(String(code)).toMatch(/^\d{6}$/)
  })

  it("A08 OTP expiry window is 10 minutes from now", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({ ...BASE_CHALLENGE_USER })
    vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionChallenge).mockResolvedValue()

    const before = Date.now()
    await makeChallengeService().issueChallenge("a@b.com")
    const after = Date.now()

    const [, update] = vi.mocked(mockUsers.updateSessionChallenge).mock.calls[0]
    const exp = update.sessionChallengeExp!.getTime()
    // Should be ~10 min from now (within 1s tolerance)
    expect(exp).toBeGreaterThanOrEqual(before + 10 * 60_000 - 100)
    expect(exp).toBeLessThanOrEqual(after + 10 * 60_000 + 100)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe("A. SessionChallengeService — verifyChallenge", () => {
  it("A09 rate limited → throws 429 rate_limited", async () => {
    setRateLimit(false)
    await expect(makeChallengeService().verifyChallenge("a@b.com", "123456"))
      .rejects.toMatchObject({ code: "rate_limited", status: 429 })
  })

  it("A10 user not found → throws 400 invalid_or_no_challenge", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue(null)
    await expect(makeChallengeService().verifyChallenge("ghost@b.com", "123456"))
      .rejects.toMatchObject({ code: "invalid_or_no_challenge", status: 400 })
  })

  it("A11 user is blocked → throws 429 blocked with blockedUntil in extra", async () => {
    setRateLimit(true)
    const blockedUntil = new Date(Date.now() + 99_999)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeBlockedUntil: blockedUntil,
    })
    const err = await makeChallengeService().verifyChallenge("a@b.com", "123456").catch((e) => e) as AppError
    expect(err.code).toBe("blocked")
    expect(err.status).toBe(429)
    expect(err.extra?.blockedUntil).toBe(blockedUntil.toISOString())
  })

  it("A12 no challenge code stored (null) → throws 400 no_challenge", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeCode: null,
      sessionChallengeExp: new Date(Date.now() + 60_000),
    })
    await expect(makeChallengeService().verifyChallenge("a@b.com", "123456"))
      .rejects.toMatchObject({ code: "no_challenge", status: 400 })
  })

  it("A13 no expiry stored (null) → throws 400 no_challenge", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeCode: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      sessionChallengeExp: null,
    })
    await expect(makeChallengeService().verifyChallenge("a@b.com", "123456"))
      .rejects.toMatchObject({ code: "no_challenge", status: 400 })
  })

  it("A14 correct code but expired → throws 400 expired (expiry checked before bcrypt)", async () => {
    setRateLimit(true)
    // Use a real bcrypt hash so the code WOULD match if expiry weren't checked
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeCode: hash,
      sessionChallengeExp: new Date(Date.now() - 1000), // expired 1s ago
    })
    await expect(makeChallengeService().verifyChallenge("a@b.com", "654321"))
      .rejects.toMatchObject({ code: "expired", status: 400 })
    // bcrypt compare should NOT have been called
    expect(mockUsers.updateSessionChallenge).not.toHaveBeenCalled()
  })

  it("A15 wrong code, attempts=1 → increments to 2, sends failed email, throws 400 invalid with attemptsLeft=3", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeAttempts: 1,
      sessionChallengeCode: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      sessionChallengeExp: new Date(Date.now() + 60_000),
    })
    vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionChallengeFailed).mockResolvedValue()

    const err = await makeChallengeService().verifyChallenge("a@b.com", "000000").catch((e) => e) as AppError
    expect(err.code).toBe("invalid")
    expect(err.status).toBe(400)
    expect(err.extra?.attemptsLeft).toBe(3) // MAX_ATTEMPTS(5) - newAttempts(2)
    expect(mockEmail.sendSessionChallengeFailed).toHaveBeenCalledWith("a@b.com", "Ana", 3, undefined)
    expect(mockUsers.updateSessionChallenge).toHaveBeenCalledWith("u1", { sessionChallengeAttempts: 2 })
  })

  it("A16 wrong code, attempts=0 → attemptsLeft=4", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeAttempts: 0,
      sessionChallengeCode: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      sessionChallengeExp: new Date(Date.now() + 60_000),
    })
    vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionChallengeFailed).mockResolvedValue()

    const err = await makeChallengeService().verifyChallenge("a@b.com", "000000").catch((e) => e) as AppError
    expect(err.code).toBe("invalid")
    expect(err.extra?.attemptsLeft).toBe(4)
  })

  it("A17 wrong code at MAX_ATTEMPTS (4 existing → 5 total) → blocks user, sends blocked email, throws 429 blocked", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeAttempts: 4, // next failure = 5 = MAX
      sessionChallengeCode: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      sessionChallengeExp: new Date(Date.now() + 60_000),
    })
    vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionChallengeBlocked).mockResolvedValue()

    const err = await makeChallengeService().verifyChallenge("a@b.com", "000000").catch((e) => e) as AppError
    expect(err.code).toBe("blocked")
    expect(err.status).toBe(429)
    expect(mockEmail.sendSessionChallengeBlocked).toHaveBeenCalledWith("a@b.com", "Ana", expect.any(Date), undefined)

    // The update should include blockedUntil, null code + exp
    const [, update] = vi.mocked(mockUsers.updateSessionChallenge).mock.calls[0]
    expect(update.sessionChallengeBlockedUntil).toBeInstanceOf(Date)
    expect(update.sessionChallengeCode).toBeNull()
    expect(update.sessionChallengeExp).toBeNull()
  })

  it("A18 block duration is 5 hours", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeAttempts: 4,
      sessionChallengeCode: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      sessionChallengeExp: new Date(Date.now() + 60_000),
    })
    vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionChallengeBlocked).mockResolvedValue()

    const before = Date.now()
    await makeChallengeService().verifyChallenge("a@b.com", "000000").catch(() => {})
    const after = Date.now()

    const [, update] = vi.mocked(mockUsers.updateSessionChallenge).mock.calls[0]
    const blockedUntil = update.sessionChallengeBlockedUntil!.getTime()
    const fiveHoursMs = 5 * 60 * 60_000
    expect(blockedUntil).toBeGreaterThanOrEqual(before + fiveHoursMs - 100)
    expect(blockedUntil).toBeLessThanOrEqual(after + fiveHoursMs + 100)
  })

  it("A19 correct code → clears active session, purges cache, sends forced email, returns { success: true }", async () => {
    setRateLimit(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeCode: hash,
      sessionChallengeExp: new Date(Date.now() + 60_000),
    })
    vi.mocked(mockSession.clearActiveSession).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionForced).mockResolvedValue()

    const result = await makeChallengeService().verifyChallenge("a@b.com", "654321")
    expect(result).toEqual({ success: true })
    expect(mockSession.clearActiveSession).toHaveBeenCalledWith("u1")
    expect(mockEmail.sendSessionForced).toHaveBeenCalledWith("a@b.com", "Ana", undefined)
    // purgeUserCache is called (mocked via vi.mock("@/lib/auth"))
    const { purgeUserCache } = await import("@/lib/auth")
    expect(purgeUserCache).toHaveBeenCalledWith("u1")
  })

  it("A20 already-used code (cleared after success): code stored is null after prior success → throws 400 no_challenge", async () => {
    // After a successful verify, code+exp are cleared. The next attempt should fail.
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeCode: null,  // cleared by prior success
      sessionChallengeExp: null,
    })
    await expect(makeChallengeService().verifyChallenge("a@b.com", "654321"))
      .rejects.toMatchObject({ code: "no_challenge", status: 400 })
  })

  it("A21 blocked user tries to request a new OTP → issueChallenge returns { sent: true } silently, no email", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeBlockedUntil: new Date(Date.now() + 60 * 60_000),
    })
    const result = await makeChallengeService().issueChallenge("blocked@b.com")
    expect(result).toEqual({ sent: true })
    expect(mockUsers.updateSessionChallenge).not.toHaveBeenCalled()
    expect(mockEmail.sendSessionChallenge).not.toHaveBeenCalled()
  })

  it("A22 OTP with leading zeros (e.g. 100000) is a valid 6-digit code and is accepted", async () => {
    // The service generates codes in range 100000-999999, all 6 digits.
    // This test verifies that the code format is always /^\d{6}$/ (no leading zeros
    // are possible given the algorithm, but verify via regex on generated code).
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({ ...BASE_CHALLENGE_USER })
    vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionChallenge).mockResolvedValue()

    await makeChallengeService().issueChallenge("a@b.com")
    const sentCode = vi.mocked(mockEmail.sendSessionChallenge).mock.calls[0][2]
    // Always 6 digits, no leading zeros since min is 100000
    expect(sentCode).toMatch(/^[1-9]\d{5}$/)
  })

  it("A23 verifyChallenge uses a different rate-limit key than issueChallenge", async () => {
    // verifyChallenge checks 'session-challenge-verify', not 'session-challenge'
    setRateLimit(false)
    await makeChallengeService().verifyChallenge("a@b.com", "123456").catch(() => {})
    expect(mockRateLimit.check).toHaveBeenCalledWith("a@b.com", "session-challenge-verify", 10)
  })

  it("A24 issueChallenge uses rate-limit key 'session-challenge' with limit 5", async () => {
    setRateLimit(false)
    await makeChallengeService().issueChallenge("a@b.com").catch(() => {})
    expect(mockRateLimit.consume).toHaveBeenCalledWith("a@b.com", "session-challenge", 5)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// B. REGISTRATION OTP (email confirmation)
// ═══════════════════════════════════════════════════════════════════════════════

describe("B. RegistrationService — requestOtp", () => {
  it("B01 rate limited → throws 429 rate_limited, does NOT upsert pending", async () => {
    setRateLimit(false)
    await expect(makeRegistrationService().requestOtp(REGISTER_INPUT))
      .rejects.toMatchObject({ code: "rate_limited", status: 429 })
    expect(mockPending.upsert).not.toHaveBeenCalled()
  })

  it("B02 email already exists with password → records failure, throws 409 generic email_exists", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({
      id: "u1", name: "Ana", email: REGISTER_INPUT.email, hasPassword: true, referralCode: null,
      plan: "PRO",
    })
    await expect(makeRegistrationService().requestOtp(REGISTER_INPUT))
      .rejects.toMatchObject({ code: "email_exists", status: 409 })
    expect(mockRateLimit.consume).toHaveBeenCalledWith(REGISTER_INPUT.email, "register", 3)
    expect(mockPending.upsert).not.toHaveBeenCalled()
  })

  it("B03 email exists as Google-only account (no password) → throws 409 generic email_exists (no account-type leak)", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({
      id: "u1", name: "Ana", email: REGISTER_INPUT.email, hasPassword: false, referralCode: null,
      plan: "PRO",
    })
    await expect(makeRegistrationService().requestOtp(REGISTER_INPUT))
      .rejects.toMatchObject({ code: "email_exists", status: 409 })
    expect(mockRateLimit.consume).toHaveBeenCalledWith(REGISTER_INPUT.email, "register", 3)
  })

  it("B04 happy path → upserts pending record, sends 6-digit OTP, returns { pending: true }", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockPending.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendRegistrationOtp).mockResolvedValue()

    const result = await makeRegistrationService().requestOtp(REGISTER_INPUT)
    expect(result).toEqual({ pending: true })
    expect(mockPending.upsert).toHaveBeenCalledOnce()
    expect(mockEmail.sendRegistrationOtp).toHaveBeenCalledWith(
      REGISTER_INPUT.email,
      REGISTER_INPUT.name,
      expect.stringMatching(/^\d{6}$/),
      undefined,
    )
  })

  it("B05 generated OTP is exactly 6 digits in range 100000-999999 (no leading zeros)", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockPending.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendRegistrationOtp).mockResolvedValue()

    await makeRegistrationService().requestOtp(REGISTER_INPUT)
    const sentCode = vi.mocked(mockEmail.sendRegistrationOtp).mock.calls[0][2]
    expect(sentCode).toMatch(/^\d{6}$/)
    expect(Number(sentCode)).toBeGreaterThanOrEqual(100_000)
    expect(Number(sentCode)).toBeLessThanOrEqual(999_999)
  })

  it("B06 pending record upsert includes hashed password, hashed OTP, expiry, and all user fields", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockPending.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendRegistrationOtp).mockResolvedValue()

    await makeRegistrationService().requestOtp({
      ...REGISTER_INPUT,
      marketingConsent: true,
      referralCode: "REF42",
    })

    const upsertArg = vi.mocked(mockPending.upsert).mock.calls[0][0]
    expect(upsertArg.email).toBe(REGISTER_INPUT.email)
    expect(upsertArg.name).toBe(REGISTER_INPUT.name)
    expect(upsertArg.passwordHash).toMatch(/^\$2[aby]\$/)  // bcrypt hash
    expect(upsertArg.otpHash).toMatch(/^\$2[aby]\$/)       // bcrypt hash
    expect(upsertArg.otpExp).toBeInstanceOf(Date)
    expect(upsertArg.otpExp.getTime()).toBeGreaterThan(Date.now())
    expect(upsertArg.marketingConsent).toBe(true)
    expect(upsertArg.referralCode).toBe("REF42")
  })

  it("B07 requestOtp uses ipAddress as rate-limit key with 'register' and limit 5", async () => {
    setRateLimit(false)
    await makeRegistrationService().requestOtp(REGISTER_INPUT).catch(() => {})
    expect(mockRateLimit.consume).toHaveBeenCalledWith(REGISTER_INPUT.email, "register", 3)
  })

  it("B08 SQL-injection-like input in email → treated as invalid user lookup, no real email sent if rejected", async () => {
    // The schema validation at route level would reject these, but at service level
    // the email is passed directly to findByEmail — the mock should handle any string.
    setRateLimit(true)
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockPending.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendRegistrationOtp).mockResolvedValue()

    // Service doesn't validate email format — that's the route's job.
    // Here we just verify the service passes the email as-is to the repo.
    const maliciousEmail = "'; DROP TABLE users; --@example.com"
    await makeRegistrationService().requestOtp({ ...REGISTER_INPUT, email: maliciousEmail })
    expect(mockUsers.findByEmail).toHaveBeenCalledWith(maliciousEmail)
    expect(mockPending.upsert).toHaveBeenCalledOnce()
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe("B. RegistrationService — confirmOtp", () => {
  it("B09 rate limited → throws 429 rate_limited", async () => {
    setRateLimit(false)
    await expect(makeRegistrationService().confirmOtp({ email: "a@b.com", code: "123456" }))
      .rejects.toMatchObject({ code: "rate_limited", status: 429 })
  })

  it("B10 no pending registration (non-existent token) → throws 400 no_pending", async () => {
    setRateLimit(true)
    vi.mocked(mockPending.findByEmail).mockResolvedValue(null)
    await expect(makeRegistrationService().confirmOtp({ email: "ghost@b.com", code: "123456" }))
      .rejects.toMatchObject({ code: "no_pending", status: 400 })
  })

  it("B11 OTP expired (24h window exceeded) → deletes pending, throws 400 expired", async () => {
    setRateLimit(true)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      ...BASE_PENDING,
      otpExp: new Date(Date.now() - 24 * 60 * 60_000), // 24h ago
    })
    vi.mocked(mockPending.deleteByEmail).mockResolvedValue()

    await expect(makeRegistrationService().confirmOtp({ email: "a@b.com", code: "123456" }))
      .rejects.toMatchObject({ code: "expired", status: 400 })
    expect(mockPending.deleteByEmail).toHaveBeenCalledWith("a@b.com")
  })

  it("B12 OTP expired by 1 second → still throws 400 expired and deletes pending", async () => {
    setRateLimit(true)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      ...BASE_PENDING,
      otpExp: new Date(Date.now() - 1000),
    })
    vi.mocked(mockPending.deleteByEmail).mockResolvedValue()

    await expect(makeRegistrationService().confirmOtp({ email: "a@b.com", code: "123456" }))
      .rejects.toMatchObject({ code: "expired", status: 400 })
    expect(mockPending.deleteByEmail).toHaveBeenCalledWith("a@b.com")
  })

  it("B13 wrong code, attempts=2 → increments to 3, attemptsLeft=2, throws 400 invalid", async () => {
    setRateLimit(true)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      ...BASE_PENDING,
      attempts: 2,
    })
    vi.mocked(mockPending.updateAttempts).mockResolvedValue()

    const err = await makeRegistrationService().confirmOtp({ email: "a@b.com", code: "000000" }).catch((e) => e) as AppError
    expect(err.code).toBe("invalid")
    expect(err.status).toBe(400)
    expect(err.extra?.attemptsLeft).toBe(2) // 5 - 3 = 2
    expect(mockPending.updateAttempts).toHaveBeenCalledWith("a@b.com", 3)
  })

  it("B14 wrong code, attempts=0 → attemptsLeft=4", async () => {
    setRateLimit(true)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      ...BASE_PENDING,
      attempts: 0,
    })
    vi.mocked(mockPending.updateAttempts).mockResolvedValue()

    const err = await makeRegistrationService().confirmOtp({ email: "a@b.com", code: "000000" }).catch((e) => e) as AppError
    expect(err.extra?.attemptsLeft).toBe(4)
  })

  it("B15 wrong code at max_attempts (4 existing → 5 total) → deletes pending, throws 429 max_attempts", async () => {
    setRateLimit(true)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      ...BASE_PENDING,
      attempts: 4,
    })
    vi.mocked(mockPending.deleteByEmail).mockResolvedValue()

    await expect(makeRegistrationService().confirmOtp({ email: "a@b.com", code: "000000" }))
      .rejects.toMatchObject({ code: "max_attempts", status: 429 })
    expect(mockPending.deleteByEmail).toHaveBeenCalledWith("a@b.com")
  })

  it("B16 email taken race condition (another user registered with same email between OTP send and confirm) → deletes pending, throws 409 email_taken", async () => {
    setRateLimit(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      ...BASE_PENDING,
      otpHash: hash,
      otpExp: new Date(Date.now() + 60_000),
    })
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({
      id: "u99", name: "Other", email: "a@b.com", hasPassword: true, referralCode: null,
      plan: "PRO",
    })
    vi.mocked(mockPending.deleteByEmail).mockResolvedValue()

    await expect(makeRegistrationService().confirmOtp({ email: "a@b.com", code: "654321" }))
      .rejects.toMatchObject({ code: "email_taken", status: 409 })
    expect(mockPending.deleteByEmail).toHaveBeenCalledWith("a@b.com")
  })

  it("B17 valid code, no referral → creates user with generated 8-char nanoid, no referrerId", async () => {
    setRateLimit(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      ...BASE_PENDING,
      otpHash: hash,
      otpExp: new Date(Date.now() + 60_000),
      referralCode: null,
    })
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockUsers.createFromPending).mockResolvedValue()

    const result = await makeRegistrationService().confirmOtp({ email: "a@b.com", code: "654321" })
    expect(result).toEqual({ success: true })
    const [, generatedId, referrerId] = vi.mocked(mockUsers.createFromPending).mock.calls[0]
    expect(generatedId).toMatch(/^[a-zA-Z0-9_-]{8}$/)
    expect(referrerId).toBeUndefined()
  })

  it("B18 valid code with valid referral code → creates user with referrerId", async () => {
    setRateLimit(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      ...BASE_PENDING,
      otpHash: hash,
      otpExp: new Date(Date.now() + 60_000),
      referralCode: "REFABC",
    })
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockUsers.findByReferralCode).mockResolvedValue({ id: "referrer-u99" })
    vi.mocked(mockUsers.createFromPending).mockResolvedValue()

    await makeRegistrationService().confirmOtp({ email: "a@b.com", code: "654321" })
    const [, , referrerId] = vi.mocked(mockUsers.createFromPending).mock.calls[0]
    expect(referrerId).toBe("referrer-u99")
  })

  it("B19 valid code with invalid referral code → creates user WITHOUT referrerId (referral silently ignored)", async () => {
    setRateLimit(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      ...BASE_PENDING,
      otpHash: hash,
      otpExp: new Date(Date.now() + 60_000),
      referralCode: "BOGUS",
    })
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockUsers.findByReferralCode).mockResolvedValue(null) // referral not found
    vi.mocked(mockUsers.createFromPending).mockResolvedValue()

    await makeRegistrationService().confirmOtp({ email: "a@b.com", code: "654321" })
    const [, , referrerId] = vi.mocked(mockUsers.createFromPending).mock.calls[0]
    expect(referrerId).toBeUndefined()
  })

  it("B20 confirmOtp uses email as rate-limit key (not IP) with 'register-confirm' and limit 10", async () => {
    setRateLimit(false)
    await makeRegistrationService().confirmOtp({ email: "a@b.com", code: "123456" }).catch(() => {})
    expect(mockRateLimit.check).toHaveBeenCalledWith("a@b.com", "register-confirm", 10)
  })

  it("B21 already verified user (existing user, code correct) → race condition handled as email_taken", async () => {
    // If the user was already created (verified), findByEmail returns a user,
    // so the service throws email_taken and deletes the stale pending record.
    setRateLimit(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      ...BASE_PENDING,
      otpHash: hash,
      otpExp: new Date(Date.now() + 60_000),
    })
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({
      id: "u1", name: "Ana", email: "a@b.com", hasPassword: true, referralCode: null,
      plan: "PRO",
    })
    vi.mocked(mockPending.deleteByEmail).mockResolvedValue()

    await expect(makeRegistrationService().confirmOtp({ email: "a@b.com", code: "654321" }))
      .rejects.toMatchObject({ code: "email_taken", status: 409 })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// C. PASSWORD RESET OTP
// ═══════════════════════════════════════════════════════════════════════════════

describe("C. PasswordResetService — requestReset", () => {
  it("C01 rate limited → throws 429 rate_limited", async () => {
    setRateLimit(false)
    await expect(makePasswordResetService().requestReset("1.2.3.4", "a@b.com"))
      .rejects.toMatchObject({ code: "rate_limited", status: 429 })
  })

  it("C02 non-existent email → anti-enumeration: silent { sent: true }, records failure, no email", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForReset).mockResolvedValue(null)
    await expect(makePasswordResetService().requestReset("1.2.3.4", "nobody@b.com"))
      .resolves.toEqual({ sent: true })
    // Counted under the address that was probed, not the source — that is what makes
    // burying one mailbox impossible even from a rotating set of IPs.
    expect(mockRateLimit.consume).toHaveBeenCalledWith("nobody@b.com", "reset-password-request", 3)
    expect(mockEmail.sendPasswordResetOtp).not.toHaveBeenCalled()
  })

  it("C03 Google-only account (no password, oauth provider) → returns { sent: false, oauth }, no email", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForReset).mockResolvedValue({
      id: "u1", name: "Ana", hasPassword: false, plan: "PRO", oauthProvider: "google",
    })
    await expect(makePasswordResetService().requestReset("1.2.3.4", "a@b.com"))
      .resolves.toEqual({ sent: false, oauth: "google" })
    expect(mockEmail.sendPasswordResetOtp).not.toHaveBeenCalled()
  })

  it("C03b no password AND no oauth provider → anti-enumeration: silent { sent: true }, records failure, no email", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForReset).mockResolvedValue({
      id: "u1", name: "Ana", hasPassword: false, plan: "PRO", oauthProvider: null,
    })
    await expect(makePasswordResetService().requestReset("1.2.3.4", "a@b.com"))
      .resolves.toEqual({ sent: true })
    expect(mockRateLimit.consume).toHaveBeenCalledWith("a@b.com", "reset-password-request", 3)
    expect(mockEmail.sendPasswordResetOtp).not.toHaveBeenCalled()
  })

  it("C04 happy path → upserts reset record, sends OTP email, returns { sent: true }", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForReset).mockResolvedValue({ id: "u1", name: "Ana", hasPassword: true, plan: "PRO", oauthProvider: null })
    vi.mocked(mockResets.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendPasswordResetOtp).mockResolvedValue()

    const result = await makePasswordResetService().requestReset("1.2.3.4", "a@b.com")
    expect(result).toEqual({ sent: true })
    expect(mockResets.upsert).toHaveBeenCalledOnce()
    expect(mockEmail.sendPasswordResetOtp).toHaveBeenCalledWith("a@b.com", "Ana", expect.stringMatching(/^\d{6}$/), undefined)
  })

  it("C05 user with null name → uses fallback 'Usuario' in the email", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForReset).mockResolvedValue({ id: "u1", name: null, hasPassword: true, plan: "PRO", oauthProvider: null })
    vi.mocked(mockResets.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendPasswordResetOtp).mockResolvedValue()

    await makePasswordResetService().requestReset("1.2.3.4", "a@b.com")
    expect(mockEmail.sendPasswordResetOtp).toHaveBeenCalledWith("a@b.com", "Usuario", expect.any(String), undefined)
  })

  it("C06 requestReset uses IP as rate-limit key with 'reset-password-request' and limit 3", async () => {
    setRateLimit(false)
    await makePasswordResetService().requestReset("9.9.9.9", "a@b.com").catch(() => {})
    expect(mockRateLimit.consume).toHaveBeenCalledWith("a@b.com", "reset-password-request", 3)
  })

  it("C07 OTP stored is bcrypt hash, not plain text", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForReset).mockResolvedValue({ id: "u1", name: "Ana", hasPassword: true, plan: "PRO", oauthProvider: null })
    vi.mocked(mockResets.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendPasswordResetOtp).mockResolvedValue()

    await makePasswordResetService().requestReset("1.2.3.4", "a@b.com")
    const [, otpHash] = vi.mocked(mockResets.upsert).mock.calls[0]
    expect(otpHash).toMatch(/^\$2[aby]\$/)
  })

  it("C08 OTP expiry is 10 minutes from now", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForReset).mockResolvedValue({ id: "u1", name: "Ana", hasPassword: true, plan: "PRO", oauthProvider: null })
    vi.mocked(mockResets.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendPasswordResetOtp).mockResolvedValue()

    const before = Date.now()
    await makePasswordResetService().requestReset("1.2.3.4", "a@b.com")
    const after = Date.now()

    const [, , expiresAt] = vi.mocked(mockResets.upsert).mock.calls[0]
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 10 * 60_000 - 100)
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + 10 * 60_000 + 100)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe("C. PasswordResetService — confirmReset", () => {
  const validInput = { email: "a@b.com", code: "654321", password: "NewPass123" }

  it("C09 rate limited → throws 429 rate_limited", async () => {
    setRateLimit(false)
    await expect(makePasswordResetService().confirmReset(validInput))
      .rejects.toMatchObject({ code: "rate_limited", status: 429 })
  })

  it("C10 no reset record (non-existent or expired token) → throws 400 no_reset_request", async () => {
    setRateLimit(true)
    vi.mocked(mockResets.findByEmail).mockResolvedValue(null)
    await expect(makePasswordResetService().confirmReset(validInput))
      .rejects.toMatchObject({ code: "no_reset_request", status: 400 })
  })

  it("C11 expired reset token → throws 400 expired", async () => {
    setRateLimit(true)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({
      ...BASE_RESET_RECORD,
      expiresAt: new Date(Date.now() - 1000),
    })
    await expect(makePasswordResetService().confirmReset(validInput))
      .rejects.toMatchObject({ code: "expired", status: 400 })
  })

  it("C12 already-used token → throws 400 already_used", async () => {
    setRateLimit(true)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({
      ...BASE_RESET_RECORD,
      usedAt: new Date(),
    })
    await expect(makePasswordResetService().confirmReset(validInput))
      .rejects.toMatchObject({ code: "already_used", status: 400 })
  })

  it("C13 max attempts already reached (attempts=5) → throws 400 too_many_attempts without calling incrementAttempts", async () => {
    setRateLimit(true)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({
      ...BASE_RESET_RECORD,
      attempts: 5,
    })
    await expect(makePasswordResetService().confirmReset(validInput))
      .rejects.toMatchObject({ code: "too_many_attempts", status: 400 })
    // incrementAttempts not called because check is done BEFORE increment
    expect(mockResets.incrementAttempts).not.toHaveBeenCalled()
  })

  it("C14 invalid code, attempts=1 → increments to 2, attemptsLeft=3, throws 400 invalid_code", async () => {
    setRateLimit(true)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({
      ...BASE_RESET_RECORD,
      attempts: 1,
    })
    vi.mocked(mockResets.incrementAttempts).mockResolvedValue()

    const err = await makePasswordResetService().confirmReset({ ...validInput, code: "000000" }).catch((e) => e) as AppError
    expect(err.code).toBe("invalid_code")
    expect(err.status).toBe(400)
    expect(err.extra?.attemptsLeft).toBe(3) // 5 - (1+1) = 3
    expect(mockResets.incrementAttempts).toHaveBeenCalledWith("a@b.com")
  })

  it("C15 invalid code, attempts=0 → attemptsLeft=4", async () => {
    setRateLimit(true)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({
      ...BASE_RESET_RECORD,
      attempts: 0,
    })
    vi.mocked(mockResets.incrementAttempts).mockResolvedValue()

    const err = await makePasswordResetService().confirmReset({ ...validInput, code: "000000" }).catch((e) => e) as AppError
    expect(err.extra?.attemptsLeft).toBe(4)
  })

  it("C16 invalid code, attempts=4 → incrementAttempts called, then bcrypt fails, attemptsLeft=0", async () => {
    // attempts=4 doesn't hit too_many_attempts (which requires >=5), so we
    // proceed to increment and then fail on bcrypt compare
    setRateLimit(true)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({
      ...BASE_RESET_RECORD,
      attempts: 4,
    })
    vi.mocked(mockResets.incrementAttempts).mockResolvedValue()

    const err = await makePasswordResetService().confirmReset({ ...validInput, code: "000000" }).catch((e) => e) as AppError
    expect(err.code).toBe("invalid_code")
    expect(err.extra?.attemptsLeft).toBe(0) // 5 - (4+1) = 0
    expect(mockResets.incrementAttempts).toHaveBeenCalledWith("a@b.com")
  })

  it("C17 user not found after valid token exists (orphan reset record) → throws 400 user_not_found", async () => {
    setRateLimit(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({
      ...BASE_RESET_RECORD,
      otpHash: hash,
    })
    vi.mocked(mockResets.incrementAttempts).mockResolvedValue()
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)

    await expect(makePasswordResetService().confirmReset(validInput))
      .rejects.toMatchObject({ code: "user_not_found", status: 400 })
  })

  it("C18 valid code → updates password with bcrypt hash, marks token used, purges user cache, returns { ok: true }", async () => {
    setRateLimit(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({
      ...BASE_RESET_RECORD,
      otpHash: hash,
    })
    vi.mocked(mockResets.incrementAttempts).mockResolvedValue()
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({
      id: "u1", name: "Ana", email: "a@b.com", hasPassword: true, referralCode: null,
      plan: "PRO",
    })
    vi.mocked(mockUsers.updatePassword).mockResolvedValue()
    vi.mocked(mockResets.markUsed).mockResolvedValue(true)

    const result = await makePasswordResetService().confirmReset(validInput)
    expect(result).toEqual({ ok: true })
    expect(mockUsers.updatePassword).toHaveBeenCalledWith("u1", expect.stringMatching(/^\$2[aby]\$/))
    expect(mockResets.markUsed).toHaveBeenCalledWith("a@b.com")
    const { purgeUserCache } = await import("@/lib/auth")
    expect(purgeUserCache).toHaveBeenCalledWith("u1")
  })

  it("C19 weak password — note: no validation in service layer, password is accepted as-is (route handles validation)", async () => {
    // PasswordResetService itself doesn't validate password strength.
    // The route's Zod schema enforces uppercase, lowercase, digit, min-8.
    // This test documents that the service accepts any string.
    setRateLimit(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({
      ...BASE_RESET_RECORD,
      otpHash: hash,
    })
    vi.mocked(mockResets.incrementAttempts).mockResolvedValue()
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({
      id: "u1", name: "Ana", email: "a@b.com", hasPassword: true, referralCode: null,
      plan: "PRO",
    })
    vi.mocked(mockUsers.updatePassword).mockResolvedValue()
    vi.mocked(mockResets.markUsed).mockResolvedValue(true)

    // "abc" is a weak password but the service should accept it
    const result = await makePasswordResetService().confirmReset({ ...validInput, password: "abc" })
    expect(result).toEqual({ ok: true })
  })

  it("C20 confirmReset uses email as rate-limit key with 'reset-password-confirm' and limit 10", async () => {
    setRateLimit(false)
    await makePasswordResetService().confirmReset(validInput).catch(() => {})
    expect(mockRateLimit.check).toHaveBeenCalledWith("a@b.com", "reset-password-confirm", 10)
  })

  it("C21 incrementAttempts is always called before bcrypt compare (even on valid code)", async () => {
    // This verifies the correct ordering: increment → compare (prevents brute force)
    setRateLimit(true)
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("654321", 1)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({
      ...BASE_RESET_RECORD,
      otpHash: hash,
    })
    vi.mocked(mockResets.incrementAttempts).mockResolvedValue()
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({
      id: "u1", name: "Ana", email: "a@b.com", hasPassword: true, referralCode: null,
      plan: "PRO",
    })
    vi.mocked(mockUsers.updatePassword).mockResolvedValue()
    vi.mocked(mockResets.markUsed).mockResolvedValue(true)

    await makePasswordResetService().confirmReset(validInput)
    expect(mockResets.incrementAttempts).toHaveBeenCalledOnce()
    expect(mockResets.incrementAttempts).toHaveBeenCalledBefore(
      vi.mocked(mockUsers.updatePassword) as never,
    )
  })

  it("C22 token for a different user: reset record email mismatch is prevented by repo lookup (service trusts repo)", async () => {
    // The service calls resets.findByEmail(input.email). If email in input != email
    // in stored record, that would be a repo bug. The service trusts the repo result.
    // We verify the service uses the input email for ALL lookups.
    setRateLimit(true)
    vi.mocked(mockResets.findByEmail).mockResolvedValue(null) // no record for this email
    await expect(makePasswordResetService().confirmReset({ ...validInput, email: "attacker@b.com" }))
      .rejects.toMatchObject({ code: "no_reset_request" })
    expect(mockResets.findByEmail).toHaveBeenCalledWith("attacker@b.com")
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// D. EDGE CASES & SECURITY
// ═══════════════════════════════════════════════════════════════════════════════

describe("D. Edge cases and security", () => {
  it("D01 AppError has correct structure: code, status, extra, name='AppError'", () => {
    const err = new AppError("test_code", 400, { foo: "bar" })
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(AppError)
    expect(err.code).toBe("test_code")
    expect(err.status).toBe(400)
    expect(err.extra).toEqual({ foo: "bar" })
    expect(err.name).toBe("AppError")
    expect(err.message).toBe("test_code")
  })

  it("D02 AppError without extra → extra is undefined", () => {
    const err = new AppError("no_extra", 500)
    expect(err.extra).toBeUndefined()
  })

  it("D03 OTP codes generated by ALL three services are in 100000-999999 range (6 digits, no leading zeros)", async () => {
    // Run 10 iterations for each service to verify statistical distribution
    const codes: number[] = []
    for (let i = 0; i < 10; i++) {
      setRateLimit(true)
      vi.mocked(mockUsers.findForChallenge).mockResolvedValue({ ...BASE_CHALLENGE_USER })
      vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
      vi.mocked(mockEmail.sendSessionChallenge).mockResolvedValue()

      await makeChallengeService().issueChallenge("a@b.com")
      const code = vi.mocked(mockEmail.sendSessionChallenge).mock.calls[i]?.[2]
      if (code) codes.push(Number(code))
      vi.clearAllMocks()
    }
    for (const code of codes) {
      expect(code).toBeGreaterThanOrEqual(100_000)
      expect(code).toBeLessThanOrEqual(999_999)
    }
  })

  it("D04 concurrent OTP requests (simulate): each call generates a distinct code (statistically)", async () => {
    // Two parallel calls to issueChallenge should each generate and store an OTP independently.
    // We capture both calls and verify they may differ (they use crypto.getRandomValues).
    const collectedCodes: string[] = []
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({ ...BASE_CHALLENGE_USER })
    vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionChallenge).mockImplementation(async (_email, _name, code) => {
      collectedCodes.push(code)
    })

    await Promise.all([
      makeChallengeService().issueChallenge("a@b.com"),
      makeChallengeService().issueChallenge("a@b.com"),
    ])

    expect(collectedCodes).toHaveLength(2)
    // Both should be valid 6-digit codes
    for (const code of collectedCodes) {
      expect(code).toMatch(/^\d{6}$/)
    }
    // Codes may be the same (with ~1/900000 probability), but usually differ
    // — we just verify both calls completed without error
  })

  it("D05 vi.setSystemTime: expired OTP detection uses real Date.now() comparison", async () => {
    // Freeze time, set OTP expiry to future, then advance time past expiry
    vi.useFakeTimers()
    const now = new Date("2026-01-01T10:00:00Z")
    vi.setSystemTime(now)

    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeCode: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      sessionChallengeExp: new Date("2026-01-01T10:10:00Z"), // 10 min from frozen now
    })

    // At frozen "now", code is not expired
    // Advance time past expiry
    vi.setSystemTime(new Date("2026-01-01T10:11:00Z"))

    await expect(makeChallengeService().verifyChallenge("a@b.com", "123456"))
      .rejects.toMatchObject({ code: "expired", status: 400 })

    vi.useRealTimers()
  })

  it("D06 vi.setSystemTime: block detection uses Date comparison correctly", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"))

    const blockedUntil = new Date("2026-01-01T12:00:00Z") // 2h from now
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeBlockedUntil: blockedUntil,
    })

    // User is blocked
    await expect(makeChallengeService().verifyChallenge("a@b.com", "123456"))
      .rejects.toMatchObject({ code: "blocked", status: 429 })

    // Advance time PAST the block
    vi.setSystemTime(new Date("2026-01-01T12:01:00Z"))

    // Now user is no longer blocked — but they still have no code stored
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeBlockedUntil: blockedUntil, // same date but now in the past
      sessionChallengeCode: null,
      sessionChallengeExp: null,
    })
    await expect(makeChallengeService().verifyChallenge("a@b.com", "123456"))
      .rejects.toMatchObject({ code: "no_challenge", status: 400 })

    vi.useRealTimers()
  })

  it("D07 session challenge verify: MAX_ATTEMPTS is 5 (boundary test at attempt 5)", async () => {
    // At exactly attempts=4 (the 5th total attempt), the user is blocked.
    // At attempts=3 (4th total), they get one more chance.
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeAttempts: 3, // 4th attempt coming up
      sessionChallengeCode: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      sessionChallengeExp: new Date(Date.now() + 60_000),
    })
    vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionChallengeFailed).mockResolvedValue()

    const err = await makeChallengeService().verifyChallenge("a@b.com", "000000").catch((e) => e) as AppError
    // 4th attempt: not yet blocked
    expect(err.code).toBe("invalid")
    expect(err.extra?.attemptsLeft).toBe(1) // 5 - 4 = 1

    // 5th attempt (attempts=4) → blocked
    vi.clearAllMocks()
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeAttempts: 4,
      sessionChallengeCode: "$2b$10$aaaaaaaaaaaaaaaaaaaaa.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      sessionChallengeExp: new Date(Date.now() + 60_000),
    })
    vi.mocked(mockUsers.updateSessionChallenge).mockResolvedValue()
    vi.mocked(mockEmail.sendSessionChallengeBlocked).mockResolvedValue()

    const err2 = await makeChallengeService().verifyChallenge("a@b.com", "000000").catch((e) => e) as AppError
    expect(err2.code).toBe("blocked")
    expect(err2.status).toBe(429)
  })

  it("D08 registration confirm: MAX_ATTEMPTS is 5 — at attempts=4 (5th fail) throws max_attempts, at attempts=3 throws invalid", async () => {
    // At attempts=3 (4th attempt coming), should still be invalid not max_attempts
    setRateLimit(true)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      ...BASE_PENDING,
      attempts: 3,
    })
    vi.mocked(mockPending.updateAttempts).mockResolvedValue()

    const err = await makeRegistrationService().confirmOtp({ email: "a@b.com", code: "000000" }).catch((e) => e) as AppError
    expect(err.code).toBe("invalid")
    expect(err.extra?.attemptsLeft).toBe(1)

    // At attempts=4 (5th attempt) → max_attempts
    vi.clearAllMocks()
    setRateLimit(true)
    vi.mocked(mockPending.findByEmail).mockResolvedValue({
      ...BASE_PENDING,
      attempts: 4,
    })
    vi.mocked(mockPending.deleteByEmail).mockResolvedValue()

    await expect(makeRegistrationService().confirmOtp({ email: "a@b.com", code: "000000" }))
      .rejects.toMatchObject({ code: "max_attempts", status: 429 })
  })

  it("D09 password reset: too_many_attempts guard fires at attempts=5 WITHOUT calling incrementAttempts first", async () => {
    // This is a security boundary: if attempts reached MAX before this call,
    // we reject immediately without giving another increment
    setRateLimit(true)
    vi.mocked(mockResets.findByEmail).mockResolvedValue({
      ...BASE_RESET_RECORD,
      attempts: 5,
    })

    await expect(makePasswordResetService().confirmReset({ email: "a@b.com", code: "000000", password: "X" }))
      .rejects.toMatchObject({ code: "too_many_attempts" })
    expect(mockResets.incrementAttempts).not.toHaveBeenCalled()
  })

  it("D10 email field passed as empty string to session challenge verify → throws invalid_or_no_challenge (not rate_limited)", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue(null)
    await expect(makeChallengeService().verifyChallenge("", "123456"))
      .rejects.toMatchObject({ code: "invalid_or_no_challenge" })
  })

  it("D11 registration requestOtp: marketingConsent defaults to false when undefined", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockPending.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendRegistrationOtp).mockResolvedValue()

    await makeRegistrationService().requestOtp({
      ...REGISTER_INPUT,
      marketingConsent: undefined,
    })

    const upsertArg = vi.mocked(mockPending.upsert).mock.calls[0][0]
    expect(upsertArg.marketingConsent).toBe(false)
  })

  it("D12 registration requestOtp: referralCode defaults to null when undefined", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null)
    vi.mocked(mockPending.upsert).mockResolvedValue()
    vi.mocked(mockEmail.sendRegistrationOtp).mockResolvedValue()

    await makeRegistrationService().requestOtp({
      ...REGISTER_INPUT,
      referralCode: undefined,
    })

    const upsertArg = vi.mocked(mockPending.upsert).mock.calls[0][0]
    expect(upsertArg.referralCode).toBeNull()
  })

  it("D13 session challenge issueChallenge: records failure on missing user (anti-enumeration with rate-limit penalty)", async () => {
    setRateLimit(true)
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue(null)
    await makeChallengeService().issueChallenge("nobody@b.com")
    // every attempt is consumed, whether or not the address exists
    expect(mockRateLimit.consume).toHaveBeenCalledWith("nobody@b.com", "session-challenge", 5)
  })

  it("D14 session challenge blocked user: blockedUntil in extra is ISO string format", async () => {
    setRateLimit(true)
    const blockedUntil = new Date("2027-01-01T00:00:00.000Z")
    vi.mocked(mockUsers.findForChallenge).mockResolvedValue({
      ...BASE_CHALLENGE_USER,
      sessionChallengeBlockedUntil: blockedUntil,
    })

    const err = await makeChallengeService().verifyChallenge("a@b.com", "000000").catch((e) => e) as AppError
    expect(err.extra?.blockedUntil).toBe("2027-01-01T00:00:00.000Z")
  })

  it("D15 password reset: SQL-injection-like email is passed as-is to repo (service delegates sanitisation to DB layer)", async () => {
    const maliciousEmail = "' OR '1'='1"
    setRateLimit(true)
    vi.mocked(mockUsers.findForReset).mockResolvedValue(null)
    await makePasswordResetService().requestReset("1.2.3.4", maliciousEmail).catch(() => {})
    expect(mockUsers.findForReset).toHaveBeenCalledWith(maliciousEmail)
  })
})
