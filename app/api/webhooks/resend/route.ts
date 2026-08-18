import { NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { apiError } from "@/lib/controllers/shared"
import { logError } from "@/lib/services/error/errorLog"
import { createLogger } from "@/lib/logger"

const logger = createLogger("resend-webhook")

/**
 * Rebotes y quejas de correo, desde Resend.
 *
 * POR QUÉ EXISTE: el producto sabía si Resend ACEPTÓ un envío, nunca si llegó. Un usuario
 * que no recibe su código de alta era indistinguible de uno que nunca se registró — el
 * embudo mostraba "se fue" cuando en realidad "nunca le llegó". Y un dominio que acumula
 * rebotes pierde reputación en silencio hasta que deja de entregar para todos.
 *
 * Escribe en ErrorLog con servicio `email`, en vez de crear una tabla: el panel de
 * Service Errors ya lista los servicios que encuentra en los datos, así que aparece solo,
 * con su fila, su fecha y el email afectado. Sin migración.
 *
 * SOLO se registran los eventos que significan que el correo NO llegó (`bounced`) o que
 * el destinatario lo marcó como spam (`complained`). Un `delivered` por cada correo
 * llenaría la tabla de ruido y taparía justamente lo que hay que ver.
 *
 * ENV: RESEND_WEBHOOK_SECRET. Sin él, el endpoint responde 503 y no procesa nada —
 * aceptar eventos sin firma dejaría que cualquiera escriba en el panel del admin.
 */
export const runtime = "nodejs"

const REPORTABLE = new Set(["email.bounced", "email.complained", "email.delivery_delayed"])

function verify(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false
  const expected = createHmac("sha256", secret).update(raw).digest("hex")
  const a = Buffer.from(expected)
  const b = Buffer.from(header.trim())
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return apiError(503, "email_webhook_not_configured", { req })

  const raw = await req.text()
  if (!verify(raw, req.headers.get("resend-signature") ?? req.headers.get("svix-signature"), secret)) {
    return apiError(400, "invalid_signature", { req })
  }

  let event: { type?: string; data?: { to?: string[] | string; subject?: string; bounce?: { type?: string; message?: string } } }
  try {
    event = JSON.parse(raw)
  } catch {
    return apiError(400, "invalid_payload", { req })
  }

  const type = event.type ?? "unknown"
  if (!REPORTABLE.has(type)) {
    // Recibido y sin nada que hacer. 200 igual: un 4xx haría que Resend reintente algo
    // que decidimos ignorar.
    return NextResponse.json({ received: true, ignored: type })
  }

  const to = Array.isArray(event.data?.to) ? event.data?.to?.[0] : event.data?.to
  const reason = event.data?.bounce?.message ?? event.data?.bounce?.type ?? ""

  logError({
    source: "email",
    endpoint: type,
    message: `${type}${reason ? ` — ${reason}` : ""}${event.data?.subject ? ` (${event.data.subject})` : ""}`,
    statusCode: null,
    userEmail: to ?? null,
  })

  logger.warn("email event recorded", { type, to })
  return NextResponse.json({ received: true })
}
