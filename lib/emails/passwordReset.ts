import { pickEmailLocale } from "./locale"
import { renderCodeEmailHtml, renderCodeEmailText, firstNameOf, type CodeEmailCopy } from "./_code-layout"

interface PasswordResetProps {
  userName: string
  code: string
  /** Reader's language. Sent from a normal request, so the caller always knows it. */
  locale?: string | null
}

const COPY: Record<"es" | "en", CodeEmailCopy & { subject: string }> = {
  es: {
    subject: "Restablecer tu contraseña — Valhalla Resume",
    heading: "Restablecer contraseña",
    greeting: (name) => `Hola <strong>${name}</strong>,`,
    intro: "Recibimos una solicitud para restablecer la contraseña de tu cuenta Valhalla Resume. Usa este código:",
    footnote: (m) => `Este código expira en <strong>${m} minutos</strong>. Si no solicitaste restablecer tu contraseña, ignora este mensaje — tu cuenta está segura.`,
  },
  en: {
    subject: "Reset your password — Valhalla Resume",
    heading: "Reset your password",
    greeting: (name) => `Hi <strong>${name}</strong>,`,
    intro: "We received a request to reset the password for your Valhalla Resume account. Use this code:",
    footnote: (m) => `This code expires in <strong>${m} minutes</strong>. If you didn't ask to reset your password, ignore this message — your account is safe.`,
  },
}

/** Subject in the reader's language — it used to be Spanish for everyone. */
export function passwordResetSubject(locale?: string | null): string {
  return COPY[pickEmailLocale(locale)].subject
}

export function passwordResetHtml({ userName, code, locale }: PasswordResetProps): string {
  const lang = pickEmailLocale(locale)
  return renderCodeEmailHtml(lang, COPY[lang], { firstName: firstNameOf(userName, lang), code })
}

export function passwordResetText({ userName, code, locale }: PasswordResetProps): string {
  const lang = pickEmailLocale(locale)
  return renderCodeEmailText(COPY[lang], { firstName: firstNameOf(userName, lang), code })
}
