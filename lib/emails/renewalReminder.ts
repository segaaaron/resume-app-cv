import { generateUnsubscribeToken } from "@/lib/unsubscribe-token"

import { pickEmailLocale, emailAppUrl, emailDashboardUrl, formatEmailDate } from "./locale"
import { PRICING } from "@/lib/pricing"

interface RenewalReminderProps {
  userName: string
  userId: string
  planInterval: "monthly" | "annual"
  renewalDate: Date
  /**
   * Reader's language. Sent by the cron, which has no request to read it from and no
   * language stored on the user, so today it falls back to the default. Wiring a real
   * value needs the language persisted on the User row.
   */
  locale?: string | null
}

/** Days before renewal this reminder goes out. Quoted in the copy, never typed twice. */
const DAYS_BEFORE_RENEWAL = 2

const COPY = {
  es: {
    subject: `Tu plan se renueva en ${DAYS_BEFORE_RENEWAL} días — READY CV`,
    heading: `Tu plan se renueva en ${DAYS_BEFORE_RENEWAL} días`,
    heroSub: "${t.heroSub}",
    intro: `Te recordamos que tu suscripción a READY CV se renovará automáticamente en <strong>${DAYS_BEFORE_RENEWAL} días</strong>. Si no deseas renovarla, puedes cancelarla antes de la fecha de renovación.`,
    summary: "${t.summary}",
    labelPlan: "Plan",
    labelAmount: "Monto a cobrar",
    labelDate: "Fecha de renovación",
    ctaPrimary: "${t.ctaPrimary}",
    ctaSecondary: "${t.ctaSecondary}",
    planName: (i: "monthly" | "annual") => (i === "annual" ? "Pro Anual" : "Pro Mensual"),
    price: (i: "monthly" | "annual") => `$${i === "annual" ? PRICING.proAnnual : PRICING.proMonthly} USD / ${i === "annual" ? "año" : "mes"}`,
    unsubscribePrefix: "Si no deseas recibir más correos, ",
    unsubscribe: "cancela tu suscripción a emails aquí",
    rights: "Todos los derechos reservados",
    privacy: "Privacidad",
    terms: "Términos",
  },
  en: {
    subject: `Your plan renews in ${DAYS_BEFORE_RENEWAL} days — READY CV`,
    heading: `Your plan renews in ${DAYS_BEFORE_RENEWAL} days`,
    heroSub: "Just giving you a heads-up",
    intro: `Your READY CV subscription renews automatically in <strong>${DAYS_BEFORE_RENEWAL} days</strong>. If you'd rather not renew, you can cancel before the renewal date.`,
    summary: "Renewal summary",
    labelPlan: "Plan",
    labelAmount: "Amount",
    labelDate: "Renewal date",
    ctaPrimary: "Go to my dashboard →",
    ctaSecondary: "Manage or cancel subscription",
    planName: (i: "monthly" | "annual") => (i === "annual" ? "Pro Annual" : "Pro Monthly"),
    price: (i: "monthly" | "annual") => `$${i === "annual" ? PRICING.proAnnual : PRICING.proMonthly} USD / ${i === "annual" ? "year" : "month"}`,
    unsubscribePrefix: "If you'd rather not receive these emails, ",
    unsubscribe: "unsubscribe here",
    rights: "All rights reserved",
    privacy: "Privacy",
    terms: "Terms",
  },
} as const

/** Subject in the reader's language — it used to be Spanish for everyone. */
export function renewalReminderSubject(locale?: string | null): string {
  return COPY[pickEmailLocale(locale)].subject
}



export function renewalReminderHtml({
  userName,
  userId,
  planInterval,
  renewalDate,
  locale,
}: RenewalReminderProps): string {
  const lang = pickEmailLocale(locale)
  const t = COPY[lang]
  const planName = t.planName(planInterval)
  const planPrice = t.price(planInterval)
  const renewalDateStr = formatEmailDate(renewalDate, lang)
  const firstName = userName.split(" ")[0] || userName

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${t.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="https://www.readycvv.com" style="text-decoration:none;">
                <span style="font-size:22px;font-weight:800;color:#2a72d7;letter-spacing:-0.5px;">READY CV</span>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

              <!-- Top accent amber -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:36px 40px;text-align:center;">
                    <div style="font-size:40px;margin-bottom:12px;">⏰</div>
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">
                      ${t.heading}
                    </h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">
                      ${t.heroSub}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 40px;">

                    <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
                      Hola <strong>${firstName}</strong>,
                    </p>
                    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.7;">
                      ${t.intro}
                    </p>

                    <!-- Renewal details box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:24px 28px;">
                          <p style="margin:0 0 16px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;">
                            ${t.summary}
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #fef3c7;">
                                <span style="font-size:14px;color:#6b7280;">${t.labelPlan}</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #fef3c7;">
                                <span style="font-size:14px;font-weight:600;color:#111827;">${planName}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #fef3c7;">
                                <span style="font-size:14px;color:#6b7280;">${t.labelAmount}</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #fef3c7;">
                                <span style="font-size:14px;font-weight:600;color:#111827;">${planPrice}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0 0;">
                                <span style="font-size:14px;color:#6b7280;">${t.labelDate}</span>
                              </td>
                              <td align="right" style="padding:10px 0 0;">
                                <span style="font-size:14px;font-weight:700;color:#d97706;">${renewalDateStr}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTAs -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center" style="padding-bottom:12px;">
                          <a href="${emailDashboardUrl(lang, "/dashboard/resumes")}"
                            style="display:inline-block;background:#2a72d7;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                            ${t.ctaPrimary}
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <a href="${emailDashboardUrl(lang, "/dashboard/settings")}"
                            style="display:inline-block;color:#6b7280;font-size:13px;text-decoration:underline;">
                            ${t.ctaSecondary}
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
                      Si cancelas antes del <strong style="color:#374151;">${renewalDateStr}</strong>, no se realizará ningún cobro adicional.
                    </p>
                    <p style="font-size:12px;color:#9ca3af;margin-top:32px;text-align:center;">
                      ${t.unsubscribePrefix}<a href="${emailAppUrl()}/api/user/unsubscribe?uid=${encodeURIComponent(userId)}&t=${generateUnsubscribeToken(userId)}" style="color:#9ca3af;">${t.unsubscribe}</a>.
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
                © ${new Date().getFullYear()} READY CV · Todos los derechos reservados
              </p>
              <p style="margin:0;font-size:12px;color:#d1d5db;">
                <a href="${emailAppUrl()}/privacy" style="color:#9ca3af;text-decoration:none;">${t.privacy}</a>
                &nbsp;·&nbsp;
                <a href="${emailAppUrl()}/terms" style="color:#9ca3af;text-decoration:none;">${t.terms}</a>
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

export function renewalReminderText({
  userName,
  planInterval,
  renewalDate,
  locale,
}: RenewalReminderProps): string {
  const lang = pickEmailLocale(locale)
  const t = COPY[lang]
  const planName = t.planName(planInterval)
  const planPrice = t.price(planInterval)
  const firstName = userName.split(" ")[0] || userName

  const plain = (x: string) => x.replace(/<[^>]+>/g, "")
  const hello = lang === "en" ? `Hi ${firstName},` : `Hola ${firstName},`
  const cancelNote = lang === "en"
    ? "If you'd rather not renew, cancel before that date at:"
    : "Si no deseas renovar, cancela antes de esa fecha en:"

  return `${hello}

${plain(t.intro)}

${t.summary.toUpperCase()}
---------------------
${t.labelPlan}: ${planName}
${t.labelAmount}: ${planPrice}
${t.labelDate}: ${formatEmailDate(renewalDate, lang)}

${cancelNote}
${emailDashboardUrl(lang, "/dashboard/settings")}

© ${new Date().getFullYear()} READY CV`
}
