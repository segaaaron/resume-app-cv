/**
 * Reported twice: a user with PRO access clicked the action on the Pro card at
 * /pricing and got the generic toast "Error starting the payment".
 *
 * Root cause, both times: `subscriptionStatus` was treated as proof that a gateway
 * is billing the user. It is not. A row granted outside checkout (admin grant,
 * manual DB fix, migrated data) carries ACTIVE with no `stripeCustomerId` and no
 * PayPal agreement, and then:
 *   · the portal 400s — `createPortalSession` needs a customer to open;
 *   · a checkout is refused too — `blocksNewPurchase` sees a live subscription;
 *   · "cancel first, then switch" points at something that does not exist.
 *
 * The rule now lives in three named questions in lib/plans.ts —
 * `hasManageableBilling` (status), `hasGatewayBilling` (is money really moving),
 * `hasStripeBillingPortal` (can the portal open) — and the Pro card no longer opens
 * the portal at all: a live subscription means the switch cannot start from there,
 * so it says so. The portal stays in the Pro banner and in Settings, where it is
 * the manage action it claims to be.
 *
 * SCOPE: /pricing. The same customer-less row still meets an ungated portal button
 * in dashboard/settings (SettingsForm) and in the resumes dashboard (ProBanner);
 * both will show their own error toast until they adopt `hasStripeBillingPortal`.
 *
 * There is no @testing-library here, so the server component and the button cannot
 * be rendered. The pure rules are tested directly; the wiring is asserted against
 * the source, which cannot prove the rendered output but does fail if the guards
 * are removed.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import {
  hasManageableBilling,
  hasGatewayBilling,
  hasStripeBillingPortal,
  isStaffAccess,
  blocksNewPurchase,
} from "@/lib/plans"
import en from "@/messages/en.json"
import es from "@/messages/es.json"

const read = (f: string) => readFileSync(join(process.cwd(), f), "utf8")
const PRICING_PAGE = "app/[locale]/pricing/page.tsx"
const BUTTONS = "components/marketing/PricingButtons.tsx"

describe("a status is not proof that a gateway is billing the user", () => {
  it("hasManageableBilling answers about the STATUS only", () => {
    // True for the exact row that produced the reported toast, which is why it can
    // never be the whole gate on its own.
    expect(hasManageableBilling("ACTIVE")).toBe(true)
    expect(hasManageableBilling("PAST_DUE")).toBe(true)
    expect(hasManageableBilling("CANCELED")).toBe(true)
    expect(hasManageableBilling("NONE")).toBe(false)
    expect(hasManageableBilling("EXPIRED")).toBe(false)
    expect(hasManageableBilling(null)).toBe(false)
  })

  it("hasGatewayBilling requires a real relationship at Stripe or PayPal", () => {
    // The reported row: access, ACTIVE, nothing behind it.
    expect(hasGatewayBilling("ACTIVE", null, null)).toBe(false)
    expect(hasGatewayBilling("ACTIVE", null, "STRIPE")).toBe(false)
    expect(hasGatewayBilling("CANCELED", null, null)).toBe(false)
    // Real Stripe subscriber, in every manageable status.
    expect(hasGatewayBilling("ACTIVE", "cus_1", "STRIPE")).toBe(true)
    expect(hasGatewayBilling("PAST_DUE", "cus_1", "STRIPE")).toBe(true)
    expect(hasGatewayBilling("CANCELED", "cus_1", "STRIPE")).toBe(true)
    // PayPal never writes a stripeCustomerId — judging them by one would strip the
    // only cancel route they have.
    expect(hasGatewayBilling("ACTIVE", null, "PAYPAL")).toBe(true)
    // A leftover customer with no live status is not billing.
    expect(hasGatewayBilling("NONE", "cus_1", "STRIPE")).toBe(false)
  })

  it("hasStripeBillingPortal demands BOTH the status and the customer", () => {
    expect(hasStripeBillingPortal("ACTIVE", null)).toBe(false)
    expect(hasStripeBillingPortal("ACTIVE", undefined)).toBe(false)
    expect(hasStripeBillingPortal("CANCELED", null)).toBe(false)
    expect(hasStripeBillingPortal("ACTIVE", "cus_1")).toBe(true)
    expect(hasStripeBillingPortal("PAST_DUE", "cus_1")).toBe(true)
    expect(hasStripeBillingPortal("CANCELED", "cus_1")).toBe(true)
    expect(hasStripeBillingPortal("NONE", "cus_1")).toBe(false)
  })

  it("an admin whose ACTIVE status has no gateway behind it IS staff access", () => {
    // The CEO's own row. Called with the gateway answer, it stops being described as
    // a subscription: no "your plan renews on X", no portal button, no one-time card
    // locked behind a date that never arrives.
    expect(isStaffAccess("SUPER_ADMIN", "ACTIVE", false)).toBe(true)
    expect(isStaffAccess("SUPER_ADMIN", "CANCELED", false)).toBe(true)
    // An admin who really did subscribe is a subscriber, not staff.
    expect(isStaffAccess("SUPER_ADMIN", "ACTIVE", true)).toBe(false)
    // Non-admins are never staff, whatever their billing looks like.
    expect(isStaffAccess("USER", "ACTIVE", false)).toBe(false)
    expect(isStaffAccess("USER", "NONE", false)).toBe(false)
    // Back-compat: without the third argument it answers from the status, as before.
    expect(isStaffAccess("SUPER_ADMIN", "NONE")).toBe(true)
    expect(isStaffAccess("SUPER_ADMIN", "ACTIVE")).toBe(false)
  })
})

describe("/pricing offers no action the backend would reject", () => {
  it("the page reads stripeCustomerId and resolves real billing from it", () => {
    const src = read(PRICING_PAGE)
    expect(src, "stripeCustomerId is not selected — the page cannot know if billing is real")
      .toMatch(/stripeCustomerId:\s*true/)
    expect(src, "the page does not use the shared gateway rule").toContain("hasGatewayBilling")
    // Staff detection must receive that answer, or an admin is described as a subscriber.
    expect(src).toMatch(/isStaffAccessFn\(\s*dbUser\.role,\s*dbUser\.subscriptionStatus,\s*hasRealBilling\s*\)/)
  })

  it("the portal is offered only when it can actually open", () => {
    const src = read(PRICING_PAGE)
    const assignment = src.match(/canManageBilling\s*=\s*dbUser[\s\S]{0,240}/)?.[0] ?? ""
    expect(assignment, "canManageBilling is no longer derived from the user row").not.toBe("")
    expect(assignment, "the PayPal branch is gone — those payers lose their manage action")
      .toContain("PAYPAL")
    expect(assignment).toContain("hasStripeBillingPortal")
  })

  it("the Pro card never calls the billing portal", () => {
    // It used to: a user aiming for annual clicked "manage subscription" and, with no
    // customer, got the error toast. The card explains the rule instead.
    expect(read(BUTTONS), "the Pro card can still fire a portal request")
      .not.toContain("/api/stripe/portal")
  })

  it("a blocked switch explains how to proceed, in one shared block", () => {
    const src = read(BUTTONS)
    // Blocked downgrade and blocked switch are the same situation and get the same
    // answer. Duplicating the copy is how the two drift apart.
    expect(src).toMatch(/const blockedUntilPlanEnds =/)
    expect(src).toMatch(/if \(downgradeBlocked\) return blockedUntilPlanEnds/)
    expect(src).toMatch(/if \(switchBlocked\) return blockedUntilPlanEnds/)
  })

  it("a row with no gateway is sent to support, not told to cancel nothing", () => {
    const src = read(BUTTONS)
    // Must cover EVERY blocked card (Pro switch and one-time downgrade alike) and
    // must be checked BEFORE them — both of those tell the user to cancel or wait for
    // a plan that, for this row, does not exist at any gateway.
    const support = src.indexOf("billingNeedsSupport) {")
    expect(support, "the support branch is gone").toBeGreaterThan(-1)
    expect(src.slice(0, support)).toMatch(/if \(\(downgradeBlocked \|\| switchBlocked\) &&/)
    expect(support, "support must be decided before the cancel-or-wait blocks")
      .toBeLessThan(src.indexOf("if (downgradeBlocked) return blockedUntilPlanEnds"))
    expect(read(PRICING_PAGE)).toMatch(/billingNeedsSupport\s*=\s*!isStaffAccess/)
  })

  it("the support state reaches all three cards, not just Pro", () => {
    // The one-time cards get their own copy from the same flag; a Pro-only wiring
    // would leave BASIC/SPRINT telling this row to cancel a plan it never had.
    const src = read("components/marketing/PricingClientSection.tsx")
    expect(src.match(/billingNeedsSupport=\{billingNeedsSupport\}/g) ?? []).toHaveLength(3)
  })

  it("every message the blocked states need exists in both locales", () => {
    for (const messages of [en, es]) {
      const pricing = (messages as { pricing: Record<string, string> }).pricing
      expect(pricing.plan_change_when_current_ends).toBeTruthy()
      // Name the action (cancel) and where (Settings), or the user is told "no"
      // without being told how to proceed.
      expect(pricing.plan_change_cancel_first).toMatch(/Settings|Ajustes/)
      expect(pricing.plan_change_cancel_first_on).toMatch(/\{date\}/)
      expect(pricing.plan_change_available_on).toMatch(/\{date\}/)
      expect(pricing.plan_change_unavailable).toBeTruthy()
      expect(pricing.plan_change_contact_support).toBeTruthy()
      // Last line of defence for the banner's portal button.
      expect(pricing.toast_no_billing_to_manage).toBeTruthy()
    }
  })

  it("the banner names the real cause when a 400 still reaches the toast", () => {
    expect(read("components/marketing/ManageBillingButton.tsx"))
      .toContain("no_active_subscription")
  })
})

describe("the card state matches what the backend would do, status by status", () => {
  // Mirrors the props /pricing computes, so a rule change that breaks a scenario
  // fails here instead of in production.
  const card = (status: string, customerId: string | null, provider: string | null) => ({
    proBlocked: blocksNewPurchase(status, false),
    oneTimeBlocked: blocksNewPurchase(status, true),
    portal: provider === "PAYPAL"
      ? hasGatewayBilling(status, customerId, provider)
      : hasStripeBillingPortal(status, customerId),
    needsSupport: !hasGatewayBilling(status, customerId, provider) && hasManageableBilling(status),
  })

  it("real PRO subscriber, monthly, wants annual: told to cancel or wait, no request", () => {
    const s = card("ACTIVE", "cus_1", "STRIPE")
    expect(s.proBlocked).toBe(true)      // backend refuses the checkout → card explains
    expect(s.needsSupport).toBe(false)   // ordinary "cancel first" copy, not support
    expect(s.portal).toBe(true)          // banner above still opens the portal
  })

  it("PRO row with no Stripe customer: support, never an error toast", () => {
    const s = card("ACTIVE", null, "STRIPE")
    expect(s.portal).toBe(false)
    expect(s.needsSupport).toBe(true)
    expect(s.proBlocked).toBe(true)
  })

  it("cancelled subscriber: can re-subscribe, cannot downgrade to one-time yet", () => {
    const s = card("CANCELED", "cus_1", "STRIPE")
    expect(s.proBlocked).toBe(false)     // upgrade/switch allowed — sale not lost
    expect(s.oneTimeBlocked).toBe(true)  // would wipe the window they paid for
    expect(s.portal).toBe(true)
    expect(s.needsSupport).toBe(false)
  })

  it("past due: keeps the portal so the card can be fixed", () => {
    const s = card("PAST_DUE", "cus_1", "STRIPE")
    expect(s.portal).toBe(true)
    expect(s.proBlocked).toBe(true)
    expect(s.needsSupport).toBe(false)
  })

  it("PayPal subscriber: manage action survives with no Stripe customer", () => {
    const s = card("ACTIVE", null, "PAYPAL")
    expect(s.portal).toBe(true)          // routed to Settings, not the Stripe portal
    expect(s.needsSupport).toBe(false)
  })

  it("one-time buyer (BASIC/SPRINT, status NONE): can upgrade to PRO", () => {
    const s = card("NONE", "cus_1", "STRIPE")
    expect(s.proBlocked).toBe(false)
    expect(s.oneTimeBlocked).toBe(false)
    expect(s.portal).toBe(false)         // nothing recurring to manage
    expect(s.needsSupport).toBe(false)
  })

  it("free user: everything buyable, nothing to manage", () => {
    const s = card("NONE", null, null)
    expect(s.proBlocked).toBe(false)
    expect(s.oneTimeBlocked).toBe(false)
    expect(s.portal).toBe(false)
    expect(s.needsSupport).toBe(false)
  })

  it("expired subscription: buyable again, no stale manage action", () => {
    const s = card("EXPIRED", "cus_1", "STRIPE")
    expect(s.proBlocked).toBe(false)
    expect(s.oneTimeBlocked).toBe(false)
    expect(s.portal).toBe(false)
    expect(s.needsSupport).toBe(false)
  })

  it("admin with no gateway: staff access, so no support message either", () => {
    const status = "ACTIVE"
    const realBilling = hasGatewayBilling(status, null, null)
    const staff = isStaffAccess("SUPER_ADMIN", status, realBilling)
    expect(staff).toBe(true)
    // billingNeedsSupport is gated on !isStaffAccess — staff see the admin state.
    expect(!staff && !realBilling && hasManageableBilling(status)).toBe(false)
  })
})

describe("failures never sign the buyer out — they explain and stay put", () => {
  const BUTTONS_SRC = "components/marketing/PricingButtons.tsx"
  const DASHBOARD_SRC = "components/dashboard/ResumesDashboard.tsx"

  it("a 503 from our own gateway config shows the reason instead of pushing to /register", () => {
    // payments_not_configured / plan_not_configured are OUR failure. This used to share
    // the 401 branch, so a signed-in buyer was pushed to /register with no message.
    const src = read(BUTTONS_SRC)
    const block = src.slice(src.indexOf("res.status === 503"), src.indexOf("res.status === 503") + 240)
    expect(block).toContain("toast_payments_unavailable")
    expect(block, "a service failure still navigates the user away").not.toContain("router.push")
  })

  it("only a 401 sends the user to register, and it carries the plan", () => {
    const src = read(BUTTONS_SRC)
    const block = src.slice(src.indexOf("res.status === 401"), src.indexOf("res.status === 401") + 160)
    expect(block).toMatch(/router\.push\(`\/register\?plan=\$\{plan\}`\)/)
  })

  it("no checkout failure path signs the user out", () => {
    // Losing the session on a declined card or a gateway error would be the worst
    // possible response: the buyer is bounced to login for something they did not cause.
    const src = read(BUTTONS_SRC)
    expect(src).not.toContain("logoutAction")
    expect(src).not.toContain("signOut")
  })

  it("the post-purchase logout runs ONLY after the webhook is confirmed", () => {
    // The sign-out exists to refresh a JWT that now carries a new plan. Firing it before
    // the webhook landed would log the buyer out and show them their OLD plan.
    const src = read(DASHBOARD_SRC)
    const confirmBlock = src.slice(src.indexOf("if (purchaseConfirmed(data))"))
    const logoutAt = confirmBlock.indexOf("logoutAction")
    expect(logoutAt, "logout is no longer inside the confirmed branch").toBeGreaterThan(-1)
    // And it must be the only automatic one: every other occurrence is user-initiated
    // (the timeout screen's button).
    expect(src.match(/logoutTimerRef\.current = setTimeout/g) ?? []).toHaveLength(1)
  })

  it("a transient polling error keeps waiting instead of giving up", () => {
    const src = read(DASHBOARD_SRC)
    expect(src).toMatch(/catch \{ \/\* transient error — keep polling \*\/ \}/)
  })

  it("both locales carry the service-unavailable message", () => {
    for (const messages of [en, es]) {
      const pricing = (messages as { pricing: Record<string, string> }).pricing
      expect(pricing.toast_payments_unavailable).toBeTruthy()
    }
  })
})
