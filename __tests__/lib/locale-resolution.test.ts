/**
 * Which language a visitor gets, and which language we write to them in.
 *
 * Every entry point outside `app/[locale]/` (home, login, register, privacy, terms)
 * resolved the language as `cookies().get("NEXT_LOCALE") ?? "es"`. Nothing in the
 * codebase ever WROTE that cookie — the switcher only pushed a new URL — and nothing
 * read `Accept-Language`. So the fallback was not a fallback: it was the only outcome.
 * Every visitor on earth landed on Spanish, including a first-time visitor from the US
 * whose browser only speaks English, and including someone who had picked English a
 * minute earlier and came back through the home page.
 *
 * The billing emails had the same root cause from the other side: they were written in
 * Spanish with no way to know any better.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import { localeFromAcceptLanguage, resolveLocale, LOCALE_COOKIE } from "@/lib/locale"
import { paymentFailedHtml, paymentFailedText, paymentFailedSubject } from "@/lib/emails/paymentFailed"
import { subscriptionConfirmationHtml, subscriptionConfirmationSubject } from "@/lib/emails/subscriptionConfirmation"
import { PAST_DUE_GRACE_DAYS } from "@/lib/plans"
import { PRICING } from "@/lib/pricing"

const read = (f: string) => readFileSync(join(process.cwd(), f), "utf8")

describe("localeFromAcceptLanguage", () => {
  it("reads a plain US English browser", () => {
    expect(localeFromAcceptLanguage("en-US,en;q=0.9")).toBe("en")
  })

  it("matches on the primary subtag, so any English region works", () => {
    expect(localeFromAcceptLanguage("en-GB")).toBe("en")
    expect(localeFromAcceptLanguage("es-419,es;q=0.9")).toBe("es")
    expect(localeFromAcceptLanguage("es-MX")).toBe("es")
  })

  it("respects quality ordering rather than position", () => {
    // A browser listing French first but ranking English higher must get English.
    expect(localeFromAcceptLanguage("fr;q=0.5,en;q=0.9")).toBe("en")
    expect(localeFromAcceptLanguage("de,es;q=0.8,en;q=0.7")).toBe("es")
  })

  it("skips languages we do not speak", () => {
    expect(localeFromAcceptLanguage("de-DE,de;q=0.9")).toBeNull()
    expect(localeFromAcceptLanguage("q=bogus")).toBeNull()
    expect(localeFromAcceptLanguage("")).toBeNull()
    expect(localeFromAcceptLanguage(null)).toBeNull()
  })

  it("ignores a language offered with zero quality", () => {
    expect(localeFromAcceptLanguage("en;q=0")).toBeNull()
  })
})

describe("resolveLocale — an explicit choice always outranks the browser", () => {
  it("uses the cookie when the user has chosen", () => {
    // Someone on an English browser who picked Spanish stays in Spanish.
    expect(resolveLocale("es", "en-US,en;q=0.9")).toBe("es")
    expect(resolveLocale("en", "es-ES")).toBe("en")
  })

  it("falls back to the browser when there is no choice yet", () => {
    // THE BUG: this used to be Spanish for everyone, forever.
    expect(resolveLocale(null, "en-US,en;q=0.9")).toBe("en")
    expect(resolveLocale(undefined, "en-GB")).toBe("en")
  })

  it("falls back to the default when neither says anything useful", () => {
    expect(resolveLocale(null, "de-DE")).toBe("es")
    expect(resolveLocale(null, null)).toBe("es")
  })

  it("ignores a cookie holding an unsupported language", () => {
    expect(resolveLocale("fr", "en-US")).toBe("en")
    expect(resolveLocale("", "en-US")).toBe("en")
  })
})

describe("the entry points actually use it", () => {
  const ENTRIES = [
    "app/page.tsx",
    "app/privacy/page.tsx",
    "app/terms/page.tsx",
    "app/(auth)/login/page.tsx",
    "app/(auth)/register/page.tsx",
  ]

  it.each(ENTRIES)("%s resolves language from cookie AND browser", (file) => {
    const src = read(file)
    expect(src, "still falls straight back to the default language").not.toMatch(/\?\?\s*"es"/)
    expect(src).toContain("resolveLocale")
    expect(src).toContain("accept-language")
  })

  it.each(ENTRIES)("%s stays dynamic so one visitor's language is not cached for all", (file) => {
    // These redirect on a request header. Cached, the first visitor would decide the
    // language for everyone behind the same cache entry.
    expect(read(file)).toContain('export const dynamic = "force-dynamic"')
  })

  it("the switcher persists the choice", () => {
    // Without this the switch only changed the current URL, and the next visit through
    // any entry point reverted to the default language.
    const src = read("components/marketing/LocaleSwitcher.tsx")
    expect(src, "the choice is not persisted anywhere").toContain("setLocaleCookie")
    // The action writes the same cookie the entry points read, from the shared constant.
    const action = read("lib/actions/locale.ts")
    expect(action).toContain("LOCALE_COOKIE")
    expect(action).toContain('path: "/"')
    expect(LOCALE_COOKIE).toBe("NEXT_LOCALE")
  })
})

describe("billing emails speak the customer's language", () => {
  const base = { firstName: "Ana", userId: "u1", invoiceUrl: null }

  it("payment-failed renders in English when the customer bought in English", () => {
    const html = paymentFailedHtml({ ...base, locale: "en" })
    expect(html).toContain('lang="en"')
    expect(html).toContain("problem with your payment")
    expect(html).not.toContain("Problema con tu pago")
    expect(paymentFailedSubject("en")).toMatch(/Action required/)
    expect(paymentFailedText({ firstName: "Ana", locale: "en" })).toContain("We couldn't process")
  })

  it("payment-failed stays Spanish by default and for Spanish buyers", () => {
    for (const locale of ["es", null, undefined, "fr"]) {
      const html = paymentFailedHtml({ ...base, locale })
      expect(html).toContain('lang="es"')
      expect(html).toContain("Problema con tu pago")
    }
  })

  it("the deadline in the email matches the real grace window", () => {
    // The copy promised "3 days" while Stripe retried for up to 14 and access lasted
    // PAST_DUE_GRACE_DAYS — a deadline that was false in both directions.
    for (const locale of ["es", "en"]) {
      expect(paymentFailedHtml({ ...base, locale })).toContain(`${PAST_DUE_GRACE_DAYS}`)
    }
    expect(paymentFailedHtml({ ...base, locale: "es" })).not.toContain("3 días")
  })

  it("confirmation renders in the buyer's language", () => {
    const args = { userName: "Ana Pérez", userId: "u1", planInterval: "annual" as const, renewalDate: new Date("2027-01-15") }
    const en = subscriptionConfirmationHtml({ ...args, locale: "en" })
    expect(en).toContain('lang="en"')
    expect(en).toContain("Your subscription is active!")
    expect(en).toContain("Pro Annual")
    expect(subscriptionConfirmationSubject("en")).toMatch(/Your Pro subscription/)

    const es = subscriptionConfirmationHtml({ ...args, locale: "es" })
    expect(es).toContain("¡Tu suscripción está activa!")
    expect(es).toContain("Pro Anual")
  })

  it("the price quoted comes from the single source, not from the template", () => {
    // A confirmation email is a receipt. Typing the price in is how the pricing page
    // ended up advertising $144 for a plan Stripe charged $99 for.
    const args = { userName: "Ana", userId: "u1", renewalDate: new Date("2027-01-15") }
    expect(subscriptionConfirmationHtml({ ...args, planInterval: "annual", locale: "en" }))
      .toContain(`$${PRICING.proAnnual} USD`)
    expect(subscriptionConfirmationHtml({ ...args, planInterval: "monthly", locale: "es" }))
      .toContain(`$${PRICING.proMonthly} USD`)
  })

  it("every dashboard link carries a locale, in both languages", () => {
    // /dashboard/... with no locale is the 404 page.
    const args = { userName: "Ana", userId: "u1", planInterval: "monthly" as const, renewalDate: new Date() }
    for (const locale of ["es", "en"] as const) {
      for (const html of [
        subscriptionConfirmationHtml({ ...args, locale }),
        paymentFailedHtml({ ...base, locale }),
      ]) {
        const links = html.match(/https?:\/\/[^"']*\/dashboard\/[a-z]+/g) ?? []
        expect(links.length).toBeGreaterThan(0)
        for (const link of links) {
          expect(link, `${link} has no locale segment`).toMatch(new RegExp(`/${locale}/dashboard/`))
        }
      }
    }
  })

  it("the webhook passes the language through instead of hardcoding Spanish", () => {
    const src = read("lib/services/stripe/StripeWebhookService.ts")
    expect(src).not.toContain('subject: "¡Tu suscripción Pro está activa! 🎉"')
    expect(src).not.toContain('subject: "Acción requerida: problema con tu pago en READY CV"')
    expect(src).toContain("subscriptionConfirmationSubject(locale)")
    expect(src).toContain("paymentFailedSubject(locale)")
    // And the checkout must stamp it, or there is nothing to pass through.
    expect(read("lib/services/stripe/StripeCheckoutService.ts")).toMatch(/planInterval: plan, locale/)
  })
})
