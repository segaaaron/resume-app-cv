import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: { skillEquivalence: { findMany: vi.fn(), createMany: vi.fn() } },
}))
vi.mock("@/lib/ai-client", () => ({ AI_MODEL_PROSE: "test-model" }))

import { confirmEquivalences, pairKey } from "@/lib/services/ai/shared/skill-equivalence"
import { findSemanticCandidates, SEMANTIC_PREFILTER_THRESHOLD } from "@/lib/services/ai/shared/semantic-match"
import { db } from "@/lib/db"

const findMany = vi.mocked(db.skillEquivalence.findMany)
const createMany = vi.mocked(db.skillEquivalence.createMany)

/** A chat client that answers with the given verdicts, and records what it was asked. */
function judgeReturning(verdicts: ("same" | "different")[]) {
  const chat = vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify(verdicts.map((v, i) => ({ i, v }))) } }],
  })
  return { chat }
}

beforeEach(() => {
  vi.clearAllMocks()
  findMany.mockResolvedValue([])
  createMany.mockResolvedValue({ count: 0 })
})

describe("pairKey", () => {
  it("puts a pair in one stable order, so (a,b) and (b,a) are one question", () => {
    expect(pairKey("Patient Care", "atención al paciente")).toEqual(pairKey("Atención al paciente", "patient care"))
  })
})

describe("confirmEquivalences — the judge decides, not the cosine", () => {
  it("credits a keyword the judge confirms", async () => {
    const aiClient = judgeReturning(["same"])
    const confirmed = await confirmEquivalences(
      [{ keyword: "wound care", cvTerm: "curación de heridas", similarity: 0.578 }],
      { aiClient },
    )
    expect(confirmed.has("wound care")).toBe(true)
  })

  // The regression this whole layer exists for. Before it, cosine alone decided,
  // and "frontend"/"backend" sit at 0.684 — above every threshold that still
  // catches real translations. The CV said frontend; the JD asked for backend.
  it("does NOT credit a topically-close but different skill (frontend ≠ backend)", async () => {
    const aiClient = judgeReturning(["different"])
    const confirmed = await confirmEquivalences(
      [{ keyword: "backend", cvTerm: "frontend", similarity: 0.684 }],
      { aiClient },
    )
    expect(confirmed.size).toBe(0)
  })

  it("stores the verdict — including 'different', so the pair is never paid for twice", async () => {
    const aiClient = judgeReturning(["same", "different"])
    await confirmEquivalences(
      [
        { keyword: "accounts receivable", cvTerm: "cuentas por cobrar", similarity: 0.516 },
        { keyword: "backend", cvTerm: "frontend", similarity: 0.684 },
      ],
      { aiClient },
    )
    const written = createMany.mock.calls[0]?.[0]?.data as { equivalent: boolean }[]
    expect(written).toHaveLength(2)
    expect(written.filter((w) => w.equivalent)).toHaveLength(1)
    expect(written.filter((w) => !w.equivalent)).toHaveLength(1)
  })

  // Determinism. A model asked the same pairs three times flipped one verdict;
  // that is a score moving while the CV stands still.
  it("answers from the table without asking the model again", async () => {
    findMany.mockResolvedValue([
      { termA: "atencion al paciente", termB: "patient care", equivalent: true },
    ] as never)
    const aiClient = judgeReturning([])
    const confirmed = await confirmEquivalences(
      [{ keyword: "patient care", cvTerm: "Atención al paciente", similarity: 0.55 }],
      { aiClient },
    )
    expect(confirmed.has("patient care")).toBe(true)
    expect(aiClient.chat).not.toHaveBeenCalled()
    expect(createMany).not.toHaveBeenCalled()
  })

  it("a stored 'different' also settles it — no call, no credit", async () => {
    findMany.mockResolvedValue([{ termA: "backend", termB: "frontend", equivalent: false }] as never)
    const aiClient = judgeReturning([])
    const confirmed = await confirmEquivalences(
      [{ keyword: "backend", cvTerm: "frontend", similarity: 0.684 }],
      { aiClient },
    )
    expect(confirmed.size).toBe(0)
    expect(aiClient.chat).not.toHaveBeenCalled()
  })

  it("asks about each distinct pair once, even when several requirements share a CV term", async () => {
    const aiClient = judgeReturning(["same"])
    await confirmEquivalences(
      [
        { keyword: "Patient care", cvTerm: "atención al paciente", similarity: 0.55 },
        { keyword: "patient care", cvTerm: "Atención al paciente", similarity: 0.55 },
      ],
      { aiClient },
    )
    const prompt = aiClient.chat.mock.calls[0][0].messages[0].content as string
    expect(prompt.match(/^\d+\. /gm)).toHaveLength(1)
  })

  it("credits a pair that is identical once normalized, for free", async () => {
    const aiClient = judgeReturning([])
    const confirmed = await confirmEquivalences(
      [{ keyword: "Gestión de Proyectos", cvTerm: "gestion de proyectos", similarity: 0.99 }],
      { aiClient },
    )
    expect(confirmed.has("gestion de proyectos")).toBe(true)
    expect(aiClient.chat).not.toHaveBeenCalled()
  })

  // Fail closed, every way it can fail: the exact-match score is the floor.
  it("credits nothing when the model call throws", async () => {
    const aiClient = { chat: vi.fn().mockRejectedValue(new Error("openai down")) }
    const onFailure = vi.fn()
    const confirmed = await confirmEquivalences(
      [{ keyword: "wound care", cvTerm: "curación de heridas", similarity: 0.578 }],
      { aiClient, onFailure },
    )
    expect(confirmed.size).toBe(0)
    expect(onFailure).toHaveBeenCalled()
  })

  it("credits nothing when the reply is not parseable JSON", async () => {
    const aiClient = { chat: vi.fn().mockResolvedValue({ choices: [{ message: { content: "sure thing!" } }] }) }
    const confirmed = await confirmEquivalences(
      [{ keyword: "wound care", cvTerm: "curación de heridas", similarity: 0.578 }],
      { aiClient },
    )
    expect(confirmed.size).toBe(0)
  })

  it("ignores verdicts pointing outside the asked range instead of crediting the wrong keyword", async () => {
    const aiClient = {
      chat: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '[{"i": 7, "v": "same"}]' } }],
      }),
    }
    const confirmed = await confirmEquivalences(
      [{ keyword: "wound care", cvTerm: "curación de heridas", similarity: 0.578 }],
      { aiClient },
    )
    expect(confirmed.size).toBe(0)
  })

  it("still answers when the table read fails — it only means re-asking", async () => {
    findMany.mockRejectedValue(new Error("db down"))
    const aiClient = judgeReturning(["same"])
    const onFailure = vi.fn()
    const confirmed = await confirmEquivalences(
      [{ keyword: "wound care", cvTerm: "curación de heridas", similarity: 0.578 }],
      { aiClient, onFailure },
    )
    expect(confirmed.has("wound care")).toBe(true)
    expect(onFailure).toHaveBeenCalled()
  })

  it("does nothing at all with no candidates", async () => {
    const aiClient = judgeReturning([])
    const confirmed = await confirmEquivalences([], { aiClient })
    expect(confirmed.size).toBe(0)
    expect(findMany).not.toHaveBeenCalled()
    expect(aiClient.chat).not.toHaveBeenCalled()
  })
})

describe("findSemanticCandidates — the pre-filter proposes pairs, it does not decide", () => {
  it("pairs each requirement with the CLOSEST CV term only", async () => {
    // vectors in input order: [missing..., cvTerms...]
    const embed = vi.fn().mockResolvedValue([
      [1, 0],       // missing "wound care"
      [0.9, 0.44],  // cv "curación de heridas"  → closer
      [0.5, 0.87],  // cv "cocina"               → farther
    ])
    const out = await findSemanticCandidates(["wound care"], ["curación de heridas", "cocina"], embed)
    expect(out).toHaveLength(1)
    expect(out[0].cvTerm).toBe("curación de heridas")
  })

  it("keeps pairs a 0.62 threshold would have thrown away — that is the recall it buys", async () => {
    // cosine ≈ 0.52: below the old verdict threshold, above the pre-filter.
    const embed = vi.fn().mockResolvedValue([[1, 0], [0.52, Math.sqrt(1 - 0.52 ** 2)]])
    const out = await findSemanticCandidates(["accounts receivable"], ["cuentas por cobrar"], embed)
    expect(out).toHaveLength(1)
    expect(out[0].similarity).toBeGreaterThan(SEMANTIC_PREFILTER_THRESHOLD)
    expect(out[0].similarity).toBeLessThan(0.62)
  })

  it("drops pairs below the pre-filter so they never cost a token", async () => {
    const embed = vi.fn().mockResolvedValue([[1, 0], [0, 1]])
    expect(await findSemanticCandidates(["Kubernetes"], ["Photoshop"], embed)).toHaveLength(0)
  })

  it("fails closed when embed throws", async () => {
    const embed = vi.fn().mockRejectedValue(new Error("embed down"))
    const onFailure = vi.fn()
    expect(await findSemanticCandidates(["a"], ["b"], embed, undefined, onFailure)).toHaveLength(0)
    expect(onFailure).toHaveBeenCalled()
  })
})
