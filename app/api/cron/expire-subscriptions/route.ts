import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { purgeUserCache } from "@/lib/auth"
import { createLogger } from "@/lib/logger"
import { recordCronRun } from "@/lib/services/cron/cronRunner"

const logger = createLogger("cron.expire-subscriptions")

// Postgres advisory lock key — arbitrary stable int32 unique to this cron
const ADVISORY_LOCK_KEY = 727301

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const expected = Buffer.from(`Bearer ${cronSecret}`)
  const received = Buffer.from(authHeader ?? "")
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Multi-instance safe: pg_try_advisory_lock returns false if another instance holds it.
  const [{ locked }] = await db.$queryRaw<[{ locked: boolean }]>`SELECT pg_try_advisory_lock(${ADVISORY_LOCK_KEY}) AS locked`
  if (!locked) {
    return NextResponse.json({ skipped: true, reason: "lock_held" })
  }

  try {
    const summary = await recordCronRun("expire-subscriptions", async () => {
    const now = new Date()

    // Parallelize all queries — independent, no shared state
    const [canceled, activeStale, expiredLimited, expiredOneTime] = await Promise.all([
      // Users who canceled and whose period has now ended
      db.user.findMany({
        where: { plan: "PRO", subscriptionStatus: "CANCELED", subscriptionEndsAt: { lt: now }, isManaged: false },
        select: { id: true },
      }),
      // Webhook drift guard: PRO/ACTIVE users whose subscriptionEndsAt is in the past
      // PAST_DUE excluded — Stripe smart-retry can run up to ~3 weeks; do not downgrade mid-retry
      db.user.findMany({
        where: { plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionEndsAt: { lt: now }, isManaged: false },
        select: { id: true },
      }),
      // LIMITED users whose admin-set expiry has passed and not yet processed — invalidate JWT
      db.user.findMany({
        where: { plan: "LIMITED", managedExpiresAt: { lt: now }, managedBlocked: false },
        select: { id: true },
      }),
      // One-time plans (BASIC/SPRINT) whose purchased window has ended
      db.user.findMany({
        where: { plan: { in: ["BASIC", "SPRINT"] }, subscriptionEndsAt: { lt: now }, isManaged: false },
        select: { id: true },
      }),
    ])

    const ids = [...new Set([...canceled, ...activeStale, ...expiredOneTime].map((u) => u.id))]
    const limitedIds = expiredLimited.map((u) => u.id)

    await Promise.all([
      ids.length > 0
        ? db.user.updateMany({
            where: { id: { in: ids } },
            data: {
              plan: "UNSUBSCRIBED",
              subscriptionId: null,
              subscriptionEndsAt: null,
              subscriptionStatus: "EXPIRED",
              sessionVersion: { increment: 1 },
            },
          })
        : Promise.resolve(),
      limitedIds.length > 0
        ? db.user.updateMany({
            where: { id: { in: limitedIds } },
            data: { sessionVersion: { increment: 1 }, managedBlocked: true },
          })
        : Promise.resolve(),
    ])

    for (const id of ids) purgeUserCache(id)
    for (const id of limitedIds) purgeUserCache(id)

    return {
      downgraded: ids.length,
      canceledCount: canceled.length,
      stalePROCount: activeStale.length,
      expiredLimited: limitedIds.length,
    }
    })
    return NextResponse.json(summary)
  } finally {
    try {
      await db.$queryRaw`SELECT pg_advisory_unlock(${ADVISORY_LOCK_KEY})`
    } catch (e) {
      logger.error("cron.expire_subscriptions.unlock_failed", { error: e instanceof Error ? e.message : String(e) })
    }
  }
}
