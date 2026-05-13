import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, handleError } from "@/lib/controllers/shared"
import { stripeCheckoutService } from "@/lib/controllers/stripe-deps"

const schema = z.object({
  plan:   z.enum(["monthly", "annual"]),
  locale: z.enum(["es", "en"]).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 })

  try {
    const result = await stripeCheckoutService.createSession(authResult.userId, parsed.data.plan, parsed.data.locale ?? "es")
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
