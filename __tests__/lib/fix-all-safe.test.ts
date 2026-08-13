import { describe, it, expect } from "vitest"
import { serializeBullets, parseBullets } from "@/lib/services/ai/shared/bullets"
import { normalizeDates } from "@/lib/ats/normalize-dates"
import { roleRecency } from "@/lib/ats/resume-integrity"

// The one-press repair is a sequence of writers that already existed. What has to
// hold is that NONE of them can lose the candidate's content or invent a fact —
// that is the whole reason this action is allowed to run without asking.
describe("one-press repair — every step is safe by construction", () => {
  it("collapsing duplicates keeps one copy of every distinct line", () => {
    const bullets = [
      "Trained 6 nurses on the handover protocol",
      "Trained 6 nurses on the handover protocol",
      "Cut medication errors from 12 to 3 per month",
    ]
    const after = parseBullets(serializeBullets(bullets))
    expect(after).toHaveLength(2)
    expect(after).toContain("Cut medication errors from 12 to 3 per month")
  })

  it("unifying dates never invents a month for a bare year", () => {
    const { rows, changed } = normalizeDates([
      { startDate: "2015", endDate: "2016" },
      { startDate: "March 2020", endDate: "07/2022" },
    ])
    expect(rows[0]).toMatchObject({ startDate: "2015", endDate: "2016" })
    expect(changed).toBeGreaterThan(0)
  })

  it("reordering leaves an undated role exactly where the candidate put it", () => {
    const work = [
      { jobTitle: "Volunteer", startDate: "", endDate: "" },
      { jobTitle: "Cashier", startDate: "2015", endDate: "2016" },
      { jobTitle: "Supervisor", startDate: "2021", endDate: "2023" },
    ]
    const dated = work.map((j, i) => ({ j, i, r: roleRecency(j) })).filter((x) => x.r !== null)
    const slots = dated.map((x) => x.i)
    const sorted = [...dated].sort((a, b) => (b.r as number) - (a.r as number) || a.i - b.i)
    const next = [...work]
    slots.forEach((slot, k) => { next[slot] = sorted[k].j })
    expect(next.map((r) => r.jobTitle)).toEqual(["Volunteer", "Supervisor", "Cashier"])
  })
})
