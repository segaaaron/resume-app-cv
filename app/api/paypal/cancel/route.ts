// POST /api/paypal/cancel — self-serve cancel for PayPal subscribers.
// PayPal has no hosted portal, so this is the only cancel path for them (the
// Stripe equivalent redirects to Stripe's Billing Portal instead).
// Access is kept until subscriptionEndsAt — see PayPalBillingService.
import { NextResponse } from "next/server"
import { requireAuth, handleError } from "@/lib/controllers/shared"
import { paypalEnabled } from "@/lib/paypal"
import { getPayPalBillingService } from "@/lib/controllers/paypal-deps"

export async function POST(req: Request) {
  if (!paypalEnabled()) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 })
  }

  // requireAuth already enforces the CSRF origin check.
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    const result = await getPayPalBillingService().cancelSubscription(authResult.userId)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req })
  }
}
