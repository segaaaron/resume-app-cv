import { generateUnsubscribeToken } from "@/lib/unsubscribe-token"

interface ApplicationReminderProps {
  userName: string
  userId: string
  jobTitle: string
  company: string
  status: string
  followUpAt: Date
}

const STATUS_LABELS: Record<string, string> = {
  WISHLIST: "Lista de deseos",
  APPLIED: "Aplicado",
  INTERVIEW: "Entrevista",
  OFFER: "Oferta",
  REJECTED: "Rechazado",
}

export function applicationReminderHtml({
  userName,
  userId,
  jobTitle,
  company,
  status,
  followUpAt,
}: ApplicationReminderProps): string {
  const firstName = userName.split(" ")[0] || userName
  const statusLabel = STATUS_LABELS[status] ?? status
  const dateStr = followUpAt.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recordatorio de candidatura — READY CV</title>
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

              <!-- Top accent blue -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#2a72d7 0%,#1d5bb8 100%);padding:36px 40px;text-align:center;">
                    <div style="font-size:40px;margin-bottom:12px;">📋</div>
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">
                      Recordatorio de seguimiento
                    </h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">
                      Es momento de hacer seguimiento a tu candidatura
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
                      Programaste un recordatorio para hacer seguimiento a esta candidatura hoy.
                    </p>

                    <!-- Application details box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:24px 28px;">
                          <p style="margin:0 0 16px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;">
                            Detalles de la candidatura
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #dbeafe;">
                                <span style="font-size:14px;color:#6b7280;">Puesto</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #dbeafe;">
                                <span style="font-size:14px;font-weight:600;color:#111827;">${jobTitle}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #dbeafe;">
                                <span style="font-size:14px;color:#6b7280;">Empresa</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #dbeafe;">
                                <span style="font-size:14px;font-weight:600;color:#111827;">${company}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #dbeafe;">
                                <span style="font-size:14px;color:#6b7280;">Estado actual</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #dbeafe;">
                                <span style="font-size:14px;font-weight:600;color:#2a72d7;">${statusLabel}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0 0;">
                                <span style="font-size:14px;color:#6b7280;">Fecha de seguimiento</span>
                              </td>
                              <td align="right" style="padding:10px 0 0;">
                                <span style="font-size:14px;font-weight:700;color:#2a72d7;">${dateStr}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center">
                          <a href="https://www.readycvv.com/dashboard/applications"
                            style="display:inline-block;background:#2a72d7;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                            Ver mis candidaturas →
                          </a>
                        </td>
                      </tr>
                    </table>

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

export function applicationReminderText({
  userName,
  jobTitle,
  company,
  status,
}: ApplicationReminderProps): string {
  const firstName = userName.split(" ")[0] || userName
  const statusLabel = STATUS_LABELS[status] ?? status

  return `Hola ${firstName},

Programaste un recordatorio para hacer seguimiento a esta candidatura hoy.

CANDIDATURA
-----------
Puesto: ${jobTitle}
Empresa: ${company}
Estado: ${statusLabel}

Ver tus candidaturas:
https://www.readycvv.com/dashboard/applications

© ${new Date().getFullYear()} READY CV`
}
