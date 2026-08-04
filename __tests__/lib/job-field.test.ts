import { describe, it, expect } from "vitest"
import { inferFieldCategories } from "@/lib/ats/job-field"
import { filterSkills } from "@/lib/ats/skill-catalog"

describe("inferFieldCategories — field from job title", () => {
  it("maps healthcare/design/legal/education titles to their category", () => {
    expect(inferFieldCategories("Registered Nurse")).toContain("healthcare")
    expect(inferFieldCategories("Enfermera")).toContain("healthcare")
    expect(inferFieldCategories("Graphic Designer")).toContain("design")
    expect(inferFieldCategories("Corporate Lawyer")).toContain("legal")
    expect(inferFieldCategories("High School Teacher")).toContain("education")
    expect(inferFieldCategories("Accountant")).toContain("finance")
  })

  it("resolves specific tech roles before the generic engineer fallback", () => {
    expect(inferFieldCategories("iOS Developer")).toContain("mobile")
    expect(inferFieldCategories("Backend Developer")).toContain("backend")
    expect(inferFieldCategories("UX Designer")).toContain("design")
  })

  it("falls back to the dominant category of existing skills when the title is vague", () => {
    expect(inferFieldCategories("Consultant", ["design", "design", "marketing"])).toEqual(["design"])
  })

  it("returns [] when nothing is inferable", () => {
    expect(inferFieldCategories("", [])).toEqual([])
    expect(inferFieldCategories("Consultant", [])).toEqual([])
  })
})

describe("filterSkills — boost ranks the user's field first (never hides)", () => {
  it("floats boosted-category matches to the top within the same match tier", () => {
    // Query 'ca' matches skills across categories; boosting healthcare puts a
    // healthcare match ('care planning' / 'case management') ahead of others.
    const { matches } = filterSkills("care", 8, ["healthcare"])
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].category).toBe("healthcare")
  })

  it("still returns non-boosted matches (nothing hidden)", () => {
    const withBoost = filterSkills("java", 8, ["healthcare"])
    // Java-family skills are not healthcare, yet they still appear.
    expect(withBoost.matches.some((m) => m.display.toLowerCase().startsWith("java"))).toBe(true)
  })
})
