import { describe, it, expect } from "vitest"
import { analyzeCoverLetterAts } from "@/lib/cover-letter/cover-letter-ats"

const JD = "We need an iOS developer strong in Swift and SwiftUI, REST APIs, and Core Data. Experience with unit testing and Agile is a plus."

// ~300 words, one page, clean, keyword-aligned.
const goodLetter = `I have followed your team's work on privacy-first mobile apps for years and would bring that same care to this iOS role.

Over six years I have shipped Swift and SwiftUI apps end to end, integrating REST APIs and Core Data, and I lead unit testing in an Agile team. I rebuilt a checkout flow that our users relied on daily and mentored two junior engineers through it.

I would welcome the chance to walk you through how I approach reliable, testable iOS code. Thank you for your consideration.`

describe("analyzeCoverLetterAts", () => {
  it("scores a clean, keyword-aligned, one-page letter well", () => {
    const r = analyzeCoverLetterAts(goodLetter, JD)
    expect(r.keywords.checked).toBe(true)
    expect(r.keywords.matched).toEqual(expect.arrayContaining(["swift"]))
    expect(r.format.verdict).toBe("pass")
    expect(r.score).toBeGreaterThanOrEqual(60)
  })

  it("flags an unfilled placeholder / bracket", () => {
    const r = analyzeCoverLetterAts("I am excited to join [Company] and work at XYZ Corp on your team.", JD)
    expect(r.format.issues).toContain("placeholder")
    expect(r.format.issues).toContain("unfilled_bracket")
    expect(r.format.verdict).toBe("risk")
  })

  it("penalizes a letter far over one page", () => {
    const longLetter = Array.from({ length: 40 }, () =>
      "This sentence exists only to pad the letter well beyond a single page so the length dimension fires."
    ).join(" ")
    const r = analyzeCoverLetterAts(longLetter, JD)
    expect(r.length.wordCount).toBeGreaterThan(520)
    expect(r.length.verdict).toBe("risk")
  })

  it("skips the keyword dimension when no job description is given", () => {
    const r = analyzeCoverLetterAts(goodLetter)
    expect(r.keywords.checked).toBe(false)
    // still produces an overall score from the other dimensions
    expect(r.score).toBeGreaterThan(0)
  })

  it("reports low keyword coverage when the letter ignores the job", () => {
    const offTopic = "I enjoy baking bread and long walks. I am a hard worker and a great team player who loves new challenges every day."
    const r = analyzeCoverLetterAts(offTopic, JD)
    expect(r.keywords.checked).toBe(true)
    expect(r.keywords.verdict).not.toBe("pass")
    expect(r.keywords.missing.length).toBeGreaterThan(0)
  })

  it("flags a wall-of-text (one long block, long sentences)", () => {
    const wall = "I did many things and " + Array.from({ length: 40 }, () => "handled various responsibilities").join(" and ") + " across teams."
    const r = analyzeCoverLetterAts(wall, JD)
    expect(r.readability.verdict).not.toBe("pass")
  })
})
