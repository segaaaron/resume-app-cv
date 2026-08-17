import bcrypt from "@/lib/bcrypt"
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
  /** Language of the request, so the verification code arrives in a language they read. */
  locale?: string | null
}

export interface ConfirmInput {
  email: string
  code: string
  /** Language of the request, stored on the new user for later crons and webhooks. */
  locale?: string | null
}

/**
 * The rate-limit key for an address.
 *
 * Lower-cased on purpose: mail delivery ignores case, so `Victim@gmail.com` and
 * `victim@gmail.com` land in the SAME inbox while hashing to two different counters.
 * Without this, the per-address limit is bypassed by holding shift. Note this normalises
 * the COUNTER only — the stored address is untouched, so no existing account changes.
 *
 * It does not canonicalise provider tricks (Gmail dots, plus-addressing): those are
 * provider-specific and the per-IP cap is what bounds them.
 */
function mailboxKey(email: string): string {
  return email.trim().toLowerCase()
}

/** Signup codes for ONE address per hour. The limit a real person feels. */
const REGISTER_MAX_PER_EMAIL = 3
/** Signup requests from one source per hour. Wide on purpose: shared NAT is common. */
const REGISTER_MAX_PER_IP = 20

export class RegistrationService {
  constructor(
    private readonly users: IUserRepository,
    private readonly pending: IPendingRegistrationRepository,
    private readonly rateLimit: IRateLimitService,
    private readonly email: IEmailService,
    private readonly logger: ILogger,
  ) {}

  async requestOtp(input: RegisterInput): Promise<{ pending: true }> {
    // TWO keys, the same shape `lib/auth.ts` already uses for login (email 5 / IP 10):
    //
    //   · PER ADDRESS — the limit that protects a person. Three signup codes for the same
    //     mailbox in an hour is already generous; past that somebody is being mailed at,
    //     not signing up. An IP-only limit could not see this at all: whoever wants to
    //     bury one address just rotates source addresses.
    //   · PER IP — the backstop that protects US, since each request costs a Resend send
    //     and two bcrypt hashes (~200ms of CPU). Kept wide (20/h) so a shared NAT — an
    //     office, a campus, a mobile carrier — never blocks honest signups.
    //
    // `consume`, not `check`: both must be counted whatever the outcome. Counting only
    // the "email already exists" branch left the branch that actually sends mail free.
    const [emailAllowed, ipAllowed] = await Promise.all([
      this.rateLimit.consume(mailboxKey(input.email), "register", REGISTER_MAX_PER_EMAIL),
      this.rateLimit.consume(`ip:${input.ipAddress}`, "register", REGISTER_MAX_PER_IP),
    ])
    if (!emailAllowed || !ipAllowed) {
      this.logger.warn("RegistrationService.requestOtp: rate limited", { email: input.email, ip: input.ipAddress, emailAllowed, ipAllowed })
      throw new AppError("rate_limited", 429)
    }

    const existing = await this.users.findByEmail(input.email)
    if (existing) {
      this.logger.warn("RegistrationService.requestOtp: email already exists", { email: input.email })
      throw new AppError("email_exists", 409)
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

    await this.email.sendRegistrationOtp(input.email, input.name, code, input.locale)
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
      await this.users.createFromPending(pending, nanoid(8), referrerId, input.locale)
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
