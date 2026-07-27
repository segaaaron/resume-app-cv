import { generateUnsubscribeToken } from "@/lib/unsubscribe-token"
import { PRICING } from "@/lib/pricing"
import { routing } from "@/i18n/routing"

type EmailLocale = (typeof routing.locales)[number]

interface SubscriptionConfirmationProps {
  userName: string
  userId: string
  planInterval: "monthly" | "annual"
  renewalDate: Date
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
 * Dashboard links need a locale segment — those routes only exist under `app/[locale]/`
 * and no middleware adds one, so "go to your dashboard" pointed at the 404 page.
 * (/privacy and /terms do have locale-less entry points that redirect, so they stay.)
 */
const dashboardUrl = (locale: EmailLocale, path: string) => `${APP_URL()}/${locale}${path}`

function formatDate(date: Date, locale: EmailLocale): string {
  return date.toLocaleDateString(locale === "en" ? "en-US" : "es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * Prices come from lib/pricing.ts, the single source shared with the pricing page.
 * They used to be typed into this template, so an email confirming a $99 charge could
 * have quoted a price the customer was never charged — the same drift that put $144 on
 * the pricing page months after Stripe had moved to $99.
 */
function planPrice(interval: "monthly" | "annual", locale: EmailLocale): string {
  const amount = interval === "annual" ? PRICING.proAnnual : PRICING.proMonthly
  if (locale === "en") return `$${amount} USD / ${interval === "annual" ? "year" : "month"}`
  return `$${amount} USD / ${interval === "annual" ? "año" : "mes"}`
}

const COPY = {
  es: {
    subject: "¡Tu suscripción Pro está activa! 🎉",
    title: "Confirmación de suscripción — READY CV",
    heroTitle: "¡Tu suscripción está activa!",
    heroSub: (plan: string) => `Bienvenido al Plan ${plan}`,
    planName: (interval: "monthly" | "annual") => (interval === "annual" ? "Pro Anual" : "Pro Mensual"),
    greeting: (name: string) => `Hola <strong>${name}</strong>,`,
    intro: "Tu pago fue procesado exitosamente. Ya tienes acceso completo a todas las plantillas y funciones de READY CV.",
    detailsTitle: "Detalles de tu plan",
    labelPlan: "Plan",
    labelPrice: "Precio",
    labelStatus: "Estado",
    statusActive: "Activo",
    labelRenewal: "Próxima renovación",
    featuresTitle: "Lo que tienes disponible:",
    features: [
      "Acceso a todas las plantillas profesionales",
      "CVs y cartas de presentación ilimitados",
      "Descarga en PDF de alta calidad",
      "Seguimiento de candidaturas",
      "Soporte prioritario",
    ],
    cta: "Ir a mi dashboard →",
    manage: (link: string) => `Puedes gestionar o cancelar tu suscripción en cualquier momento desde ${link}.`,
    manageLink: "Configuración",
    unsubscribePrefix: "Si no deseas recibir más correos, ",
    unsubscribe: "cancela tu suscripción a emails aquí",
    rights: "Todos los derechos reservados",
    privacy: "Privacidad",
    terms: "Términos",
  },
  en: {
    subject: "Your Pro subscription is active! 🎉",
    title: "Subscription confirmation — READY CV",
    heroTitle: "Your subscription is active!",
    heroSub: (plan: string) => `Welcome to the ${plan} plan`,
    planName: (interval: "monthly" | "annual") => (interval === "annual" ? "Pro Annual" : "Pro Monthly"),
    greeting: (name: string) => `Hi <strong>${name}</strong>,`,
    intro: "Your payment went through. You now have full access to every template and feature in READY CV.",
    detailsTitle: "Your plan",
    labelPlan: "Plan",
    labelPrice: "Price",
    labelStatus: "Status",
    statusActive: "Active",
    labelRenewal: "Renews on",
    featuresTitle: "What you get:",
    features: [
      "Every professional template",
      "Unlimited resumes and cover letters",
      "High-quality PDF export",
      "Application tracking",
      "Priority support",
    ],
    cta: "Go to my dashboard →",
    manage: (link: string) => `You can manage or cancel your subscription any time from ${link}.`,
    manageLink: "Settings",
    unsubscribePrefix: "If you'd rather not receive these emails, ",
    unsubscribe: "unsubscribe here",
    rights: "All rights reserved",
    privacy: "Privacy",
    terms: "Terms",
  },
} as const

/** Subject line in the customer's language — it used to be hardcoded Spanish. */
export function subscriptionConfirmationSubject(locale?: string | null): string {
  return COPY[pick(locale)].subject
}

export function subscriptionConfirmationHtml({
  userName,
  userId,
  planInterval,
  renewalDate,
  locale,
}: SubscriptionConfirmationProps): string {
  const lang = pick(locale)
  const t = COPY[lang]
  const planName = t.planName(planInterval)
  const price = planPrice(planInterval, lang)
  const renewalDateStr = formatDate(renewalDate, lang)
  const firstName = userName.split(" ")[0] || userName
  const manageLink = `<a href="${dashboardUrl(lang, "/dashboard/settings")}" style="color:#2a72d7;text-decoration:none;">${t.manageLink}</a>`

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${t.title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

              <!-- Top accent -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#2a72d7 0%,#1e56b0 100%);padding:36px 40px;text-align:center;">
                    <div style="font-size:40px;margin-bottom:12px;">🎉</div>
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">
                      ${t.heroTitle}
                    </h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">
                      ${t.heroSub(planName)}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 40px;">

                    <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
                      ${t.greeting(firstName)}
                    </p>
                    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.7;">
                      ${t.intro}
                    </p>

                    <!-- Plan details box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #dbeafe;border-radius:12px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:24px 28px;">
                          <p style="margin:0 0 16px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;">
                            ${t.detailsTitle}
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <span style="font-size:14px;color:#6b7280;">${t.labelPlan}</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <span style="font-size:14px;font-weight:600;color:#111827;">${planName}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <span style="font-size:14px;color:#6b7280;">${t.labelPrice}</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <span style="font-size:14px;font-weight:600;color:#111827;">${price}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <span style="font-size:14px;color:#6b7280;">${t.labelStatus}</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <span style="background:#dcfce7;color:#166534;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">${t.statusActive}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0 0;">
                                <span style="font-size:14px;color:#6b7280;">${t.labelRenewal}</span>
                              </td>
                              <td align="right" style="padding:10px 0 0;">
                                <span style="font-size:14px;font-weight:700;color:#2a72d7;">${renewalDateStr}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Features -->
                    <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#111827;">${t.featuresTitle}</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                      ${t.features.map(f => `
                      <tr>
                        <td style="padding:5px 0;">
                          <span style="color:#2a72d7;font-size:16px;margin-right:10px;">✓</span>
                          <span style="font-size:14px;color:#374151;">${f}</span>
                        </td>
                      </tr>`).join("")}
                    </table>

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center">
                          <a href="${dashboardUrl(lang, "/dashboard/resumes")}"
                            style="display:inline-block;background:#2a72d7;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                            ${t.cta}
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
                      ${t.manage(manageLink)}
                    </p>
                    <p style="font-size:12px;color:#9ca3af;margin-top:32px;text-align:center;">
                      ${t.unsubscribePrefix}<a href="${APP_URL()}/api/user/unsubscribe?uid=${encodeURIComponent(userId)}&t=${generateUnsubscribeToken(userId)}" style="color:#9ca3af;">${t.unsubscribe}</a>.
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
                © ${new Date().getFullYear()} READY CV · ${t.rights}
              </p>
              <p style="margin:0;font-size:12px;color:#d1d5db;">
                <a href="${APP_URL()}/privacy" style="color:#9ca3af;text-decoration:none;">${t.privacy}</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL()}/terms" style="color:#9ca3af;text-decoration:none;">${t.terms}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function subscriptionConfirmationText({
  userName,
  planInterval,
  renewalDate,
  locale,
}: SubscriptionConfirmationProps): string {
  const lang = pick(locale)
  const t = COPY[lang]
  const planName = t.planName(planInterval)
  const price = planPrice(planInterval, lang)
  const firstName = userName.split(" ")[0] || userName

  const header = lang === "en"
    ? `Hi ${firstName}!\n\nYour READY CV subscription is active.`
    : `¡Hola ${firstName}!\n\nTu suscripción a READY CV está activa.`

  return `${header}

${t.detailsTitle.toUpperCase()}
-------------------
${t.labelPlan}: ${planName}
${t.labelPrice}: ${price}
${t.labelStatus}: ${t.statusActive}
${t.labelRenewal}: ${formatDate(renewalDate, lang)}

${dashboardUrl(lang, "/dashboard/resumes")}

${dashboardUrl(lang, "/dashboard/settings")}

© ${new Date().getFullYear()} READY CV`
}
