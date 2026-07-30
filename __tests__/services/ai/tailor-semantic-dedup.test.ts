import { describe, it, expect, vi, beforeEach } from "vitest"

// Tailor must not re-surface a skill the ATS panel already listed for the same
// posting, even when the two spell it differently ("k8s" vs "kubernetes"). The
// exact vocabulary can't equate those; the embeddings pass can. ADD-only: it only
// ever REMOVES a duplicate and fails closed on any embed error.
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

function chatReturning(obj: unknown) {
  return vi.fn(async () => ({ choices: [{ message: { content: JSON.stringify(obj) } }], usage: { prompt_tokens: 5, completion_tokens: 5 } }))
}

// One-hot vectors so cosine is 1 for identical, 0 for different — deterministic.
function embedVec(text: string): number[] {
  const t = text.trim().toLowerCase()
  if (t === "k8s" || t === "kubernetes") return [1, 0, 0]
  if (t === "graphql") return [0, 1, 0]
  return [0, 0, 1]
}

const sectionData = {
  summary: "Backend engineer.",
  workExperience: [{ id: "w1", jobTitle: "Backend Dev", employer: "Acme", description: "• Built services." }],
  skills: [],
}

describe("tailor-cv — semantic dedup vs ATS keywords", () => {
  beforeEach(() => vi.clearAllMocks())

  it("drops a missingSkill semantically equal to an ATS keyword (k8s ≡ kubernetes)", async () => {
    const chat = chatReturning({ summary: null, experiences: [], missingSkills: ["k8s"] })
    const embed = vi.fn(async (texts: string[]) => texts.map(embedVec))
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    const res = await mod.tailorCV(
      "u1",
      { sectionData, jobDescription: "We need k8s experience on the backend.", language: "en", atsMissingKeywords: ["Kubernetes"] },
      "PRO",
    )
    expect(res.missingSkills).toEqual([])
    expect(embed).toHaveBeenCalledOnce()
  })

  it("keeps a missingSkill the ATS did NOT list (GraphQL vs kubernetes)", async () => {
    const chat = chatReturning({ summary: null, experiences: [], missingSkills: ["GraphQL"] })
    const embed = vi.fn(async (texts: string[]) => texts.map(embedVec))
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    const res = await mod.tailorCV(
      "u1",
      { sectionData, jobDescription: "We need graphql on the backend.", language: "en", atsMissingKeywords: ["Kubernetes"] },
      "PRO",
    )
    expect(res.missingSkills).toEqual(["GraphQL"])
  })

  it("fails closed: an embed error leaves the missingSkills list untouched", async () => {
    const chat = chatReturning({ summary: null, experiences: [], missingSkills: ["k8s"] })
    const embed = vi.fn(async () => { throw new Error("embed down") })
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    const res = await mod.tailorCV(
      "u1",
      { sectionData, jobDescription: "We need k8s experience.", language: "en", atsMissingKeywords: ["Kubernetes"] },
      "PRO",
    )
    expect(res.missingSkills).toEqual(["k8s"])
  })

  it("skips the embed call entirely when no ATS keywords are provided", async () => {
    const chat = chatReturning({ summary: null, experiences: [], missingSkills: ["k8s"] })
    const embed = vi.fn(async (texts: string[]) => texts.map(embedVec))
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    const res = await mod.tailorCV(
      "u1",
      { sectionData, jobDescription: "We need k8s experience.", language: "en" },
      "PRO",
    )
    expect(res.missingSkills).toEqual(["k8s"])
    expect(embed).not.toHaveBeenCalled()
  })
})
