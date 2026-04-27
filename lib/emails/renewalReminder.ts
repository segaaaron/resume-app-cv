interface RenewalReminderProps {
  userName: string
  userEmail: string
  planInterval: "monthly" | "annual"
  renewalDate: Date
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function renewalReminderHtml({
  userName,
  userEmail,
  planInterval,
  renewalDate,
}: RenewalReminderProps): string {
  const planName = planInterval === "annual" ? "Pro Anual" : "Pro Mensual"
  const planPrice = planInterval === "annual" ? "$144 USD / año" : "$15 USD / mes"
  const renewalDateStr = formatDate(renewalDate)
  const firstName = userName.split(" ")[0] || userName

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu plan se renueva en 2 días — READY CV</title>
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
                      Tu plan se renueva en 2 días
                    </h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">
                      Solo queremos avisarte con tiempo
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
                      Te recordamos que tu suscripción a READY CV se renovará automáticamente en <strong>2 días</strong>. Si no deseas renovarla, puedes cancelarla antes de la fecha de renovación.
                    </p>

                    <!-- Renewal details box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:24px 28px;">
                          <p style="margin:0 0 16px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;">
                            Resumen de renovación
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #fef3c7;">
                                <span style="font-size:14px;color:#6b7280;">Plan</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #fef3c7;">
                                <span style="font-size:14px;font-weight:600;color:#111827;">${planName}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #fef3c7;">
                                <span style="font-size:14px;color:#6b7280;">Monto a cobrar</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #fef3c7;">
                                <span style="font-size:14px;font-weight:600;color:#111827;">${planPrice}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0 0;">
                                <span style="font-size:14px;color:#6b7280;">Fecha de renovación</span>
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
                          <a href="https://www.readycvv.com/dashboard/resumes"
                            style="display:inline-block;background:#2a72d7;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                            Ir a mi dashboard →
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <a href="https://www.readycvv.com/dashboard/settings"
                            style="display:inline-block;color:#6b7280;font-size:13px;text-decoration:underline;">
                            Gestionar o cancelar suscripción
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
                      Si cancelas antes del <strong style="color:#374151;">${renewalDateStr}</strong>, no se realizará ningún cobro adicional.
                    </p>
                    <p style="font-size:12px;color:#9ca3af;margin-top:32px;text-align:center;">
                      Si no deseas recibir más correos, <a href="https://www.readycvv.com/api/user/unsubscribe?email=${encodeURIComponent(userEmail)}" style="color:#9ca3af;">cancela tu suscripción a emails aquí</a>.
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

export function renewalReminderText({
  userName,
  planInterval,
  renewalDate,
}: RenewalReminderProps): string {
  const planName = planInterval === "annual" ? "Pro Anual" : "Pro Mensual"
  const planPrice = planInterval === "annual" ? "$144 USD / año" : "$15 USD / mes"
  const firstName = userName.split(" ")[0] || userName

  return `Hola ${firstName},

Tu suscripción a READY CV se renueva en 2 días.

RESUMEN DE RENOVACIÓN
---------------------
Plan: ${planName}
Monto a cobrar: ${planPrice}
Fecha de renovación: ${formatDate(renewalDate)}

Si no deseas renovar, cancela antes de esa fecha en:
https://www.readycvv.com/dashboard/settings

© ${new Date().getFullYear()} READY CV`
}
