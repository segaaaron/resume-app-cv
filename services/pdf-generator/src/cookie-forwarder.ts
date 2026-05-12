import type { Page } from "puppeteer-core"

const ALLOWED_COOKIES = new Set([
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "NEXT_LOCALE",
])

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

export function parseCookies(cookieHeader: string, hostname: string, appUrl: string): ForwardedCookie[] {
  return cookieHeader
    .split(";")
    .map((c) => {
      const eq = c.indexOf("=")
      if (eq < 0) return null
      const name = c.slice(0, eq).trim()
      const rawValue = c.slice(eq + 1).trim()
      let value: string
      try {
        value = decodeURIComponent(rawValue)
      } catch {
        value = rawValue
      }
      if (!name) return null
      if (name.startsWith("__Host-")) return { name, value, url: appUrl, secure: true, path: "/" }
      if (name.startsWith("__Secure-")) return { name, value, domain: hostname, secure: true }
      return { name, value, domain: hostname }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
}

export async function applyCookies(page: Page, cookieHeader: string, appUrl: string): Promise<void> {
  if (!cookieHeader) return
  const hostname = new URL(appUrl).hostname
  const all = parseCookies(cookieHeader, hostname, appUrl)
  if (all.length === 0) return
  const allowed = all.filter((c) => ALLOWED_COOKIES.has(c.name))
  const hasSession = allowed.some((c) => SESSION_COOKIE_NAMES.has(c.name))
  if (!hasSession) {
    console.warn("[pdf] session cookie not found in whitelist — forwarding all as fallback")
    await page.setCookie(...all)
    return
  }
  await page.setCookie(...allowed)
}
