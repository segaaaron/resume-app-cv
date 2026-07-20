// GET /api/admin/stripe/overview
// Aggregated Stripe webhook health + billing KPIs. Restricted to SUPER_ADMIN.
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createLogger } from "@/lib/logger"
import { getStripeOverview } from "@/lib/services/stripe/stripeAdminReport"

export const dynamic = "force-dynamic"

const logger = createLogger("admin-stripe-overview")

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const overview = await getStripeOverview()
    return NextResponse.json(overview)
  } catch (err) {
    logger.error("admin-stripe-overview: query failed", {}, err instanceof Error ? err : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
