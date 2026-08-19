import { describe, it, expect, vi, beforeEach } from "vitest"
import { losesStatedFigure } from "@/lib/services/ai/shared/ai-helpers"
import { AIService } from "@/lib/services/ai/AIService"
import type { IAIClient, ChatCompletion } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

/**
 * A rewrite must never delete the number the candidate earned.
 *
 * MEASURED, 2026-08-19, on six well-written résumés. Once the prompts were told
 * to name the content of the work, the model started rewriting lines that were
 * already good — and dropping their figures on the way out:
 *
 *   was: "Cut medication errors from 12 to 3 per month across two wards"
 *   now: "Reduced medication errors by reconciling prescriptions, MAR entries
 *         and administered doses across two wards"
 *
 * Four of five bullets on that CV lost their numbers, and EVERY existing guard
 * passed it: nothing was invented, so `detectHallucination` was quiet; the text
 * grew, so `dropsContentWithoutGain` saw a gain; the wording changed, so
 * `isTrivialEdit` and `isCosmeticReword` did not apply.
 *
 * The prompts now forbid it. This makes it unrepresentable, which is the half
 * that holds when a prompt drifts.
 */
vi.mock("@/lib/ai-client", () => ({
  AI_MODEL: "gpt-4o-mini", AI_MODEL_PROSE: "gpt-4o-mini",
  AI_TEMPERATURE: 0.4, AI_TEMPERATURE_CREATIVE: 0.7, AI_TEMPERATURE_PRECISE: 0.1,
  AI_TEMPERATURE_STRUCTURED: 0.3, AI_TEMPERATURE_GENERATIVE: 0.6, AI_TEMPERATURE_EXACT: 0,
  checkRateLimit: vi.fn().mockResolvedValue(true),
  checkAndIncrementRateLimit: vi.fn().mockResolvedValue(true),
  checkAndIncrementAIQuota: vi.fn().mockResolvedValue({ allowed: true }),
  recordRateLimitUsage: vi.fn(), logAIUsage: vi.fn(),
  buildResumeContext: vi.fn((sectionData: Record<string, unknown>) => JSON.stringify(sectionData)),
}))
vi.mock("@/lib/db", () => ({ db: { resume: { findFirst: vi.fn() }, auditLog: { create: vi.fn() } } }))
vi.mock("@/lib/ai-safety", () => ({ validateAIInput: vi.fn().mockReturnValue({ valid: true }) }))
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({
  enforceAIQuota: vi.fn().mockResolvedValue(undefined),
  refundDailyQuota: vi.fn().mockResolvedValue(undefined),
}))

function completion(content: string): ChatCompletion {
  return {
    id: "t", object: "chat.completion", created: 0, model: "gpt-4o-mini",
    choices: [{ index: 0, message: { role: "assistant", content, refusal: null }, finish_reason: "stop", logprobs: null }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  } as ChatCompletion
}

describe("losesStatedFigure", () => {
  it("catches the measured case: a richer line with the numbers rubbed out", () => {
    expect(losesStatedFigure(
      "Cut medication errors from 12 to 3 per month across two wards",
      "Reduced medication errors by reconciling prescriptions, MAR entries and administered doses across two wards.",
    )).toBe(true)
  })

  it("passes a rewrite that keeps every figure and adds content", () => {
    expect(losesStatedFigure(
      "Cut medication errors from 12 to 3 per month across two wards",
      "Cut medication errors from 12 to 3 per month across two wards by reconciling the MAR at every handover.",
    )).toBe(false)
  })

  it("says nothing about a line that never had a figure", () => {
    expect(losesStatedFigure("Soldé piezas.", "Soldé estructura metálica siguiendo planos y control del cordón.")).toBe(false)
  })

  /**
   * Compared on digits, not on the token: a Spanish CV writes 1.400 where an
   * English one writes 1,400, and judging a résumé by the other locale's
   * separator would drop correct rewrites for every Spanish user.
   */
  it("treats the same figure under either locale's separators as kept", () => {
    expect(losesStatedFigure("Cuadré 1.400 arqueos diarios", "Cuadré 1,400 arqueos diarios verificando comprobantes")).toBe(false)
  })

  it("catches a decimal that changed value", () => {
    expect(losesStatedFigure("Cut sync time from 3.2s to 1.1s", "Cut sync time from 3.5s to 1.1s")).toBe(true)
  })
})

describe("tailor-cv drops a rewrite that deletes the candidate's figure", () => {
  let logger: ILogger
  beforeEach(() => { logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }; vi.clearAllMocks() })

  const SECTIONS = {
    summary: "Registered nurse with 9 years in emergency care.",
    workExperience: [{
      id: "n1", jobTitle: "Charge Nurse", employer: "Hospital Viedma",
      description: "• Cut medication errors from 12 to 3 per month across two wards\n• Coordinated triage for up to 30 patients per shift",
    }],
    skills: [{ name: "Triage" }],
  }
  const JD = "Charge Nurse for an emergency department: triage, handover coordination, medication safety, supervising staff nurses. ".repeat(2)

  function serviceReturning(bullets: { index: number; text: string }[]) {
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({
      summary: null,
      experiences: [{ targetId: "n1", jobTitle: "Charge Nurse", employer: "Hospital Viedma", changedBullets: bullets }],
      missingSkills: [], softSkillSuggestions: [],
    })))
    return { service: new AIService({ chat, embed: vi.fn() } as IAIClient, logger), chat }
  }

  it("drops the figure-losing rewrite and keeps the one that preserved it", async () => {
    const { service } = serviceReturning([
      // Loses 12 and 3 — exactly the measured failure.
      { index: 0, text: "• Reduced medication errors by reconciling prescriptions and administered doses across two wards." },
      // Keeps 30 and adds the trade's content.
      { index: 1, text: "• Coordinated triage for up to 30 patients per shift, routing by acuity under the department's escalation protocol." },
    ])
    const r = await service.tailorCV("u1", { sectionData: SECTIONS, jobDescription: JD }, "PRO")

    const kept = r.experiences.flatMap((e) => e.changedBullets.map((b) => b.text))
    expect(kept).toHaveLength(1)
    expect(kept[0]).toContain("30 patients per shift")
  })

  it("drops a tailored summary that deletes a figure the summary stated", async () => {
    const withFigures = { ...SECTIONS, summary: "Registered nurse with 9 years in emergency care. Triaged up to 30 patients per shift and trained 6 new hires." }
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({
      summary: "Registered nurse with emergency experience coordinating triage, handover and medication safety across busy wards.",
      experiences: [], missingSkills: [], softSkillSuggestions: [],
    })))
    const r = await new AIService({ chat, embed: vi.fn() } as IAIClient, logger)
      .tailorCV("u1", { sectionData: withFigures, jobDescription: JD }, "PRO")

    expect(r.summary).toBeNull()
  })
})

/**
 * The model answers with the job id it was SHOWN, and it was shown "ID:w1".
 *
 * Measured across 8 résumés: sometimes "w1", sometimes "ID:w1". The second form
 * matches no job, and every per-bullet guard in tailor is written as
 * `if (orig !== undefined)` — so an unresolved id does not fail loudly, it makes
 * the figure-loss, trivial-edit and lateral-rewrite checks all skip themselves
 * while the rewrite ships. The client cannot place it either.
 */
describe("a job id the model prefixed still resolves to the real job", () => {
  let logger: ILogger
  beforeEach(() => { logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }; vi.clearAllMocks() })

  const SECTIONS = {
    summary: "Welder.",
    workExperience: [{ id: "w1", jobTitle: "Welder", employer: "Talleres Cruz", description: "• Completed 40 structural frames with zero rework" }],
    skills: [{ name: "TIG" }],
  }
  const JD = "Structural welder: drawings, bevelling, MIG and TIG on structural steel, weld inspection. ".repeat(2)

  it("still runs the figure guard when the id came back as \"ID:w1\"", async () => {
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({
      summary: null,
      // Prefixed id AND a rewrite that deletes the 40. Before resolveJobId this
      // shipped untouched, because the guard could not find the original.
      experiences: [{ targetId: "ID:w1", jobTitle: "Welder", employer: "Talleres Cruz",
        changedBullets: [{ index: 0, text: "• Completed structural frames to drawing with zero rework across the fabrication run." }] }],
      missingSkills: [], softSkillSuggestions: [],
    })))
    const r = await new AIService({ chat, embed: vi.fn() } as IAIClient, logger)
      .tailorCV("u1", { sectionData: SECTIONS, jobDescription: JD }, "PRO")

    expect(r.experiences[0]?.changedBullets).toEqual([])
  })

  it("hands the client the real id, never the prefixed one", async () => {
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({
      summary: null,
      experiences: [{ targetId: "ID:w1", jobTitle: "Welder", employer: "Talleres Cruz",
        changedBullets: [{ index: 0, text: "• Completed 40 structural frames with zero rework, fitting and tacking to drawing before final pass." }] }],
      missingSkills: [], softSkillSuggestions: [],
    })))
    const r = await new AIService({ chat, embed: vi.fn() } as IAIClient, logger)
      .tailorCV("u1", { sectionData: SECTIONS, jobDescription: JD }, "PRO")

    expect(r.experiences[0]?.targetId).toBe("w1")
    expect(r.experiences[0]?.changedBullets).toHaveLength(1)
  })
})

/**
 * The ATS panel's Apply button, measured END TO END.
 *
 * Every critical fix in the eval set was applied to the real CV through the same
 * write path the panel uses. Seven résumés came out missing a figure: "Completed
 * 40 structural frames with zero rework" replaced by a fuller sentence with no 40
 * in it. `groundFixAction` could not see it — it validates that the target job and
 * index exist, and never receives `fix`.
 */
describe("an ATS fix never gets a button that deletes the candidate's figure", () => {
  let logger: ILogger
  beforeEach(() => { logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }; vi.clearAllMocks() })

  const SECTIONS = {
    summary: "Certified welder with 12 years in structural steel. Completed 40 building frames with zero rework.",
    workExperience: [{
      id: "w1", jobTitle: "Lead Welder", employer: "Metalúrgica Andina",
      description: "• Completed 40 structural frames with zero rework\n• Cut scrap from 8% to 2% by changing the cutting sequence",
    }],
    skills: [{ name: "TIG Welding" }],
  }
  const JD = "Lead Welder for structural steel fabrication: drawings, bevelling, TIG and MIG, weld inspection. ".repeat(2)

  function clientReturning(fix: string, kind: "rewrite_bullet" | "rewrite_summary", index = 0): IAIClient {
    const extraction = JSON.stringify({ hardSkills: ["TIG"], softSkills: [], jobTitle: "Welder", mustHaves: ["TIG"], summary: "fit", label: "ok" })
    const analysis = JSON.stringify({
      verdict: "Strong", passRisk: "low",
      criticalFixes: [{ issue: "the line reads thin", why: "no trade detail", fix, severity: "high",
        action: kind === "rewrite_bullet" ? { kind, targetId: "w1", index } : { kind } }],
      strengths: ["Structural steel"],
    })
    const chat = vi.fn().mockImplementation((params: { messages: Array<{ content: string }> }) => {
      const prompt = params.messages.map((m) => m.content).join("\n")
      const isAnalysis = /senior technical recruiter|reclutador t[eé]cnico/i.test(prompt)
      return Promise.resolve(completion(isAnalysis ? analysis : extraction))
    })
    return { chat, embed: vi.fn().mockResolvedValue([]) } as IAIClient
  }

  it("degrades a bullet rewrite that drops the 40 to advice", async () => {
    const r = await new AIService(clientReturning(
      "Completed structural steel frames to drawing, fitting and tacking each assembly before the final pass with zero rework.",
      "rewrite_bullet",
    ), logger).atsScore("u1", { jobDescription: JD, sectionData: SECTIONS, language: "en" }, "PRO")

    expect(r.analysis?.criticalFixes?.[0]?.action?.kind).toBe("manual")
    // The diagnosis survives — only the write is taken away.
    expect(r.analysis?.criticalFixes?.[0]?.issue).toContain("thin")
  })

  it("keeps the button when the rewrite carries the 40 through", async () => {
    const r = await new AIService(clientReturning(
      "Completed 40 structural steel frames to drawing with zero rework, fitting and tacking each assembly before the final pass.",
      "rewrite_bullet",
    ), logger).atsScore("u1", { jobDescription: JD, sectionData: SECTIONS, language: "en" }, "PRO")

    expect(r.analysis?.criticalFixes?.[0]?.action?.kind).toBe("rewrite_bullet")
  })

  it("guards the summary rewrite the same way", async () => {
    const r = await new AIService(clientReturning(
      "Certified welder with over a decade in structural steel fabrication and fit-up across building frames.",
      "rewrite_summary",
    ), logger).atsScore("u1", { jobDescription: JD, sectionData: SECTIONS, language: "en" }, "PRO")

    expect(r.analysis?.criticalFixes?.[0]?.action?.kind).toBe("manual")
  })
})

/**
 * A CV line is written BY the candidate, not ABOUT them.
 *
 * Measured on the reported CV: tailor returned "Ejecutó suites con Selenium…"
 * and "Definió alcance…" into the candidate's own work history — third person,
 * next to six first-person lines. The rule existed, but only inside the
 * assistant's own prompt; the shared bar never carried it, so every other
 * surface was free to break it.
 */
describe("a Spanish bullet is never written in the third person", () => {
  let logger: ILogger
  beforeEach(() => { logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }; vi.clearAllMocks() })

  const SECTIONS = {
    summary: "QA automatization.",
    workExperience: [{
      id: "patito", jobTitle: "Quality automatization", employer: "Patito SA",
      description: "• Participé en la automatización de QA para nuevos features\n• Elaboré matrices de test para productos de apps",
    }],
    skills: [{ name: "Selenium" }],
  }
  const JD = "QA Automation Engineer: suites automatizadas, CI/CD, Selenium, regresión, criterios de aceptación. ".repeat(2)

  it("drops the third-person rewrite and keeps the first-person one", async () => {
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({
      summary: null,
      experiences: [{ targetId: "patito", jobTitle: "Quality automatization", employer: "Patito SA", changedBullets: [
        { index: 0, text: "• Definió el alcance y los criterios de prueba para nuevos features antes del ciclo de desarrollo." },
        { index: 1, text: "• Elaboré matrices de test con criterios de aceptación y trazabilidad a requisitos para cada funcionalidad." },
      ] }],
      missingSkills: [], softSkillSuggestions: [],
    })))
    const r = await new AIService({ chat, embed: vi.fn() } as IAIClient, logger)
      .tailorCV("u1", { sectionData: SECTIONS, jobDescription: JD, language: "es" }, "PRO")

    const kept = r.experiences.flatMap((e) => e.changedBullets.map((b) => b.text))
    expect(kept).toHaveLength(1)
    expect(kept[0]).toContain("Elaboré")
  })
})
