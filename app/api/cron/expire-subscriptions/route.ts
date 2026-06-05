import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { purgeUserCache } from "@/lib/auth"

// Module-level guard: prevents overlapping executions on single-instance deploys (Dokploy).
// The flag resets automatically in the finally block, even if the handler throws.
let cronRunning = false

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const expected = Buffer.from(`Bearer ${cronSecret}`)
  const received = Buffer.from(authHeader ?? "")
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (cronRunning) {
    console.warn("[cron/expire-subscriptions] already running — skipping overlapping execution")
    return NextResponse.json({ ok: true, skipped: true })
  }
  cronRunning = true

  try {
    const now = new Date()

    // Parallelize all queries — independent, no shared state
    const [canceled, activeStale, expiredLimited] = await Promise.all([
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
    ])

    const ids = [...new Set([...canceled, ...activeStale].map((u) => u.id))]
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

    return NextResponse.json({
      downgraded: ids.length,
      canceledCount: canceled.length,
      stalePROCount: activeStale.length,
      expiredLimited: limitedIds.length,
    })
  } finally {
    cronRunning = false
  }
}
