interface SessionChallengeBlockedProps {
  userName: string
  unblockedAt: Date
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function sessionChallengeBlockedHtml({ userName, unblockedAt }: SessionChallengeBlockedProps): string {
  const firstName = userName.split(" ")[0] || "Usuario"
  const unblockedStr = formatDateTime(unblockedAt)
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;background:#f4f6f8;padding:40px 0;margin:0;">
<table width="580" style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e5e7eb;">
<tr><td>
  <h2 style="color:#dc2626;margin-top:0;">Cuenta bloqueada temporalmente</h2>
  <p style="color:#374151;">Hola <strong>${firstName}</strong>,</p>
  <p style="color:#374151;">Tu cuenta fue bloqueada por <strong>5 horas</strong> por demasiados intentos fallidos de verificación.</p>
  <p style="color:#374151;">Podrás intentarlo de nuevo el: <strong>${unblockedStr}</strong></p>
  <p style="color:#6b7280;font-size:13px;">Si no reconoces estos intentos, cambia tu contraseña inmediatamente.</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;"/>
  <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} READY CV — readycvv.com</p>
</td></tr>
</table>
</body></html>`
}

export function sessionChallengeBlockedText({ userName, unblockedAt }: SessionChallengeBlockedProps): string {
  const firstName = userName.split(" ")[0] || "Usuario"
  const unblockedStr = formatDateTime(unblockedAt)
  return `Hola ${firstName},

Tu cuenta fue bloqueada por 5 horas por demasiados intentos fallidos de verificación.
Podrás intentarlo de nuevo el: ${unblockedStr}

Si no reconoces estos intentos, cambia tu contraseña inmediatamente.

© ${new Date().getFullYear()} READY CV`
}
