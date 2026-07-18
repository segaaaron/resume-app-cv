import { checkRateLimit, recordRateLimitUsage } from "@/lib/rate-limit"
import type { IRateLimitService } from "@/lib/interfaces/IRateLimitService"

export class RateLimitService implements IRateLimitService {
  async check(key: string, endpoint: string, limit = 20): Promise<boolean> {
    return checkRateLimit(key, endpoint, limit)
  }

  async recordFailure(key: string, endpoint: string): Promise<void> {
    return recordRateLimitUsage(key, endpoint)
  }
}
