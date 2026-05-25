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
  checkRateLimit: vi.fn().mockResolvedValue(true),
  checkAndIncrementRateLimit: vi.fn().mockResolvedValue(true),
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
    const { checkAndIncrementRateLimit } = vi.mocked(await import("@/lib/ai-client"))
    checkAndIncrementRateLimit.mockResolvedValue(true)
  })

  // ── improveBullet ──────────────────────────────────────────────────────────

  describe("improveBullet", () => {
    it("returns bullets on happy path", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({ bullets: ["• bullet1", "• bullet2", "• bullet3"] }))
      const service = new AIService(aiClient, logger)

      const result = await service.improveBullet("user-1", { text: "Managed a team and delivered projects on time" })

      expect(result.bullets).toEqual(["• bullet1", "• bullet2", "• bullet3"])
      expect(aiClient.chat).toHaveBeenCalledOnce()
    })

    it("slices to 10 bullets maximum", async () => {
      const elevenBullets = Array.from({ length: 11 }, (_, i) => `• Bullet ${i + 1}`)
      const aiClient = makeMockAIClient(JSON.stringify({ bullets: elevenBullets }))
      const service = new AIService(aiClient, logger)

      const result = await service.improveBullet("user-1", { text: "Rich description with many responsibilities" })

      expect(result.bullets).toHaveLength(10)
    })

    it("throws AppError 429 when rate limited", async () => {
      const { checkAndIncrementRateLimit } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementRateLimit).mockResolvedValueOnce(false)

      const aiClient = makeMockAIClient("{}")
      const service = new AIService(aiClient, logger)

      await expect(
        service.improveBullet("user-1", { text: "Managed a team" })
      ).rejects.toMatchObject({ code: "rate_limit_exceeded", status: 429 })
    })

    it("throws AppError 422 when AI returns off-topic empty bullets", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({ bullets: [] }))
      const service = new AIService(aiClient, logger)

      await expect(
        service.improveBullet("user-1", { text: "tell me a joke" })
      ).rejects.toMatchObject({ code: "off_topic", status: 422 })
    })
  })

  // ── atsScore ───────────────────────────────────────────────────────────────

  describe("atsScore", () => {
    const validATSResponse = {
      score: 82,
      label: "Excelente",
      summary: "Excellent match.",
      strengths: ["React experience"],
      gaps: ["Missing Docker"],
      missingKeywords: ["Docker"],
      suggestions: ["Add Docker to skills"],
    }

    it("returns parsed ATS score on happy path", async () => {
      const aiClient = makeMockAIClient(JSON.stringify(validATSResponse))
      const service = new AIService(aiClient, logger)

      const result = await service.atsScore("user-1", {
        jobDescription: "We need a React developer with Docker experience for our team.",
        sectionData: {},
      })

      expect(result.score).toBe(82)
      expect(result.label).toBe("Excelente")
    })

    it("throws AppError 429 when rate limited", async () => {
      const { checkAndIncrementRateLimit } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementRateLimit).mockResolvedValueOnce(false)

      const aiClient = makeMockAIClient("{}")
      const service = new AIService(aiClient, logger)

      await expect(
        service.atsScore("user-1", { jobDescription: "React developer needed for our team." })
      ).rejects.toMatchObject({ code: "rate_limit_exceeded", status: 429 })
    })

    it("throws AppError 422 when AI returns off_topic label", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        score: 0, label: "off_topic", summary: "", strengths: [], gaps: [], missingKeywords: [], suggestions: [],
      }))
      const service = new AIService(aiClient, logger)

      await expect(
        service.atsScore("user-1", { jobDescription: "What is the capital of France?" })
      ).rejects.toMatchObject({ code: "off_topic", status: 422 })
    })

    it("truncates jobDescription to 6000 chars before sending to AI", async () => {
      const aiClient = makeMockAIClient(JSON.stringify(validATSResponse))
      const service = new AIService(aiClient, logger)

      // Use a unique suffix marker past 6000 chars to verify truncation
      const base = "x".repeat(6000)
      const suffix = "UNIQUE_OVERFLOW_MARKER_SHOULD_NOT_APPEAR"
      const longDescription = base + suffix

      await service.atsScore("user-1", { jobDescription: longDescription, sectionData: {} })

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
      })

      expect(result.body).toContain("<p>")
      expect(result.body).toContain("First paragraph")
    })

    it("throws AppError 422 when AI returns empty body (off-topic)", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({ body: "" }))
      const service = new AIService(aiClient, logger)

      await expect(
        service.generateCoverLetter("user-1", { company: "Acme", jobTitle: "Engineer" })
      ).rejects.toMatchObject({ code: "off_topic", status: 422 })
    })

    it("throws AppError 429 when rate limited", async () => {
      const { checkAndIncrementRateLimit } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementRateLimit).mockResolvedValueOnce(false)

      const aiClient = makeMockAIClient("{}")
      const service = new AIService(aiClient, logger)

      await expect(
        service.generateCoverLetter("user-1", { company: "Acme", jobTitle: "Engineer" })
      ).rejects.toMatchObject({ code: "rate_limit_exceeded", status: 429 })
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
      })

      expect(result.summary).toBe("Experienced developer")
      expect(result.jobTitle).toBe("Senior Engineer")
    })

    it("throws AppError 422 when AI returns empty object (off-topic)", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({}))
      const service = new AIService(aiClient, logger)

      await expect(
        service.fillProfile("user-1", { prompt: "tell me a funny joke please" })
      ).rejects.toMatchObject({ code: "off_topic", status: 422 })
    })

    it("throws AppError 429 when rate limited", async () => {
      const { checkAndIncrementRateLimit } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementRateLimit).mockResolvedValueOnce(false)

      const aiClient = makeMockAIClient("{}")
      const service = new AIService(aiClient, logger)

      await expect(
        service.fillProfile("user-1", { prompt: "I am a software engineer with React skills" })
      ).rejects.toMatchObject({ code: "rate_limit_exceeded", status: 429 })
    })

    it("filters out skills that match employer names from blocklist", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        summary: "Developer",
        suggestedSkills: ["TypeScript", "Google", "React"],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "I worked at Google as a software engineer",
        sectionData: {
          workExperience: [{ id: "we-1", employer: "Google", jobTitle: "SWE" }],
        },
      })

      expect(result.suggestedSkills).not.toContain("Google")
      expect(result.suggestedSkills).toContain("TypeScript")
      expect(result.suggestedSkills).toContain("React")
    })
  })

  // ── generateSummary ────────────────────────────────────────────────────────

  describe("AIService.generateSummary", () => {
    it("rate limit exceeded → throws AppError", async () => {
      const { checkAndIncrementRateLimit } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementRateLimit).mockRejectedValue(new AppError("rate_limit", 429))
      const aiClient = makeMockAIClient("{}")
      const service = new AIService(aiClient, logger)
      await expect(service.generateSummary("u1", {})).rejects.toMatchObject({ status: 429 })
    })

    it("happy path → returns versions array", async () => {
      const { checkAndIncrementRateLimit } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementRateLimit).mockResolvedValue(true)
      const aiClient = makeMockAIClient(JSON.stringify({ versions: ["v1", "v2"] }))
      const service = new AIService(aiClient, logger)
      const result = await service.generateSummary("u1", {})
      expect(result.versions).toHaveLength(2)
    })
  })

  // ── reviewCV ───────────────────────────────────────────────────────────────

  describe("AIService.reviewCV", () => {
    it("off-topic response → throws AppError off_topic", async () => {
      const { checkAndIncrementRateLimit } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementRateLimit).mockResolvedValue(true)
      const aiClient = makeMockAIClient(JSON.stringify({ summary: "", strengths: [], improvements: [], answer: "off_topic" }))
      const service = new AIService(aiClient, logger)
      await expect(service.reviewCV("u1", { sectionData: {}, question: "test" })).rejects.toMatchObject({ code: "off_topic" })
    })
  })

  // ── suggestSkills ──────────────────────────────────────────────────────────

  describe("AIService.suggestSkills", () => {
    it("happy path → returns skills array", async () => {
      const { checkAndIncrementRateLimit } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementRateLimit).mockResolvedValue(true)
      const aiClient = makeMockAIClient(JSON.stringify({ skills: [{ name: "TypeScript", level: "Advanced" }] }))
      const service = new AIService(aiClient, logger)
      const result = await service.suggestSkills("u1", { jobTitle: "Engineer" })
      expect(result.skills[0].name).toBe("TypeScript")
    })
  })

  // ── JSON parse failure ─────────────────────────────────────────────────────

  describe("AIService JSON parse failure", () => {
    it("malformed OpenAI response → throws AppError parse_error 500", async () => {
      const { checkAndIncrementRateLimit } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementRateLimit).mockResolvedValue(true)
      const aiClient = makeMockAIClient("not json {{")
      const service = new AIService(aiClient, logger)
      await expect(service.improveBullet("u1", { text: "Did things" })).rejects.toMatchObject({ code: "parse_error", status: 500 })
    })
  })
})
