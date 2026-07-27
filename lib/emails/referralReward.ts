import { generateUnsubscribeToken } from "@/lib/unsubscribe-token"

import { pickEmailLocale, emailAppUrl, emailDashboardUrl } from "./locale"

const COPY = {
  es: {
    subject: "Recompensa de referidos — READY CV",
    title: "Recompensa de referidos — READY CV",
    tierLine: (tier: number, label: string) => `Nivel ${tier} — ${label}`,
    complete: (count: number, credit: string) =>
      `Alcanzaste <strong>${count} referidos Pro</strong> en este ciclo. Tu recompensa: <strong>1 mes gratis</strong> (${credit} de crédito). El contador se reinicia para que puedas volver a ganar.`,
    progress: (count: number, tier: number, label: string, credit: string) =>
      `Uno de tus referidos se suscribió al plan Pro. Ahora tienes <strong>${count} referidos Pro</strong> en este ciclo y alcanzaste el <strong>Nivel ${tier} — ${label}</strong>. Se aplicó un crédito de <strong>${credit}</strong> a tu cuenta.`,
    creditApplied: "${t.creditApplied}",
    labelTierCredit: "Crédito de este nivel",
    labelCycle: "Referidos Pro este ciclo",
    labelTotal: "Crédito total acumulado",
    cycleReset: "${t.cycleReset}",
    cta: "${t.cta}",
    invoiceNote: "${t.invoiceNote}",
    unsubscribePrefix: "Si no deseas recibir más correos, ",
    unsubscribe: "cancela tu suscripción a emails aquí",
    rights: "Todos los derechos reservados",
    privacy: "Privacidad",
    terms: "Términos",
    textIntro: "¡Tienes una recompensa de referidos!",
    textSeeReferrals: "Ver tus referidos",
  },
  en: {
    subject: "Referral reward — READY CV",
    title: "Referral reward — READY CV",
    tierLine: (tier: number, label: string) => `Level ${tier} — ${label}`,
    complete: (count: number, credit: string) =>
      `You reached <strong>${count} Pro referrals</strong> this cycle. Your reward: <strong>1 month free</strong> (${credit} in credit). The counter resets so you can earn again.`,
    progress: (count: number, tier: number, label: string, credit: string) =>
      `One of your referrals subscribed to Pro. You now have <strong>${count} Pro referrals</strong> this cycle and reached <strong>Level ${tier} — ${label}</strong>. A credit of <strong>${credit}</strong> was applied to your account.`,
    creditApplied: "Credit applied to your account",
    labelTierCredit: "Credit for this level",
    labelCycle: "Pro referrals this cycle",
    labelTotal: "Total credit earned",
    cycleReset: "🔄 <strong>Cycle reset.</strong> Your counter is back to 0 — keep referring friends to earn new rewards.",
    cta: "See my referrals →",
    invoiceNote: "The credit is applied automatically to your next Stripe invoice.",
    unsubscribePrefix: "If you'd rather not receive these emails, ",
    unsubscribe: "unsubscribe here",
    rights: "All rights reserved",
    privacy: "Privacy",
    terms: "Terms",
    textIntro: "You've earned a referral reward!",
    textSeeReferrals: "See your referrals",
  },
} as const

/** Subject in the reader's language — it used to be Spanish for everyone. */
export function referralRewardSubject(locale?: string | null): string {
  return COPY[pickEmailLocale(locale)].subject
}

interface ReferralRewardProps {
  userName: string
  userId: string
  tier: number
  tierLabel: string
  creditAmount: string   // e.g. "$4.50"
  totalCredit: string    // e.g. "$7.50"
  cycleCount: number
  isCycleComplete: boolean
  /**
   * Reader's language. Triggered from the Stripe checkout webhook, which carries the
   * language the buyer checked out in.
   */
  locale?: string | null
}

export function referralRewardHtml({
  userName,
  userId,
  tier,
  tierLabel,
  creditAmount,
  totalCredit,
  cycleCount,
  isCycleComplete,
  locale,
}: ReferralRewardProps): string {
  const lang = pickEmailLocale(locale)
  const t = COPY[lang]
  const firstName = userName.split(" ")[0] || userName
  const tierEmoji = tier === 1 ? "🥉" : tier === 2 ? "🥈" : "🏆"
  const tierColor = tier === 1 ? "#d97706" : tier === 2 ? "#2563eb" : "#7c3aed"

  const headline = isCycleComplete
    ? "¡Completaste el ciclo — 1 mes gratis!"
    : `¡Nuevo nivel de referidos alcanzado!`

  const bodyText = isCycleComplete
    ? t.complete(cycleCount, creditAmount)
    : t.progress(cycleCount, tier, tierLabel, creditAmount)

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${t.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.readycvv.com"}" style="text-decoration:none;">
                <span style="font-size:22px;font-weight:800;color:#2a72d7;letter-spacing:-0.5px;">READY CV</span>
              </a>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

              <!-- Top accent -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,${tierColor} 0%,${tierColor}cc 100%);padding:36px 40px;text-align:center;">
                    <div style="font-size:48px;margin-bottom:12px;">${tierEmoji}</div>
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">
                      ${headline}
                    </h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">
                      ${t.tierLine(tier, tierLabel)}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 40px;">

                    <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.6;">
                      Hola <strong>${firstName}</strong>,
                    </p>
                    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.7;">
                      ${bodyText}
                    </p>

                    <!-- Credit box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border:1px solid #ede9fe;border-radius:12px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:24px 28px;">
                          <p style="margin:0 0 16px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;">
                            ${t.creditApplied}
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #ede9fe;">
                                <span style="font-size:14px;color:#6b7280;">${t.labelTierCredit}</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #ede9fe;">
                                <span style="font-size:14px;font-weight:600;color:#111827;">${creditAmount}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #ede9fe;">
                                <span style="font-size:14px;color:#6b7280;">${t.labelCycle}</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #ede9fe;">
                                <span style="font-size:14px;font-weight:600;color:#111827;">${cycleCount}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0 0;">
                                <span style="font-size:14px;color:#6b7280;">${t.labelTotal}</span>
                              </td>
                              <td align="right" style="padding:10px 0 0;">
                                <span style="font-size:16px;font-weight:700;color:${tierColor};">${totalCredit}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    ${isCycleComplete ? `
                    <!-- Cycle reset notice -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
                            ${t.cycleReset}
                          </p>
                        </td>
                      </tr>
                    </table>` : ""}

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center">
                          <a href="${emailDashboardUrl(lang, "/dashboard/settings")}"
                            style="display:inline-block;background:#2a72d7;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                            ${t.cta}
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
                      ${t.invoiceNote}
                    </p>
                    <p style="font-size:12px;color:#9ca3af;margin-top:24px;text-align:center;">
                      ${t.unsubscribePrefix}<a href="${`${emailAppUrl()}/api/user/unsubscribe?uid=${encodeURIComponent(userId)}&t=${generateUnsubscribeToken(userId)}`}" style="color:#9ca3af;">${t.unsubscribe}</a>.
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

export function referralRewardText({
  userName,
  tier,
  tierLabel,
  creditAmount,
  totalCredit,
  cycleCount,
  isCycleComplete,
  locale,
}: ReferralRewardProps): string {
  const lang = pickEmailLocale(locale)
  const t = COPY[lang]
  const firstName = userName.split(" ")[0] || userName
  const plain = (x: string) => x.replace(/<[^>]+>/g, "")
  const hello = lang === "en" ? `Hi ${firstName}!` : `¡Hola ${firstName}!`
  const body = isCycleComplete ? t.complete(cycleCount, creditAmount) : t.progress(cycleCount, tier, tierLabel, creditAmount)

  return `${hello}

${t.textIntro}

${plain(body)}

${t.labelCycle}: ${cycleCount}
${t.labelTierCredit}: ${creditAmount}
${t.labelTotal}: ${totalCredit}

${isCycleComplete ? `${plain(t.cycleReset)}\n` : ""}
${t.invoiceNote}

${t.textSeeReferrals}: ${emailDashboardUrl(lang, "/dashboard/settings")}

© ${new Date().getFullYear()} READY CV`
}
