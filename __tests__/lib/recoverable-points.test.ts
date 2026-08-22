import { describe, it, expect } from "vitest"
import { buildAtsReport, type BuildReportInput } from "@/lib/ats/build-report"
import { recoverablePoints, missingTerms, openChecks } from "@/lib/ats/report"

/**
 * EL ÚNICO NÚMERO QUE EL PANEL LE PROMETE AL USUARIO.
 *
 * «+N recuperables» aparece bajo el dial, al lado del umbral. Es lo que le dice
 * al candidato cuánto puede ganar si hace el trabajo — y sumaba el peso de los
 * CHEQUEOS abiertos ignorando los TÉRMINOS.
 *
 * Medido antes del arreglo: un CV con 68 de puntaje al que le faltan cuatro
 * habilidades que la vacante pide mostraba «+0», mientras el desglose decía que
 * había 32 puntos en juego. Las duras pesan .45 — la palanca más grande del
 * informe — y quedaban fuera del número.
 *
 * Es el mismo defecto que este panel ya pagó tres veces: una función que cuenta
 * lo que ELLA sabe hacer en vez de lo que el informe reporta.
 */
const input = (o: Partial<BuildReportInput> = {}): BuildReportInput => ({
  score: 68,
  categories: [
    { category: "hardSkills", coveragePct: 40, weight: 0.45, share: 45, points: 18, recoverable: 27, basis: "chosen" },
    { category: "softSkills", coveragePct: 50, weight: 0.10, share: 10, points: 5, recoverable: 5, basis: "chosen" },
    { category: "title", coveragePct: 100, weight: 0.15, share: 15, points: 15, recoverable: 0, basis: "chosen" },
  ] as never,
  writing: {
    clicheBullets: [], weakVerbBullets: [], duplicateBullets: [], dateInconsistency: null,
    bulletBalance: [], mergeCandidates: [], chronology: null, futureDates: [], yearsClaim: null,
    nearDuplicates: [], bulletRanking: [], incompleteEducation: [], orphanFragments: [],
    metrics: { level: "ok", findings: [] }, degreeInSkills: [], hasLink: true,
  } as never,
  content: { totalBullets: 2, quantifiedBullets: 1, quantificationPct: 50, weakOpenerBullets: 0, metriclessBullets: [] } as never,
  missingKeywords: [], listedOnlyKeywords: [], matchedKeywords: [],
  missingSoftSkills: [], matchedSoftSkills: [], unmetRequirements: [],
  templateSafety: "safe", recruiterFixes: [],
  ...o,
})

describe("los puntos prometidos salen del desglose", () => {
  it("suma lo que vale cerrar cada brecha", () => {
    expect(recoverablePoints(buildAtsReport(input()))).toBe(32)
  })

  /**
   * EL CASO QUE ESTABA ROTO. Cuatro términos que la vacante pide y el CV no
   * dice, cero chequeos con peso: el número decía 0 y había 32 en juego.
   */
  it("cuenta los términos que faltan, aunque ningún chequeo tenga peso", () => {
    const r = buildAtsReport(input({
      missingKeywords: ["Salesforce", "CRM", "Power BI"],
      missingSoftSkills: ["Negociación"],
      jobDescription: "Salesforce, CRM, Power BI y negociación.",
    }))
    expect(missingTerms(r).length).toBe(4)
    expect(openChecks(r).filter((c) => c.weight > 0)).toHaveLength(0)
    expect(recoverablePoints(r)).toBe(32)
  })

  /** Con todo cubierto no promete nada: prometer de más es peor que callar. */
  it("con las brechas cerradas promete cero", () => {
    const r = buildAtsReport(input({
      categories: [
        { category: "hardSkills", coveragePct: 100, weight: 0.45, share: 45, points: 45, recoverable: 0, basis: "chosen" },
        { category: "title", coveragePct: 100, weight: 0.15, share: 15, points: 15, recoverable: 0, basis: "chosen" },
      ] as never,
      score: 100,
    }))
    expect(recoverablePoints(r)).toBe(0)
  })

  /**
   * NO SE SUMA CON LOS PESOS DE LOS CHEQUEOS. `hard.requirements` toma el suyo
   * del MISMO desglose (`recoverableOf`), así que sumar las dos cosas contaría
   * los requisitos dos veces — y el panel volvería a prometer un número que no
   * puede cumplir, que es de donde salió toda esta clase de defecto.
   */
  it("no cuenta dos veces los requisitos incumplidos", () => {
    const r = buildAtsReport(input({
      categories: [
        { category: "mustHaves", coveragePct: 0, weight: 0.20, share: 20, points: 0, recoverable: 20, basis: "chosen" },
      ] as never,
      unmetRequirements: ["Título en Ingeniería Comercial"],
    }))
    const checkWeight = openChecks(r).find((c) => c.id === "hard.requirements")?.weight ?? 0
    expect(checkWeight).toBe(20)              // el chequeo pesa lo mismo…
    expect(recoverablePoints(r)).toBe(20)     // …y el total NO es 40
  })
})
