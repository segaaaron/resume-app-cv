import { NextResponse } from "next/server"
import { stripeEnabled } from "@/lib/stripe"
import { stripeWebhookService } from "@/lib/controllers/stripe-deps"
import { handleError , apiError } from "@/lib/controllers/shared"
import { AppError } from "@/lib/services/auth/AppError"

export async function POST(req: Request) {
  if (!stripeEnabled()) return apiError(503, "Payments not configured", { req })

  const body = await req.text()
  const sig = req.headers.get("stripe-signature")
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !secret) return apiError(400, "Missing signature", { req })

  try {
    await stripeWebhookService.handleEvent(body, sig, secret)
    return NextResponse.json({ received: true })
  } catch (err) {
    // Non-signature errors return 500 so Stripe retries — transient failures (DB down, Stripe SDK error)
    // should be retried. Permanent failures are idempotency-guarded (StripeEvent table).
    if (err instanceof AppError && err.code === "invalid_signature") {
      return apiError(400, "Invalid signature", { req })
    }
    return handleError(err, { req })
  }
}
