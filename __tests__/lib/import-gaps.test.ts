import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { findImportGaps } from "@/lib/resume-parser/import-gaps"

/**
 * La importación podía terminar bien y devolver un CV sin nombre.
 *
 * La ruta calculaba el nombre para una sola cosa —titular el currículum— y, si no
 * había, lo titulaba con el nombre del archivo y guardaba en silencio. Un usuario
 * subió su CV, recibió uno sin su nombre y se enteró mirando la pantalla; nosotros
 * no teníamos forma de saber que había pasado.
 *
 * El extractor no puede prometer leer cualquier documento del mundo. Lo que sí
 * puede prometer es no fingir que lo leyó.
 */
const cv = (over: Record<string, unknown> = {}) => ({
  personalDetails: { firstName: "Rosa", lastName: "Chávez", email: "rosa@example.com", phone: "+591 700" },
  workExperience: [{ id: "j1", jobTitle: "Cajera", employer: "Banco Nacional", description: "• Realicé arqueo." }],
  ...over,
})

describe("qué datos imprescindibles no entregó el documento", () => {
  it("no dice nada cuando el CV vino completo", () => {
    expect(findImportGaps(cv())).toEqual([])
  })

  it("avisa del nombre — el caso reportado", () => {
    expect(findImportGaps(cv({ personalDetails: { email: "r@example.com" } }))).toEqual(["name"])
  })

  it("se conforma con un apellido: media identidad ya es identidad", () => {
    expect(findImportGaps(cv({ personalDetails: { lastName: "Chávez", phone: "700" } }))).toEqual([])
  })

  /**
   * Uno de los dos alcanza. Mucha gente pone sólo el teléfono, o sólo el correo,
   * y exigir ambos convertiría un CV correcto en una advertencia.
   */
  it.each([
    ["sólo correo", { firstName: "Rosa", email: "r@example.com" }],
    ["sólo teléfono", { firstName: "Rosa", phone: "+591 700" }],
  ])("no avisa de contacto con %s", (_n, personalDetails) => {
    expect(findImportGaps(cv({ personalDetails }))).toEqual([])
  })

  it("avisa cuando no hay ninguna forma de responderle", () => {
    expect(findImportGaps(cv({ personalDetails: { firstName: "Rosa" } }))).toEqual(["contact"])
  })

  it("avisa cuando no se entendió un solo puesto", () => {
    expect(findImportGaps(cv({ workExperience: [] }))).toEqual(["experience"])
  })

  /**
   * Una entrada vacía es lo mismo que ninguna: el documento se leyó y no se
   * entendió, que es justo lo que hay que decir.
   */
  it("no cuenta como experiencia una fila sin nada dentro", () => {
    expect(findImportGaps(cv({ workExperience: [{ id: "j1", jobTitle: "", employer: "", description: "" }] })))
      .toEqual(["experience"])
  })

  it("cuenta una fila que sólo trae el empleador", () => {
    expect(findImportGaps(cv({ workExperience: [{ id: "j1", employer: "Banco Nacional" }] }))).toEqual([])
  })

  it("no confunde espacios con contenido", () => {
    expect(findImportGaps(cv({ personalDetails: { firstName: "   ", lastName: "\n", phone: " " } })))
      .toEqual(["name", "contact"])
  })

  it("lo dice todo cuando no llegó nada", () => {
    expect(findImportGaps(null)).toEqual(["name", "contact", "experience"])
    expect(findImportGaps({})).toEqual(["name", "contact", "experience"])
  })

  /**
   * La lista es corta a propósito. Ciudad, cargo, habilidades o formación pueden
   * faltar legítimamente en un CV real, y avisar de cada ausencia convierte el
   * aviso en ruido que la gente aprende a ignorar.
   */
  it("calla sobre lo que un CV real puede no tener", () => {
    expect(findImportGaps(cv({
      personalDetails: { firstName: "Rosa", phone: "700" },
      skills: [], education: [], certifications: [], languages: [],
    }))).toEqual([])
  })

  it("tiene texto en los dos idiomas para cada hueco que puede reportar", () => {
    const load = (loc: string) =>
      JSON.parse(readFileSync(join(process.cwd(), `messages/${loc}.json`), "utf8")).dashboard.resumes
    for (const loc of ["es", "en"]) {
      const m = load(loc)
      expect(m.import_gaps_title, loc).toBeTruthy()
      // Cada valor que la función puede devolver necesita su etiqueta, o el aviso
      // saldría con la clave cruda delante del usuario.
      for (const gap of ["name", "contact", "experience"]) {
        expect(m[`import_gaps_${gap}`], `${loc}/${gap}`).toBeTruthy()
      }
    }
  })
})
