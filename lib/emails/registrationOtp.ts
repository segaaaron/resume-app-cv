import { pickEmailLocale } from "./locale"
import { renderCodeEmailHtml, renderCodeEmailText, firstNameOf, type CodeEmailCopy } from "./_code-layout"

interface RegistrationOtpProps {
  userName: string
  code: string
  /** Reader's language. Sent from a normal request, so the caller always knows it. */
  locale?: string | null
}

const COPY: Record<"es" | "en", CodeEmailCopy & { subject: string }> = {
  es: {
    subject: "Verifica tu email — READY CV",
    heading: "Verifica tu email",
    greeting: (name) => `Hola <strong>${name}</strong>,`,
    intro: "Gracias por registrarte en READY CV. Usa este código para verificar tu dirección de email:",
    footnote: (m) => `Este código expira en <strong>${m} minutos</strong>. Si no solicitaste este código, ignora este mensaje.`,
  },
  en: {
    subject: "Verify your email — READY CV",
    heading: "Verify your email",
    greeting: (name) => `Hi <strong>${name}</strong>,`,
    intro: "Thanks for signing up to READY CV. Use this code to verify your email address:",
    footnote: (m) => `This code expires in <strong>${m} minutes</strong>. If you didn't request it, you can ignore this message.`,
  },
}

/** Subject in the reader's language — it used to be Spanish for everyone. */
export function registrationOtpSubject(locale?: string | null): string {
  return COPY[pickEmailLocale(locale)].subject
}

export function registrationOtpHtml({ userName, code, locale }: RegistrationOtpProps): string {
  const lang = pickEmailLocale(locale)
  return renderCodeEmailHtml(lang, COPY[lang], { firstName: firstNameOf(userName, lang), code })
}

export function registrationOtpText({ userName, code, locale }: RegistrationOtpProps): string {
  const lang = pickEmailLocale(locale)
  return renderCodeEmailText(COPY[lang], { firstName: firstNameOf(userName, lang), code })
}
