import { generateUnsubscribeToken } from "@/lib/unsubscribe-token"
import { PAST_DUE_GRACE_DAYS } from "@/lib/plans"
import { routing } from "@/i18n/routing"

type EmailLocale = (typeof routing.locales)[number]

interface PaymentFailedProps {
  firstName: string
  userId: string
  invoiceUrl?: string | null
  /** Language the customer bought in. Falls back to the default locale. */
  locale?: string | null
}

function pick(locale?: string | null): EmailLocale {
  return (routing.locales as readonly string[]).includes(locale ?? "")
    ? (locale as EmailLocale)
    : routing.defaultLocale
}

const APP_URL = () => (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.readycvv.com").replace(/\/$/, "")

/**
 * Dashboard links must carry a locale segment: those routes only exist under
 * `app/[locale]/` and there is no next-intl middleware to add one, so `/dashboard/...`
 * is the 404 page — on the one email whose entire job is "come fix your card".
 */
const dashboardUrl = (locale: EmailLocale, path: string) => `${APP_URL()}/${locale}${path}`

/**
 * The deadline is DERIVED, never typed in. This copy used to promise "3 days" while
 * Stripe retried for up to 14 and access actually lasted PAST_DUE_GRACE_DAYS past the
 * paid period: it scared customers with a deadline that was not real, in either
 * direction. Change the grace window and this sentence follows.
 */
const COPY = {
  es: {
    subject: "Acción requerida: problema con tu pago en READY CV",
    heading: "Problema con tu pago",
    greeting: (name: string) => `Hola <strong>${name}</strong>,`,
    body: `No pudimos procesar el pago de tu suscripción a READY CV. Tienes <strong>${PAST_DUE_GRACE_DAYS} días</strong> para actualizar tu método de pago antes de que tu acceso Pro se suspenda.`,
    cta: "Actualizar método de pago",
    ignore: "Si ya actualizaste tu tarjeta, puedes ignorar este mensaje.",
    unsubscribe: "cancela tu suscripción a emails aquí",
    unsubscribePrefix: "Si no deseas recibir más correos, ",
    textBody: (name: string, url: string) =>
      `Hola ${name},\n\nNo pudimos procesar el pago de tu suscripción a READY CV. Tienes ${PAST_DUE_GRACE_DAYS} días para actualizar tu método de pago.\n\nActualiza en: ${url}`,
  },
  en: {
    subject: "Action required: there was a problem with your payment",
    heading: "There was a problem with your payment",
    greeting: (name: string) => `Hi <strong>${name}</strong>,`,
    body: `We couldn't process the payment for your READY CV subscription. You have <strong>${PAST_DUE_GRACE_DAYS} days</strong> to update your payment method before your Pro access is suspended.`,
    cta: "Update payment method",
    ignore: "If you've already updated your card, you can ignore this message.",
    unsubscribe: "unsubscribe from these emails here",
    unsubscribePrefix: "If you'd rather not receive these emails, ",
    textBody: (name: string, url: string) =>
      `Hi ${name},\n\nWe couldn't process the payment for your READY CV subscription. You have ${PAST_DUE_GRACE_DAYS} days to update your payment method.\n\nUpdate it at: ${url}`,
  },
} as const

/** Subject line in the customer's language — it used to be hardcoded Spanish. */
export function paymentFailedSubject(locale?: string | null): string {
  return COPY[pick(locale)].subject
}

export function paymentFailedHtml({ firstName, userId, invoiceUrl, locale }: PaymentFailedProps): string {
  const lang = pick(locale)
  const t = COPY[lang]
  const payUrl = invoiceUrl ?? dashboardUrl(lang, "/dashboard/settings")
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"/></head><body style="font-family:sans-serif;background:#f4f6f8;padding:40px 0;">
<table width="580" style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;">
<tr><td><h2 style="color:#dc2626;">${t.heading}</h2>
<p>${t.greeting(firstName)}</p>
<p>${t.body}</p>
<p><a href="${payUrl}" style="display:inline-block;background:#2a72d7;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">${t.cta}</a></p>
<p style="color:#6b7280;font-size:13px;">${t.ignore}</p>
<p style="font-size:12px;color:#9ca3af;margin-top:32px;">${t.unsubscribePrefix}<a href="${APP_URL()}/api/user/unsubscribe?uid=${encodeURIComponent(userId)}&t=${generateUnsubscribeToken(userId)}">${t.unsubscribe}</a>.</p>
</td></tr></table></body></html>`
}

export function paymentFailedText({ firstName, invoiceUrl, locale }: { firstName: string; invoiceUrl?: string | null; locale?: string | null }): string {
  const lang = pick(locale)
  const payUrl = invoiceUrl ?? dashboardUrl(lang, "/dashboard/settings")
  return `${COPY[lang].textBody(firstName, payUrl)}\n\n© ${new Date().getFullYear()} READY CV`
}
