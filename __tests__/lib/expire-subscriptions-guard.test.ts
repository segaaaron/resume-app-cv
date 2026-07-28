/**
 * The expiry cron is the backstop that frees a subscriber stranded in PAST_DUE.
 *
 * A failed renewal moves a row to PAST_DUE. `isActive` cuts access at
 * PAST_DUE_GRACE_DAYS, but `blocksNewPurchase(PAST_DUE)` still refuses a fresh checkout.
 * If Stripe's dunning is set to "mark unpaid" / "leave past due", NO webhook ever
 * arrives to clean the row — so the user has no access AND cannot buy again. The cron
 * used to exclude PAST_DUE entirely, leaving them there forever. It now downgrades them
 * once the retry window is certainly over.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import { PAST_DUE_GRACE_DAYS, PAST_DUE_DOWNGRADE_AFTER_DAYS, blocksNewPurchase, isActive } from "@/lib/plans"

const cron = readFileSync(join(process.cwd(), "app/api/cron/expire-subscriptions/route.ts"), "utf8")

describe("PAST_DUE cannot become a permanent trap", () => {
  it("the row is only cleaned AFTER access was already cut, never before", () => {
    // Clean-up must wait past the whole retry window; access is cut much earlier. If this
    // inverted, we'd free the row while Stripe could still recover the payment.
    expect(PAST_DUE_DOWNGRADE_AFTER_DAYS).toBeGreaterThan(PAST_DUE_GRACE_DAYS)
    // And it must clear Stripe's documented retry window (~14 days) with margin.
    expect(PAST_DUE_DOWNGRADE_AFTER_DAYS).toBeGreaterThanOrEqual(14)
  })

  it("the trap really exists without the backstop — access gone, purchase blocked", () => {
    const longAgo = new Date(Date.now() - (PAST_DUE_DOWNGRADE_AFTER_DAYS + 5) * 86_400_000)
    // No access:
    expect(isActive("PRO", longAgo, "PAST_DUE", "USER")).toBe(false)
    // Yet still blocked from buying anything — this is what strands them:
    expect(blocksNewPurchase("PAST_DUE", false)).toBe(true)
    expect(blocksNewPurchase("PAST_DUE", true)).toBe(true)
  })

  it("the cron downgrades stuck PAST_DUE rows past the cutoff", () => {
    // Queries PAST_DUE with a cutoff derived from the constant, and folds the result into
    // the downgrade set.
    expect(cron).toContain("PAST_DUE_DOWNGRADE_AFTER_DAYS")
    expect(cron).toMatch(/subscriptionStatus:\s*"PAST_DUE",\s*subscriptionEndsAt:\s*\{\s*lt:\s*pastDueCutoff\s*\}/)
    expect(cron).toMatch(/\.\.\.pastDueStuck/)
  })

  it("mid-retry PAST_DUE is NOT downgraded (cutoff, not now)", () => {
    // The query uses pastDueCutoff, not `now` — a payment failing yesterday must keep
    // retrying, not be force-cancelled.
    expect(cron).not.toMatch(/subscriptionStatus:\s*"PAST_DUE",\s*subscriptionEndsAt:\s*\{\s*lt:\s*now\s*\}/)
  })
})
