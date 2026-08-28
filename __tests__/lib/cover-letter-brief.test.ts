import { describe, it, expect } from "vitest"
import { buildCoverLetterBrief } from "@/lib/cover-letter/cover-letter-brief"

// A vacancy that names tools the résumé HAS (Swift, SwiftUI, REST, Core Data,
// unit testing, Agile) and one it does NOT (Kubernetes) — the anti-invention line.
const JD =
  "We need an iOS developer strong in Swift and SwiftUI, building REST APIs and Core Data. " +
  "Unit testing and Agile are required. Experience with Kubernetes is required."

const resume = {
  personalDetails: { jobTitle: "iOS Developer" },
  skills: [{ name: "Swift" }, { name: "SwiftUI" }, { name: "Core Data" }],
  workExperience: [
    {
      jobTitle: "iOS Engineer",
      employer: "Acme",
      description:
        "Shipped Swift and SwiftUI apps end to end, integrating REST APIs and Core Data. " +
        "Led unit testing in an Agile team and mentored two engineers.",
    },
  ],
  summary: "Six years building iOS apps.",
}

describe("buildCoverLetterBrief", () => {
  it("features JD keywords the résumé supports, in the plan", () => {
    const b = buildCoverLetterBrief({ jobDescription: JD, sectionData: resume, company: "Acme", jobTitle: "iOS Developer" })
    expect(b.hasJd).toBe(true)
    expect(b.hasResume).toBe(true)
    expect(b.featureKeywords).toEqual(expect.arrayContaining(["swift"]))
    expect(b.company).toBe("Acme")
    expect(b.role).toBe("iOS Developer")
  })

  it("ANTI-INVENTION: a JD keyword the résumé lacks is a gap, never a feature", () => {
    const b = buildCoverLetterBrief({ jobDescription: JD, sectionData: resume })
    expect(b.gapsToAvoid).toEqual(expect.arrayContaining(["kubernetes"]))
    expect(b.featureKeywords).not.toContain("kubernetes")
  })

  it("maps real résumé lines to the keywords they back", () => {
    const b = buildCoverLetterBrief({ jobDescription: JD, sectionData: resume })
    expect(b.supportingEvidence.length).toBeGreaterThan(0)
    const first = b.supportingEvidence[0]
    expect(first.keywords.length).toBeGreaterThan(0)
    // evidence is a genuine résumé line, not fabricated
    expect(first.text.toLowerCase()).toContain("swift")
  })

  it("no JD → empty plan but company/role preserved (still generates from résumé)", () => {
    const b = buildCoverLetterBrief({ sectionData: resume, company: "Acme", jobTitle: "iOS Developer" })
    expect(b.hasJd).toBe(false)
    expect(b.featureKeywords).toEqual([])
    expect(b.supportingEvidence).toEqual([])
    expect(b.role).toBe("iOS Developer")
  })

  it("empty résumé → nothing to feature, every JD term is a gap (never invented)", () => {
    const b = buildCoverLetterBrief({ jobDescription: JD, sectionData: {} })
    expect(b.hasResume).toBe(false)
    expect(b.featureKeywords).toEqual([])
    expect(b.gapsToAvoid.length).toBeGreaterThan(0)
  })

  it("role falls back to the résumé's target job title when none is passed", () => {
    const b = buildCoverLetterBrief({ jobDescription: JD, sectionData: resume })
    expect(b.role).toBe("iOS Developer")
  })

  it("is deterministic — same inputs, same plan", () => {
    const a = buildCoverLetterBrief({ jobDescription: JD, sectionData: resume })
    const b = buildCoverLetterBrief({ jobDescription: JD, sectionData: resume })
    expect(a).toEqual(b)
  })
})
