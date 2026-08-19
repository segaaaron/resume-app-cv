import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { parseManagedListPage } from "@/lib/admin/managed-list"

/**
 * El panel de usuarios managed decía "Aún no hay usuarios managed" con clientes
 * LIMITED vivos dentro.
 *
 * La ruta devolvía un array y el panel lo leía como array. El 2026-08-01 la ruta
 * se paginó a `{ items, nextCursor }` y el panel no se tocó: su
 * `Array.isArray(d) ? d : []` pasó a dar SIEMPRE la rama vacía. Nada falló —
 * 200, JSON válido, estado vacío dibujado con normalidad— y por eso duró tres
 * semanas, hasta que el CEO creó un usuario, lo vio en su ficha con plan LIMITED
 * y sin expirar, y el panel siguió diciendo cero.
 *
 * De ahí las dos cosas que este test protege: que se lea la forma que la ruta
 * realmente emite, y que "no entendí" no sea lo mismo que "no hay nadie".
 */
describe("leer la página de usuarios managed", () => {
  it("lee la forma paginada que la ruta emite hoy", () => {
    const got = parseManagedListPage<{ id: string }>({ items: [{ id: "u1" }, { id: "u2" }], nextCursor: null })
    expect(got?.items.map((u) => u.id)).toEqual(["u1", "u2"])
    expect(got?.nextCursor).toBeNull()
  })

  it("devuelve el cursor cuando hay más páginas", () => {
    expect(parseManagedListPage({ items: [], nextCursor: "u99" })?.nextCursor).toBe("u99")
  })

  /** Un despliegue a medias puede tener el panel nuevo contra la ruta anterior. */
  it("sigue aceptando el array suelto de antes de la paginación", () => {
    const got = parseManagedListPage<{ id: string }>([{ id: "u1" }])
    expect(got?.items).toHaveLength(1)
    expect(got?.nextCursor).toBeNull()
  })

  it("distingue una página vacía de verdad", () => {
    expect(parseManagedListPage({ items: [], nextCursor: null })).toEqual({ items: [], nextCursor: null })
  })

  /**
   * LO QUE IMPORTA. Cualquier forma que no reconozcamos tiene que ser `null`
   * —"no entendí"— y nunca una lista vacía, que el panel dibujaría como "no hay
   * nadie": la conclusión opuesta a la verdad, que es justo el bug original.
   */
  it.each([
    ["un objeto sin items", { nextCursor: null }],
    ["items que no es lista", { items: { u1: true } }],
    ["un error de la API", { error: "Forbidden" }],
    ["null", null],
    ["texto", "no soy json"],
    ["un número", 0],
  ])("no confunde %s con una lista vacía", (_n, payload) => {
    expect(parseManagedListPage(payload)).toBeNull()
  })

  it("ignora un cursor que no es un id utilizable", () => {
    expect(parseManagedListPage({ items: [], nextCursor: "" })?.nextCursor).toBeNull()
    expect(parseManagedListPage({ items: [], nextCursor: 7 })?.nextCursor).toBeNull()
  })
})

/**
 * El desajuste era entre DOS archivos, así que el test tiene que mirar los dos.
 * Un test que sólo ejercita el lector habría dado verde el 2026-08-01 con el
 * panel roto.
 */
describe("la ruta y el panel hablan de lo mismo", () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8")

  it("la ruta sigue emitiendo items + nextCursor", () => {
    const route = read("app/api/admin/users/managed/list/route.ts")
    expect(route).toMatch(/NextResponse\.json\(\{\s*items,\s*nextCursor\s*\}\)/)
  })

  it("el panel no vuelve a leer la respuesta a mano", () => {
    const panel = read("components/admin/ManagedUsersPanel.tsx")
    expect(panel).toContain("parseManagedListPage")
    // El `Array.isArray(d) ? d : []` original es exactamente lo que falló.
    expect(panel).not.toMatch(/setUsers\(\s*Array\.isArray/)
  })

  it("el panel tiene texto para decir que no pudo cargar, en los dos idiomas", () => {
    expect(read("components/admin/ManagedUsersPanel.tsx")).toContain('t("list_error")')
    for (const loc of ["es", "en"]) {
      const m = JSON.parse(read(`messages/${loc}.json`)).dashboard_admin.managed
      expect(m.list_error, loc).toBeTruthy()
      expect(m.list_error, loc).not.toBe(m.list_empty)
    }
  })
})
