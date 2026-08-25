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
   * LOS REQUISITOS NO SE PROMETEN, NI UNA VEZ.
   *
   * ── QUÉ VIGILABA ESTE TEST, Y QUÉ VIGILA AHORA ───────────────────────────
   *
   * Nacido contra el DOBLE conteo: `hard.requirements` toma su peso del mismo
   * desglose, así que sumar las dos cosas daba 40 donde había 20. Eso sigue
   * valiendo y sigue comprobado abajo.
   *
   * Pero 20 tampoco era correcto, y lo destapó la pregunta del CEO de si el
   * puntaje puede llegar a 100. La tarjeta de requisitos declara, con estas
   * palabras, «ninguna reescritura lo cambia: es un requisito que cumplís o no»,
   * y publica el TECHO que impone. Contar esos puntos como recuperables ponía al
   * dial a prometer justo lo que la tarjeta de al lado declaraba imposible.
   *
   * Medido sobre un CV con un requisito sin cumplir: el dial decía «+25», de los
   * cuales 19 eran del requisito. Seis eran reales.
   *
   * Así que ahora la categoría queda FUERA del total: el chequeo conserva su
   * peso —es cuánto vale esa tarjeta— y el dial promete sólo lo alcanzable.
   */
  it("no promete los puntos de un requisito sin salida", () => {
    const r = buildAtsReport(input({
      categories: [
        { category: "mustHaves", coveragePct: 0, weight: 0.20, share: 20, points: 0, recoverable: 20, basis: "chosen" },
      ] as never,
      unmetRequirements: ["Título en Ingeniería Comercial"],
    }))
    const checkWeight = openChecks(r).find((c) => c.id === "hard.requirements")?.weight ?? 0
    expect(checkWeight).toBe(20)             // la tarjeta sigue valiendo 20…
    expect(recoverablePoints(r)).toBe(0)     // …y el dial no promete ninguno
    expect(recoverablePoints(r)).not.toBe(40) // el doble conteo original
  })
})
