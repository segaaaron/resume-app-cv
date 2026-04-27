import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe, stripeEnabled } from "@/lib/stripe"
import { z } from "zod"

// Causales de reembolso aceptadas según T&C (Sección 4)
const VALID_REASONS = ["technical_issue", "duplicate_charge", "service_not_as_described"] as const

const schema = z.object({
  reason: z.enum(VALID_REASONS),
  details: z.string().min(10).max(500).optional(),
})

export async function POST(req: Request) {
  if (!stripeEnabled() || !stripe) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Razón de reembolso inválida" }, { status: 400 })
  }

  const { reason, details } = parsed.data
  const userId = session.user.id

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      subscriptionId: true,
      stripeCustomerId: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  // Verificar que el usuario tiene o tuvo una suscripción activa
  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "No se encontró cuenta de pago asociada" }, { status: 400 })
  }

  // Solo se permite reembolso dentro de los primeros 7 días desde la suscripción
  const daysSinceCreation = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCreation > 7) {
    return NextResponse.json(
      { error: "El período de reembolso de 7 días ha expirado" },
      { status: 400 }
    )
  }

  // Buscar el último invoice pagado del cliente en Stripe
  const invoices = await stripe.invoices.list({
    customer: user.stripeCustomerId,
    limit: 1,
    status: "paid",
  })

  const lastInvoice = invoices.data[0]
  if (!lastInvoice) {
    return NextResponse.json({ error: "No se encontró un pago elegible para reembolso" }, { status: 400 })
  }

  // Obtener el payment_intent para luego recuperar el charge
  const paymentIntentId = typeof lastInvoice.payment_intent === "string"
    ? lastInvoice.payment_intent
    : lastInvoice.payment_intent?.id

  if (!paymentIntentId) {
    return NextResponse.json({ error: "No se encontró un pago elegible para reembolso" }, { status: 400 })
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  const chargeId = typeof paymentIntent.latest_charge === "string"
    ? paymentIntent.latest_charge
    : paymentIntent.latest_charge?.id

  if (!chargeId) {
    return NextResponse.json({ error: "No se encontró el cargo asociado al pago" }, { status: 400 })
  }

  // Emitir reembolso completo en Stripe
  const refund = await stripe.refunds.create({
    charge: chargeId,
    reason: reason === "duplicate_charge" ? "duplicate" : "requested_by_customer",
    metadata: { userId, reason, details: details ?? "" },
  })

  // Bajar el plan inmediatamente
  await db.user.update({
    where: { id: userId },
    data: {
      plan: "FREE",
      subscriptionId: null,
      subscriptionEndsAt: null,
      subscriptionStatus: "EXPIRED",
    },
  })

  // Audit log
  await db.auditLog.create({
    data: {
      userId,
      action: "REFUND_ISSUED",
      metadata: { refundId: refund.id, chargeId, reason, details: details ?? "" },
    },
  })

  // Cancelar la suscripción en Stripe si aún existe
  if (user.subscriptionId) {
    await stripe.subscriptions.cancel(user.subscriptionId).catch(() => null)
  }

  return NextResponse.json({ success: true, refundId: refund.id })
}
