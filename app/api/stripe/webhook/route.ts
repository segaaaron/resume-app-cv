import { NextResponse } from "next/server"
import { stripeEnabled } from "@/lib/stripe"
import { stripeWebhookService } from "@/lib/controllers/stripe-deps"
import { handleError } from "@/lib/controllers/shared"
import { AppError } from "@/lib/services/auth/AppError"

export async function POST(req: Request) {
  if (!stripeEnabled()) return NextResponse.json({ error: "Payments not configured" }, { status: 503 })

  const body = await req.text()
  const sig = req.headers.get("stripe-signature")
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !secret) return NextResponse.json({ error: "Missing signature" }, { status: 400 })

  try {
    await stripeWebhookService.handleEvent(body, sig, secret)
    return NextResponse.json({ received: true })
  } catch (err) {
    // Non-signature errors return 500 so Stripe retries — transient failures (DB down, Stripe SDK error)
    // should be retried. Permanent failures are idempotency-guarded (StripeEvent table).
    if (err instanceof AppError && err.code === "invalid_signature") {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }
    return handleError(err, { req })
  }
}
