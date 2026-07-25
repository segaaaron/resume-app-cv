// PayPalClientAdapter — thin REST client for the PayPal gateway. Mirror of
// StripeClientAdapter, but PayPal ships no usable server SDK for Catalog /
// webhook-verify, so every call is a direct REST request with an OAuth2
// client-credentials token.
//
// SAFETY: every method throws if credentials are absent (paypalConfig() null),
// so nothing here can run in a misconfigured environment. The routes that call
// it are themselves gated behind paypalEnabled().
import { paypalApiBase, paypalConfig, type PayPalConfig } from "@/lib/paypal"

/** Shape of the webhook-signature verification response. */
export interface WebhookVerifyResult {
  verification_status: "SUCCESS" | "FAILURE"
}

/** Minimal subscription view we rely on for re-fetch/provisioning. */
export interface PayPalSubscription {
  id: string
  status: string // APPROVAL_PENDING | ACTIVE | SUSPENDED | CANCELLED | EXPIRED
  plan_id?: string
  billing_info?: { next_billing_time?: string }
  [key: string]: unknown
}

export class PayPalClientAdapter {
  private cfg: PayPalConfig
  // Cache the OAuth token until shortly before it expires (PayPal tokens last
  // ~9h). Avoids a token round-trip on every call.
  private token: { value: string; expiresAt: number } | null = null

  constructor() {
    const cfg = paypalConfig()
    if (!cfg) throw new Error("PayPal is not configured (missing credentials)")
    this.cfg = cfg
  }

  /** OAuth2 client-credentials access token, cached until near expiry. */
  private async accessToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt) return this.token.value

    const auth = Buffer.from(`${this.cfg.clientId}:${this.cfg.secret}`).toString("base64")
    const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    })
    if (!res.ok) throw new Error(`PayPal OAuth failed: ${res.status}`)
    const data = (await res.json()) as { access_token: string; expires_in: number }
    // Refresh 60s before real expiry to avoid edge races.
    this.token = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 }
    return this.token.value
  }

  /** Authenticated JSON request against the PayPal REST API. */
  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.accessToken()
    const res = await fetch(`${paypalApiBase()}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`PayPal ${method} ${path} failed: ${res.status} ${text.slice(0, 300)}`)
    }
    // Some endpoints (e.g. cancel) return 204 No Content.
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  }

  /** Create a recurring subscription (PRO monthly/annual). */
  createSubscription(planId: string, custom?: string): Promise<PayPalSubscription> {
    return this.request<PayPalSubscription>("POST", "/v1/billing/subscriptions", {
      plan_id: planId,
      ...(custom ? { custom_id: custom } : {}),
    })
  }

  /**
   * Re-fetch a subscription's authoritative state. PayPal webhooks are unreliable
   * (out of order, duplicated, late) — provisioning MUST read this before trusting
   * a webhook payload.
   */
  getSubscription(id: string): Promise<PayPalSubscription> {
    return this.request<PayPalSubscription>("GET", `/v1/billing/subscriptions/${id}`)
  }

  /** Cancel a subscription (in-app, since PayPal has no customer portal). */
  cancelSubscription(id: string, reason = "User requested cancellation"): Promise<void> {
    return this.request<void>("POST", `/v1/billing/subscriptions/${id}/cancel`, { reason })
  }

  /** Create a one-time order (BASIC/SPRINT). */
  createOrder(body: unknown): Promise<{ id: string; status: string }> {
    return this.request("POST", "/v2/checkout/orders", body)
  }

  /** Capture an approved one-time order. */
  captureOrder(orderId: string): Promise<{ id: string; status: string }> {
    return this.request("POST", `/v2/checkout/orders/${orderId}/capture`, {})
  }

  /** Refund a captured payment (business window enforced by the caller). */
  refundCapture(captureId: string): Promise<{ id: string; status: string }> {
    return this.request("POST", `/v2/payments/captures/${captureId}/refund`, {})
  }

  /**
   * Verify a webhook's signature server-side. PayPal has no local HMAC like
   * Stripe's constructEvent — verification is a REST call with the raw headers +
   * the unparsed body. Re-serializing the body breaks it, so pass the parsed
   * event object exactly as received.
   */
  async verifyWebhookSignature(headers: {
    transmissionId: string
    transmissionTime: string
    certUrl: string
    authAlgo: string
    transmissionSig: string
  }, event: unknown): Promise<boolean> {
    const res = await this.request<WebhookVerifyResult>(
      "POST",
      "/v1/notifications/verify-webhook-signature",
      {
        transmission_id: headers.transmissionId,
        transmission_time: headers.transmissionTime,
        cert_url: headers.certUrl,
        auth_algo: headers.authAlgo,
        transmission_sig: headers.transmissionSig,
        webhook_id: this.cfg.webhookId,
        webhook_event: event,
      },
    )
    return res.verification_status === "SUCCESS"
  }
}
