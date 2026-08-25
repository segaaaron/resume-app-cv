import { describe, it, expect } from "vitest"
import { buildAtsReport } from "@/lib/ats/build-report"
import { allChecks } from "@/lib/ats/report"
import { buildActionPlan } from "@/lib/ats/action-plan"

/**
 * EL ÁRBITRO ESTABA ESCRITO Y NO CONECTADO.
 *
 * `lib/ats/action-plan.ts` implementa "un dueño por objetivo" con su tabla de
 * autoridad, y durante toda una sesión NADIE lo llamó: el panel importaba sólo
 * `textSignature`, `matchesApplied` e `isReadyToSend`. Su propio test daba verde
 * porque probaba la función directo — el defecto que el proyecto ya pagó una vez:
 * un test que no toca el producto.
 *
 * Mientras tanto cada cruce se parcheaba a mano, uno por uno, y el siguiente que
 * apareciera no tenía nada central que lo parara.
 */

describe("el cruce de las habilidades, ahora imposible por construcción", () => {
  /**
   * ANTES lo arbitraba `buildActionPlan` en el panel: un arreglo crítico
   * «Agregar «X»» y el chip de habilidad faltante «X» eran la misma tarea con dos
   * botones, y ninguna lista miraba a la otra.
   *
   * AHORA el informe lo cierra en el origen: la tabla de términos es la dueña de
   * agregar una habilidad —la muestra con su conteo a los dos lados y con los dos
   * botones—, y el ensamblador descarta el hallazgo del reclutador que apunta al
   * mismo objetivo. No hay dos listas que puedan discrepar porque hay una sola.
   *
   * Este test se quedó cuando el árbitro se fue: lo que importaba nunca fue la
   * función, sino que el cruce no exista.
   */
  /**
   * ANTES: `toContain('f.action.kind !== "add_skill"')` y `toContain("onAdd")`.
   * Dos cadenas de código. Verdes con el cruce reabierto, rojas por reformular
   * la condición. Ahora se ejecuta el ensamblador y se mira qué emite.
   */
  it("el ensamblador descarta el hallazgo que duplica la tabla de términos", () => {
    const r = buildAtsReport({
      score: 70, categories: [],
      writing: {
        clicheBullets: [], weakVerbBullets: [], duplicateBullets: [], dateInconsistency: null,
        bulletBalance: [], mergeCandidates: [], chronology: null, futureDates: [], yearsClaim: null,
        nearDuplicates: [], bulletRanking: [], incompleteEducation: [], orphanFragments: [],
        metrics: { level: "ok", findings: [] }, degreeInSkills: [], hasLink: true,
      } as never,
      missingKeywords: ["Salesforce"], listedOnlyKeywords: [], matchedKeywords: [],
      missingSoftSkills: [], matchedSoftSkills: [], unmetRequirements: [],
      templateSafety: "safe",
      // El modelo propone agregar la misma habilidad que la tabla ya ofrece.
      recruiterFixes: [{ issue: "Falta Salesforce", severity: "high", fix: "Agregala", action: { kind: "add_skill", value: "Salesforce" } }],
      jobDescription: "Salesforce imprescindible.",
    })
    // El hallazgo NO se emite: la tabla es la dueña de agregar una habilidad.
    expect(allChecks(r).filter((c) => c.id.startsWith("tips.recruiter"))).toHaveLength(0)
    // Y el término sigue ahí, con su conteo, que es lo que no se puede perder.
    expect(r.terms.find((t) => t.term === "Salesforce")?.cv).toBe(0)
  })
})

describe("la tabla de autoridad hace lo que el panel espera de ella", () => {
  // Si esto cambia, el chip vuelve a aparecer al lado del arreglo crítico.
  it("un arreglo crítico le gana al chip sobre la misma habilidad", () => {
    const out = buildActionPlan([
      { target: "skill:salesforce", source: "critical", severity: "high", actionable: true },
      { target: "skill:salesforce", source: "soft", severity: "low", actionable: true },
    ])
    expect(out).toHaveLength(1)
    expect(out[0].source).toBe("critical")
  })

  it("dos habilidades distintas sobreviven las dos", () => {
    const out = buildActionPlan([
      { target: "skill:salesforce", source: "soft", severity: "low", actionable: true },
      { target: "skill:sap", source: "soft", severity: "low", actionable: true },
    ])
    expect(out).toHaveLength(2)
  })
})
