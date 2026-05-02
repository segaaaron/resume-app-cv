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

// NextAuth v5 (@auth/core) cookie names — fuente: @auth/core/lib/utils/cookie.js
//
//   HTTP  (dev, useSecureCookies=false): prefix=""
//     authjs.session-token, authjs.callback-url, authjs.csrf-token
//
//   HTTPS (prod, useSecureCookies=true): prefix="__Secure-", CSRF usa "__Host-"
//     __Secure-authjs.session-token, __Secure-authjs.callback-url, __Host-authjs.csrf-token
//
// NEXT_LOCALE: cookie de i18n de next-intl.
const ALLOWED_COOKIES = new Set([
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "NEXT_LOCALE",
])

// Subset que confirma que hay sesión activa — si ninguno está presente
// la whitelist está desactualizada y activamos el fallback.
const SESSION_COOKIE_NAMES = new Set([
  "authjs.session-token",
  "__Secure-authjs.session-token",
])

type ForwardedCookie = {
  name: string
  value: string
  url?: string
  domain?: string
  secure?: boolean
  path?: string
}

function parseCookies(cookieHeader: string, hostname: string, appUrl: string): ForwardedCookie[] {
  return cookieHeader
    .split(";")
    .map((c) => {
      const eq = c.indexOf("=")
      if (eq < 0) return null
      const name = c.slice(0, eq).trim()
      const value = c.slice(eq + 1).trim()
      if (!name) return null
      // __Host- cookies must NOT have domain per spec.
      // Puppeteer needs url or domain for its internal deleteCookie step — use url.
      if (name.startsWith("__Host-")) {
        return { name, value, url: appUrl, secure: true, path: "/" }
      }
      // __Secure- cookies require secure flag
      if (name.startsWith("__Secure-")) {
        return { name, value, domain: hostname, secure: true }
      }
      return { name, value, domain: hostname }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
}

export async function applyCookies(
  page: Page,
  cookieHeader: string,
  appUrl: string,
): Promise<void> {
  if (!cookieHeader) return

  const hostname = new URL(appUrl).hostname
  const all = parseCookies(cookieHeader, hostname, appUrl)
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
