import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { auth, purgeUserCache } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe, stripeEnabled } from "@/lib/stripe"
import { resend, emailEnabled } from "@/lib/resend"
import { createLogger } from "@/lib/logger"
import { checkRateLimit } from "@/lib/ai-client"
import { z } from "zod"
import { checkOrigin } from "@/lib/csrf"
import type Stripe from "stripe"

const logger = createLogger("refunds")

// Causales de reembolso aceptadas según T&C (Sección 4)
const VALID_REASONS = ["technical_issue", "duplicate_charge", "service_not_as_described"] as const

const schema = z.object({
  reason: z.enum(VALID_REASONS),
  details: z.string().min(10).max(500).optional(),
})

export async function POST(req: Request) {
  if (!stripeEnabled() || !stripe) {
    return apiError(503, "Payments not configured", { req })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return apiError(401, "Unauthorized", { req })
  }

  if (!checkOrigin(req)) return apiError(403, "Forbidden", { req })

  const allowed = await checkRateLimit(session.user.id, "refunds", 3)
  if (!allowed) return apiError(429, "Demasiados intentos. Intenta más tarde.", { req })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return apiError(400, "Razón de reembolso inválida", { req })
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
        subscriptionEndsAt: true,
        stripeCustomerId: true,
      },
    })

    if (!user) return apiError(404, "Usuario no encontrado", { req })
    if (!user.stripeCustomerId) return apiError(400, "No se encontró cuenta de pago asociada", { req })
    if (!user.subscriptionId) return apiError(400, "No se encontró suscripción activa", { req })

    // Step 1: Find the exact charge for this subscription via its latest invoice's payments.
    // Using charges.list({ customer, limit: 1 }) was incorrect — it could match an
    // unrelated charge if the customer had multiple payment methods or past charges.
    // In Stripe API 2026-03-25.dahlia, invoice.charge was removed; payments are now
    // accessed via InvoicePayment objects linked to the invoice.
    const sub = await stripe.subscriptions.retrieve(user.subscriptionId)
    const latestInvoiceId = typeof sub.latest_invoice === "string"
      ? sub.latest_invoice
      : (sub.latest_invoice as Stripe.Invoice | null)?.id ?? null

    if (!latestInvoiceId) {
      return apiError(400, "No se encontró un pago elegible para reembolso", { req })
    }

    const invoicePayments = await stripe.invoicePayments.list({
      invoice: latestInvoiceId,
      status: "paid",
      expand: ["data.payment.charge"],
    })
    const defaultPayment = invoicePayments.data.find((p) => p.is_default)
    const paymentCharge = defaultPayment?.payment?.charge
    const chargeId = typeof paymentCharge === "string"
      ? paymentCharge
      : (paymentCharge as Stripe.Charge | null)?.id ?? null

    if (!chargeId) {
      return apiError(400, "No se encontró un pago elegible para reembolso", { req })
    }

    const charge = await stripe.charges.retrieve(chargeId)
    if (!charge.paid || charge.refunded) {
      return apiError(400, "No se encontró un pago elegible para reembolso", { req })
    }

    // Step 2: Validate 7-day refund window BEFORE claiming the refund slot.
    const periodStart = new Date(charge.created * 1000)
    const daysSincePeriodStart = Math.floor((Date.now() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSincePeriodStart > 7) {
      return apiError(400, "El período de reembolso de 7 días ha expirado", { req })
    }

    // Step 3: Atomic CAS — claim the refund slot only after eligibility is confirmed.
    // Prevents double-refund on concurrent requests: only the first writer wins.
    const claimed = await db.user.updateMany({
      where: { id: userId, plan: "PRO" },
      data: {
        plan: "UNSUBSCRIBED",
        subscriptionId: null,
        subscriptionEndsAt: null,
        subscriptionStatus: "EXPIRED",
        sessionVersion: { increment: 1 },
      },
    })
    if (claimed.count === 0) {
      return apiError(400, "La suscripción ya fue cancelada o reembolsada", { req })
    }
    purgeUserCache(userId)

    // Step 4: Issue refund. If it fails, roll back the DB state so the user is not
    // left as UNSUBSCRIBED without actually receiving their money back.
    let refund: Stripe.Refund
    try {
      refund = await stripe.refunds.create({
        charge: chargeId,
        reason: reason === "duplicate_charge" ? "duplicate" : "requested_by_customer",
        metadata: { userId, reason, details: details ?? "" },
      })
    } catch (refundErr) {
      logger.error("refunds: Stripe refund creation failed — rolling back DB state", { userId, chargeId }, refundErr instanceof Error ? refundErr : undefined)
      await db.user.update({
        where: { id: userId },
        data: {
          plan: "PRO",
          subscriptionId: user.subscriptionId,
          subscriptionEndsAt: user.subscriptionEndsAt,
          subscriptionStatus: user.subscriptionStatus,
          sessionVersion: { increment: 1 },
        },
      }).catch((dbErr) => logger.error("refunds: CRITICAL — plan rollback failed after refund error. User is UNSUBSCRIBED but no refund was issued.", { userId }, dbErr instanceof Error ? dbErr : undefined))
      purgeUserCache(userId)
      return NextResponse.json({ error: "Error procesando el reembolso" }, { status: 500 })
    }

    await db.auditLog.create({
      data: {
        userId,
        action: "REFUND_ISSUED",
        metadata: { refundId: refund.id, chargeId, reason, details: details ?? "" },
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
