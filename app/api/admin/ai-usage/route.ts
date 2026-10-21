// GET /api/admin/ai-usage?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=50&offset=0
// Returns per-user aggregated AI usage stats. Restricted to SUPER_ADMIN.
import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createLogger } from "@/lib/logger"
import { MODEL_PRICING } from "@/lib/services/ai/shared/cost-tracker"

const logger = createLogger("admin-ai-usage")

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })
  if (session.user.role !== "SUPER_ADMIN") return apiError(403, "Forbidden", { req })

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

    // Per-model breakdown, most expensive first. Lleva la TARIFA VIGENTE de cada
    // modelo junto al gasto: sin ella, una fila cara no dice si pesa por precio o
    // por volumen. Sale de MODEL_PRICING, la misma tabla con la que se cobró.
    const byModel = byModelRaw
      .map((r) => {
        const model = r.model || "(unknown)"
        const price = MODEL_PRICING[model]
        return {
          model,
          calls: r._count.id ?? 0,
          promptTokens: r._sum.promptTokens ?? 0,
          completionTokens: r._sum.completionTokens ?? 0,
          costUsd: r._sum.costUsd ?? 0,
          // null = modelo sin precio en la tabla: se cobró con la tarifa
          // conservadora y el número de arriba es una estimación alta.
          inputPer1M: price?.inputPer1M ?? null,
          outputPer1M: price?.outputPer1M ?? null,
        }
      })
      .sort((a, b) => b.costUsd - a.costUsd)

    /**
     * CLAUDE CONTRA OPENAI (CEO, 2026-10-20): cuánto se gastó con cada proveedor.
     *
     * Se deriva del nombre del modelo y NO de una columna nueva en la base: es el
     * mismo criterio con el que `AnthropicClientAdapter` rutea la llamada, así que
     * no pueden discrepar. Un `AIUsageLog` viejo sigue contando: su modelo no
     * empieza con `claude-`, o sea OpenAI, que es lo que era.
     */
    const porProveedor = new Map<string, { calls: number; promptTokens: number; completionTokens: number; costUsd: number }>()
    for (const r of byModel) {
      const key = r.model.startsWith("claude-") ? "Claude (Anthropic)" : "OpenAI"
      const acc = porProveedor.get(key) ?? { calls: 0, promptTokens: 0, completionTokens: 0, costUsd: 0 }
      acc.calls += r.calls
      acc.promptTokens += r.promptTokens
      acc.completionTokens += r.completionTokens
      acc.costUsd += r.costUsd
      porProveedor.set(key, acc)
    }
    const byProvider = [...porProveedor].map(([provider, v]) => ({ provider, ...v })).sort((a, b) => b.costUsd - a.costUsd)

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
      byProvider,
      rows,
      total: totalActiveUsers,
    })
  } catch (err) {
    logger.error("admin-ai-usage: query failed", {}, err instanceof Error ? err : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
