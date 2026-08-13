import { describe, it, expect } from "vitest"
import { suggestFigureSlot } from "@/lib/ats/figure-slot"

describe("suggestFigureSlot", () => {
  it("stays quiet on a line that already has a figure", () => {
    expect(suggestFigureSlot("Trained 14 nurses during onboarding")).toBeNull()
  })

  it("asks for a before and after on a change verb, in either language", () => {
    expect(suggestFigureSlot("Reduced patient wait times in triage")?.kind).toBe("delta")
    expect(suggestFigureSlot("Reduje los tiempos de espera en recepción", "es")?.example)
      .toBe("Reduje los tiempos de espera en recepción, de ___ a ___")
  })

  it("asks for headcount, money and time by verb class", () => {
    expect(suggestFigureSlot("Supervised the evening kitchen staff")?.kind).toBe("people")
    expect(suggestFigureSlot("Negotiated supplier contracts for the branch")?.kind).toBe("money")
    expect(suggestFigureSlot("Automated the weekly payroll report")?.kind).toBe("time")
    expect(suggestFigureSlot("Processed incoming freight at the dock")?.kind).toBe("volume")
  })

  it("asks a real question on a built thing, in units any job has", () => {
    const slot = suggestFigureSlot("Developed modular and reusable components to accelerate delivery")
    expect(slot?.kind).toBe("reach")
    // Never domain-specific: a teacher, a welder and a nurse all build things
    // that reach people, exist in a quantity, and save time.
    for (const line of [slot!.example, ...(slot!.alternatives ?? [])]) {
      expect(line).not.toMatch(/screen|sprint|deploy|commit/i)
      expect(line.startsWith("Developed modular and reusable components")).toBe(true)
    }
    expect(slot!.alternatives).toHaveLength(2)
  })

  it("offers placements instead of a bare slot when the verb says nothing", () => {
    const slot = suggestFigureSlot("Coordiné la agenda del equipo de limpieza del turno noche", "es")
    expect(slot).not.toBeNull()
    expect([slot!.example, ...(slot!.alternatives ?? [])].every((l) => l.includes("___"))).toBe(true)
  })

  it("still answers when the verb is unfamiliar", () => {
    // "Wrote" now reads as building something, which is the better answer for it.
    const slot = suggestFigureSlot("Oversaw the reception desk on the night shift")
    expect(slot?.kind).toBe("scale")
    // Always the candidate's own words, never a rewrite.
    expect(slot?.example.startsWith("Oversaw the reception desk on the night shift")).toBe(true)
  })
})
