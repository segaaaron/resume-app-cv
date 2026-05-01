/**
 * lib/pdf/cookie-forwarder.ts
 *
 * RESPONSABILIDAD ÚNICA: parsear el header `Cookie` del request HTTP entrante
 * y aplicarlo a la página de Puppeteer.
 *
 * POR QUÉ EXISTE: Puppeteer abre una instancia de Chrome separada del browser
 * del usuario, sin las cookies de la sesión original. Para que la URL
 * `/<locale>/resume/<id>/print` pueda autenticar al usuario (NextAuth lee la
 * cookie `next-auth.session-token`), debemos inyectar las cookies manualmente.
 *
 * SEGURIDAD: solo se reenvían cookies de NextAuth y de locale. El resto se
 * descarta para no exponer cookies de terceros al proceso Chrome headless.
 *
 * NO debe: hacer auth lookup, validar la sesión, ni mutar cookies.
 */

import type { Page } from "puppeteer"

// Prefijos permitidos — todo lo demás se descarta.
const ALLOWED_COOKIE_PREFIXES = [
  "next-auth.",
  "__Secure-next-auth.",
  "__Host-next-auth.",
  "NEXT_LOCALE",
]

function isAllowed(name: string): boolean {
  return ALLOWED_COOKIE_PREFIXES.some(
    (prefix) => name === prefix || name.startsWith(prefix),
  )
}

type ForwardedCookie = {
  name: string
  value: string
  domain: string
}

export async function applyCookies(
  page: Page,
  cookieHeader: string,
  appUrl: string,
): Promise<void> {
  if (!cookieHeader) return

  const hostname = new URL(appUrl).hostname

  const cookies: ForwardedCookie[] = cookieHeader
    .split(";")
    .map((c) => {
      const eq = c.indexOf("=")
      if (eq < 0) return null
      const name = c.slice(0, eq).trim()
      const value = c.slice(eq + 1).trim()
      if (!name || !value || !isAllowed(name)) return null
      return { name, value, domain: hostname }
    })
    .filter((c): c is ForwardedCookie => c !== null)

  if (cookies.length > 0) {
    await page.setCookie(...cookies)
  }
}
