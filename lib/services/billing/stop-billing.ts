// The single definition of "stop charging this user, at whatever gateway is charging them".
//
// WHY THIS EXISTS: deleting an account used to write `deletedAt` and nothing else.
// `lib/auth.ts` then refuses the login (`if (user.deletedAt !== null) return null`), so
// the person was locked out — while Stripe kept billing the card every month, forever,
// with no way for them to reach a cancel button. The only end to that is a chargeback,
// which costs us the dispute fee and hits the Stripe account's reputation on top of the
// refund. Account deletion has to end the billing relationship, not just the login.
//
// Two rules, deliberate:
//
//  1. CANCEL IMMEDIATELY, never `cancel_at_period_end`. The self-serve cancel keeps
//     access until the paid period ends because the user asked to stop renewing and
//     still owns what they paid for. Deletion is the opposite: access is revoked the
//     same second, so charging for a period they are locked out of is precisely the
//     charge this module exists to remove.
//
//  2. A FAILURE HERE ABORTS THE DELETION. Soft-deleting after a failed cancel restores
//     the exact bug: locked out, still billed, and now invisible to us. Better to tell
//     the user to try again in a minute — deletion is never so urgent that it justifies
//     leaving a live subscription pointed at an account nobody can log into.
//
// One-time plans (BASIC/SPRINT) carry no subscription — provisioning writes
// `subscriptionId: null` — so there is nothing to cancel and nothing to refund: they
// already paid for a fixed window. This returns `nothing_to_cancel` for them.

import { db } from "@/lib/db"
import { stripeEnabled } from "@/lib/stripe"
import { paypalEnabled } from "@/lib/paypal"
import { AppError } from "@/lib/services/auth/AppError"
import type { ILogger } from "@/lib/interfaces/ILogger"

export type StopBillingResult =
  | { canceled: false }
  | { canceled: true; provider: "STRIPE" | "PAYPAL"; subscriptionId: string }

/** Gateway callers, injectable so the unit tests never touch a real SDK. */
export type StopBillingClients = {
  cancelStripe?: (subscriptionId: string) => Promise<unknown>
  cancelPayPal?: (subscriptionId: string, reason: string) => Promise<unknown>
}

const CANCEL_REASON = "Account deleted by the user"

/**
 * Cancels any live recurring subscription for this user, at whichever gateway holds it.
 *
 * Throws `AppError("cancel_failed", 409)` if a gateway rejects or is unreachable — 409
 * and not a 5xx on purpose: `lib/apiFetch.ts` treats every >=500 as "the server broke",
 * popping its own generic toast (the user would get two) and filing a
 * `request_gateway_error` row that by its own definition means the proxy answered and
 * Next never ran. Neither is true here. The cause still reaches the admin panel —
 * `handleError` logs 4xx too, with the description registered for `cancel_failed`. Also
 * `AppError("payments_not_configured", 503)` if the row points at a subscription whose
 * gateway is switched off in this environment — that combination is a misconfiguration,
 * and passing it silently is how a subscription survives its own account.
 */
export async function stopGatewayBilling(
  userId: string,
  logger: ILogger,
  clients: StopBillingClients = {},
): Promise<StopBillingResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { subscriptionId: true, paypalSubscriptionId: true },
  })
  if (!user) return { canceled: false }

  // PayPal first: a row can only ever carry one of the two ids (each is @unique and a
  // checkout writes its own), but if data ever holds both, the PayPal one is the one
  // without a hosted portal — the user has no other way to stop it.
  if (user.paypalSubscriptionId) {
    if (!paypalEnabled()) {
      logger.error("stopGatewayBilling: PayPal subscription on the row but PayPal is disabled — cancel it manually before purging", {
        userId,
        subscriptionId: user.paypalSubscriptionId,
      })
      throw new AppError("payments_not_configured", 503)
    }
    const cancel = clients.cancelPayPal ?? (await defaultPayPalCancel())
    try {
      await cancel(user.paypalSubscriptionId, CANCEL_REASON)
    } catch (err) {
      logger.error("stopGatewayBilling: PayPal cancel failed — account NOT deleted", { userId, subscriptionId: user.paypalSubscriptionId }, err instanceof Error ? err : undefined)
      throw new AppError("cancel_failed", 409)
    }
    logger.info("stopGatewayBilling: PayPal subscription canceled", { userId, subscriptionId: user.paypalSubscriptionId })
    return { canceled: true, provider: "PAYPAL", subscriptionId: user.paypalSubscriptionId }
  }

  if (user.subscriptionId) {
    if (!stripeEnabled()) {
      logger.error("stopGatewayBilling: Stripe subscription on the row but Stripe is disabled — cancel it manually before purging", {
        userId,
        subscriptionId: user.subscriptionId,
      })
      throw new AppError("payments_not_configured", 503)
    }
    const cancel = clients.cancelStripe ?? (await defaultStripeCancel())
    try {
      await cancel(user.subscriptionId)
    } catch (err) {
      // Already gone at the gateway is a success for our purpose: nothing is billing.
      if (isAlreadyCanceled(err)) {
        logger.info("stopGatewayBilling: Stripe subscription already gone", { userId, subscriptionId: user.subscriptionId })
        return { canceled: true, provider: "STRIPE", subscriptionId: user.subscriptionId }
      }
      logger.error("stopGatewayBilling: Stripe cancel failed — account NOT deleted", { userId, subscriptionId: user.subscriptionId }, err instanceof Error ? err : undefined)
      throw new AppError("cancel_failed", 409)
    }
    logger.info("stopGatewayBilling: Stripe subscription canceled", { userId, subscriptionId: user.subscriptionId })
    return { canceled: true, provider: "STRIPE", subscriptionId: user.subscriptionId }
  }

  return { canceled: false }
}

/**
 * Stripe answers `resource_missing` for a subscription that no longer exists — the user
 * cancelled it in the portal minutes earlier, or an admin refund already killed it.
 * Nothing is charging them, which is the whole point, so this must not block deletion.
 */
function isAlreadyCanceled(err: unknown): boolean {
  const code = (err as { code?: unknown })?.code
  return code === "resource_missing"
}

// Lazy imports: the PayPal adapter constructor throws without credentials, and neither
// SDK should be pulled into a request that has no billing to cancel.
async function defaultStripeCancel(): Promise<(id: string) => Promise<unknown>> {
  const { stripeClient } = await import("@/lib/controllers/stripe-deps")
  return (id: string) => stripeClient.cancelSubscription(id)
}

// Goes to the adapter rather than PayPalBillingService on purpose: that service
// refuses an already-CANCELED subscription and a managed account, both of which must
// still be able to delete their account.
async function defaultPayPalCancel(): Promise<(id: string, reason: string) => Promise<unknown>> {
  const { PayPalClientAdapter } = await import("@/lib/services/paypal/PayPalClientAdapter")
  const adapter = new PayPalClientAdapter()
  return (id: string, reason: string) => adapter.cancelSubscription(id, reason)
}
