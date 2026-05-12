interface SessionForcedProps {
  userName: string
}

export function sessionForcedHtml({ userName }: SessionForcedProps): string {
  const firstName = userName.split(" ")[0] || "Usuario"
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;background:#f4f6f8;padding:40px 0;margin:0;">
<table width="580" style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e5e7eb;">
<tr><td>
  <h2 style="color:#dc2626;margin-top:0;">Tu sesión fue cerrada</h2>
  <p style="color:#374151;">Hola <strong>${firstName}</strong>,</p>
  <p style="color:#374151;">Tu sesión activa fue cerrada porque alguien verificó su identidad mediante un código enviado al correo de la cuenta y tomó el control desde otro dispositivo.</p>
  <p style="color:#dc2626;font-weight:600;">Si no fuiste tú, cambia tu contraseña inmediatamente y contacta soporte.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;"/>
  <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} READY CV — readycvv.com</p>
</td></tr>
</table>
</body></html>`
}

export function sessionForcedText({ userName }: SessionForcedProps): string {
  const firstName = userName.split(" ")[0] || "Usuario"
  return `Hola ${firstName},

Tu sesión activa fue cerrada porque alguien verificó su identidad mediante un código enviado al correo de la cuenta y tomó el control desde otro dispositivo.

Si no fuiste tú, cambia tu contraseña inmediatamente y contacta soporte.

© ${new Date().getFullYear()} READY CV`
}
