import { pickEmailLocale } from "./locale"
import { firstNameOf } from "./_code-layout"

interface SessionChallengeFailedProps {
  userName: string
  attemptsLeft: number
  /** Reader's language. Sent from a normal request, so the caller always knows it. */
  locale?: string | null
}

/** Hours an account stays blocked after too many failed verification attempts. */
export const CHALLENGE_BLOCK_HOURS = 5

const COPY = {
  es: {
    subject: "Intento fallido de acceso — Valhalla Resume",
    heading: "Intento fallido de acceso",
    greeting: (n: string) => `Hola <strong>${n}</strong>,`,
    body: "Se ingresó un código incorrecto para acceder a tu cuenta.",
    attempts: (left: number) =>
      `Te queda${left !== 1 ? "n" : ""} <strong>${left}</strong> intento${left !== 1 ? "s" : ""} antes de que tu cuenta sea bloqueada por ${CHALLENGE_BLOCK_HOURS} horas.`,
    warning: "Si no reconoces este intento, tu contraseña puede estar comprometida. Cámbiala ahora.",
  },
  en: {
    subject: "Failed sign-in attempt — Valhalla Resume",
    heading: "Failed sign-in attempt",
    greeting: (n: string) => `Hi <strong>${n}</strong>,`,
    body: "An incorrect code was entered to access your account.",
    attempts: (left: number) =>
      `You have <strong>${left}</strong> attempt${left !== 1 ? "s" : ""} left before your account is blocked for ${CHALLENGE_BLOCK_HOURS} hours.`,
    warning: "If you don't recognise this attempt, your password may be compromised. Change it now.",
  },
} as const

/** Subject in the reader's language — it used to be Spanish for everyone. */
export function sessionChallengeFailedSubject(locale?: string | null): string {
  return COPY[pickEmailLocale(locale)].subject
}

export function sessionChallengeFailedHtml({ userName, attemptsLeft, locale }: SessionChallengeFailedProps): string {
  const lang = pickEmailLocale(locale)
  const t = COPY[lang]
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;background:#f4f6f8;padding:40px 0;margin:0;">
<table width="580" style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e5e7eb;">
<tr><td>
  <h2 style="color:#1a1a1a;margin-top:0;">${t.heading}</h2>
  <p style="color:#374151;">${t.greeting(firstNameOf(userName, lang))}</p>
  <p style="color:#374151;">${t.body}</p>
  <p style="color:#d97706;font-weight:600;">${t.attempts(attemptsLeft)}</p>
  <p style="color:#6b7280;font-size:13px;">${t.warning}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;"/>
  <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Valhalla Resume — valhallaresume.com</p>
</td></tr>
</table>
</body></html>`
}

export function sessionChallengeFailedText({ userName, attemptsLeft, locale }: SessionChallengeFailedProps): string {
  const lang = pickEmailLocale(locale)
  const t = COPY[lang]
  const plain = (s: string) => s.replace(/<[^>]+>/g, "")
  return `${plain(t.greeting(firstNameOf(userName, lang)))}

${t.body}
${plain(t.attempts(attemptsLeft))}

${t.warning}

© ${new Date().getFullYear()} Valhalla Resume`
}
