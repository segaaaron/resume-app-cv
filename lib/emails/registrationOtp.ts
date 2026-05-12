interface RegistrationOtpProps {
  userName: string
  code: string
}

export function registrationOtpHtml({ userName, code }: RegistrationOtpProps): string {
  const firstName = userName.split(" ")[0] || "Usuario"
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;background:#f4f6f8;padding:40px 0;margin:0;">
<table width="580" style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e5e7eb;">
<tr><td>
  <h2 style="color:#1a1a1a;margin-top:0;">Verifica tu email</h2>
  <p style="color:#374151;">Hola <strong>${firstName}</strong>,</p>
  <p style="color:#374151;">Gracias por registrarte en READY CV. Usa este código para verificar tu dirección de email:</p>
  <div style="text-align:center;margin:32px 0;">
    <span style="display:inline-block;background:#f3f4f6;border:2px dashed #d1d5db;border-radius:12px;padding:20px 40px;font-size:36px;font-weight:700;letter-spacing:8px;color:#1a1a1a;">${code}</span>
  </div>
  <p style="color:#6b7280;font-size:13px;">Este código expira en <strong>10 minutos</strong>. Si no solicitaste este código, ignora este mensaje.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;"/>
  <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} READY CV — readycvv.com</p>
</td></tr>
</table>
</body></html>`
}

export function registrationOtpText({ userName, code }: RegistrationOtpProps): string {
  const firstName = userName.split(" ")[0] || "Usuario"
  return `Hola ${firstName},

Gracias por registrarte en READY CV. Usa este código para verificar tu dirección de email:

  ${code}

Este código expira en 10 minutos.
Si no solicitaste este código, ignora este mensaje.

© ${new Date().getFullYear()} READY CV`
}
