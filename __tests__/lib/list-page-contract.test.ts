import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { parseListPage } from "@/lib/api/list-page"

/**
 * Dos pantallas quedaron vacías, en silencio, por la misma razón.
 *
 * Nuestras rutas de lista devuelven un objeto con la página y el cursor. Los
 * clientes preguntaban `Array.isArray(d)` — cierto cuando la ruta devolvía un
 * array pelado, falso para siempre desde que dejó de hacerlo:
 *
 *   - El panel de usuarios managed dijo "Aún no hay usuarios managed" durante
 *     tres semanas, con clientes LIMITED activos y pagos dentro. Y como el botón
 *     de gestión vive en la fila, sin fila no había botón.
 *   - El selector de CV de la carta estuvo vacío desde mayo: toda carta se
 *     generó sin el currículum del usuario.
 *
 * Ninguno falló. 200, JSON válido, pantalla vacía dibujada con normalidad. Por
 * eso el test mira DOS cosas: que el lector distinga "no entendí" de "vacío", y
 * que ninguna pantalla vuelva a deducir la forma por su cuenta. Un test que sólo
 * ejercitara el lector habría dado verde con las dos pantallas rotas.
 */
describe("leer una página de una lista paginada", () => {
  it.each([
    ["{ data } — CVs, cartas, postulaciones", { data: [{ id: "a" }, { id: "b" }], nextCursor: null }],
    ["{ items } — usuarios managed", { items: [{ id: "a" }, { id: "b" }], nextCursor: null }],
    ["el array suelto de antes de la paginación", [{ id: "a" }, { id: "b" }]],
  ])("lee %s", (_n, payload) => {
    expect(parseListPage<{ id: string }>(payload)?.items.map((r) => r.id)).toEqual(["a", "b"])
  })

  it("devuelve el cursor cuando hay más páginas", () => {
    expect(parseListPage({ data: [], nextCursor: "u99" })?.nextCursor).toBe("u99")
    expect(parseListPage({ items: [], nextCursor: "u99" })?.nextCursor).toBe("u99")
  })

  it("distingue una página vacía de verdad", () => {
    expect(parseListPage({ data: [], nextCursor: null })).toEqual({ items: [], nextCursor: null })
  })

  /**
   * LO QUE IMPORTA. Cualquier forma que no reconozcamos tiene que ser `null`
   * —"no entendí"— y nunca una lista vacía, que la pantalla dibujaría como "no
   * hay nada": la conclusión opuesta a la verdad, que es el bug original.
   */
  it.each([
    ["un objeto sin la lista", { nextCursor: null }],
    ["data que no es lista", { data: { u1: true } }],
    ["items que no es lista", { items: "u1" }],
    ["un error de la API", { error: "Forbidden" }],
    ["null", null],
    ["texto", "no soy json"],
    ["un número", 0],
  ])("no confunde %s con una lista vacía", (_n, payload) => {
    expect(parseListPage(payload)).toBeNull()
  })

  it("ignora un cursor que no es un id utilizable", () => {
    expect(parseListPage({ data: [], nextCursor: "" })?.nextCursor).toBeNull()
    expect(parseListPage({ data: [], nextCursor: 7 })?.nextCursor).toBeNull()
  })
})

/**
 * El desajuste era ENTRE archivos, así que el guard tiene que mirar los dos
 * lados: lo que la ruta emite y lo que la pantalla lee.
 */
describe("nadie deduce la forma por su cuenta", () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8")

  /**
   * Se escanea el CÓDIGO, no los comentarios. La primera versión de este guard
   * se mordió a sí misma: encontró `Array.isArray(data)` dentro del comentario
   * que EXPLICA el bug y falló sobre el archivo ya arreglado. El proyecto ya
   * había pagado esa lección con un test que hallaba su patrón en un ejemplo de
   * la propia doctrina.
   */
  const code = (p: string) =>
    read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")

  it("las rutas de lista siguen emitiendo su página con cursor", () => {
    expect(read("app/api/admin/users/managed/list/route.ts"))
      .toMatch(/NextResponse\.json\(\{\s*items,\s*nextCursor\s*\}\)/)
    for (const svc of [
      "lib/services/resume/ResumeService.ts",
      "lib/services/cover-letter/CoverLetterService.ts",
      "lib/services/application/ApplicationService.ts",
    ]) {
      expect(read(svc), svc).toMatch(/return \{ data: \w+, nextCursor \}/)
    }
  })

  /**
   * Las dos pantallas que se rompieron, nombradas una por una. El `Array.isArray`
   * sobre la respuesta es exactamente el patrón que falló las dos veces.
   */
  it.each([
    ["el panel de usuarios managed", "components/admin/ManagedUsersPanel.tsx"],
    ["el selector de CV de la carta", "components/cover-letter/CoverLetterEditor.tsx"],
  ])("%s usa el lector compartido", (_n, file) => {
    expect(code(file)).toContain("parseListPage")
    expect(code(file)).not.toMatch(/Array\.isArray\(\s*(d|data|json)\s*\)/)
  })

  /**
   * Un fallo tiene que poder distinguirse de "no hay nada" en cada pantalla: por
   * texto en el panel de admin, y por registro en la carta —donde no mostrar el
   * selector SÍ es correcto si el usuario no tiene ningún CV.
   */
  it("el panel de admin tiene texto para decir que no pudo cargar, en los dos idiomas", () => {
    expect(read("components/admin/ManagedUsersPanel.tsx")).toContain('t("list_error")')
    for (const loc of ["es", "en"]) {
      const m = JSON.parse(read(`messages/${loc}.json`)).dashboard_admin.managed
      expect(m.list_error, loc).toBeTruthy()
      expect(m.list_error, loc).not.toBe(m.list_empty)
    }
  })

  it("la carta registra el fallo en vez de callarlo", () => {
    expect(code("components/cover-letter/CoverLetterEditor.tsx"))
      .toContain("cover_letter_resume_list_bad_contract")
    expect(code("components/cover-letter/CoverLetterEditor.tsx")).not.toContain(".catch(() => {})")
  })
})
