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

        // Determine plan from price ID
        const priceId = (session as Stripe.Checkout.Session & { subscription: Stripe.Subscription })
          ?.subscription?.toString()

        const isTrial = session.line_items?.data[0]?.price?.id === process.env.STRIPE_PRICE_ID_TRIAL

        await db.user.update({
          where: { id: userId },
          data: {
            plan: isTrial ? "TRIAL" : "PRO",
            trialEndsAt: isTrial ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
          },
        })
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (user) {
          await db.user.update({
            where: { id: user.id },
            data: { plan: "PRO", trialEndsAt: null },
          })
        }
        break
      }

      case "customer.subscription.deleted":
      case "invoice.payment_failed": {
        const obj = event.data.object as Stripe.Subscription | Stripe.Invoice
        const customerId = (obj as Stripe.Subscription).customer as string
          ?? (obj as Stripe.Invoice).customer as string
        const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (user) {
          await db.user.update({
            where: { id: user.id },
            data: { plan: "FREE", trialEndsAt: null },
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
