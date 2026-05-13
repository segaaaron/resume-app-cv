import { db } from "@/lib/db"

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

/**
 * Checks current failure count WITHOUT incrementing.
 * Returns true if under limit, false if blocked.
 * Use at the start of a request to block already-penalized keys.
 */
export async function checkRateLimit(userId: string, endpoint: string, limit = 20): Promise<boolean> {
  const row = await db.aIRateLimit.findUnique({
    where: { userId_endpoint: { userId, endpoint } },
    select: { count: true, resetAt: true },
  })
  if (!row) return true
  if (row.resetAt < new Date()) return true
  return row.count < limit
}

/**
 * Increments the failure counter for this key+endpoint.
 * Call ONLY when a request fails — successful requests never count.
 */
export async function recordRateLimitFailure(userId: string, endpoint: string): Promise<void> {
  const resetAt = new Date(Date.now() + RATE_LIMIT_WINDOW_MS)
  const now = new Date()
  await db.$queryRaw`
    INSERT INTO "AIRateLimit" ("id", "userId", "endpoint", "count", "resetAt", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, ${userId}, ${endpoint}, 1, ${resetAt}, ${now}, ${now})
    ON CONFLICT ("userId", "endpoint") DO UPDATE
    SET
      "count"     = CASE WHEN "AIRateLimit"."resetAt" < NOW() THEN 1 ELSE "AIRateLimit"."count" + 1 END,
      "resetAt"   = CASE WHEN "AIRateLimit"."resetAt" < NOW() THEN ${resetAt} ELSE "AIRateLimit"."resetAt" END,
      "updatedAt" = ${now}
  `
}
