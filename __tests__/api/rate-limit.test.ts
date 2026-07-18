import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    aIRateLimit: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}))

import { checkRateLimit, recordRateLimitUsage, clearRateLimitCache } from "@/lib/rate-limit"
import { db } from "@/lib/db"

const mockFindUnique = db.aIRateLimit.findUnique as ReturnType<typeof vi.fn>
const mockQueryRaw   = db.$queryRaw as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  clearRateLimitCache()
})

describe("checkRateLimit (check-only — never increments)", () => {
  it("no row → returns true, does NOT write to DB", async () => {
    mockFindUnique.mockResolvedValue(null)
    const result = await checkRateLimit("user-1", "improve-bullet")
    expect(result).toBe(true)
    expect(mockQueryRaw).not.toHaveBeenCalled()
  })

  it("row exists, window expired → returns true (expired windows are always allowed)", async () => {
    mockFindUnique.mockResolvedValue({ count: 99, resetAt: new Date(Date.now() - 1000) })
    const result = await checkRateLimit("user-1", "improve-bullet")
    expect(result).toBe(true)
    expect(mockQueryRaw).not.toHaveBeenCalled()
  })

  it("count < default limit (20) → returns true", async () => {
    mockFindUnique.mockResolvedValue({ count: 5, resetAt: new Date(Date.now() + 3_600_000) })
    expect(await checkRateLimit("user-1", "improve-bullet")).toBe(true)
    expect(mockQueryRaw).not.toHaveBeenCalled()
  })

  it("count >= default limit (20) → returns false", async () => {
    mockFindUnique.mockResolvedValue({ count: 20, resetAt: new Date(Date.now() + 3_600_000) })
    expect(await checkRateLimit("user-1", "improve-bullet")).toBe(false)
  })

  it("count < custom limit → returns true", async () => {
    mockFindUnique.mockResolvedValue({ count: 4, resetAt: new Date(Date.now() + 3_600_000) })
    expect(await checkRateLimit("user-1", "session-challenge", 5)).toBe(true)
  })

  it("count >= custom limit → returns false", async () => {
    mockFindUnique.mockResolvedValue({ count: 5, resetAt: new Date(Date.now() + 3_600_000) })
    expect(await checkRateLimit("user-1", "session-challenge", 5)).toBe(false)
  })
})

describe("recordRateLimitUsage (increments the usage counter)", () => {
  it("calls $queryRaw with upsert SQL", async () => {
    mockQueryRaw.mockResolvedValue([])
    await recordRateLimitUsage("user-1", "register")
    expect(mockQueryRaw).toHaveBeenCalledOnce()
  })
})
