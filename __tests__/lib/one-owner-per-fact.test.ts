import { describe, it, expect } from "vitest"
import { buildAtsReport, type BuildReportInput } from "@/lib/ats/build-report"
import { allChecks, missingTerms, unbackedTerms, weavableTerms, solvableChecks, tailorWorkload } from "@/lib/ats/report"
import type { WritingChecks } from "@/lib/ats/writing-checks"

/**
 * UN DATO, UN DUEÑO, UN LUGAR.
 *
 * «Cada cosa debería tener una responsabilidad. Cada componente debe usar una
 * sola responsabilidad. No tener 3 cosas que solucionen una cosa, eso está mal»
 * (CEO, 2026-08-21).
 *
 * Las habilidades «sólo en la lista» llegaron a decirse en CUATRO sitios: un
 * hallazgo con sus chips, la barra de contexto con los suyos, la tabla de
 * términos y —desde la ronda anterior— la tarjeta del ejecutor. Ninguno estaba
 * mal por sí solo; juntos hacían que el panel se leyera como si se contradijera.
 *
 * Estos tests EJECUTAN el informe. No leen el código fuente: un test que busca
 * una cadena en un archivo da verde con el producto roto, y de eso este panel ya
 * tiene cincuenta.
 */
const emptyWriting = (): WritingChecks => ({
  clicheBullets: [], weakVerbBullets: [], duplicateBullets: [], dateInconsistency: null,
  bulletBalance: [], mergeCandidates: [], chronology: null, futureDates: [], yearsClaim: null,
  nearDuplicates: [], bulletRanking: [], incompleteEducation: [], orphanFragments: [],
  metrics: { level: "ok", findings: [] } as unknown as WritingChecks["metrics"],
  degreeInSkills: [], hasLink: true,
})

const input = (over: Partial<BuildReportInput> = {}): BuildReportInput => ({
  score: 72,
  categories: [],
  writing: emptyWriting(),
  missingKeywords: [],
  listedOnlyKeywords: [],
  matchedKeywords: [],
  missingSoftSkills: [],
  matchedSoftSkills: [],
  unmetRequirements: [],
  templateSafety: "safe",
  recruiterFixes: [],
  ...over,
})

describe("los términos «sólo en la lista» se dicen una vez", () => {
  const report = () =>
    buildAtsReport(input({
      listedOnlyKeywords: ["CRM", "Venta consultiva"],
      matchedKeywords: ["CRM", "Venta consultiva"],
      jobDescription: "Buscamos CRM y venta consultiva. CRM imprescindible.",
    }))

  /**
   * El hallazgo era la tercera voz y no tenía responsabilidad propia: enumeraba
   * lo que la tabla enumera, sin el conteo que la vuelve auditable y sin el
   * botón que la resuelve.
   */
  it("ya no existe un hallazgo que los vuelva a enumerar", () => {
    expect(allChecks(report()).map((c) => c.id)).not.toContain("search.listed_only")
  })

  /** Pero el dato NO se perdió: sigue marcado en cada término. */
  it("siguen marcados como afirmados sin respaldo", () => {
    expect(unbackedTerms(report()).map((t) => t.term).sort()).toEqual(["CRM", "Venta consultiva"])
  })

  /** Y siguen teniendo salida: el ejecutor puede escribirlos en una viñeta. */
  it("y siguen siendo trabajo del ejecutor", () => {
    expect(weavableTerms(report()).map((t) => t.term)).toContain("CRM")
  })
})

describe("cada término se cuenta una sola vez como trabajo", () => {
  const report = () =>
    buildAtsReport(input({
      listedOnlyKeywords: ["CRM"],
      matchedKeywords: ["CRM"],
      missingKeywords: ["Salesforce"],
      jobDescription: "CRM y Salesforce.",
    }))

  /**
   * LA REGLA QUE HACE QUE LOS NÚMEROS NO SE PELEEN. Un término es trabajo del
   * ejecutor por SER un término, nunca además por colgar de un hallazgo. Cuando
   * las dos cosas pasaban a la vez, el botón prometía un número y resolvía otro
   * — el defecto que costó la sesión del 21.
   */
  it("ningún hallazgo del informe reclama un término como propio", () => {
    const r = report()
    const terms = new Set(weavableTerms(r).map((t) => t.term.toLowerCase()))
    const claimed = solvableChecks(r).flatMap((c) => c.evidence ?? [])
    const overlap = claimed.filter((e) => terms.has(e.toLowerCase()))
    expect(overlap).toEqual([])
  })

  /**
   * Y el pedido al modelo tampoco los repite: los términos viajan como término,
   * con su propia llamada, no como un hallazgo sin línea que apuntar.
   */
  it("el pedido al modelo no los incluye como hallazgo", () => {
    const r = report()
    const terms = new Set(weavableTerms(r).map((t) => t.term.toLowerCase()))
    const inWorkload = tailorWorkload(r).flatMap((c) => c.evidence ?? []).filter((e) => terms.has(e.toLowerCase()))
    expect(inWorkload).toEqual([])
  })

  it("lo que falta y lo afirmado sin respaldo no se pisan entre sí", () => {
    const r = report()
    const missing = new Set(missingTerms(r).map((t) => t.term))
    const unbacked = unbackedTerms(r).map((t) => t.term)
    expect(unbacked.filter((t) => missing.has(t))).toEqual([])
  })
})

/**
 * LA BARRA DE CONTEXTO YA NO EXISTE, así que no hay nada que vigilar.
 *
 * Acá se comprobaba que `KeywordContextPanel` diera el agregado y no volviera a
 * listar los términos uno por uno. El componente se borró entero: un porcentaje
 * sin un solo botón no ayudaba a nadie, y lo que resumía ya lo dice la tabla con
 * su conteo auditable y su acción.
 *
 * Que ningún componente nuevo vuelva a enumerar términos lo cubren los tests de
 * arriba, que ejecutan el informe.
 */
