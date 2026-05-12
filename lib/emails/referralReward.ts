import { generateUnsubscribeToken } from "@/lib/unsubscribe-token"

interface ReferralRewardProps {
  userName: string
  userId: string
  tier: number
  tierLabel: string
  creditAmount: string   // e.g. "$4.50"
  totalCredit: string    // e.g. "$7.50"
  cycleCount: number
  isCycleComplete: boolean
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
}: ReferralRewardProps): string {
  const firstName = userName.split(" ")[0] || userName
  const tierEmoji = tier === 1 ? "🥉" : tier === 2 ? "🥈" : "🏆"
  const tierColor = tier === 1 ? "#d97706" : tier === 2 ? "#2563eb" : "#7c3aed"

  const headline = isCycleComplete
    ? "¡Completaste el ciclo — 1 mes gratis!"
    : `¡Nuevo nivel de referidos alcanzado!`

  const bodyText = isCycleComplete
    ? `Alcanzaste <strong>${cycleCount} referidos Pro</strong> en este ciclo. Tu recompensa: <strong>1 mes gratis</strong> (${creditAmount} de crédito). El contador se reinicia para que puedas volver a ganar.`
    : `Uno de tus referidos se suscribió al plan Pro. Ahora tienes <strong>${cycleCount} referidos Pro</strong> en este ciclo y alcanzaste el <strong>Nivel ${tier} — ${tierLabel}</strong>. Se aplicó un crédito de <strong>${creditAmount}</strong> a tu cuenta.`

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recompensa de referidos — READY CV</title>
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
                      Nivel ${tier} — ${tierLabel}
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
                            Crédito aplicado a tu cuenta
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #ede9fe;">
                                <span style="font-size:14px;color:#6b7280;">Crédito de este nivel</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #ede9fe;">
                                <span style="font-size:14px;font-weight:600;color:#111827;">${creditAmount}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #ede9fe;">
                                <span style="font-size:14px;color:#6b7280;">Referidos Pro este ciclo</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #ede9fe;">
                                <span style="font-size:14px;font-weight:600;color:#111827;">${cycleCount}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0 0;">
                                <span style="font-size:14px;color:#6b7280;">Crédito total acumulado</span>
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
                            🔄 <strong>Ciclo reiniciado.</strong> Tu contador vuelve a 0 — sigue refiriendo amigos para ganar nuevas recompensas.
                          </p>
                        </td>
                      </tr>
                    </table>` : ""}

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center">
                          <a href="https://www.readycvv.com/dashboard/settings"
                            style="display:inline-block;background:#2a72d7;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                            Ver mis referidos →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
                      El crédito se descontará automáticamente en tu próxima factura de Stripe.
                    </p>
                    <p style="font-size:12px;color:#9ca3af;margin-top:24px;text-align:center;">
                      Si no deseas recibir más correos, <a href="https://www.readycvv.com/api/user/unsubscribe?uid=${encodeURIComponent(userId)}&t=${generateUnsubscribeToken(userId)}" style="color:#9ca3af;">cancela tu suscripción a emails aquí</a>.
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
                <a href="https://www.readycvv.com/privacy" style="color:#9ca3af;text-decoration:none;">Privacidad</a>
                &nbsp;·&nbsp;
                <a href="https://www.readycvv.com/terms" style="color:#9ca3af;text-decoration:none;">Términos</a>
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
}: ReferralRewardProps): string {
  const firstName = userName.split(" ")[0] || userName
  return `¡Hola ${firstName}!

${isCycleComplete ? "¡Completaste el ciclo de referidos — 1 mes gratis!" : `¡Alcanzaste el Nivel ${tier} de referidos — ${tierLabel}!`}

Uno de tus referidos se suscribió al plan Pro.
Referidos Pro este ciclo: ${cycleCount}
Crédito aplicado: ${creditAmount}
Crédito total acumulado: ${totalCredit}

${isCycleComplete ? "Tu contador se reinicia — sigue refiriendo amigos para ganar nuevas recompensas.\n" : ""}
El crédito se descontará automáticamente en tu próxima factura.

Ver tus referidos: https://www.readycvv.com/dashboard/settings

© ${new Date().getFullYear()} READY CV`
}
