import { db } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const logger = createLogger("cron.runner")

/** Canonical job keys — must match the route paths under app/api/cron/. */
export const CRON_JOBS = [
  "expire-subscriptions",
  "renewal-reminder",
  "data-cleanup",
  "purge-stripe-events",
] as const

export type CronJob = (typeof CRON_JOBS)[number]

const RETENTION_MS = 90 * 24 * 60 * 60 * 1000

/**
 * Wrap a cron's real work so every authenticated run is logged (success or failure).
 * Logging never breaks the job — a failed write is swallowed and logged.
 *
 * Do NOT wrap skipped runs (advisory lock held, email not configured before work):
 * they performed no work, so they should not count as a run.
 */
export async function recordCronRun<T>(job: CronJob, work: () => Promise<T>): Promise<T> {
  const start = Date.now()
  try {
    const result = await work()
    await persist(job, "SUCCESS", (result ?? null) as object | null, Date.now() - start)
    return result
  } catch (err) {
    await persist(job, "FAILURE", { error: err instanceof Error ? err.message : String(err) }, Date.now() - start)
    throw err
  }
}

async function persist(job: CronJob, status: "SUCCESS" | "FAILURE", result: object | null, durationMs: number) {
  try {
    await db.cronRun.create({ data: { job, status, result: result ?? undefined, durationMs } })
    // Keep the table bounded — drop this job's rows older than the retention window.
    await db.cronRun.deleteMany({ where: { job, createdAt: { lt: new Date(Date.now() - RETENTION_MS) } } })
  } catch (e) {
    logger.error("cron.runner.persist_failed", { job, error: e instanceof Error ? e.message : String(e) })
  }
}
