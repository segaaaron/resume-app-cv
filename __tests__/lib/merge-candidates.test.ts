import { describe, it, expect } from "vitest"
import { findMergeCandidates } from "@/lib/ats/merge-candidates"

const role = (bullets: string[]) => [{ targetId: "job1", jobTitle: "iOS Developer", bullets }]

describe("findMergeCandidates — offers a merge only where one is genuinely better", () => {
  it("pairs two thin lines about the same work", () => {
    const out = findMergeCandidates(
      role([
        "Built the checkout screen in SwiftUI",
        "Improved the checkout screen loading behaviour",
        "Wrote unit tests for the payments module",
        "Attended weekly planning meetings",
      ]),
    )
    expect(out).toHaveLength(1)
    expect(out[0].indexes).toEqual([0, 1])
  })

  // Merging is destructive, so every guard below is about NOT offering it.
  it("never offers a line that already carries a figure — that one earned its slot", () => {
    const out = findMergeCandidates(
      role([
        "Built the checkout screen in SwiftUI",
        "Cut checkout load time by 40%",
        "Wrote unit tests for the payments module",
        "Attended weekly planning meetings",
      ]),
    )
    expect(out).toHaveLength(0)
  })

  it("leaves a role a recruiter can already read", () => {
    const out = findMergeCandidates(
      role(["Built the checkout screen in SwiftUI", "Improved the checkout screen loading behaviour"]),
    )
    expect(out).toHaveLength(0)
  })

  it("does not pair two lines that merely share filler words", () => {
    const out = findMergeCandidates(
      role([
        "Managed the vendor relationships for the region",
        "Trained the new hires during onboarding",
        "Prepared the monthly reports for finance",
        "Answered the support queue in the mornings",
      ]),
    )
    expect(out).toHaveLength(0)
  })

  // Measured against the real API: asked to merge two unrelated bullets, the model
  // does NOT return NOT_MERGEABLE — it welds them with "and" ("Managed third-party
  // dependencies with CocoaPods and mentored two junior engineers…"), which is a
  // worse bullet than the two it replaced. The prompt's escape hatch is therefore
  // not the protection; THIS is. The pair must never be offered in the first place.
  it("never offers the pair the model would happily weld together", () => {
    const out = findMergeCandidates(
      role([
        "Managed third-party dependencies with CocoaPods",
        "Mentored two junior engineers through their first release",
        "Wrote unit tests for the payments module",
        "Attended weekly planning meetings",
      ]),
    )
    expect(out).toHaveLength(0)
  })

  it("does not merge a line that is already a full claim", () => {
    const long =
      "Rebuilt the checkout screen in SwiftUI after profiling revealed the old UIKit view was rebuilding its layout on every keystroke, which the team had been chasing for weeks"
    const out = findMergeCandidates(
      role([long, "Improved the checkout screen loading behaviour", "Wrote unit tests", "Attended planning"]),
    )
    expect(out.every((c) => !c.texts.includes(long))).toBe(true)
  })

  // Applying every suggestion must not cascade a six-line role down to one.
  it("uses each bullet in at most one pair", () => {
    const out = findMergeCandidates(
      role([
        "Built the checkout screen in SwiftUI",
        "Improved the checkout screen loading behaviour",
        "Refined the checkout screen error states",
        "Wrote unit tests for the payments module",
        "Extended unit tests to the payments edge cases",
      ]),
    )
    const used = out.flatMap((c) => c.indexes)
    expect(new Set(used).size).toBe(used.length)
  })

  it("never pairs bullets across two different roles", () => {
    const out = findMergeCandidates([
      { targetId: "a", jobTitle: "One", bullets: ["Built the checkout screen in SwiftUI", "x", "y", "z"] },
      { targetId: "b", jobTitle: "Two", bullets: ["Improved the checkout screen loading", "x", "y", "z"] },
    ])
    expect(out.every((c) => c.texts.every((t) => t.includes("checkout")) === false || c.targetId.length === 1)).toBe(true)
    for (const c of out) expect(["a", "b"]).toContain(c.targetId)
  })

  it("ignores a role with no id — there would be nowhere to write the result", () => {
    expect(findMergeCandidates([{ targetId: "", jobTitle: "x", bullets: ["a b c d", "a b c e", "f", "g"] }])).toHaveLength(0)
  })

  it("caps how many it offers", () => {
    const bullets = Array.from({ length: 20 }, (_, i) => `Handled the checkout screen task number ${"x".repeat(i)}`)
    expect(findMergeCandidates(role(bullets), 3).length).toBeLessThanOrEqual(3)
  })
})
