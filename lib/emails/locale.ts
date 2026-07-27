import { routing } from "@/i18n/routing"

export type EmailLocale = (typeof routing.locales)[number]

/**
 * Language to write an email in.
 *
 * Every template was hardcoded Spanish, so a user who signed up in English received
 * their verification code, their password reset and their session challenges in a
 * language they may not read — on exactly the emails that gate access to the account.
 *
 * Unlike the billing webhooks, these are sent from ordinary requests, so the caller
 * already knows the language and just has to pass it. Anything unsupported or missing
 * falls back to the default locale.
 */
export function pickEmailLocale(locale?: string | null): EmailLocale {
  return (routing.locales as readonly string[]).includes(locale ?? "")
    ? (locale as EmailLocale)
    : routing.defaultLocale
}

/** Base URL with any trailing slash removed, so paths can be appended safely. */
export function emailAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.readycvv.com").replace(/\/$/, "")
}

/**
 * A dashboard link that actually resolves. Those routes live under `app/[locale]/` and
 * no middleware adds a locale, so `/dashboard/...` is the 404 page.
 */
export function emailDashboardUrl(locale: EmailLocale, path: string): string {
  return `${emailAppUrl()}/${locale}${path}`
}

/** Date in the reader's language. Templates used to force es-ES for everyone. */
export function formatEmailDate(date: Date, locale: EmailLocale): string {
  return date.toLocaleDateString(locale === "en" ? "en-US" : "es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
