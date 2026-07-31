import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { purgeUserCache } from "@/lib/auth"
import { createLogger } from "@/lib/logger"
import { recordCronRun } from "@/lib/services/cron/cronRunner"
import { PAST_DUE_DOWNGRADE_AFTER_DAYS } from "@/lib/plans"

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

    // Threshold past which a still-PAST_DUE subscription is force-downgraded: long
    // enough that Stripe's retries are certainly over. See PAST_DUE_DOWNGRADE_AFTER_DAYS.
    const pastDueCutoff = new Date(now.getTime() - PAST_DUE_DOWNGRADE_AFTER_DAYS * 24 * 60 * 60 * 1000)

    // Parallelize all queries — independent, no shared state
    const [canceled, activeStale, pastDueStuck, expiredLimited, expiredOneTime] = await Promise.all([
      // Users who canceled and whose period has now ended
      db.user.findMany({
        where: { plan: "PRO", subscriptionStatus: "CANCELED", subscriptionEndsAt: { lt: now }, isManaged: false },
        select: { id: true },
      }),
      // Webhook drift guard: PRO/ACTIVE users whose subscriptionEndsAt is in the past
      // PAST_DUE excluded HERE — see the separate, later cutoff below; do not downgrade mid-retry
      db.user.findMany({
        where: { plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionEndsAt: { lt: now }, isManaged: false },
        select: { id: true },
      }),
      // PAST_DUE stuck past the entire retry window. Without this they are stranded:
      // access already cut by isActive at the grace boundary, but blocksNewPurchase still
      // refuses a fresh checkout, and no Stripe event arrives when dunning is set to
      // "mark unpaid" / "leave past due". This is the backstop that frees them.
      db.user.findMany({
        where: { plan: "PRO", subscriptionStatus: "PAST_DUE", subscriptionEndsAt: { lt: pastDueCutoff }, isManaged: false },
        select: { id: true },
      }),
      // LIMITED users whose admin-set expiry has passed — downgraded to UNSUBSCRIBED
      // (data kept). plan flips to UNSUBSCRIBED after processing, so they never re-match.
      db.user.findMany({
        where: { plan: "LIMITED", managedExpiresAt: { lt: now } },
        select: { id: true },
      }),
      // One-time plans (BASIC/SPRINT) whose purchased window has ended
      db.user.findMany({
        where: { plan: { in: ["BASIC", "SPRINT"] }, subscriptionEndsAt: { lt: now }, isManaged: false },
        select: { id: true },
      }),
    ])

    const ids = [...new Set([...canceled, ...activeStale, ...pastDueStuck, ...expiredOneTime].map((u) => u.id))]
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
            data: {
              // An expired managed (LIMITED) account becomes a normal free user —
              // consistent with how PRO/BASIC/SPRINT expire. Their resumes and cover
              // letters are UNTOUCHED; only the managed relationship + access are
              // cleared. The admin re-provisions if they want it managed again.
              // managedCreatedBy / managedNote are kept as an audit trail.
              plan: "UNSUBSCRIBED",
              isManaged: false,
              managedBlocked: false,
              managedExpiresAt: null,
              managedResumeLimit: null,
              managedCoverLetterLimit: null,
              managedDownloadLimit: null,
              managedDownloadsUsed: 0,
              subscriptionStatus: "EXPIRED",
              sessionVersion: { increment: 1 },
            },
          })
        : Promise.resolve(),
    ])

    for (const id of ids) purgeUserCache(id)
    for (const id of limitedIds) purgeUserCache(id)

    return {
      downgraded: ids.length,
      canceledCount: canceled.length,
      stalePROCount: activeStale.length,
      pastDueStuckCount: pastDueStuck.length,
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
