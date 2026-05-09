import { db } from "@/lib/db"

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

// Rate limit per userId+endpoint stored in DB. Returns true if allowed.
export async function checkRateLimit(userId: string, endpoint: string, limit = 20): Promise<boolean> {
  const now = new Date()
  const resetAt = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS)

  const existing = await db.aIRateLimit.findUnique({
    where: { userId_endpoint: { userId, endpoint } },
    select: { count: true, resetAt: true },
  })

  if (!existing || existing.resetAt < now) {
    await db.aIRateLimit.upsert({
      where:  { userId_endpoint: { userId, endpoint } },
      create: { userId, endpoint, count: 1, resetAt },
      update: { count: 1, resetAt },
    })
    return true
  }

  const updated = await db.aIRateLimit.update({
    where: { userId_endpoint: { userId, endpoint } },
    data:  { count: { increment: 1 } },
    select: { count: true },
  })

  return updated.count <= limit
}
