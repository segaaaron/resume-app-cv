// PayPal gateway config — second payment provider alongside Stripe (lib/stripe.ts).
// Mirrors the Stripe pattern: reads env, exposes an `enabled` guard so the rest of
// the app is a no-op until real credentials exist. No SDK — PayPal's REST API is
// called directly (the official server SDK doesn't cover Catalog/webhook-verify
// anyway, and REST keeps the build dependency-free).

/** Sandbox vs live base URL, chosen by PAYPAL_ENV (defaults to sandbox). */
export function paypalApiBase(): string {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com"
}

export interface PayPalConfig {
  clientId: string
  secret: string
  webhookId: string
  /** Plan ids created in the PayPal dashboard/catalog (one per interval). */
  planIdMonthly?: string
  planIdAnnual?: string
}

/**
 * Resolved PayPal config, or null when credentials are absent. Null = the gateway
 * is OFF: no checkout route, no webhook processing, no buttons. Existing Stripe
 * flow is completely unaffected.
 */
export function paypalConfig(): PayPalConfig | null {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_SECRET
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!clientId || !secret || !webhookId) return null
  /**
   * Sandbox credentials never enable PayPal in production.
   *
   * Production was running with PAYPAL_ENV=sandbox and full credentials set, so
   * every /api/paypal/* route answered — against PayPal's test environment, on a
   * checkout the UI deliberately hides. No real money could move, but live
   * payment endpoints that nobody uses and nobody watches are surface for
   * nothing. Presence of credentials is no longer enough: production also has to
   * say "live". Sandbox keeps working everywhere else, which is the point of it.
   */
  if (process.env.NODE_ENV === "production" && (process.env.PAYPAL_ENV ?? "sandbox") !== "live") return null
  return {
    clientId,
    secret,
    webhookId,
    planIdMonthly: process.env.PAYPAL_PLAN_ID_MONTHLY,
    planIdAnnual: process.env.PAYPAL_PLAN_ID_ANNUAL,
  }
}

/**
 * Whether PayPal is enabled. The feature flag the whole integration hangs off:
 * false (no creds) → every PayPal surface stays dormant. Flip to true only when
 * PAYPAL_CLIENT_ID / PAYPAL_SECRET / PAYPAL_WEBHOOK_ID are all set.
 */
export function paypalEnabled(): boolean {
  return paypalConfig() !== null
}
