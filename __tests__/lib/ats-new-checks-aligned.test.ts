import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { buildPanelReport } from "@/lib/ats/panel-report"
import { buildAtsReport, type BuildReportInput } from "@/lib/ats/build-report"
import { allChecks, openChecks, solvableChecks, criticalChecks, applyAllPlan, tailorWorkload } from "@/lib/ats/report"
import { analyzeWriting } from "@/lib/ats/writing-checks"

/**
 * TODO CHEQUEO NUEVO SE ALINEA CON EL ATS, O NO ENTRA.
 *
 * ── LA PREGUNTA DEL CEO (2026-08-22) ───────────────────────────────────────
 *
 *   «¿Todo esto está alineado con el ATS?»
 *
 * Es LA pregunta, y agregar tres chequeos sin contestarla habría repetido el
 * defecto de fondo de la semana: una pieza que corre por su cuenta. Medido al
 * hacerla, dos cosas estaban mal:
 *
 *  1. La línea «Fue desarrollada la capa de red…» recibía DOS tarjetas —fusión y
 *     voz pasiva—: dos consejos distintos sobre el mismo renglón, y quien los lee
 *     no sabe a cuál le hizo caso.
 *  2. (Fuera de este archivo, en el panel) el ejecutor recibía esa línea
 *     etiquetada «no dice ningún tamaño del trabajo»: `reasonOf` no conocía el
 *     chequeo nuevo y caía al motivo por defecto. Le pedíamos una cifra a una
 *     línea cuyo defecto era que borraba al autor.
 *
 * Este archivo fija las dos mitades de la alineación: una viñeta un lugar, y un
 * informativo no se cuenta como trabajo en ningún lado.
 */


describe("las tres familias que yo controlo ceden la línea ya reclamada", () => {
  /**
   * ── POR QUÉ ESTE TEST AFIRMA MENOS QUE SU PRIMERA VERSIÓN ────────────────
   *
   * La primera versión afirmaba un invariante GLOBAL: «ninguna línea del informe
   * recibe dos tarjetas». Pasaba, y era una bomba: pasaba porque el CV de prueba
   * no provocaba las combinaciones que sí existen. Buscándolas a propósito
   * aparecieron en dos minutos —«fusionala con la 2» junto a «cortala», y «está
   * duplicada» junto a «cortala»— sobre comportamiento ANTERIOR a estos
   * chequeos. Un guard así rompe el build señalando a quien no tuvo la culpa.
   *
   * El CEO lo vio antes que yo: «este candado nos traerá problemas».
   *
   * Se afirma lo que es cierto POR CONSTRUCCIÓN: corte, dilución y voz pasiva
   * filtran contra los hallazgos ya emitidos, así que no pueden pisar una línea
   * reclamada. Si alguien saca ese filtro, esto falla. Lo que hagan entre sí los
   * emisores anteriores no lo garantiza este archivo y no se finge que sí.
   */
  const FAMILIAS_QUE_CEDEN = ["tips.cut.", "tips.dilutes.", "tips.passive."]

  const solapes = (cv: Record<string, unknown>) => {
    const r = buildPanelReport({
      result: { score: 60, extractedKeywords: { jobTitle: "iOS Developer", hardSkills: ["Swift", "SwiftUI"], softSkills: [], mustHaves: [] } } as never,
      writing: analyzeWriting(cv, []),
      sectionData: cv,
      jobDescription: "iOS Developer con Swift y SwiftUI",
    })
    const porLinea = new Map<string, string[]>()
    for (const c of allChecks(r)) {
      const a = c.action
      if (a?.kind !== "rewrite_bullet" || !a.targetId || typeof a.index !== "number") continue
      const k = `${a.targetId}.${a.index}`
      porLinea.set(k, [...(porLinea.get(k) ?? []), c.id])
    }
    // Sólo cuenta como falla si UNA DE LAS TRES se sumó a una línea que ya tenía tarjeta.
    return [...porLinea]
      .filter(([, ids]) => ids.length > 1 && ids.some((id) => FAMILIAS_QUE_CEDEN.some((f) => id.startsWith(f))))
      .map(([linea, ids]) => `${linea}: ${ids.join(" + ")}`)
  }

  const rol = (id: string, bullets: string[], extra: Record<string, unknown> = {}) => ({
    id, jobTitle: "iOS Developer", currentlyWorking: true, description: bullets.join("\n"), ...extra,
  })

  it("puesto recargado con duplicados y pasivas", () => {
    expect(solapes({ workExperience: [rol("j1", [
      "• Responsable de la coordinación del equipo de desarrollo móvil",
      "• Responsable de la coordinacion del equipo de desarrollo movil",
      "• Se implementó el pipeline de integración continua del equipo",
      "• Fue desarrollada la capa de red con Swift y modelos de dominio",
      "• Trabajé en la app", "• Participé en la definición", "• Ayudé con la doc",
      "• Realicé pruebas", "• Colaboré con producto", "• Asistí a reuniones", "• Apoyé al equipo",
    ])] })).toEqual([])
  })

  it("puesto viejo, donde la banda de viñetas es más estrecha", () => {
    expect(solapes({ workExperience: [rol("j2", [
      "• Se coordinó el equipo de soporte en las entregas mensuales del producto",
      "• Se coordino el equipo de soporte en las entregas mensuales del producto",
      "• Gestioné tareas", "• Apoyé al equipo", "• Realicé pruebas",
    ], { currentlyWorking: false, endDate: "06/2014" })] })).toEqual([])
  })

  it("fragmento partido al importar conviviendo con una pasiva", () => {
    expect(solapes({ workExperience: [rol("j3", [
      "• Fue desarrollada la capa de red con Swift networking y modelos de dominio",
      "y manejo de errores para el flujo de pagos",
      "• Trabajé en la app", "• Participé en reuniones", "• Ayudé con la doc",
      "• Realicé pruebas", "• Colaboré con producto",
    ])] })).toEqual([])
  })

  it("dos puestos, uno recargado y otro no", () => {
    expect(solapes({ workExperience: [
      rol("j4", ["• Se migraron los datos locales a Core Data sin pérdida", "• Trabajé en la app"]),
      rol("j5", Array.from({ length: 9 }, (_, i) => `• Tarea ${i} realizada por el equipo`)),
    ] })).toEqual([])
  })
})

const base = {
  score: 90, categories: [], missingKeywords: [], listedOnlyKeywords: [], matchedKeywords: [],
  missingSoftSkills: [], matchedSoftSkills: [], unmetRequirements: [], templateSafety: "safe",
  recruiterFixes: [],
  writing: {
    clicheBullets: [], weakVerbBullets: [], duplicateBullets: [], dateInconsistency: null,
    bulletBalance: [], mergeCandidates: [], chronology: null, futureDates: [], yearsClaim: null,
    nearDuplicates: [], bulletRanking: [], incompleteEducation: [], orphanFragments: [],
    metrics: { level: "ok", findings: [] }, degreeInSkills: [], hasLink: true,
  },
  personalData: { hasPhoto: true, sensitive: ["birth_date", "id_number"] },
} as unknown as BuildReportInput

describe("los informativos no se cuentan como trabajo", () => {
  const r = buildAtsReport(base)
  const info = allChecks(r).filter((c) => c.informational)

  it("se emiten", () => { expect(info.length).toBe(3) })
  it("no entran en pendientes", () => { expect(openChecks(r).filter((c) => c.informational)).toEqual([]) })
  it("no entran en lo resoluble", () => { expect(solvableChecks(r).filter((c) => c.informational)).toEqual([]) })
  it("no son críticos", () => { expect(criticalChecks(r).filter((c) => c.informational)).toEqual([]) })
  it("no entran en aplicar todo", () => {
    expect(applyAllPlan(r, new Set(), new Set()).checkIds.filter((id) => id.startsWith("tips.photo") || id.startsWith("tips.personal_data"))).toEqual([])
  })
  it("no llegan al ejecutor", () => { expect(tailorWorkload(r).filter((c) => c.informational)).toEqual([]) })
})

/**
 * Y LA MITAD QUE VIVE EN EL PANEL: el ejecutor tiene que RECIBIR el motivo.
 *
 * Un chequeo nuevo que el traductor de motivos no conoce cae al motivo por
 * defecto, y el modelo trabaja sobre un diagnóstico equivocado. No hay
 * comportamiento que observar —la reescritura sale, sólo que arreglando otra
 * cosa—, así que se lee el código: el mapeo tiene que nombrar cada familia que
 * emite trabajo para tailor.
 */
describe("cada familia que le da trabajo al ejecutor tiene su motivo", () => {
  const src = readFileSync("components/editor/ATSScorePanel.tsx", "utf8")
  const mapeo = src.slice(src.indexOf("function reasonOf"), src.indexOf("export default function ATSScorePanel"))

  for (const familia of ["tips.near_dup", "tips.dilutes", "tips.merge", "format.orphan", "tips.recruiter", "tips.passive"]) {
    it(`${familia} tiene motivo propio`, () => {
      expect(mapeo, `${familia} cae al motivo por defecto`).toContain(familia)
    })
  }
})
