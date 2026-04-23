import { NextResponse } from "next/server"
import { stripe, stripeEnabled } from "@/lib/stripe"
import { db } from "@/lib/db"
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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (!userId) break

        const isTrial = session.line_items?.data[0]?.price?.id === process.env.STRIPE_PRICE_ID_TRIAL
        // STRIPE_PRICE_ID_TRIAL is a server-only env var (no NEXT_PUBLIC_ prefix)
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as Stripe.Subscription | null)?.id ?? null

        await db.user.update({
          where: { id: userId },
          data: {
            plan: isTrial ? "TRIAL" : "PRO",
            trialEndsAt: isTrial ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
            subscriptionId: subscriptionId ?? undefined,
            subscriptionStatus: "ACTIVE",
            // subscriptionEndsAt will be set when invoice.paid fires
          },
        })
        break
      }

      case "invoice.paid": {
        // period_end gives us when the current paid period ends
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (!user) break

        await db.user.update({
          where: { id: user.id },
          data: {
            plan: "PRO",
            trialEndsAt: null,
            // period_end is the end of the invoice period (subscription renewal date)
            subscriptionEndsAt: new Date(invoice.period_end * 1000),
            subscriptionStatus: "ACTIVE",
          },
        })
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (!user) break

        if (sub.cancel_at_period_end) {
          // Cancellation scheduled — user keeps access until subscriptionEndsAt (set by invoice.paid)
          // If Stripe provides an explicit cancel_at, use it; otherwise keep existing subscriptionEndsAt
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

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (user) {
          await db.user.update({
            where: { id: user.id },
            data: {
              plan: "FREE",
              trialEndsAt: null,
              subscriptionStatus: "EXPIRED",
            },
          })
        }
        break
      }
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
