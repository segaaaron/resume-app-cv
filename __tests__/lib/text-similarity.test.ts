import { describe, it, expect } from "vitest"
import {
  normalizedSimilarity,
  isTrivialEdit,
  TRIVIAL_EDIT_SIMILARITY,
} from "@/lib/services/ai/shared/text-similarity"

describe("normalizedSimilarity", () => {
  it("is 1 for identical strings", () => {
    expect(normalizedSimilarity("Built the thing", "Built the thing")).toBe(1)
  })

  it("ignores case, markers, whitespace and trailing punctuation", () => {
    expect(normalizedSimilarity("• Built  the thing.", "built the thing")).toBe(1)
  })

  it("is 1 for two empty strings", () => {
    expect(normalizedSimilarity("", "")).toBe(1)
  })

  it("is low for a genuine rewrite", () => {
    const sim = normalizedSimilarity(
      "• Responsible for fixing bugs in the app.",
      "• Cut crash rate 20% by refactoring the legacy sync layer across 3 iOS releases.",
    )
    expect(sim).toBeLessThan(0.5)
  })
})

describe("isTrivialEdit", () => {
  it("drops an exact echo", () => {
    const b = "• Resolved critical bugs to improve app stability."
    expect(isTrivialEdit(b, b)).toBe(true)
  })

  it("drops an empty suggestion", () => {
    expect(isTrivialEdit("• Built the thing", "   ")).toBe(true)
  })

  it("keeps a genuine rewrite", () => {
    expect(isTrivialEdit(
      "• Responsible for fixing bugs in the app.",
      "• Cut crash rate 20% by refactoring the legacy sync layer across 3 iOS releases.",
    )).toBe(false)
  })

  it("keeps a verb upgrade — a weak-verb swap is a real improvement", () => {
    expect(isTrivialEdit(
      "• Worked on the payment module integration.",
      "• Developed the payment module integration.",
    )).toBe(false)
  })

  // Documents a deliberate boundary. The reported failure — a bullet echoed back
  // with " among [N users]" bolted on — scores ~0.88 and is NOT caught here, by
  // design: appending a metric is only worthless when the metric is a fake
  // placeholder, and that case is killed upstream by the placeholder ban in
  // detectHallucination({ allowPlaceholders: false }). The same append with a
  // REAL figure from the CV is a genuine improvement and must survive.
  it("does not catch a metric append — that is the placeholder ban's job", () => {
    const original = "• Refactored the home module, resulting in improved user engagement."
    const withRealMetric = "• Refactored the home module, resulting in improved user engagement among 50 users."
    expect(normalizedSimilarity(original, withRealMetric)).toBeLessThan(TRIVIAL_EDIT_SIMILARITY)
    expect(isTrivialEdit(original, withRealMetric)).toBe(false)
  })
})
