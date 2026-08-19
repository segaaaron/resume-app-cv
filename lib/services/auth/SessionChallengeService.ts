import bcrypt from "@/lib/bcrypt"
import { AppError } from "@/lib/services/auth/AppError"
import { purgeUserCache } from "@/lib/auth"
import type { IUserRepository } from "@/lib/interfaces/IUserRepository"
import type { ISessionRepository } from "@/lib/interfaces/ISessionRepository"
import type { IEmailService } from "@/lib/interfaces/IEmailService"
import type { IRateLimitService } from "@/lib/interfaces/IRateLimitService"
import type { ILogger } from "@/lib/interfaces/ILogger"

/**
 * Cómo saludar a quien no tiene nombre.
 *
 * El nombre estaba usado como CONDICIÓN — `if (user.name) await sendX(...)` en
 * los cuatro correos de este servicio — y `user.name` es null para todos los
 * usuarios managed: la creación de LIMITED escribe correo, contraseña, plan y
 * topes, y el panel del admin ni pide un nombre.
 *
 * Lo que eso costaba: el usuario con sesión abierta en su computadora intentaba
 * entrar desde el teléfono, se topaba con el guard de sesión única, pedía el
 * código, la API respondía `{ sent: true }` y el correo no salía nunca. Quedaba
 * afuera hasta que la sesión vieja se enfriara (30 minutos sin actividad) o el
 * JWT expirara solo (24 horas) — y con la pestaña de la computadora abierta,
 * nunca. Tampoco recibía el aviso de bloqueo, ni el de intento fallido, que es
 * como uno se entera de que alguien más está probando entrar a su cuenta.
 *
 * `PasswordResetService` ya lo hacía bien (`user.name ?? "Usuario"`): el nombre
 * es el saludo de la carta, no la llave de la puerta.
 */
const FALLBACK_NAME = "Usuario"

const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 5 * 60 * 60 * 1000

export class SessionChallengeService {
  constructor(
    private readonly users: IUserRepository,
    private readonly session: ISessionRepository,
    private readonly rateLimit: IRateLimitService,
    private readonly email: IEmailService,
    private readonly logger: ILogger,
  ) {}

  async issueChallenge(emailAddress: string, locale?: string | null): Promise<{ sent: true }> {
    // `consume`, not `check`: same defect as registration and password reset — usage was
    // recorded only for addresses with no account, so the branch that actually emails a
    // code to a real user never moved the counter and could be replayed without end.
    const allowed = await this.rateLimit.consume(emailAddress, "session-challenge", 5)
    if (!allowed) {
      this.logger.warn("SessionChallengeService.issueChallenge: rate limited", { email: emailAddress })
      throw new AppError("rate_limited", 429)
    }

    const user = await this.users.findForChallenge(emailAddress)
    if (!user) {
      return { sent: true }
    }

    if (user.sessionChallengeBlockedUntil && user.sessionChallengeBlockedUntil > new Date()) {
      return { sent: true }
    }

    if (!user.activeSessionToken) return { sent: true }

    const code = this.generateOtp()
    const codeHash = await bcrypt.hash(code, 10)
    const exp = new Date(Date.now() + 10 * 60 * 1000)

    await this.users.updateSessionChallenge(user.id, {
      sessionChallengeCode:     codeHash,
      sessionChallengeExp:      exp,
      sessionChallengeAttempts: 0,
    })

    await this.email.sendSessionChallenge(emailAddress, user.name ?? FALLBACK_NAME, code, locale)
    this.logger.info("SessionChallengeService.issueChallenge: OTP sent", { email: emailAddress })
    return { sent: true }
  }

  async verifyChallenge(emailAddress: string, code: string, locale?: string | null): Promise<{ success: true }> {
    const allowed = await this.rateLimit.check(emailAddress, "session-challenge-verify", 10)
    if (!allowed) throw new AppError("rate_limited", 429)

    const user = await this.users.findForChallenge(emailAddress)
    if (!user) {
      // Equalize timing to prevent email enumeration
      await bcrypt.compare("dummy", "$2b$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuuabcdefghijk")
      throw new AppError("invalid_or_no_challenge", 400, { attemptsLeft: MAX_ATTEMPTS - 1 })
    }

    if (user.sessionChallengeBlockedUntil && user.sessionChallengeBlockedUntil > new Date()) {
      throw new AppError("blocked", 429, { blockedUntil: user.sessionChallengeBlockedUntil.toISOString() })
    }

    if (!user.sessionChallengeCode || !user.sessionChallengeExp) throw new AppError("no_challenge", 400)
    if (user.sessionChallengeExp < new Date()) throw new AppError("expired", 400)

    const valid = await bcrypt.compare(code, user.sessionChallengeCode)

    if (!valid) {
      const newAttempts = user.sessionChallengeAttempts + 1

      if (newAttempts >= MAX_ATTEMPTS) {
        const blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS)
        await this.users.updateSessionChallenge(user.id, {
          sessionChallengeAttempts:     newAttempts,
          sessionChallengeBlockedUntil: blockedUntil,
          sessionChallengeCode:         null,
          sessionChallengeExp:          null,
        })
        await this.email.sendSessionChallengeBlocked(emailAddress, user.name ?? FALLBACK_NAME, blockedUntil, locale)
        this.logger.warn("SessionChallengeService.verifyChallenge: user blocked", { email: emailAddress })
        throw new AppError("blocked", 429, { blockedUntil: blockedUntil.toISOString() })
      }

      await this.users.updateSessionChallenge(user.id, { sessionChallengeAttempts: newAttempts })
      const attemptsLeft = MAX_ATTEMPTS - newAttempts
      await this.email.sendSessionChallengeFailed(emailAddress, user.name ?? FALLBACK_NAME, attemptsLeft, locale)
      this.logger.warn("SessionChallengeService.verifyChallenge: invalid code", { email: emailAddress, attemptsLeft })
      throw new AppError("invalid", 400, { attemptsLeft })
    }

    await this.session.clearActiveSession(user.id)
    purgeUserCache(user.id)
    await this.email.sendSessionForced(emailAddress, user.name ?? FALLBACK_NAME, locale)
    this.logger.info("SessionChallengeService.verifyChallenge: session forced out", { email: emailAddress })
    return { success: true }
  }

  private generateOtp(): string {
    return String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000)
  }
}
