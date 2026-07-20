import { StripeClientAdapter } from "@/lib/services/stripe/StripeClientAdapter"
import { StripeWebhookService } from "@/lib/services/stripe/StripeWebhookService"
import { StripeCheckoutService } from "@/lib/services/stripe/StripeCheckoutService"
import { StripeBillingService } from "@/lib/services/stripe/StripeBillingService"
import { createLogger } from "@/lib/logger"

export const stripeClient = new StripeClientAdapter()

export const stripeWebhookService = new StripeWebhookService(
  stripeClient,
  createLogger("StripeWebhookService"),
)

export const stripeCheckoutService = new StripeCheckoutService(
  stripeClient,
  createLogger("StripeCheckoutService"),
)

export const stripeBillingService = new StripeBillingService(
  stripeClient,
  createLogger("StripeBillingService"),
)
