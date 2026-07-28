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
import { localeFromAcceptLanguage, resolveLocale, LOCALE_COOKIE, FALLBACK_LOCALE } from "@/lib/locale"
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

  it("falls back to ENGLISH for a language we do not speak", () => {
    // A browser in German, Chinese or Japanese asks for something we do not have.
    // English is the likelier of our two to be readable; sending them to Spanish picked
    // a language for a market they are not in.
    expect(resolveLocale(null, "de-DE")).toBe("en")
    expect(resolveLocale(null, "zh-CN,zh;q=0.9")).toBe("en")
    expect(resolveLocale(null, "ja")).toBe("en")
    expect(resolveLocale(null, null)).toBe("en")
    expect(FALLBACK_LOCALE).toBe("en")
  })

  it("but a browser that really asks for Spanish gets Spanish", () => {
    // Spain and Latin America must keep landing on Spanish — it is a language we speak,
    // so it wins on its own merits, not as a fallback.
    expect(resolveLocale(null, "es-ES,es;q=0.9")).toBe("es")
    expect(resolveLocale(null, "es-MX")).toBe("es")
    expect(resolveLocale(null, "es-419,es;q=0.9,en;q=0.8")).toBe("es")
    // Even ranked below an unsupported language, Spanish is the best we can offer.
    expect(resolveLocale(null, "zh-CN,es;q=0.5")).toBe("es")
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

describe("every email template speaks both languages", () => {
  // All eleven templates were hardcoded Spanish. The account-access ones are the worst
  // of it: a user who signed up in English got their verification code, their password
  // reset and their session challenges in a language they may not read.
  const SPANISH_MARKERS = /Hola |Tu cuenta|contraseña|código|suscripción|Usuario/

  it("the one-time-code emails render in English", async () => {
    const { registrationOtpHtml, registrationOtpSubject } = await import("@/lib/emails/registrationOtp")
    const { passwordResetHtml, passwordResetSubject } = await import("@/lib/emails/passwordReset")
    const { sessionChallengeHtml, sessionChallengeSubject } = await import("@/lib/emails/sessionChallenge")

    for (const [html, subject] of [
      [registrationOtpHtml({ userName: "Ana", code: "123456", locale: "en" }), registrationOtpSubject("en")],
      [passwordResetHtml({ userName: "Ana", code: "123456", locale: "en" }), passwordResetSubject("en")],
      [sessionChallengeHtml({ userName: "Ana", code: "123456", locale: "en" }), sessionChallengeSubject("en")],
    ] as const) {
      expect(html).toContain('lang="en"')
      expect(html).toContain("123456")
      expect(html).not.toMatch(SPANISH_MARKERS)
      expect(subject).not.toMatch(SPANISH_MARKERS)
    }
  })

  it("the one-time-code emails still render in Spanish by default", async () => {
    const { registrationOtpHtml } = await import("@/lib/emails/registrationOtp")
    expect(registrationOtpHtml({ userName: "Ana", code: "123456" })).toContain('lang="es"')
    expect(registrationOtpHtml({ userName: "Ana", code: "123456", locale: "es" })).toMatch(SPANISH_MARKERS)
  })

  it("the session-security emails render in English", async () => {
    const { sessionForcedHtml } = await import("@/lib/emails/sessionForced")
    const { sessionChallengeFailedHtml } = await import("@/lib/emails/sessionChallengeFailedAttempt")
    const { sessionChallengeBlockedHtml } = await import("@/lib/emails/sessionChallengeBlocked")

    const forced = sessionForcedHtml({ userName: "Ana", locale: "en" })
    expect(forced).toContain('lang="en"')
    expect(forced).toContain("Your session was signed out")

    const failed = sessionChallengeFailedHtml({ userName: "Ana", attemptsLeft: 2, locale: "en" })
    expect(failed).toContain("attempts left")

    const blocked = sessionChallengeBlockedHtml({ userName: "Ana", unblockedAt: new Date("2027-03-01T10:00:00Z"), locale: "en" })
    expect(blocked).toContain("Account temporarily blocked")
    // The date must be localised too — it used to be forced to es-ES for everyone.
    expect(blocked).toMatch(/March/)
  })

  it("singular and plural attempts read correctly in both languages", async () => {
    const { sessionChallengeFailedHtml } = await import("@/lib/emails/sessionChallengeFailedAttempt")
    expect(sessionChallengeFailedHtml({ userName: "A", attemptsLeft: 1, locale: "en" })).toContain("1</strong> attempt ")
    expect(sessionChallengeFailedHtml({ userName: "A", attemptsLeft: 2, locale: "en" })).toContain("attempts")
    expect(sessionChallengeFailedHtml({ userName: "A", attemptsLeft: 1, locale: "es" })).toContain("Te queda ")
    expect(sessionChallengeFailedHtml({ userName: "A", attemptsLeft: 3, locale: "es" })).toContain("Te quedan ")
  })

  it("the transactional emails render in English", async () => {
    const { managedWelcomeHtml, managedWelcomeSubjectFor } = await import("@/lib/emails/managedWelcome")
    const { renewalReminderHtml, renewalReminderSubject } = await import("@/lib/emails/renewalReminder")
    const { referralRewardHtml, referralRewardSubject } = await import("@/lib/emails/referralReward")

    const welcome = managedWelcomeHtml({ password: "abc", expiresAt: new Date("2027-05-02"), downloadLimit: 10, loginUrl: "https://x/login", locale: "en" })
    expect(welcome).toContain('lang="en"')
    expect(welcome).toContain("Temporary password")
    expect(managedWelcomeSubjectFor("en")).toBe("Your ReadyCV access is ready")

    const renewal = renewalReminderHtml({ userName: "Ana", userId: "u1", planInterval: "annual", renewalDate: new Date("2027-05-02"), locale: "en" })
    expect(renewal).toContain("Your plan renews in")
    expect(renewalReminderSubject("en")).toMatch(/renews in/)

    const referral = referralRewardHtml({ userName: "Ana", userId: "u1", tier: 2, tierLabel: "Silver", creditAmount: "$4.50", totalCredit: "$7.50", cycleCount: 2, isCycleComplete: false, locale: "en" })
    expect(referral).toContain("Pro referrals")
    expect(referralRewardSubject("en")).toBe("Referral reward — READY CV")
  })

  it("the renewal reminder quotes the price from the single source", async () => {
    // Same drift that put $144 on the pricing page for a plan Stripe charged $99 for.
    const { renewalReminderHtml } = await import("@/lib/emails/renewalReminder")
    expect(renewalReminderHtml({ userName: "A", userId: "u1", planInterval: "annual", renewalDate: new Date(), locale: "en" }))
      .toContain(`$${PRICING.proAnnual} USD`)
  })

  it("no template links to a locale-less dashboard path", async () => {
    const { renewalReminderHtml } = await import("@/lib/emails/renewalReminder")
    const { referralRewardHtml } = await import("@/lib/emails/referralReward")
    for (const locale of ["es", "en"] as const) {
      const pages = [
        renewalReminderHtml({ userName: "A", userId: "u1", planInterval: "monthly", renewalDate: new Date(), locale }),
        referralRewardHtml({ userName: "A", userId: "u1", tier: 1, tierLabel: "Bronze", creditAmount: "$1", totalCredit: "$1", cycleCount: 1, isCycleComplete: false, locale }),
      ]
      for (const html of pages) {
        for (const link of html.match(/https?:\/\/[^"']*\/dashboard\/[a-z]+/g) ?? []) {
          expect(link, `${link} has no locale segment`).toMatch(new RegExp(`/${locale}/dashboard/`))
        }
      }
    }
  })

  it("the API routes pass the request's language to the email service", async () => {
    // Without this the templates would be translated and never used.
    for (const route of [
      "app/api/auth/register/route.ts",
      "app/api/auth/reset-password/request/route.ts",
      "app/api/auth/session-challenge/route.ts",
      "app/api/auth/session-challenge/verify/route.ts",
    ]) {
      expect(read(route), `${route} does not resolve the request language`).toContain("localeFromRequest")
    }
  })
})

describe("the billing portal is only offered where it can open", () => {
  it("Settings hides the portal button without a Stripe customer", () => {
    const src = read("components/dashboard/SettingsForm.tsx")
    expect(src).toContain("hasStripeBillingPortal")
    expect(src).toMatch(/!isPayPalPayer && hasStripePortal/)
    // And its parent must fetch the id, or the rule reads undefined.
    expect(read("app/[locale]/(dashboard)/dashboard/settings/page.tsx")).toMatch(/stripeCustomerId:\s*true/)
  })

  it("the resumes dashboard resolves it server-side", () => {
    // The session token carries no customer id, so the client cannot decide this.
    const page = read("app/[locale]/(dashboard)/dashboard/resumes/page.tsx")
    expect(page).toContain("hasStripeBillingPortal")
    expect(page).toMatch(/canManageBilling=\{canManageBilling\}/)
    expect(read("components/dashboard/_resume-sub.tsx")).toMatch(/onManagePlan\?\: \(\) => void/)
  })
})

describe("the language is remembered on the account, not only in the browser", () => {
  it("sign-up stores the language the account was created in", () => {
    // A cookie only travels with one browser. The emails that need this are sent with no
    // browser in sight — a cron for the renewal reminder, a webhook for the referral.
    expect(read("lib/repositories/PrismaUserRepository.ts")).toMatch(/preferredLocale \? \{ preferredLocale \}/)
    expect(read("app/api/auth/register/confirm/route.ts")).toContain("localeFromRequest")
  })

  it("switching the language updates the account when signed in", () => {
    const src = read("lib/actions/locale.ts")
    expect(src).toMatch(/preferredLocale: locale/)
    // Best-effort: failing to persist a preference must not break switching languages.
    expect(src).toMatch(/catch/)
  })

  it("the cron reads the user's own language for the renewal reminder", () => {
    const src = read("lib/services/cron/CronService.ts")
    expect(src).toMatch(/preferredLocale: true/)
    expect(src).toContain("renewalReminderSubject(user.preferredLocale)")
  })

  it("the referral reward uses the REFERRER's language, never the buyer's", () => {
    // The email goes to the person who referred, not to the person whose payment fired
    // the webhook. Using the checkout locale would write to them in someone else's
    // language.
    const src = read("lib/referral-rewards.ts")
    expect(src).toMatch(/preferredLocale: true/)
    expect(src).toContain("referralRewardSubject(referrer.preferredLocale)")
    expect(src).toMatch(/locale: referrer\.preferredLocale/)
  })

  it("the column is nullable, so existing accounts keep their current behaviour", () => {
    expect(read("prisma/schema.prisma")).toMatch(/preferredLocale\s+String\?/)
    expect(read("prisma/migrations/20260727000000_add_user_preferred_locale/migration.sql"))
      .toMatch(/ADD COLUMN "preferredLocale" TEXT;/)
  })
})

describe("login records the language for accounts that never had it", () => {
  // The root fix for the existing base: preferredLocale was only set at sign-up or on an
  // explicit switch, so every pre-migration account stayed null and its cron/webhook
  // emails guessed. Almost nobody clicks the toggle. Capturing it at login — which every
  // active subscriber does — fills it from the real browser signal.
  const src = read("lib/auth.ts")

  it("backfills as a SEPARATE write, gated on null, that cannot touch session logic", () => {
    // updateMany with preferredLocale:null in the WHERE: writes only when unset, never
    // overwrites an explicit choice, needs no prior read, and is isolated from the
    // session-token update.
    expect(src).toMatch(/updateMany\(\{\s*where:\s*\{\s*id:\s*userId,\s*preferredLocale:\s*null\s*\}/)
    expect(src).toContain("async function backfillPreferredLocale")
  })

  it("runs on BOTH login paths — credentials and Google", () => {
    // Credentials login reads the request directly; Google login has no request object,
    // so it reads next/headers. Both must backfill or half the base stays null.
    const calls = src.match(/backfillPreferredLocale\(/g) ?? []
    // one definition + two call sites
    expect(calls.length).toBeGreaterThanOrEqual(3)
    expect(src).toContain('request.headers.get("accept-language")')
    expect(src).toMatch(/const h = await headers\(\)/)
  })

  it("is best-effort — a failed backfill never blocks a login", () => {
    expect(src).toMatch(/backfillPreferredLocale failed/)
  })
})
