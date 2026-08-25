import { describe, it, expect } from "vitest"
import { buildPanelReport } from "@/lib/ats/panel-report"
import { allChecks, openChecks } from "@/lib/ats/report"
import type { WritingChecks } from "@/lib/ats/writing-checks"

/**
 * CUANDO TAILOR ARREGLA ALGO, EL RESTO SE ENTERA — SIN QUE NADIE AVISE.
 *
 * «Cuando tailor soluciona algo, comunicar al resto para que no se genere
 * duplicidad, que todo quede actualizado» (CEO, 2026-08-21).
 *
 * LA SOLUCIÓN NO ES MENSAJERÍA, ES CONSTRUCCIÓN. `buildPanelReport` corre sobre
 * el `sectionData` VIVO en cada edición, y desde `recruiter-verified.ts` cada
 * hallazgo del modelo se contrasta contra ese CV antes de existir. Un hallazgo
 * que cita una línea que tailor acaba de reescribir ya no encuentra su cita en
 * el documento, y deja de emitirse. Nadie tiene que borrarlo, marcarlo como
 * aplicado, ni avisarle a otro componente.
 *
 * LO QUE ESTO REEMPLAZA: un cartel que decía «aplicaste cambios en tu CV» —el
 * informe confesando que no se había actualizado y pasándole el trabajo al
 * usuario— y que además contaba los hallazgos CRUDOS, así que podía avisar por
 * cosas que el panel ya no mostraba en ninguna parte.
 */
const role = (description: string) => ({
  workExperience: [{ id: "j1", jobTitle: "Ejecutivo de Ventas", description }],
})

const ANTES = role("• Implementar estrategias comerciales de rotación de productos.")
const DESPUES = role("• Ejecuté estrategias comerciales para la rotación de productos.")

const FINDING = {
  issue: 'La línea "Implementar estrategias comerciales de rotación" está en infinitivo y no en voz del candidato.',
  severity: "high",
  fix: "Ejecuté estrategias comerciales…",
  action: { kind: "rewrite_bullet", targetId: "j1", index: 0 },
}

const emptyWriting = (): WritingChecks => ({
  clicheBullets: [], weakVerbBullets: [], duplicateBullets: [], dateInconsistency: null,
  bulletBalance: [], mergeCandidates: [], chronology: null, futureDates: [], yearsClaim: null,
  nearDuplicates: [], bulletRanking: [], incompleteEducation: [], orphanFragments: [],
  metrics: { level: "ok", findings: [] } as unknown as WritingChecks["metrics"],
  degreeInSkills: [], hasLink: true,
})

const build = (sectionData: Record<string, unknown>) =>
  buildPanelReport({
    result: { score: 70, analysis: { criticalFixes: [FINDING] } } as never,
    writing: emptyWriting(),
    sectionData,
    jobDescription: "Ejecutivo de ventas",
  })

const recruiterChecks = (sectionData: Record<string, unknown>) =>
  allChecks(build(sectionData)).filter((c) => c.id.startsWith("tips.recruiter"))

describe("el informe sigue al CV, no a la última respuesta del modelo", () => {
  it("mientras la línea sigue como estaba, el hallazgo está", () => {
    expect(recruiterChecks(ANTES)).toHaveLength(1)
  })

  /**
   * EL TEST QUE IMPORTA. La respuesta del modelo es EXACTAMENTE la misma en los
   * dos casos —es la que llegó del servidor y ahí se queda—; lo único que cambió
   * es el CV. El hallazgo se va porque ya no se sostiene, no porque alguien lo
   * haya marcado.
   */
  it("aplicada la reescritura, el hallazgo desaparece sin que nadie lo borre", () => {
    expect(recruiterChecks(DESPUES)).toHaveLength(0)
  })

  /** Y no deja un pendiente fantasma contando en el botón. */
  it("y tampoco queda contado como trabajo abierto", () => {
    const ids = openChecks(build(DESPUES)).map((c) => c.id)
    expect(ids.filter((i) => i.startsWith("tips.recruiter"))).toEqual([])
  })
})

describe("lo que el CV sí sostiene no se cae", () => {
  /**
   * El árbitro no puede volverse una guillotina: si tirara los hallazgos buenos,
   * el usuario perdería el análisis que pagó y nadie lo notaría — el panel
   * simplemente se vería vacío.
   */
  it("un hallazgo sobre una línea que sigue ahí se mantiene tras editar OTRO puesto", () => {
    const conOtroPuesto = {
      workExperience: [
        { id: "j1", jobTitle: "Ejecutivo de Ventas", description: "• Implementar estrategias comerciales de rotación de productos." },
        { id: "j2", jobTitle: "Cajero", description: "• Arqueo de caja diario." },
      ],
    }
    expect(recruiterChecks(conOtroPuesto)).toHaveLength(1)
  })
})
