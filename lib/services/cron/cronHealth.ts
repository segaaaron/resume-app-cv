import { db } from "@/lib/db"
import { CRON_JOBS, type CronJob } from "./cronRunner"

export type CronHealthState = "HEALTHY" | "STALE" | "FAILING" | "NEVER_RUN"

export interface CronJobMeta {
  job: CronJob
  /** Fallback label — the UI localizes by job key. */
  label: string
  scheduleCron: string
  scheduleHuman: string
  /** Max age of the last SUCCESS before the job is considered STALE (silently dead). */
  freshnessMs: number
}

const DAY = 24 * 60 * 60 * 1000

// Cadence mirrors the Dokploy schedules. freshness = interval + generous grace,
// so a single missed run doesn't false-alarm but a dead cron surfaces fast.
export const CRON_JOB_META: Record<CronJob, CronJobMeta> = {
  "expire-subscriptions": { job: "expire-subscriptions", label: "Expire Subscriptions", scheduleCron: "0 2 * * *", scheduleHuman: "Daily · 02:00 UTC", freshnessMs: 2 * DAY },
  "renewal-reminder":     { job: "renewal-reminder",     label: "Renewal Reminder",     scheduleCron: "0 9 * * *", scheduleHuman: "Daily · 09:00 UTC", freshnessMs: 2 * DAY },
  "data-cleanup":         { job: "data-cleanup",         label: "GDPR Data Cleanup",     scheduleCron: "0 2 * * *", scheduleHuman: "Daily · 02:00 UTC", freshnessMs: 2 * DAY },
  "purge-stripe-events":  { job: "purge-stripe-events",  label: "Purge Stripe Events",   scheduleCron: "0 3 * * 0", scheduleHuman: "Weekly · Sun 03:00 UTC", freshnessMs: 9 * DAY },
}

export interface CronHealth {
  job: CronJob
  meta: CronJobMeta
  state: CronHealthState
  lastRunAt: string | null
  lastStatus: "SUCCESS" | "FAILURE" | null
  lastSuccessAt: string | null
  lastDurationMs: number | null
  lastError: string | null
  /** Failures in the last 7 days. */
  recentFailures: number
}

function extractError(result: unknown): string | null {
  if (result && typeof result === "object" && "error" in result) {
    return String((result as { error: unknown }).error)
  }
  return null
}

/** Per-job health for the admin panel. Read-only; safe to call on every render. */
export async function getCronHealth(): Promise<CronHealth[]> {
  const now = Date.now()
  const sevenDaysAgo = new Date(now - 7 * DAY)

  return Promise.all(
    CRON_JOBS.map(async (job): Promise<CronHealth> => {
      const meta = CRON_JOB_META[job]
      const [lastRun, lastSuccess, recentFailures] = await Promise.all([
        db.cronRun.findFirst({ where: { job }, orderBy: { createdAt: "desc" } }),
        db.cronRun.findFirst({ where: { job, status: "SUCCESS" }, orderBy: { createdAt: "desc" } }),
        db.cronRun.count({ where: { job, status: "FAILURE", createdAt: { gte: sevenDaysAgo } } }),
      ])

      let state: CronHealthState
      if (!lastRun) state = "NEVER_RUN"
      else if (lastRun.status === "FAILURE") state = "FAILING"
      else if (!lastSuccess || now - lastSuccess.createdAt.getTime() > meta.freshnessMs) state = "STALE"
      else state = "HEALTHY"

      return {
        job,
        meta,
        state,
        lastRunAt: lastRun?.createdAt.toISOString() ?? null,
        lastStatus: lastRun?.status ?? null,
        lastSuccessAt: lastSuccess?.createdAt.toISOString() ?? null,
        lastDurationMs: lastRun?.durationMs ?? null,
        lastError: lastRun?.status === "FAILURE" ? extractError(lastRun.result) : null,
        recentFailures,
      }
    }),
  )
}
