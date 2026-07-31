/**
 * Single source of truth for the prices shown to visitors.
 *
 * Why this exists: the annual price was lowered to $99 but four literals kept
 * saying $144 — the big number on the pricing toggle plus three JSON-LD offers.
 * The card contradicted itself on screen ("$144/yr" above "$8.25/month · save
 * $81"), and Google was told the annual plan cost $144 while Stripe charged $99.
 * Same failure mode as the "164 templates vs 143" drift.
 *
 * These are DISPLAY values. What a customer is actually charged comes from the
 * Stripe Price IDs in env (STRIPE_PRICE_ID_*) — changing a number here does NOT
 * change what Stripe bills. Update Stripe first, then these, and keep both in
 * step; `__tests__/lib/pricing-copy.test.ts` guards the localized copy.
 */
export const PRICING = {
  /** PRO subscription, billed monthly (USD). */
  proMonthly: 15,
  /** PRO subscription, billed once a year (USD). */
  proAnnual: 99,
  /** One-time, 1 month of access (USD). */
  basic: 2.99,
  /** One-time, 7 days of access (USD). */
  sprint: 7.99,
} as const

/** What the annual plan works out to per month — the "$8.25/month" line. */
export const PRO_ANNUAL_PER_MONTH = Math.round((PRICING.proAnnual / 12) * 100) / 100

/** Dollars saved over a year vs paying monthly — the "save $81" line. */
export const PRO_ANNUAL_SAVINGS = PRICING.proMonthly * 12 - PRICING.proAnnual

/** Discount vs paying monthly, as a whole percent — the "Save 45%" badge. */
export const PRO_ANNUAL_DISCOUNT_PCT = Math.round(
  (1 - PRICING.proAnnual / (PRICING.proMonthly * 12)) * 100,
)

/** JSON-LD `price` wants a decimal string ("99.00"), not a number. */
export function priceForSchema(value: number): string {
  return value.toFixed(2)
}
