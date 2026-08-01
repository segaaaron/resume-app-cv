import { resend, emailEnabled } from "@/lib/resend"
import { createLogger } from "@/lib/logger"
import { registrationOtpHtml, registrationOtpText, registrationOtpSubject } from "@/lib/emails/registrationOtp"
import { passwordResetHtml, passwordResetText, passwordResetSubject } from "@/lib/emails/passwordReset"
import { sessionChallengeHtml, sessionChallengeText, sessionChallengeSubject } from "@/lib/emails/sessionChallenge"
import { sessionChallengeFailedHtml, sessionChallengeFailedText, sessionChallengeFailedSubject } from "@/lib/emails/sessionChallengeFailedAttempt"
import { sessionChallengeBlockedHtml, sessionChallengeBlockedText, sessionChallengeBlockedSubject } from "@/lib/emails/sessionChallengeBlocked"
import { sessionForcedHtml, sessionForcedText, sessionForcedSubject } from "@/lib/emails/sessionForced"
import { managedWelcomeHtml, managedWelcomeText, managedWelcomeSubjectFor } from "@/lib/emails/managedWelcome"
import type { IEmailService } from "@/lib/interfaces/IEmailService"

const FROM = process.env.EMAIL_FROM ?? "Valhalla Resume <no-reply@valhallaresume.com>"
const logger = createLogger("ResendEmailService")

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  return `${local.slice(0, 2)}***@${domain}`
}

export class ResendEmailService implements IEmailService {
  async sendRegistrationOtp(to: string, name: string, code: string, locale?: string | null): Promise<void> {
    if (!emailEnabled()) return
    await resend!.emails.send({
      from: FROM, to,
      subject: registrationOtpSubject(locale),
      html: registrationOtpHtml({ userName: name, code, locale }),
      text: registrationOtpText({ userName: name, code, locale }),
    }).catch((e) => logger.error("sendRegistrationOtp failed — user cannot complete registration", { to: maskEmail(to) }, e instanceof Error ? e : undefined))
  }

  async sendPasswordResetOtp(to: string, name: string, code: string, locale?: string | null): Promise<void> {
    if (!emailEnabled()) return
    await resend!.emails.send({
      from: FROM, to,
      subject: passwordResetSubject(locale),
      html: passwordResetHtml({ userName: name, code, locale }),
      text: passwordResetText({ userName: name, code, locale }),
    }).catch((e) => logger.error("sendPasswordResetOtp failed — user cannot reset password", { to: maskEmail(to) }, e instanceof Error ? e : undefined))
  }

  async sendSessionChallenge(to: string, name: string, code: string, locale?: string | null): Promise<void> {
    if (!emailEnabled()) return
    await resend!.emails.send({
      from: FROM, to,
      subject: sessionChallengeSubject(locale),
      html: sessionChallengeHtml({ userName: name, code, locale }),
      text: sessionChallengeText({ userName: name, code, locale }),
    }).catch((e) => logger.error("sendSessionChallenge failed — user cannot complete login", { to: maskEmail(to) }, e instanceof Error ? e : undefined))
  }

  async sendSessionChallengeFailed(to: string, name: string, attemptsLeft: number, locale?: string | null): Promise<void> {
    if (!emailEnabled()) return
    await resend!.emails.send({
      from: FROM, to,
      subject: sessionChallengeFailedSubject(locale),
      html: sessionChallengeFailedHtml({ userName: name, attemptsLeft, locale }),
      text: sessionChallengeFailedText({ userName: name, attemptsLeft, locale }),
    }).catch((e) => logger.error("sendSessionChallengeFailed failed", { to: maskEmail(to) }, e instanceof Error ? e : undefined))
  }

  async sendSessionChallengeBlocked(to: string, name: string, unblockedAt: Date, locale?: string | null): Promise<void> {
    if (!emailEnabled()) return
    await resend!.emails.send({
      from: FROM, to,
      subject: sessionChallengeBlockedSubject(locale),
      html: sessionChallengeBlockedHtml({ userName: name, unblockedAt, locale }),
      text: sessionChallengeBlockedText({ userName: name, unblockedAt, locale }),
    }).catch((e) => logger.error("sendSessionChallengeBlocked failed", { to: maskEmail(to) }, e instanceof Error ? e : undefined))
  }

  async sendSessionForced(to: string, name: string, locale?: string | null): Promise<void> {
    if (!emailEnabled()) return
    await resend!.emails.send({
      from: FROM, to,
      subject: sessionForcedSubject(locale),
      html: sessionForcedHtml({ userName: name, locale }),
      text: sessionForcedText({ userName: name, locale }),
    }).catch((e) => logger.error("sendSessionForced failed", { to: maskEmail(to) }, e instanceof Error ? e : undefined))
  }

  async sendManagedWelcome(to: string, password: string, expiresAt: Date, downloadLimit: number | null, locale?: string | null): Promise<void> {
    if (!emailEnabled()) return
    const base = process.env.NEXTAUTH_URL ?? "https://www.valhallaresume.com"
    const loginUrl = `${base}/es/login`
    await resend!.emails.send({
      from: FROM, to,
      subject: managedWelcomeSubjectFor(locale),
      html: managedWelcomeHtml({ password, expiresAt, downloadLimit, loginUrl, locale }),
      text: managedWelcomeText({ password, expiresAt, downloadLimit, loginUrl, locale }),
    }).catch((e) => logger.error("sendManagedWelcome failed", { to: maskEmail(to) }, e instanceof Error ? e : undefined))
  }
}
