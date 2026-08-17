export interface IRateLimitService {
  /**
   * READ-ONLY. Answers "is this key under the limit right now" and writes NOTHING.
   *
   * A `check` on its own therefore never converges: unless some later call records
   * usage, the counter stays where it was and the limit is decorative. That is exactly
   * how registration, password-reset and session-challenge ended up able to send
   * unlimited emails — each recorded usage only on its failure branch, so the branch
   * that actually sent the mail left the counter untouched.
   *
   * Use it only where a SEPARATE counter is the real guard (a per-row attempts column).
   * For anything that spends money or sends mail, use `consume`.
   */
  check(key: string, endpoint: string, limit?: number): Promise<boolean>
  /**
   * Atomically counts this attempt and answers whether it is allowed. One DB
   * statement, so concurrent requests cannot both slip through on the same slot.
   */
  consume(key: string, endpoint: string, limit: number): Promise<boolean>
}
