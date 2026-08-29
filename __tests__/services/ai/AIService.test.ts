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


  // ── atsRescore (deterministic, no LLM) ───────────────────────────────────────

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
          // Nombre con mayúscula interna: la vara genérica lo caza en cualquier
          // rubro. La lista de marcas de tecnología ya no existe — ver ai-helpers.
          description: "• Desplegué microservicios en OpenShift4 y KubeFlow",
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
