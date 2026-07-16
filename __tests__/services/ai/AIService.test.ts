import { describe, it, expect, vi, beforeEach } from "vitest"
import { AIService } from "@/lib/services/ai/AIService"
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
    it("returns indexed improvements on happy path", async () => {
      // Rewrites must stay anchored to facts in the source — inventing a figure
      // here would (correctly) get the suggestion dropped as a hallucination.
      const aiClient = makeMockAIClient(JSON.stringify({
        status: "improved",
        improvements: [
          { index: 0, text: "• Led the team that delivered every project on schedule" },
          { index: 1, text: "• Drove the release pipeline forward while mentoring the wider group" },
        ],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.improveBullet(
        "user-1",
        { text: "• Managed a team and delivered projects on time\n• Helped with the release pipeline and mentoring" },
        "PRO",
      )

      expect(result.status).toBe("improved")
      expect(result.improvements).toHaveLength(2)
      expect(result.improvements[0].index).toBe(0)
      expect(aiClient.chat).toHaveBeenCalledOnce()
    })

    // The whole point of the contract: the model returns ONLY what it changed,
    // and an untouched bullet simply has no entry. It is not padded with an echo.
    it("keeps sparse suggestions addressed to the right original bullet", async () => {
      const original = "• Alpha work\n• Beta work\n• Gamma work\n• Delta work"
      const aiClient = makeMockAIClient(JSON.stringify({
        status: "improved",
        improvements: [{ index: 3, text: "• Rebuilt the Delta reporting flow end to end" }],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.improveBullet("user-1", { text: original }, "PRO")

      expect(result.improvements).toHaveLength(1)
      expect(result.improvements[0].index).toBe(3)
    })

    it("returns already_optimized when the AI echoes the original back", async () => {
      const original = "• Led a team of 5 engineers\n• Reduced onboarding time"
      const aiClient = makeMockAIClient(JSON.stringify({
        status: "improved",
        improvements: [
          { index: 0, text: "• Led a team of 5 engineers" },
          { index: 1, text: "• Reduced onboarding time." },
        ],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.improveBullet("user-1", { text: original }, "PRO")

      expect(result.status).toBe("already_optimized")
      expect(result.improvements).toEqual([])
    })

    // The reported bug: the model bolts "[N users]" onto the original and calls
    // it an improvement. Placeholders are banned outright now, so the suggestion
    // is dropped as a hallucination and never reaches the user's CV.
    it("drops a suggestion whose only addition is a bracket placeholder", async () => {
      const original = "• Managed the support queue\n• Trained new hires"
      const aiClient = makeMockAIClient(JSON.stringify({
        status: "improved",
        improvements: [
          { index: 0, text: "• Managed the support queue for [N users]" },
          { index: 1, text: "• Trained new hires, cutting ramp-up by [X%]" },
        ],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.improveBullet("user-1", { text: original }, "PRO")

      expect(result.status).toBe("already_optimized")
      expect(result.improvements).toEqual([])
    })

    it("surfaces metric_missing questions instead of writing a placeholder", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        status: "metric_missing",
        improvements: [],
        metricQuestions: ["How many users did the module serve?", "Over what period?"],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.improveBullet("user-1", { text: "• Refactored the home module" }, "PRO")

      expect(result.status).toBe("metric_missing")
      expect(result.metricQuestions).toEqual([
        "How many users did the module serve?",
        "Over what period?",
      ])
    })

    it("maps an off_topic response to 422", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({ status: "off_topic", improvements: [] }))
      const service = new AIService(aiClient, logger)

      await expect(
        service.improveBullet("user-1", { text: "my favourite pizza recipe with cheese" }, "PRO")
      ).rejects.toMatchObject({ code: "off_topic", status: 422 })
    })

    // Two suggestions for one bullet would render as two rows carrying the same
    // bullet number, inflate the count, and make apply-all pick the last one.
    it("keeps only the first suggestion when the model repeats an index", async () => {
      const original = "• Alpha work here\n• Beta work here\n• Gamma work here"
      const aiClient = makeMockAIClient(JSON.stringify({
        status: "improved",
        improvements: [
          { index: 1, text: "• Rebuilt the Beta intake flow end to end" },
          { index: 1, text: "• Something else entirely about Beta work" },
        ],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.improveBullet("user-1", { text: original }, "PRO")

      expect(result.improvements).toHaveLength(1)
      expect(result.improvements[0].text).toContain("end to end")
    })

    it("ignores an improvement addressed to a bullet that does not exist", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        status: "improved",
        improvements: [{ index: 9, text: "• Suggestion for a bullet the user never wrote" }],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.improveBullet("user-1", { text: "• Only one bullet here" }, "PRO")

      expect(result.status).toBe("already_optimized")
      expect(result.improvements).toEqual([])
    })

    it("PRO over daily cap → throws 429 daily_cap_reached with ai-daily key", async () => {
      const { checkAndIncrementRateLimit } = vi.mocked(await import("@/lib/ai-client"))
      checkAndIncrementRateLimit.mockResolvedValueOnce(false)
      const aiClient = makeMockAIClient(JSON.stringify({ status: "improved", improvements: [{ index: 0, text: "• x" }] }))
      const service = new AIService(aiClient, logger)

      await expect(
        service.improveBullet("user-1", { text: "Managed a team and delivered projects" }, "PRO")
      ).rejects.toMatchObject({ code: "daily_cap_reached", status: 429 })
      expect(checkAndIncrementRateLimit).toHaveBeenCalledWith("user-1", "ai-daily:improve-bullet", 30, 86_400_000)
      expect(aiClient.chat).not.toHaveBeenCalled()
    })

    it("processes at most 15 improvements", async () => {
      const original = Array.from({ length: 16 }, (_, i) => `• Original bullet number ${i + 1} describing routine duties`).join("\n")
      const improvements = Array.from({ length: 16 }, (_, i) => ({
        index: i,
        text: `• Delivered measurable impact on workstream ${i + 1} across the quarter`,
      }))
      const aiClient = makeMockAIClient(JSON.stringify({ status: "improved", improvements }))
      const service = new AIService(aiClient, logger)

      const result = await service.improveBullet("user-1", { text: original }, "PRO")

      expect(result.improvements).toHaveLength(15)
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

    // Superseded by "maps an off_topic response to 422". Under the old contract
    // an empty array was the off-topic signal, which is exactly why the model
    // could never decline a bullet: silence meant "off topic", so it always had
    // to say something. Empty now means "nothing worth changing", and off-topic
    // has its own explicit status.
    it("treats a malformed response with no improvements array as a format error", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({ bullets: [] }))
      const service = new AIService(aiClient, logger)

      await expect(
        service.improveBullet("user-1", { text: "tell me a joke" }, "PRO")
      ).rejects.toMatchObject({ code: "invalid_response_format", status: 500 })
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
