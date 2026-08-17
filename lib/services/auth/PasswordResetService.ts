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
/** Counting key for an address — lower-cased because delivery ignores case, so two
 *  capitalisations of the same mailbox must share one counter. Storage is untouched. */
function mailboxKey(email: string): string {
  return email.trim().toLowerCase()
}

/** Reset codes for ONE address per hour — the limit that stops mail-bombing a person. */
const RESET_MAX_PER_EMAIL = 3
/** Reset requests from one source per hour. Wide: shared NAT must not block a real reset. */
const RESET_MAX_PER_IP = 20

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

  async requestReset(ipAddress: string, emailAddress: string, locale?: string | null): Promise<{ sent: boolean; oauth?: string; managed?: boolean }> {
    // TWO keys, the shape `lib/auth.ts` already uses for login:
    //
    //   · PER ADDRESS — this is THE limit here. Mail-bombing targets a person, and the
    //     attacker controls the source: an IP-only cap is dodged with one proxy hop while
    //     the victim keeps receiving codes. Three an hour covers "it went to spam, send
    //     it again" and nothing beyond that.
    //   · PER IP — backstop for the machine (each request costs a send and a bcrypt).
    //     Wide, so a shared NAT never blocks someone's real password reset.
    //
    // `consume`, not `check`: the branch that finds a real account SENDS AN EMAIL and used
    // to leave the counter untouched — only unknown addresses were recorded, so the limit
    // bit exactly the harmless case and never the harmful one. That is how a sending
    // domain gets its reputation burned and stops delivering for everyone.
    const [emailAllowed, ipAllowed] = await Promise.all([
      this.rateLimit.consume(mailboxKey(emailAddress), "reset-password-request", RESET_MAX_PER_EMAIL),
      this.rateLimit.consume(`ip:${ipAddress}`, "reset-password-request", RESET_MAX_PER_IP),
    ])
    if (!emailAllowed || !ipAllowed) {
      this.logger.warn("PasswordResetService.requestReset: rate limited", { email: emailAddress, ip: ipAddress, emailAllowed, ipAllowed })
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

    // Managed (LIMITED) account: an administrator created the access and holds the only
    // reset there is, so no code will ever be sent here. Saying "if the email is
    // registered you will receive a code" left that user waiting for mail that by design
    // never leaves — the same silent lie already fixed for Google accounts, still open in
    // this branch. Same trade-off accepted there: it confirms the address exists, and
    // telling someone locked out where their access actually comes from is worth it.
    if (user && user.plan === "LIMITED") {
      this.logger.info("PasswordResetService.requestReset: managed account", { email: emailAddress })
      return { sent: false, managed: true }
    }

    // No extra recordFailure here — `consume` above already counted this attempt. Adding
    // one would charge the unknown-address branch twice and re-create a difference in
    // cost between "this email exists" and "it does not", which is an enumeration signal.
    if (!user || !user.hasPassword) {
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
