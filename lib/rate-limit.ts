import { db } from "@/lib/db"

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

// Rate limit per userId+endpoint stored in DB. Returns true if allowed.
// Uses a single atomic raw SQL upsert to avoid TOCTOU race at window reset boundary.
export async function checkRateLimit(userId: string, endpoint: string, limit = 20): Promise<boolean> {
  const resetAt = new Date(Date.now() + RATE_LIMIT_WINDOW_MS)

  const result = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "AIRateLimit" ("id", "userId", "endpoint", "count", "resetAt")
    VALUES (gen_random_uuid()::text, ${userId}, ${endpoint}, 1, ${resetAt})
    ON CONFLICT ("userId", "endpoint") DO UPDATE
    SET
      "count"   = CASE WHEN "AIRateLimit"."resetAt" < NOW() THEN 1 ELSE "AIRateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "AIRateLimit"."resetAt" < NOW() THEN ${resetAt} ELSE "AIRateLimit"."resetAt" END
    RETURNING "count"
  `

  return result[0].count <= limit
}
