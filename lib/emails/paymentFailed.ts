import { generateUnsubscribeToken } from "@/lib/unsubscribe-token"

interface PaymentFailedProps {
  firstName: string
  userId: string
  invoiceUrl?: string | null
}

export function paymentFailedHtml({ firstName, userId, invoiceUrl }: PaymentFailedProps): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.readycvv.com"
  const payUrl = invoiceUrl ?? `${appUrl}/dashboard/settings`
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head><body style="font-family:sans-serif;background:#f4f6f8;padding:40px 0;">
<table width="580" style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;">
<tr><td><h2 style="color:#dc2626;">Problema con tu pago</h2>
<p>Hola <strong>${firstName}</strong>,</p>
<p>No pudimos procesar el pago de tu suscripción a READY CV. Tienes <strong>3 días</strong> para actualizar tu método de pago antes de que tu acceso Pro sea suspendido.</p>
<p><a href="${payUrl}" style="display:inline-block;background:#2a72d7;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Actualizar método de pago</a></p>
<p style="color:#6b7280;font-size:13px;">Si ya actualizaste tu tarjeta, puedes ignorar este mensaje.</p>
<p style="font-size:12px;color:#9ca3af;margin-top:32px;">Si no deseas recibir más correos, <a href="${appUrl}/api/user/unsubscribe?uid=${encodeURIComponent(userId)}&t=${generateUnsubscribeToken(userId)}">cancela tu suscripción a emails aquí</a>.</p>
</td></tr></table></body></html>`
}

export function paymentFailedText({ firstName, invoiceUrl }: { firstName: string; invoiceUrl?: string | null }): string {
  const payUrl = invoiceUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.readycvv.com"}/dashboard/settings`
  return `Hola ${firstName},\n\nNo pudimos procesar el pago de tu suscripción a READY CV. Tienes 3 días para actualizar tu método de pago.\n\nActualiza en: ${payUrl}\n\n© ${new Date().getFullYear()} READY CV`
}
