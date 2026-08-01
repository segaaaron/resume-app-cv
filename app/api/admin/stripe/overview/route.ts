// GET /api/admin/stripe/overview
// Aggregated Stripe webhook health + billing KPIs. Restricted to SUPER_ADMIN.
import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { auth } from "@/lib/auth"
import { createLogger } from "@/lib/logger"
import { getStripeOverview } from "@/lib/services/stripe/stripeAdminReport"

export const dynamic = "force-dynamic"

const logger = createLogger("admin-stripe-overview")

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })
  if (session.user.role !== "SUPER_ADMIN") return apiError(403, "Forbidden", { req })

  try {
    const overview = await getStripeOverview()
    return NextResponse.json(overview)
  } catch (err) {
    logger.error("admin-stripe-overview: query failed", {}, err instanceof Error ? err : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
