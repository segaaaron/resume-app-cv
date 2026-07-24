// GET /api/admin/ai-usage?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=50&offset=0
// Returns per-user aggregated AI usage stats. Restricted to SUPER_ADMIN.
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const logger = createLogger("admin-ai-usage")

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const fromStr = searchParams.get("from")
  const toStr = searchParams.get("to")
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1), 200)
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0)

  const fromDate = fromStr ? new Date(fromStr) : undefined
  const toDate = toStr ? new Date(toStr + "T23:59:59.999Z") : undefined

  // Build date filter
  const dateFilter =
    fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDate ? { lte: toDate } : {}),
          },
        }
      : {}

  try {
    // Three aggregations over the same window: per-user (paginated table),
    // per-service (endpoint) and per-model. Run together — independent queries.
    const [grouped, byEndpointRaw, byModelRaw] = await Promise.all([
      db.aIUsageLog.groupBy({
        by: ["userId"],
        where: dateFilter,
        _sum: { promptTokens: true, completionTokens: true, costUsd: true },
        _count: { id: true },
        _max: { createdAt: true },
      }),
      db.aIUsageLog.groupBy({
        by: ["endpoint"],
        where: dateFilter,
        _sum: { promptTokens: true, completionTokens: true, costUsd: true },
        _count: { id: true },
      }),
      db.aIUsageLog.groupBy({
        by: ["model"],
        where: dateFilter,
        _sum: { promptTokens: true, completionTokens: true, costUsd: true },
        _count: { id: true },
      }),
    ])

    const totalActiveUsers = grouped.length

    // Compute global totals
    const totalCalls = grouped.reduce((acc, r) => acc + (r._count.id ?? 0), 0)
    const totalCostUsd = grouped.reduce((acc, r) => acc + (r._sum.costUsd ?? 0), 0)
    const totalPromptTokens = grouped.reduce((acc, r) => acc + (r._sum.promptTokens ?? 0), 0)
    const totalCompletionTokens = grouped.reduce((acc, r) => acc + (r._sum.completionTokens ?? 0), 0)

    // Per-service breakdown, most expensive first.
    const byEndpoint = byEndpointRaw
      .map((r) => ({
        endpoint: r.endpoint || "(unknown)",
        calls: r._count.id ?? 0,
        promptTokens: r._sum.promptTokens ?? 0,
        completionTokens: r._sum.completionTokens ?? 0,
        costUsd: r._sum.costUsd ?? 0,
      }))
      .sort((a, b) => b.costUsd - a.costUsd)

    // Per-model breakdown, most expensive first.
    const byModel = byModelRaw
      .map((r) => ({
        model: r.model || "(unknown)",
        calls: r._count.id ?? 0,
        promptTokens: r._sum.promptTokens ?? 0,
        completionTokens: r._sum.completionTokens ?? 0,
        costUsd: r._sum.costUsd ?? 0,
      }))
      .sort((a, b) => b.costUsd - a.costUsd)

    // Paginate
    const pageRows = grouped.slice(offset, offset + limit)

    // Fetch user details for paginated rows
    const userIds = pageRows.map((r) => r.userId)
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, plan: true },
    })
    const userMap = new Map(users.map((u) => [u.id, u]))

    const rows = pageRows.map((r) => {
      const user = userMap.get(r.userId)
      return {
        userId: r.userId,
        email: user?.email ?? "(deleted)",
        plan: user?.plan ?? "",
        calls: r._count.id ?? 0,
        promptTokens: r._sum.promptTokens ?? 0,
        completionTokens: r._sum.completionTokens ?? 0,
        costUsd: r._sum.costUsd ?? 0,
        lastUsedAt: r._max.createdAt ?? null,
      }
    })

    return NextResponse.json({
      totals: {
        calls: totalCalls,
        costUsd: totalCostUsd,
        activeUsers: totalActiveUsers,
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
      },
      byEndpoint,
      byModel,
      rows,
      total: totalActiveUsers,
    })
  } catch (err) {
    logger.error("admin-ai-usage: query failed", {}, err instanceof Error ? err : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
