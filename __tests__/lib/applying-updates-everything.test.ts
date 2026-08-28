import { describe, it, expect } from "vitest"
import { buildPanelReport } from "@/lib/ats/panel-report"
import { analyzeWriting } from "@/lib/ats/writing-checks"
import { allChecks, weavableTerms, applyAllPlan } from "@/lib/ats/report"

/**
 * APLICO UNA MEJORA Y TODO SE ACTUALIZA. Ese es el producto.
 *
 * ── LA EXIGENCIA, EN PALABRAS DEL CEO (2026-08-22) ─────────────────────────
 *
 *   «Lo que se busca es que el ATS reporte todo sobre el currículum y sobre
 *    dónde quiere aplicar, donde tailor revisa todo esto y genera soluciones.
 *    Cuando se realicen mejoras de valor curricular para quedar limpio para este
 *    puesto, tus componentes deberían actualizar la información. No debería
 *    existir ningún hueco acá.»
 *
 * ── EL HUECO QUE ESTE ARCHIVO CIERRA, MEDIDO ───────────────────────────────
 *
 * `termOf` ponía `cv: 0` a todo término que el SERVIDOR había marcado como
 * faltante, sin volver a mirar el CV. El usuario escribía una viñeta que decía
 * «GraphQL», el panel se rehacía al instante con los datos vivos, y la tabla le
 * seguía diciendo que su CV no lo dice — medido: 0 → 0.
 *
 * Y de ese cero colgaban CUATRO consumidores: el ejecutor lo seguía pidiendo,
 * «aplicar todo» lo volvía a ofrecer, la anatomía de la viñeta no lo reconocía, y
 * el hallazgo del reclutador quedaba en pie.
 *
 * Un solo punto mal, cinco pantallas mintiendo. Por eso este test NO comprueba
 * una condición interna: aplica una mejora real y exige que las cinco vistas se
 * enteren.
 */
const JD = "iOS Developer con Swift, SwiftUI y GraphQL. Buscamos comunicación clara."

const RESULT = {
  score: 70,
  extractedKeywords: {
    jobTitle: "iOS Developer",
    hardSkills: ["Swift", "SwiftUI", "GraphQL"],
    softSkills: ["Clear communication"],
    mustHaves: [],
  },
  missingKeywords: ["GraphQL"],
  matchedKeywords: ["Swift", "SwiftUI"],
  listedOnlyKeywords: [],
  missingSoftSkills: ["Clear communication"],
  demonstratedSoftSkills: [],
  analysis: {
    verdict: "Le falta demostrar comunicación.",
    criticalFixes: [{
      issue: "La línea 'Responsable de la app' no dice qué hizo",
      severity: "warning",
      fix: "Reescribí esa línea con un verbo de acción",
      action: { kind: "rewrite_bullet", targetId: "j1", index: 0 },
    }],
  },
} as never

const cv = (primeraLinea: string) => ({
  personalDetails: { firstName: "Ana", jobTitle: "iOS Developer" },
  skills: [{ id: "s1", name: "Swift" }, { id: "s2", name: "SwiftUI" }],
  workExperience: [{
    id: "j1", jobTitle: "iOS Developer", currentlyWorking: true,
    description: [primeraLinea, "• Desarrollé pantallas en SwiftUI para el flujo de pagos con manejo de errores"].join("\n"),
  }],
})

const informe = (primeraLinea: string) => buildPanelReport({
  result: RESULT,
  writing: analyzeWriting(cv(primeraLinea), []),
  sectionData: cv(primeraLinea),
  jobDescription: JD,
})

/** El CV antes, y el mismo CV con la mejora ya aplicada. */
const ANTES = informe("• Responsable de la app")
const DESPUES = informe("• Integré consultas GraphQL para el catálogo, definiendo fragmentos reutilizables y manejo de errores parciales")

describe("aplicar una mejora actualiza TODAS las vistas", () => {
  it("la tabla de términos deja de decir que falta", () => {
    expect(ANTES.terms.find((t) => t.term === "GraphQL")?.cv).toBe(0)
    expect(DESPUES.terms.find((t) => t.term === "GraphQL")?.cv).toBeGreaterThan(0)
  })

  it("el ejecutor deja de pedirlo", () => {
    expect(weavableTerms(ANTES).map((t) => t.term)).toContain("GraphQL")
    expect(weavableTerms(DESPUES).map((t) => t.term)).not.toContain("GraphQL")
  })

  it("«aplicar todo» deja de ofrecerlo", () => {
    expect(applyAllPlan(ANTES, new Set(), new Set()).terms).toContain("GraphQL")
    expect(applyAllPlan(DESPUES, new Set(), new Set()).terms).not.toContain("GraphQL")
  })

  it("la anatomía de la viñeta reconoce el término en la línea nueva", () => {
    expect(ANTES.bullets[0].keywords).toEqual([])
    expect(DESPUES.bullets[0].keywords).toContain("GraphQL")
  })

  /**
   * Y el hallazgo del reclutador se cae solo: su cita ya no está en el CV. Es la
   * mitad que ya funcionaba, y se fija para que siga funcionando.
   */
  it("el hallazgo del reclutador sobre esa línea desaparece", () => {
    // Vive donde el ensamblador lo puso: si la línea ya tenía tarjeta —la
    // determinista gana, es reproducible— su consejo se fusionó en ella en vez
    // de abrir una segunda sobre el mismo renglón. Lo que se mide es que SIGA AL
    // CV, no el prefijo del id que lo transporta.
    const aporte = (r: ReturnType<typeof informe>) =>
      allChecks(r).filter((c) => c.id.startsWith("tips.recruiter") || (!!c.fixHint && c.action?.kind === "rewrite_bullet"))
    expect(aporte(ANTES).length).toBeGreaterThan(0)
    expect(aporte(DESPUES)).toHaveLength(0)
  })

  /**
   * La parte sutil, y la que hace que el arreglo no rompa nada: un término que el
   * análisis dio por presente POR SINÓNIMO no aparece literal en el texto.
   * Contarlo sólo por letra lo devolvería a «faltante» y el panel volvería a
   * pedirle algo que ya tiene.
   */
  it("un término probado por sinónimo no vuelve a «faltante»", () => {
    const r = informe("• Trabajé con APIs REST en el backend del producto")
    expect(r.terms.find((t) => t.term === "Swift")?.cv).toBeGreaterThan(0)
  })
})
