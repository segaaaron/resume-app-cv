import { describe, it, expect } from "vitest"

/**
 * Reported with a screenshot of the confirm modal showing CURRENT and SUGGESTED
 * word for word identical — "cuál es la mejora ahí". Asking someone to confirm a
 * change to nothing spends their attention and their trust.
 *
 * The comparison is the panel's own: normalised for spacing and trailing
 * punctuation, so a stray period is not sold as an improvement either.
 */
const sameLine = (a: string, b: string) =>
  a.trim().replace(/\s+/g, " ").replace(/[.;,]+$/, "").toLowerCase() ===
  b.trim().replace(/\s+/g, " ").replace(/[.;,]+$/, "").toLowerCase()

describe("a rewrite that rewrites nothing is not offered", () => {
  it.each([
    ["identical", "Reduced crash rates by debugging legacy code.", "Reduced crash rates by debugging legacy code."],
    ["only a trailing period", "Built responsive SwiftUI screens", "Built responsive SwiftUI screens."],
    ["only whitespace", "Improved  app   stability", "Improved app stability"],
    ["only casing", "Improved App Stability", "improved app stability"],
  ])("suppresses a suggestion differing by %s", (_n, current, suggested) => {
    expect(sameLine(current, suggested)).toBe(true)
  })

  it.each([
    ["a figure added", "Improved app stability", "Improved app stability by 22%"],
    ["a real rewrite", "Responsible for the checkout", "Rebuilt the checkout flow end to end"],
    ["a word removed", "Built responsive SwiftUI screens quickly", "Built responsive SwiftUI screens"],
  ])("still offers a suggestion that changes something: %s", (_n, current, suggested) => {
    expect(sameLine(current, suggested)).toBe(false)
  })
})

/**
 * The other half of the same report: "siempre me sale Add your figure". A metric
 * request has to disappear once the line carries a figure, however it got there.
 */
const stillNeedsFigure = (originalLine: string, currentLine: string) =>
  !(currentLine && /\d/.test(currentLine) && !/\d/.test(originalLine))

describe("a request for a number stops once the number is there", () => {
  it("stops asking after the user types the figure", () => {
    expect(stillNeedsFigure("Improved app stability", "Improved app stability by 22%")).toBe(false)
  })

  it("keeps asking while the line still has no figure", () => {
    expect(stillNeedsFigure("Improved app stability", "Improved application stability")).toBe(true)
  })

  it("does not silence a finding about a line that always had a figure", () => {
    expect(stillNeedsFigure("Improved stability by 5%", "Improved stability by 5%")).toBe(true)
  })
})
