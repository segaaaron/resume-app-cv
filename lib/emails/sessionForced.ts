import { pickEmailLocale } from "./locale"
import { firstNameOf } from "./_code-layout"

interface SessionForcedProps {
  userName: string
  /** Reader's language. Sent from a normal request, so the caller always knows it. */
  locale?: string | null
}

const COPY = {
  es: {
    subject: "Tu sesión fue cerrada — Valhalla Resume",
    heading: "Tu sesión fue cerrada",
    greeting: (n: string) => `Hola <strong>${n}</strong>,`,
    body: "Tu sesión activa fue cerrada porque alguien verificó su identidad mediante un código enviado al correo de la cuenta y tomó el control desde otro dispositivo.",
    warning: "Si no fuiste tú, cambia tu contraseña inmediatamente y contacta soporte.",
  },
  en: {
    subject: "Your session was signed out — Valhalla Resume",
    heading: "Your session was signed out",
    greeting: (n: string) => `Hi <strong>${n}</strong>,`,
    body: "Your active session was closed because someone verified their identity with a code sent to this account's email and took over from another device.",
    warning: "If that wasn't you, change your password immediately and contact support.",
  },
} as const

/** Subject in the reader's language — it used to be Spanish for everyone. */
export function sessionForcedSubject(locale?: string | null): string {
  return COPY[pickEmailLocale(locale)].subject
}

export function sessionForcedHtml({ userName, locale }: SessionForcedProps): string {
  const lang = pickEmailLocale(locale)
  const t = COPY[lang]
  const firstName = firstNameOf(userName, lang)
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;background:#f4f6f8;padding:40px 0;margin:0;">
<table width="580" style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e5e7eb;">
<tr><td>
  <h2 style="color:#dc2626;margin-top:0;">${t.heading}</h2>
  <p style="color:#374151;">${t.greeting(firstName)}</p>
  <p style="color:#374151;">${t.body}</p>
  <p style="color:#dc2626;font-weight:600;">${t.warning}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;"/>
  <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Valhalla Resume — valhallaresume.com</p>
</td></tr>
</table>
</body></html>`
}

export function sessionForcedText({ userName, locale }: SessionForcedProps): string {
  const lang = pickEmailLocale(locale)
  const t = COPY[lang]
  return `${t.greeting(firstNameOf(userName, lang)).replace(/<[^>]+>/g, "")}

${t.body}

${t.warning}

© ${new Date().getFullYear()} Valhalla Resume`
}
