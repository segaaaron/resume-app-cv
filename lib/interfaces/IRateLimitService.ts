export interface IRateLimitService {
  check(key: string, endpoint: string, limit?: number): Promise<boolean>
  recordFailure(key: string, endpoint: string): Promise<void>
}
