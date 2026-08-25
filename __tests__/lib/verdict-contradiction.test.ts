import { describe, it, expect } from "vitest"
import { verdictContradictions } from "@/lib/ats/verdict-contradiction"
import { buildAtsReport, type BuildReportInput } from "@/lib/ats/build-report"
import type { ReportTerm } from "@/lib/ats/report"

/**
 * EL ÚLTIMO CANAL QUE LLEGABA DEL MODELO SIN CONTRASTARSE.
 *
 * El veredicto es prosa libre. Puede negar un hecho que la tabla de al lado
 * cuenta como cierto, y entonces el panel se contradice a la vista: el usuario
 * que lee las dos cosas concluye que el panel se equivoca en todo, incluso en lo
 * que tiene bien.
 *
 * EL RIESGO DE ESTE FILTRO ES EL OPUESTO, y por eso la mitad de estos tests
 * vigilan que NO dispare: si se pasa de largo, calla justo la lectura que el
 * usuario pagó. Dispara sólo ante una contradicción demostrable.
 */
const term = (t: string, cv: number): ReportTerm =>
  ({ term: t, section: "hard", jd: 2, cv, listOnly: false })

const CV_DICE = [term("Salesforce", 3), term("Excel", 1)]

describe("dispara ante la contradicción demostrable", () => {
  it("«no menciona X» con X contado en el CV", () => {
    expect(verdictContradictions("El CV no menciona Salesforce en ninguna parte.", CV_DICE)).toEqual(["Salesforce"])
  })

  it("«falta X»", () => {
    expect(verdictContradictions("Falta Salesforce para esta vacante.", CV_DICE)).toEqual(["Salesforce"])
  })

  it("inglés: «does not mention X»", () => {
    expect(verdictContradictions("The resume does not mention Salesforce at all.", CV_DICE)).toEqual(["Salesforce"])
  })

  it("inglés: «is missing X»", () => {
    expect(verdictContradictions("Salesforce experience is missing Salesforce entirely.", CV_DICE)).toEqual(["Salesforce"])
  })

  /** Sin acentos, con otra capitalización: el mismo hecho. */
  it("no se le escapa por un acento", () => {
    const terms = [term("Negociación", 2)]
    expect(verdictContradictions("No menciona negociacion en las viñetas.", terms)).toEqual(["Negociación"])
  })
})

describe("NO dispara, que es donde se juega el valor", () => {
  /** Negar algo que de verdad falta es correcto, y es el caso más común. */
  it("cuando el término efectivamente no está en el CV", () => {
    expect(verdictContradictions("No menciona Salesforce.", [term("Salesforce", 0)])).toEqual([])
  })

  /** Un juicio no es un hecho contrastable. No nos toca opinar. */
  it("ante una opinión sobre el estilo", () => {
    expect(verdictContradictions("El CV se lee genérico y no destaca para esta vacante.", CV_DICE)).toEqual([])
  })

  it("ante una recomendación", () => {
    expect(verdictContradictions("Convendría reforzar los logros con cifras concretas.", CV_DICE)).toEqual([])
  })

  /**
   * LA VENTANA CORTA IMPORTA. «No menciona X, aunque sí Y» no puede leerse como
   * que niega Y — si lo hiciera, el filtro se comería veredictos correctos que
   * justamente están reconociendo lo que el candidato sí tiene.
   */
  it("cuando la negación es de otro término y el nuestro va después", () => {
    const terms = [term("Salesforce", 0), term("Excel", 4)]
    const v = "No menciona Salesforce, pero el manejo de datos está bien cubierto y Excel aparece varias veces con contexto útil."
    expect(verdictContradictions(v, terms)).toEqual([])
  })

  /** Sin veredicto no hay nada que juzgar. */
  it("con el veredicto vacío", () => {
    expect(verdictContradictions("", CV_DICE)).toEqual([])
  })

  /** Términos muy cortos aparecen dentro de otras palabras. */
  it("no juzga términos de menos de tres letras", () => {
    expect(verdictContradictions("No menciona la gestión de datos.", [term("IA", 1)])).toEqual([])
  })
})

describe("el informe deja fuera el veredicto que se contradice", () => {
  const input = (verdict: string, matched: string[]): BuildReportInput => ({
    score: 72, categories: [],
    writing: {
      clicheBullets: [], weakVerbBullets: [], duplicateBullets: [], dateInconsistency: null,
      bulletBalance: [], mergeCandidates: [], chronology: null, futureDates: [], yearsClaim: null,
      nearDuplicates: [], bulletRanking: [], incompleteEducation: [], orphanFragments: [],
      metrics: { level: "ok", findings: [] }, degreeInSkills: [], hasLink: true,
    } as never,
    missingKeywords: [], listedOnlyKeywords: [], matchedKeywords: matched,
    missingSoftSkills: [], matchedSoftSkills: [], unmetRequirements: [],
    templateSafety: "safe", recruiterFixes: [], verdict,
    jobDescription: "Buscamos Salesforce.",
  })

  it("el que niega un término que el CV dice no llega al panel", () => {
    const r = buildAtsReport(input("Tu CV no menciona Salesforce.", ["Salesforce"]))
    expect(r.terms.find((t) => t.term === "Salesforce")?.cv).toBeGreaterThan(0)
    expect(r.verdict).toBeUndefined()
  })

  it("y el que no se contradice llega entero", () => {
    const v = "Pasarías el filtro para esta vacante; el mayor riesgo es que las viñetas no muestran resultados."
    expect(buildAtsReport(input(v, ["Salesforce"])).verdict).toBe(v)
  })
})
