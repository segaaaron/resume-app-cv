import { describe, it, expect } from "vitest"
import crypto from "crypto"
import {
  crc32,
  isTrustedCertUrl,
  signatureBaseString,
  verifyWebhookOffline,
  readWebhookHeaders,
  type PayPalWebhookHeaders,
} from "@/lib/services/paypal/verify-webhook"

describe("paypal offline webhook · crc32", () => {
  it("matches the standard CRC32 test vector", () => {
    // "123456789" → 0xCBF43926 (canonical IEEE CRC32 check value).
    expect(crc32("123456789")).toBe(0xcbf43926)
    expect(crc32("")).toBe(0)
  })
  it("changes when the body changes by one byte (tamper-evident)", () => {
    expect(crc32('{"a":1}')).not.toBe(crc32('{"a":2}'))
  })
})

describe("paypal offline webhook · SSRF cert-url guard", () => {
  it("accepts only https PayPal-owned hosts", () => {
    expect(isTrustedCertUrl("https://api.paypal.com/v1/cert.pem")).toBe(true)
    expect(isTrustedCertUrl("https://api.sandbox.paypal.com/cert.pem")).toBe(true)
    expect(isTrustedCertUrl("https://x.paypalobjects.com/cert.pem")).toBe(true)
  })
  it("rejects http, foreign hosts, and look-alike domains", () => {
    expect(isTrustedCertUrl("http://api.paypal.com/cert.pem")).toBe(false) // not https
    expect(isTrustedCertUrl("https://evil.com/cert.pem")).toBe(false)
    expect(isTrustedCertUrl("https://paypal.com.evil.com/cert.pem")).toBe(false)
    expect(isTrustedCertUrl("not-a-url")).toBe(false)
  })
})

describe("paypal offline webhook · base string", () => {
  it("joins id|time|webhookId|crc32(body) in order", () => {
    const base = signatureBaseString(
      { transmissionId: "tid", transmissionTime: "2026-07-24T00:00:00Z" },
      "WH-123",
      "body",
    )
    expect(base).toBe(`tid|2026-07-24T00:00:00Z|WH-123|${crc32("body")}`)
  })
})

describe("paypal offline webhook · full RSA-SHA256 verification", () => {
  const webhookId = "WH-TEST"
  const rawBody = JSON.stringify({ id: "WH-evt", event_type: "PAYMENT.CAPTURE.COMPLETED" })
  const headersBase = {
    transmissionId: "b1c2",
    transmissionTime: "2026-07-24T12:00:00Z",
    certUrl: "https://api.paypal.com/cert.pem",
    authAlgo: "SHA256withRSA",
  }

  // Generate a keypair; sign the real base string with the private key; verify
  // with the public key served by an injected fetcher (no network).
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 })
  const pubPem = publicKey.export({ type: "spki", format: "pem" }).toString()

  function sign(body: string): string {
    const base = signatureBaseString(headersBase, webhookId, body)
    const signer = crypto.createSign("RSA-SHA256")
    signer.update(base)
    signer.end()
    return signer.sign(privateKey, "base64")
  }

  it("accepts a correctly signed webhook", async () => {
    const headers: PayPalWebhookHeaders = { ...headersBase, transmissionSig: sign(rawBody) }
    const ok = await verifyWebhookOffline(headers, webhookId, rawBody, async () => pubPem)
    expect(ok).toBe(true)
  })

  it("rejects a tampered body (crc32 mismatch breaks the signature)", async () => {
    const headers: PayPalWebhookHeaders = { ...headersBase, transmissionSig: sign(rawBody) }
    const ok = await verifyWebhookOffline(headers, webhookId, rawBody + " ", async () => pubPem)
    expect(ok).toBe(false)
  })

  it("rejects an untrusted cert url before any crypto", async () => {
    const headers: PayPalWebhookHeaders = {
      ...headersBase,
      certUrl: "https://evil.com/cert.pem",
      transmissionSig: sign(rawBody),
    }
    const ok = await verifyWebhookOffline(headers, webhookId, rawBody, async () => pubPem)
    expect(ok).toBe(false)
  })

  it("rejects a non-RSA-SHA256 auth algo", async () => {
    const headers: PayPalWebhookHeaders = {
      ...headersBase,
      authAlgo: "SHA1withRSA",
      transmissionSig: sign(rawBody),
    }
    const ok = await verifyWebhookOffline(headers, webhookId, rawBody, async () => pubPem)
    expect(ok).toBe(false)
  })

  it("rejects the wrong webhook id (base string differs)", async () => {
    const headers: PayPalWebhookHeaders = { ...headersBase, transmissionSig: sign(rawBody) }
    const ok = await verifyWebhookOffline(headers, "WH-WRONG", rawBody, async () => pubPem)
    expect(ok).toBe(false)
  })
})

describe("paypal offline webhook · header reader", () => {
  it("returns null when a required header is missing", () => {
    const h = new Headers({ "paypal-transmission-id": "x" })
    expect(readWebhookHeaders(h)).toBeNull()
  })
  it("reads all five PAYPAL-* headers", () => {
    const h = new Headers({
      "paypal-transmission-id": "id",
      "paypal-transmission-time": "t",
      "paypal-transmission-sig": "sig",
      "paypal-cert-url": "https://api.paypal.com/c",
      "paypal-auth-algo": "SHA256withRSA",
    })
    expect(readWebhookHeaders(h)).toMatchObject({ transmissionId: "id", authAlgo: "SHA256withRSA" })
  })
})
