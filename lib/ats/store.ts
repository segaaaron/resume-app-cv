/**
 * In-memory IP rate limit for the ATS Checker public endpoint.
 * 3 checks / hour / IP (process-local; resets on deploy — acceptable for MVP).
 * Not durable nor shared across instances; intentional for the MVP.
 */

const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT = 3

type RateEntry = { count: number; resetAt: number }
const rateMap = new Map<string, RateEntry>()

export function checkAtsRateLimit(ipHash: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateMap.get(ipHash)
  if (!entry || entry.resetAt < now) {
    const fresh = { count: 1, resetAt: now + RATE_WINDOW_MS }
    rateMap.set(ipHash, fresh)
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt: fresh.resetAt }
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count += 1
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetAt: entry.resetAt }
}
