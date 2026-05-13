import { NextResponse } from "next/server"
import { requireAuth, handleError } from "@/lib/controllers/shared"
import { stripeBillingService } from "@/lib/controllers/stripe-deps"

export async function POST(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    const result = await stripeBillingService.cancelSubscription(authResult.userId)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
