import { describe, it, expect, vi, beforeEach } from "vitest"

// Quitar el plan LIMITED sin borrar al usuario. La única alternativa que existía era
// DELETE, que borra la fila y con ella —por cascada— sus CVs y sus cartas. Cuando termina
// el acuerdo con una organización la persona no hizo nada; destruir su trabajo no es la
// consecuencia correcta, y además tira un lead que ya tiene el producto cargado.

vi.mock("@/lib/auth", () => ({ auth: vi.fn(), purgeUserCache: vi.fn() }))
vi.mock("@/lib/csrf", () => ({ checkOrigin: vi.fn(() => true) }))
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}))
vi.mock("@/lib/logger", () => ({ createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) }))
vi.mock("@/lib/services/email/ResendEmailService", () => ({ ResendEmailService: class { sendManagedWelcome = vi.fn() } }))
vi.mock("@/lib/managed-password", () => ({ generateManagedPassword: () => "pw" }))
vi.mock("@/lib/locale", () => ({ localeFromRequest: () => "es" }))

import { PATCH } from "@/app/api/admin/users/managed/[id]/route"
import { auth, purgeUserCache } from "@/lib/auth"
import { db } from "@/lib/db"

const params = { params: Promise.resolve({ id: "u1" }) }
const req = () =>
  new Request("https://app.test/api/admin/users/managed/u1", {
    method: "PATCH",
    body: JSON.stringify({ action: "unmanage" }),
  })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "SUPER_ADMIN" } } as never)
  vi.mocked(db.user.findUnique).mockResolvedValue({ isManaged: true, email: "a@b.com", managedExpiresAt: new Date(), managedDownloadLimit: 5 } as never)
  vi.mocked(db.user.update).mockResolvedValue({} as never)
})

describe("admin · quitar el plan LIMITED", () => {
  it("deja al usuario como UNSUBSCRIBED y limpia todo rastro de gestión", async () => {
    const res = await PATCH(req(), params)

    expect(res.status).toBe(200)
    const data = vi.mocked(db.user.update).mock.calls[0][0].data as Record<string, unknown>
    expect(data.plan).toBe("UNSUBSCRIBED")
    expect(data.isManaged).toBe(false)
    expect(data.managedBlocked).toBe(false)
    expect(data.managedExpiresAt).toBeNull()
    expect(data.managedDownloadLimit).toBeNull()
    expect(data.managedResumeLimit).toBeNull()
    expect(data.managedCoverLetterLimit).toBeNull()
    expect(data.managedDownloadsUsed).toBe(0)
  })

  it("NO borra al usuario — sus CVs y cartas siguen ahí", async () => {
    await PATCH(req(), params)
    expect(vi.mocked(db.user.delete)).not.toHaveBeenCalled()
  })

  it("corta la sesión viva para que el cambio de plan se note ya", async () => {
    await PATCH(req(), params)
    const data = vi.mocked(db.user.update).mock.calls[0][0].data as Record<string, unknown>
    expect(data.sessionVersion).toEqual({ increment: 1 })
    expect(purgeUserCache).toHaveBeenCalledWith("u1")
  })

  it("queda auditado con qué cambió, no solo 'editado'", async () => {
    await PATCH(req(), params)
    const call = vi.mocked(db.auditLog.create).mock.calls[0][0] as { data: { metadata: Record<string, unknown> } }
    expect(call.data.metadata.change).toBe("unmanaged")
    expect(call.data.metadata.from).toBe("LIMITED")
    expect(call.data.metadata.to).toBe("UNSUBSCRIBED")
  })

  it("solo un SUPER_ADMIN puede hacerlo", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u9", role: "USER" } } as never)
    const res = await PATCH(req(), params)
    expect(res.status).toBe(403)
    expect(vi.mocked(db.user.update)).not.toHaveBeenCalled()
  })
})
