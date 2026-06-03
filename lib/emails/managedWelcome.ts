interface ManagedWelcomeProps {
  password: string
  expiresAt: Date
  downloadLimit: number | null
  loginUrl: string
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function managedWelcomeHtml({ password, expiresAt, downloadLimit, loginUrl }: ManagedWelcomeProps): string {
  const expiresStr = formatDate(expiresAt)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu acceso a ReadyCV está listo</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="https://www.readycvv.com" style="text-decoration:none;">
                <span style="font-size:22px;font-weight:800;color:#2a72d7;letter-spacing:-0.5px;">READY CV</span>
              </a>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#2a72d7 0%,#1e56b0 100%);padding:36px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">
                      Tu acceso a ReadyCV está listo
                    </h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">
                      Tu cuenta Premium ha sido configurada.
                    </p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 40px;">

                    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
                      Bienvenido a READY CV. Tu acceso ha sido habilitado y puedes comenzar a usar la plataforma de inmediato.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #dbeafe;border-radius:12px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:24px 28px;">
                          <p style="margin:0 0 16px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;">
                            Datos de acceso
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <span style="font-size:14px;color:#6b7280;">Contraseña temporal</span>
                              </td>
                              <td align="right" style="padding:10px 0;border-bottom:1px solid #e5edff;">
                                <code style="font-size:14px;font-weight:700;color:#111827;background:#e8f0fe;padding:3px 10px;border-radius:6px;letter-spacing:0.5px;">${password}</code>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;${downloadLimit !== null ? "border-bottom:1px solid #e5edff;" : ""}">
                                <span style="font-size:14px;color:#6b7280;">Acceso válido hasta</span>
                              </td>
                              <td align="right" style="padding:10px 0;${downloadLimit !== null ? "border-bottom:1px solid #e5edff;" : ""}">
                                <span style="font-size:14px;font-weight:700;color:#2a72d7;">${expiresStr}</span>
                              </td>
                            </tr>
                            ${downloadLimit !== null ? `
                            <tr>
                              <td style="padding:10px 0 0;">
                                <span style="font-size:14px;color:#6b7280;">Descargas de CV incluidas</span>
                              </td>
                              <td align="right" style="padding:10px 0 0;">
                                <span style="font-size:14px;font-weight:700;color:#111827;">${downloadLimit}</span>
                              </td>
                            </tr>` : ""}
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.7;">
                      Puedes cambiar tu contraseña en cualquier momento desde la configuración de tu cuenta una vez que hayas iniciado sesión.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center">
                          <a href="${loginUrl}"
                            style="display:inline-block;background:#2a72d7;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                            Iniciar sesión &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="padding:28px 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} READY CV &middot; Todos los derechos reservados
              </p>
              <p style="margin:0;font-size:12px;color:#d1d5db;">
                <a href="https://www.readycvv.com/privacy" style="color:#9ca3af;text-decoration:none;">Privacidad</a>
                &nbsp;&middot;&nbsp;
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

export function managedWelcomeText({ password, expiresAt, downloadLimit, loginUrl }: ManagedWelcomeProps): string {
  const expiresStr = formatDate(expiresAt)
  const downloadLine = downloadLimit !== null ? `Descargas de CV incluidas: ${downloadLimit}\n` : ""

  return `Bienvenido a READY CV

Tu cuenta Premium ha sido configurada.

DATOS DE ACCESO
---------------
Contraseña temporal: ${password}
Acceso válido hasta: ${expiresStr}
${downloadLine}
Puedes cambiar tu contraseña desde la configuración de tu cuenta.

Iniciar sesión: ${loginUrl}

© ${new Date().getFullYear()} READY CV`
}
