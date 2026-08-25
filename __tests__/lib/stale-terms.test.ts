import { describe, it, expect } from "vitest"
import { findStaleTerms, STALE_AFTER_YEARS } from "@/lib/ats/stale-terms"

/**
 * EL GATE DE F3: NINGÚN CV BAJA DE PUNTAJE POR ESTO.
 *
 * La recencia de una habilidad es una señal real —los ATS la miran— pero entra
 * como AVISO. Este test fija las dos mitades: que se detecte el caso, y que no
 * se detecte cuando no corresponde, para que el aviso no se vuelva ruido.
 */
const AHORA = new Date("2026-06-01T00:00:00Z")

const cv = (roles: Array<{ jobTitle: string; description: string; endDate?: string; currentlyWorking?: boolean }>) =>
  ({ workExperience: roles.map((r, i) => ({ id: `w${i}`, ...r })) }) as Record<string, unknown>

describe("los términos que quedaron en un puesto viejo", () => {
  it("marca el que sólo aparece en un puesto que terminó hace mucho", () => {
    const r = findStaleTerms(["Swift"], cv([
      { jobTitle: "iOS Developer", description: "• Escribí la app en Swift.", endDate: "12/2016" },
      { jobTitle: "Backend Dev", description: "• Servicios en Node.", endDate: "12/2025" },
    ]), AHORA)
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ term: "Swift", jobTitle: "iOS Developer", year: 2016 })
  })

  it("calla si el término también está en un puesto reciente", () => {
    const r = findStaleTerms(["Swift"], cv([
      { jobTitle: "iOS Developer", description: "• Escribí la app en Swift.", endDate: "12/2016" },
      { jobTitle: "Mobile Lead", description: "• Mantengo la app en Swift.", currentlyWorking: true },
    ]), AHORA)
    expect(r).toEqual([])
  })

  it("calla si el término no está en ningún lado: eso ya lo dice el hallazgo de término faltante", () => {
    const r = findStaleTerms(["Kotlin"], cv([
      { jobTitle: "iOS Developer", description: "• Escribí la app en Swift.", endDate: "12/2016" },
    ]), AHORA)
    expect(r).toEqual([])
  })

  it("respeta el umbral declarado, sin números sueltos", () => {
    const justoAlBorde = new Date(AHORA)
    const anioBorde = AHORA.getFullYear() - STALE_AFTER_YEARS + 1
    const r = findStaleTerms(["Swift"], cv([
      { jobTitle: "iOS Developer", description: "• App en Swift.", endDate: `12/${anioBorde}` },
    ]), justoAlBorde)
    expect(r, "un puesto dentro del umbral no está viejo").toEqual([])
  })
})
