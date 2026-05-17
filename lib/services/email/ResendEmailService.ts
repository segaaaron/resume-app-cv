import { resend, emailEnabled } from "@/lib/resend"
import { createLogger } from "@/lib/logger"
import { registrationOtpHtml, registrationOtpText } from "@/lib/emails/registrationOtp"
import { passwordResetHtml, passwordResetText } from "@/lib/emails/passwordReset"
import { sessionChallengeHtml, sessionChallengeText } from "@/lib/emails/sessionChallenge"
import { sessionChallengeFailedHtml, sessionChallengeFailedText } from "@/lib/emails/sessionChallengeFailedAttempt"
import { sessionChallengeBlockedHtml, sessionChallengeBlockedText } from "@/lib/emails/sessionChallengeBlocked"
import { sessionForcedHtml, sessionForcedText } from "@/lib/emails/sessionForced"
import type { IEmailService } from "@/lib/interfaces/IEmailService"

const FROM = "READY CV <no-reply@readycvv.com>"
const logger = createLogger("ResendEmailService")

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  return `${local.slice(0, 2)}***@${domain}`
}

export class ResendEmailService implements IEmailService {
  async sendRegistrationOtp(to: string, name: string, code: string): Promise<void> {
    if (!emailEnabled()) return
    await resend!.emails.send({
      from: FROM, to,
      subject: "Tu código de verificación — READY CV",
      html: registrationOtpHtml({ userName: name, code }),
      text: registrationOtpText({ userName: name, code }),
    }).catch((e) => logger.error("sendRegistrationOtp failed — user cannot complete registration", { to: maskEmail(to) }, e instanceof Error ? e : undefined))
  }

  async sendPasswordResetOtp(to: string, name: string, code: string): Promise<void> {
    if (!emailEnabled()) return
    await resend!.emails.send({
      from: FROM, to,
      subject: "Tu código para restablecer contraseña — READY CV",
      html: passwordResetHtml({ userName: name, code }),
      text: passwordResetText({ userName: name, code }),
    }).catch((e) => logger.error("sendPasswordResetOtp failed — user cannot reset password", { to: maskEmail(to) }, e instanceof Error ? e : undefined))
  }

  async sendSessionChallenge(to: string, name: string, code: string): Promise<void> {
    if (!emailEnabled()) return
    await resend!.emails.send({
      from: FROM, to,
      subject: "Código de acceso a tu cuenta READY CV",
      html: sessionChallengeHtml({ userName: name, code }),
      text: sessionChallengeText({ userName: name, code }),
    }).catch((e) => logger.error("sendSessionChallenge failed — user cannot complete login", { to: maskEmail(to) }, e instanceof Error ? e : undefined))
  }

  async sendSessionChallengeFailed(to: string, name: string, attemptsLeft: number): Promise<void> {
    if (!emailEnabled()) return
    await resend!.emails.send({
      from: FROM, to,
      subject: "Intento fallido de acceso — READY CV",
      html: sessionChallengeFailedHtml({ userName: name, attemptsLeft }),
      text: sessionChallengeFailedText({ userName: name, attemptsLeft }),
    }).catch((e) => logger.error("sendSessionChallengeFailed failed", { to: maskEmail(to) }, e instanceof Error ? e : undefined))
  }

  async sendSessionChallengeBlocked(to: string, name: string, unblockedAt: Date): Promise<void> {
    if (!emailEnabled()) return
    await resend!.emails.send({
      from: FROM, to,
      subject: "Cuenta bloqueada temporalmente — READY CV",
      html: sessionChallengeBlockedHtml({ userName: name, unblockedAt }),
      text: sessionChallengeBlockedText({ userName: name, unblockedAt }),
    }).catch((e) => logger.error("sendSessionChallengeBlocked failed", { to: maskEmail(to) }, e instanceof Error ? e : undefined))
  }

  async sendSessionForced(to: string, name: string): Promise<void> {
    if (!emailEnabled()) return
    await resend!.emails.send({
      from: FROM, to,
      subject: "Tu sesión fue cerrada — READY CV",
      html: sessionForcedHtml({ userName: name }),
      text: sessionForcedText({ userName: name }),
    }).catch((e) => logger.error("sendSessionForced failed", { to: maskEmail(to) }, e instanceof Error ? e : undefined))
  }
}
