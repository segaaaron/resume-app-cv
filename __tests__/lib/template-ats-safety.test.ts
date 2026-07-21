import { describe, it, expect } from "vitest"
import { TEMPLATES } from "@/types/resume"
import {
  getTemplateAtsSafety,
  templateFormatScore,
  templateAtsMessageKey,
  applyTemplatePenalty,
  CAUTION_SCORE_FACTOR,
} from "@/lib/ats/template-ats-safety"

describe("template-ats-safety", () => {
  it("single-column templates are safe", () => {
    expect(getTemplateAtsSafety("classic")).toBe("safe")
    expect(getTemplateAtsSafety("ats")).toBe("safe")
  })

  it("double-column templates are caution", () => {
    expect(getTemplateAtsSafety("coralsidebar")).toBe("caution")
  })

  it("the dedicated ATS template is always safe", () => {
    expect(getTemplateAtsSafety("ats")).toBe("safe")
  })

  it("unknown / empty id defaults to safe (no false alarm)", () => {
    expect(getTemplateAtsSafety(undefined)).toBe("safe")
    expect(getTemplateAtsSafety(null)).toBe("safe")
    expect(getTemplateAtsSafety("does-not-exist")).toBe("safe")
  })

  it("format score reflects the tier", () => {
    expect(templateFormatScore("safe")).toBe(100)
    expect(templateFormatScore("caution")).toBe(65)
    expect(templateFormatScore("safe")).toBeGreaterThan(templateFormatScore("caution"))
  })

  it("message key maps to the tier", () => {
    expect(templateAtsMessageKey("safe")).toBe("template_ats_safe")
    expect(templateAtsMessageKey("caution")).toBe("template_ats_caution")
  })

  it("applies a 5% ding to caution templates, leaves safe untouched", () => {
    expect(CAUTION_SCORE_FACTOR).toBe(0.95)
    expect(applyTemplatePenalty(100, "safe")).toBe(100)
    expect(applyTemplatePenalty(100, "caution")).toBe(95)
    expect(applyTemplatePenalty(88, "caution")).toBe(Math.round(88 * 0.95)) // 84
    expect(applyTemplatePenalty(0, "caution")).toBe(0)
  })

  it("derives from TEMPLATES.columns — every template resolves to a valid tier", () => {
    for (const t of TEMPLATES) {
      const safety = getTemplateAtsSafety(t.id)
      expect(["safe", "caution"]).toContain(safety)
      // single always safe; double is caution unless explicitly always-safe
      if (t.columns === "single") expect(safety).toBe("safe")
    }
  })
})
