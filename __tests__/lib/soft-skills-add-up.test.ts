import { describe, it, expect } from "vitest"
import { buildPanelReport } from "@/lib/ats/panel-report"
import { analyzeWriting } from "@/lib/ats/writing-checks"

/**
 * EL NÚMERO DE BLANDAS Y SU LISTA CUENTAN LO MISMO.
 *
 * ── EL DEFECTO (reportado con captura, 2026-08-22) ─────────────────────────
 *
 *   «Está en 84%, esa información que tengo ¿para qué me sirve? ¿Cómo llego al
 *    100?»
 *
 * La sección mostraba CINCO blandas, las cinco bajo «DEMOSTRADAS», ninguna
 * faltante — y el encabezado decía 84%. La pregunta no tenía respuesta posible
 * en pantalla: lo que le faltaba no estaba dibujado en ningún lado.
 *
 * La tabla se armaba con dos baldes —probadas y ausentes— y una blanda que el CV
 * SÍ dice pero sólo en la lista de habilidades no cae en ninguno. El puntaje le
 * aplicaba el descuento y la pantalla no la nombraba.
 *
 * Este test EJECUTA el informe y compara la lista contra la aritmética del
 * puntaje. Un test que leyera el código no puede ver que dos números no cuadran.
 */
const SECTION_DATA = {
  summary: "Ejecutivo comercial.",
  workExperience: [{
    id: "job-1", jobTitle: "Ejecutivo Comercial", employer: "Acme",
    startDate: "2020-01", endDate: "2024-01",
    description: "• Negocié contratos anuales con clientes corporativos del rubro retail.",
  }],
  skills: [{ name: "Trabajo en equipo" }, { name: "Comunicación" }],
}

const build = (over: Record<string, unknown>) =>
  buildPanelReport({
    result: {
      score: 84,
      extractedKeywords: { jobTitle: "Ejecutivo", hardSkills: [], softSkills: ["Negociación", "Trabajo en equipo", "Comunicación"], mustHaves: [] },
      matchedKeywords: [], missingKeywords: [], missingSoftSkills: [],
      demonstratedSoftSkills: ["Negociación"],
      listedOnlyKeywords: ["Trabajo en equipo", "Comunicación"],
      scoreBreakdown: { categories: [] },
      ...over,
    } as never,
    writing: analyzeWriting(SECTION_DATA),
    sectionData: SECTION_DATA,
    jobDescription: "Ejecutivo comercial con negociación, trabajo en equipo y comunicación.",
  })

const soft = (r: ReturnType<typeof build>) => r.terms.filter((x) => x.section === "soft")

describe("la sección de blandas muestra todo lo que el puntaje cobra", () => {
  it("una blanda que sólo está en la lista aparece en la tabla", () => {
    const nombres = soft(build({})).map((x) => x.term)
    expect(nombres).toContain("Trabajo en equipo")
    expect(nombres).toContain("Comunicación")
  })

  /**
   * Y APARECE COMO LO QUE ES. Pintarla junto a las demostradas sería el defecto
   * de vuelta con otra cara: la lista completa, y el 84 igual de inexplicable.
   */
  it("y aparece marcada como afirmada, no como demostrada", () => {
    const porTermino = new Map(soft(build({})).map((x) => [x.term, x]))
    expect(porTermino.get("Trabajo en equipo")?.listOnly).toBe(true)
    expect(porTermino.get("Negociación")?.listOnly).toBe(false)
  })

  /**
   * LA COMPROBACIÓN QUE ATA LOS DOS NÚMEROS. Toda blanda que la vacante pide
   * tiene que estar dibujada en alguno de los tres grupos. Mientras se cumpla, el
   * porcentaje no puede volver a cobrar algo que la pantalla no nombra.
   */
  it("ninguna blanda de la vacante queda fuera de la tabla", () => {
    const pedidas = ["Negociación", "Trabajo en equipo", "Comunicación"]
    const dibujadas = new Set(soft(build({})).map((x) => x.term.toLowerCase()))
    expect(pedidas.filter((p) => !dibujadas.has(p.toLowerCase()))).toEqual([])
  })

  /** El error simétrico: una duplicada no puede aparecer dos veces. */
  it("no la repite si ya venía como demostrada", () => {
    const r = build({ demonstratedSoftSkills: ["Negociación", "Trabajo en equipo"] })
    const nombres = soft(r).map((x) => x.term)
    expect(nombres.filter((n) => n === "Trabajo en equipo")).toHaveLength(1)
  })
})
