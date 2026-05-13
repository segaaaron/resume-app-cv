import bcrypt from "bcryptjs"
import { AppError } from "@/lib/services/auth/AppError"
import { purgeUserCache } from "@/lib/auth"
import type { IUserRepository } from "@/lib/interfaces/IUserRepository"
import type { ISessionRepository } from "@/lib/interfaces/ISessionRepository"
import type { IEmailService } from "@/lib/interfaces/IEmailService"
import type { IRateLimitService } from "@/lib/interfaces/IRateLimitService"
import type { ILogger } from "@/lib/interfaces/ILogger"

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

  async issueChallenge(emailAddress: string): Promise<{ sent: true }> {
    const allowed = await this.rateLimit.check(emailAddress, "session-challenge", 5)
    if (!allowed) {
      this.logger.warn("SessionChallengeService.issueChallenge: rate limited", { email: emailAddress })
      throw new AppError("rate_limited", 429)
    }

    const user = await this.users.findForChallenge(emailAddress)
    if (!user) {
      await this.rateLimit.recordFailure(emailAddress, "session-challenge")
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

    if (user.name) await this.email.sendSessionChallenge(emailAddress, user.name, code)
    this.logger.info("SessionChallengeService.issueChallenge: OTP sent", { email: emailAddress })
    return { sent: true }
  }

  async verifyChallenge(emailAddress: string, code: string): Promise<{ success: true }> {
    const allowed = await this.rateLimit.check(emailAddress, "session-challenge-verify", 10)
    if (!allowed) throw new AppError("rate_limited", 429)

    const user = await this.users.findForChallenge(emailAddress)
    if (!user) throw new AppError("invalid_or_no_challenge", 400)

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
        if (user.name) await this.email.sendSessionChallengeBlocked(emailAddress, user.name, blockedUntil)
        this.logger.warn("SessionChallengeService.verifyChallenge: user blocked", { email: emailAddress })
        throw new AppError("blocked", 429, { blockedUntil: blockedUntil.toISOString() })
      }

      await this.users.updateSessionChallenge(user.id, { sessionChallengeAttempts: newAttempts })
      const attemptsLeft = MAX_ATTEMPTS - newAttempts
      if (user.name) await this.email.sendSessionChallengeFailed(emailAddress, user.name, attemptsLeft)
      this.logger.warn("SessionChallengeService.verifyChallenge: invalid code", { email: emailAddress, attemptsLeft })
      throw new AppError("invalid", 400, { attemptsLeft })
    }

    await this.session.clearActiveSession(user.id)
    purgeUserCache(user.id)
    if (user.name) await this.email.sendSessionForced(emailAddress, user.name)
    this.logger.info("SessionChallengeService.verifyChallenge: session forced out", { email: emailAddress })
    return { success: true }
  }

  private generateOtp(): string {
    return String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000)
  }
}
