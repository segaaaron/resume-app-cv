import { describe, it, expect, vi, beforeEach } from "vitest"

// La tabla del admin pasó a paginar en el servidor, así que el array completo que
// alimentaba el botón "Exportar CSV" dejó de existir. Sin este endpoint la exportación
// habría quedado devolviendo sólo la página visible: parece completa y no lo es.

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/db", () => ({ db: { user: { findMany: vi.fn() } } }))

import { GET } from "@/app/api/admin/users/export/route"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const req = () => new Request("https://app.test/api/admin/users/export")
const user = (i: number) => ({
  id: `u${i}`, name: `N${i}`, email: `u${i}@x.com`, plan: "PRO", subscriptionStatus: "ACTIVE",
  planInterval: "monthly", subscriptionEndsAt: new Date("2026-01-01"), role: "USER",
  createdAt: new Date("2025-01-01"), lastActiveAt: new Date("2026-01-01"),
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "SUPER_ADMIN" } } as never)
})

describe("admin · exportar usuarios a CSV", () => {
  it("solo SUPER_ADMIN", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u9", role: "USER" } } as never)
    expect((await GET(req())).status).toBe(403)
  })

  it("sin sesión, 401", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    expect((await GET(req())).status).toBe(401)
  })

  it("devuelve encabezado + una fila por usuario, como descarga", async () => {
    vi.mocked(db.user.findMany).mockResolvedValueOnce([user(1), user(2)] as never)
    const res = await GET(req())
    const body = await res.text()
    expect(res.headers.get("Content-Type")).toContain("text/csv")
    expect(res.headers.get("Content-Disposition")).toContain("attachment")
    expect(body.split("\n")).toHaveLength(3)
    expect(body).toContain("u1@x.com")
    expect(body).toContain("u2@x.com")
  })

  it("recorre TODOS los lotes — no se queda con los primeros 500", async () => {
    const full = Array.from({ length: 500 }, (_, i) => user(i))
    vi.mocked(db.user.findMany)
      .mockResolvedValueOnce(full as never)
      .mockResolvedValueOnce([user(999)] as never)
    const body = await (await GET(req())).text()
    expect(body).toContain("u999@x.com")
    expect(vi.mocked(db.user.findMany)).toHaveBeenCalledTimes(2)
  })

  it("escapa las comillas para que un nombre no rompa el archivo", async () => {
    vi.mocked(db.user.findMany).mockResolvedValueOnce([{ ...user(1), name: 'Ana "La Jefa"' }] as never)
    const body = await (await GET(req())).text()
    expect(body).toContain('"Ana ""La Jefa"""')
  })
})
