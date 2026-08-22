import { describe, it, expect } from "vitest"
import { vi } from "vitest"
vi.mock("@/lib/db", () => ({ db: {} }))
import { buildAtsHaystack } from "@/lib/services/ai/modules/AIReviewModule"
import { buildResumeContext } from "@/lib/ai-client"
import { ResumeSectionsSchema } from "@/types/resume"

/**
 * SI ESTÁ EN EL CV, EL MATCHER LO VE.
 *
 * ── EL DEFECTO (reportado con captura, 2026-08-22) ─────────────────────────
 *
 *   «Esta parte de skills y áreas de expertise... ¿por qué sólo agarra unos
 *    cuantos?»
 *
 * Su CV tiene una sección propia titulada «AREAS OF EXPERTISE» con TypeScript,
 * Dart, XCTest, Cocoa Touch, VIPER y cinco más — impresa en el PDF, visible para
 * cualquiera que lo abra. `buildAtsHaystack` es lo ÚNICO que contesta «¿el
 * candidato tiene esta habilidad?», y no miraba `customSections`. Tampoco
 * `volunteer`, `references` ni `hobbies`.
 *
 * Consecuencia exacta: el panel le pedía agregar keywords que su CV ya muestra,
 * y el puntaje se las cobraba como ausentes.
 *
 * ── POR QUÉ ESTE TEST Y NO OTRO ────────────────────────────────────────────
 *
 * Es una OMISIÓN, así que un test que lea el código sólo puede buscar la palabra
 * «customSections» y aprobar aunque el dato no salga. Éste EJECUTA la función con
 * un marcador único por sección y exige verlo en la salida.
 *
 * Y la lista de secciones NO se escribe a mano: sale de `ResumeSectionsSchema`.
 * Agregar una sección nueva al CV rompe este test hasta que alguien decida —a
 * conciencia— si entra al haystack o no. Que es exactamente lo que no pasó con
 * `customSections`.
 */

/** Un marcador imposible de encontrar por casualidad, por sección. */
const M = (k: string) => `zzmarker${k}zz`

/**
 * Qué se rellena en cada sección para que su marcador viaje. Cuando alguien
 * agrega una sección al schema, el primer test de abajo falla acá.
 */
const FIXTURE: Record<string, unknown> = {
  personalDetails: { firstName: M("personalDetails"), jobTitle: "iOS Developer" },
  summary: M("summary"),
  workExperience: [{ id: "j1", jobTitle: M("workExperience"), employer: "Acme", description: "• algo" }],
  education: [{ id: "e1", degree: M("education"), school: "Uni" }],
  skills: [{ id: "s1", name: M("skills") }],
  languages: [{ id: "l1", name: M("languages"), level: "B2" }],
  certifications: [{ id: "c1", name: M("certifications"), issuer: "Apple" }],
  projects: [{ id: "p1", name: M("projects"), description: "algo" }],
  volunteer: [{ id: "v1", organization: M("volunteer"), role: "Mentor", description: "algo" }],
  references: [{ id: "r1", name: "Alguien", company: M("references") }],
  hobbies: M("hobbies"),
  customSections: [{
    id: "cs1",
    title: "AREAS OF EXPERTISE",
    items: [{ id: "i1", title: "MOBILE", subtitle: "", date: "", description: M("customSections") }],
  }],
}

/**
 * Las que a propósito NO entran, con su razón. Vacía hoy: todo lo que el
 * candidato escribe en su CV es evidencia de lo que sabe. Existe para que una
 * exclusión futura tenga que escribirse y justificarse, no simplemente ocurrir.
 */
const EXCLUIDAS: Record<string, string> = {}

describe("el haystack del matcher cubre TODO el CV", () => {
  const claves = Object.keys(ResumeSectionsSchema.shape)

  it("el fixture cubre todas las secciones del schema", () => {
    const sinCubrir = claves.filter((k) => !(k in FIXTURE) && !(k in EXCLUIDAS))
    expect(sinCubrir, "sección nueva en el CV: decidí si entra al haystack").toEqual([])
  })

  /**
   * Los DOS pedazos, como en producción. `resumeText` es el primer elemento del
   * haystack y es lo que trae el resumen y el titular; el resto lo agrega el
   * propio haystack. Probar sólo la mitad daría verde con la otra rota.
   */
  const haystack = buildAtsHaystack(FIXTURE, buildResumeContext(FIXTURE, "es"))

  for (const k of Object.keys(FIXTURE)) {
    if (k in EXCLUIDAS) continue
    it(`${k} llega al matcher`, () => {
      expect(haystack).toContain(M(k))
    })
  }

  /** El caso reportado, con sus palabras. */
  it("una sección propia con tecnologías cuenta como habilidades del candidato", () => {
    const cv = {
      skills: [{ id: "s1", name: "Swift" }],
      customSections: [{
        id: "cs1",
        title: "AREAS OF EXPERTISE",
        items: [
          { id: "i1", title: "LANGUAGES", subtitle: "", date: "", description: "Swift · TypeScript · Dart" },
          { id: "i2", title: "MOBILE", subtitle: "", date: "", description: "Cocoa Touch · VIPER · XCTest" },
        ],
      }],
    }
    const out = buildAtsHaystack(cv, buildResumeContext(cv, "es"))
    for (const t of ["TypeScript", "Dart", "Cocoa Touch", "VIPER", "XCTest"]) {
      expect(out, `${t} no llegó al matcher`).toContain(t)
    }
  })
})
