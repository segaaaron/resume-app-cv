import { pickEmailLocale, type EmailLocale } from "./locale"
import { firstNameOf } from "./_code-layout"
import { CHALLENGE_BLOCK_HOURS } from "./sessionChallengeFailedAttempt"

interface SessionChallengeBlockedProps {
  userName: string
  unblockedAt: Date
  /** Reader's language. Sent from a normal request, so the caller always knows it. */
  locale?: string | null
}

/** Date and time in the reader's language — this used to force es-ES for everyone. */
function formatDateTime(date: Date, locale: EmailLocale): string {
  return date.toLocaleString(locale === "en" ? "en-US" : "es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const COPY = {
  es: {
    subject: "Cuenta bloqueada temporalmente — Valhalla Resume",
    heading: "Cuenta bloqueada temporalmente",
    greeting: (n: string) => `Hola <strong>${n}</strong>,`,
    body: `Tu cuenta fue bloqueada por <strong>${CHALLENGE_BLOCK_HOURS} horas</strong> por demasiados intentos fallidos de verificación.`,
    retry: (when: string) => `Podrás intentarlo de nuevo el: <strong>${when}</strong>`,
    warning: "Si no reconoces estos intentos, cambia tu contraseña inmediatamente.",
  },
  en: {
    subject: "Account temporarily blocked — Valhalla Resume",
    heading: "Account temporarily blocked",
    greeting: (n: string) => `Hi <strong>${n}</strong>,`,
    body: `Your account was blocked for <strong>${CHALLENGE_BLOCK_HOURS} hours</strong> after too many failed verification attempts.`,
    retry: (when: string) => `You can try again on: <strong>${when}</strong>`,
    warning: "If you don't recognise these attempts, change your password immediately.",
  },
} as const

/** Subject in the reader's language — it used to be Spanish for everyone. */
export function sessionChallengeBlockedSubject(locale?: string | null): string {
  return COPY[pickEmailLocale(locale)].subject
}

export function sessionChallengeBlockedHtml({ userName, unblockedAt, locale }: SessionChallengeBlockedProps): string {
  const lang = pickEmailLocale(locale)
  const t = COPY[lang]
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;background:#f4f6f8;padding:40px 0;margin:0;">
<table width="580" style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e5e7eb;">
<tr><td>
  <h2 style="color:#dc2626;margin-top:0;">${t.heading}</h2>
  <p style="color:#374151;">${t.greeting(firstNameOf(userName, lang))}</p>
  <p style="color:#374151;">${t.body}</p>
  <p style="color:#374151;">${t.retry(formatDateTime(unblockedAt, lang))}</p>
  <p style="color:#6b7280;font-size:13px;">${t.warning}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;"/>
  <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Valhalla Resume — valhallaresume.com</p>
</td></tr>
</table>
</body></html>`
}

export function sessionChallengeBlockedText({ userName, unblockedAt, locale }: SessionChallengeBlockedProps): string {
  const lang = pickEmailLocale(locale)
  const t = COPY[lang]
  const plain = (s: string) => s.replace(/<[^>]+>/g, "")
  return `${plain(t.greeting(firstNameOf(userName, lang)))}

${plain(t.body)}
${plain(t.retry(formatDateTime(unblockedAt, lang)))}

${t.warning}

© ${new Date().getFullYear()} Valhalla Resume`
}
