// Offline PayPal webhook signature verification — the method PayPal now
// recommends (the POST /v1/notifications/verify-webhook-signature API call is
// deprecated). No network round-trip: we validate the RSA-SHA256 signature
// locally against PayPal's cert.
//
// Signature base string (order is fixed by PayPal):
//   transmissionId | transmissionTime | webhookId | crc32(rawBody)
// The crc32 is over the EXACT raw bytes PayPal sent — any re-serialization of
// the JSON changes it and verification fails. Callers MUST pass the unparsed body.
import crypto from "crypto"

/** Webhook transmission headers PayPal sends with every event. */
export interface PayPalWebhookHeaders {
  transmissionId: string
  transmissionTime: string
  transmissionSig: string
  certUrl: string
  authAlgo: string
}

/** Read the PAYPAL-* headers off an incoming request. */
export function readWebhookHeaders(h: Headers): PayPalWebhookHeaders | null {
  const transmissionId = h.get("paypal-transmission-id")
  const transmissionTime = h.get("paypal-transmission-time")
  const transmissionSig = h.get("paypal-transmission-sig")
  const certUrl = h.get("paypal-cert-url")
  const authAlgo = h.get("paypal-auth-algo")
  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    return null
  }
  return { transmissionId, transmissionTime, transmissionSig, certUrl, authAlgo }
}

/**
 * SSRF guard: the cert URL must be an https PayPal-owned host. Without this, a
 * forged webhook could point cert_url at an attacker server serving a key that
 * matches their own signature. Only api*.paypal.com / *.paypalobjects.com over
 * https are trusted.
 */
export function isTrustedCertUrl(certUrl: string): boolean {
  let u: URL
  try {
    u = new URL(certUrl)
  } catch {
    return false
  }
  if (u.protocol !== "https:") return false
  const host = u.hostname.toLowerCase()
  return (
    host === "paypal.com" ||
    host.endsWith(".paypal.com") ||
    host.endsWith(".paypalobjects.com")
  )
}

/** CRC32 (IEEE) of raw bytes — self-contained, no zlib version dependency. */
export function crc32(input: string | Buffer): number {
  const bytes = typeof input === "string" ? Buffer.from(input, "utf8") : input
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i]
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  // >>> 0 forces an unsigned 32-bit result (PayPal expects the unsigned value).
  return (crc ^ 0xffffffff) >>> 0
}

/** The exact string PayPal signed, rebuilt from headers + raw body. */
export function signatureBaseString(
  headers: Pick<PayPalWebhookHeaders, "transmissionId" | "transmissionTime">,
  webhookId: string,
  rawBody: string,
): string {
  return `${headers.transmissionId}|${headers.transmissionTime}|${webhookId}|${crc32(rawBody)}`
}

/**
 * Verify a webhook offline. Fetches PayPal's cert (validated host), rebuilds the
 * signed base string, and checks the RSA-SHA256 signature. Returns false on any
 * failure — never throws to the caller's happy path, so a malformed/forged event
 * is simply rejected.
 *
 * `certFetcher` is injectable so this is unit-testable without network.
 */
export async function verifyWebhookOffline(
  headers: PayPalWebhookHeaders,
  webhookId: string,
  rawBody: string,
  certFetcher: (url: string) => Promise<string> = defaultCertFetcher,
): Promise<boolean> {
  if (!isTrustedCertUrl(headers.certUrl)) return false
  // PayPal signs with SHA256withRSA; reject anything else rather than guess.
  if (headers.authAlgo.toUpperCase().replace(/[^A-Z0-9]/g, "") !== "SHA256WITHRSA") return false

  let cert: string
  try {
    cert = await certFetcher(headers.certUrl)
  } catch {
    return false
  }

  try {
    const base = signatureBaseString(headers, webhookId, rawBody)
    const verifier = crypto.createVerify("RSA-SHA256")
    verifier.update(base)
    verifier.end()
    return verifier.verify(cert, headers.transmissionSig, "base64")
  } catch {
    return false
  }
}

async function defaultCertFetcher(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`cert fetch failed: ${res.status}`)
  return res.text()
}
