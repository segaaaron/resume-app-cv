import { describe, it, expect } from "vitest"
import {
  belongsToApplication,
  leverBelongsToApplication,
  readyToApply,
  READY_COVERAGE,
  MAX_APPLICATION_ACTIONS,
} from "@/lib/ats/panel-mode"

describe("what belongs to the two-minute view", () => {
  it("keeps only what changes the match with this posting", () => {
    expect(belongsToApplication("add_skill")).toBe(true)
    // Real work, but it improves the document in general — it moves the match
    // by exactly zero, and it is half the panel.
    for (const k of ["rewrite_bullet", "rewrite_summary", "replace_text", "fix_dates", "remove_duplicates", "manual", undefined]) {
      expect(belongsToApplication(k)).toBe(false)
    }
  })

  it("keeps the levers a recruiter actually searches on", () => {
    for (const k of ["hardSkills", "mustHaves", "title", "template"]) {
      expect(leverBelongsToApplication(k)).toBe(true)
    }
    // Weighs a tenth in our own formula and almost no filter ranks on it.
    expect(leverBelongsToApplication("softSkills")).toBe(false)
    expect(leverBelongsToApplication("sections")).toBe(false)
  })
})

describe("the stop rule", () => {
  it("says done at the top of the recommended coverage range", () => {
    expect(readyToApply(READY_COVERAGE, true)).toBe(true)
    expect(readyToApply(READY_COVERAGE - 1, true)).toBe(false)
  })

  it("never says done on a layout a parser mangles", () => {
    expect(readyToApply(100, false)).toBe(false)
  })

  it("treats an unknown coverage as not ready", () => {
    expect(readyToApply(null, true)).toBe(false)
    expect(readyToApply(undefined, true)).toBe(false)
  })

  it("shows a short list, not a list", () => {
    expect(MAX_APPLICATION_ACTIONS).toBeLessThanOrEqual(3)
  })
})
