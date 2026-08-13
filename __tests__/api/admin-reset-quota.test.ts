import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/csrf", () => ({ checkOrigin: vi.fn(() => true) }))
vi.mock("@/lib/db", () => ({
  db: { user: { findFirst: vi.fn() }, aIRateLimit: { deleteMany: vi.fn() }, auditLog: { create: vi.fn() } },
}))
vi.mock("@/lib/logger", () => ({ createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) }))

import { POST } from "@/app/api/admin/ai-usage/reset-quota/route"
import { auth } from "@/lib/auth"
import { checkOrigin } from "@/lib/csrf"
import { db } from "@/lib/db"

const asAdmin = () => vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "SUPER_ADMIN" } } as never)
const req = (body: unknown) =>
  new Request("https://app.test/api/admin/ai-usage/reset-quota", { method: "POST", body: JSON.stringify(body) })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(checkOrigin).mockReturnValue(true)
  vi.mocked(db.user.findFirst).mockResolvedValue({ id: "u-1", email: "someone@test.com" } as never)
  vi.mocked(db.aIRateLimit.deleteMany).mockResolvedValue({ count: 3 } as never)
  vi.mocked(db.auditLog.create).mockResolvedValue({} as never)
})

/**
 * These RUN the route. The previous version read the file as a string and asserted
 * on its wording — which passes just as green after somebody breaks the behaviour
 * and leaves the text alone. A quota reset hands out paid capacity; its guards have
 * to be tested by exercising them.
 */
describe("admin reset-quota is fenced", () => {
  it("rejects an anonymous caller", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    expect((await POST(req({ userId: "u-1" }))).status).toBe(401)
    expect(db.aIRateLimit.deleteMany).not.toHaveBeenCalled()
  })

  it("rejects a signed-in NON-admin", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u-9", role: "USER" } } as never)
    expect((await POST(req({ userId: "u-1" }))).status).toBe(403)
    expect(db.aIRateLimit.deleteMany).not.toHaveBeenCalled()
  })

  it("rejects a cross-origin post before it looks at the session", async () => {
    vi.mocked(checkOrigin).mockReturnValue(false)
    expect((await POST(req({ userId: "u-1" }))).status).toBe(403)
    expect(auth).not.toHaveBeenCalled()
  })

  it("rejects a payload naming nobody", async () => {
    asAdmin()
    expect((await POST(req({}))).status).toBe(400)
    expect(db.aIRateLimit.deleteMany).not.toHaveBeenCalled()
  })

  it("404s on a user that does not exist", async () => {
    asAdmin()
    vi.mocked(db.user.findFirst).mockResolvedValue(null as never)
    expect((await POST(req({ email: "ghost@test.com" }))).status).toBe(404)
    expect(db.aIRateLimit.deleteMany).not.toHaveBeenCalled()
  })
})

describe("what it actually deletes", () => {
  it("clears the daily windows of ONE user and reports how many", async () => {
    asAdmin()
    const res = await POST(req({ userId: "u-1" }))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ ok: true, cleared: 3 })
  })

  // The boundary that matters: lifetime freemium counters are the paid line.
  // Clearing them would be giving quota away, not unblocking a test.
  it("never touches anything but the ai-daily rows of that user", async () => {
    asAdmin()
    await POST(req({ userId: "u-1" }))
    expect(db.aIRateLimit.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u-1", endpoint: { startsWith: "ai-daily:" } },
    })
  })

  it("leaves a trail naming who did it", async () => {
    asAdmin()
    await POST(req({ userId: "u-1" }))
    const data = vi.mocked(db.auditLog.create).mock.calls[0]?.[0]?.data as { userId: string; metadata: Record<string, unknown> }
    expect(data.userId).toBe("u-1")
    expect(data.metadata).toMatchObject({ source: "admin_reset_ai_daily_quota", by: "admin-1" })
  })

  it("accepts an email as well as an id", async () => {
    asAdmin()
    await POST(req({ email: "someone@test.com" }))
    expect(db.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { email: "someone@test.com" } }))
  })
})
