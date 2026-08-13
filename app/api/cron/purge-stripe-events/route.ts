import { timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { cronService } from "@/lib/controllers/cron-deps"
import { handleError , apiError } from "@/lib/controllers/shared"
import { db } from "@/lib/db"
import { createLogger } from "@/lib/logger"
import { recordCronRun } from "@/lib/services/cron/cronRunner"

const logger = createLogger("cron.purge-stripe-events")

// Postgres advisory lock key — arbitrary stable int32 unique to this cron
const ADVISORY_LOCK_KEY = 727302

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return apiError(401, "Unauthorized", { req })
  const auth = req.headers.get("authorization") ?? ""
  const expected = Buffer.from(`Bearer ${cronSecret}`)
  const actual = Buffer.from(auth)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return apiError(401, "Unauthorized", { req })
  }

  // Multi-instance safe: pg_try_advisory_lock returns false if another instance holds it.
  const [{ locked }] = await db.$queryRaw<[{ locked: boolean }]>`SELECT pg_try_advisory_lock(${ADVISORY_LOCK_KEY}) AS locked`
  if (!locked) {
    return NextResponse.json({ skipped: true, reason: "lock_held" })
  }

  try {
    const result = await recordCronRun("purge-stripe-events", async () => {
      const events = await cronService.purgeStripeEvents()
      const webhookLogs = await cronService.purgeStripeWebhookLogs()
      // PayPal dedup rows + observability log share this job's schedule — no separate cron needed.
      const paypalEvents = await cronService.purgePaypalEvents()
      const paypalWebhookLogs = await cronService.purgePaypalWebhookLogs()
      // The AI answer caches ride the same nightly job rather than earning a cron
      // of their own — one more Dokploy schedule is one more thing to die quietly.
      const aiCaches = await cronService.purgeAiCaches()
      return {
        deleted: events.deleted,
        webhookLogsDeleted: webhookLogs.deleted,
        paypalEventsDeleted: paypalEvents.deleted,
        paypalWebhookLogsDeleted: paypalWebhookLogs.deleted,
        aiCachesDeleted: aiCaches.deleted,
      }
    })
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req })
  } finally {
    try {
      await db.$queryRaw`SELECT pg_advisory_unlock(${ADVISORY_LOCK_KEY})`
    } catch (e) {
      logger.error("cron.purge_stripe_events.unlock_failed", { error: e instanceof Error ? e.message : String(e) })
    }
  }
}
