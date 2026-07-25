/**
 * The annual price was lowered to $99 but four literals kept saying $144: the
 * big number on the pricing toggle and three JSON-LD offers. The card
 * contradicted itself on screen ($144/yr sitting above "$8.25/month · save
 * $81") and Google was told $144 for a plan Stripe charged $99 for.
 *
 * Code claims now derive from lib/pricing.ts. Localized strings in messages/*.json
 * can't import a constant, so this test is their guard: the derived figures in
 * the copy must agree with the price. Change the price without updating the copy
 * and CI fails until they match.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import {
  PRICING,
  PRO_ANNUAL_PER_MONTH,
  PRO_ANNUAL_SAVINGS,
  PRO_ANNUAL_DISCOUNT_PCT,
  priceForSchema,
} from "@/lib/pricing"
import en from "@/messages/en.json"
import es from "@/messages/es.json"

const locales = { en, es } as const

describe("pricing copy stays in sync with lib/pricing.ts", () => {
  it("derived annual figures are internally consistent", () => {
    // 12 monthly payments minus the annual price IS the advertised saving.
    expect(PRICING.proMonthly * 12 - PRICING.proAnnual).toBe(PRO_ANNUAL_SAVINGS)
    // The per-month equivalent must multiply back to the annual price (± rounding).
    expect(PRO_ANNUAL_PER_MONTH * 12).toBeCloseTo(PRICING.proAnnual, 1)
    expect(PRO_ANNUAL_DISCOUNT_PCT).toBeGreaterThan(0)
    expect(PRO_ANNUAL_DISCOUNT_PCT).toBeLessThan(100)
  })

  it.each(Object.entries(locales))(
    "%s annual_equiv quotes the real per-month price and saving",
    (_loc, messages) => {
      const equiv = (messages as { pricing: Record<string, string> }).pricing.annual_equiv
      // e.g. "$8.25 / month · save $81 per year"
      expect(equiv).toContain(String(PRO_ANNUAL_PER_MONTH))
      expect(equiv).toContain(String(PRO_ANNUAL_SAVINGS))
    },
  )

  it.each(Object.entries(locales))("%s annual_badge quotes the real discount", (_loc, messages) => {
    const badge = (messages as { pricing: Record<string, string> }).pricing.annual_badge
    expect(badge).toContain(String(PRO_ANNUAL_DISCOUNT_PCT))
  })

  it("no stale hardcoded price literals survive in pricing/home surfaces", () => {
    const files = [
      "components/marketing/PricingClientSection.tsx",
      "app/[locale]/pricing/page.tsx",
      "app/[locale]/page.tsx",
    ]
    // Any bare "144" (the old annual price) means a literal was missed. Prices
    // in these files must come from PRICING, never be typed in by hand.
    for (const f of files) {
      const src = readFileSync(join(process.cwd(), f), "utf8")
      expect(src, `${f} still hardcodes the old annual price`).not.toMatch(/\b144(\.00)?\b/)
    }
  })

  it("priceForSchema emits the decimal string JSON-LD expects", () => {
    expect(priceForSchema(PRICING.proAnnual)).toBe("99.00")
    expect(priceForSchema(PRICING.proMonthly)).toBe("15.00")
  })
})
