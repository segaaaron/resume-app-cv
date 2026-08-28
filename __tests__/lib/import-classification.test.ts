import { describe, it, expect } from "vitest"
import { classifyImportedTerms } from "@/lib/skills/import-classification"

/**
 * These call the REAL classifier. The previous tests re-implemented it by
 * copy-paste and thirty-nine of them passed green while the product moved a
 * candidate's dated bootcamps into their skill chips — a test that re-implements
 * the rule tests the copy, and the copy is never what ships.
 *
 * The fixture is a whole import, both lists at once, because the bug was in the
 * ROUTING between them and no single-entry test could see it.
 */
const REAL_IMPORT = {
  skills: [
    { name: "Swift" }, { name: "Objetive-C" }, { name: "Cocoa Touch" }, { name: "Git" },
    { name: "Core Data" }, { name: "Systems engineer" }, { name: "Design Guidelines" },
    { name: "Code Review" }, { name: "MVVM" }, { name: "VIPER" },
    // What the model wrongly swept in from the certifications column.
    { name: "Concurrency IOS swith Swift (2025)" },
    { name: "SwiftUI 6 & MVVM Bootcamp (2025)" },
    { name: "Master swift swiftUI app The Hard Way (2025)" },
    { name: "Asynchronous programming with combine (2024)" },
    { name: "Unit Test swift (2024)" },
  ],
  certifications: [
    { name: "MVP" },
    { name: "SwiftUI" },
    { name: "Unit testing" },
    { name: "Functional Programming" },
    { name: "App Development with Swift Associate (2024)" },
  ],
}

describe("the whole import, routed in both directions", () => {
  const out = classifyImportedTerms(REAL_IMPORT)
  const skillNames = out.skills.map((s) => s.name)
  const certNames = out.certifications.map((c) => c.name)

  it("puts every dated course back in certifications", () => {
    for (const n of [
      "Concurrency IOS swith Swift (2025)",
      "SwiftUI 6 & MVVM Bootcamp (2025)",
      "Master swift swiftUI app The Hard Way (2025)",
      "Asynchronous programming with combine (2024)",
      "Unit Test swift (2024)",
      "App Development with Swift Associate (2024)",
    ]) {
      expect(certNames).toContain(n)
      expect(skillNames).not.toContain(n)
    }
  })

  it("rescues the capabilities that bled into the certifications column", () => {
    for (const n of ["SwiftUI", "Unit testing", "Functional Programming"]) {
      expect(skillNames).toContain(n)
      expect(certNames).not.toContain(n)
    }
  })

  it("leaves the real skills alone", () => {
    for (const n of ["Swift", "Objetive-C", "Cocoa Touch", "Git", "Core Data", "MVVM", "VIPER", "Code Review"]) {
      expect(skillNames).toContain(n)
    }
  })

  it("leaves the ambiguous acronym where the source put it", () => {
    expect(certNames).toContain("MVP")
  })

  // The promise: routing, never deletion.
  it("loses nothing — every entry comes out in exactly one list", () => {
    const all = [...REAL_IMPORT.skills, ...REAL_IMPORT.certifications].map((x) => x.name)
    for (const n of all) {
      const inSkills = skillNames.includes(n)
      const inCerts = certNames.includes(n)
      expect(inSkills || inCerts).toBe(true)
      expect(inSkills && inCerts).toBe(false)
    }
  })
})

/**
 * The same defect is a LAYOUT problem, not a tech problem: it happens to a nurse,
 * an accountant and an electrician with the same two-column template.
 */
describe("held-out: other professions, both directions", () => {
  it("rescues capabilities and keeps credentials, in Spanish and English", () => {
    const out = classifyImportedTerms({
      skills: [
        { name: "Excel" },
        { name: "Curso de manipulación de alimentos (2024)" },
        { name: "OSHA 30 Construction (2023)" },
      ],
      certifications: [
        { name: "Patient care" },
        { name: "Signos vitales" },
        { name: "Conciliación bancaria" },
        { name: "Soldadura" },
        { name: "PMP" },
        { name: "CPA" },
        { name: "RN" },
        { name: "AWS Solutions Architect" },
        { name: "ServSafe Manager" },
        { name: "Licencia de Enfermería" },
      ],
    })
    const skills = out.skills.map((s) => s.name)
    const certs = out.certifications.map((c) => c.name)

    for (const n of ["Patient care", "Signos vitales", "Conciliación bancaria", "Soldadura"]) {
      expect(skills).toContain(n)
    }
    // Credentials with no date survive because acronyms and unknown terms never move.
    for (const n of ["PMP", "CPA", "RN", "AWS Solutions Architect", "ServSafe Manager", "Licencia de Enfermería"]) {
      expect(certs).toContain(n)
    }
    // Dated courses filed as skills go back.
    for (const n of ["Curso de manipulación de alimentos (2024)", "OSHA 30 Construction (2023)"]) {
      expect(certs).toContain(n)
    }
    expect(skills).toContain("Excel")
  })

  it("an entry with an issuer or a date is never touched", () => {
    const out = classifyImportedTerms({
      skills: [],
      certifications: [
        { name: "Patient care", issuer: "Red Cross" },
        { name: "Soldadura", date: "2023" },
      ],
    })
    expect(out.certifications.map((c) => c.name)).toEqual(["Patient care", "Soldadura"])
    expect(out.skills).toHaveLength(0)
  })

  it("handles empty input", () => {
    expect(classifyImportedTerms({ skills: [], certifications: [] })).toEqual({ skills: [], certifications: [] })
  })
})
