import { checkRateLimit, checkAndIncrementRateLimit } from "@/lib/rate-limit"
import type { IRateLimitService } from "@/lib/interfaces/IRateLimitService"

export class RateLimitService implements IRateLimitService {
  async check(key: string, endpoint: string, limit = 20): Promise<boolean> {
    return checkRateLimit(key, endpoint, limit)
  }

  /** Atomic INSERT … ON CONFLICT DO UPDATE — counts and decides in one statement. */
  async consume(key: string, endpoint: string, limit: number): Promise<boolean> {
    return checkAndIncrementRateLimit(key, endpoint, limit)
  }
}
