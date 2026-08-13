import { describe, it, expect } from "vitest"
import { stripSectionLabel } from "@/lib/ats/strip-label"

describe("stripSectionLabel", () => {
  it("removes a section name the model pasted into the content", () => {
    // Reported with the résumé on screen: the summary printed inside the CV as
    // "Professional Summary: iOS Developer with…", under a heading that already
    // said PERFIL.
    expect(stripSectionLabel("Professional Summary: iOS Developer with 11 years of experience."))
      .toBe("iOS Developer with 11 years of experience.")
    expect(stripSectionLabel("Resumen profesional: Enfermera con 9 años en emergencias."))
      .toBe("Enfermera con 9 años en emergencias.")
    expect(stripSectionLabel("Perfil: Soldador certificado con 12 años.")).toBe("Soldador certificado con 12 años.")
  })

  it("leaves a colon that belongs to the writing", () => {
    const line = "Led the integration of RESTful APIs: the work spanned three teams."
    expect(stripSectionLabel(line)).toBe(line)
    const metric = "Reduced crash rate from 1.8% to 0.6%: measured across two releases."
    expect(stripSectionLabel(metric)).toBe(metric)
  })

  it("never returns an empty string", () => {
    // A label with nothing after it is not a repair, and replacing a summary with
    // "" is the worst possible outcome.
    expect(stripSectionLabel("Professional Summary:")).toBe("Professional Summary:")
    expect(stripSectionLabel("   ")).toBe("")
  })
})
