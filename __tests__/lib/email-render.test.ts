/**
 * Render EVERY email template in BOTH locales and prove nothing broke in the wiring.
 *
 * The existing email tests each rendered ONE locale and looked for ONE expected phrase.
 * That let real bugs through: a bulk rewrite corrupted the Spanish COPY of three
 * templates so that literal `${t.cta}` / `${t.creditApplied}` reached the customer's
 * inbox, and left two greetings hardcoded in Spanish inside the shared HTML so an
 * English reader saw "Hola". None of those were caught because no test rendered the
 * Spanish version or scanned the whole output.
 *
 * This is the guard that was missing: for each template × {es, en}, assert that no
 * unresolved template placeholder survives and that the document is tagged in the right
 * language. It renders the real HTML — it cannot be fooled by checking source strings.
 */
import { describe, it, expect } from "vitest"
import { registrationOtpHtml, registrationOtpText } from "@/lib/emails/registrationOtp"
import { passwordResetHtml, passwordResetText } from "@/lib/emails/passwordReset"
import { sessionChallengeHtml, sessionChallengeText } from "@/lib/emails/sessionChallenge"
import { sessionForcedHtml, sessionForcedText } from "@/lib/emails/sessionForced"
import { sessionChallengeFailedHtml, sessionChallengeFailedText } from "@/lib/emails/sessionChallengeFailedAttempt"
import { sessionChallengeBlockedHtml, sessionChallengeBlockedText } from "@/lib/emails/sessionChallengeBlocked"
import { managedWelcomeHtml, managedWelcomeText } from "@/lib/emails/managedWelcome"
import { renewalReminderHtml, renewalReminderText } from "@/lib/emails/renewalReminder"
import { referralRewardHtml, referralRewardText } from "@/lib/emails/referralReward"
import { subscriptionConfirmationHtml, subscriptionConfirmationText } from "@/lib/emails/subscriptionConfirmation"
import { paymentFailedHtml, paymentFailedText } from "@/lib/emails/paymentFailed"

const D = new Date("2027-03-01T10:00:00Z")

/** Every template, called with the given locale, returns [html, text]. */
const TEMPLATES: Record<string, (locale: string) => [string, string]> = {
  registrationOtp: (l) => [registrationOtpHtml({ userName: "Ana Pérez", code: "123456", locale: l }), registrationOtpText({ userName: "Ana Pérez", code: "123456", locale: l })],
  passwordReset: (l) => [passwordResetHtml({ userName: "Ana Pérez", code: "123456", locale: l }), passwordResetText({ userName: "Ana Pérez", code: "123456", locale: l })],
  sessionChallenge: (l) => [sessionChallengeHtml({ userName: "Ana Pérez", code: "123456", locale: l }), sessionChallengeText({ userName: "Ana Pérez", code: "123456", locale: l })],
  sessionForced: (l) => [sessionForcedHtml({ userName: "Ana Pérez", locale: l }), sessionForcedText({ userName: "Ana Pérez", locale: l })],
  sessionChallengeFailed: (l) => [sessionChallengeFailedHtml({ userName: "Ana", attemptsLeft: 2, locale: l }), sessionChallengeFailedText({ userName: "Ana", attemptsLeft: 2, locale: l })],
  sessionChallengeBlocked: (l) => [sessionChallengeBlockedHtml({ userName: "Ana", unblockedAt: D, locale: l }), sessionChallengeBlockedText({ userName: "Ana", unblockedAt: D, locale: l })],
  managedWelcome: (l) => [managedWelcomeHtml({ password: "x9Y!", expiresAt: D, downloadLimit: 5, loginUrl: "https://valhallaresume.com/es/login", locale: l }), managedWelcomeText({ password: "x9Y!", expiresAt: D, downloadLimit: 5, loginUrl: "https://valhallaresume.com/es/login", locale: l })],
  renewalReminder: (l) => [renewalReminderHtml({ userName: "Ana", userId: "u1", planInterval: "annual", renewalDate: D, locale: l }), renewalReminderText({ userName: "Ana", userId: "u1", planInterval: "annual", renewalDate: D, locale: l })],
  referralRewardProgress: (l) => [referralRewardHtml({ userName: "Ana", userId: "u1", tier: 2, tierLabel: "Silver", creditAmount: "$4.50", totalCredit: "$7.50", cycleCount: 2, isCycleComplete: false, locale: l }), referralRewardText({ userName: "Ana", userId: "u1", tier: 2, tierLabel: "Silver", creditAmount: "$4.50", totalCredit: "$7.50", cycleCount: 2, isCycleComplete: false, locale: l })],
  referralRewardComplete: (l) => [referralRewardHtml({ userName: "Ana", userId: "u1", tier: 3, tierLabel: "Gold", creditAmount: "$15", totalCredit: "$15", cycleCount: 5, isCycleComplete: true, locale: l }), referralRewardText({ userName: "Ana", userId: "u1", tier: 3, tierLabel: "Gold", creditAmount: "$15", totalCredit: "$15", cycleCount: 5, isCycleComplete: true, locale: l })],
  subscriptionConfirmation: (l) => [subscriptionConfirmationHtml({ userName: "Ana", userId: "u1", planInterval: "annual", renewalDate: D, locale: l }), subscriptionConfirmationText({ userName: "Ana", userId: "u1", planInterval: "annual", renewalDate: D, locale: l })],
  paymentFailed: (l) => [paymentFailedHtml({ firstName: "Ana", userId: "u1", invoiceUrl: null, locale: l }), paymentFailedText({ firstName: "Ana", invoiceUrl: null, locale: l })],
}

const cases = Object.entries(TEMPLATES).flatMap(([name, fn]) =>
  (["es", "en"] as const).map((locale) => ({ name, locale, fn })),
)

describe("every email renders cleanly in both locales", () => {
  it.each(cases)("$name [$locale] leaves no unresolved ${…} placeholder", ({ locale, fn }) => {
    const [html, text] = fn(locale)
    // A literal `${t.cta}` in the output means a COPY value was corrupted or a template
    // reference points at nothing — exactly what shipped in the Spanish referral,
    // renewal and managed-welcome emails.
    expect(html, "html has an unresolved template placeholder").not.toMatch(/\$\{[a-zA-Z]/)
    expect(text, "text has an unresolved template placeholder").not.toMatch(/\$\{[a-zA-Z]/)
  })

  it.each(cases)("$name [$locale] tags the document in the right language", ({ locale, fn }) => {
    const [html] = fn(locale)
    // Every HTML template carries <html lang="…">. The one email without a full
    // document wrapper is fine as long as it does not claim the wrong language.
    if (html.includes("<html")) {
      expect(html).toContain(`lang="${locale}"`)
    }
  })

  it("the English greeting is never the Spanish 'Hola'", () => {
    // Two greetings were hardcoded in Spanish inside shared HTML, so English readers of
    // the renewal and referral emails saw "Hola".
    for (const name of ["renewalReminder", "referralRewardProgress", "referralRewardComplete"]) {
      const [html] = TEMPLATES[name]("en")
      // Strip tags so a stray attribute can't false-positive; look for the word.
      const text = html.replace(/<[^>]+>/g, " ")
      expect(text, `${name} EN greets in Spanish`).not.toMatch(/\bHola\b/)
    }
  })

  it("the Spanish versions still greet in Spanish", () => {
    // Guard the other direction: the fix must not have flipped ES to English.
    for (const name of ["renewalReminder", "referralRewardProgress"]) {
      const [html] = TEMPLATES[name]("es")
      expect(html.replace(/<[^>]+>/g, " ")).toMatch(/\bHola\b/)
    }
  })
})
