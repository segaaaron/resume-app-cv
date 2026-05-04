import { NextResponse } from "next/server"
import { stripe, stripeEnabled } from "@/lib/stripe"
import { db } from "@/lib/db"
import { resend, emailEnabled } from "@/lib/resend"
import { subscriptionConfirmationHtml, subscriptionConfirmationText } from "@/lib/emails/subscriptionConfirmation"
import { paymentFailedHtml, paymentFailedText } from "@/lib/emails/paymentFailed"
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
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    await db.stripeEvent.create({ data: { id: event.id } })
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code
    if (code === "P2002") return NextResponse.json({ received: true })
    throw e
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

        // Determine interval from subscription metadata (set at checkout)
        const planInterval = (session.metadata?.planInterval === "annual" ? "annual" : "monthly") as "monthly" | "annual"

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

        // In Stripe v22, subscription reference moved to invoice.parent.subscription_details.subscription
        const subDetails = invoice.parent?.type === "subscription_details"
          ? invoice.parent.subscription_details
          : null
        const subscriptionId = subDetails
          ? typeof subDetails.subscription === "string"
            ? subDetails.subscription
            : (subDetails.subscription as Stripe.Subscription | null)?.id ?? null
          : null
        if (!subscriptionId) break

        const user = await db.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true, name: true, email: true, planInterval: true, subscriptionStatus: true },
        })
        if (!user) break

        // In Stripe v22, current_period_end moved from Subscription to SubscriptionItem.
        // invoice.period_end is unreliable (covers usage period, not next renewal).
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["items"],
        })
        const firstItem = subscription.items.data[0]
        if (!firstItem) break
        const renewalDate = new Date(firstItem.current_period_end * 1000)

        // Don't overwrite CANCELED status — user may have canceled immediately after purchase
        // and customer.subscription.updated (CANCELED) may have arrived before invoice.paid
        const newStatus = user.subscriptionStatus === "CANCELED" ? "CANCELED" : "ACTIVE"

        await db.user.update({
          where: { id: user.id },
          data: {
            plan: "PRO",
            trialEndsAt: null,
            subscriptionEndsAt: renewalDate,
            subscriptionStatus: newStatus,
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
              userId: user.id,
              planInterval,
              renewalDate,
            }),
            text: subscriptionConfirmationText({
              userName: user.name ?? "Usuario",
              userId: user.id,
              planInterval,
              renewalDate,
            }),
          }).catch(() => {})
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
          let cancelAt = sub.cancel_at ? new Date(sub.cancel_at * 1000) : undefined
          if (!cancelAt) {
            // Fallback: use current period end from subscription items if cancel_at is null
            const periodEnd = sub.items.data[0]?.current_period_end
            if (periodEnd) cancelAt = new Date(periodEnd * 1000)
          }
          await db.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: "CANCELED",
              ...(cancelAt ? { subscriptionEndsAt: cancelAt } : {}),
            },
          })
          await db.auditLog.create({ data: { userId: user.id, action: "CANCEL_SUBSCRIPTION", metadata: { cancelAt: cancelAt?.toISOString() } } })
        } else if (sub.status === "active") {
          // Cancellation reversed or plan change — sync period end from subscription items
          const periodEnd = sub.items.data[0]?.current_period_end
          await db.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: "ACTIVE",
              ...(periodEnd ? { subscriptionEndsAt: new Date(periodEnd * 1000) } : {}),
            },
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
              plan: "UNSUBSCRIBED",
              trialEndsAt: null,
              subscriptionId: null,
              subscriptionEndsAt: null,
              subscriptionStatus: "EXPIRED",
            },
          })
          await db.auditLog.create({ data: { userId: user.id, action: "CANCEL_SUBSCRIPTION", metadata: { reason: "subscription_deleted" } } })
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
          // Partial refund: log only, do not downgrade
          if (charge.amount_refunded < charge.amount) {
            await db.auditLog.create({
              data: {
                userId: user.id,
                action: "PARTIAL_REFUND",
                metadata: { chargeId: charge.id, amountRefunded: charge.amount_refunded, totalAmount: charge.amount },
              },
            })
            break
          }
          // Full refund: downgrade to FREE
          await db.user.update({
            where: { id: user.id },
            data: {
              plan: "UNSUBSCRIBED",
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

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute
        const customerId = typeof dispute.charge === "string"
          ? null
          : (dispute.charge as Stripe.Charge | null)?.customer as string | null
        const chargeId = typeof dispute.charge === "string" ? dispute.charge : (dispute.charge as Stripe.Charge | null)?.id ?? null

        // Resolve customerId from charge if not expanded
        let resolvedCustomerId = customerId
        if (!resolvedCustomerId && chargeId) {
          const charge = await stripe.charges.retrieve(chargeId)
          resolvedCustomerId = charge.customer as string | null
        }
        if (!resolvedCustomerId) break

        const user = await db.user.findFirst({
          where: { stripeCustomerId: resolvedCustomerId },
          select: { id: true },
        })
        if (user) {
          await db.user.update({
            where: { id: user.id },
            data: {
              plan: "UNSUBSCRIBED",
              subscriptionId: null,
              subscriptionEndsAt: null,
              subscriptionStatus: "EXPIRED",
            },
          })
          await db.auditLog.create({
            data: {
              userId: user.id,
              action: "DISPUTE_CHARGEBACK",
              metadata: { disputeId: dispute.id, chargeId, amount: dispute.amount, reason: dispute.reason },
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
          await db.user.update({
            where: { id: user.id },
            data: {
              plan: "UNSUBSCRIBED",
              subscriptionId: null,
              subscriptionEndsAt: null,
              subscriptionStatus: "EXPIRED",
            },
          })

          if (emailEnabled() && resend && user.email) {
            const firstName = user.name?.split(" ")[0] ?? "Usuario"
            await resend.emails.send({
              from: "READY CV <no-reply@readycvv.com>",
              to: user.email,
              subject: "Acción requerida: problema con tu pago en READY CV",
              html: paymentFailedHtml({ firstName, userId: user.id }),
              text: paymentFailedText({ firstName }),
            }).catch(() => {})
          }
        }
        break
      }
    }
  } catch {
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
