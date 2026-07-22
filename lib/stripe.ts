import Stripe from "stripe"

// apiVersion is pinned deliberately: it fixes the Stripe API behavior our billing
// was built and tested against, independent of the SDK version. A transitive SDK
// bump (from the PayPal spike's npm install) advanced the SDK's LatestApiVersion
// type to "2026-06-24.dahlia", which no longer accepts our pin as a literal. The
// cast preserves the pin (same API behavior in prod) while satisfying the type.
// Moving to a newer API version is a separate, deliberate billing decision.
// apiVersion is pinned to the version our billing was built/tested against.
// The cast is SDK-version-agnostic on purpose: local and prod resolve slightly
// different stripe 22.x patches (the PayPal spike bumped the local lockfile), and
// the exact apiVersion literal type — plus helper types like LatestApiVersion /
// StripeConfig — differ or are absent across those patches. `as unknown as never`
// satisfies whatever `apiVersion` expects in ANY version without depending on an
// SDK-specific type name, while keeping the pinned value at runtime.
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" as unknown as never })
  : null

export function stripeEnabled(): boolean {
  return !!stripe
}
