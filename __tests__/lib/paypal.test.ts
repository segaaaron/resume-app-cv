import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { paypalEnabled, paypalConfig, paypalApiBase } from "@/lib/paypal"
import { PayPalClientAdapter } from "@/lib/services/paypal/PayPalClientAdapter"

// Snapshot + restore the PayPal env so tests never leak state into each other.
const PP_KEYS = [
  "PAYPAL_CLIENT_ID",
  "PAYPAL_SECRET",
  "PAYPAL_WEBHOOK_ID",
  "PAYPAL_ENV",
  "PAYPAL_PLAN_ID_MONTHLY",
  "PAYPAL_PLAN_ID_ANNUAL",
]

describe("paypal gateway config (flag-off by default)", () => {
  let saved: Record<string, string | undefined>

  beforeEach(() => {
    saved = {}
    for (const k of PP_KEYS) {
      saved[k] = process.env[k]
      delete process.env[k]
    }
  })
  afterEach(() => {
    for (const k of PP_KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  })

  it("without credentials → disabled and null config", () => {
    expect(paypalEnabled()).toBe(false)
    expect(paypalConfig()).toBeNull()
  })

  it("constructing the adapter without credentials THROWS (no silent misconfig)", () => {
    expect(() => new PayPalClientAdapter()).toThrow(/not configured/i)
  })

  it("enabled only when the 3 required secrets are all present", () => {
    process.env.PAYPAL_CLIENT_ID = "cid"
    process.env.PAYPAL_SECRET = "sec"
    // webhook id still missing → must remain OFF
    expect(paypalEnabled()).toBe(false)
    process.env.PAYPAL_WEBHOOK_ID = "wh"
    expect(paypalEnabled()).toBe(true)
    expect(paypalConfig()).toMatchObject({ clientId: "cid", secret: "sec", webhookId: "wh" })
  })

  it("api base defaults to sandbox; 'live' switches to production host", () => {
    delete process.env.PAYPAL_ENV
    expect(paypalApiBase()).toContain("sandbox")
    process.env.PAYPAL_ENV = "live"
    expect(paypalApiBase()).toBe("https://api-m.paypal.com")
  })
})
