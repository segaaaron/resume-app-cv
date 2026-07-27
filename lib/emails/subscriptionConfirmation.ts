import { generateUnsubscribeToken } from "@/lib/unsubscribe-token"

interface SubscriptionConfirmationProps {
  userName: string
  userId: string
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

export function subscriptionConfirmationHtml({
  userName,
  userId,
  planInterval,
  renewalDate,
}: SubscriptionConfirmationProps): string {
  const planName = planInterval === "annual" ? "Pro Anual" : "Pro Mensual"
  const planPrice = planInterval === "annual" ? "$99 USD / año" : "$15 USD / mes"
  const renewalLabel = planInterval === "annual" ? "Próxima renovación" : "Próxima renovación"
  const renewalDateStr = formatDate(renewalDate)
  const firstName = userName.split(" ")[0] || userName

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de suscripción — READY CV</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

          <!-- Logo / Header -->
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
                  <td style="background:linear-gradient(135deg,#2a72d7 0%,#1e56b0 100%);padding:36px 40px;text-align:center;">
                    <div style="font-size:40px;margin-bottom:12px;">🎉</div>
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">
                      ¡Tu suscripción está activa!
                    </h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">
                      Bienvenido al Plan ${planName}
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
                      Tu pago fue procesado exitosamente. Ya tienes acceso completo a todas las plantillas y funciones de READY CV.
                    </p>

                    <!-- Plan details box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #dbeafe;border-radius:12px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:24px 28px;">
                          <p style="margin:0 0 16px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;">
                            Detalles de tu plan
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <span style="font-size:14px;color:#6b7280;">Plan</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <span style="font-size:14px;font-weight:600;color:#111827;">${planName}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <span style="font-size:14px;color:#6b7280;">Precio</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <span style="font-size:14px;font-weight:600;color:#111827;">${planPrice}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <span style="font-size:14px;color:#6b7280;">Estado</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <span style="background:#dcfce7;color:#166534;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">Activo</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0 0;">
                                <span style="font-size:14px;color:#6b7280;">${renewalLabel}</span>
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
                    <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#111827;">Lo que tienes disponible:</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                      ${[
                        "Acceso a todas las plantillas profesionales",
                        "CVs y cartas de presentación ilimitados",
                        "Descarga en PDF de alta calidad",
                        "Seguimiento de candidaturas",
                        "Soporte prioritario",
                      ].map(f => `
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
                          <a href="https://www.readycvv.com/es/dashboard/resumes"
                            style="display:inline-block;background:#2a72d7;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                            Ir a mi dashboard →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
                      Puedes gestionar o cancelar tu suscripción en cualquier momento desde
                      <a href="https://www.readycvv.com/es/dashboard/settings" style="color:#2a72d7;text-decoration:none;">Configuración</a>.
                    </p>
                    <p style="font-size:12px;color:#9ca3af;margin-top:32px;text-align:center;">
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

export function subscriptionConfirmationText({
  userName,
  planInterval,
  renewalDate,
}: SubscriptionConfirmationProps): string {
  const planName = planInterval === "annual" ? "Pro Anual" : "Pro Mensual"
  const planPrice = planInterval === "annual" ? "$99 USD / año" : "$15 USD / mes"
  const firstName = userName.split(" ")[0] || userName

  return `¡Hola ${firstName}!

Tu suscripción a READY CV está activa.

DETALLES DE TU PLAN
-------------------
Plan: ${planName}
Precio: ${planPrice}
Estado: Activo
Próxima renovación: ${formatDate(renewalDate)}

Accede a tu dashboard en: https://www.readycvv.com/es/dashboard/resumes

Puedes gestionar tu suscripción en: https://www.readycvv.com/es/dashboard/settings

© ${new Date().getFullYear()} READY CV`
}
