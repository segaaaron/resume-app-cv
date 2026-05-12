interface SessionChallengeFailedProps {
  userName: string
  attemptsLeft: number
}

export function sessionChallengeFailedHtml({ userName, attemptsLeft }: SessionChallengeFailedProps): string {
  const firstName = userName.split(" ")[0] || "Usuario"
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;background:#f4f6f8;padding:40px 0;margin:0;">
<table width="580" style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e5e7eb;">
<tr><td>
  <h2 style="color:#1a1a1a;margin-top:0;">Intento fallido de acceso</h2>
  <p style="color:#374151;">Hola <strong>${firstName}</strong>,</p>
  <p style="color:#374151;">Se ingresó un código incorrecto para acceder a tu cuenta.</p>
  <p style="color:#d97706;font-weight:600;">Te quedan <strong>${attemptsLeft}</strong> intento${attemptsLeft !== 1 ? "s" : ""} antes de que tu cuenta sea bloqueada por 5 horas.</p>
  <p style="color:#6b7280;font-size:13px;">Si no reconoces este intento, tu contraseña puede estar comprometida. Cámbiala ahora.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;"/>
  <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} READY CV — readycvv.com</p>
</td></tr>
</table>
</body></html>`
}

export function sessionChallengeFailedText({ userName, attemptsLeft }: SessionChallengeFailedProps): string {
  const firstName = userName.split(" ")[0] || "Usuario"
  return `Hola ${firstName},

Se ingresó un código incorrecto para acceder a tu cuenta.
Te quedan ${attemptsLeft} intento${attemptsLeft !== 1 ? "s" : ""} antes de que tu cuenta sea bloqueada por 5 horas.

Si no reconoces este intento, tu contraseña puede estar comprometida. Cámbiala ahora.

© ${new Date().getFullYear()} READY CV`
}
