import { db } from "@/lib/db"
import type { WebhookStatus } from "@prisma/client"

/**
 * Server-side reporting for the admin "PayPal Health" panel. Read-only aggregation
 * over PaypalWebhookLog — the PayPal mirror of getStripeOverview's webhook half.
 *
 * Scope is deliberately webhook health only (no MRR / disputes / refunds block): the
 * Stripe panel derives those from AuditLog + User, which are cross-gateway and not
 * split by provider, so showing them under "PayPal" would be dishonest numbers. The
 * webhook KPIs, top event types and recent failures are exactly what confirms the
 * PayPal pipeline is healthy the moment the gateway is switched on.
 */

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOWS = { "24h": DAY_MS, "7d": 7 * DAY_MS, "30d": 30 * DAY_MS } as const

const RECENT_FAILURES_LIMIT = 10
const TOP_TYPES_LIMIT = 8

export interface WebhookWindowStats {
  total: number
  success: number
  failed: number
  skipped: number
  failureRate: number // 0-100, over (success+failed) — skipped excluded
}

export interface PaypalWebhookFailure {
  id: string
  paypalEventId: string
  type: string
  errorMessage: string | null
  attempts: number
  createdAt: string
}

export interface PaypalOverview {
  generatedAt: string
  configured: boolean // false while PayPal is disabled-in-prod (no credentials)
  webhooks: Record<"24h" | "7d" | "30d", WebhookWindowStats>
  topTypes: { type: string; count: number }[]
  recentFailures: PaypalWebhookFailure[]
}

function windowStats(rows: { status: WebhookStatus; _count: { status: number } }[]): WebhookWindowStats {
  const get = (s: WebhookStatus) => rows.find((r) => r.status === s)?._count.status ?? 0
  const success = get("SUCCESS")
  const failed = get("FAILED")
  const skipped = get("SKIPPED")
  const denom = success + failed
  return {
    total: success + failed + skipped,
    success,
    failed,
    skipped,
    failureRate: denom > 0 ? Math.round((failed / denom) * 100) : 0,
  }
}

export async function getPaypalOverview(configured: boolean): Promise<PaypalOverview> {
  const now = Date.now()
  const since24h = new Date(now - WINDOWS["24h"])
  const since7d = new Date(now - WINDOWS["7d"])
  const since30d = new Date(now - WINDOWS["30d"])

  const groupByStatus = (since: Date) =>
    db.paypalWebhookLog.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: { status: true },
    })

  const [g24, g7, g30, topTypes, failures] = await Promise.all([
    groupByStatus(since24h),
    groupByStatus(since7d),
    groupByStatus(since30d),
    db.paypalWebhookLog.groupBy({
      by: ["type"],
      where: { createdAt: { gte: since7d } },
      _count: { type: true },
      orderBy: { _count: { type: "desc" } },
      take: TOP_TYPES_LIMIT,
    }),
    db.paypalWebhookLog.findMany({
      where: { status: "FAILED", createdAt: { gte: since30d } },
      orderBy: { createdAt: "desc" },
      take: RECENT_FAILURES_LIMIT,
      select: { id: true, paypalEventId: true, type: true, errorMessage: true, attempts: true, createdAt: true },
    }),
  ])

  return {
    generatedAt: new Date(now).toISOString(),
    configured,
    webhooks: {
      "24h": windowStats(g24),
      "7d": windowStats(g7),
      "30d": windowStats(g30),
    },
    topTypes: topTypes.map((t) => ({ type: t.type, count: t._count.type })),
    recentFailures: failures.map((f) => ({
      id: f.id,
      paypalEventId: f.paypalEventId,
      type: f.type,
      errorMessage: f.errorMessage,
      attempts: f.attempts,
      createdAt: f.createdAt.toISOString(),
    })),
  }
}
