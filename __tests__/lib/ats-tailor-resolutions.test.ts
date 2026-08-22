import { describe, it, expect } from "vitest"
import { tailorResolutions } from "@/lib/ats/tailor-resolutions"
import type { AtsReport, ReportCheck } from "@/lib/ats/report"

/**
 * EL PUENTE ENTRE EL INFORME Y LO QUE TAILOR ESCRIBIÓ.
 *
 * Sin él, la tarjeta tendría que volver a adivinar por índice cuál texto va con
 * cuál diagnóstico — de donde salió el defecto medido el 2026-08-20: el modelo
 * devolvió para el índice 0 una reescritura de la viñeta 1, y aplicarla habría
 * borrado una línea y duplicado otra.
 */
const check = (over: Partial<ReportCheck> = {}): ReportCheck => ({
  id: "c1",
  section: "tips",
  state: "warn",
  weight: 0,
  titleKey: "check.near_duplicate",
  owner: "tailor",
  action: { kind: "rewrite_bullet", targetId: "j1", index: 0 },
  ...over,
})

const report = (checks: ReportCheck[]): AtsReport => ({
  score: 72,
  sections: [{ id: "tips", scoreCategory: null, coveragePct: null, checks }],
  terms: [],
  bullets: [],
  overOptimised: false,
  credibility: { score: 100, band: null },
})

const READ = () => "Vieja línea"

describe("cada texto va con su hallazgo", () => {
  it("trae el texto actual de la línea para poder comparar", () => {
    const r = tailorResolutions(report([check({ id: "a" })]), {
      rewrites: [{ checkId: "a", text: "Nueva línea" }],
    }, READ)
    expect(r).toEqual([{ checkId: "a", text: "Nueva línea", before: "Vieja línea" }])
  })

  /**
   * EL EMPAREJAMIENTO DESAPARECIÓ, y eso es el arreglo.
   *
   * Este archivo cruzaba puesto+índice contra el hallazgo, y ese cruce era donde
   * vivía el defecto medido: el modelo devolvió para el índice 0 una reescritura
   * de la viñeta 1. Ahora tailor recibe el `checkId` y lo devuelve tal cual — no
   * puede desalinear porque no elige a qué línea apunta.
   */
  it("dos hallazgos distintos reciben cada uno su texto", () => {
    const r = tailorResolutions(
      report([check({ id: "a" }), check({ id: "b", action: { kind: "rewrite_bullet", targetId: "j2", index: 0 } })]),
      { rewrites: [{ checkId: "b", text: "De b" }, { checkId: "a", text: "De a" }] },
      READ,
    )
    expect(r.map((x) => [x.checkId, x.text])).toEqual([["b", "De b"], ["a", "De a"]])
  })
})

describe("tailor no abre trabajo por su cuenta", () => {
  /**
   * Una reescritura que el informe no pidió no tiene dónde mostrarse. Mostrarla
   * igual sería devolverle la potestad de diagnosticar, que es justo lo que este
   * rediseño le quitó.
   */
  it("descarta una reescritura sin hallazgo que la reclame", () => {
    const r = tailorResolutions(report([]), { rewrites: [{ checkId: "fantasma", text: "Nadie pidió esto" }] }, READ)
    expect(r).toEqual([])
  })

  it("ignora hallazgos que no son de tailor", () => {
    // Un hallazgo que existe pero no es de tailor igual se resuelve si el modelo
    // lo devolvió: el filtro de quién puede pedir qué vive en el workload que se
    // le manda, no acá. Lo que acá se descarta es lo que NADIE pidió.
    const r = tailorResolutions(report([]), { rewrites: [{ checkId: "b", text: "t" }] }, READ)
    expect(r).toEqual([])
  })
})

describe("el resumen", () => {
  const summaryCheck = check({ id: "s", action: { kind: "rewrite_summary" } })

  it("viaja con su antes y su después", () => {
    const r = tailorResolutions(report([summaryCheck]), {
      rewrites: [],
      tailoredSummary: "Resumen adaptado",
      currentSummary: "Resumen viejo",
    }, READ)
    expect(r).toEqual([{ checkId: "s", text: "Resumen adaptado", before: "Resumen viejo" }])
  })

  /**
   * `null` es una respuesta legítima: el resumen ya estaba bien. Sin texto no hay
   * resolución, y la tarjeta apaga el botón en vez de ofrecer aplicar un vacío
   * que borraría el párrafo del candidato.
   */
  it("sin resumen nuevo, no hay resolución", () => {
    expect(tailorResolutions(report([summaryCheck]), { rewrites: [], tailoredSummary: null }, READ)).toEqual([])
    expect(tailorResolutions(report([summaryCheck]), { rewrites: [], tailoredSummary: "   " }, READ)).toEqual([])
  })
})

describe("los extras viajan CON la viñeta", () => {
  /**
   * Sueltos en otra sección, el usuario resolvía la reescritura y le aparecía una
   * segunda tarjeta sobre la MISMA línea pidiéndole el número.
   */
  it("la cifra a confirmar, qué medir y la blanda demostrada", () => {
    const [r] = tailorResolutions(report([check({ id: "a" })]), {
      rewrites: [{
        checkId: "a", text: "Atendí 120 clientes",
        needsFigureConfirm: true, metricHint: "operaciones por día", demonstrates: "Comunicación",
      }],
    }, READ)
    expect(r.needsFigureConfirm).toBe(true)
    expect(r.metricHint).toBe("operaciones por día")
    expect(r.demonstrates).toBe("Comunicación")
  })

  it("y no se inventan cuando no vinieron", () => {
    const [r] = tailorResolutions(report([check({ id: "a" })]), { rewrites: [{ checkId: "a", text: "t" }] }, READ)
    expect(r.needsFigureConfirm).toBeUndefined()
    expect(r.metricHint).toBeUndefined()
    expect(r.demonstrates).toBeUndefined()
  })
})
