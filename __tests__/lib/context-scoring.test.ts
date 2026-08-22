import { describe, it, expect } from "vitest"
import { computeATSMatch } from "@/lib/services/ai/shared/ats-matcher"
import { LISTED_ONLY_CREDIT } from "@/lib/ats/scoring-config"

/**
 * DEMOSTRAR UNA HABILIDAD VALE MÁS QUE LISTARLA.
 *
 * «Toda la información que tenemos debe cuadrar con el score, y viceversa. Las
 * cosas opcionales no aportan score» (CEO, 2026-08-21).
 *
 * El panel llevaba meses señalando la diferencia entre una habilidad DEMOSTRADA
 * —dentro de una viñeta, en un puesto con fecha— y una AFIRMADA —suelta en la
 * lista—. Le daba al candidato un botón para cerrarla. Y el puntaje contaba las
 * dos igual: hacía el trabajo, el número no se movía, y concluía que el panel le
 * pedía cosas que no cuentan.
 *
 * Es lo que los motores reales llaman *context scoring*.
 */
const KW = {
  jobTitle: "Ejecutivo Comercial",
  hardSkills: ["Salesforce", "CRM"],
  softSkills: [],
  mustHaves: [],
} as never

const SECTIONS = { experience: true, education: true, skills: true, contact: true, summary: true } as never

describe("el mismo término vale distinto según dónde esté", () => {
  /** Sólo en la lista de habilidades: el filtro lo encuentra, pero es una afirmación. */
  const listado = () => computeATSMatch(
    KW,
    "Ejecutivo Comercial. Habilidades: Salesforce, CRM. Experiencia: atención a clientes en sala.",
    "Ejecutivo Comercial", SECTIONS,
    "atención a clientes en sala",           // la experiencia NO los nombra
  )

  /** Dentro de una viñeta con fecha: es una prueba. */
  const demostrado = () => computeATSMatch(
    KW,
    "Ejecutivo Comercial. Habilidades: Salesforce, CRM. Experiencia: gestioné la cartera en Salesforce y el pipeline en el CRM.",
    "Ejecutivo Comercial", SECTIONS,
    "gestioné la cartera en Salesforce y el pipeline en el CRM",
  )

  it("demostrarlo cubre el 100%", () => {
    expect(demostrado().subScores.hardSkills).toBe(100)
  })

  it("listarlo cubre sólo el crédito parcial", () => {
    expect(listado().subScores.hardSkills).toBe(Math.round(LISTED_ONLY_CREDIT.value * 100))
  })

  /** LO QUE EL PANEL PROMETE: mover la habilidad a una viñeta sube el número. */
  it("pasar de la lista a la viñeta SUBE el puntaje", () => {
    expect(demostrado().score).toBeGreaterThan(listado().score)
  })

  it("y el panel sigue sabiendo cuáles están sólo en la lista", () => {
    expect(listado().listedOnlyKeywords.sort()).toEqual(["CRM", "Salesforce"])
    expect(demostrado().listedOnlyKeywords).toEqual([])
  })
})

describe("sin experiencia con la que comparar, no se descuenta", () => {
  /**
   * FALLA ABIERTO A PROPÓSITO. Un CV sin experiencia cargada —un recién
   * graduado— no es un CV que no demuestre nada: es uno que no tenemos cómo
   * juzgar. Descontarle ahí sería castigarlo por algo que ya se refleja en las
   * otras categorías, y hundiría el puntaje de un CV que puede estar perfecto.
   *
   * La regla es que demostrar valga MÁS, no que no poder demostrar valga menos.
   */
  it("un CV sin experiencia conserva su cobertura", () => {
    const r = computeATSMatch(
      KW,
      "Ejecutivo Comercial. Habilidades: Salesforce, CRM.",
      "Ejecutivo Comercial", SECTIONS,
      "",                                     // sin evidencia
    )
    expect(r.subScores.hardSkills).toBe(100)
  })
})

describe("la cobertura no puede pasarse de 100", () => {
  /**
   * La primera versión sumaba `shown` dos veces —`demonstrated` ya arranca con
   * `[...shown]`— y la cobertura llegaba a 200%. El mismo doble conteo que este
   * panel viene cerrando en otros cuatro sitios.
   */
  it("nunca supera el 100%", () => {
    const r = computeATSMatch(
      KW,
      "Salesforce CRM Salesforce CRM Salesforce CRM",
      "Ejecutivo Comercial", SECTIONS,
      "Salesforce CRM Salesforce CRM",
    )
    expect(r.subScores.hardSkills).toBeLessThanOrEqual(100)
  })
})
