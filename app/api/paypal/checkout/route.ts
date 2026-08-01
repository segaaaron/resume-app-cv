import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError , apiError } from "@/lib/controllers/shared"
import { paypalEnabled } from "@/lib/paypal"
import { getPayPalCheckoutService } from "@/lib/controllers/paypal-deps"

// Starts a PayPal payment (subscription or one-time order) and returns the
// approval URL the client redirects to. Mirror of the Stripe checkout route.
const schema = z.object({
  plan: z.enum(["monthly", "annual", "basic", "sprint"]),
  locale: z.enum(["es", "en"]).optional(),
})

export async function POST(req: Request) {
  if (!paypalEnabled()) {
    return apiError(503, "Payments not configured", { req })
  }

  const authResult = await requireUser(req, { csrf: true })
  if (authResult instanceof NextResponse) return authResult

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiError(422, "Invalid data", { req })

  try {
    const { url } = await getPayPalCheckoutService().createCheckout(
      authResult.userId,
      parsed.data.plan,
      parsed.data.locale ?? "en",
    )
    return NextResponse.json({ url })
  } catch (err) {
    return handleError(err, { req })
  }
}
