import { describe, it, expect } from "vitest"
import { findProvenUnlistedSkills } from "@/lib/services/ai/shared/proven-skills"

/**
 * The card offers a chip the user taps to ADD a skill, so the string it offers is
 * the string that ends up in their CV and in the ATS matcher.
 *
 * It was offering the wording the prose happened to use. A CV saying "RESTful
 * APIs" matched the entry whose canonical term is "REST", and the chip read
 * "RESTful" — a weaker string for the matcher and inconsistent with every other
 * chip, which carry the catalogue's spelling.
 */
describe("proven skills are offered in their canonical form", () => {
  it("offers REST, not the alias the prose used", () => {
    const out = findProvenUnlistedSkills("Created web applications integrating RESTful APIs across three products.", [])
    expect(out).toContain("REST")
    expect(out).not.toContain("RESTful")
  })

  it("keeps the user's own casing when the prose already used the canonical term", () => {
    const out = findProvenUnlistedSkills("Built the settings screen in SwiftUI and shipped it.", [])
    expect(out).toContain("SwiftUI")
  })

  it("never offers something the CV does not demonstrate", () => {
    expect(findProvenUnlistedSkills("Managed the kitchen roster and supplier orders.", [])).not.toContain("REST")
  })

  it("never offers a skill the user already listed", () => {
    const exp = "Created web applications integrating RESTful APIs."
    expect(findProvenUnlistedSkills(exp, ["REST"])).not.toContain("REST")
  })

  it("works outside tech", () => {
    const out = findProvenUnlistedSkills("Atendió a 30 pacientes por turno registrando signos vitales en la historia clínica.", [])
    expect(out.length).toBeGreaterThan(0)
  })
})
