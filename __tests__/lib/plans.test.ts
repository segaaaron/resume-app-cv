import { describe, it, expect } from "vitest"
import {
  getLimits,
  isActive,
  effectivePlan,
  canUsePremiumTemplates,
  canUseAdvancedAts,
  hasManageableBilling,
  blocksNewPurchase,
  isStaffAccess,
  PLAN_LIMITS,
} from "@/lib/plans"

const future = new Date(Date.now() + 1000 * 60 * 60) // +1h
const past = new Date(Date.now() - 1000 * 60 * 60) // -1h

describe("plans · BASIC + SPRINT capabilities", () => {
  describe("getLimits", () => {
    it("BASIC: can export, ALL AI blocked", () => {
      const l = getLimits("BASIC")
      expect(l.canExportPdf).toBe(true)
      expect(Object.values(l.aiLimitsByEndpoint).every((v) => v === 0)).toBe(true)
    })

    it("SPRINT: content AI unlimited, but tailor/ats/review blocked", () => {
      const l = getLimits("SPRINT")
      expect(l.canExportPdf).toBe(true)
      expect(l.aiLimitsByEndpoint["fill-profile"]).toBe(-1)
      expect(l.aiLimitsByEndpoint["improve-bullet"]).toBe(-1)
      expect(l.aiLimitsByEndpoint["generate-cover-letter"]).toBe(-1)
      expect(l.aiLimitsByEndpoint["tailor-cv"]).toBe(0)
      expect(l.aiLimitsByEndpoint["ats-score"]).toBe(0)
      expect(l.aiLimitsByEndpoint["review-cv"]).toBe(0)
    })

    it("UNSUBSCRIBED: ALL AI blocked (no free AI of any kind)", () => {
      const l = getLimits("UNSUBSCRIBED")
      expect(Object.values(l.aiLimitsByEndpoint).every((v) => v === 0)).toBe(true)
    })

    it("unknown plan falls back to UNSUBSCRIBED limits", () => {
      expect(getLimits("WHATEVER")).toBe(PLAN_LIMITS.UNSUBSCRIBED)
    })
  })

  describe("effectivePlan", () => {
    it("BASIC within window stays BASIC", () => {
      expect(effectivePlan({ plan: "BASIC", subscriptionEndsAt: future })).toBe("BASIC")
    })
    it("SPRINT within window stays SPRINT", () => {
      expect(effectivePlan({ plan: "SPRINT", subscriptionEndsAt: future })).toBe("SPRINT")
    })
    it("expired BASIC/SPRINT fall back to UNSUBSCRIBED", () => {
      expect(effectivePlan({ plan: "BASIC", subscriptionEndsAt: past })).toBe("UNSUBSCRIBED")
      expect(effectivePlan({ plan: "SPRINT", subscriptionEndsAt: past })).toBe("UNSUBSCRIBED")
    })
    it("BASIC/SPRINT with no expiry → UNSUBSCRIBED", () => {
      expect(effectivePlan({ plan: "SPRINT", subscriptionEndsAt: null })).toBe("UNSUBSCRIBED")
    })
    it("PRO/UNSUBSCRIBED unchanged", () => {
      expect(effectivePlan({ plan: "PRO", subscriptionEndsAt: null })).toBe("PRO")
      expect(effectivePlan({ plan: "UNSUBSCRIBED" })).toBe("UNSUBSCRIBED")
    })
  })

  describe("isActive (one-time plans)", () => {
    it("BASIC active within window, inactive after", () => {
      expect(isActive("BASIC", future, "ACTIVE")).toBe(true)
      expect(isActive("BASIC", past, "ACTIVE")).toBe(false)
      expect(isActive("BASIC", null, "ACTIVE")).toBe(false)
    })
    it("SPRINT active within window, inactive after", () => {
      expect(isActive("SPRINT", future, "ACTIVE")).toBe(true)
      expect(isActive("SPRINT", past, "ACTIVE")).toBe(false)
    })
  })

  describe("canUseAdvancedAts (F3/F4 quota-less ATS gate)", () => {
    it("PRO y LIMITED (pago con ATS) → true", () => {
      expect(canUseAdvancedAts("PRO")).toBe(true)
      expect(canUseAdvancedAts("LIMITED")).toBe(true)
    })
    it("BASIC y SPRINT (pago SIN ATS avanzado) → false", () => {
      expect(canUseAdvancedAts("BASIC")).toBe(false)
      expect(canUseAdvancedAts("SPRINT")).toBe(false)
    })
    it("UNSUBSCRIBED y plan desconocido → false", () => {
      expect(canUseAdvancedAts("UNSUBSCRIBED")).toBe(false)
      expect(canUseAdvancedAts("nonsense")).toBe(false)
    })
    it("deriva del source of truth: coincide con ats-score quota ≠ 0", () => {
      for (const plan of Object.keys(PLAN_LIMITS)) {
        const expected = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].aiLimitsByEndpoint["ats-score"] !== 0
        expect(canUseAdvancedAts(plan)).toBe(expected)
      }
    })
  })

  describe("canUsePremiumTemplates", () => {
    it("SPRINT/PRO/LIMITED can; BASIC/UNSUBSCRIBED cannot", () => {
      expect(canUsePremiumTemplates("SPRINT")).toBe(true)
      expect(canUsePremiumTemplates("PRO")).toBe(true)
      expect(canUsePremiumTemplates("LIMITED")).toBe(true)
      expect(canUsePremiumTemplates("BASIC")).toBe(false)
      expect(canUsePremiumTemplates("UNSUBSCRIBED")).toBe(false)
    })
  })

  describe("hasManageableBilling — access is NOT the same as billing", () => {
    it("is true only for a real recurring subscription", () => {
      expect(hasManageableBilling("ACTIVE")).toBe(true)
      // Still inside the paid period / retry window: the subscription exists.
      expect(hasManageableBilling("PAST_DUE")).toBe(true)
      expect(hasManageableBilling("CANCELED")).toBe(true)
    })

    it("is false with no subscription, whatever the access says", () => {
      // What one-time BASIC/SPRINT checkout writes (StripeWebhookService).
      expect(hasManageableBilling("NONE")).toBe(false)
      expect(hasManageableBilling("EXPIRED")).toBe(false)
      expect(hasManageableBilling(null)).toBe(false)
      expect(hasManageableBilling(undefined)).toBe(false)
    })

    it("regression: a SUPER_ADMIN has PRO access but NO billing portal", () => {
      // isActive() short-circuits to true on role — that used to render the
      // "manage subscription" button, which 400s with no_active_subscription
      // because the admin never went through Stripe.
      expect(isActive("UNSUBSCRIBED", null, "NONE", "SUPER_ADMIN")).toBe(true)
      expect(hasManageableBilling("NONE")).toBe(false)
      expect(isStaffAccess("SUPER_ADMIN", "NONE")).toBe(true)
    })

    it("regression: a one-time BASIC buyer has access but must still be able to buy PRO", () => {
      expect(isActive("BASIC", future, "NONE", "USER")).toBe(true)
      // False → the PRO card shows "buy", not a portal button it cannot open.
      expect(hasManageableBilling("NONE")).toBe(false)
      expect(isStaffAccess("USER", "NONE")).toBe(false)
    })
  })

  describe("blocksNewPurchase — shared with the backend checkout guard", () => {
    it("blocks only while a live subscription is billing", () => {
      expect(blocksNewPurchase("ACTIVE")).toBe(true)
      expect(blocksNewPurchase("PAST_DUE")).toBe(true)
    })

    it("regression: CANCELED must NOT block a recurring upgrade", () => {
      // The hole this closes: CANCELED has billing to manage (portal) but is still
      // allowed to buy, e.g. monthly → annual, or re-subscribing before the period
      // ends. Lumping it with ACTIVE hid the buy button and dead-ended the flow.
      expect(blocksNewPurchase("CANCELED")).toBe(false)
      expect(hasManageableBilling("CANCELED")).toBe(true)
    })

    it("regression: CANCELED DOES block a one-time purchase — it would wipe the paid window", () => {
      // A cancelled subscription is still live until its period end, and Stripe emits
      // customer.subscription.deleted for it afterwards. That handler resolves the user
      // by stripeCustomerId and resets them to UNSUBSCRIBED with subscriptionEndsAt=null
      // — erasing the BASIC/SPRINT month bought in between. Block it instead.
      expect(blocksNewPurchase("CANCELED", true)).toBe(true)
      expect(blocksNewPurchase("ACTIVE", true)).toBe(true)
      expect(blocksNewPurchase("PAST_DUE", true)).toBe(true)
    })

    it("one-time is allowed once no subscription remains", () => {
      expect(blocksNewPurchase("NONE", true)).toBe(false)
      expect(blocksNewPurchase("EXPIRED", true)).toBe(false)
      expect(blocksNewPurchase(null, true)).toBe(false)
    })

    it("one-time is never LOOSER than recurring", () => {
      const STATUSES = ["NONE", "ACTIVE", "CANCELED", "EXPIRED", "PAST_DUE"] as const
      for (const s of STATUSES) {
        if (blocksNewPurchase(s, false)) expect(blocksNewPurchase(s, true)).toBe(true)
      }
    })

    it("does not block one-time buyers upgrading (BASIC/SPRINT → PRO)", () => {
      // handleOneTimeCheckout leaves subscriptionStatus at "NONE".
      expect(blocksNewPurchase("NONE")).toBe(false)
      expect(blocksNewPurchase("EXPIRED")).toBe(false)
      expect(blocksNewPurchase(null)).toBe(false)
      expect(blocksNewPurchase(undefined)).toBe(false)
    })

    it("is stricter than hasManageableBilling, never looser", () => {
      // Any status that blocks a purchase must also be manageable — otherwise the UI
      // could show neither a buy button nor a portal, dead-ending the user.
      const STATUSES = ["NONE", "ACTIVE", "CANCELED", "EXPIRED", "PAST_DUE"] as const
      for (const s of STATUSES) {
        if (blocksNewPurchase(s)) expect(hasManageableBilling(s)).toBe(true)
      }
    })
  })

  describe("isStaffAccess", () => {
    it("is false for regular users regardless of subscription state", () => {
      expect(isStaffAccess("USER", "ACTIVE")).toBe(false)
      expect(isStaffAccess("USER", "NONE")).toBe(false)
      expect(isStaffAccess(null, null)).toBe(false)
    })

    it("is false for an admin who also pays — they get the real portal", () => {
      expect(isStaffAccess("SUPER_ADMIN", "ACTIVE")).toBe(false)
      expect(isStaffAccess("SUPER_ADMIN", "PAST_DUE")).toBe(false)
      expect(isStaffAccess("SUPER_ADMIN", "CANCELED")).toBe(false)
    })
  })
})
