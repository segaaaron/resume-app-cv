import { describe, it, expect } from "vitest"
import { appearsIn, normaliseFigures, recoverContact, hostOf, linesForRole, tighten } from "@/lib/services/ai/shared/import-recovery"
import { hasHardCodedFact, isGroundedIn } from "@/lib/services/ai/shared/ai-helpers"

/**
 * The verification that used to delete the user's own data.
 *
 * Every case below was measured against the old code before this file existed,
 * and every one of them ended in something being silently removed from a CV the
 * person had just uploaded. The extractor does not preserve the spacing a PDF
 * renders, so a literal substring check reads correct data as invented.
 */
const PDF = `MIGUEL ANGEL SARAVIA
mikisaravia ios@gmail.com
+591 769 44986
linkedin.com/in/ miguelsaravia
EXPERIENCIA
Xiobit  iOS Developer  2015 - 2016
• Desarrollé apps iOS con Objective-C y Swift
• Integré servicios REST con el equipo de backend
• Publiqué 3 apps en la App Store
Rappi  iOS Developer  2021 - 2022
• Implementé programación reactiva con RxSwift`

describe("what the PDF says, the CV keeps", () => {
  it("recovers an email the extractor split in two", () => {
    // The old check compared literally and answered "" — the person imported
    // their own CV and lost their own email. Normalised, the split address is
    // recognised as the address it is.
    expect(isGroundedIn("mikisaraviaios@gmail.com", PDF.toLowerCase())).toBe(false) // the old check
    expect(appearsIn("mikisaraviaios@gmail.com", PDF)).toBe(true)                   // the new one
    expect(recoverContact("email", "mikisaraviaios@gmail.com", PDF)).toBe("mikisaraviaios@gmail.com")
  })

  it("recovers a phone number written with spaces", () => {
    expect(recoverContact("phone", "+59176944986", PDF)).toContain("591")
    expect(recoverContact("phone", "+59176944986", PDF).replace(/\D/g, "")).toBe("59176944986")
  })

  it("recovers a profile URL the extractor broke", () => {
    expect(recoverContact("url", "linkedin.com/in/miguelsaravia", PDF, hostOf("linkedin.com/in/miguelsaravia")))
      .toContain("linkedin.com/in/")
  })

  it("returns empty only when the document truly has none", () => {
    // Not a verification failure — a fact about the CV.
    expect(recoverContact("email", "invented@nowhere.com", "Juan Perez\nAlbañil\nSin contacto")).toBe("")
  })

  /**
   * "15 %" and "15%" are the same achievement. The old check cut the line.
   */
  it("stops treating a re-spaced figure as an invented one", () => {
    const source = "• Improved software quality, reducing production bugs by 15%"
    const model = "Improved software quality, reducing production bugs by 15 %"
    expect(hasHardCodedFact(model, source)).toBe(true)                                   // before
    expect(hasHardCodedFact(normaliseFigures(model), normaliseFigures(source))).toBe(false) // after
  })

  it("still catches a figure that is genuinely not in the CV", () => {
    // The protection that matters is intact: 20% is not 15%.
    const source = "• Reduced production bugs by 15%"
    const invented = "Reduced production bugs by 20%"
    expect(hasHardCodedFact(normaliseFigures(invented), normaliseFigures(source))).toBe(true)
  })

  it("reads thousands separators as one number", () => {
    expect(normaliseFigures("atendí 1.200 clientes")).toBe(normaliseFigures("atendí 1200 clientes"))
  })

  /**
   * The role that arrived empty. Rather than leaving the hole, the lines are
   * read back out of the document — the person's own words, copied.
   */
  it("recovers a role's bullets from the document itself", () => {
    const lines = linesForRole(PDF, "iOS Developer", "Xiobit").split("\n")
    expect(lines.length).toBe(3)
    expect(lines[0]).toContain("Objective-C")
    expect(lines[2]).toContain("App Store")
  })

  it("does not steal the next role's lines", () => {
    const xiobit = linesForRole(PDF, "iOS Developer", "Xiobit")
    expect(xiobit).not.toContain("RxSwift")
    const rappi = linesForRole(PDF, "iOS Developer", "Rappi")
    expect(rappi).toContain("RxSwift")
    expect(rappi).not.toContain("Objective-C")
  })

  it("returns nothing for a role the document does not describe", () => {
    expect(linesForRole(PDF, "Chef", "Restaurante Gustu")).toBe("")
  })

  it("matches on spacing and case, never on meaning", () => {
    expect(tighten("Banco Mercantil S.A.")).toBe(tighten("bancomercantilsa"))
    // Different companies stay different — normalisation is not fuzziness.
    expect(appearsIn("Banco Nacional", "trabajé en Banco Mercantil")).toBe(false)
  })
})
