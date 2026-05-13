import { NextResponse } from "next/server"
import { auth, purgeUserCache } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe, stripeEnabled } from "@/lib/stripe"
import { resend, emailEnabled } from "@/lib/resend"
import { createLogger } from "@/lib/logger"
import { z } from "zod"
import { checkOrigin } from "@/lib/csrf"

const logger = createLogger("refunds")

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

  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Razón de reembolso inválida" }, { status: 400 })
  }

  const { reason, details } = parsed.data
  const userId = session.user.id

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        subscriptionStatus: true,
        subscriptionId: true,
        stripeCustomerId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json({ error: "No se encontró cuenta de pago asociada" }, { status: 400 })
    }

    // Idempotency guard: already refunded/unsubscribed → return success to prevent double refund on double-click
    if (user.plan === "UNSUBSCRIBED" || user.subscriptionStatus === "EXPIRED") {
      return NextResponse.json({ error: "La suscripción ya fue cancelada o reembolsada" }, { status: 400 })
    }

    if (!user.subscriptionId) {
      return NextResponse.json({ error: "No se encontró suscripción activa" }, { status: 400 })
    }

    const charges = await stripe.charges.list({
      customer: user.stripeCustomerId,
      limit: 1,
    })

    const lastCharge = charges.data.find((c) => c.paid && !c.refunded)
    if (!lastCharge) {
      return NextResponse.json({ error: "No se encontró un pago elegible para reembolso" }, { status: 400 })
    }

    const periodStart = new Date(lastCharge.created * 1000)
    const daysSincePeriodStart = Math.floor((Date.now() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSincePeriodStart > 7) {
      return NextResponse.json(
        { error: "El período de reembolso de 7 días ha expirado" },
        { status: 400 }
      )
    }

    const chargeId = lastCharge.id

    const refund = await stripe.refunds.create({
      charge: chargeId,
      reason: reason === "duplicate_charge" ? "duplicate" : "requested_by_customer",
      metadata: { userId, reason, details: details ?? "" },
    })

    await db.user.update({
      where: { id: userId },
      data: {
        plan: "UNSUBSCRIBED",
        subscriptionId: null,
        subscriptionEndsAt: null,
        subscriptionStatus: "EXPIRED",
        sessionVersion: { increment: 1 },
      },
    })
    purgeUserCache(userId)

    await db.auditLog.create({
      data: {
        userId,
        action: "REFUND_ISSUED",
        metadata: { refundId: refund.id, chargeId: lastCharge.id, reason, details: details ?? "" },
      },
    })

    const subId = user.subscriptionId
    await stripe.subscriptions.cancel(subId).catch(async (e) => {
      logger.error("refunds: CRITICAL — subscription cancel failed after refund, manual cancel required in Stripe", { userId, subscriptionId: subId }, e instanceof Error ? e : undefined)
      await db.auditLog.create({
        data: {
          userId,
          action: "REFUND_ISSUED",
          metadata: { note: "CRITICAL: Stripe sub NOT canceled — manual action required", subscriptionId: subId, refundId: refund.id },
        },
      }).catch((dbErr) => logger.error("refunds: failed to write sub-cancel-failed audit log", { userId }, dbErr instanceof Error ? dbErr : undefined))
      if (emailEnabled() && resend && process.env.ADMIN_EMAIL) {
        await resend.emails.send({
          from: "READY CV <no-reply@readycvv.com>",
          to: process.env.ADMIN_EMAIL,
          subject: `[CRITICAL] Refund issued but subscription NOT canceled: ${userId}`,
          text: `A refund was issued for user ${userId} but the Stripe subscription (${subId}) could NOT be canceled automatically.\n\nStripe will continue billing the user unless you cancel manually.\n\nAction required:\n1. Go to Stripe Dashboard → Subscriptions\n2. Search for subscription ${subId}\n3. Cancel immediately\n\nError: ${String(e)}`,
        }).catch((emailErr) => logger.error("refunds: admin alert email failed", { userId }, emailErr instanceof Error ? emailErr : undefined))
      }
    })

    return NextResponse.json({ success: true, refundId: refund.id })
  } catch (err) {
    logger.error("refunds: unhandled error", { userId }, err instanceof Error ? err : undefined)
    return NextResponse.json({ error: "Error procesando el reembolso" }, { status: 500 })
  }
}
