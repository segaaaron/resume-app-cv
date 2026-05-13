import { describe, it, expect, vi, beforeEach } from "vitest"
import { CoverLetterService } from "@/lib/services/cover-letter/CoverLetterService"
import { AppError } from "@/lib/services/auth/AppError"
import type { ILogger } from "@/lib/interfaces/ILogger"

// ─── Mock DB ──────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    coverLetter: {
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

const makeService = () => new CoverLetterService(mockLogger)

const USER_ID   = "user-1"
const LETTER_ID = "letter-1"

const makeLetterRow = (overrides: Record<string, unknown> = {}) => ({
  id: LETTER_ID,
  userId: USER_ID,
  title: "Mi Carta",
  colorScheme: null,
  content: {},
  fontFamily: null,
  templateId: null,
  updatedAt: new Date(),
  createdAt: new Date(),
  ...overrides,
})

beforeEach(() => vi.clearAllMocks())

// ─────────────────────────────────────────────────────────────────────────────
// list
// ─────────────────────────────────────────────────────────────────────────────

describe("CoverLetterService.list", () => {
  it("returns data and null nextCursor when fewer results than limit", async () => {
    const { db } = await import("@/lib/db")
    const rows = [makeLetterRow()]
    vi.mocked(db.coverLetter.findMany).mockResolvedValue(rows as never)

    const result = await makeService().list(USER_ID, 50)

    expect(result.data).toEqual(rows)
    expect(result.nextCursor).toBeNull()
  })

  it("returns nextCursor when results fill the limit", async () => {
    const { db } = await import("@/lib/db")
    const rows = Array.from({ length: 5 }, (_, i) => makeLetterRow({ id: `letter-${i}` }))
    vi.mocked(db.coverLetter.findMany).mockResolvedValue(rows as never)

    const result = await makeService().list(USER_ID, 5)

    expect(result.nextCursor).toBe("letter-4")
  })

  it("clamps limit to 100", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.coverLetter.findMany).mockResolvedValue([] as never)

    await makeService().list(USER_ID, 500)

    const call = vi.mocked(db.coverLetter.findMany).mock.calls[0][0] as { take: number }
    expect(call.take).toBe(100)
  })

  it("passes cursor when provided", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.coverLetter.findMany).mockResolvedValue([] as never)

    await makeService().list(USER_ID, 10, "cursor-abc")

    const call = vi.mocked(db.coverLetter.findMany).mock.calls[0][0] as { skip?: number; cursor?: { id: string } }
    expect(call.skip).toBe(1)
    expect(call.cursor).toEqual({ id: "cursor-abc" })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// get
// ─────────────────────────────────────────────────────────────────────────────

describe("CoverLetterService.get", () => {
  it("returns letter when found for owner", async () => {
    const { db } = await import("@/lib/db")
    const row = makeLetterRow()
    vi.mocked(db.coverLetter.findFirst).mockResolvedValue(row as never)

    const result = await makeService().get(USER_ID, LETTER_ID)

    expect(result).toEqual(row)
    expect(vi.mocked(db.coverLetter.findFirst)).toHaveBeenCalledWith({
      where: { id: LETTER_ID, userId: USER_ID },
    })
  })

  it("throws AppError not_found when letter does not exist", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.coverLetter.findFirst).mockResolvedValue(null as never)

    await expect(makeService().get(USER_ID, LETTER_ID)).rejects.toThrow(AppError)
    await expect(makeService().get(USER_ID, LETTER_ID)).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    })
  })

  it("throws not_found when letter belongs to another user (ownership boundary)", async () => {
    const { db } = await import("@/lib/db")
    // DB returns null because userId filter excludes the record
    vi.mocked(db.coverLetter.findFirst).mockResolvedValue(null as never)

    await expect(makeService().get("other-user", LETTER_ID)).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    })
    // Verify the query included the caller's userId, not the owner's
    const call = vi.mocked(db.coverLetter.findFirst).mock.calls[0][0] as { where: { userId: string } }
    expect(call.where.userId).toBe("other-user")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// create
// ─────────────────────────────────────────────────────────────────────────────

describe("CoverLetterService.create", () => {
  it("creates letter with default title for user", async () => {
    const { db } = await import("@/lib/db")
    const row = makeLetterRow()
    vi.mocked(db.coverLetter.create).mockResolvedValue(row as never)

    const result = await makeService().create(USER_ID)

    expect(result).toEqual(row)
    const call = vi.mocked(db.coverLetter.create).mock.calls[0][0] as { data: { userId: string; title: string } }
    expect(call.data.userId).toBe(USER_ID)
    expect(call.data.title).toBe("Mi Carta de Presentación")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// update
// ─────────────────────────────────────────────────────────────────────────────

describe("CoverLetterService.update", () => {
  it("updates letter when found for owner", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.coverLetter.findFirst).mockResolvedValue({ id: LETTER_ID } as never)
    vi.mocked(db.coverLetter.update).mockResolvedValue({} as never)

    await makeService().update(USER_ID, LETTER_ID, { title: "Nuevo título" })

    expect(vi.mocked(db.coverLetter.update)).toHaveBeenCalledOnce()
  })

  it("throws not_found when letter does not exist", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.coverLetter.findFirst).mockResolvedValue(null as never)

    await expect(makeService().update(USER_ID, LETTER_ID, {})).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    })
    expect(vi.mocked(db.coverLetter.update)).not.toHaveBeenCalled()
  })

  it("enforces ownership — other user cannot update", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.coverLetter.findFirst).mockResolvedValue(null as never)

    await expect(makeService().update("other-user", LETTER_ID, {})).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    })
    const call = vi.mocked(db.coverLetter.findFirst).mock.calls[0][0] as { where: { userId: string } }
    expect(call.where.userId).toBe("other-user")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// delete
// ─────────────────────────────────────────────────────────────────────────────

describe("CoverLetterService.delete", () => {
  it("deletes letter when found for owner", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.coverLetter.findFirst).mockResolvedValue({ id: LETTER_ID } as never)
    vi.mocked(db.coverLetter.delete).mockResolvedValue({} as never)

    await makeService().delete(USER_ID, LETTER_ID)

    expect(vi.mocked(db.coverLetter.delete)).toHaveBeenCalledWith({ where: { id: LETTER_ID } })
  })

  it("throws not_found when letter does not exist", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.coverLetter.findFirst).mockResolvedValue(null as never)

    await expect(makeService().delete(USER_ID, LETTER_ID)).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    })
    expect(vi.mocked(db.coverLetter.delete)).not.toHaveBeenCalled()
  })

  it("enforces ownership — other user cannot delete", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.coverLetter.findFirst).mockResolvedValue(null as never)

    await expect(makeService().delete("other-user", LETTER_ID)).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    })
    const call = vi.mocked(db.coverLetter.findFirst).mock.calls[0][0] as { where: { userId: string } }
    expect(call.where.userId).toBe("other-user")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getPdfMeta
// ─────────────────────────────────────────────────────────────────────────────

describe("CoverLetterService.getPdfMeta", () => {
  it("returns id and title for owner", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.coverLetter.findFirst).mockResolvedValue({ id: LETTER_ID, title: "Mi Carta" } as never)

    const result = await makeService().getPdfMeta(USER_ID, LETTER_ID)

    expect(result).toEqual({ id: LETTER_ID, title: "Mi Carta" })
  })

  it("throws not_found when letter does not exist", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.coverLetter.findFirst).mockResolvedValue(null as never)

    await expect(makeService().getPdfMeta(USER_ID, LETTER_ID)).rejects.toMatchObject({
      code: "not_found",
      status: 404,
    })
  })
})
