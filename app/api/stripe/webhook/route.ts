import { NextResponse } from "next/server"
import { stripe, stripeEnabled } from "@/lib/stripe"
import { db } from "@/lib/db"
import { purgeUserCache } from "@/lib/auth"
import { resend, emailEnabled } from "@/lib/resend"
import { subscriptionConfirmationHtml, subscriptionConfirmationText } from "@/lib/emails/subscriptionConfirmation"
import { paymentFailedHtml, paymentFailedText } from "@/lib/emails/paymentFailed"
import { checkAndApplyReferralReward } from "@/lib/referral-rewards"
import type Stripe from "stripe"

const TX_OPTS = { timeout: 15000, maxWait: 5000 }

type PrismaUniqueError = { code?: string }

function isDuplicate(e: unknown): boolean {
  return (e as PrismaUniqueError)?.code === "P2002"
}

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
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        console.info(`[webhook] checkout.session.completed userId=${userId ?? "missing"} payment_status=${session.payment_status} session_id=${session.id} event_id=${event.id}`)
        if (!userId) break

        // [C2] Guard against async payment methods (OXXO, bank transfer) — invoice.paid handles the actual upgrade
        if (session.payment_status !== "paid") break

        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as Stripe.Subscription | null)?.id ?? null

        const planInterval = (session.metadata?.planInterval === "annual" ? "annual" : "monthly") as "monthly" | "annual"

        // Retrieve subscription to get subscriptionEndsAt — prevents indefinite Pro if invoice.paid is missed
        let subscriptionEndsAt: Date | undefined
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items"] })
          const periodEnd = sub.items.data[0]?.current_period_end
          if (periodEnd) subscriptionEndsAt = new Date(periodEnd * 1000)
        }

        const result = await db.$transaction(async (tx) => {
          try { await tx.stripeEvent.create({ data: { id: event.id, userId, checkoutSessionId: session.id } }) }
          catch (e) { if (isDuplicate(e)) return { skip: true }; throw e }

          await tx.user.update({
            where: { id: userId },
            data: {
              plan: "PRO",
              trialEndsAt: null,
              planInterval,
              subscriptionId: subscriptionId ?? undefined,
              subscriptionStatus: "ACTIVE",
              ...(subscriptionEndsAt ? { subscriptionEndsAt } : {}),
              sessionVersion: { increment: 1 }, // [C4] cross-process cache bust
            },
          })
          return { skip: false }
        }, TX_OPTS)
        if (result.skip) break

        purgeUserCache(userId)
        await checkAndApplyReferralReward(userId)
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const subDetails = invoice.parent?.type === "subscription_details"
          ? invoice.parent.subscription_details
          : null
        const subscriptionId = subDetails
          ? typeof subDetails.subscription === "string"
            ? subDetails.subscription
            : (subDetails.subscription as Stripe.Subscription | null)?.id ?? null
          : null
        if (!subscriptionId) break

        // External Stripe call — must happen outside transaction
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items"] })
        const firstItem = subscription.items.data[0]
        if (!firstItem) break
        const renewalDate = new Date(firstItem.current_period_end * 1000)

        type InvoicePaidUser = {
          id: string
          name: string | null
          email: string | null
          planInterval: string | null
          subscriptionStatus: string
        }

        const result = await db.$transaction(async (tx) => {
          try { await tx.stripeEvent.create({ data: { id: event.id } }) }
          catch (e) { if (isDuplicate(e)) return { skip: true, user: null }; throw e }

          const user = await tx.user.findUnique({ // [H3] findUnique — stripeCustomerId is @unique
            where: { stripeCustomerId: customerId },
            select: { id: true, name: true, email: true, planInterval: true, subscriptionStatus: true },
          }) as InvoicePaidUser | null
          if (!user) return { skip: false, user: null }

          await tx.stripeEvent.update({ where: { id: event.id }, data: { userId: user.id } })

          // invoice.paid = confirmed payment. Always set ACTIVE + extend endsAt.
          // Covers the un-cancel race: user un-cancels, invoice.paid arrives before subscription.updated.
          await tx.user.update({
            where: { id: user.id },
            data: {
              plan: "PRO",
              trialEndsAt: null,
              subscriptionStatus: "ACTIVE",
              subscriptionEndsAt: renewalDate,
              sessionVersion: { increment: 1 }, // [C4]
            },
          })
          return { skip: false, user }
        }, TX_OPTS)

        if (result.skip || !result.user) break
        const user = result.user
        purgeUserCache(user.id)

        if (emailEnabled() && resend && user.email) {
          const planInterval = (user.planInterval ?? "monthly") as "monthly" | "annual"
          await resend.emails.send({
            from: "READY CV <no-reply@readycvv.com>",
            to: user.email,
            subject: "¡Tu suscripción Pro está activa! 🎉",
            html: subscriptionConfirmationHtml({ userName: user.name ?? "Usuario", userId: user.id, planInterval, renewalDate }),
            text: subscriptionConfirmationText({ userName: user.name ?? "Usuario", userId: user.id, planInterval, renewalDate }),
          }).catch((e) => console.error("[webhook] email send failed", event.id, e)) // [M2]
        }
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        const result = await db.$transaction(async (tx) => {
          try { await tx.stripeEvent.create({ data: { id: event.id } }) }
          catch (e) { if (isDuplicate(e)) return { skip: true, userId: null }; throw e }

          const user = await tx.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } }) // [H3]
          if (!user) return { skip: false, userId: null }

          await tx.stripeEvent.update({ where: { id: event.id }, data: { userId: user.id } })

          if (sub.cancel_at_period_end) {
            let cancelAt = sub.cancel_at ? new Date(sub.cancel_at * 1000) : undefined
            if (!cancelAt) {
              const periodEnd = sub.items.data[0]?.current_period_end
              if (periodEnd) cancelAt = new Date(periodEnd * 1000)
            }
            await tx.user.update({
              where: { id: user.id },
              data: { subscriptionStatus: "CANCELED", ...(cancelAt ? { subscriptionEndsAt: cancelAt } : {}), sessionVersion: { increment: 1 } }, // [C4]
            })
            await tx.auditLog.create({
              data: { userId: user.id, action: "CANCEL_SUBSCRIPTION", metadata: { cancelAt: cancelAt?.toISOString() } },
            })
          } else if (sub.status === "active") {
            const periodEnd = sub.items.data[0]?.current_period_end
            await tx.user.update({
              where: { id: user.id },
              data: { subscriptionStatus: "ACTIVE", ...(periodEnd ? { subscriptionEndsAt: new Date(periodEnd * 1000) } : {}), sessionVersion: { increment: 1 } }, // [C4]
            })
          } else if (sub.status === "past_due" || sub.status === "unpaid") {
            // [H1] Sync Stripe payment failure status — user keeps Pro access (isActive allows PAST_DUE)
            await tx.user.update({
              where: { id: user.id },
              data: { subscriptionStatus: "PAST_DUE", sessionVersion: { increment: 1 } },
            })
          } else if (sub.status === "incomplete_expired" || sub.status === "paused") {
            // [H1] SCA expired or paused — hard downgrade
            await tx.user.update({
              where: { id: user.id },
              data: { plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", sessionVersion: { increment: 1 } },
            })
          }
          return { skip: false, userId: user.id }
        }, TX_OPTS)

        if (result.skip || !result.userId) break
        purgeUserCache(result.userId)
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        const result = await db.$transaction(async (tx) => {
          try { await tx.stripeEvent.create({ data: { id: event.id } }) }
          catch (e) { if (isDuplicate(e)) return { skip: true, userId: null }; throw e }

          const user = await tx.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } }) // [H3]
          if (!user) return { skip: false, userId: null }

          await tx.stripeEvent.update({ where: { id: event.id }, data: { userId: user.id } })

          await tx.user.update({
            where: { id: user.id },
            data: { plan: "UNSUBSCRIBED", trialEndsAt: null, subscriptionId: null, subscriptionEndsAt: null, subscriptionStatus: "EXPIRED", sessionVersion: { increment: 1 } }, // [C4]
          })
          await tx.auditLog.create({
            data: { userId: user.id, action: "CANCEL_SUBSCRIPTION", metadata: { reason: "subscription_deleted" } },
          })
          return { skip: false, userId: user.id }
        }, TX_OPTS)

        if (result.skip || !result.userId) break
        purgeUserCache(result.userId)
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        const customerId = charge.customer as string
        if (!customerId) break

        const result = await db.$transaction(async (tx) => {
          try { await tx.stripeEvent.create({ data: { id: event.id } }) }
          catch (e) { if (isDuplicate(e)) return { skip: true, userId: null, partial: false, subscriptionId: null }; throw e }

          const user = await tx.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true, subscriptionId: true } }) // [H3] + [C3] read subscriptionId
          if (!user) return { skip: false, userId: null, partial: false, subscriptionId: null }

          await tx.stripeEvent.update({ where: { id: event.id }, data: { userId: user.id } })

          if (charge.amount_refunded < charge.amount) {
            await tx.auditLog.create({
              data: {
                userId: user.id,
                action: "PARTIAL_REFUND",
                metadata: { chargeId: charge.id, amountRefunded: charge.amount_refunded, totalAmount: charge.amount },
              },
            })
            return { skip: false, userId: user.id, partial: true, subscriptionId: null }
          }

          await tx.user.update({
            where: { id: user.id },
            data: { plan: "UNSUBSCRIBED", subscriptionId: null, subscriptionEndsAt: null, subscriptionStatus: "EXPIRED", sessionVersion: { increment: 1 } }, // [C4]
          })
          await tx.auditLog.create({
            data: { userId: user.id, action: "REFUND_ISSUED", metadata: { chargeId: charge.id, amount: charge.amount_refunded } },
          })
          return { skip: false, userId: user.id, partial: false, subscriptionId: user.subscriptionId }
        }, TX_OPTS)

        if (result.skip || !result.userId || result.partial) break
        purgeUserCache(result.userId)

        // [C3] Cancel subscription for admin-issued refunds (user-initiated path already cancels, this is the safety net)
        if (result.subscriptionId) {
          await stripe.subscriptions.cancel(result.subscriptionId).catch((e) =>
            console.error("[webhook] sub cancel failed on refund", event.id, e)
          )
        }
        break
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute
        const chargeId = typeof dispute.charge === "string" ? dispute.charge : (dispute.charge as Stripe.Charge | null)?.id ?? null
        let customerId = typeof dispute.charge === "string"
          ? null
          : (dispute.charge as Stripe.Charge | null)?.customer as string | null

        // [M3] Quick idempotency pre-check before any Stripe API call — avoids double API cost on concurrent duplicate delivery
        const alreadySeen = await db.stripeEvent.findUnique({ where: { id: event.id } })
        if (alreadySeen) break

        // Resolve customerId from charge if not expanded — outside transaction
        if (!customerId && chargeId) {
          const charge = await stripe.charges.retrieve(chargeId)
          customerId = charge.customer as string | null
        }
        if (!customerId) break

        const resolvedCustomerId = customerId

        const result = await db.$transaction(async (tx) => {
          try { await tx.stripeEvent.create({ data: { id: event.id } }) }
          catch (e) { if (isDuplicate(e)) return { skip: true, userId: null, subscriptionId: null }; throw e }

          const user = await tx.user.findUnique({ where: { stripeCustomerId: resolvedCustomerId }, select: { id: true, subscriptionId: true } }) // [H3] + [H2] read subscriptionId
          if (!user) return { skip: false, userId: null, subscriptionId: null }

          await tx.stripeEvent.update({ where: { id: event.id }, data: { userId: user.id } })

          await tx.user.update({
            where: { id: user.id },
            data: { plan: "UNSUBSCRIBED", subscriptionId: null, subscriptionEndsAt: null, subscriptionStatus: "EXPIRED", sessionVersion: { increment: 1 } }, // [C4]
          })
          await tx.auditLog.create({
            data: {
              userId: user.id,
              action: "DISPUTE_CHARGEBACK",
              metadata: { disputeId: dispute.id, chargeId, amount: dispute.amount, reason: dispute.reason },
            },
          })
          return { skip: false, userId: user.id, subscriptionId: user.subscriptionId }
        }, TX_OPTS)

        if (result.skip || !result.userId) break
        purgeUserCache(result.userId)

        // [H2] Cancel subscription immediately on chargeback — prevent next billing cycle from re-activating
        if (result.subscriptionId) {
          await stripe.subscriptions.cancel(result.subscriptionId).catch((e) =>
            console.error("[webhook] sub cancel failed on dispute", event.id, e)
          )
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const invoiceUrl = invoice.hosted_invoice_url ?? null // [L1] direct payment link for email CTA

        type FailedUser = { id: string; name: string | null; email: string | null }

        const result = await db.$transaction(async (tx) => {
          try { await tx.stripeEvent.create({ data: { id: event.id } }) }
          catch (e) { if (isDuplicate(e)) return { skip: true, user: null }; throw e }

          const user = await tx.user.findUnique({ // [H3]
            where: { stripeCustomerId: customerId },
            select: { id: true, name: true, email: true },
          }) as FailedUser | null
          if (!user) return { skip: false, user: null }

          // PAST_DUE: keep PRO access while Stripe retries. Downgrade only on subscription.deleted.
          await tx.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: "PAST_DUE", sessionVersion: { increment: 1 } }, // [C4]
          })
          return { skip: false, user }
        }, TX_OPTS)

        if (result.skip || !result.user) break
        const user = result.user
        purgeUserCache(user.id)

        if (emailEnabled() && resend && user.email) {
          const firstName = user.name?.split(" ")[0] ?? "Usuario"
          await resend.emails.send({
            from: "READY CV <no-reply@readycvv.com>",
            to: user.email,
            subject: "Acción requerida: problema con tu pago en READY CV",
            html: paymentFailedHtml({ firstName, userId: user.id, invoiceUrl }),
            text: paymentFailedText({ firstName, invoiceUrl }),
          }).catch((e) => console.error("[webhook] email send failed", event.id, e)) // [M2]
        }
        break
      }

      // Stripe early fraud warning — suspend account before chargeback arrives (saves $15 dispute fee)
      case "radar.early_fraud_warning.created": {
        const warning = event.data.object as Stripe.Radar.EarlyFraudWarning
        const chargeId = typeof warning.charge === "string" ? warning.charge : (warning.charge as Stripe.Charge | null)?.id ?? null
        if (!chargeId) break

        // Resolve customerId from charge — outside transaction
        const charge = await stripe.charges.retrieve(chargeId)
        const customerId = charge.customer as string | null
        if (!customerId) break

        const result = await db.$transaction(async (tx) => {
          try { await tx.stripeEvent.create({ data: { id: event.id } }) }
          catch (e) { if (isDuplicate(e)) return { skip: true, userId: null, subscriptionId: null }; throw e }

          const user = await tx.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true, subscriptionId: true } })
          if (!user) return { skip: false, userId: null, subscriptionId: null }

          await tx.user.update({
            where: { id: user.id },
            data: { plan: "UNSUBSCRIBED", subscriptionId: null, subscriptionEndsAt: null, subscriptionStatus: "EXPIRED", sessionVersion: { increment: 1 } },
          })
          await tx.auditLog.create({
            data: {
              userId: user.id,
              action: "FRAUD_WARNING",
              metadata: { warningId: warning.id, chargeId, fraudType: warning.fraud_type, actionable: warning.actionable },
            },
          })
          return { skip: false, userId: user.id, subscriptionId: user.subscriptionId }
        }, TX_OPTS)

        if (result.skip || !result.userId) break
        purgeUserCache(result.userId)

        // Cancel subscription to prevent next billing cycle
        if (result.subscriptionId) {
          await stripe.subscriptions.cancel(result.subscriptionId).catch((e) =>
            console.error("[webhook] sub cancel failed on fraud warning", event.id, e)
          )
        }
        break
      }

      // Dispute closed — if won, re-evaluate access; log either way
      case "charge.dispute.closed": {
        const dispute = event.data.object as Stripe.Dispute
        const chargeId = typeof dispute.charge === "string" ? dispute.charge : (dispute.charge as Stripe.Charge | null)?.id ?? null
        let customerId = typeof dispute.charge === "string"
          ? null
          : (dispute.charge as Stripe.Charge | null)?.customer as string | null

        if (!customerId && chargeId) {
          const charge = await stripe.charges.retrieve(chargeId)
          customerId = charge.customer as string | null
        }
        if (!customerId) break

        const resolvedCustomerId = customerId
        const disputeWon = dispute.status === "won"

        const result = await db.$transaction(async (tx) => {
          try { await tx.stripeEvent.create({ data: { id: event.id } }) }
          catch (e) { if (isDuplicate(e)) return { skip: true, userId: null }; throw e }

          const user = await tx.user.findUnique({ where: { stripeCustomerId: resolvedCustomerId }, select: { id: true } })
          if (!user) return { skip: false, userId: null }

          await tx.auditLog.create({
            data: {
              userId: user.id,
              action: "DISPUTE_CLOSED",
              metadata: { disputeId: dispute.id, chargeId, status: dispute.status, amount: dispute.amount },
            },
          })
          return { skip: false, userId: user.id }
        }, TX_OPTS)

        if (result.skip || !result.userId) break

        // Won: user was suspended via dispute.created — log it but don't auto-reinstate
        // (requires manual review or user to re-subscribe; they can contact support)
        if (disputeWon) {
          console.info("[webhook] dispute won — manual review required to reinstate", {
            eventId: event.id,
            userId: result.userId,
            disputeId: dispute.id,
          })
        }
        break
      }

      // Customer email/name updated in Stripe Dashboard or portal — sync to DB
      case "customer.updated": {
        const customer = event.data.object as Stripe.Customer
        const customerId = customer.id
        const newEmail = typeof customer.email === "string" ? customer.email : null
        const newName = typeof customer.name === "string" ? customer.name : null

        if (!newEmail && !newName) break

        const result = await db.$transaction(async (tx) => {
          try { await tx.stripeEvent.create({ data: { id: event.id } }) }
          catch (e) { if (isDuplicate(e)) return { skip: true, userId: null }; throw e }

          const user = await tx.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } })
          if (!user) return { skip: false, userId: null }

          await tx.user.update({
            where: { id: user.id },
            data: {
              ...(newEmail ? { email: newEmail } : {}),
              ...(newName  ? { name: newName }   : {}),
            },
          })
          await tx.auditLog.create({
            data: {
              userId: user.id,
              action: "PROFILE_SYNCED_FROM_STRIPE",
              metadata: { email: newEmail, name: newName },
            },
          })
          return { skip: false, userId: user.id }
        }, TX_OPTS)

        if (result.skip || !result.userId) break
        purgeUserCache(result.userId)
        break
      }

      // Subscription created outside checkout flow (Stripe Dashboard, partner API)
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        if (sub.status !== "active") break // only handle immediately active subs

        const result = await db.$transaction(async (tx) => {
          try { await tx.stripeEvent.create({ data: { id: event.id } }) }
          catch (e) { if (isDuplicate(e)) return { skip: true, userId: null }; throw e }

          const user = await tx.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } })
          if (!user) return { skip: false, userId: null }

          const periodEnd = sub.items.data[0]?.current_period_end
          await tx.user.update({
            where: { id: user.id },
            data: {
              plan: "PRO",
              subscriptionId: sub.id,
              subscriptionStatus: "ACTIVE",
              trialEndsAt: null,
              ...(periodEnd ? { subscriptionEndsAt: new Date(periodEnd * 1000) } : {}),
              sessionVersion: { increment: 1 },
            },
          })
          await tx.auditLog.create({
            data: {
              userId: user.id,
              action: "SUBSCRIPTION_CREATED_EXTERNAL",
              metadata: { subscriptionId: sub.id, status: sub.status },
            },
          })
          return { skip: false, userId: user.id }
        }, TX_OPTS)

        if (result.skip || !result.userId) break
        purgeUserCache(result.userId)
        break
      }
    }
  } catch (e) {
    // [L2] Log poison events so malformed events can be manually idempotency-guarded to stop retries
    console.error("[webhook] handler error", { eventId: event.id, eventType: event.type, error: e })
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
