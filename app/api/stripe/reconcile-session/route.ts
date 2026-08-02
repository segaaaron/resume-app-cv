import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, apiError, handleError } from "@/lib/controllers/shared"
import { stripeEnabled } from "@/lib/stripe"
import { stripeClient, stripeWebhookService } from "@/lib/controllers/stripe-deps"

// Success-page reconciliation — Stripe's recommended belt-and-suspenders fulfillment.
// The webhook is the primary path, but it can be delayed or (after a domain/account
// change) misconfigured. When the buyer returns to the success URL with the session id,
// the client posts it here and we provision immediately, idempotently: provisioning is
// keyed on the SESSION, so this never double-provisions or double-charges — retrieving a
// session and updating our DB moves no money; the charge already happened at checkout.
const schema = z.object({ sessionId: z.string().min(1).startsWith("cs_") })

export async function POST(req: Request) {
  // requireAuth also enforces same-origin (checkOrigin) — no separate CSRF check needed.
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  if (!stripeEnabled()) return apiError(503, "payments_not_configured", { req })

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiError(400, "invalid_session_id", { req })

  try {
    const session = await stripeClient.retrieveCheckoutSession(parsed.data.sessionId)

    // The session must belong to the caller. Provisioning reads userId from the session
    // metadata, so without this a user could pass another person's session id. Reject
    // rather than provision someone else.
    if (session.metadata?.userId !== authResult.userId) {
      return apiError(403, "not_your_session", { req })
    }

    const result = await stripeWebhookService.provisionCheckoutSession(session)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req })
  }
}
