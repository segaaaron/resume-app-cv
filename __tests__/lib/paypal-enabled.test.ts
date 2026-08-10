import { describe, it, expect, vi, afterEach } from "vitest"

/**
 * Sandbox credentials must not enable PayPal in production.
 *
 * Production was running with PAYPAL_ENV=sandbox and a full credential set, so
 * every /api/paypal/* route answered — against PayPal's test environment, on a
 * checkout the UI deliberately hides. No real money could move, but live payment
 * endpoints nobody uses and nobody watches are surface for nothing.
 */
async function enabledWith(env: Record<string, string | undefined>) {
  vi.resetModules()
  const prev = { ...process.env }
  Object.assign(process.env, {
    PAYPAL_CLIENT_ID: "id", PAYPAL_SECRET: "secret", PAYPAL_WEBHOOK_ID: "hook", ...env,
  })
  vi.stubEnv("NODE_ENV", env.NODE_ENV ?? "test")
  const { paypalEnabled } = await import("@/lib/paypal")
  const out = paypalEnabled()
  process.env = prev
  return out
}

afterEach(() => vi.unstubAllEnvs())

describe("paypalEnabled", () => {
  it("stays OFF in production with sandbox credentials", async () => {
    expect(await enabledWith({ PAYPAL_ENV: "sandbox", NODE_ENV: "production" })).toBe(false)
  })

  it("stays OFF in production when PAYPAL_ENV is unset", async () => {
    // Absent means sandbox — the default must never be "charge people".
    expect(await enabledWith({ PAYPAL_ENV: undefined, NODE_ENV: "production" })).toBe(false)
  })

  it("turns ON in production only when explicitly live", async () => {
    expect(await enabledWith({ PAYPAL_ENV: "live", NODE_ENV: "production" })).toBe(true)
  })

  it("still works in sandbox outside production — that is what sandbox is for", async () => {
    expect(await enabledWith({ PAYPAL_ENV: "sandbox", NODE_ENV: "development" })).toBe(true)
  })

  it("stays OFF without credentials, whatever the environment", async () => {
    vi.resetModules()
    const prev = { ...process.env }
    delete process.env.PAYPAL_CLIENT_ID
    process.env.PAYPAL_ENV = "live"
    vi.stubEnv("NODE_ENV", "production")
    const { paypalEnabled } = await import("@/lib/paypal")
    expect(paypalEnabled()).toBe(false)
    process.env = prev
  })
})
