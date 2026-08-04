import { describe, it, expect } from "vitest"
import {
  normalizedSimilarity,
  isTrivialEdit,
  isCosmeticReword,
  dropsContentWithoutGain,
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

describe("isCosmeticReword", () => {
  // The exact case the user reported: a near-copy where the only changes are
  // synonym swaps ("improve"→"strengthen", "helped reduce"→"reduced") plus a
  // bullet marker. No new information — must be dropped.
  it("drops a synonym-only reword", () => {
    const current = "Implemented TCA architecture and design patterns to improve code modularity and maintainability, while leading code reviews that helped reduce technical debt."
    const suggested = "• Implemented TCA architecture and design patterns to strengthen code modularity and maintainability, while leading code reviews that reduced technical debt."
    expect(isCosmeticReword(current, suggested)).toBe(true)
  })

  it("keeps a spelling fix — a small in-word correction is not a swap", () => {
    expect(isCosmeticReword(
      "Proficient in Objetive-C and Swift for iOS development.",
      "Proficient in Objective-C and Swift for iOS development.",
    )).toBe(false)
  })

  it("keeps a grammar fix (then → than)", () => {
    expect(isCosmeticReword(
      "iOS Developer with more then 7 years of experience.",
      "iOS Developer with more than 7 years of experience.",
    )).toBe(false)
  })

  it("keeps an enrichment that adds a real keyword (nothing removed)", () => {
    const original = "• Refactored the home module, resulting in improved user engagement."
    const enriched = "• Refactored the home module, resulting in improved user engagement among 50 users."
    expect(isCosmeticReword(original, enriched)).toBe(false)
  })

  it("keeps a genuine rewrite (too different to be a near-copy)", () => {
    expect(isCosmeticReword(
      "• Responsible for fixing bugs in the app.",
      "• Cut crash rate 20% by refactoring the legacy sync layer across 3 iOS releases.",
    )).toBe(false)
  })

  it("keeps a weak-verb upgrade — it changes enough to be a real edit", () => {
    expect(isCosmeticReword(
      "• Worked on the payment module integration.",
      "• Developed the payment module integration.",
    )).toBe(false)
  })

  it("does not fire on an empty suggestion", () => {
    expect(isCosmeticReword("• Built the thing", "   ")).toBe(false)
  })
})

describe("dropsContentWithoutGain — lateral, lossy rewrites", () => {
  it("flags the reported case: strips 'enhance functionality' + 'strengthen', adds nothing", () => {
    const current = "Integrated RESTful APIs and third-party libraries to enhance iOS app functionality, while mentoring junior developers to raise code quality and strengthen team performance."
    const suggested = "• Integrated RESTful APIs and third-party libraries into the iOS app, and mentored junior developers to raise code quality and team performance."
    expect(dropsContentWithoutGain(current, suggested)).toBe(true)
  })

  it("does NOT flag a rewrite that adds a concrete new word", () => {
    const orig = "Integrated RESTful APIs to enhance the iOS app."
    const better = "Integrated RESTful APIs, cutting checkout latency 30%."
    expect(dropsContentWithoutGain(orig, better)).toBe(false)
  })

  it("treats a tense change (mentoring → mentored) as the same word, not a gain", () => {
    expect(dropsContentWithoutGain("Mentoring and coaching the whole team", "Mentored the team")).toBe(true)
  })

  it("flags dropping a single NAMED technology (RXSwift) with no concrete gain", () => {
    const current = "• Improved app responsiveness and user engagement by implementing reactive programming patterns using RXSwift."
    const suggested = "• Improved app responsiveness and user engagement by implementing reactive programming patterns."
    expect(dropsContentWithoutGain(current, suggested)).toBe(true)
  })

  it("flags dropping a camelCase/known tech (GraphQL) alone", () => {
    expect(dropsContentWithoutGain("Built the API with GraphQL", "Built the API")).toBe(true)
  })

  it("does NOT flag swapping a tech for another concrete one", () => {
    // dropped RXSwift but added Combine (a named token) — a real change, not a loss.
    expect(dropsContentWithoutGain("Built the app using RXSwift", "Rebuilt the app using Combine")).toBe(false)
  })

  it("does not flag dropping one plain word (not named, not ≥2)", () => {
    expect(dropsContentWithoutGain("Built the payments module quickly", "Built the payments module")).toBe(false)
  })

  it("empty suggestion counts as no gain", () => {
    expect(dropsContentWithoutGain("Built the payments API", "  ")).toBe(true)
  })

  it("flags a net-loss rewrite that swaps in one filler word ('ensuring'→'to maintain')", () => {
    // The reported foto-1 case: drops "ensuring / enhancing / team / performance",
    // adds only "maintain". A single added word must not launder a 4-word loss.
    const current = "Integrated RESTful APIs and third-party libraries, ensuring seamless backend communication while mentoring junior developers on best practices, enhancing team performance and code quality."
    const suggested = "• Integrated RESTful APIs and third-party libraries to maintain seamless backend communication, while mentoring junior developers on best practices and code quality."
    expect(dropsContentWithoutGain(current, suggested)).toBe(true)
  })

  it("does NOT flag a net-neutral tightening (drops 1 filler, adds 1 clearer word)", () => {
    // Only one word net difference → below the ≥2 net-loss bar → survives.
    expect(dropsContentWithoutGain("Managed the whole payments module", "Owned the payments module")).toBe(false)
  })
})
