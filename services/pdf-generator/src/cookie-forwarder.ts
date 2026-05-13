// pdf-generator microservice only
import type { Page } from "puppeteer-core"
import { ALLOWED_COOKIE_NAMES, SESSION_COOKIE_NAMES } from "./contracts"

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
  const allowed = all.filter((c) => ALLOWED_COOKIE_NAMES.has(c.name))
  const hasSession = allowed.some((c) => SESSION_COOKIE_NAMES.has(c.name))
  if (!hasSession) {
    console.warn("[pdf] session cookie not found in whitelist — forwarding all as fallback")
    await page.setCookie(...all)
    return
  }
  await page.setCookie(...allowed)
}
