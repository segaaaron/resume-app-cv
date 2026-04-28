import { NextResponse } from "next/server"
import { stripe, stripeEnabled } from "@/lib/stripe"
import { db } from "@/lib/db"
import { resend, emailEnabled } from "@/lib/resend"
import { subscriptionConfirmationHtml, subscriptionConfirmationText } from "@/lib/emails/subscriptionConfirmation"
import { checkAndApplyReferralReward } from "@/lib/referral-rewards"
import type Stripe from "stripe"

export async function POST(req: Request) {
  if (!stripeEnabled() || !stripe) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Idempotency check — skip already-processed events using persistent DB storage
  const alreadyProcessed = await db.stripeEvent.findUnique({ where: { id: event.id } })
  if (alreadyProcessed) {
    return NextResponse.json({ received: true })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (!userId) break

        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as Stripe.Subscription | null)?.id ?? null

        // Determine interval from price ID
        const priceId = session.line_items?.data[0]?.price?.id
        const planInterval =
          priceId === process.env.STRIPE_PRICE_ID_ANNUAL ? "annual" :
          priceId === process.env.STRIPE_PRICE_ID_MONTHLY ? "monthly" : "monthly"

        await db.user.update({
          where: { id: userId },
          data: {
            plan: "PRO",
            trialEndsAt: null,
            planInterval,
            subscriptionId: subscriptionId ?? undefined,
            subscriptionStatus: "ACTIVE",
            // subscriptionEndsAt will be set when invoice.paid fires
          },
        })

        // Check if this new Pro user was referred — apply reward to referrer if tier crossed
        await checkAndApplyReferralReward(userId)
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const user = await db.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true, name: true, email: true, planInterval: true },
        })
        if (!user) break

        const renewalDate = new Date(invoice.period_end * 1000)

        await db.user.update({
          where: { id: user.id },
          data: {
            plan: "PRO",
            trialEndsAt: null,
            subscriptionEndsAt: renewalDate,
            subscriptionStatus: "ACTIVE",
          },
        })

        // Send confirmation email
        if (emailEnabled() && resend && user.email) {
          const planInterval = (user.planInterval ?? "monthly") as "monthly" | "annual"
          await resend.emails.send({
            from: "READY CV <no-reply@readycvv.com>",
            to: user.email,
            subject: "¡Tu suscripción Pro está activa! 🎉",
            html: subscriptionConfirmationHtml({
              userName: user.name ?? "Usuario",
              userEmail: user.email,
              planInterval,
              renewalDate,
            }),
            text: subscriptionConfirmationText({
              userName: user.name ?? "Usuario",
              userEmail: user.email,
              planInterval,
              renewalDate,
            }),
          }).catch((err) => {
            console.error("[resend] failed to send subscription email:", err)
          })
        }
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (!user) break

        if (sub.cancel_at_period_end) {
          // Cancellation scheduled — user keeps access until subscriptionEndsAt (set by invoice.paid)
          const cancelAt = sub.cancel_at ? new Date(sub.cancel_at * 1000) : undefined
          await db.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: "CANCELED",
              ...(cancelAt ? { subscriptionEndsAt: cancelAt } : {}),
            },
          })
        } else if (sub.status === "active") {
          // Cancellation reversed or subscription renewed
          await db.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: "ACTIVE" },
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (user) {
          await db.user.update({
            where: { id: user.id },
            data: {
              plan: "FREE",
              trialEndsAt: null,
              subscriptionId: null,
              subscriptionEndsAt: null,
              subscriptionStatus: "EXPIRED",
            },
          })
        }
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        const customerId = charge.customer as string
        if (!customerId) break
        const user = await db.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        })
        if (user) {
          await db.user.update({
            where: { id: user.id },
            data: {
              plan: "FREE",
              subscriptionId: null,
              subscriptionEndsAt: null,
              subscriptionStatus: "EXPIRED",
            },
          })
          await db.auditLog.create({
            data: {
              userId: user.id,
              action: "REFUND_ISSUED",
              metadata: { chargeId: charge.id, amount: charge.amount_refunded },
            },
          })
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const user = await db.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true, name: true, email: true },
        })
        if (user) {
          // Grace period: set PAST_DUE instead of immediately downgrading to FREE.
          await db.user.update({
            where: { id: user.id },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: { subscriptionStatus: "PAST_DUE" as any },
          })

          if (emailEnabled() && resend && user.email) {
            const firstName = user.name?.split(" ")[0] ?? "Usuario"
            await resend.emails.send({
              from: "READY CV <no-reply@readycvv.com>",
              to: user.email,
              subject: "Acción requerida: problema con tu pago en READY CV",
              html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head><body style="font-family:sans-serif;background:#f4f6f8;padding:40px 0;">
<table width="580" style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;">
<tr><td><h2 style="color:#dc2626;">Problema con tu pago</h2>
<p>Hola <strong>${firstName}</strong>,</p>
<p>No pudimos procesar el pago de tu suscripción a READY CV. Tienes <strong>3 días</strong> para actualizar tu método de pago antes de que tu acceso Pro sea suspendido.</p>
<p><a href="https://www.readycvv.com/dashboard/settings" style="display:inline-block;background:#2a72d7;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Actualizar método de pago</a></p>
<p style="color:#6b7280;font-size:13px;">Si ya actualizaste tu tarjeta, puedes ignorar este mensaje.</p>
<p style="font-size:12px;color:#9ca3af;margin-top:32px;">Si no deseas recibir más correos, <a href="https://www.readycvv.com/api/user/unsubscribe?email=${encodeURIComponent(user.email)}">cancela tu suscripción a emails aquí</a>.</p>
</td></tr></table></body></html>`,
              text: `Hola ${firstName},\n\nNo pudimos procesar el pago de tu suscripción a READY CV. Tienes 3 días para actualizar tu método de pago.\n\nActualiza en: https://www.readycvv.com/dashboard/settings\n\n© ${new Date().getFullYear()} READY CV`,
            }).catch((err) => {
              console.error("[resend] failed to send payment failed email:", err)
            })
          }
        }
        break
      }
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  // Persist processed event ID to prevent duplicate processing on retry/restart
  await db.stripeEvent.create({ data: { id: event.id } }).catch((err) => {
    console.error("[stripe webhook] failed to persist event ID:", err)
  })

  return NextResponse.json({ received: true })
}
