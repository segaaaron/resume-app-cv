import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({ db: { aiAnswerCache: { findUnique: vi.fn(), create: vi.fn() } } }))

import { answerHash, readAnswer, writeAnswer } from "@/lib/services/ai/shared/answer-cache"
import { db } from "@/lib/db"

const findUnique = vi.mocked(db.aiAnswerCache.findUnique)
const create = vi.mocked(db.aiAnswerCache.create)

beforeEach(() => {
  vi.clearAllMocks()
  findUnique.mockResolvedValue(null)
  create.mockResolvedValue({} as never)
})

/**
 * This is the machinery behind "the same resume must not score 80 and then 71".
 * The score is computed from lists a model produced; if those lists are re-derived
 * per run, the number moves on its own.
 */
describe("answerHash", () => {
  it("is stable for the same question", () => {
    expect(answerHash("m", "es", "jd", "posting text")).toBe(answerHash("m", "es", "jd", "posting text"))
  })

  it("changes when the posting changes", () => {
    expect(answerHash("m", "es", "jd", "posting A")).not.toBe(answerHash("m", "es", "jd", "posting B"))
  })

  it("changes when the model changes — a new oracle is a new question", () => {
    expect(answerHash("m1", "es", "jd", "x")).not.toBe(answerHash("m2", "es", "jd", "x"))
  })

  it("separates a role query from a job description with identical text", () => {
    expect(answerHash("m", "es", "role", "iOS Developer")).not.toBe(answerHash("m", "es", "jd", "iOS Developer"))
  })

  it("separates languages — the requirements are written in the CV's language", () => {
    expect(answerHash("m", "es", "jd", "x")).not.toBe(answerHash("m", "en", "jd", "x"))
  })
})

describe("readAnswer / writeAnswer fail open", () => {
  it("returns the stored payload", async () => {
    findUnique.mockResolvedValue({ payload: { hardSkills: ["Swift"] } } as never)
    expect(await readAnswer("job-keywords", "h")).toEqual({ hardSkills: ["Swift"] })
  })

  it("returns null when there is nothing stored", async () => {
    expect(await readAnswer("analysis", "h")).toBeNull()
  })

  // A broken cache must cost a model call, never a request.
  it("returns null instead of throwing when the read fails", async () => {
    findUnique.mockRejectedValue(new Error("db down"))
    expect(await readAnswer("analysis", "h")).toBeNull()
  })

  it("does not throw when the write fails or collides", async () => {
    create.mockRejectedValue(new Error("unique constraint"))
    await expect(writeAnswer("analysis", "h", { a: 1 }, "m")).resolves.toBeUndefined()
  })

  it("stores under the kind it was given, so two questions never share an answer", async () => {
    await writeAnswer("soft-evidence", "h", ["x"], "m")
    expect(create.mock.calls[0]?.[0]?.data.kind).toBe("soft-evidence")
  })
})

/**
 * Cache poisoning. `cachedKeywords` is client-supplied and is reused for the
 * request that sent it — that is how the posting side stays pinned in a session.
 * Persisting it under a hash of the POSTING TEXT would be different: the next
 * person who pastes the same posting gets scored against a list a stranger wrote.
 * The rule is that only a server-produced extraction becomes the shared answer.
 */
describe("only our own answers become shared answers", () => {
  it("a shared key is derived from the posting, so two users collide by design", () => {
    const a = answerHash("m", "es", "jd", "Senior iOS Developer, Swift, 5 years")
    const b = answerHash("m", "es", "jd", "Senior iOS Developer, Swift, 5 years")
    // Collision is the FEATURE (one answer serves both) and exactly why the
    // payload must never be attacker-controlled.
    expect(a).toBe(b)
  })
})
