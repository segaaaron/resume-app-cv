import { describe, it, expect, vi, beforeEach } from "vitest"
import { AI_DAILY_CAP } from "@/lib/plans"
import { AIService } from "@/lib/services/ai/AIService"
import type { IAIClient, ChatCompletion } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

// ─── Mock ai-client.ts utilities ──────────────────────────────────────────────
vi.mock("@/lib/ai-client", () => ({
  AI_MODEL: "gpt-4o-mini",
  AI_MODEL_PROSE: "gpt-4o-mini",
  AI_TEMPERATURE: 0.4,
  AI_TEMPERATURE_CREATIVE: 0.7,
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
  return {
    chat: vi.fn().mockResolvedValue(makeCompletion(content)),
    embed: vi.fn().mockResolvedValue([]),
  }
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

    it("improves a numberless bullet by wording instead of asking for a metric", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        status: "improved",
        improvements: [{ index: 0, text: "• Mentored new developers on coding standards and tooling, improving team integration" }],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.improveBullet("user-1", { text: "• Was responsible for mentoring new developers" }, "PRO")

      expect(result.status).toBe("improved")
      expect(result.improvements.length).toBeGreaterThan(0)
      // No metric interrogation exists anymore.
      expect((result as unknown as Record<string, unknown>).metricQuestions).toBeUndefined()
    })

    it("maps an off_topic response to 422", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({ status: "off_topic", improvements: [] }))
      const service = new AIService(aiClient, logger)

      // Opens with a duty phrase, so it gets past the deterministic "nothing to
      // fix here" gate and actually reaches the model — which is where the
      // off-topic verdict is made.
      await expect(
        service.improveBullet("user-1", { text: "Responsible for my favourite pizza recipe with cheese" }, "PRO")
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
      // Reads the configured cap instead of restating it: the number is a tuning
      // decision that moves, and a test that hardcodes it fails on the change
      // rather than on a defect. What matters here is the KEY and the window.
      expect(checkAndIncrementRateLimit).toHaveBeenCalledWith(
        "user-1",
        "ai-daily:improve-bullet",
        AI_DAILY_CAP["improve-bullet"],
        86_400_000,
      )
      expect(aiClient.chat).not.toHaveBeenCalled()
    })

    it("processes at most 15 improvements", async () => {
      // "Responsible for" is a weak opener — a real defect, so the request is not
      // short-circuited by the gate that refuses to re-improve clean bullets.
      const original = Array.from({ length: 16 }, (_, i) => `• Responsible for bullet number ${i + 1} describing routine duties`).join("\n")
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
        service.improveBullet("user-1", { text: "Responsible for telling jokes to the team" }, "PRO")
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

    // The recruiter analysis runs in parallel with extraction, so call order is not
    // guaranteed. Route the mock by the prompt (system role) instead of by order.
    function routedAIClient(analysisContent: string): IAIClient {
      return {
        chat: vi.fn((params: Parameters<IAIClient["chat"]>[0]) => {
          const isAnalyst = params.messages.some(
            (m) => typeof m.content === "string" && m.content.includes("senior technical recruiter"),
          )
          return Promise.resolve(makeCompletion(isAnalyst ? analysisContent : JSON.stringify(validExtraction)))
        }),
        embed: vi.fn().mockResolvedValue([]),
      }
    }

    it("surfaces the senior-recruiter analysis (parallel call, order-independent)", async () => {
      const analysis = {
        verdict: "Solid experience, but the two-column layout hurts ATS parsing.",
        passRisk: "high",
        criticalFixes: [
          { issue: "Two-column layout", why: "A strict ATS reorders it", fix: "Switch to single column", severity: "high" },
          { issue: "enhancing performance by 3%", why: "Too small to be credible", fix: "Remove or strengthen", severity: "medium" },
        ],
        strengths: ["Deep Swift/SwiftUI experience"],
      }
      const aiClient = routedAIClient(JSON.stringify(analysis))
      const result = await new AIService(aiClient, logger).atsScore(
        "user-1",
        { jobDescription: "We need a Developer with Kubernetes experience for our team.", sectionData: richSectionData },
        "PRO",
      )
      expect(aiClient.chat).toHaveBeenCalledTimes(2)
      expect(result.analysis?.passRisk).toBe("high")
      expect(result.analysis?.verdict).toContain("two-column")
      expect(result.analysis?.criticalFixes.map((f) => f.issue)).toContain("Two-column layout")
    })

    it("drops keyword/typo notes that duplicate the deterministic layer, keeps prose spelling", async () => {
      const analysis = {
        verdict: "Decent, but layout hurts parsing.",
        passRisk: "medium",
        criticalFixes: [
          { issue: "Two-column layout", why: "reordered by ATS", fix: "Use single column", severity: "high" },
          // Names a missing keyword + add verb → the keyword card already shows it → drop.
          { issue: "Missing keyword: Kubernetes", why: "the job requires it", fix: "Add Kubernetes to your skills", severity: "medium" },
          // PROSE spelling — not a job keyword, so the typo detector never sees it → MUST survive.
          { issue: "Spelling: 'more then'", why: "reads as careless", fix: "change to 'more than'", severity: "medium" },
          // Generic structural add — no dup keyword → survives.
          { issue: "No summary heading", why: "the ATS can't label the block", fix: "Add a Professional Summary section at the top", severity: "medium" },
        ],
        strengths: [],
      }
      const result = await new AIService(routedAIClient(JSON.stringify(analysis)), logger).atsScore(
        "user-1",
        { jobDescription: "We need a Developer with Kubernetes experience for our team.", sectionData: richSectionData },
        "PRO",
      )
      const issues = result.analysis?.criticalFixes.map((f) => f.issue) ?? []
      expect(issues).toContain("Two-column layout")
      expect(issues).not.toContain("Missing keyword: Kubernetes") // handled by the keyword card
      expect(issues).toContain("Spelling: 'more then'") // prose spelling is NOT a keyword typo → kept
      expect(issues).toContain("No summary heading")
    })

    it("fails closed to null analysis when the recruiter call returns malformed JSON", async () => {
      const aiClient = routedAIClient("not json at all")
      const result = await new AIService(aiClient, logger).atsScore(
        "user-1",
        { jobDescription: "We need a Developer with Kubernetes experience for our team.", sectionData: richSectionData },
        "PRO",
      )
      // Score still computed; analysis simply absent.
      expect(result.score).toBeGreaterThan(0)
      expect(result.analysis).toBeNull()
    })

    it("is template-aware: a caution (multi-column) template dings the score and reports safety", async () => {
      const jd = "We need a Developer with Kubernetes experience for our team."
      const safe = await new AIService(makeMockAIClient(JSON.stringify(validExtraction)), logger)
        .atsScore("user-1", { jobDescription: jd, sectionData: richSectionData, templateId: "classic" }, "PRO")
      const caution = await new AIService(makeMockAIClient(JSON.stringify(validExtraction)), logger)
        .atsScore("user-1", { jobDescription: jd, sectionData: richSectionData, templateId: "coralsidebar" }, "PRO")

      expect(safe.templateSafety).toBe("safe")
      expect(caution.templateSafety).toBe("caution")
      // caution takes a 5% ding (×0.95), not a hard penalty.
      expect(caution.score).toBe(Math.round(safe.score * 0.95))
      expect(safe.subScores.format).toBe(100)
      expect(caution.subScores.format).toBe(65)
    })

    it("defaults to safe when no templateId is given (no false alarm)", async () => {
      const result = await new AIService(makeMockAIClient(JSON.stringify(validExtraction)), logger)
        .atsScore("user-1", { jobDescription: "We need a Developer with Kubernetes experience.", sectionData: richSectionData }, "PRO")
      expect(result.templateSafety).toBe("safe")
      expect(result.subScores.format).toBe(100)
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

    it("topa la vacante en 12 sin tumbar el análisis, y puntúa exactamente lo que muestra", async () => {
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
      /**
       * ── LAS DOS INTENCIONES DE ESTE TEST, Y CUÁL SE AFINA (2026-08-25) ───
       *
       * 1. Una extracción larga NO puede tumbar el análisis. Intacta.
       *
       * 2. El número no puede cobrar lo que la lista esconde. Ésa nació del
       *    defecto reportado —«los ATS no suben casi todos los skills que
       *    tengo»— cuando el puntaje se calculaba sobre 18 y la pantalla
       *    listaba 12. Se conserva, y es lo que se afirma abajo: lo que se
       *    puntúa y lo que se muestra son EL MISMO conjunto.
       *
       * Lo que cambia es el número, no la regla. El plan de F2 pone el techo de
       * la vacante en 12 y sólo lo levanta cuando entre la ponderación por
       * prioridad; la ponderación se midió y no salió, así que el techo se
       * queda. Sin él, medido: el mismo CV cae de 84 a 56.
       *
       * OJO — son dos lados distintos y sólo se topa uno: éste es el de la
       * VACANTE (cuántas habilidades se le exigen al candidato). Las del CV no
       * se topan nunca: `buildAtsHaystack` manda TODAS al matcher, que es lo que
       * cierra el defecto reportado, y el test de abajo lo comprueba con la 15ª.
       */
      const reportadas = result.matchedKeywords.length + result.missingKeywords.length
      expect(reportadas).toBe(12)
      expect(reportadas).toBeLessThan(many.length)
    })

    it("matches a skill listed past the 12th — the full skills list feeds the ATS haystack", async () => {
      // Reported bug: a skill the user already added but sitting past the 12 that
      // buildResumeContext keeps for the LLM prompt was invisible to the exact
      // matcher and came back as "missing". buildAtsHaystack appends ALL skills, so
      // "Kubernetes" (15th) must now match. (buildResumeContext is mocked to a fixed
      // string with no skills, so this asserts the haystack augmentation directly.)
      const sectionData = {
        personalDetails: { jobTitle: "Developer" },
        summary: "Experienced developer",
        workExperience: [{ jobTitle: "Developer" }],
        skills: [
          ...Array.from({ length: 12 }, (_, i) => ({ name: `Filler${i + 1}` })),
          { name: "Redis" },
          { name: "GraphQL" },
          { name: "Kubernetes" }, // 15th — past the 12-cap
        ],
        education: [{ degree: "BS" }],
      }
      const aiClient = makeMockAIClient(JSON.stringify(validExtraction)) // requires Developer + Kubernetes
      const service = new AIService(aiClient, logger)

      const result = await service.atsScore("user-1", {
        jobDescription: "We need a Developer with Kubernetes experience.",
        sectionData,
      }, "PRO")

      expect(result.matchedKeywords).toContain("Kubernetes")
      expect(result.missingKeywords).not.toContain("Kubernetes")
    })

    it("role-only mode: scores from a job TITLE and flags the result as inferred", async () => {
      // No jobDescription — just roleTitle. The LLM infers standard requirements,
      // the deterministic engine scores them, and the result is flagged approximate.
      const aiClient = makeMockAIClient(JSON.stringify(validExtraction))
      const service = new AIService(aiClient, logger)

      const result = await service.atsScore("user-1", {
        roleTitle: "Backend Developer",
        sectionData: richSectionData,
      }, "PRO")

      expect(result.inferredFromRole).toBe(true)
      expect(typeof result.score).toBe("number")
      expect(result.matchedKeywords).toContain("Developer")
      expect(result.missingKeywords).toContain("Kubernetes")
      // The role title reached the LLM prompt.
      const sent = JSON.stringify(vi.mocked(aiClient.chat).mock.calls[0]?.[0])
      expect(sent).toContain("Backend Developer")
    })

    it("a real job description takes precedence over roleTitle and is NOT flagged inferred", async () => {
      const aiClient = makeMockAIClient(JSON.stringify(validExtraction))
      const service = new AIService(aiClient, logger)

      const result = await service.atsScore("user-1", {
        jobDescription: "We need a Developer with Kubernetes experience for our team.",
        roleTitle: "Backend Developer",
        sectionData: richSectionData,
      }, "PRO")

      expect(result.inferredFromRole).toBe(false)
    })

    it("rejects a role title that is too short", async () => {
      const service = new AIService(makeMockAIClient(JSON.stringify(validExtraction)), logger)
      await expect(
        service.atsScore("user-1", { roleTitle: "x", sectionData: richSectionData }, "PRO")
      ).rejects.toMatchObject({ status: 400 })
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

    it("atsScore echoes the extracted keywords for deterministic re-scoring", async () => {
      const service = new AIService(makeMockAIClient(JSON.stringify(validExtraction)), logger)
      const result = await service.atsScore("user-1", {
        jobDescription: "We need a Developer with Kubernetes experience.", sectionData: richSectionData,
      }, "PRO")
      expect(result.extractedKeywords.hardSkills).toEqual(expect.arrayContaining(["Developer", "Kubernetes"]))
      expect(result.extractedKeywords.jobTitle).toBe("Developer")
    })
  })

  // ── atsRescore (deterministic, no LLM) ───────────────────────────────────────
  describe("atsRescore", () => {
    const keywords = { hardSkills: ["Developer", "Kubernetes"], softSkills: [], jobTitle: "Developer", mustHaves: [] }
    const baseSection = {
      personalDetails: { jobTitle: "Developer" },
      summary: "Experienced developer",
      workExperience: [{ jobTitle: "Developer", description: "Built things" }],
      skills: [{ name: "Developer" }],
      education: [{ degree: "BS" }],
    }

    it("re-scores without an LLM call and reflects CV edits (the closed loop)", async () => {
      // buildResumeContext is mocked to a constant in this file; override it so the
      // two re-scores see a CV before/after the user adds the missing keyword.
      const { buildResumeContext } = vi.mocked(await import("@/lib/ai-client"))
      vi.mocked(buildResumeContext)
        .mockReturnValueOnce("Target Role: Developer\nSkills: Developer")
        .mockReturnValueOnce("Target Role: Developer\nSkills: Developer, Kubernetes")

      const service = new AIService(makeMockAIClient("{}"), logger) // client unused by rescore
      const before = service.atsRescore({ keywords, sectionData: baseSection, templateId: "classic" })
      const after = service.atsRescore({ keywords, sectionData: baseSection, templateId: "classic" })

      expect(before.missingKeywords).toContain("Kubernetes")
      expect(after.missingKeywords).not.toContain("Kubernetes")
      expect(after.score).toBeGreaterThan(before.score)
    })

    it("applies the same template-caution ding as atsScore", () => {
      const service = new AIService(makeMockAIClient("{}"), logger)
      const safe = service.atsRescore({ keywords, sectionData: baseSection, templateId: "classic" })
      const caution = service.atsRescore({ keywords, sectionData: baseSection, templateId: "coralsidebar" })
      expect(safe.templateSafety).toBe("safe")
      expect(caution.templateSafety).toBe("caution")
      expect(caution.score).toBe(Math.round(safe.score * 0.95))
    })

    it("is reproducible — same inputs, same score", () => {
      const service = new AIService(makeMockAIClient("{}"), logger)
      const a = service.atsRescore({ keywords, sectionData: baseSection, templateId: "classic" })
      const b = service.atsRescore({ keywords, sectionData: baseSection, templateId: "classic" })
      expect(a.score).toBe(b.score)
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

    // The candidate describes a job but never names the company. The model has
    // to put something in `employer`; that invention failed grounding and the
    // WHOLE entry — the description included — used to be binned, so a cook or
    // a waiter got back a summary and nothing else.
    it("keeps a new job whose role is grounded but blanks the invented employer", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        workExperienceNew: [{
          jobTitle: "Cocinero",
          employer: "Restaurante El Fogon",
          description: "• Preparé el servicio diario de comidas",
        }],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "Trabajé tres años como cocinero preparando el servicio diario de comidas",
        sectionData: {},
      }, "PRO")

      expect(result.workExperienceNew).toHaveLength(1)
      expect(result.workExperienceNew![0].jobTitle).toBe("Cocinero")
      expect(result.workExperienceNew![0].employer).toBe("")
      expect(result.workExperienceNew![0].description).toContain("servicio diario")
    })

    it("drops a new job when neither role nor employer comes from the prompt", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        summary: "Perfil",
        workExperienceNew: [{
          jobTitle: "Astronauta",
          employer: "NASA",
          description: "• Comandé misiones orbitales",
        }],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "Trabajé tres años como cocinero preparando el servicio diario de comidas",
        sectionData: {},
      }, "PRO")

      expect(result.workExperienceNew).toHaveLength(0)
    })

    // An empty employer must not fail the response schema: safeParse failing
    // fell back to the RAW model object, turning validation off for every field.
    it("still returns grounded skills when a new job carries an empty employer", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        suggestedSkills: ["React"],
        workExperienceNew: [{
          jobTitle: "Cocinero",
          employer: "",
          description: "• Preparé el servicio diario",
        }],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "Trabajé como cocinero preparando el servicio diario y también uso React",
        sectionData: {},
      }, "PRO")

      expect(result.suggestedSkills).toContain("React")
      expect(result.workExperienceNew).toHaveLength(1)
      expect(result.workExperienceNew![0].employer).toBe("")
    })

    // The point of the whole feature: propose what the user did NOT write. If a
    // filter ever touches this list it becomes suggestedSkills again, which is
    // the bug it was built to replace.
    it("returns role-typical skills the user never wrote", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        summary: "Perfil",
        suggestedSkills: ["Analisis de Riesgo"],
        inferredSkills: ["Manejo de Efectivo", "Excel", "Atencion al Cliente"],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "trabaje en banca haciendo analisis de riesgo de carteras",
        sectionData: {},
      }, "PRO")

      expect(result.inferredSkills).toEqual(["Manejo de Efectivo", "Excel", "Atencion al Cliente"])
      expect(result.suggestedSkills).toContain("Analisis de Riesgo")
    })

    /**
     * Reported from a real CV: the skills section read "Diseño y mantenimiento
     * de bases de datos relacionales" and "Control de versiones con Git" —
     * descriptions of activities, which match nothing in an ATS. A résumé needs
     * the name: PostgreSQL, Git.
     */
    it("drops skills that are sentences instead of names", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        summary: "Perfil",
        suggestedSkills: ["React", "Diseño y mantenimiento de bases de datos relacionales"],
        inferredSkills: ["PostgreSQL", "Control de versiones con Git y despliegue continuo"],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "soy desarrollador web y uso react y postgresql",
        sectionData: {},
      }, "PRO")

      expect(result.suggestedSkills).toEqual(["React"])
      expect(result.inferredSkills).toEqual(["PostgreSQL"])
    })

    /**
     * Taxonomy alignment: our 1,002 curated terms decide the spelling when they
     * know the skill, the model keeps its own when they do not. Older ATS still
     * token-match literal strings, so the canonical form is what scores.
     */
    it("rewrites a known skill in the catalog's spelling and keeps an unknown one", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        summary: "Perfil",
        inferredSkills: ["reactjs", "postgres", "Manejo de guadaña"],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "soy desarrollador web",
        sectionData: {},
      }, "PRO")

      // The two the catalog knows come back the way a posting writes them; the
      // one it has never heard of survives untouched — 1,002 terms do not cover
      // every trade, and dropping it would leave the list able to suggest only
      // what we already thought of.
      expect(result.inferredSkills).toEqual(["React", "PostgreSQL", "Manejo de guadaña"])
    })

    it("keeps the multi-word names that are real skills", async () => {
      // Four words is the ceiling because our own dictionary has entries like
      // "Applicant Tracking Systems (ATS)" — a name plus its acronym.
      const aiClient = makeMockAIClient(JSON.stringify({
        summary: "Perfil",
        inferredSkills: ["REST APIs", "Applicant Tracking Systems (ATS)", "Google Tag Manager"],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "soy reclutador",
        sectionData: {},
      }, "PRO")

      expect(result.inferredSkills).toEqual(["REST APIs", "Applicant Tracking Systems (ATS)", "Google Tag Manager"])
    })

    it("keeps an inferred skill from becoming a claim about the user", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        summary: "Perfil",
        // An employer, a city and a skill the CV already has: none may pass.
        inferredSkills: ["Banco Mercantil", "La Paz", "Excel", "Excel", "Liderazgo"],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "trabaje en banca haciendo analisis de riesgo",
        sectionData: {
          workExperience: [{ id: "w1", employer: "Banco Mercantil", jobTitle: "Analista" }],
          personalDetails: { location: "La Paz" },
          skills: [{ id: "s1", name: "Excel" }],
        },
      }, "PRO")

      expect(result.inferredSkills).toEqual(["Liderazgo"])
    })

    // The CV has had a certifications section all along and the assistant had no
    // way to fill it, so nobody was ever prompted about the one credential that
    // most changes how a technical CV reads. These are EXAMPLES for the role, so
    // grounding them against the user's text would empty the list — the exact
    // filter that made the skills section unable to suggest anything.
    it("suggests certifications standard for the role, ungrounded on purpose", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        summary: "Perfil",
        suggestedCertifications: ["CCNA", "CCNP", "ITIL Foundation"],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "soy ingeniero de telecomunicaciones con 5 anos de experiencia",
        sectionData: {},
      }, "PRO")

      expect(result.suggestedCertifications).toEqual(["CCNA", "CCNP", "ITIL Foundation"])
    })

    it("keeps an employer from entering dressed as a certification", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        summary: "Perfil",
        suggestedCertifications: ["Banco Mercantil", "CCNA"],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "trabaje en banca",
        sectionData: { workExperience: [{ id: "w1", employer: "Banco Mercantil", jobTitle: "Analista" }] },
      }, "PRO")

      expect(result.suggestedCertifications).toEqual(["CCNA"])
    })

    it("creates the studies the user described and blanks the university they never named", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        educationNew: [{ degree: "Ingeniería en Telecomunicaciones", institution: "Universidad Mayor de San Andrés" }],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "estudie ingenieria en telecomunicaciones",
        sectionData: {},
      }, "PRO")

      expect(result.educationNew).toHaveLength(1)
      expect(result.educationNew![0].degree).toBe("Ingeniería en Telecomunicaciones")
      expect(result.educationNew![0].institution).toBe("")
    })

    // The case the whole feature exists for: one line, no company, and a real
    // resume has to come back. The prompt used to forbid the entry outright, so
    // "I am a telecommunications engineer with 5 years" produced a summary, a
    // job title and an empty experience section.
    it("drafts the role from a profession alone, naming the tools of that trade", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        summary: "Ingeniero de telecomunicaciones...",
        jobTitle: "Ingeniero de Telecomunicaciones",
        workExperienceNew: [{
          jobTitle: "Desarrollador de Software",
          employer: "",
          // Names the tools of the trade, which is the only way a role draft can
          // be written — and every one of them is on the invented-tech list.
          description: "• Construí interfaces con React\n• Desarrollé APIs en Node.js y TypeScript",
        }],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "soy desarrollador de software con 5 anos de experiencia",
        sectionData: {},
      }, "PRO")

      expect(result.workExperienceNew).toHaveLength(1)
      expect(result.workExperienceNew![0].employer).toBe("")
      expect(result.workExperienceNew![0].description).toContain("React")
    })

    // The other side of that line: once a real employer is named, a tool the
    // user never mentioned stops being a draft and becomes a false claim about
    // a job a recruiter can call and check.
    it("still refuses invented tech on an entry tied to a named employer", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        workExperienceNew: [{
          jobTitle: "Analista de Riesgo",
          employer: "Banco Mercantil",
          description: "• Desplegué microservicios en Kubernetes y Docker",
        }],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "trabaje en banco mercantil como analista de riesgo de carteras",
        sectionData: {},
      }, "PRO")

      expect(result.workExperienceNew).toHaveLength(0)
    })

    // Same failure seen from the other side: while the schema rejected an empty
    // employer, safeParse failed and the code fell back to the RAW model object,
    // so zod stripped nothing and unknown keys rode into the user's CV.
    it("strips unknown keys from a new job that carries an empty employer", async () => {
      const aiClient = makeMockAIClient(JSON.stringify({
        workExperienceNew: [{
          jobTitle: "Cocinero",
          employer: "",
          description: "• Preparé el servicio diario",
          salary: "3000 EUR",
        }],
      }))
      const service = new AIService(aiClient, logger)

      const result = await service.fillProfile("user-1", {
        prompt: "Trabajé como cocinero preparando el servicio diario",
        sectionData: {},
      }, "PRO")

      expect(result.workExperienceNew).toHaveLength(1)
      expect(result.workExperienceNew![0]).not.toHaveProperty("salary")
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

    it("drops a no-op suggestion whose preview equals the current field value", async () => {
      const { checkAndIncrementAIQuota } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementAIQuota).mockResolvedValue({ allowed: true })
      const current = "Senior iOS engineer with seven years of experience."
      const aiClient = makeMockAIClient(JSON.stringify({
        summary: "Solid resume.",
        strengths: [],
        improvements: [
          // preview is IDENTICAL to the current summary → a no-op, must be dropped.
          { text: "Rewrite the summary", suggestion: { field: "summary", type: "replace", preview: current, reason: "clearer" } },
        ],
        answer: "",
      }))
      const service = new AIService(aiClient, logger)
      const res = await service.reviewCV("u1", { sectionData: { summary: current } }, "PRO")
      // The advisory text stays, but the identical (already-applied) suggestion is gone.
      expect(res.improvements[0].text).toBe("Rewrite the summary")
      expect(res.improvements[0].suggestion).toBeUndefined()
      // ...and it still knows WHERE it applied, so the UI can name the section.
      expect((res.improvements[0] as { location?: { field: string } }).location?.field).toBe("summary")
    })

    it("never shows the user our own job-ID marker", async () => {
      // buildResumeContext labels each job "ID:<uuid> | " so the model can address
      // it in the action. The model copies that prefix into the prose, and the
      // panel rendered a report starting with a raw UUID — seen in production.
      const { checkAndIncrementAIQuota } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementAIQuota).mockResolvedValue({ allowed: true })
      const aiClient = makeMockAIClient(JSON.stringify({
        summary: "Solid resume.",
        strengths: [],
        improvements: [
          {
            text: 'ID:b5287d56-892f-42f9-bf46-6faee106cb12 [0] "Developed hybrid mobile applications using Ionic."',
            location: { field: "skills" },
          },
        ],
        answer: "",
      }))
      const service = new AIService(aiClient, logger)
      const res = await service.reviewCV("u1", { sectionData: { summary: "x" } }, "PRO")
      expect(res.improvements[0].text).toBe('"Developed hybrid mobile applications using Ionic."')
      expect(res.improvements[0].text).not.toContain("ID:")
      expect(res.improvements[0].text).not.toContain("b5287d56")
    })

    it("keeps the model-provided location on an advice-only item", async () => {
      const { checkAndIncrementAIQuota } = await import("@/lib/ai-client")
      vi.mocked(checkAndIncrementAIQuota).mockResolvedValue({ allowed: true })
      const aiClient = makeMockAIClient(JSON.stringify({
        summary: "Solid resume.",
        strengths: [],
        improvements: [
          { text: "Fix the Objective-C typo in your skills", location: { field: "skills" } },
        ],
        answer: "",
      }))
      const service = new AIService(aiClient, logger)
      const res = await service.reviewCV("u1", { sectionData: { summary: "x" } }, "PRO")
      expect(res.improvements[0].suggestion).toBeUndefined()
      expect((res.improvements[0] as { location?: { field: string } }).location?.field).toBe("skills")
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
