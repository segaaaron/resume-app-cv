"use server"

import { cookies } from "next/headers"
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/lib/locale"
import { routing } from "@/i18n/routing"

/**
 * Remember an explicit language choice.
 *
 * The switcher used to only push a new URL, so the choice lived exactly as long as the
 * current navigation: every entry point outside `[locale]` (home, login, register,
 * privacy, terms) read this cookie, never found it, and sent the user back to the
 * default language. Picking English and returning through the home page meant Spanish.
 *
 * A Server Action rather than `document.cookie`: the entry points read the cookie on the
 * server, and writing it here keeps that in one place — the client only says which
 * language was picked.
 */
export async function setLocaleCookie(locale: string): Promise<void> {
  if (!(routing.locales as readonly string[]).includes(locale)) return

  const store = await cookies()
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    // Readable by the client too: nothing secret, and it keeps a client-side
    // language check possible without another round trip.
    httpOnly: false,
  })
}
