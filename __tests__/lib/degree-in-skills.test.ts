import { describe, it, expect } from "vitest"
import { findDegreeInSkills } from "@/lib/ats/metric-credibility"

describe("findDegreeInSkills", () => {
  // The discipline is the skill for most careers. Flagging it told people to
  // delete the most relevant chip on their resume.
  it("leaves the field of study alone across professions", () => {
    const cases: [string[], { degree?: string; fieldOfStudy?: string }[]][] = [
      [["Accounting", "Excel"], [{ fieldOfStudy: "Accounting" }]],
      [["Nursing", "Triage"], [{ fieldOfStudy: "Nursing" }]],
      [["Graphic Design"], [{ fieldOfStudy: "Graphic Design" }]],
      [["Derecho Laboral"], [{ fieldOfStudy: "Derecho Laboral" }]],
    ]
    for (const [skills, education] of cases) {
      expect(findDegreeInSkills(skills, education)).toEqual([])
    }
  })

  it("still flags a job title copied into Skills — the case this was built for", () => {
    // Measured against the real resume this check came from: "Systems engineer"
    // is the degree AND sits between Swift and Git. A title is not a skill, and
    // the vocabulary does not list it, so it stays flagged.
    expect(findDegreeInSkills(["Swift", "Systems engineer", "Git"], [{ degree: "Systems engineer" }]))
      .toEqual(["Systems engineer"])
  })

  it("still flags the credential written as a capability, in both languages", () => {
    expect(
      findDegreeInSkills(["Bachelor of Science in Systems Engineering", "Swift"], [
        { degree: "Bachelor of Science in Systems Engineering" },
      ]),
    ).toEqual(["Bachelor of Science in Systems Engineering"])
    expect(
      findDegreeInSkills(["Licenciatura en Contaduría", "Excel"], [{ degree: "Licenciatura en Contaduría" }]),
    ).toEqual(["Licenciatura en Contaduría"])
  })

  it("says nothing when there is no education section to compare against", () => {
    expect(findDegreeInSkills(["Licenciatura en Contaduría"], [])).toEqual([])
  })
})
