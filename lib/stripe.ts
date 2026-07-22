import Stripe from "stripe"

// apiVersion is pinned deliberately: it fixes the Stripe API behavior our billing
// was built and tested against, independent of the SDK version. A transitive SDK
// bump (from the PayPal spike's npm install) advanced the SDK's LatestApiVersion
// type to "2026-06-24.dahlia", which no longer accepts our pin as a literal. The
// cast preserves the pin (same API behavior in prod) while satisfying the type.
// Moving to a newer API version is a separate, deliberate billing decision.
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" as unknown as Stripe.StripeConfig["apiVersion"] })
  : null

export function stripeEnabled(): boolean {
  return !!stripe
}
