import { describe, it, expect } from "vitest"
import { splitFixText, isApplicableFix, detectWordCorrections } from "@/lib/ats/fix-text"

// Verbatim from the panel, reported by the CEO: the green "suggested text" ends
// in an order to the candidate, and "Apply this text" pasted the whole thing into
// the resume.
const REAL_ONE =
  "Developed and shipped new iOS features for a Latin American delivery app, improving app usability and reducing user-reported issues; add the exact feature scope, the user base or release volume, and the measurable impact you can defend."
const REAL_TWO =
  "Developed and maintained iOS applications using Swift and SwiftUI, collaborating with cross-functional Agile teams to ship production features and improve app reliability; add the scale, user impact, or release outcome here."

describe("splitFixText — the resume never carries an order addressed to the candidate", () => {
  it("keeps the bullet and lifts the instruction out of it", () => {
    const { replacement, instruction } = splitFixText(REAL_ONE)
    expect(replacement).toBe(
      "Developed and shipped new iOS features for a Latin American delivery app, improving app usability and reducing user-reported issues",
    )
    expect(instruction).toContain("add the exact feature scope")
    expect(replacement).not.toContain("add the exact")
  })

  it("does the same for the second reported one", () => {
    const { replacement, instruction } = splitFixText(REAL_TWO)
    expect(replacement).not.toContain("add the scale")
    expect(replacement).toContain("improve app reliability")
    expect(instruction).toContain("add the scale")
  })

  it("handles Spanish orders too", () => {
    const { replacement, instruction } = splitFixText(
      "Coordinó la instalación eléctrica de viviendas en obra nueva; agrega la cantidad de viviendas y el plazo.",
    )
    expect(replacement).toBe("Coordinó la instalación eléctrica de viviendas en obra nueva")
    expect(instruction).toContain("agrega la cantidad")
  })

  it("treats a bracket placeholder as an instruction, never as content", () => {
    const { replacement, instruction } = splitFixText(
      "Reduced crash rates by [X%] across the fleet. Include the real figure.",
    )
    expect(instruction).toContain("Include the real figure")
    expect(replacement).not.toContain("Include the real")
  })

  it("leaves a clean rewrite completely alone", () => {
    const clean = "Cut checkout latency from 800ms to 120ms by caching the pricing call"
    expect(splitFixText(clean)).toEqual({ replacement: clean, instruction: "" })
  })

  // The cut must be at the hinge, not at any imperative verb: a bullet can open
  // with one, and slicing there would destroy real text.
  it("does not cut a sentence that merely starts with a verb", () => {
    const bullet = "Added two-factor authentication to the admin console for 400 staff accounts"
    expect(splitFixText(bullet).replacement).toBe(bullet)
  })

  it("reports nothing appliable when the fix is only an instruction", () => {
    const { replacement, instruction } = splitFixText("Add the number of patients you saw per shift.")
    expect(replacement).toBe("")
    expect(instruction).toContain("Add the number")
  })

  it("survives empty input", () => {
    expect(splitFixText("")).toEqual({ replacement: "", instruction: "" })
  })
})

describe("isApplicableFix — no button rather than a mutilated bullet", () => {
  const original = "Developed and maintained iOS applications using Swift and SwiftUI for a fintech client"

  it("accepts a real rewrite", () => {
    expect(isApplicableFix(splitFixText(REAL_TWO).replacement, original)).toBe(true)
  })

  it("rejects a stub left behind after the split", () => {
    expect(isApplicableFix("Developed iOS apps", original)).toBe(false)
  })

  it("rejects text identical to what is already there", () => {
    expect(isApplicableFix(original, original)).toBe(false)
  })

  it("rejects an empty replacement", () => {
    expect(isApplicableFix("", original)).toBe(false)
  })
})

// Photographed in the panel by the CEO, AFTER the first version of this splitter
// shipped in the branch: neither clause opens with an order, so the imperative
// rule missed both, and both would have been pasted into a resume.
describe("splitFixText — the model slipping into second person mid-sentence", () => {
  it("cuts at 'your', not just at a trailing order", () => {
    const { replacement, instruction } = splitFixText(
      "Developed responsive SwiftUI screens from UI/UX designs with designers and product owners, improving user engagement for your actual user base by adding the scale, metric, and impact you can defend.",
    )
    expect(replacement).toBe(
      "Developed responsive SwiftUI screens from UI/UX designs with designers and product owners",
    )
    expect(instruction).toContain("your actual user base")
  })

  it("cuts a relative clause that turns into advice", () => {
    const { replacement, instruction } = splitFixText(
      "Refactored the app's home module, improving performance and usability, which led to your actual measurable impact on load time, engagement, crash rate, or task completion.",
    )
    expect(replacement).toBe("Refactored the app's home module, improving performance and usability")
    expect(instruction).toContain("measurable impact")
  })

  it("does not cut a bullet that happens to contain a comma", () => {
    const clean = "Rebuilt the checkout flow in SwiftUI, cutting load time from 800ms to 120ms"
    expect(splitFixText(clean).replacement).toBe(clean)
  })

  it("cuts Spanish second person too", () => {
    const { replacement } = splitFixText(
      "Coordinó la instalación eléctrica de 15 viviendas, sumando el plazo y el presupuesto que puedas defender.",
    )
    expect(replacement).toBe("Coordinó la instalación eléctrica de 15 viviendas")
  })
})

// Photographed by the CEO: findings that name a typo and print the corrected word,
// with no button at all — the most certain fix in the report was the only one the
// user had to apply by hand.
describe("detectWordCorrections — a typo finding earns a one-click fix", () => {
  it("finds the misspelled word inside a longer title", () => {
    expect(
      detectWordCorrections(
        '"iOS Developer & Web Debeloper & Mobile Developer"',
        "iOS Developer & Web Developer & Mobile Developer",
      ),
    ).toEqual([{ from: "Debeloper", to: "Developer" }])
  })

  it("handles a single-word skill", () => {
    expect(detectWordCorrections('"Objetive-C"', "Objective-C")).toEqual([{ from: "Objetive-C", to: "Objective-C" }])
  })

  // Replacing the wrong word in someone's job title is worse than no button.
  it.each([
    ['"Managed the release process"', "Owned the release process end to end"],
    ['"Swift"', "Kotlin"],
    ['"Reduced crashes"', "Reduced crashes by 40%"],
    ['"Built the checkout"', "Rebuilt checkout and payments"],
  ])("refuses a rewrite, not a correction: %s", (issue, fix) => {
    expect(detectWordCorrections(issue, fix)).toEqual([])
  })

  it("refuses when nothing changed", () => {
    expect(detectWordCorrections('"Objective-C"', "Objective-C")).toEqual([])
  })

  it("refuses a change of more than two words — that is a rewording", () => {
    expect(detectWordCorrections('"the quick brown fox jumps"', "a slow green cat sleeps")).toEqual([])
  })
})
