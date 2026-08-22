import { describe, it, expect } from "vitest"
import { buildAtsReport, type BuildReportInput } from "@/lib/ats/build-report"
import { allChecks } from "@/lib/ats/report"
import type { WritingChecks } from "@/lib/ats/writing-checks"
import type { ATSContentQuality } from "@/lib/services/ai/shared/ai-types"

/**
 * UN HALLAZGO DEL RECLUTADOR DICE QUÉ CAMBIAR, O NO SE PUEDE APRETAR.
 *
 * ── EL DEFECTO, REPORTADO CON CAPTURA (CEO, 2026-08-21) ────────────────────
 *
 * La tarjeta mostraba una cita del modelo, la etiqueta «AVISO · no mueve el
 * número» y un botón «Aplicar». Nada más. Su pregunta fue literal: «me decís
 * algo pero no existe mejora para eso, ¿qué mierda hago con eso?».
 *
 * Y no faltaba el dato: el modelo devuelve `fix` —«el cambio exacto a hacer»,
 * dice el prompt en los dos idiomas—, `RecruiterFix` lo transportaba y el
 * `push()` del informe lo TIRABA. Cuatro campos pedidos, uno mostrado.
 *
 * Este test EJECUTA el informe. La versión que leyera el fuente buscando
 * `fixHint` habría dado verde con la tarjeta igual de muda.
 */
const emptyWriting = (): WritingChecks => ({
  clicheBullets: [], weakVerbBullets: [], duplicateBullets: [], dateInconsistency: null,
  bulletBalance: [], mergeCandidates: [], chronology: null, futureDates: [], yearsClaim: null,
  nearDuplicates: [], bulletRanking: [], incompleteEducation: [], orphanFragments: [],
  metrics: { level: "ok", findings: [] } as unknown as WritingChecks["metrics"],
  degreeInSkills: [], hasLink: true,
})

const input = (over: Partial<BuildReportInput> = {}): BuildReportInput => ({
  score: 87,
  categories: [],
  writing: emptyWriting(),
  content: { totalBullets: 0, quantifiedBullets: 0, quantificationPct: 0, weakOpenerBullets: 0, metriclessBullets: [] } as unknown as ATSContentQuality,
  missingKeywords: [], listedOnlyKeywords: [], matchedKeywords: [],
  missingSoftSkills: [], matchedSoftSkills: [], unmetRequirements: [],
  templateSafety: "safe",
  recruiterFixes: [],
  ...over,
})

const RECRUITER = {
  issue: "«Priorizó la prospección activa y el seguimiento del proceso comercial.»",
  severity: "high",
  fix: "Escribila en primera persona y decí a cuántos clientes alcanzó.",
  action: { kind: "rewrite_bullet" as const, targetId: "job-1", index: 2 },
}

const recruiterChecks = (fixes: BuildReportInput["recruiterFixes"]) =>
  allChecks(buildAtsReport(input({ recruiterFixes: fixes }))).filter((c) => c.id.startsWith("tips.recruiter."))

describe("el hallazgo del reclutador llega con su cambio", () => {
  it("el cambio que devolvió el modelo llega a la tarjeta", () => {
    const [check] = recruiterChecks([RECRUITER])
    expect(check).toBeDefined()
    expect(check.fixHint).toBe(RECRUITER.fix)
  })

  /**
   * Y no se cuela en el hueco equivocado: la tarjeta rotula `detailKey` como
   * «Por qué importa», y el cambio a hacer no es la razón. Etiquetarlo mal para
   * ahorrarse un campo es la clase de detalle que vuelve el panel confuso.
   */
  it("y no se disfraza del «por qué importa»", () => {
    const [check] = recruiterChecks([RECRUITER])
    expect(check.detailKey).toBeUndefined()
  })

  /**
   * UN BOTÓN SIN NADA QUE DECIR ES EL DEFECTO ORIGINAL. Si el modelo no mandó el
   * cambio, el campo queda vacío en vez de traer una cadena en blanco que la
   * tarjeta pintaría como una caja vacía con título.
   */
  it("sin cambio del modelo, el campo no existe", () => {
    const [check] = recruiterChecks([{ ...RECRUITER, fix: "   " }])
    expect(check.fixHint).toBeUndefined()
  })

  it("y tampoco cuando el modelo no mandó el campo", () => {
    const [check] = recruiterChecks([{ issue: RECRUITER.issue, action: RECRUITER.action }])
    expect(check.fixHint).toBeUndefined()
  })
})
