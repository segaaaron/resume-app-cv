import { describe, it, expect } from "vitest"
import { resolveBulletFindings, findingsFor, ACTION_PRIORITY } from "@/lib/ats/bullet-findings"

const bullets = [
  { targetId: "w1", jobTitle: "Charge Nurse", index: 0, text: "Coordinated triage for up to 30 patients per shift" },
  { targetId: "w1", jobTitle: "Charge Nurse", index: 1, text: "Responsible for daily medication rounds" },
  { targetId: "w1", jobTitle: "Charge Nurse", index: 2, text: "and logged each case in the ward system" },
  { targetId: "w2", jobTitle: "Staff Nurse", index: 0, text: "Managed post-operative care for 15 beds" },
]

describe("one verdict per bullet", () => {
  it("never hands one line two instructions", () => {
    // The reported failure: the same bullet was told to be rewritten by one card,
    // deleted by another and adapted by a third, so resolving it in one place left
    // the others still demanding work.
    const findings = resolveBulletFindings(bullets, {
      cut: [{ targetId: "w1", index: 1 }],
      defect: [{ targetId: "w1", index: 1 }],
      metric: [{ targetId: "w1", index: 1 }],
      tailor: [{ targetId: "w1", index: 1 }],
    })
    expect(findings).toHaveLength(1)
    expect(findings[0].action).toBe("cut")
    // Everything seen is kept, so the UI can explain the decision instead of
    // hiding the rest.
    expect(findings[0].observed).toEqual(["cut", "defect", "tailor", "metric"])
  })

  it("never polishes a line it is about to cut", () => {
    const findings = resolveBulletFindings(bullets, {
      cut: [{ targetId: "w1", index: 1 }],
      defect: [{ targetId: "w1", index: 1 }],
    })
    expect(findingsFor(findings, "defect")).toEqual([])
    expect(findingsFor(findings, "cut")).toHaveLength(1)
  })

  it("puts a broken import ahead of everything — it is not a sentence yet", () => {
    const findings = resolveBulletFindings(bullets, {
      broken: [{ targetId: "w1", index: 2 }],
      duplicate: [{ targetId: "w1", index: 2 }],
      metric: [{ targetId: "w1", index: 2 }],
    })
    expect(findings[0].action).toBe("broken")
  })

  it("drops a signal pointing at a line that no longer exists", () => {
    // Applied, deleted or re-indexed: the CV is the source of truth, and a card
    // demanding work on vanished text is how this whole problem read to the user.
    const findings = resolveBulletFindings(bullets, { metric: [{ targetId: "w1", index: 9 }] })
    expect(findings).toEqual([])
  })

  it("keeps the metric ask for last — it is the only one that needs the candidate", () => {
    const findings = resolveBulletFindings(bullets, {
      metric: [{ targetId: "w1", index: 0 }],
      duplicate: [{ targetId: "w2", index: 0 }],
    })
    expect(findings.map((f) => f.action)).toEqual(["duplicate", "metric"])
  })

  it("is stable: the same input never reshuffles the list", () => {
    const signals = { defect: [{ targetId: "w2", index: 0 }, { targetId: "w1", index: 1 }] }
    const a = resolveBulletFindings(bullets, signals).map((f) => `${f.targetId}-${f.index}`)
    const b = resolveBulletFindings(bullets, signals).map((f) => `${f.targetId}-${f.index}`)
    expect(a).toEqual(b)
    expect(a).toEqual(["w1-1", "w2-0"])
  })

  it("the priority order is the documented one", () => {
    expect(ACTION_PRIORITY).toEqual(["broken", "duplicate", "cut", "defect", "tailor", "metric"])
  })
})
