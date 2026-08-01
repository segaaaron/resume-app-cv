import { NextResponse } from "next/server"
import { requireAuth, handleError , apiError } from "@/lib/controllers/shared"
import { stripeBillingService } from "@/lib/controllers/stripe-deps"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const userPlan = await db.user.findUnique({ where: { id: authResult.userId }, select: { plan: true } })
  if (userPlan?.plan === "LIMITED") return apiError(403, "Not available", { req, extra: { code: "LIMITED_NO_PORTAL" } })

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const rawLocale = typeof body.locale === "string" ? body.locale : ""
  const locale = ["es", "en"].includes(rawLocale) ? rawLocale : "es"

  try {
    const result = await stripeBillingService.createPortalSession(authResult.userId, locale)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req })
  }
}
