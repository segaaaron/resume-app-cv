import { routing } from "@/i18n/routing"

/** Cookie that remembers an explicit language choice. Read by every entry point. */
export const LOCALE_COOKIE = "NEXT_LOCALE"

/** One year: the choice should outlive a session, like any other preference. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export type Locale = (typeof routing.locales)[number]

/**
 * Language for someone whose own language we do not speak.
 *
 * NOT the same as `routing.defaultLocale`, which is Spanish and stays that way — that
 * one decides next-intl's URL prefixing and the language of anything with no reader
 * attached. This one answers a different question: a visitor arrives with a browser in
 * Chinese, German or Japanese; we have Spanish and English; which do we show?
 *
 * English, because it is the language most likely to be readable by someone who speaks
 * neither. Falling back to Spanish sent every non-Spanish, non-English visitor on earth
 * to a language chosen for a market they are not in. A browser that genuinely asks for
 * Spanish still gets Spanish — that is a language we support, and it wins on its own.
 */
export const FALLBACK_LOCALE: Locale = "en"

function isSupported(value: string | null | undefined): value is Locale {
  return !!value && (routing.locales as readonly string[]).includes(value)
}

/**
 * Pick the best language from an `Accept-Language` header.
 *
 * Parses the quality values ("en-US,en;q=0.9,es;q=0.8") and returns the highest-ranked
 * language we actually support, matching on the primary subtag so `en-GB` and `en-US`
 * both resolve to `en`. Returns null when the header offers nothing we speak.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";")
      const q = params.find((p) => p.trim().startsWith("q="))
      const quality = q ? Number.parseFloat(q.split("=")[1]) : 1
      return { tag: tag.trim().toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality }
    })
    .filter((entry) => entry.tag && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality)

  for (const { tag } of ranked) {
    // "en-US" → "en". Region never changes which translation we have.
    const primary = tag.split("-")[0]
    if (isSupported(primary)) return primary
  }
  return null
}

/**
 * The language to serve, in order of authority:
 *   1. an explicit choice the user made (cookie) — it must always win;
 *   2. what their browser asks for, when it asks for a language we speak;
 *   3. English, for everyone else.
 *
 * Every entry point outside `[locale]` used to read the cookie and fall straight back to
 * Spanish. Nothing ever WROTE that cookie, and nothing read `Accept-Language`, so every
 * visitor on earth landed on Spanish — including a first-time visitor from the US whose
 * browser only speaks English, and including anyone who had picked English a minute
 * earlier and came back through the home page.
 *
 * Step 3 is FALLBACK_LOCALE, not `routing.defaultLocale`: a browser in Chinese or German
 * asks for a language we do not have, and English is the likelier of our two to be
 * readable. A browser that really does ask for Spanish still gets Spanish at step 2.
 */
export function resolveLocale(cookieValue?: string | null, acceptLanguage?: string | null): Locale {
  if (isSupported(cookieValue)) return cookieValue
  return localeFromAcceptLanguage(acceptLanguage) ?? FALLBACK_LOCALE
}

/**
 * Language for a request handled outside the `[locale]` tree — API routes have no
 * locale segment in their path, so this is how they learn which language to answer
 * (and which language to write an email in).
 *
 * Same order of authority as the pages: explicit choice, then the browser, then default.
 */
export function localeFromRequest(req: Request): Locale {
  const cookie = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${LOCALE_COOKIE}=`))
    ?.split("=")[1]
  return resolveLocale(cookie, req.headers.get("accept-language"))
}
