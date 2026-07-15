import { describe, it, expect, vi, beforeEach } from "vitest"
import { AIService } from "@/lib/services/ai/AIService"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient, ChatCompletion } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

// ─── Mock ai-client.ts utilities ──────────────────────────────────────────────
vi.mock("@/lib/ai-client", () => ({
  AI_MODEL: "gpt-4o-mini",
  AI_TEMPERATURE: 0.4,
  AI_TEMPERATURE_CREATIVE: 0.7,
  AI_TEMPERATURE_BALANCED: 0.5,
  AI_TEMPERATURE_PRECISE: 0.1,
  AI_TEMPERATURE_STRUCTURED: 0.3,
  AI_TEMPERATURE_GENERATIVE: 0.6,
  checkRateLimit: vi.fn().mockResolvedValue(true),
  checkAndIncrementRateLimit: vi.fn().mockResolvedValue(true),
  checkAndIncrementAIQuota: vi.fn().mockResolvedValue({ allowed: true }),
  recordRateLimitUsage: vi.fn(),
  logAIUsage: vi.fn(),
  buildResumeContext: vi.fn().mockReturnValue("Nombre: Juan Garcia\nPuesto objetivo: Developer"),
}))

// ─── Mock db (used by generateCoverLetter) ────────────────────────────────────
vi.mock("@/lib/db", () => ({
  db: {
    resume: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}))

// ─── Mock ai-safety ───────────────────────────────────────────────────────────
vi.mock("@/lib/ai-safety", () => ({
  validateAIInput: vi.fn().mockReturnValue({ valid: true }),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCompletion(content: string): ChatCompletion {
  return {
    id: "test-id",
    object: "chat.completion",
    created: Date.now(),
    model: "gpt-4o-mini",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content, refusal: null },
        finish_reason: "stop",
        logprobs: null,
      },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  } as ChatCompletion
}

function makeMockAIClient(content: string): IAIClient {
  return { chat: vi.fn().mockResolvedValue(makeCompletion(content)) }
}

function makeMockLogger(): ILogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AIService", () => {
  let logger: ILogger

  beforeEach(async () => {
    logger = makeMockLogger()
    vi.clearAllMocks()
    const { checkAndIncrementAIQuota } = vi.mocked(await import("@/lib/ai-client"))
    checkAndIncrementAIQuota.mockResolvedValue({ allowed: true })
  })

  // ── improveBullet ──────────────────────────────────────────────────────────

  describe("improveBullet", () => {
    it("returns bullets on happy path", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({ bullets: ["• bullet1", "• bullet2", "• bullet3"] }))
      const service = new AIService(aiClient, logger)

      const result = await service.improveBullet("user-1", { text: "Managed a team and delivered projects on time" }, "PRO")

      expect(result.bullets).toEqual(["• bullet1", "• bullet2", "• bullet3"])
      expect(aiClient.chat).toHaveBeenCalledOnce()
    })

    it("returns already_optimized when the AI echoes every original bullet unchanged", async () => {
      const original = "• Led a team of 5 engineers\n• Reduced costs by [X%]"
      const aiClient = makeMockAIClient(JSON.stringify({
        bullets: ["• Led a team of 5 engineers", "• Reduced costs by [X%]."],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.improveBullet("user-1", { text: original }, "PRO")

      expect(result.status).toBe("already_optimized")
      expect(result.bullets).toEqual([])
    })

    it("returns already_optimized when the only change is an injected placeholder/number", async () => {
      // Reported bug: suggestions look near-identical to the original, differing
      // only by an inserted [X%] placeholder or a changed figure. That is not a
      // real rewrite → must report already_optimized instead of a no-op modal.
      const original = "• Managed the support queue\n• Trained new hires"
      const aiClient = makeMockAIClient(JSON.stringify({
        bullets: ["• Managed the support queue [X%]", "• Trained new hires [X%]"],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.improveBullet("user-1", { text: original }, "PRO")

      expect(result.status).toBe("already_optimized")
      expect(result.bullets).toEqual([])
    })

    it("PRO over daily cap → throws 429 daily_cap_reached with ai-daily key", async () => {
      const { checkAndIncrementRateLimit } = vi.mocked(await import("@/lib/ai-client"))
      checkAndIncrementRateLimit.mockResolvedValueOnce(false)
      const aiClient = makeMockAIClient(JSON.stringify({ bullets: ["• x"] }))
      const service = new AIService(aiClient, logger)

      await expect(
        service.improveBullet("user-1", { text: "Managed a team and delivered projects" }, "PRO")
      ).rejects.toMatchObject({ code: "daily_cap_reached", status: 429 })
      expect(checkAndIncrementRateLimit).toHaveBeenCalledWith("user-1", "ai-daily:improve-bullet", 30, 86_400_000)
      expect(aiClient.chat).not.toHaveBeenCalled()
    })

    it("slices to 15 bullets maximum", async () => {
      const sixteenBullets = Array.from({ length: 16 }, (_, i) => `• Bullet ${i + 1}`)
      const aiClient = makeMockAIClient(JSON.stringify({ bullets: sixteenBullets }))
      const service = new AIService(aiClient, logger)

      const result = await service.improveBullet("user-1", { text: "Rich description with many responsibilities" }, "PRO")

      expect(result.bullets).toHaveLength(15)
    })

    it("throws AppError 429 free_quota_exhausted when AI quota exhausted", async () => {
      const { checkAndIncrementAIQuota } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementAIQuota).mockResolvedValueOnce({ allowed: false, reason: "exhausted", used: 2, limit: 2 })

      const aiClient = makeMockAIClient("{}")
      const service = new AIService(aiClient, logger)

      await expect(
        service.improveBullet("user-1", { text: "Managed a team" }, "UNSUBSCRIBED")
      ).rejects.toMatchObject({ code: "free_quota_exhausted", status: 429 })
    })

    it("throws AppError 422 when AI returns off-topic empty bullets", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({ bullets: [] }))
      const service = new AIService(aiClient, logger)

      await expect(
        service.improveBullet("user-1", { text: "tell me a joke" }, "PRO")
      ).rejects.toMatchObject({ code: "off_topic", status: 422 })
    })
  })

  // ── atsScore ───────────────────────────────────────────────────────────────

  describe("atsScore", () => {
    // The service now extracts JD requirements via the LLM, then scores
    // DETERMINISTICALLY in code. buildResumeContext is mocked to
    // "Nombre: Juan Garcia\nPuesto objetivo: Developer", so "Developer" is
    // present in the CV text and "Kubernetes" is not.
    const validExtraction = {
      hardSkills: ["Developer", "Kubernetes"],
      softSkills: [],
      jobTitle: "Developer",
      seniority: "",
      mustHaves: [],
      summary: "Solid fit for the role.",
      suggestions: ["Add Kubernetes to your Skills section if you have used it"],
    }

    const richSectionData = {
      personalDetails: { jobTitle: "Developer" },
      summary: "Experienced developer",
      workExperience: [{ jobTitle: "Developer" }],
      skills: [{ name: "Developer" }],
      education: [{ degree: "BS" }],
    }

    it("computes a deterministic score and verified keyword sets on happy path", async () => {
      const aiClient = makeMockAIClient(JSON.stringify(validExtraction))
      const service = new AIService(aiClient, logger)

      const result = await service.atsScore("user-1", {
        jobDescription: "We need a Developer with Kubernetes experience for our team.",
        sectionData: richSectionData,
      }, "PRO")

      expect(typeof result.score).toBe("number")
      expect(result.score).toBeGreaterThan(0)
      // "Developer" is in the CV, "Kubernetes" is not → verified set-diff.
      expect(result.matchedKeywords).toContain("Developer")
      expect(result.missingKeywords).toContain("Kubernetes")
      expect(result.missingKeywords).not.toContain("Developer")
      // hard-skill coverage = 1 of 2 matched.
      expect(result.subScores.hardSkills).toBe(50)
      expect(result.label).toBeTruthy()
    })

    it("is reproducible — identical inputs yield an identical score", async () => {
      const service1 = new AIService(makeMockAIClient(JSON.stringify(validExtraction)), logger)
      const service2 = new AIService(makeMockAIClient(JSON.stringify(validExtraction)), logger)
      const input = { jobDescription: "Developer with Kubernetes.", sectionData: richSectionData }

      const a = await service1.atsScore("user-1", input, "PRO")
      const b = await service2.atsScore("user-1", input, "PRO")

      expect(a.score).toBe(b.score)
      expect(a.missingKeywords).toEqual(b.missingKeywords)
    })

    it("truncates (does NOT 500) when the model returns more skills than the cap", async () => {
      // Regression guard: an over-eager extraction must never fail validation.
      const many = Array.from({ length: 18 }, (_, i) => `Skill${i + 1}`)
      const aiClient = makeMockAIClient(JSON.stringify({
        ...validExtraction,
        hardSkills: many,
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.atsScore("user-1", {
        jobDescription: "A job needing many skills.",
        sectionData: richSectionData,
      }, "PRO")

      expect(typeof result.score).toBe("number")
      // Processed set is capped at 12 hard skills → matched + missing ≤ 12.
      expect(result.matchedKeywords.length + result.missingKeywords.length).toBeLessThanOrEqual(12)
    })

    it("throws AppError 403 feature_pro_only when endpoint blocked for plan", async () => {
      const { checkAndIncrementAIQuota } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementAIQuota).mockResolvedValueOnce({ allowed: false, reason: "blocked" })

      const aiClient = makeMockAIClient("{}")
      const service = new AIService(aiClient, logger)

      await expect(
        service.atsScore("user-1", { jobDescription: "React developer needed for our team." }, "UNSUBSCRIBED")
      ).rejects.toMatchObject({ code: "feature_pro_only", status: 403 })
    })

    it("throws AppError 422 when the model flags off_topic", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        hardSkills: [], softSkills: [], jobTitle: "", seniority: "", mustHaves: [],
        summary: "", suggestions: [], label: "off_topic",
      }))
      const service = new AIService(aiClient, logger)

      await expect(
        service.atsScore("user-1", { jobDescription: "What is the capital of France?", sectionData: richSectionData }, "PRO")
      ).rejects.toMatchObject({ code: "off_topic", status: 422 })
    })

    it("throws AppError 422 when the model extracts no usable requirements", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        hardSkills: [], softSkills: [], jobTitle: "", seniority: "", mustHaves: [], summary: "", suggestions: [],
      }))
      const service = new AIService(aiClient, logger)

      await expect(
        service.atsScore("user-1", { jobDescription: "lorem ipsum dolor sit amet", sectionData: richSectionData }, "PRO")
      ).rejects.toMatchObject({ code: "off_topic", status: 422 })
    })

    it("truncates jobDescription to 6000 chars before sending to AI", async () => {
      const aiClient = makeMockAIClient(JSON.stringify(validExtraction))
      const service = new AIService(aiClient, logger)

      // Use a unique suffix marker past 6000 chars to verify truncation
      const base = "x".repeat(6000)
      const suffix = "UNIQUE_OVERFLOW_MARKER_SHOULD_NOT_APPEAR"
      const longDescription = base + suffix

      await service.atsScore("user-1", { jobDescription: longDescription, sectionData: richSectionData }, "PRO")

      const calledWith = (aiClient.chat as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const userMessage = calledWith.messages.find((m: { role: string }) => m.role === "user")
      expect(userMessage.content).not.toContain(suffix)
    })
  })

  // ── generateCoverLetter ────────────────────────────────────────────────────

  describe("generateCoverLetter", () => {
    it("returns HTML body on happy path", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({ body: "First paragraph.\n\nSecond paragraph." }))
      const service = new AIService(aiClient, logger)

      const result = await service.generateCoverLetter("user-1", {
        company: "Acme Corp",
        jobTitle: "Software Engineer",
        language: "en",
      }, "PRO")

      expect(result.body).toContain("<p>")
      expect(result.body).toContain("First paragraph")
    })

    it("throws AppError 422 when AI returns empty body (off-topic)", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({ body: "" }))
      const service = new AIService(aiClient, logger)

      await expect(
        service.generateCoverLetter("user-1", { company: "Acme", jobTitle: "Engineer" }, "PRO")
      ).rejects.toMatchObject({ code: "off_topic", status: 422 })
    })

    it("throws AppError 429 free_quota_exhausted when AI quota exhausted", async () => {
      const { checkAndIncrementAIQuota } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementAIQuota).mockResolvedValueOnce({ allowed: false, reason: "exhausted", used: 2, limit: 2 })

      const aiClient = makeMockAIClient("{}")
      const service = new AIService(aiClient, logger)

      await expect(
        service.generateCoverLetter("user-1", { company: "Acme", jobTitle: "Engineer" }, "UNSUBSCRIBED")
      ).rejects.toMatchObject({ code: "free_quota_exhausted", status: 429 })
    })
  })

  // ── fillProfile ────────────────────────────────────────────────────────────

  describe("fillProfile", () => {
    it("returns filled profile data on happy path", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        summary: "Experienced developer",
        jobTitle: "Senior Engineer",
        suggestedSkills: ["TypeScript", "React"],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "I am a senior engineer with 5 years experience in React and TypeScript",
        sectionData: {},
      }, "PRO")

      expect(result.summary).toBe("Experienced developer")
      expect(result.jobTitle).toBe("Senior Engineer")
    })

    it("throws AppError 422 when AI returns empty object (off-topic)", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({}))
      const service = new AIService(aiClient, logger)

      await expect(
        service.fillProfile("user-1", { prompt: "tell me a funny joke please" }, "PRO")
      ).rejects.toMatchObject({ code: "off_topic", status: 422 })
    })

    it("throws AppError 429 free_quota_exhausted when AI quota exhausted", async () => {
      const { checkAndIncrementAIQuota } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementAIQuota).mockResolvedValueOnce({ allowed: false, reason: "exhausted", used: 1, limit: 1 })

      const aiClient = makeMockAIClient("{}")
      const service = new AIService(aiClient, logger)

      await expect(
        service.fillProfile("user-1", { prompt: "I am a software engineer with React skills" }, "UNSUBSCRIBED")
      ).rejects.toMatchObject({ code: "free_quota_exhausted", status: 429 })
    })

    it("filters out skills that match employer names from blocklist", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        summary: "Developer",
        suggestedSkills: ["TypeScript", "Google", "React"],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "I worked at Google as a software engineer using React and TypeScript for frontend development",
        sectionData: {
          workExperience: [{ id: "we-1", employer: "Google", jobTitle: "SWE" }],
        },
      }, "PRO")

      expect(result.suggestedSkills).not.toContain("Google")
      expect(result.suggestedSkills).toContain("TypeScript")
      expect(result.suggestedSkills).toContain("React")
    })
  })

  // ── generateSummary ────────────────────────────────────────────────────────

  describe("AIService.generateSummary", () => {
    it("quota exhausted → throws AppError free_quota_exhausted 429", async () => {
      const { checkAndIncrementAIQuota } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementAIQuota).mockResolvedValue({ allowed: false, reason: "exhausted", used: 2, limit: 2 })
      const aiClient = makeMockAIClient("{}")
      const service = new AIService(aiClient, logger)
      await expect(service.generateSummary("u1", {}, "UNSUBSCRIBED")).rejects.toMatchObject({ code: "free_quota_exhausted", status: 429 })
    })

    it("happy path → returns versions array", async () => {
      const { checkAndIncrementAIQuota } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementAIQuota).mockResolvedValue({ allowed: true })
      const aiClient = makeMockAIClient(JSON.stringify({ versions: ["v1", "v2"] }))
      const service = new AIService(aiClient, logger)
      const result = await service.generateSummary("u1", {}, "PRO")
      expect(result.versions).toHaveLength(2)
    })
  })

  // ── reviewCV ───────────────────────────────────────────────────────────────

  describe("AIService.reviewCV", () => {
    it("off-topic response → throws AppError off_topic", async () => {
      const { checkAndIncrementAIQuota } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementAIQuota).mockResolvedValue({ allowed: true })
      const aiClient = makeMockAIClient(JSON.stringify({ summary: "", strengths: [], improvements: [], answer: "off_topic" }))
      const service = new AIService(aiClient, logger)
      await expect(service.reviewCV("u1", { sectionData: {}, question: "test" }, "PRO")).rejects.toMatchObject({ code: "off_topic" })
    })
  })

  // ── suggestSkills ──────────────────────────────────────────────────────────

  describe("AIService.suggestSkills", () => {
    it("happy path → returns skills array", async () => {
      const { checkAndIncrementAIQuota } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementAIQuota).mockResolvedValue({ allowed: true })
      const aiClient = makeMockAIClient(JSON.stringify({ skills: [{ name: "TypeScript", level: "Advanced" }] }))
      const service = new AIService(aiClient, logger)
      const result = await service.suggestSkills("u1", { jobTitle: "Engineer" }, "PRO")
      expect(result.skills[0].name).toBe("TypeScript")
    })
  })

  // ── JSON parse failure ─────────────────────────────────────────────────────

  describe("AIService JSON parse failure", () => {
    it("malformed OpenAI response → throws AppError parse_error 500", async () => {
      const { checkAndIncrementAIQuota } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementAIQuota).mockResolvedValue({ allowed: true })
      const aiClient = makeMockAIClient("not json {{")
      const service = new AIService(aiClient, logger)
      await expect(service.improveBullet("u1", { text: "Did things" }, "PRO")).rejects.toMatchObject({ code: "parse_error", status: 500 })
    })
  })
})
