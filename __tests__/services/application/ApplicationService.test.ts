import { describe, it, expect, vi, beforeEach } from "vitest"
import { ApplicationService } from "@/lib/services/application/ApplicationService"
import type { ILogger } from "@/lib/interfaces/ILogger"

// ─── Mock DB ──────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    application: {
      findMany:  vi.fn(),
      findFirst: vi.fn(),
      create:    vi.fn(),
      update:    vi.fn(),
      delete:    vi.fn(),
    },
  },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockLogger: ILogger = {
  info:  vi.fn(),
  warn:  vi.fn(),
  error: vi.fn(),
}

const makeService = () => new ApplicationService(mockLogger)

const USER_ID = "user-1"
const APP_ID  = "app-1"

const makeAppRow = (overrides: Record<string, unknown> = {}) => ({
  id:              APP_ID,
  userId:          USER_ID,
  jobTitle:        "Software Engineer",
  company:         "Acme Corp",
  status:          "WISHLIST",
  notes:           null,
  url:             null,
  salary:          null,
  appliedAt:       null,
  followUpAt:      null,
  reminderSentAt:  null,
  createdAt:       new Date(),
  updatedAt:       new Date(),
  ...overrides,
})

beforeEach(() => vi.clearAllMocks())

// ─────────────────────────────────────────────────────────────────────────────
// list
// ─────────────────────────────────────────────────────────────────────────────

describe("ApplicationService.list", () => {
  it("returns data and null nextCursor when fewer results than limit", async () => {
    const { db } = await import("@/lib/db")
    const rows = [makeAppRow()]
    vi.mocked(db.application.findMany).mockResolvedValue(rows as never)

    const result = await makeService().list(USER_ID, 100)

    expect(result.data).toEqual(rows)
    expect(result.nextCursor).toBeNull()
  })

  it("returns nextCursor when results fill the limit", async () => {
    const { db } = await import("@/lib/db")
    const rows = Array.from({ length: 5 }, (_, i) => makeAppRow({ id: `app-${i}` }))
    vi.mocked(db.application.findMany).mockResolvedValue(rows as never)

    const result = await makeService().list(USER_ID, 5)

    expect(result.nextCursor).toBe("app-4")
  })

  it("clamps limit to 200", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.application.findMany).mockResolvedValue([] as never)

    await makeService().list(USER_ID, 999)

    const call = vi.mocked(db.application.findMany).mock.calls[0][0] as { take: number }
    expect(call.take).toBe(200)
  })

  it("passes cursor when provided", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.application.findMany).mockResolvedValue([] as never)

    await makeService().list(USER_ID, 10, "cursor-xyz")

    const call = vi.mocked(db.application.findMany).mock.calls[0][0] as { skip?: number; cursor?: { id: string } }
    expect(call.skip).toBe(1)
    expect(call.cursor).toEqual({ id: "cursor-xyz" })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// create
// ─────────────────────────────────────────────────────────────────────────────

describe("ApplicationService.create", () => {
  it("creates application for user", async () => {
    const { db } = await import("@/lib/db")
    const row = makeAppRow()
    vi.mocked(db.application.create).mockResolvedValue(row as never)

    const result = await makeService().create(USER_ID, {
      jobTitle: "Software Engineer",
      company:  "Acme Corp",
      status:   "WISHLIST",
    })

    expect(result).toEqual(row)
    const call = vi.mocked(db.application.create).mock.calls[0][0] as { data: { userId: string } }
    expect(call.data.userId).toBe(USER_ID)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// update
// ─────────────────────────────────────────────────────────────────────────────

describe("ApplicationService.update", () => {
  it("updates application when found for owner", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.application.findFirst).mockResolvedValue({ id: APP_ID } as never)
    vi.mocked(db.application.update).mockResolvedValue({} as never)

    await makeService().update(USER_ID, APP_ID, { status: "APPLIED" })

    expect(vi.mocked(db.application.update)).toHaveBeenCalledOnce()
  })

  it("throws not_found when application does not exist", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.application.findFirst).mockResolvedValue(null as never)

    await expect(makeService().update(USER_ID, APP_ID, {})).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    })
    expect(vi.mocked(db.application.update)).not.toHaveBeenCalled()
  })

  it("enforces ownership — other user cannot update", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.application.findFirst).mockResolvedValue(null as never)

    await expect(makeService().update("other-user", APP_ID, {})).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    })
    const call = vi.mocked(db.application.findFirst).mock.calls[0][0] as { where: { userId: string } }
    expect(call.where.userId).toBe("other-user")
  })

  it("resets reminderSentAt when followUpAt changes", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.application.findFirst).mockResolvedValue({ id: APP_ID } as never)
    vi.mocked(db.application.update).mockResolvedValue({} as never)

    await makeService().update(USER_ID, APP_ID, { followUpAt: "2026-12-01T00:00:00.000Z" })

    const call = vi.mocked(db.application.update).mock.calls[0][0] as { data: { reminderSentAt?: null } }
    expect(call.data.reminderSentAt).toBeNull()
  })

  it("clears followUpAt when set to null", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.application.findFirst).mockResolvedValue({ id: APP_ID } as never)
    vi.mocked(db.application.update).mockResolvedValue({} as never)

    await makeService().update(USER_ID, APP_ID, { followUpAt: null })

    const call = vi.mocked(db.application.update).mock.calls[0][0] as { data: { followUpAt: null } }
    expect(call.data.followUpAt).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// updateStatus
// ─────────────────────────────────────────────────────────────────────────────

describe("ApplicationService.updateStatus", () => {
  it("delegates to update with only status", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.application.findFirst).mockResolvedValue({ id: APP_ID } as never)
    vi.mocked(db.application.update).mockResolvedValue({} as never)

    await makeService().updateStatus(USER_ID, APP_ID, "INTERVIEW")

    const call = vi.mocked(db.application.update).mock.calls[0][0] as { data: { status?: string } }
    expect(call.data.status).toBe("INTERVIEW")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// delete
// ─────────────────────────────────────────────────────────────────────────────

describe("ApplicationService.delete", () => {
  it("deletes application when found for owner", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.application.findFirst).mockResolvedValue({ id: APP_ID } as never)
    vi.mocked(db.application.delete).mockResolvedValue({} as never)

    await makeService().delete(USER_ID, APP_ID)

    expect(vi.mocked(db.application.delete)).toHaveBeenCalledWith({ where: { id: APP_ID } })
  })

  it("throws not_found when application does not exist", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.application.findFirst).mockResolvedValue(null as never)

    await expect(makeService().delete(USER_ID, APP_ID)).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    })
    expect(vi.mocked(db.application.delete)).not.toHaveBeenCalled()
  })

  it("enforces ownership — other user cannot delete", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.application.findFirst).mockResolvedValue(null as never)

    await expect(makeService().delete("other-user", APP_ID)).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    })
    const call = vi.mocked(db.application.findFirst).mock.calls[0][0] as { where: { userId: string } }
    expect(call.where.userId).toBe("other-user")
  })
})
