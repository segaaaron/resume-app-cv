interface VerifyEmailProps {
  userName: string
  verifyUrl: string
}

export function verifyEmailHtml({ userName, verifyUrl }: VerifyEmailProps): string {
  const firstName = userName.split(" ")[0] || "Usuario"
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:sans-serif;background:#f4f6f8;padding:40px 0;margin:0;">
<table width="580" style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e5e7eb;">
<tr><td>
  <h2 style="color:#1a1a1a;margin-top:0;">Verifica tu email</h2>
  <p style="color:#374151;">Hola <strong>${firstName}</strong>,</p>
  <p style="color:#374151;">Gracias por registrarte en READY CV. Haz clic en el botón de abajo para verificar tu dirección de email y activar tu cuenta.</p>
  <p style="text-align:center;margin:32px 0;">
    <a href="${verifyUrl}" style="display:inline-block;background:#2a72d7;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Verificar mi email</a>
  </p>
  <p style="color:#6b7280;font-size:13px;">Este enlace expira en 24 horas. Si no creaste una cuenta en READY CV, puedes ignorar este mensaje.</p>
  <p style="color:#6b7280;font-size:12px;word-break:break-all;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>${verifyUrl}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;"/>
  <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} READY CV — readycvv.com</p>
</td></tr>
</table>
</body></html>`
}

export function verifyEmailText({ userName, verifyUrl }: VerifyEmailProps): string {
  const firstName = userName.split(" ")[0] || "Usuario"
  return `Hola ${firstName},

Gracias por registrarte en READY CV. Verifica tu email en el siguiente enlace:

${verifyUrl}

Este enlace expira en 24 horas.

Si no creaste una cuenta en READY CV, puedes ignorar este mensaje.

© ${new Date().getFullYear()} READY CV`
}
