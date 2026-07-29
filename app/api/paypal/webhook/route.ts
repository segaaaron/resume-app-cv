import { NextResponse } from "next/server"
import { paypalEnabled } from "@/lib/paypal"
import { getPayPalWebhookService } from "@/lib/controllers/paypal-deps"
import { handleError } from "@/lib/controllers/shared"
import { AppError } from "@/lib/services/auth/AppError"

// PayPal webhook receiver. Mirror of /api/stripe/webhook.
// The RAW body is required: the offline signature verification computes a crc32
// over the exact bytes PayPal sent, so we must NOT parse/re-serialize it here.
export async function POST(req: Request) {
  if (!paypalEnabled()) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 })
  }

  const rawBody = await req.text()

  try {
    await getPayPalWebhookService().handleEvent(rawBody, req.headers)
    return NextResponse.json({ received: true })
  } catch (err) {
    // Bad signature → 400 (no retry helps a forged event). Everything else →
    // 500 so PayPal retries transient failures; idempotency (PaypalEvent) makes
    // retries safe.
    if (err instanceof AppError && err.code === "invalid_signature") {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }
    return handleError(err, { req })
  }
}
