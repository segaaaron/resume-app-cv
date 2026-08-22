import { describe, it, expect } from "vitest"
import { vi } from "vitest"
vi.mock("@/lib/db", () => ({ db: {} }))
import { buildModePrompt } from "@/lib/services/ai/modules/profile-modes"

/**
 * EL ASISTENTE ESCRIBE PARA UN PUESTO, NO AL AIRE.
 *
 * ── LA ORDEN (CEO, 2026-08-22) ─────────────────────────────────────────────
 *
 *   «Debería saber la IA qué tipo de información debe generar, de alto impacto
 *    para el usuario.»
 *
 * El asistente escribe viñetas y el resumen que terminan en el MISMO CV que el
 * panel puntúa, y no sabía nada de la vacante: el resultado del ATS vivía dentro
 * de un hook que monta un solo componente. Nombraba bien el contenido del oficio
 * —que es su valor— pero no podía elegir CUÁL parte de ese oficio nombrar. De
 * dos verdades igual de reales sobre el mismo trabajo, la que la vacante busca
 * es la que le consigue la entrevista.
 *
 * ── Y LA MITAD QUE IMPIDE EL DAÑO ──────────────────────────────────────────
 *
 * «Apuntá a esta vacante» leído solo es permiso para afirmar lo que la vacante
 * quiere oír. Por eso el bloque dice las dos cosas: cuáles son los términos, y
 * que sólo puede usar los que el relato del candidato respalde. Si un día
 * alguien borra la segunda mitad, este test falla.
 */
const build = (posting?: { terms?: string[]; title?: string }) =>
  buildModePrompt("bullets", "Cajero: hice arqueo de caja", "es", {}, posting).system

describe("las viñetas del asistente apuntan al puesto", () => {
  it("sin vacante analizada, el prompt es el de siempre", () => {
    const s = build()
    expect(s).not.toContain("EL PUESTO AL QUE APUNTA ESTE CV")
  })

  it("con vacante, le dice el cargo y los términos", () => {
    const s = build({ terms: ["Salesforce", "conciliación bancaria"], title: "Analista de Tesorería" })
    expect(s).toContain("EL PUESTO AL QUE APUNTA ESTE CV: Analista de Tesorería")
    expect(s).toContain("Salesforce")
    expect(s).toContain("conciliación bancaria")
  })

  /** La mitad que impide convertir el foco en licencia para inventar. */
  it("y le prohíbe usar un término que el relato no respalde", () => {
    const s = build({ terms: ["Salesforce"], title: "Analista" })
    expect(s).toContain("USÁ SÓLO los términos que su relato respalde de verdad")
    expect(s).toContain("ésa es una respuesta correcta")
  })

  it("en inglés dice lo mismo", () => {
    const s = buildModePrompt("bullets", "Teller: I did the till count", "en", {}, { terms: ["Salesforce"], title: "Treasury Analyst" }).system
    expect(s).toContain("THE JOB THIS CV IS AIMED AT: Treasury Analyst")
    expect(s).toContain("USE ONLY the terms their account genuinely backs")
  })

  /** Una lista vacía no es una vacante: no se pinta un encabezado hueco. */
  it("una vacante sin términos ni cargo no agrega nada", () => {
    expect(build({ terms: [], title: "" })).not.toContain("EL PUESTO AL QUE APUNTA")
  })
})
