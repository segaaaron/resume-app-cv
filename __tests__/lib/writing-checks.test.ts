import { describe, it, expect } from "vitest"
import { analyzeWriting } from "@/lib/ats/writing-checks"

describe("analyzeWriting", () => {
  it("flags cliché bullets, located by job + index", () => {
    const sd = {
      workExperience: [
        { id: "w1", jobTitle: "Dev", description: "• A results-driven team player who delivered\n• Built the payments API with Stripe" },
      ],
    }
    const r = analyzeWriting(sd)
    expect(r.clicheBullets.length).toBe(1)
    expect(r.clicheBullets[0]).toMatchObject({ targetId: "w1", index: 0 })
    expect(r.clicheBullets[0].cliches.length).toBeGreaterThan(0)
  })

  it("flags mixed date formats as inconsistent", () => {
    const sd = {
      workExperience: [
        { id: "w1", jobTitle: "A", startDate: "2015", endDate: "2016", description: "• x" },
        { id: "w2", jobTitle: "B", startDate: "06/2017", endDate: "2019", description: "• y" },
      ],
    }
    const r = analyzeWriting(sd)
    expect(r.dateInconsistency).not.toBeNull()
    expect(r.dateInconsistency?.formats).toEqual(expect.arrayContaining(["year", "mm/yyyy"]))
  })

  it("does NOT flag consistent date formats", () => {
    const sd = {
      workExperience: [
        { id: "w1", jobTitle: "A", startDate: "01/2015", endDate: "08/2016", description: "• x" },
        { id: "w2", jobTitle: "B", startDate: "09/2016", endDate: "12/2019", description: "• y" },
      ],
    }
    expect(analyzeWriting(sd).dateInconsistency).toBeNull()
  })

  it("flags a role with too many bullets and one with none", () => {
    const many = Array.from({ length: 8 }, (_, i) => `• Bullet number ${i}`).join("\n")
    const sd = {
      workExperience: [
        { id: "w1", jobTitle: "Overloaded", description: many },
        { id: "w2", jobTitle: "Empty role", description: "" },
      ],
    }
    const r = analyzeWriting(sd)
    expect(r.bulletBalance).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ targetId: "w1", kind: "too_many" }),
        expect.objectContaining({ targetId: "w2", kind: "none" }),
      ]),
    )
  })

  it("flags bullets opening with a duty phrase (weak verb)", () => {
    const sd = {
      workExperience: [
        { id: "w1", jobTitle: "Dev", description: "• Responsible for the billing service\n• Built the API in Go" },
      ],
    }
    const r = analyzeWriting(sd)
    expect(r.weakVerbBullets).toEqual([expect.objectContaining({ targetId: "w1", index: 0 })])
  })

  it("is clean on a well-formed CV", () => {
    const sd = {
      workExperience: [
        { id: "w1", jobTitle: "Engineer", startDate: "01/2020", endDate: "06/2022",
          description: "• Built the billing service in Go\n• Cut checkout latency 30%\n• Mentored two juniors" },
      ],
    }
    const r = analyzeWriting(sd)
    expect(r.clicheBullets).toEqual([])
    expect(r.weakVerbBullets).toEqual([])
    expect(r.dateInconsistency).toBeNull()
    expect(r.bulletBalance).toEqual([])
  })
})
