import bcrypt from "@/lib/bcrypt"
import { AppError } from "@/lib/services/auth/AppError"
import { purgeUserCache } from "@/lib/auth"
import { db } from "@/lib/db"
import type { IUserRepository } from "@/lib/interfaces/IUserRepository"
import type { IPasswordResetRepository } from "@/lib/interfaces/IPasswordResetRepository"
import type { IEmailService } from "@/lib/interfaces/IEmailService"
import type { IRateLimitService } from "@/lib/interfaces/IRateLimitService"
import type { ILogger } from "@/lib/interfaces/ILogger"

const MAX_ATTEMPTS = 5

export interface ConfirmResetInput {
  email: string
  code: string
  password: string
}

export class PasswordResetService {
  constructor(
    private readonly users: IUserRepository,
    private readonly resets: IPasswordResetRepository,
    private readonly rateLimit: IRateLimitService,
    private readonly email: IEmailService,
    private readonly logger: ILogger,
  ) {}

  async requestReset(ipAddress: string, emailAddress: string, locale?: string | null): Promise<{ sent: boolean; oauth?: string }> {
    const allowed = await this.rateLimit.check(ipAddress, "reset-password-request", 3)
    if (!allowed) {
      this.logger.warn("PasswordResetService.requestReset: rate limited", { ip: ipAddress })
      throw new AppError("rate_limited", 429)
    }

    const user = await this.users.findForReset(emailAddress)

    // OAuth-only account (registered with Google, no password): there is no
    // password to reset. Tell the user to sign in with their provider instead
    // of silently pretending an email was sent.
    if (user && !user.hasPassword && user.oauthProvider) {
      this.logger.info("PasswordResetService.requestReset: oauth-only account", { email: emailAddress, provider: user.oauthProvider })
      return { sent: false, oauth: user.oauthProvider }
    }

    if (!user || user.plan === "LIMITED" || !user.hasPassword) {
      await this.rateLimit.recordFailure(ipAddress, "reset-password-request")
      return { sent: true }
    }

    const code = this.generateOtp()
    const otpHash = await bcrypt.hash(code, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await this.resets.upsert(emailAddress, otpHash, expiresAt)
    await this.email.sendPasswordResetOtp(emailAddress, user.name ?? "Usuario", code, locale)
    this.logger.info("PasswordResetService.requestReset: OTP sent", { email: emailAddress })
    return { sent: true }
  }

  async confirmReset(input: ConfirmResetInput): Promise<{ ok: true }> {
    const allowed = await this.rateLimit.check(input.email, "reset-password-confirm", 10)
    if (!allowed) throw new AppError("rate_limited", 429)

    const reset = await this.resets.findByEmail(input.email)
    if (!reset) throw new AppError("no_reset_request", 400)
    if (reset.expiresAt < new Date()) throw new AppError("expired", 400)
    if (reset.usedAt) throw new AppError("already_used", 400)
    if (reset.attempts >= MAX_ATTEMPTS) throw new AppError("too_many_attempts", 400)

    await this.resets.incrementAttempts(input.email)

    const valid = await bcrypt.compare(input.code, reset.otpHash)
    if (!valid) {
      const attemptsLeft = MAX_ATTEMPTS - (reset.attempts + 1)
      this.logger.warn("PasswordResetService.confirmReset: invalid code", { email: input.email, attemptsLeft })
      throw new AppError("invalid_code", 400, { attemptsLeft })
    }

    const user = await this.users.findByEmail(input.email)
    if (!user) throw new AppError("user_not_found", 400)
    if (user.plan === "LIMITED") throw new AppError("plan_not_allowed", 403)

    // Claim the OTP atomically before hashing — prevents TOCTOU where two
    // concurrent requests both pass the usedAt check and both reset the password.
    const claimed = await this.resets.markUsed(input.email)
    if (!claimed) throw new AppError("already_used", 400)

    const passwordHash = await bcrypt.hash(input.password, 12)
    await this.users.updatePassword(user.id, passwordHash)
    await db.user.update({
      where: { id: user.id },
      data: {
        activeSessionToken:           null,
        sessionVersion:               { increment: 1 },
        sessionChallengeBlockedUntil: null,
        sessionChallengeAttempts:     0,
      },
    })
    purgeUserCache(user.id)

    this.logger.info("PasswordResetService.confirmReset: password updated", { email: input.email })
    return { ok: true }
  }

  private generateOtp(): string {
    return String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000)
  }
}
