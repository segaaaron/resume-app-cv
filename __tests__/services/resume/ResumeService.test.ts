import { describe, it, expect, vi, beforeEach } from "vitest"
import { ResumeService } from "@/lib/services/resume/ResumeService"
import type { ILogger } from "@/lib/interfaces/ILogger"

// ─── Mock DB ──────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    resume: {
      findMany:  vi.fn(),
      findFirst: vi.fn(),
      count:     vi.fn(),
      create:    vi.fn(),
      update:    vi.fn(),
      delete:    vi.fn(),
    },
    resumeVersion: {
      findMany:   vi.fn(),
      findFirst:  vi.fn(),
      create:     vi.fn(),
      delete:     vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    cVView: {
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// ─── Mock nanoid ──────────────────────────────────────────────────────────────

vi.mock("nanoid", () => ({ nanoid: vi.fn(() => "slug-abc123") }))

// ─── Mock types/resume (avoid heavy schema parsing in unit tests) ──────────────

vi.mock("@/types/resume", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/types/resume")>()
  return {
    ...actual,
    DEFAULT_SECTIONS: [{ id: "personal", label: "Personal", visible: true }],
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockLogger: ILogger = {
  info:  vi.fn(),
  warn:  vi.fn(),
  error: vi.fn(),
}

const makeService = () => new ResumeService(mockLogger)

const USER_ID   = "user-1"
const RESUME_ID = "resume-1"

beforeEach(() => vi.clearAllMocks())

// ─────────────────────────────────────────────────────────────────────────────
// list
// ─────────────────────────────────────────────────────────────────────────────

describe("ResumeService.list", () => {
  it("returns data and null nextCursor when fewer results than limit", async () => {
    const { db } = await import("@/lib/db")
    const rows = [{ id: "r1", title: "CV", templateId: null, colorScheme: null, updatedAt: new Date(), createdAt: new Date() }]
    vi.mocked(db.resume.findMany).mockResolvedValue(rows as never)

    const result = await makeService().list(USER_ID, 50)

    expect(result.data).toEqual(rows)
    expect(result.nextCursor).toBeNull()
  })

  it("returns nextCursor when results fill the limit", async () => {
    const { db } = await import("@/lib/db")
    const rows = Array.from({ length: 10 }, (_, i) => ({
      id: `r${i}`, title: `CV ${i}`, templateId: null, colorScheme: null,
      updatedAt: new Date(), createdAt: new Date(),
    }))
    vi.mocked(db.resume.findMany).mockResolvedValue(rows as never)

    const result = await makeService().list(USER_ID, 10)

    expect(result.nextCursor).toBe("r9")
  })

  it("clamps limit to 100", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findMany).mockResolvedValue([] as never)

    await makeService().list(USER_ID, 500)

    expect(db.resume.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// get
// ─────────────────────────────────────────────────────────────────────────────

describe("ResumeService.get", () => {
  it("returns resume when found", async () => {
    const { db } = await import("@/lib/db")
    const resume = { id: RESUME_ID, title: "My CV", userId: USER_ID }
    vi.mocked(db.resume.findFirst).mockResolvedValue(resume as never)

    const result = await makeService().get(USER_ID, RESUME_ID)

    expect(result).toEqual(resume)
    expect(db.resume.findFirst).toHaveBeenCalledWith({
      where: { id: RESUME_ID, userId: USER_ID },
    })
  })

  it("throws not_found (404) when resume does not belong to user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue(null)

    await expect(makeService().get(USER_ID, RESUME_ID)).rejects.toMatchObject({
      code: "not_found", status: 404,
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// create
// ─────────────────────────────────────────────────────────────────────────────

describe("ResumeService.create", () => {
  it("creates a resume for a PRO user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ plan: "PRO" } as never)
    const newResume = { id: "r-new", title: "Mi CV" }
    vi.mocked(db.resume.create).mockResolvedValue(newResume as never)

    const result = await makeService().create(USER_ID)

    expect(result).toEqual(newResume)
    expect(db.resume.create).toHaveBeenCalledOnce()
  })

  it("throws 403 when UNSUBSCRIBED user hits maxResumes limit", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ plan: "UNSUBSCRIBED" } as never)
    // UNSUBSCRIBED maxResumes = 0, so count=0 >= 0 triggers the limit
    vi.mocked(db.resume.count).mockResolvedValue(0 as never)

    await expect(makeService().create(USER_ID)).rejects.toMatchObject({
      status: 403,
    })
    expect(db.resume.create).not.toHaveBeenCalled()
  })

  it("passes templateId when provided", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ plan: "PRO" } as never)
    vi.mocked(db.resume.create).mockResolvedValue({ id: "r-new" } as never)

    await makeService().create(USER_ID, "template-modern")

    expect(db.resume.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ templateId: "template-modern" }),
      }),
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// update
// ─────────────────────────────────────────────────────────────────────────────

describe("ResumeService.update", () => {
  it("updates resume fields", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue({ id: RESUME_ID } as never)
    vi.mocked(db.resume.update).mockResolvedValue({} as never)

    await makeService().update(USER_ID, RESUME_ID, { title: "New Title" })

    expect(db.resume.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: RESUME_ID },
        data: expect.objectContaining({ title: "New Title" }),
      }),
    )
  })

  it("throws not_found (404) when resume does not belong to user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue(null)

    await expect(makeService().update(USER_ID, RESUME_ID, {})).rejects.toMatchObject({
      code: "not_found", status: 404,
    })
    expect(db.resume.update).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// delete
// ─────────────────────────────────────────────────────────────────────────────

describe("ResumeService.delete", () => {
  it("deletes resume when it belongs to user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue({ id: RESUME_ID } as never)
    vi.mocked(db.resume.delete).mockResolvedValue({} as never)

    await makeService().delete(USER_ID, RESUME_ID)

    expect(db.resume.delete).toHaveBeenCalledWith({ where: { id: RESUME_ID } })
  })

  it("throws not_found (404) when resume does not belong to user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue(null)

    await expect(makeService().delete(USER_ID, RESUME_ID)).rejects.toMatchObject({
      code: "not_found", status: 404,
    })
    expect(db.resume.delete).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// duplicate
// ─────────────────────────────────────────────────────────────────────────────

describe("ResumeService.duplicate", () => {
  it("creates a copy with '(copia)' suffix", async () => {
    const { db } = await import("@/lib/db")
    const original = { id: RESUME_ID, title: "My CV", templateId: "t1", colorScheme: "#fff", fontFamily: null, fontSize: null, spacing: null, sections: [], personalDetails: {}, photoUrl: null, language: "es" }
    vi.mocked(db.resume.findFirst).mockResolvedValue(original as never)
    vi.mocked(db.user.findUnique).mockResolvedValue({ plan: "PRO" } as never)
    vi.mocked(db.resume.create).mockResolvedValue({ id: "copy-1" } as never)

    const result = await makeService().duplicate(USER_ID, RESUME_ID)

    expect(result).toEqual({ id: "copy-1" })
    expect(db.resume.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: "My CV (copia)" }),
      }),
    )
  })

  it("throws not_found (404) when original does not belong to user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue(null)
    vi.mocked(db.user.findUnique).mockResolvedValue({ plan: "PRO" } as never)

    await expect(makeService().duplicate(USER_ID, RESUME_ID)).rejects.toMatchObject({
      code: "not_found", status: 404,
    })
    expect(db.resume.create).not.toHaveBeenCalled()
  })

  it("throws 403 when user hits plan limit", async () => {
    const { db } = await import("@/lib/db")
    const original = { id: RESUME_ID, title: "CV" }
    vi.mocked(db.resume.findFirst).mockResolvedValue(original as never)
    vi.mocked(db.user.findUnique).mockResolvedValue({ plan: "UNSUBSCRIBED" } as never)
    vi.mocked(db.resume.count).mockResolvedValue(0 as never)

    await expect(makeService().duplicate(USER_ID, RESUME_ID)).rejects.toMatchObject({
      status: 403,
    })
    expect(db.resume.create).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// toggleShare
// ─────────────────────────────────────────────────────────────────────────────

describe("ResumeService.toggleShare", () => {
  it("sets isPublic=false when currently public", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue({ id: RESUME_ID, isPublic: true, publicSlug: "abc" } as never)
    vi.mocked(db.resume.update).mockResolvedValue({} as never)
    vi.mocked(db.auditLog.create).mockResolvedValue({} as never)

    const result = await makeService().toggleShare(USER_ID, RESUME_ID)

    expect(result).toEqual({ isPublic: false, publicSlug: "abc" })
    expect(db.resume.update).toHaveBeenCalledWith({ where: { id: RESUME_ID }, data: { isPublic: false } })
  })

  it("sets isPublic=true and generates slug when no slug exists", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue({ id: RESUME_ID, isPublic: false, publicSlug: null } as never)
    vi.mocked(db.resume.update).mockResolvedValue({} as never)
    vi.mocked(db.auditLog.create).mockResolvedValue({} as never)

    const result = await makeService().toggleShare(USER_ID, RESUME_ID)

    expect(result.isPublic).toBe(true)
    expect(result.publicSlug).toBe("slug-abc123")
    expect(db.resume.update).toHaveBeenCalledWith({
      where: { id: RESUME_ID },
      data: { isPublic: true, publicSlug: "slug-abc123" },
    })
  })

  it("throws not_found (404) when resume does not belong to user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue(null)

    await expect(makeService().toggleShare(USER_ID, RESUME_ID)).rejects.toMatchObject({
      code: "not_found", status: 404,
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getViewStats
// ─────────────────────────────────────────────────────────────────────────────

describe("ResumeService.getViewStats", () => {
  it("returns view counts for owned resume", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue({ id: RESUME_ID, isPublic: true, publicSlug: "slug" } as never)
    vi.mocked(db.cVView.count)
      .mockResolvedValueOnce(100 as never)
      .mockResolvedValueOnce(20 as never)
      .mockResolvedValueOnce(50 as never)

    const result = await makeService().getViewStats(USER_ID, RESUME_ID)

    expect(result).toEqual({ total: 100, last7d: 20, last30d: 50, isPublic: true, publicSlug: "slug" })
  })

  it("throws not_found (404) when resume does not belong to user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue(null)

    await expect(makeService().getViewStats(USER_ID, RESUME_ID)).rejects.toMatchObject({
      code: "not_found", status: 404,
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getVersions
// ─────────────────────────────────────────────────────────────────────────────

describe("ResumeService.getVersions", () => {
  it("returns versions for owned resume", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue({ id: RESUME_ID } as never)
    const versions = [{ id: "v1", label: "First", createdAt: new Date() }]
    vi.mocked(db.resumeVersion.findMany).mockResolvedValue(versions as never)

    const result = await makeService().getVersions(USER_ID, RESUME_ID)

    expect(result).toEqual(versions)
  })

  it("throws not_found (404) when resume does not belong to user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue(null)

    await expect(makeService().getVersions(USER_ID, RESUME_ID)).rejects.toMatchObject({
      code: "not_found", status: 404,
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// createVersion
// ─────────────────────────────────────────────────────────────────────────────

describe("ResumeService.createVersion", () => {
  const activeUser = { plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionEndsAt: new Date(Date.now() + 86400_000) }

  it("creates a version for an active Pro user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue(activeUser as never)
    vi.mocked(db.resume.findFirst).mockResolvedValue({ id: RESUME_ID } as never)
    vi.mocked(db.$transaction).mockImplementation(async (fn) => fn(db as never))
    vi.mocked(db.resumeVersion.create).mockResolvedValue({ id: "v-new" } as never)
    vi.mocked(db.resumeVersion.findMany).mockResolvedValue([{ id: "v-new" }] as never)

    const snapshot = { title: "My CV", sections: [], sectionData: undefined, config: undefined }
    const result = await makeService().createVersion(USER_ID, RESUME_ID, snapshot, "Auto-save")

    expect(result).toEqual({ id: "v-new" })
    expect(db.resumeVersion.create).toHaveBeenCalledOnce()
  })

  it("throws pro_required (403) when user is not Pro-active", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue({ plan: "UNSUBSCRIBED", subscriptionStatus: "NONE", subscriptionEndsAt: null } as never)

    await expect(
      makeService().createVersion(USER_ID, RESUME_ID, {}, undefined)
    ).rejects.toMatchObject({ code: "pro_required", status: 403 })
  })

  it("throws not_found (404) when resume does not belong to user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findUnique).mockResolvedValue(activeUser as never)
    vi.mocked(db.resume.findFirst).mockResolvedValue(null)

    await expect(
      makeService().createVersion(USER_ID, RESUME_ID, {}, undefined)
    ).rejects.toMatchObject({ code: "not_found", status: 404 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// deleteVersion
// ─────────────────────────────────────────────────────────────────────────────

describe("ResumeService.deleteVersion", () => {
  it("deletes version owned by user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resumeVersion.findFirst).mockResolvedValue({
      id: "v1",
      resume: { userId: USER_ID },
    } as never)
    vi.mocked(db.resumeVersion.delete).mockResolvedValue({} as never)

    await makeService().deleteVersion(USER_ID, "v1")

    expect(db.resumeVersion.delete).toHaveBeenCalledWith({ where: { id: "v1" } })
  })

  it("throws not_found (404) when version belongs to another user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resumeVersion.findFirst).mockResolvedValue({
      id: "v1",
      resume: { userId: "other-user" },
    } as never)

    await expect(makeService().deleteVersion(USER_ID, "v1")).rejects.toMatchObject({
      code: "not_found", status: 404,
    })
    expect(db.resumeVersion.delete).not.toHaveBeenCalled()
  })

  it("throws not_found (404) when version not found", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resumeVersion.findFirst).mockResolvedValue(null)

    await expect(makeService().deleteVersion(USER_ID, "v1")).rejects.toMatchObject({
      code: "not_found", status: 404,
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// restoreVersion
// ─────────────────────────────────────────────────────────────────────────────

describe("ResumeService.restoreVersion", () => {
  const validSnapshot = {
    title: "Restored CV",
    sections: [],
    sectionData: undefined,
    config: { templateId: "modern" },
  }

  it("restores a valid snapshot and returns resumeId", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resumeVersion.findFirst).mockResolvedValue({
      id: "v1",
      resumeId: RESUME_ID,
      snapshot: validSnapshot,
      resume: { userId: USER_ID },
    } as never)
    vi.mocked(db.resume.update).mockResolvedValue({} as never)

    const result = await makeService().restoreVersion(USER_ID, "v1")

    expect(result).toEqual({ resumeId: RESUME_ID })
    expect(db.resume.update).toHaveBeenCalledOnce()
  })

  it("throws snapshot_corrupted (422) when snapshot is invalid", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resumeVersion.findFirst).mockResolvedValue({
      id: "v1",
      resumeId: RESUME_ID,
      snapshot: { bad: "data", sections: "not-an-array" },
      resume: { userId: USER_ID },
    } as never)

    await expect(makeService().restoreVersion(USER_ID, "v1")).rejects.toMatchObject({
      code: "snapshot_corrupted", status: 422,
    })
    expect(db.resume.update).not.toHaveBeenCalled()
  })

  it("throws not_found (404) when version belongs to another user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resumeVersion.findFirst).mockResolvedValue({
      id: "v1",
      resumeId: RESUME_ID,
      snapshot: validSnapshot,
      resume: { userId: "other-user" },
    } as never)

    await expect(makeService().restoreVersion(USER_ID, "v1")).rejects.toMatchObject({
      code: "not_found", status: 404,
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// updatePhoto / deletePhoto
// ─────────────────────────────────────────────────────────────────────────────

describe("ResumeService.updatePhoto", () => {
  it("saves base64 photo to resume", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue({ id: RESUME_ID } as never)
    vi.mocked(db.resume.update).mockResolvedValue({} as never)

    const base64 = "data:image/png;base64,abc=="
    const result = await makeService().updatePhoto(USER_ID, RESUME_ID, base64)

    expect(result).toEqual({ photoUrl: base64 })
    expect(db.resume.update).toHaveBeenCalledWith({
      where: { id: RESUME_ID },
      data: { photoUrl: base64 },
    })
  })

  it("throws not_found (404) when resume does not belong to user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue(null)

    await expect(makeService().updatePhoto(USER_ID, RESUME_ID, "data:image/png;base64,abc")).rejects.toMatchObject({
      code: "not_found", status: 404,
    })
  })
})

describe("ResumeService.deletePhoto", () => {
  it("sets photoUrl to null", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue({ id: RESUME_ID } as never)
    vi.mocked(db.resume.update).mockResolvedValue({} as never)

    await makeService().deletePhoto(USER_ID, RESUME_ID)

    expect(db.resume.update).toHaveBeenCalledWith({
      where: { id: RESUME_ID },
      data: { photoUrl: null },
    })
  })

  it("throws not_found (404) when resume does not belong to user", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.resume.findFirst).mockResolvedValue(null)

    await expect(makeService().deletePhoto(USER_ID, RESUME_ID)).rejects.toMatchObject({
      code: "not_found", status: 404,
    })
  })
})
