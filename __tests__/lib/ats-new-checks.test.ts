import { describe, it, expect } from "vitest"
import { findPersonalData } from "@/lib/ats/personal-data"
import { findStuffedTerms, STUFFING_REPEATS } from "@/lib/ats/keyword-density"
import { isPassiveVoice, findPassiveBullets } from "@/lib/ats/passive-voice"

/**
 * TRES CHEQUEOS NUEVOS, Y EL MÁS IMPORTANTE ES EL QUE NO HACE NADA.
 *
 * ── LO QUE PIDIÓ EL CEO (2026-08-22) ───────────────────────────────────────
 *
 *   Foto y datos personales: «agregá esta parte pero SÓLO como información, sin
 *   que se pueda ejecutar algún cambio». Densidad de keywords y voz pasiva:
 *   «estos 2 más aplicalo».
 *
 * La distinción es de producto, no de implementación: la misma foto es un
 * acierto en México y un descarte en EE.UU., así que no existe un botón honesto.
 */

describe("foto y datos personales — informan, no arreglan", () => {
  it("detecta la foto desde la config, no desde los datos", () => {
    expect(findPersonalData({}, true).hasPhoto).toBe(true)
    expect(findPersonalData({}, false).hasPhoto).toBe(false)
  })

  it("encuentra los datos sensibles donde de verdad llegan: una sección importada", () => {
    const cv = {
      customSections: [{
        id: "cs1", title: "DATOS PERSONALES",
        items: [{ id: "i1", title: "", subtitle: "", date: "", description: "Fecha de nacimiento: 12/03/1990 · Estado civil: casado · DNI 30.123.456" }],
      }],
    }
    const f = findPersonalData(cv, false)
    expect(f.sensitive).toContain("birth_date")
    expect(f.sensitive).toContain("marital_status")
    expect(f.sensitive).toContain("id_number")
  })

  it("y en inglés", () => {
    const f = findPersonalData({ summary: "Date of birth: 1990. Nationality: Argentine." }, false)
    expect(f.sensitive).toContain("birth_date")
    expect(f.sensitive).toContain("nationality")
  })

  /**
   * El error caro sería el opuesto: un aviso equivocado sobre datos personales
   * asusta, y encima sobre una línea que describe su trabajo.
   */
  it("no confunde el trabajo del candidato con un dato personal", () => {
    const cv = { workExperience: [{ id: "j1", description: "• Gestioné la cédula de identidad digital del municipio para 20.000 vecinos" }] }
    const f = findPersonalData(cv, false)
    expect(f.sensitive).toEqual([])
  })
})

describe("relleno de keywords, medido", () => {
  const cv = (n: number) => `Desarrollador. ${Array.from({ length: n }, () => "Salesforce").join(" ")} ${"palabra ".repeat(120)}`

  it("no dice nada por repetir lo normal", () => {
    expect(findStuffedTerms(cv(STUFFING_REPEATS - 1), ["Salesforce"])).toEqual([])
  })

  it("avisa cuando el término ocupa demasiado del texto", () => {
    const r = findStuffedTerms(cv(12), ["Salesforce"])
    expect(r).toHaveLength(1)
    expect(r[0].count).toBe(12)
    expect(r[0].sharePct).toBeGreaterThan(2)
  })

  /** Sólo términos de la vacante: repetir cualquier palabra ya tiene dueño. */
  it("ignora una palabra que la vacante no pide", () => {
    expect(findStuffedTerms(cv(12), ["Kubernetes"])).toEqual([])
  })

  it("y no opina sobre un CV demasiado corto para medir densidad", () => {
    expect(findStuffedTerms("Salesforce Salesforce Salesforce", ["Salesforce"])).toEqual([])
  })
})

describe("voz pasiva: el trabajo sin dueño", () => {
  const PASIVAS = [
    "Se implementó el pipeline de CI para el equipo móvil",
    "El pipeline fue desarrollado junto al equipo de plataforma",
    "Los reportes eran generados cada semana",
    "The CI pipeline was built with the platform team",
    "Reports were generated weekly for the leadership team",
  ]
  const ACTIVAS = [
    "Implementé el pipeline de CI para el equipo móvil",
    "Built the CI pipeline with the platform team",
    "Se especializó en pagos" /* pronominal, no pasiva */,
    "Coordiné con backend y QA para desbloquear el release",
    "Was responsible for the payments module" /* eso ya lo caza WEAK_OPENERS */,
  ]

  for (const t of PASIVAS) it(`pasiva: ${t.slice(0, 38)}…`, () => expect(isPassiveVoice(t)).toBe(true))
  for (const t of ACTIVAS) it(`activa: ${t.slice(0, 38)}…`, () => expect(isPassiveVoice(t)).toBe(false))

  it("nombra el puesto y la posición de cada línea", () => {
    const out = findPassiveBullets([
      { id: "j1", jobTitle: "iOS Developer", bullets: ["Implementé la app", "Se migró la base de datos"] },
    ])
    expect(out).toEqual([{ targetId: "j1", jobTitle: "iOS Developer", index: 1, text: "Se migró la base de datos" }])
  })

  it("tiene tope: no inunda el panel", () => {
    const bullets = Array.from({ length: 20 }, () => "Se migró la base de datos")
    expect(findPassiveBullets([{ id: "j1", jobTitle: "X", bullets }]).length).toBe(6)
  })
})
