import { headers } from "next/headers"
import geoip from "geoip-lite"

const EU_COUNTRIES = new Set([
  "AT","BE","BG","CY","CZ","DE","DK","EE","ES","FI",
  "FR","GR","HR","HU","IE","IT","LT","LU","LV","MT",
  "NL","PL","PT","RO","SE","SI","SK",
  // EEA — Directiva UE 2011/83/UE
  "NO","IS","LI",
])

// RFC1918 + loopback + link-local private ranges
const PRIVATE_IP_RE = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fe80:|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:|::ffff:127\.)/i

export async function getClientIp(): Promise<string | null> {
  const h = await headers()
  // x-real-ip is set by Traefik/nginx and is harder to spoof than XFF
  const realIp = h.get("x-real-ip")
  if (realIp?.trim()) return realIp.trim()

  // XFF: take the LAST non-trusted entry (rightmost client IP before known proxies)
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) {
    const ips = forwarded.split(",").map(s => s.trim()).filter(Boolean)
    // rightmost = closest to real client before proxy chain
    return ips[ips.length - 1] ?? null
  }
  return null
}

export async function isEUUser(): Promise<boolean> {
  try {
    const ip = await getClientIp()
    if (!ip) return true // unknown IP → safe default: show consent

    if (PRIVATE_IP_RE.test(ip)) {
      // local/private IP: dev environment → no consent needed
      // in production this means proxy misconfiguration; still safe to return false
      // (consent will show via fallback if no IP is ever found)
      return process.env.NODE_ENV === "production" ? true : false
    }

    const geo = geoip.lookup(ip)
    if (!geo || typeof geo.country !== "string") return true // lookup failed → safe default

    return EU_COUNTRIES.has(geo.country)
  } catch {
    return true // any error → safe default: show consent
  }
}
