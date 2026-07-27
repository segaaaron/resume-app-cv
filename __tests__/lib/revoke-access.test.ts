/**
 * The rules that decide how much paid access an event may take away.
 *
 * Three times the same bug shipped, each time in a different handler, because each
 * path wrote the downgrade by hand:
 *   · 9d00b92 — subscription.deleted wiped a BASIC month bought separately.
 *   · ad025fa — a one-time purchase shortened a longer window already paid for.
 *   · this module's reason to exist — charge.refunded, dispute.created,
 *     early_fraud_warning and every PayPal path still had BOTH holes open.
 *
 * These are pure-function tests: no DB, no network, no mocks. If a rule here breaks,
 * every one of the seven revocation paths breaks with it — which is the point.
 */
import { describe, it, expect } from "vitest"
import {
  isOneTimePlanStillValid,
  laterOf,
  revokeAccess,
  scopeForCharge,
} from "@/lib/services/billing/revoke-access"
import { purchaseConfirmed, isActive, PAST_DUE_GRACE_DAYS } from "@/lib/plans"

const DAY = 86_400_000
const future = (days: number) => new Date(Date.now() + days * DAY)
const past = (days: number) => new Date(Date.now() - days * DAY)

describe("isOneTimePlanStillValid", () => {
  it("is true only for a one-time plan inside its paid window", () => {
    expect(isOneTimePlanStillValid("BASIC", future(20))).toBe(true)
    expect(isOneTimePlanStillValid("SPRINT", future(3))).toBe(true)
  })

  it("is false once the window has passed", () => {
    expect(isOneTimePlanStillValid("BASIC", past(1))).toBe(false)
    expect(isOneTimePlanStillValid("SPRINT", past(1))).toBe(false)
  })

  it("is false for subscription and free plans, whatever the date", () => {
    // PRO must still downgrade exactly as before — the protection is for one-time
    // windows only, never a blanket "don't touch this user".
    expect(isOneTimePlanStillValid("PRO", future(20))).toBe(false)
    expect(isOneTimePlanStillValid("UNSUBSCRIBED", future(20))).toBe(false)
    expect(isOneTimePlanStillValid("LIMITED", future(20))).toBe(false)
  })

  it("is false with no date at all", () => {
    expect(isOneTimePlanStillValid("BASIC", null)).toBe(false)
    expect(isOneTimePlanStillValid("BASIC", undefined)).toBe(false)
    expect(isOneTimePlanStillValid(null, future(20))).toBe(false)
  })
})

describe("laterOf — a paid end date never moves backwards", () => {
  it("keeps the existing date when it is further out", () => {
    const existing = future(27)
    expect(laterOf(future(7), existing)).toBe(existing)
  })

  it("takes the new date when it extends access", () => {
    const candidate = future(30)
    expect(laterOf(candidate, future(7))).toBe(candidate)
  })

  it("takes the candidate when there is nothing to compare", () => {
    const candidate = future(7)
    expect(laterOf(candidate, null)).toBe(candidate)
    expect(laterOf(candidate, undefined)).toBe(candidate)
  })
})

describe("scopeForCharge — which payment came back", () => {
  it("one-time metadata → the window goes with the refund", () => {
    expect(scopeForCharge({ planType: "basic" })).toBe("everything")
    expect(scopeForCharge({ planType: "sprint" })).toBe("everything")
  })

  it("subscription or unmarked charges → the one-time window is left alone", () => {
    expect(scopeForCharge({ planInterval: "monthly" })).toBe("subscription")
    expect(scopeForCharge({})).toBe("subscription")
    expect(scopeForCharge(null)).toBe("subscription")
    expect(scopeForCharge(undefined)).toBe("subscription")
  })
})

describe("revokeAccess", () => {
  it("never touches a managed (LIMITED) user", () => {
    // Their plan comes from an administrator, not from a payment. charge.refunded,
    // dispute.created and early_fraud_warning all skipped this check.
    for (const scope of ["subscription", "everything"] as const) {
      expect(revokeAccess({ plan: "LIMITED", subscriptionEndsAt: future(30), isManaged: true }, { gateway: "stripe", scope }))
        .toEqual({ skip: true, reason: "managed" })
    }
  })

  it("a subscription event detaches the subscription and keeps a paid one-time window", () => {
    const result = revokeAccess(
      { plan: "BASIC", subscriptionEndsAt: future(20) },
      { gateway: "stripe", scope: "subscription" },
    )
    expect(result).toEqual({
      skip: false,
      keptOneTimePlan: "BASIC",
      data: { subscriptionId: null, subscriptionStatus: "NONE", sessionVersion: { increment: 1 } },
    })
    // The two fields whose overwrite WAS the bug must be absent, not null.
    expect(result).not.toHaveProperty("data.plan")
    expect(result).not.toHaveProperty("data.subscriptionEndsAt")
  })

  it("a PRO user is downgraded by a subscription event exactly as before", () => {
    expect(revokeAccess({ plan: "PRO", subscriptionEndsAt: future(20) }, { gateway: "stripe", scope: "subscription" }))
      .toEqual({
        skip: false,
        keptOneTimePlan: null,
        data: { plan: "UNSUBSCRIBED", subscriptionId: null, subscriptionEndsAt: null, subscriptionStatus: "EXPIRED", sessionVersion: { increment: 1 } },
      })
  })

  it("refunding the one-time purchase itself takes the window back", () => {
    // scope "everything": the money for THIS window came back, so the access goes.
    expect(revokeAccess({ plan: "BASIC", subscriptionEndsAt: future(20) }, { gateway: "stripe", scope: "everything" }))
      .toMatchObject({ skip: false, keptOneTimePlan: null, data: { plan: "UNSUBSCRIBED", subscriptionEndsAt: null } })
  })

  it("an expired one-time window is downgraded like any other", () => {
    expect(revokeAccess({ plan: "BASIC", subscriptionEndsAt: past(1) }, { gateway: "stripe", scope: "subscription" }))
      .toMatchObject({ keptOneTimePlan: null, data: { plan: "UNSUBSCRIBED" } })
  })

  it("writes each gateway's own subscription column", () => {
    const stripe = revokeAccess({ plan: "PRO", subscriptionEndsAt: null }, { gateway: "stripe", scope: "subscription" })
    const paypal = revokeAccess({ plan: "PRO", subscriptionEndsAt: null }, { gateway: "paypal", scope: "subscription" })
    expect(stripe).toMatchObject({ data: { subscriptionId: null } })
    expect(paypal).toMatchObject({ data: { paypalSubscriptionId: null } })
    // Cross-contamination would silently leave the other gateway's id pointing at a
    // dead subscription.
    expect(stripe.skip === false && stripe.data).not.toHaveProperty("paypalSubscriptionId")
    expect(paypal.skip === false && paypal.data).not.toHaveProperty("subscriptionId")
  })

  it("both gateways answer identically for a protected one-time window", () => {
    // The PayPal paths never had this rule at all; they must not drift again.
    const stripe = revokeAccess({ plan: "SPRINT", subscriptionEndsAt: future(5) }, { gateway: "stripe", scope: "subscription" })
    const paypal = revokeAccess({ plan: "SPRINT", subscriptionEndsAt: future(5) }, { gateway: "paypal", scope: "subscription" })
    expect(stripe).toMatchObject({ keptOneTimePlan: "SPRINT" })
    expect(paypal).toMatchObject({ keptOneTimePlan: "SPRINT" })
  })

  it("always bumps sessionVersion so live sessions pick the change up", () => {
    for (const gateway of ["stripe", "paypal"] as const) {
      for (const scope of ["subscription", "everything"] as const) {
        const r = revokeAccess({ plan: "PRO", subscriptionEndsAt: future(1) }, { gateway, scope })
        expect(r.skip === false && r.data.sessionVersion).toEqual({ increment: 1 })
      }
    }
  })
})

describe("purchaseConfirmed — the post-checkout screen must recognise EVERY paid plan", () => {
  const future = new Date(Date.now() + 20 * 86_400_000)
  const past = new Date(Date.now() - 86_400_000)

  it("confirms a PRO subscription, including while payment is retrying", () => {
    expect(purchaseConfirmed({ plan: "PRO", subscriptionStatus: "ACTIVE" })).toBe(true)
    // PAST_DUE is provisioned and still grants access while Stripe retries.
    expect(purchaseConfirmed({ plan: "PRO", subscriptionStatus: "PAST_DUE" })).toBe(true)
  })

  it("confirms one-time plans by their paid window", () => {
    // THE BUG: the screen asked `plan === "PRO"`, so these two never matched. The buyer
    // watched a spinner for the full 30s timeout after a payment that had succeeded.
    expect(purchaseConfirmed({ plan: "BASIC", subscriptionEndsAt: future })).toBe(true)
    expect(purchaseConfirmed({ plan: "SPRINT", subscriptionEndsAt: future })).toBe(true)
    // Accepts the ISO string the API actually returns, not just a Date.
    expect(purchaseConfirmed({ plan: "BASIC", subscriptionEndsAt: future.toISOString() })).toBe(true)
  })

  it("does not confirm a purchase that has not landed yet", () => {
    // Still polling: the webhook has not written anything.
    expect(purchaseConfirmed({ plan: "UNSUBSCRIBED", subscriptionStatus: "NONE" })).toBe(false)
    expect(purchaseConfirmed({ plan: "PRO", subscriptionStatus: "NONE" })).toBe(false)
    expect(purchaseConfirmed({ plan: "BASIC", subscriptionEndsAt: null })).toBe(false)
    expect(purchaseConfirmed({ plan: "BASIC", subscriptionEndsAt: past })).toBe(false)
    expect(purchaseConfirmed({})).toBe(false)
  })

  it("does not confirm for a managed user, who bought nothing", () => {
    expect(purchaseConfirmed({ plan: "LIMITED", subscriptionEndsAt: future })).toBe(false)
  })
})

describe("unpaid subscriptions cannot outlive the period they paid for", () => {
  // Stripe's Dashboard decides what happens after Smart Retries give up, and only ONE
  // of the three options tells us about it:
  //   · "Cancel the subscription" → canceled → customer.subscription.deleted → we downgrade.
  //   · "Mark the subscription as unpaid" → stays `unpaid` forever, no deleted event.
  //   · "Leave the subscription past-due" → stays `past_due` forever, no deleted event.
  // Our webhook maps BOTH unpaid and past_due to PAST_DUE, which grants access. If the
  // setting is either of the last two, nothing would ever revoke the plan.
  //
  // What saves us is the date check in isActive(): PAST_DUE keeps access only until the
  // period that was actually PAID runs out. These tests exist so that check is never
  // "simplified" away — deleting it turns a Dashboard toggle into free PRO forever.
  const DAY = 86_400_000

  it("PAST_DUE keeps access while the paid period is still running", () => {
    // Stripe is retrying and the customer already paid for this period. Cutting them off
    // mid-cycle over an expired card is what dunning exists to avoid.
    expect(isActive("PRO", new Date(Date.now() + 5 * DAY), "PAST_DUE", "USER")).toBe(true)
  })

  it("PAST_DUE stops granting access once the paid period AND its grace window elapse", () => {
    // No customer.subscription.deleted will ever arrive under two of the three Dashboard
    // settings. This is the only thing standing between us and unpaid PRO access — the
    // grace window delays it by a bounded number of days, it never removes it.
    expect(isActive("PRO", new Date(Date.now() - 30 * DAY), "PAST_DUE", "USER")).toBe(false)
  })

  it("the same holds for a cancelled subscription winding down", () => {
    expect(isActive("PRO", new Date(Date.now() + 5 * DAY), "CANCELED", "USER")).toBe(true)
    expect(isActive("PRO", new Date(Date.now() - DAY), "CANCELED", "USER")).toBe(false)
  })

  it("an admin keeps access regardless — their plan is not a payment", () => {
    expect(isActive("PRO", new Date(Date.now() - DAY), "PAST_DUE", "SUPER_ADMIN")).toBe(true)
  })
})

describe("PAST_DUE grace window — the recoverable slice of churn", () => {
  const DAY = 86_400_000
  const daysFromNow = (n: number) => new Date(Date.now() + n * DAY)

  it("keeps access for the configured days after the paid period ends", () => {
    // Stripe retries for up to 14 days. Ending access on day one of that recovery is
    // what turns a recoverable failed payment into a lost customer.
    expect(PAST_DUE_GRACE_DAYS).toBe(7)
    expect(isActive("PRO", daysFromNow(-1), "PAST_DUE", "USER")).toBe(true)
    expect(isActive("PRO", daysFromNow(-6), "PAST_DUE", "USER")).toBe(true)
  })

  it("ends access once the grace window is over", () => {
    // Still no customer.subscription.deleted under two of the three Dashboard settings,
    // so this date check remains the only thing that stops indefinite free access.
    expect(isActive("PRO", daysFromNow(-(PAST_DUE_GRACE_DAYS + 1)), "PAST_DUE", "USER")).toBe(false)
  })

  it("grants NO grace to someone who cancelled", () => {
    // They chose to leave and get exactly what they paid for. Nobody is trying to
    // collect from them, so there is nothing to recover by extending it.
    expect(isActive("PRO", daysFromNow(-1), "CANCELED", "USER")).toBe(false)
    expect(isActive("PRO", daysFromNow(1), "CANCELED", "USER")).toBe(true)
  })

  it("grants no grace to an ACTIVE subscription whose date has passed", () => {
    // An ACTIVE status with an elapsed date means the renewal never landed; treating it
    // as paid would hand out access on stale data.
    expect(isActive("PRO", daysFromNow(-1), "ACTIVE", "USER")).toBe(false)
  })

  it("EXPIRED is final, whatever the date says", () => {
    expect(isActive("PRO", daysFromNow(30), "EXPIRED", "USER")).toBe(false)
  })

  it("one-time plans are untouched by the grace window", () => {
    // BASIC/SPRINT carry no subscription and cannot be PAST_DUE — their window is the
    // whole contract.
    expect(isActive("BASIC", daysFromNow(-1), "NONE", "USER")).toBe(false)
    expect(isActive("SPRINT", daysFromNow(-1), "NONE", "USER")).toBe(false)
  })
})
