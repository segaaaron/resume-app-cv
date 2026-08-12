import { describe, it, expect } from "vitest"
import { assessResumeContent } from "@/lib/services/ai/shared/bullet-quality"
import { analyzeWriting } from "@/lib/ats/writing-checks"

/**
 * The list of bullets to improve is now computed from the CV as it stands, not
 * from the analysis snapshot.
 *
 * Before, ats-rescore refreshed the score on every edit but returned neither of
 * these, so the list kept describing the resume as it was at the first analysis:
 * a bullet the user had just given a number to stayed on screen, still tagged "no
 * metric", and only a fresh model call could clear it. Fixing one line looked
 * like it produced three more.
 *
 * These are the properties the panel relies on. Both functions take sectionData
 * and are pure, so the browser can run them on every keystroke for free.
 */
const cv = (bullets: string[]) => ({
  workExperience: [{ id: "job-1", jobTitle: "iOS Developer", description: bullets.map((b) => `• ${b}`).join("\n") }],
})

describe("live bullet list — the CV as it stands, not as it was analysed", () => {
  it("drops a bullet from the list the moment it gets a number", () => {
    const before = assessResumeContent(cv(["Reduced crash rates and improved app stability through debugging"]))
    expect(before.metriclessBullets).toHaveLength(1)

    const after = assessResumeContent(cv(["Reduced crash rates by 30% through debugging across 4 modules"]))
    expect(after.metriclessBullets).toHaveLength(0)
    expect(after.quantifiedBullets).toBe(1)
  })

  it("reports the metric share of the CURRENT text", () => {
    const q = assessResumeContent(cv([
      "Reduced crash rates by 30% through debugging",
      "Managed third-party dependencies across iOS versions",
    ]))
    expect(q.totalBullets).toBe(2)
    expect(q.quantifiedBullets).toBe(1)
    expect(q.quantificationPct).toBe(50)
  })

  it("re-indexes after a bullet is removed, so Remove cannot hit the wrong line", () => {
    // The stale-snapshot failure mode: delete bullet 0 and every later index
    // shifts. A frozen list would still point at the old positions.
    const after = assessResumeContent(cv([
      "Managed third-party dependencies across iOS versions",
      "Implemented reactive patterns using RXSwift",
    ]))
    expect(after.metriclessBullets.map((b) => b.index)).toEqual([0, 1])
  })

  it("stops flagging a weak opener once the verb is fixed", () => {
    const before = analyzeWriting(cv(["Participated in Agile ceremonies to enhance team productivity"]))
    expect(before.weakVerbBullets).toHaveLength(1)

    const after = analyzeWriting(cv(["Drove Agile ceremonies that raised sprint completion by 18%"]))
    expect(after.weakVerbBullets).toHaveLength(0)
  })

  it("clears the overloaded-role warning once the role is trimmed", () => {
    const many = Array.from({ length: 9 }, (_, i) => `Shipped feature ${i} improving stability by ${i + 2}%`)
    expect(analyzeWriting(cv(many)).bulletBalance.some((b) => b.kind === "too_many")).toBe(true)

    const trimmed = many.slice(0, 5)
    expect(analyzeWriting(cv(trimmed)).bulletBalance.some((b) => b.kind === "too_many")).toBe(false)
  })
})
