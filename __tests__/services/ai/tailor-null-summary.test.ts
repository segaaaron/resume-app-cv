import { describe, it, expect, vi, beforeEach } from "vitest"

// Regression guards for the "tailor errored / showed null" report:
//  1. A model that emits the literal string "null" (instead of JSON null) for the
//     summary must be normalised to a real null — else the panel renders "null" and
//     the apply guard writes "null" into the user's résumé.
//  2. A real CV the model left untouched must return a valid "nothing to improve"
//     result, never a 422 off_topic (that spurious error is what broke the first run).
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/ai-client", () => ({
  AI_MODEL: "gpt-x",
  AI_TEMPERATURE_STRUCTURED: 0.3,
  buildResumeContext: () => "",
  logAIUsage: vi.fn(),
}))
vi.mock("@/lib/ai-safety", () => ({ validateAIInput: () => ({ valid: true }) }))

import { AITailorModule } from "@/lib/services/ai/modules/AITailorModule"

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
const chatReturning = (obj: unknown) =>
  vi.fn(async () => ({ choices: [{ message: { content: JSON.stringify(obj) } }], usage: { prompt_tokens: 5, completion_tokens: 5 } }))
const embed = vi.fn(async (texts: string[]) => texts.map(() => [1, 0, 0]))

const realCv = {
  summary: "Backend engineer.",
  workExperience: [{ id: "w1", jobTitle: "Backend Dev", employer: "Acme", description: "• Built services." }],
  skills: [],
}
const jd = "We need a backend engineer with strong services experience."

describe("tailor-cv — null summary + no spurious off_topic", () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(["null", "None", "n/a", "  ", "undefined"])("normalises literal summary '%s' → null", async (bad) => {
    const chat = chatReturning({ summary: bad, experiences: [{ targetId: "w1", changedBullets: [] }], missingSkills: [] })
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    const res = await mod.tailorCV("u1", { sectionData: realCv, jobDescription: jd, language: "en", atsMissingKeywords: [] }, "PRO")
    expect(res.summary).toBeNull()
  })

  it("a real CV the model left untouched returns 'nothing to improve', not a 422", async () => {
    const chat = chatReturning({ summary: null, experiences: [], missingSkills: [] })
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    const res = await mod.tailorCV("u1", { sectionData: realCv, jobDescription: jd, language: "en", atsMissingKeywords: [] }, "PRO")
    expect(res.summary).toBeNull()
    expect(res.experiences).toEqual([])
    expect(res.missingSkills).toEqual([])
  })

  it("only a CV with NO experience + empty model output is off_topic", async () => {
    const chat = chatReturning({ summary: null, experiences: [], missingSkills: [] })
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    await expect(
      mod.tailorCV("u1", { sectionData: { summary: "", workExperience: [], skills: [] }, jobDescription: jd, language: "en", atsMissingKeywords: [] }, "PRO"),
    ).rejects.toMatchObject({ code: "off_topic" })
  })

  it("soft-skill suggestions: keeps well-formed pairs, drops malformed, caps at 4", async () => {
    const chat = chatReturning({
      summary: null,
      experiences: [{ targetId: "w1", changedBullets: [] }],
      missingSkills: [],
      softSkillSuggestions: [
        { skill: "teamwork", suggestion: "Name a project where you coordinated with other teams." },
        { skill: "leadership", suggestion: "Mention mentoring or owning a workstream." },
        { skill: "", suggestion: "no skill — dropped" },
        { skill: "communication", suggestion: "short" }, // suggestion < 8 chars → dropped
        { skill: "adaptability", suggestion: "Show you shipped across changing requirements." },
        { skill: "ownership", suggestion: "Point to something you drove end to end." },
        { skill: "problem-solving", suggestion: "Describe a hard bug or blocker you resolved." }, // 5th valid → capped out
      ],
    })
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    const res = await mod.tailorCV("u1", { sectionData: realCv, jobDescription: jd, language: "en", atsMissingKeywords: [] }, "PRO")
    expect(res.softSkillSuggestions).toHaveLength(4)
    expect(res.softSkillSuggestions!.map((s) => s.skill)).toEqual(["teamwork", "leadership", "adaptability", "ownership"])
  })

  it("soft-skill suggestions default to [] when the model omits them", async () => {
    const chat = chatReturning({ summary: null, experiences: [{ targetId: "w1", changedBullets: [] }], missingSkills: [] })
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    const res = await mod.tailorCV("u1", { sectionData: realCv, jobDescription: jd, language: "en", atsMissingKeywords: [] }, "PRO")
    expect(res.softSkillSuggestions).toEqual([])
  })

  // Sequential chat mock: nth call returns the nth content string (last repeats).
  const chatSeq = (...contents: string[]) => {
    let i = 0
    return vi.fn(async () => ({ choices: [{ message: { content: contents[Math.min(i++, contents.length - 1)] } }], usage: { prompt_tokens: 5, completion_tokens: 5 } }))
  }

  it("truncated JSON on the first call retries once and succeeds — no 500 (the reported tailor error)", async () => {
    const truncated = '{"summary": null, "experiences": [{"targetId": "w1", "changedBul' // cut off mid-object
    const good = JSON.stringify({ summary: null, experiences: [{ targetId: "w1", changedBullets: [] }], missingSkills: [] })
    const chat = chatSeq(truncated, good)
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    const res = await mod.tailorCV("u1", { sectionData: realCv, jobDescription: jd, language: "en", atsMissingKeywords: [] }, "PRO")
    expect(res.summary).toBeNull()
    expect(chat).toHaveBeenCalledTimes(2)
  })

  it("unparseable JSON twice → clean invalid_response_format, never an unguarded crash", async () => {
    const chat = chatSeq("this is not json at all", "still not json")
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    await expect(
      mod.tailorCV("u1", { sectionData: realCv, jobDescription: jd, language: "en", atsMissingKeywords: [] }, "PRO"),
    ).rejects.toMatchObject({ code: "invalid_response_format" })
  })
})
