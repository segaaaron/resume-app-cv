import bcrypt from "bcryptjs"
import { nanoid } from "nanoid"
import { AppError } from "@/lib/services/auth/AppError"
import type { IUserRepository } from "@/lib/interfaces/IUserRepository"
import type { IPendingRegistrationRepository } from "@/lib/interfaces/IPendingRegistrationRepository"
import type { IEmailService } from "@/lib/interfaces/IEmailService"
import type { IRateLimitService } from "@/lib/interfaces/IRateLimitService"
import type { ILogger } from "@/lib/interfaces/ILogger"

export interface RegisterInput {
  name: string
  email: string
  password: string
  marketingConsent?: boolean
  ageConsent: true
  referralCode?: string
  ipAddress: string
}

export interface ConfirmInput {
  email: string
  code: string
}

export class RegistrationService {
  constructor(
    private readonly users: IUserRepository,
    private readonly pending: IPendingRegistrationRepository,
    private readonly rateLimit: IRateLimitService,
    private readonly email: IEmailService,
    private readonly logger: ILogger,
  ) {}

  async requestOtp(input: RegisterInput): Promise<{ pending: true }> {
    const allowed = await this.rateLimit.check(input.ipAddress, "register", 5)
    if (!allowed) {
      this.logger.warn("RegistrationService.requestOtp: rate limited", { ip: input.ipAddress })
      throw new AppError("rate_limited", 429)
    }

    const existing = await this.users.findByEmail(input.email)
    if (existing) {
      await this.rateLimit.recordFailure(input.ipAddress, "register")
      this.logger.warn("RegistrationService.requestOtp: email already exists", { email: input.email })
      throw new AppError(existing.hasPassword ? "email_exists_credentials" : "email_exists_google", 409)
    }

    const passwordHash = await bcrypt.hash(input.password, 12)
    const code = this.generateOtp()
    const otpHash = await bcrypt.hash(code, 10)
    const otpExp = new Date(Date.now() + 10 * 60 * 1000)

    await this.pending.upsert({
      email:            input.email,
      name:             input.name,
      passwordHash,
      marketingConsent: input.marketingConsent ?? false,
      ageConsent:       input.ageConsent,
      referralCode:     input.referralCode ?? null,
      otpHash,
      otpExp,
    })

    await this.email.sendRegistrationOtp(input.email, input.name, code)
    this.logger.info("RegistrationService.requestOtp: OTP sent", { email: input.email })
    return { pending: true }
  }

  async confirmOtp(input: ConfirmInput): Promise<{ success: true }> {
    const allowed = await this.rateLimit.check(input.email, "register-confirm", 10)
    if (!allowed) throw new AppError("rate_limited", 429)

    const pending = await this.pending.findByEmail(input.email)
    if (!pending) throw new AppError("no_pending", 400)

    if (pending.otpExp < new Date()) {
      await this.pending.deleteByEmail(input.email)
      throw new AppError("expired", 400)
    }

    const valid = await bcrypt.compare(input.code, pending.otpHash)
    if (!valid) {
      const newAttempts = pending.attempts + 1
      if (newAttempts >= 5) {
        await this.pending.deleteByEmail(input.email)
        throw new AppError("max_attempts", 429)
      }
      await this.pending.updateAttempts(input.email, newAttempts)
      this.logger.warn("RegistrationService.confirmOtp: invalid OTP", { email: input.email, attempt: newAttempts })
      throw new AppError("invalid", 400, { attemptsLeft: 5 - newAttempts })
    }

    const existing = await this.users.findByEmail(input.email)
    if (existing) {
      await this.pending.deleteByEmail(input.email)
      throw new AppError("email_taken", 409)
    }

    let referrerId: string | undefined
    if (pending.referralCode) {
      const referrer = await this.users.findByReferralCode(pending.referralCode)
      if (referrer) referrerId = referrer.id
    }

    try {
      await this.users.createFromPending(pending, nanoid(8), referrerId)
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === "P2002") throw new AppError("email_taken", 409)
      throw e
    }
    this.logger.info("RegistrationService.confirmOtp: user created", { email: input.email })
    return { success: true }
  }

  private generateOtp(): string {
    return String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000)
  }
}
