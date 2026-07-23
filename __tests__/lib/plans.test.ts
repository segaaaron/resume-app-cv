import { describe, it, expect } from "vitest"
import {
  getLimits,
  isActive,
  effectivePlan,
  canUsePremiumTemplates,
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

  describe("canUsePremiumTemplates", () => {
    it("SPRINT/PRO/LIMITED can; BASIC/UNSUBSCRIBED cannot", () => {
      expect(canUsePremiumTemplates("SPRINT")).toBe(true)
      expect(canUsePremiumTemplates("PRO")).toBe(true)
      expect(canUsePremiumTemplates("LIMITED")).toBe(true)
      expect(canUsePremiumTemplates("BASIC")).toBe(false)
      expect(canUsePremiumTemplates("UNSUBSCRIBED")).toBe(false)
    })
  })
})
