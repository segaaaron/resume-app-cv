import { describe, it, expect } from "vitest"
import { buildAtsReport, type BuildReportInput } from "@/lib/ats/build-report"
import { weavableTerms, missingTerms } from "@/lib/ats/report"

/**
 * LO QUE EL RIEL OFRECE, EL EJECUTOR LO TIENE.
 *
 * ── EL DEFECTO (reportado con captura, 2026-08-22) ─────────────────────────
 *
 *   «Agrego un Add o un Prove it pero me lleva al tailor y no me muestra nada.»
 *
 * La prueba estaba en la propia captura: las dos habilidades que fallaban decían
 * «could not count it» debajo. Eso es `jd === 0`, y el ejecutor exigía `jd > 0`
 * para tomar el término como trabajo suyo.
 *
 * `jd` es el contador que se MUESTRA —«la vacante lo pide 3 veces»— y vale 0
 * cuando el aviso escribe el requisito con otras palabras: la extracción devuelve
 * la forma canónica («Strategic thinking») y el texto original dice «thinks
 * strategically». No poder contarlo es correcto y está dicho en pantalla.
 *
 * Lo que no puede pasar es que ese contador decida la PERTENENCIA. La tarjeta se
 * dibujaba con sus dos botones, el usuario apretaba, y el modal se abría vacío.
 *
 * ── LA REGLA QUE ESTE ARCHIVO FIJA ─────────────────────────────────────────
 *
 * Todo término que el riel pinta con un botón tiene que existir para el
 * ejecutor. Son la misma lista vista desde dos lados; si se separan, el panel se
 * contradice a la vista del usuario — que es el defecto de fondo que esta
 * semana entera vino a cerrar.
 */
const base = (over: Partial<BuildReportInput> = {}) => ({
  score: 90, categories: [], matchedKeywords: [], listedOnlyKeywords: [],
  unmetRequirements: [], templateSafety: "safe", recruiterFixes: [],
  writing: { clicheBullets: [], weakVerbBullets: [], duplicateBullets: [], dateInconsistency: null,
    bulletBalance: [], mergeCandidates: [], chronology: null, futureDates: [], yearsClaim: null,
    nearDuplicates: [], bulletRanking: [], incompleteEducation: [], orphanFragments: [],
    metrics: { level: "ok", findings: [] }, degreeInSkills: [], hasLink: true },
  missingSoftSkills: [], matchedSoftSkills: [], missingKeywords: [],
  jobDescription: "", resumeText: "",
  ...over,
} as unknown as BuildReportInput)

describe("un término que el riel ofrece, el ejecutor lo tiene", () => {
  /** El caso reportado: la vacante lo pide con otras palabras. */
  const conOtrasPalabras = () => buildAtsReport(base({
    missingSoftSkills: ["Strategic thinking", "Continuous learning"],
    missingKeywords: ["GraphQL"],
    jobDescription: "We want someone who thinks strategically and keeps learning. GraphQL required.",
    resumeText: "iOS Developer",
  }))

  it("aunque el contador de la vacante sea 0, el término es trabajo del ejecutor", () => {
    const r = conOtrasPalabras()
    const sinContar = r.terms.filter((t) => t.jd === 0 && t.cv === 0).map((t) => t.term)
    expect(sinContar).toEqual(["Strategic thinking", "Continuous learning"])
    expect(weavableTerms(r).map((t) => t.term)).toEqual(expect.arrayContaining(sinContar))
  })

  /**
   * La regla, sobre todo el informe: cada término que el riel pinta con botón
   * —los que faltan y los que están sólo en la lista— existe para el ejecutor.
   */
  it("ningún término con botón queda fuera del ejecutor", () => {
    const r = conOtrasPalabras()
    const conBoton = r.terms.filter((t) => t.section !== "other" && (t.cv === 0 || t.listOnly)).map((t) => t.term)
    const enElEjecutor = new Set(weavableTerms(r).map((t) => t.term))
    expect(conBoton.filter((t) => !enElEjecutor.has(t))).toEqual([])
  })

  /** Y lo suyo propio sigue afuera: no mueve el puntaje, no es trabajo. */
  it("las habilidades propias que la vacante no pide siguen sin entrar", () => {
    const r = buildAtsReport(base({
      cvSkills: ["Kotlin"], resumeText: "Kotlin", missingKeywords: ["GraphQL"],
      jobDescription: "GraphQL required",
    }))
    expect(missingTerms(r).map((t) => t.term)).not.toContain("Kotlin")
  })
})
