// GET /api/admin/stripe/webhooks?status=FAILED&type=invoice.paid&cursor=<id>&limit=30
// Paginated feed of processed Stripe webhooks (success/fail/skip). SUPER_ADMIN only.
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createLogger } from "@/lib/logger"
import { getWebhookFeed } from "@/lib/services/stripe/stripeAdminReport"
import type { WebhookStatus } from "@prisma/client"

export const dynamic = "force-dynamic"

const logger = createLogger("admin-stripe-webhooks")
const VALID_STATUS: WebhookStatus[] = ["SUCCESS", "FAILED", "SKIPPED"]

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get("status")
  const status = statusParam && VALID_STATUS.includes(statusParam as WebhookStatus) ? (statusParam as WebhookStatus) : undefined
  const type = searchParams.get("type") ?? undefined
  const cursor = searchParams.get("cursor") ?? undefined
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "30", 10) || 30, 1), 100)

  try {
    const feed = await getWebhookFeed({ status, type, cursor, limit })
    return NextResponse.json(feed)
  } catch (err) {
    logger.error("admin-stripe-webhooks: query failed", {}, err instanceof Error ? err : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
