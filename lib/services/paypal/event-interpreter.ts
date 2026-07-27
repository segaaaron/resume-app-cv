// Pure interpreter: PayPal webhook event → an intended provisioning ACTION.
// Kept pure (no DB, no network) so the money-critical event→plan mapping is
// deterministic and unit-testable. PayPalWebhookService applies the action
// atomically; this file only decides WHAT should happen.
//
// Exact resource field paths are per PayPal's documented payloads; the ones
// marked "confirm in sandbox" are validated against the first real event before
// go-live (they never run until paypalEnabled() + the route are wired).

export type PayPalInterval = "monthly" | "annual"

export type PayPalAction =
  | { kind: "provision-pro"; userId?: string; subscriptionId: string; interval: PayPalInterval | null; endsAt?: string }
  | { kind: "renew-pro"; subscriptionId: string; endsAt?: string }
  | { kind: "cancel-pro"; subscriptionId: string } // keep access until endsAt
  | { kind: "suspend-pro"; subscriptionId: string } // treat as PAST_DUE
  | { kind: "payment-failed"; subscriptionId: string } // PAST_DUE
  | { kind: "expire-pro"; subscriptionId: string } // → UNSUBSCRIBED
  | { kind: "provision-onetime"; userId: string; plan: "BASIC" | "SPRINT"; orderId?: string }
  /**
   * Money went back. `scope` says HOW MUCH access goes with it:
   *   · "subscription" — a recurring charge was refunded. A BASIC/SPRINT window bought
   *     separately survives; nobody refunded it.
   *   · "everything"   — the one-time purchase itself was refunded, so its window goes.
   * PayPal splits these into two event types, so the answer is exact, not a guess.
   */
  | { kind: "refund"; subscriptionId?: string; userId?: string; scope: "subscription" | "everything" }
  | { kind: "ignore"; reason: string }

export interface PlanIdMap {
  monthly?: string
  annual?: string
}

type AnyRecord = Record<string, unknown>
const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined)
const obj = (v: unknown): AnyRecord | undefined => (v && typeof v === "object" ? (v as AnyRecord) : undefined)

/** Map a plan_id to our interval by comparing against the configured plan ids. */
function intervalFor(planId: string | undefined, plans: PlanIdMap): PayPalInterval | null {
  if (!planId) return null
  if (plans.monthly && planId === plans.monthly) return "monthly"
  if (plans.annual && planId === plans.annual) return "annual"
  return null
}

/**
 * custom_id we set at checkout:
 *   - subscriptions (PRO): "<userId>"
 *   - one-time orders:     "<userId>|BASIC" or "<userId>|SPRINT"
 * Parse both shapes.
 */
function parseCustomId(custom: string | undefined): { userId?: string; plan?: "BASIC" | "SPRINT" } {
  if (!custom) return {}
  const [userId, planRaw] = custom.split("|")
  const plan = planRaw === "BASIC" || planRaw === "SPRINT" ? planRaw : undefined
  return { userId: userId || undefined, plan }
}

/**
 * Interpret a verified PayPal webhook event into an action. Returns `ignore`
 * for anything we don't act on (unknown types, payouts, etc.) so the handler
 * can safely 200 them.
 */
export function interpretEvent(event: unknown, plans: PlanIdMap): PayPalAction {
  const e = obj(event)
  const type = str(e?.event_type)
  const resource = obj(e?.resource)
  if (!type || !resource) return { kind: "ignore", reason: "no_type_or_resource" }

  switch (type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED": {
      const subscriptionId = str(resource.id)
      if (!subscriptionId) return { kind: "ignore", reason: "no_subscription_id" }
      const { userId } = parseCustomId(str(resource.custom_id))
      const endsAt = str(obj(resource.billing_info)?.next_billing_time)
      return { kind: "provision-pro", userId, subscriptionId, interval: intervalFor(str(resource.plan_id), plans), endsAt }
    }

    case "PAYMENT.SALE.COMPLETED": {
      // Recurring charge. Links to the subscription via billing_agreement_id.
      const subscriptionId = str(resource.billing_agreement_id)
      if (!subscriptionId) return { kind: "ignore", reason: "not_subscription_sale" }
      return { kind: "renew-pro", subscriptionId }
    }

    case "BILLING.SUBSCRIPTION.CANCELLED": {
      const subscriptionId = str(resource.id)
      return subscriptionId ? { kind: "cancel-pro", subscriptionId } : { kind: "ignore", reason: "no_subscription_id" }
    }

    case "BILLING.SUBSCRIPTION.SUSPENDED": {
      const subscriptionId = str(resource.id)
      return subscriptionId ? { kind: "suspend-pro", subscriptionId } : { kind: "ignore", reason: "no_subscription_id" }
    }

    case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
      const subscriptionId = str(resource.id)
      return subscriptionId ? { kind: "payment-failed", subscriptionId } : { kind: "ignore", reason: "no_subscription_id" }
    }

    case "BILLING.SUBSCRIPTION.EXPIRED": {
      const subscriptionId = str(resource.id)
      return subscriptionId ? { kind: "expire-pro", subscriptionId } : { kind: "ignore", reason: "no_subscription_id" }
    }

    case "PAYMENT.CAPTURE.COMPLETED": {
      // One-time BASIC/SPRINT. Plan + user come from custom_id set at checkout.
      const { userId, plan } = parseCustomId(str(resource.custom_id))
      if (!userId || !plan) return { kind: "ignore", reason: "not_onetime_capture" }
      return { kind: "provision-onetime", userId, plan, orderId: str(resource.id) }
    }

    // REVERSED is a chargeback: the money is gone the same way a refund takes it, so it
    // revokes the same access. Stripe has charge.dispute.created for this; PayPal had
    // nothing, which meant a customer could charge back and keep PRO indefinitely.
    case "PAYMENT.SALE.REFUNDED":
    case "PAYMENT.SALE.REVERSED": {
      // A SALE is a recurring subscription charge → subscription scope only.
      return { kind: "refund", subscriptionId: str(resource.billing_agreement_id), scope: "subscription" }
    }
    case "PAYMENT.CAPTURE.REFUNDED":
    case "PAYMENT.CAPTURE.REVERSED": {
      // resource.id here is the REFUND's own id, not the capture/order id — it
      // never matches our stored paypalOrderId. PayPal echoes the original
      // custom_id ("<userId>|BASIC"/"<userId>|SPRINT") onto the refund resource
      // too, so resolve the user the same way provision-onetime does.
      // A CAPTURE is the one-time purchase itself → the paid window goes back with it.
      const { userId } = parseCustomId(str(resource.custom_id))
      return { kind: "refund", userId, scope: "everything" }
    }

    default:
      return { kind: "ignore", reason: `unhandled:${type}` }
  }
}
