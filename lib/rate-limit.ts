import { db } from "@/lib/db"
import { getLimits, type AiEndpointName } from "@/lib/plans"

/** Sentinel resetAt for lifetime (non-rolling) AI quota rows used by UNSUBSCRIBED. */
const LIFETIME_RESET_AT = new Date("2099-01-01T00:00:00.000Z")

export type AIQuotaCheck =
  | { allowed: true }
  | { allowed: false; reason: "blocked" }       // endpoint disabled for the plan (limit = 0)
  | { allowed: false; reason: "exhausted"; used: number; limit: number }

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000      // 1 hour (default for AI endpoints)
export const PDF_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000  // 24 hours for PDF exports
const CACHE_TTL_MS         = 60 * 1000            // 1 min — safe: limit=20/hr, cache can be 1 min stale

interface CacheEntry {
  count:   number
  resetAt: number  // ms timestamp
  cachedAt: number
}

const rateLimitCache = new Map<string, CacheEntry>()

export function clearRateLimitCache() {
  rateLimitCache.clear()
}

function cacheKey(userId: string, endpoint: string) {
  return `${userId}:${endpoint}`
}

/**
 * Checks current failure count WITHOUT incrementing.
 * Returns true if under limit, false if blocked.
 * Uses in-memory cache (1 min TTL) to avoid a DB round-trip on every AI request.
 */
export async function checkRateLimit(userId: string, endpoint: string, limit = 20): Promise<boolean> {
  const key  = cacheKey(userId, endpoint)
  const now  = Date.now()
  const hit  = rateLimitCache.get(key)

  if (hit && now - hit.cachedAt < CACHE_TTL_MS) {
    if (hit.resetAt < now) return true       // window expired in cache — allow
    return hit.count < limit
  }

  const row = await db.aIRateLimit.findUnique({
    where:  { userId_endpoint: { userId, endpoint } },
    select: { count: true, resetAt: true },
  })

  if (!row) return true

  const resetAtMs = row.resetAt.getTime()
  rateLimitCache.set(key, { count: row.count, resetAt: resetAtMs, cachedAt: now })

  if (resetAtMs < now) return true
  return row.count < limit
}

/**
 * Atomically increments the counter and returns whether the request is allowed.
 * Replaces the check-then-act pattern (checkRateLimit + recordRateLimitUsage) with a
 * single DB round-trip, eliminating the race condition where two concurrent requests
 * both pass the check at count = limit - 1.
 */
export async function checkAndIncrementRateLimit(userId: string, endpoint: string, limit = 20, windowMs = RATE_LIMIT_WINDOW_MS): Promise<boolean> {
  const resetAt = new Date(Date.now() + windowMs)
  const now = new Date()
  const rows = await db.$queryRaw<Array<{ count: number; resetAt: Date }>>`
    INSERT INTO "AIRateLimit" ("id", "userId", "endpoint", "count", "resetAt", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, ${userId}, ${endpoint}, 1, ${resetAt}, ${now}, ${now})
    ON CONFLICT ("userId", "endpoint") DO UPDATE
    SET
      "count"     = CASE WHEN "AIRateLimit"."resetAt" < NOW() THEN 1 ELSE "AIRateLimit"."count" + 1 END,
      "resetAt"   = CASE WHEN "AIRateLimit"."resetAt" < NOW() THEN ${resetAt} ELSE "AIRateLimit"."resetAt" END,
      "updatedAt" = ${now}
    RETURNING count, "resetAt"
  `
  const row = rows[0]
  if (!row) return true
  rateLimitCache.delete(cacheKey(userId, endpoint))
  return row.count <= limit
}

/**
 * Increments the usage counter for this key+endpoint.
 * Also updates the in-memory cache so the next checkRateLimit call reflects the increment.
 */
export async function recordRateLimitUsage(userId: string, endpoint: string): Promise<void> {
  return recordUsage(userId, endpoint)
}

/**
 * @deprecated Use recordRateLimitUsage instead.
 */
export async function recordRateLimitFailure(userId: string, endpoint: string): Promise<void> {
  return recordUsage(userId, endpoint)
}

/**
 * AI quota check by plan. Plan-aware, lifetime-counted (no rolling window).
 * Atomic via a single UPDATE…WHERE count < limit; falls back to INSERT on first use.
 *
 *  - limit = -1  → unlimited (PRO). Always allowed, no DB write.
 *  - limit =  0  → endpoint blocked for the plan. Returns { allowed:false, reason:"blocked" }.
 *  - limit >  0  → lifetime counter in AIRateLimit (sentinel resetAt = 2099). When the row
 *                  hits the limit, returns { allowed:false, reason:"exhausted", used, limit }.
 *
 * Race-safe: the UPDATE … WHERE count < limit guarantees at most `limit` successful increments
 * even under concurrent requests for the same (userId, endpoint).
 */
export async function checkAndIncrementAIQuota(
  userId: string,
  endpoint: AiEndpointName,
  plan: string,
): Promise<AIQuotaCheck> {
  const limits = getLimits(plan)
  const endpointLimit = limits.aiLimitsByEndpoint[endpoint]

  if (endpointLimit === -1) return { allowed: true }
  if (endpointLimit === 0) return { allowed: false, reason: "blocked" }

  const now = new Date()
  const resetAt = LIFETIME_RESET_AT

  // Atomic upsert + conditional increment.
  //   ON CONFLICT: only increment when count < limit (race-safe ceiling).
  //   If the UPDATE clause's WHERE rejects the row, the conflict yields 0 rows and we read
  //   the current value with a follow-up SELECT.
  const rows = await db.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "AIRateLimit" ("id", "userId", "endpoint", "count", "resetAt", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, ${userId}, ${endpoint}, 1, ${resetAt}, ${now}, ${now})
    ON CONFLICT ("userId", "endpoint") DO UPDATE
    SET "count" = "AIRateLimit"."count" + 1,
        "updatedAt" = ${now}
    WHERE "AIRateLimit"."count" < ${endpointLimit}
    RETURNING count
  `

  if (rows.length > 0) {
    rateLimitCache.delete(cacheKey(userId, endpoint))
    return { allowed: true }
  }

  // No row returned → either nothing inserted (conflict) and the WHERE filtered out → exhausted.
  const current = await db.aIRateLimit.findUnique({
    where: { userId_endpoint: { userId, endpoint } },
    select: { count: true },
  })
  const used = current?.count ?? endpointLimit
  return { allowed: false, reason: "exhausted", used, limit: endpointLimit }
}

async function recordUsage(userId: string, endpoint: string): Promise<void> {
  const resetAt = new Date(Date.now() + RATE_LIMIT_WINDOW_MS)
  const now     = new Date()
  await db.$queryRaw`
    INSERT INTO "AIRateLimit" ("id", "userId", "endpoint", "count", "resetAt", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, ${userId}, ${endpoint}, 1, ${resetAt}, ${now}, ${now})
    ON CONFLICT ("userId", "endpoint") DO UPDATE
    SET
      "count"     = CASE WHEN "AIRateLimit"."resetAt" < NOW() THEN 1 ELSE "AIRateLimit"."count" + 1 END,
      "resetAt"   = CASE WHEN "AIRateLimit"."resetAt" < NOW() THEN ${resetAt} ELSE "AIRateLimit"."resetAt" END,
      "updatedAt" = ${now}
  `

  // Invalidate cache on increment — local count increment is racy under concurrent requests.
  // Next checkRateLimit will re-read DB and get the authoritative count.
  rateLimitCache.delete(cacheKey(userId, endpoint))
}
