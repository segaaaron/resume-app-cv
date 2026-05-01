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
 * SEGURIDAD: reenvía solo cookies de NextAuth y locale. Si no detecta ninguna
 * cookie de sesión en la lista (variante de nombre desconocida), hace fallback
 * a reenviar todas — evita que el usuario vea el login en el PDF.
 *
 * NO debe: hacer auth lookup, validar la sesión, ni mutar cookies.
 */

import type { Page } from "puppeteer"

// Nombres exactos de las 3 variantes de NextAuth según entorno:
//   next-auth.*          → HTTP / desarrollo local
//   __Secure-next-auth.* → HTTPS (SameSite=Lax, Secure)
//   __Host-next-auth.*   → HTTPS strict (no domain, path=/)
const ALLOWED_COOKIES = new Set([
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "__Host-next-auth.session-token",
  "next-auth.csrf-token",
  "__Secure-next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "NEXT_LOCALE",
])

// Nombres que indican que hay una sesión válida en el header.
const SESSION_COOKIE_NAMES = new Set([
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "__Host-next-auth.session-token",
])

type ForwardedCookie = {
  name: string
  value: string
  domain: string
}

function parseCookies(cookieHeader: string, hostname: string): ForwardedCookie[] {
  return cookieHeader
    .split(";")
    .map((c) => {
      const eq = c.indexOf("=")
      if (eq < 0) return null
      const name = c.slice(0, eq).trim()
      const value = c.slice(eq + 1).trim()
      if (!name || !value) return null
      return { name, value, domain: hostname }
    })
    .filter((c): c is ForwardedCookie => c !== null)
}

export async function applyCookies(
  page: Page,
  cookieHeader: string,
  appUrl: string,
): Promise<void> {
  if (!cookieHeader) return

  const hostname = new URL(appUrl).hostname
  const all = parseCookies(cookieHeader, hostname)
  if (all.length === 0) return

  const allowed = all.filter((c) => ALLOWED_COOKIES.has(c.name))
  const hasSession = allowed.some((c) => SESSION_COOKIE_NAMES.has(c.name))

  if (!hasSession) {
    // Fallback: session cookie name didn't match any known variant.
    // Forward everything to avoid rendering the login page in the PDF.
    console.warn(
      "[pdf] session cookie not found in whitelist — forwarding all cookies as fallback. " +
      `Known names in header: ${all.map((c) => c.name).join(", ")}`,
    )
    await page.setCookie(...all)
    return
  }

  await page.setCookie(...allowed)
}
