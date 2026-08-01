// GET /api/admin/stripe/billing-timeline?cursor=<id>&limit=30
// Paginated durable billing events (refunds, disputes, fraud, cancellations). SUPER_ADMIN only.
import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { auth } from "@/lib/auth"
import { createLogger } from "@/lib/logger"
import { getBillingTimeline } from "@/lib/services/stripe/stripeAdminReport"

export const dynamic = "force-dynamic"

const logger = createLogger("admin-stripe-billing-timeline")

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })
  if (session.user.role !== "SUPER_ADMIN") return apiError(403, "Forbidden", { req })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor") ?? undefined
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "30", 10) || 30, 1), 100)

  try {
    const timeline = await getBillingTimeline({ cursor, limit })
    return NextResponse.json(timeline)
  } catch (err) {
    logger.error("admin-stripe-billing-timeline: query failed", {}, err instanceof Error ? err : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
