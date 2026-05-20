import { db } from "@/lib/db"

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const CACHE_TTL_MS         = 60 * 1000       // 1 min — safe: limit=20/hr, cache can be 1 min stale

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
export async function checkAndIncrementRateLimit(userId: string, endpoint: string, limit = 20): Promise<boolean> {
  const resetAt = new Date(Date.now() + RATE_LIMIT_WINDOW_MS)
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
