import { describe, it, expect } from "vitest"
import { stripJobMarkers, stripJobMarkersDeep } from "@/lib/services/ai/shared/strip-markers"

/**
 * Our own addressing marker must never reach the user. It has leaked four times:
 * the "MEASURED:" line, the truncation note, the review path, and then the
 * critical-fixes path — the last two because the cleanup lived at one call site
 * while the text was built at another.
 */
describe("stripJobMarkers", () => {
  it("removes the marker seen in production, verbatim", () => {
    const seen = '"ID:9a9f30f9-93fb-49bb-b039-2827b76f1aaf | iOS Developer at IA interactive (2023 - 2026)"'
    const out = stripJobMarkers(seen)
    expect(out).toBe('"iOS Developer at IA interactive (2023 - 2026)"')
    expect(out).not.toContain("ID:")
  })

  it("removes a leading bullet index", () => {
    expect(stripJobMarkers('[0] "Developed hybrid mobile applications"')).toBe('"Developed hybrid mobile applications"')
  })

  it("leaves the candidate's own words alone", () => {
    const real = "Led identity work across iOS and Android, cutting sign-in failures by 20%"
    expect(stripJobMarkers(real)).toBe(real)
  })

  it("does not eat legitimate text that merely mentions an id", () => {
    // "ID" as a word, not our marker: no hex payload follows.
    const real = "Designed the ID verification flow for 3 markets"
    expect(stripJobMarkers(real)).toBe(real)
  })

  it("cleans every prose field of an analysis but preserves the action target", () => {
    const analysis = {
      verdict: "ID:9a9f30f9-93fb-49bb-b039-2827b76f1aaf | Strong profile",
      criticalFixes: [{
        issue: 'ID:9a9f30f9-93fb-49bb-b039-2827b76f1aaf | "Developed hybrid apps"',
        why: "dilutes the signal",
        fix: "lead with native work",
        action: { kind: "rewrite_bullet", targetId: "9a9f30f9-93fb-49bb-b039-2827b76f1aaf", index: 0 },
      }],
    }
    const out = stripJobMarkersDeep(analysis)
    expect(out.verdict).toBe("Strong profile")
    expect(out.criticalFixes[0].issue).toBe('"Developed hybrid apps"')
    // The button still knows which job it edits — that id is data, not prose.
    expect(out.criticalFixes[0].action.targetId).toBe("9a9f30f9-93fb-49bb-b039-2827b76f1aaf")
  })
})
