import { describe, it, expect, vi, beforeEach } from "vitest"

// Dar acceso a mano existía sólo como UPDATE por SSH: sin confirmación, sin motivo y sin
// registro. Estas pruebas fijan las dos reglas que hacen que no sea peligroso.

vi.mock("@/lib/auth", () => ({ auth: vi.fn(), purgeUserCache: vi.fn() }))
vi.mock("@/lib/csrf", () => ({ checkOrigin: vi.fn(() => true) }))
vi.mock("@/lib/db", () => ({
  db: { user: { findUnique: vi.fn(), update: vi.fn() }, auditLog: { create: vi.fn().mockResolvedValue({}) } },
}))
vi.mock("@/lib/logger", () => ({ createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) }))

import { POST } from "@/app/api/admin/users/grant-access/route"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const req = (body: unknown) =>
  new Request("https://app.test/api/admin/users/grant-access", { method: "POST", body: JSON.stringify(body) })
const ok = { userId: "u1", plan: "PRO", days: 30, reason: "compensación por caída del 12/08" }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "SUPER_ADMIN" } } as never)
  vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", deletedAt: null, isManaged: false, subscriptionEndsAt: null, plan: "UNSUBSCRIBED" } as never)
  vi.mocked(db.user.update).mockResolvedValue({} as never)
})

describe("admin · conceder acceso", () => {
  it("escribe el plan y una ventana de acceso", async () => {
    const res = await POST(req(ok))
    expect(res.status).toBe(200)
    const data = vi.mocked(db.user.update).mock.calls[0][0].data as Record<string, unknown>
    expect(data.plan).toBe("PRO")
    expect(data.subscriptionEndsAt).toBeInstanceOf(Date)
    // NONE y no ACTIVE: no hay suscripción detrás, y decir lo contrario le ofrecería al
    // usuario un portal de facturación que no existe.
    expect(data.subscriptionStatus).toBe("NONE")
  })

  it("NUNCA acorta un acceso que ya vence más tarde", async () => {
    const lejos = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", deletedAt: null, isManaged: false, subscriptionEndsAt: lejos, plan: "PRO" } as never)

    await POST(req({ ...ok, days: 1 }))

    const data = vi.mocked(db.user.update).mock.calls[0][0].data as { subscriptionEndsAt: Date }
    expect(data.subscriptionEndsAt.getTime()).toBe(lejos.getTime())
  })

  it("no toca a un usuario gestionado — su plan lo decide su administrador", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", deletedAt: null, isManaged: true, subscriptionEndsAt: null, plan: "LIMITED" } as never)
    const res = await POST(req(ok))
    expect(res.status).toBe(400)
    expect(vi.mocked(db.user.update)).not.toHaveBeenCalled()
  })

  it("exige motivo — un acceso regalado sin explicación es indefendible después", async () => {
    const res = await POST(req({ ...ok, reason: "" }))
    expect(res.status).toBe(422)
    expect(vi.mocked(db.user.update)).not.toHaveBeenCalled()
  })

  it("queda auditado con quién, qué y por qué", async () => {
    await POST(req(ok))
    const call = vi.mocked(db.auditLog.create).mock.calls[0][0] as { data: { metadata: Record<string, unknown> } }
    expect(call.data.metadata.source).toBe("admin_grant_access")
    expect(call.data.metadata.byAdmin).toBe("admin-1")
    expect(call.data.metadata.reason).toContain("compensación")
    expect(call.data.metadata.previousPlan).toBe("UNSUBSCRIBED")
  })

  it("solo SUPER_ADMIN", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u9", role: "USER" } } as never)
    expect((await POST(req(ok))).status).toBe(403)
  })

  it("usuario borrado → 404", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.com", deletedAt: new Date(), isManaged: false, subscriptionEndsAt: null, plan: "PRO" } as never)
    expect((await POST(req(ok))).status).toBe(404)
  })
})
