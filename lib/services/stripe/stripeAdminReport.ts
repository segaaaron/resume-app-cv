import { db } from "@/lib/db"
import type { AuditAction, Prisma, WebhookStatus } from "@prisma/client"

/**
 * Server-side reporting for the admin "Stripe Health" panel.
 * Read-only aggregation over StripeWebhookLog (webhooks), AuditLog (billing timeline)
 * and User (subscriptions/MRR). Mirrors the getErrorReport / getCronHealth pattern.
 */

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOWS = { "24h": DAY_MS, "7d": 7 * DAY_MS, "30d": 30 * DAY_MS } as const

const FEED_LIMIT = 30
const RECENT_FAILURES_LIMIT = 10
const TOP_TYPES_LIMIT = 8

/** AuditLog actions that belong to the billing/Stripe lifecycle. */
const BILLING_ACTIONS: AuditAction[] = [
  "CANCEL_SUBSCRIPTION",
  "REFUND_ISSUED",
  "PARTIAL_REFUND",
  "DISPUTE_CHARGEBACK",
  "DISPUTE_CLOSED",
  "DISPUTE_WON_MANUAL_REVIEW",
  "FRAUD_WARNING",
  "PROFILE_SYNCED_FROM_STRIPE",
  "SUBSCRIPTION_CREATED_EXTERNAL",
  "SUBSCRIPTION_UPDATED",
  "ADMIN_RECONCILE_USER",
]

const DISPUTE_ACTIONS: AuditAction[] = ["DISPUTE_CHARGEBACK", "DISPUTE_CLOSED", "DISPUTE_WON_MANUAL_REVIEW"]
const REFUND_ACTIONS: AuditAction[] = ["REFUND_ISSUED", "PARTIAL_REFUND"]

export interface WebhookWindowStats {
  total: number
  success: number
  failed: number
  skipped: number
  failureRate: number // 0-100, over (success+failed) — skipped excluded
}

export interface WebhookFailure {
  id: string
  stripeEventId: string
  type: string
  errorMessage: string | null
  attempts: number
  createdAt: string
}

export interface StripeOverview {
  generatedAt: string
  webhooks: Record<"24h" | "7d" | "30d", WebhookWindowStats>
  topTypes: { type: string; count: number }[]
  recentFailures: WebhookFailure[]
  billing30d: { disputes: number; fraud: number; refunds: number; cancellations: number }
  subscriptions: { activePro: number; mrr: number }
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

export async function getStripeOverview(): Promise<StripeOverview> {
  const now = Date.now()
  const since24h = new Date(now - WINDOWS["24h"])
  const since7d = new Date(now - WINDOWS["7d"])
  const since30d = new Date(now - WINDOWS["30d"])

  const groupByStatus = (since: Date) =>
    db.stripeWebhookLog.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: { status: true },
    })

  const [g24, g7, g30, topTypes, failures, billing, activePro] = await Promise.all([
    groupByStatus(since24h),
    groupByStatus(since7d),
    groupByStatus(since30d),
    db.stripeWebhookLog.groupBy({
      by: ["type"],
      where: { createdAt: { gte: since7d } },
      _count: { type: true },
      orderBy: { _count: { type: "desc" } },
      take: TOP_TYPES_LIMIT,
    }),
    db.stripeWebhookLog.findMany({
      where: { status: "FAILED", createdAt: { gte: since30d } },
      orderBy: { createdAt: "desc" },
      take: RECENT_FAILURES_LIMIT,
      select: { id: true, stripeEventId: true, type: true, errorMessage: true, attempts: true, createdAt: true },
    }),
    db.auditLog.groupBy({
      by: ["action"],
      where: { action: { in: BILLING_ACTIONS }, createdAt: { gte: since30d } },
      _count: { action: true },
    }),
    db.user.count({ where: { plan: "PRO", subscriptionStatus: "ACTIVE" } }),
  ])

  const billingCount = (actions: AuditAction[]) =>
    billing.filter((b) => actions.includes(b.action)).reduce((sum, b) => sum + b._count.action, 0)

  return {
    generatedAt: new Date(now).toISOString(),
    webhooks: {
      "24h": windowStats(g24),
      "7d": windowStats(g7),
      "30d": windowStats(g30),
    },
    topTypes: topTypes.map((t) => ({ type: t.type, count: t._count.type })),
    recentFailures: failures.map((f) => ({
      id: f.id,
      stripeEventId: f.stripeEventId,
      type: f.type,
      errorMessage: f.errorMessage,
      attempts: f.attempts,
      createdAt: f.createdAt.toISOString(),
    })),
    billing30d: {
      disputes: billingCount(DISPUTE_ACTIONS),
      fraud: billingCount(["FRAUD_WARNING"]),
      refunds: billingCount(REFUND_ACTIONS),
      cancellations: billingCount(["CANCEL_SUBSCRIPTION"]),
    },
    subscriptions: { activePro: activePro, mrr: activePro * 15 },
  }
}

export interface WebhookFeedItem {
  id: string
  stripeEventId: string
  type: string
  status: WebhookStatus
  errorMessage: string | null
  latencyMs: number | null
  attempts: number
  objectId: string | null
  userId: string | null
  createdAt: string
}

export interface WebhookFeedParams {
  status?: WebhookStatus
  type?: string
  cursor?: string
  limit?: number
}

export async function getWebhookFeed(params: WebhookFeedParams = {}): Promise<{ items: WebhookFeedItem[]; nextCursor: string | null }> {
  const take = Math.min(params.limit ?? FEED_LIMIT, 100)
  const where: Prisma.StripeWebhookLogWhereInput = {}
  if (params.status) where.status = params.status
  if (params.type) where.type = params.type

  const rows = await db.stripeWebhookLog.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  })

  const hasMore = rows.length > take
  const page = hasMore ? rows.slice(0, take) : rows
  return {
    items: page.map((r) => ({
      id: r.id,
      stripeEventId: r.stripeEventId,
      type: r.type,
      status: r.status,
      errorMessage: r.errorMessage,
      latencyMs: r.latencyMs,
      attempts: r.attempts,
      objectId: r.objectId,
      userId: r.userId,
      createdAt: r.createdAt.toISOString(),
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  }
}

export interface BillingTimelineItem {
  id: string
  action: AuditAction
  userId: string
  userEmail: string | null
  metadata: Prisma.JsonValue
  createdAt: string
}

export async function getBillingTimeline(params: { cursor?: string; limit?: number } = {}): Promise<{ items: BillingTimelineItem[]; nextCursor: string | null }> {
  const take = Math.min(params.limit ?? FEED_LIMIT, 100)

  const rows = await db.auditLog.findMany({
    where: { action: { in: BILLING_ACTIONS } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      action: true,
      userId: true,
      metadata: true,
      createdAt: true,
      user: { select: { email: true } },
    },
  })

  const hasMore = rows.length > take
  const page = hasMore ? rows.slice(0, take) : rows
  return {
    items: page.map((r) => ({
      id: r.id,
      action: r.action,
      userId: r.userId,
      userEmail: r.user?.email ?? null,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString(),
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  }
}
