import { pickEmailLocale } from "./locale"
import { renderCodeEmailHtml, renderCodeEmailText, firstNameOf, type CodeEmailCopy } from "./_code-layout"

interface SessionChallengeProps {
  userName: string
  code: string
  /** Reader's language. Sent from a normal request, so the caller always knows it. */
  locale?: string | null
}

const COPY: Record<"es" | "en", CodeEmailCopy & { subject: string }> = {
  es: {
    subject: "Código de acceso — Valhalla Resume",
    heading: "Código de acceso",
    greeting: (name) => `Hola <strong>${name}</strong>,`,
    intro: "Alguien intentó acceder a tu cuenta mientras había una sesión activa. Si eres tú, usa este código para continuar:",
    footnote: (m) => `Este código expira en <strong>${m} minutos</strong>. Si no eres tú, ignora este mensaje — tu sesión actual sigue activa.`,
  },
  en: {
    subject: "Your access code — Valhalla Resume",
    heading: "Access code",
    greeting: (name) => `Hi <strong>${name}</strong>,`,
    intro: "Someone tried to sign in to your account while another session was active. If that was you, use this code to continue:",
    footnote: (m) => `This code expires in <strong>${m} minutes</strong>. If it wasn't you, ignore this message — your current session stays active.`,
  },
}

/** Subject in the reader's language — it used to be Spanish for everyone. */
export function sessionChallengeSubject(locale?: string | null): string {
  return COPY[pickEmailLocale(locale)].subject
}

export function sessionChallengeHtml({ userName, code, locale }: SessionChallengeProps): string {
  const lang = pickEmailLocale(locale)
  return renderCodeEmailHtml(lang, COPY[lang], { firstName: firstNameOf(userName, lang), code })
}

export function sessionChallengeText({ userName, code, locale }: SessionChallengeProps): string {
  const lang = pickEmailLocale(locale)
  return renderCodeEmailText(COPY[lang], { firstName: firstNameOf(userName, lang), code })
}
