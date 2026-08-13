import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: { aiAnswerCache: { findUnique: vi.fn(), create: vi.fn() } },
}))
vi.mock("@/lib/ai-client", () => ({ AI_MODEL_PROSE: "test-model" }))

import { findDemonstratedSoftSkills } from "@/lib/services/ai/shared/soft-skill-evidence"
import { computeATSMatch } from "@/lib/services/ai/shared/ats-matcher"
import { db } from "@/lib/db"

const findUnique = vi.mocked(db.aiAnswerCache.findUnique)
const create = vi.mocked(db.aiAnswerCache.create)

function judge(rows: { s: number; b: number | null; q?: string }[]) {
  return { chat: vi.fn().mockResolvedValue({ choices: [{ message: { content: JSON.stringify(rows) } }] }) }
}

// Quotes that really appear in the bullets below — the module checks them.
const Q0 = "the spec was still changing"
const Q1 = "Paired with designers and backend engineers"

const SOFT = ["Comfortable working with ambiguity", "Collaboration with cross-functional teams"]
const BULLETS = [
  "Shipped the payments rewrite while the spec was still changing, agreeing scope weekly with product",
  "Paired with designers and backend engineers to land the checkout redesign",
]

beforeEach(() => {
  vi.clearAllMocks()
  findUnique.mockResolvedValue(null)
  create.mockResolvedValue({} as never)
})

// The bug this whole module exists for. Kept as a test so nobody "simplifies"
// the soft lever back into the string matcher.
describe("the soft-skills sub-score was structurally stuck at 0", () => {
  it("literal matching can never credit a soft requirement written as a sentence", () => {
    const match = computeATSMatch(
      { hardSkills: [], softSkills: SOFT, jobTitle: "", mustHaves: [] },
      BULLETS.join(" ").toLowerCase(), // the whole CV as haystack
      "",
      { summary: true, work: true, education: true, skills: true },
      BULLETS.join(" ").toLowerCase(),
    )
    // Both bullets clearly show both behaviours. The string matcher sees neither.
    expect(match.subScores.softSkills).toBe(0)
    expect(match.missingSoftSkills).toHaveLength(2)
  })

  it("credits them once a bullet is judged to demonstrate them", () => {
    const match = computeATSMatch(
      { hardSkills: [], softSkills: SOFT, jobTitle: "", mustHaves: [] },
      BULLETS.join(" ").toLowerCase(),
      "",
      { summary: true, work: true, education: true, skills: true },
      BULLETS.join(" ").toLowerCase(),
      undefined,
      undefined,
      new Set(["comfortable working with ambiguity", "collaboration with cross-functional teams"]),
    )
    expect(match.subScores.softSkills).toBe(100)
    expect(match.missingSoftSkills).toHaveLength(0)
  })

  it("a demonstrated soft skill counts as DEMONSTRATED, not as a listed claim", () => {
    const match = computeATSMatch(
      { hardSkills: [], softSkills: [SOFT[0]], jobTitle: "", mustHaves: [] },
      "",
      "",
      { summary: true, work: true, education: true, skills: true },
      "",
      undefined,
      undefined,
      new Set(["comfortable working with ambiguity"]),
    )
    expect(match.demonstratedKeywords).toContain(SOFT[0])
    expect(match.listedOnlyKeywords).not.toContain(SOFT[0])
  })

  it("credits nothing extra when there is no evidence — the old score is the floor", () => {
    const match = computeATSMatch(
      { hardSkills: [], softSkills: SOFT, jobTitle: "", mustHaves: [] },
      "",
      "",
      { summary: true, work: true, education: true, skills: true },
      "",
      undefined,
      undefined,
      new Set(),
    )
    expect(match.subScores.softSkills).toBe(0)
  })
})

describe("findDemonstratedSoftSkills", () => {
  it("returns the skills a bullet was judged to show", async () => {
    const aiClient = judge([{ s: 0, b: 0, q: Q0 }, { s: 1, b: 1, q: Q1 }])
    const out = await findDemonstratedSoftSkills(SOFT, BULLETS, { aiClient })
    expect(out.has("comfortable working with ambiguity")).toBe(true)
    expect(out.has("collaboration with cross-functional teams")).toBe(true)
  })

  it("does not credit a skill the judge pointed at no bullet for", async () => {
    const aiClient = judge([{ s: 0, b: null }, { s: 1, b: 1, q: Q1 }])
    const out = await findDemonstratedSoftSkills(SOFT, BULLETS, { aiClient })
    expect(out.has("comfortable working with ambiguity")).toBe(false)
    expect(out.size).toBe(1)
  })

  // The one failure mode that would credit a skill on nothing at all.
  it("rejects a verdict pointing at a bullet that was never sent", async () => {
    const aiClient = judge([{ s: 0, b: 99, q: Q0 }])
    const out = await findDemonstratedSoftSkills(SOFT, BULLETS, { aiClient })
    expect(out.size).toBe(0)
  })

  it("answers from the table without asking again — same CV, same score", async () => {
    findUnique.mockResolvedValue({ payload: ["collaboration with cross-functional teams"] } as never)
    const aiClient = judge([])
    const out = await findDemonstratedSoftSkills(SOFT, BULLETS, { aiClient })
    expect(out.has("collaboration with cross-functional teams")).toBe(true)
    expect(aiClient.chat).not.toHaveBeenCalled()
  })

  it("stores 'nothing demonstrated' too, so it is not re-asked every analysis", async () => {
    const aiClient = judge([{ s: 0, b: null }, { s: 1, b: null }])
    await findDemonstratedSoftSkills(SOFT, BULLETS, { aiClient })
    expect(create).toHaveBeenCalled()
    expect(create.mock.calls[0]?.[0]?.data.payload).toEqual([])
  })

  // Measured against the real API: with no quote requirement the judge credited
  // SEVEN of seven soft requirements for one CV — the 0% bug inverted. A lever
  // that always reads full is as useless as one that always reads empty.
  it("refuses a credit whose quote is not in the cited bullet", async () => {
    const aiClient = judge([{ s: 0, b: 0, q: "led the company through a reorg" }])
    expect((await findDemonstratedSoftSkills(SOFT, BULLETS, { aiClient })).size).toBe(0)
  })

  it("refuses a quote too short to be evidence", async () => {
    const aiClient = judge([{ s: 0, b: 0, q: "the spec" }])
    expect((await findDemonstratedSoftSkills(SOFT, BULLETS, { aiClient })).size).toBe(0)
  })

  it("refuses a credit with no quote at all", async () => {
    const aiClient = judge([{ s: 0, b: 0 }])
    expect((await findDemonstratedSoftSkills(SOFT, BULLETS, { aiClient })).size).toBe(0)
  })

  it("fails closed when the model call throws", async () => {
    const aiClient = { chat: vi.fn().mockRejectedValue(new Error("openai down")) }
    const onFailure = vi.fn()
    const out = await findDemonstratedSoftSkills(SOFT, BULLETS, { aiClient, onFailure })
    expect(out.size).toBe(0)
    expect(onFailure).toHaveBeenCalled()
  })

  it("fails closed on an unparseable reply", async () => {
    const aiClient = { chat: vi.fn().mockResolvedValue({ choices: [{ message: { content: "no idea" } }] }) }
    expect((await findDemonstratedSoftSkills(SOFT, BULLETS, { aiClient })).size).toBe(0)
  })

  it("does not call the model when there is nothing to judge", async () => {
    const aiClient = judge([])
    expect((await findDemonstratedSoftSkills([], BULLETS, { aiClient })).size).toBe(0)
    expect((await findDemonstratedSoftSkills(SOFT, [], { aiClient })).size).toBe(0)
    expect(aiClient.chat).not.toHaveBeenCalled()
  })
})
