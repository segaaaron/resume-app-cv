import { NextResponse } from "next/server"
import { requireAuth, handleError } from "@/lib/controllers/shared"
import { stripeBillingService } from "@/lib/controllers/stripe-deps"

export async function POST(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const rawLocale = typeof body.locale === "string" ? body.locale : ""
  const locale = ["es", "en"].includes(rawLocale) ? rawLocale : "es"

  try {
    const result = await stripeBillingService.createPortalSession(authResult.userId, locale)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
