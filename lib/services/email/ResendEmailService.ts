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
import { recordQuota } from "./quota"

const FROM = process.env.EMAIL_FROM ?? "Valhalla Resume <no-reply@valhallaresume.com>"
const logger = createLogger("ResendEmailService")

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  return `${local.slice(0, 2)}***@${domain}`
}


type Payload = { to: string; subject: string; html: string; text: string }

/**
 * Único punto por donde sale un correo.
 *
 * Existe por dos razones concretas, las dos aprendidas leyendo el SDK:
 *
 * 1. CUOTA — cada respuesta de Resend trae `x-resend-monthly-quota` con el consumo del
 *    mes. Los siete envíos descartaban la respuesta, así que ese número se tiraba a la
 *    basura y el panel no tenía forma de saber si estábamos por tocar el tope.
 *
 * 2. ERRORES — `resend.emails.send` NO lanza cuando su API rechaza el envío: devuelve
 *    `{ data: null, error }`. Los `.catch()` que había solo atrapaban fallos de red, de
 *    modo que un correo rechazado (dominio sin verificar, cuota agotada) se perdía en
 *    silencio y en el panel no quedaba nada.
 */
async function deliver(op: string, p: Payload): Promise<void> {
  if (!emailEnabled()) return
  try {
    const res = await resend!.emails.send({ from: FROM, to: p.to, subject: p.subject, html: p.html, text: p.text })
    // Antes del chequeo de error: una respuesta de error TAMBIÉN trae la cuota, y cuando
    // el rechazo es justamente "cuota agotada" ese es el dato que más falta hace.
    await recordQuota(res.headers)
    if (res.error) {
      logger.error(`${op} rechazado por Resend`, { to: maskEmail(p.to), name: res.error.name }, new Error(res.error.message))
    }
  } catch (e) {
    logger.error(`${op} failed`, { to: maskEmail(p.to) }, e instanceof Error ? e : undefined)
  }
}

export class ResendEmailService implements IEmailService {
  async sendRegistrationOtp(to: string, name: string, code: string, locale?: string | null): Promise<void> {
    await deliver("sendRegistrationOtp", {
      to,
      subject: registrationOtpSubject(locale),
      html: registrationOtpHtml({ userName: name, code, locale }),
      text: registrationOtpText({ userName: name, code, locale }),
    })
  }

  async sendPasswordResetOtp(to: string, name: string, code: string, locale?: string | null): Promise<void> {
    await deliver("sendPasswordResetOtp", {
      to,
      subject: passwordResetSubject(locale),
      html: passwordResetHtml({ userName: name, code, locale }),
      text: passwordResetText({ userName: name, code, locale }),
    })
  }

  async sendSessionChallenge(to: string, name: string, code: string, locale?: string | null): Promise<void> {
    await deliver("sendSessionChallenge", {
      to,
      subject: sessionChallengeSubject(locale),
      html: sessionChallengeHtml({ userName: name, code, locale }),
      text: sessionChallengeText({ userName: name, code, locale }),
    })
  }

  async sendSessionChallengeFailed(to: string, name: string, attemptsLeft: number, locale?: string | null): Promise<void> {
    await deliver("sendSessionChallengeFailed", {
      to,
      subject: sessionChallengeFailedSubject(locale),
      html: sessionChallengeFailedHtml({ userName: name, attemptsLeft, locale }),
      text: sessionChallengeFailedText({ userName: name, attemptsLeft, locale }),
    })
  }

  async sendSessionChallengeBlocked(to: string, name: string, unblockedAt: Date, locale?: string | null): Promise<void> {
    await deliver("sendSessionChallengeBlocked", {
      to,
      subject: sessionChallengeBlockedSubject(locale),
      html: sessionChallengeBlockedHtml({ userName: name, unblockedAt, locale }),
      text: sessionChallengeBlockedText({ userName: name, unblockedAt, locale }),
    })
  }

  async sendSessionForced(to: string, name: string, locale?: string | null): Promise<void> {
    await deliver("sendSessionForced", {
      to,
      subject: sessionForcedSubject(locale),
      html: sessionForcedHtml({ userName: name, locale }),
      text: sessionForcedText({ userName: name, locale }),
    })
  }

  async sendManagedWelcome(to: string, password: string, expiresAt: Date, downloadLimit: number | null, locale?: string | null): Promise<void> {
    const base = process.env.NEXTAUTH_URL ?? "https://www.valhallaresume.com"
    const loginUrl = `${base}/es/login`
    await deliver("sendManagedWelcome", {
      to,
      subject: managedWelcomeSubjectFor(locale),
      html: managedWelcomeHtml({ password, expiresAt, downloadLimit, loginUrl, locale }),
      text: managedWelcomeText({ password, expiresAt, downloadLimit, loginUrl, locale }),
    })
  }
}
