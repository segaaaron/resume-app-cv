import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mock db ──────────────────────────────────────────────────────────────────
// vi.mock is hoisted — cannot reference top-level variables in factory.
// Use vi.fn() inline and retrieve the mocks after import.
vi.mock("@/lib/db", () => ({
  db: {
    aIRateLimit: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { checkRateLimit } from "@/lib/ai-client"
import { db } from "@/lib/db"

const mockFindUnique = db.aIRateLimit.findUnique as ReturnType<typeof vi.fn>
const mockUpsert = db.aIRateLimit.upsert as ReturnType<typeof vi.fn>
const mockUpdate = db.aIRateLimit.update as ReturnType<typeof vi.fn>

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("first call for new userId+endpoint → returns true, creates record", async () => {
    mockFindUnique.mockResolvedValue(null)
    mockUpsert.mockResolvedValue({})

    const result = await checkRateLimit("user-1", "improve-bullet")

    expect(result).toBe(true)
    expect(mockUpsert).toHaveBeenCalledOnce()
    const upsertCall = mockUpsert.mock.calls[0][0]
    expect(upsertCall.create.count).toBe(1)
    expect(upsertCall.create.userId).toBe("user-1")
    expect(upsertCall.create.endpoint).toBe("improve-bullet")
  })

  it("call within limit (count < 20) → returns true, increments count", async () => {
    const future = new Date(Date.now() + 3600 * 1000)
    mockFindUnique.mockResolvedValue({ userId: "user-1", endpoint: "improve-bullet", count: 5, resetAt: future })
    mockUpdate.mockResolvedValue({})

    const result = await checkRateLimit("user-1", "improve-bullet")

    expect(result).toBe(true)
    expect(mockUpdate).toHaveBeenCalledOnce()
    expect(mockUpdate.mock.calls[0][0].data).toEqual({ count: { increment: 1 } })
  })

  it("call at limit (count >= 20) → returns false", async () => {
    const future = new Date(Date.now() + 3600 * 1000)
    mockFindUnique.mockResolvedValue({ userId: "user-1", endpoint: "improve-bullet", count: 20, resetAt: future })

    const result = await checkRateLimit("user-1", "improve-bullet")

    expect(result).toBe(false)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("call at custom limit (count >= custom limit) → returns false", async () => {
    const future = new Date(Date.now() + 3600 * 1000)
    mockFindUnique.mockResolvedValue({ userId: "user-1", endpoint: "ats-score", count: 5, resetAt: future })

    const result = await checkRateLimit("user-1", "ats-score", 5)

    expect(result).toBe(false)
  })

  it("call after resetAt has passed → returns true (resets window)", async () => {
    const past = new Date(Date.now() - 1000) // expired
    mockFindUnique.mockResolvedValue({ userId: "user-1", endpoint: "improve-bullet", count: 19, resetAt: past })
    mockUpsert.mockResolvedValue({})

    const result = await checkRateLimit("user-1", "improve-bullet")

    expect(result).toBe(true)
    // Should reset via upsert, not increment via update
    expect(mockUpsert).toHaveBeenCalledOnce()
    expect(mockUpdate).not.toHaveBeenCalled()
    const upsertCall = mockUpsert.mock.calls[0][0]
    expect(upsertCall.update.count).toBe(1)
  })
})
