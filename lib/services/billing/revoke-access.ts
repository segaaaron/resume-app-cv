// The single definition of "take paid access away", shared by BOTH gateways.
//
// Seven webhook paths revoke access — Stripe's subscription.deleted, charge.refunded,
// dispute.created and early-fraud-warning, plus PayPal's expire, refund and (via the
// same rules) one-time provisioning. Each of them used to write the downgrade by hand,
// and the result was the same bug found three times:
//
//   · 9d00b92 — subscription.deleted reset a user to UNSUBSCRIBED and nulled
//     subscriptionEndsAt, wiping a BASIC month bought separately while the old
//     subscription wound down.
//   · ad025fa — a one-time purchase overwrote subscriptionEndsAt blindly, so buying
//     SPRINT (7 days) on day 3 of BASIC (1 month) cut ~27 paid days down to 7.
//   · This module — the SAME two holes, still open in charge.refunded,
//     dispute.created, early_fraud_warning and in every PayPal path, because each
//     fix landed only where the symptom was reported.
//
// Two invariants, in one place so no path can forget them:
//   1. A paid one-time window (BASIC/SPRINT) is never shortened or erased by an event
//      about something else. It was paid for separately and carries no subscription.
//   2. A managed (LIMITED) user is never touched by gateway events — their plan comes
//      from an administrator, not from a payment.

/** Plan values that represent a separately paid, time-boxed window. */
const ONE_TIME_PLANS = ["BASIC", "SPRINT"] as const

/**
 * The user is on a one-time plan (BASIC/SPRINT) whose paid window has NOT elapsed.
 *
 * These plans carry no subscription — provisioning sets `subscriptionId` to null and
 * `subscriptionStatus` to "NONE" — so nothing about a subscription may move their plan
 * or their end date.
 */
export function isOneTimePlanStillValid(
  plan: string | null | undefined,
  subscriptionEndsAt: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!plan || !(ONE_TIME_PLANS as readonly string[]).includes(plan)) return false
  return subscriptionEndsAt != null && subscriptionEndsAt > now
}

/**
 * Never move a paid end date EARLIER. Subscription events carry the subscription's own
 * period end, which can sit before a one-time window bought on top of it; writing it
 * verbatim would silently shorten access the user already paid for.
 */
export function laterOf(candidate: Date, current: Date | null | undefined): Date {
  return current && current > candidate ? current : candidate
}

export type Gateway = "stripe" | "paypal"

/**
 * How much access the event is entitled to take away.
 *
 * · "subscription" — the event concerns the RECURRING relationship (subscription
 *   deleted/expired, or a refund/dispute/fraud warning on a subscription invoice).
 *   A one-time window bought separately survives: nobody refunded it.
 * · "everything"   — the event concerns the one-time purchase itself, or the payment
 *   behind the current access (a refunded one-time charge). The window goes with it.
 *
 * When a caller cannot tell, "everything" is the safe answer for the business: money
 * came back, so access goes away.
 */
export type RevocationScope = "subscription" | "everything"

export interface RevocationInput {
  plan: string | null | undefined
  subscriptionEndsAt: Date | null | undefined
  isManaged?: boolean | null
}

export type Revocation =
  /** Managed user — gateway events must not touch their administrator-granted plan. */
  | { skip: true; reason: "managed" }
  | {
      skip: false
      /** The one-time plan that survived this event, or null when access was fully revoked. */
      keptOneTimePlan: string | null
      /** Field updates to apply to the user row. Callers add nothing else. */
      data: Record<string, unknown>
    }

/**
 * Decide what a revocation event may write. Pure: no DB, no network — the money-critical
 * decision is deterministic and unit-testable, and the caller applies it inside its own
 * transaction.
 */
export function revokeAccess(
  user: RevocationInput,
  opts: { gateway: Gateway; scope: RevocationScope; now?: Date },
): Revocation {
  if (user.isManaged) return { skip: true, reason: "managed" }

  // Each gateway stores its subscription id in its own column; everything else about
  // the downgrade is identical, which is exactly why this lives in one function.
  const subscriptionIdField = opts.gateway === "stripe" ? "subscriptionId" : "paypalSubscriptionId"

  if (opts.scope === "subscription" && isOneTimePlanStillValid(user.plan, user.subscriptionEndsAt, opts.now)) {
    // Detach the subscription and leave the paid window alone. `plan` and
    // `subscriptionEndsAt` are deliberately absent: touching either is the bug.
    return {
      skip: false,
      keptOneTimePlan: user.plan as string,
      data: {
        [subscriptionIdField]: null,
        subscriptionStatus: "NONE",
        sessionVersion: { increment: 1 },
      },
    }
  }

  return {
    skip: false,
    keptOneTimePlan: null,
    data: {
      plan: "UNSUBSCRIBED",
      [subscriptionIdField]: null,
      subscriptionEndsAt: null,
      subscriptionStatus: "EXPIRED",
      sessionVersion: { increment: 1 },
    },
  }
}

/**
 * Which access a refunded/disputed/flagged Stripe charge is entitled to revoke.
 *
 * The discriminator is OUR OWN metadata: one-time checkouts stamp `planType`
 * (`basic`/`sprint`) onto the PaymentIntent, so its charge carries it too. Present →
 * the refund IS the one-time purchase, and its window goes back with the money. Absent
 * → the charge belongs to the subscription, which may not touch a one-time window
 * bought separately.
 *
 * Stripe's own `charge.invoice` would have answered this, but it no longer exists in
 * the current API/SDK (v22) — the invoice→payment relation was inverted. Reading our
 * own metadata needs no extra API call and cannot be broken by another API upgrade.
 *
 * The propagation this relies on is documented behaviour, verified against Stripe's
 * Payment Intents guide: "When a PaymentIntent creates a charge, the PaymentIntent
 * copies its metadata to the charge." The documented caveat — later updates to the
 * PaymentIntent do NOT reach charges already created — does not apply here: the
 * metadata is set at checkout, before the charge exists, and never updated afterwards.
 *
 * KNOWN LIMIT — charges created BEFORE the checkout started stamping this metadata have
 * none, so a refund of an old one-time purchase reads as "subscription" and leaves the
 * paid window standing. That errs toward the user keeping access they were refunded for
 * (visible in the REFUND_ISSUED audit entry, which records the scope), never toward
 * erasing a window they still own. Only affects purchases made before this deploy.
 */
export function scopeForCharge(metadata: Record<string, string> | null | undefined): RevocationScope {
  const planType = metadata?.planType
  return planType === "basic" || planType === "sprint" ? "everything" : "subscription"
}
