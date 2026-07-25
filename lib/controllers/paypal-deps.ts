import { PayPalClientAdapter } from "@/lib/services/paypal/PayPalClientAdapter"
import { PayPalWebhookService } from "@/lib/services/paypal/PayPalWebhookService"
import { PayPalCheckoutService } from "@/lib/services/paypal/PayPalCheckoutService"
import { createLogger } from "@/lib/logger"

// Lazy singletons. The adapter constructor throws without credentials, so these
// are only built on first use — and every route guards on paypalEnabled() before
// calling in, so they never construct in a misconfigured environment.
let _webhook: PayPalWebhookService | null = null
let _checkout: PayPalCheckoutService | null = null

export function getPayPalWebhookService(): PayPalWebhookService {
  if (!_webhook) {
    _webhook = new PayPalWebhookService(new PayPalClientAdapter(), createLogger("PayPalWebhookService"))
  }
  return _webhook
}

export function getPayPalCheckoutService(): PayPalCheckoutService {
  if (!_checkout) {
    _checkout = new PayPalCheckoutService(new PayPalClientAdapter(), createLogger("PayPalCheckoutService"))
  }
  return _checkout
}
