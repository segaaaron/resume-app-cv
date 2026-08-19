import { describe, it, expect, vi, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { buildModePrompt } from "@/lib/services/ai/modules/profile-modes"
import { AIService } from "@/lib/services/ai/AIService"
import type { IAIClient, ChatCompletion } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

/**
 * The assistant writes most of the bullets in this product now, and for a while
 * it was the only writer exempt from the product's own rules.
 *
 * Reported from a real CV (QA automation, skills: Selenium, Cypress, Playwright,
 * JUnit, TestNG, CI/CD): every bullet came back naming generic nouns of the
 * trade — "matrices de test", "criterios de aceptación" — and not one tool. The
 * prompt could not have done better. It was handed the role and one sentence, so
 * it did not know which tools were his, and the never-invent rule forbade naming
 * a brand out of nowhere. Two halves of one hole: it could not name a tool, and
 * it did not know his.
 */
vi.mock("@/lib/ai-client", async (orig) => {
  const actual = await orig<typeof import("@/lib/ai-client")>()
  return {
    ...actual,
    AI_MODEL: "gpt-5.4-nano", AI_MODEL_PROSE: "gpt-5.4-mini",
    checkRateLimit: vi.fn().mockResolvedValue(true),
    checkAndIncrementRateLimit: vi.fn().mockResolvedValue(true),
    checkAndIncrementAIQuota: vi.fn().mockResolvedValue({ allowed: true }),
    recordRateLimitUsage: vi.fn(), logAIUsage: vi.fn(),
  }
})
vi.mock("@/lib/db", () => ({ db: { resume: { findFirst: vi.fn() }, auditLog: { create: vi.fn() } } }))
vi.mock("@/lib/ai-safety", () => ({ validateAIInput: vi.fn().mockReturnValue({ valid: true }) }))
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/services/ai/shared/clean-output", () => ({ cleanGeneratedText: vi.fn(async (t: string[]) => t) }))

// Deliberately names that appear NOWHERE in any prompt text. The first version
// of this test asserted on "Selenium", which the doctrine happened to use as an
// example — so it passed with the candidate's skills disconnected entirely.
// Caught by breaking the code on purpose.
const SKILLS = {
  skills: [{ id: "s0", name: "Katalon Studio" }, { id: "s1", name: "Appium" }, { id: "s2", name: "SonarQube" }],
}

describe("the assistant is told what the candidate already declared", () => {
  it("puts their own skills in the bullets prompt, in both languages", () => {
    for (const lang of ["es", "en"]) {
      const { system } = buildModePrompt("bullets", "QA: hice pruebas automatizadas", lang, SKILLS)
      expect(system, lang).toContain("Katalon Studio")
      expect(system, lang).toContain("Appium")
      expect(system, lang).toContain("SonarQube")
    }
  })

  it("says nothing about declared tools when the candidate listed none", () => {
    const { system } = buildModePrompt("bullets", "Cajera: hice el arqueo", "es", { skills: [] })
    expect(system).not.toMatch(/YA DECLARÓ|ALREADY DECLARED/)
  })

  /**
   * The ban is on a brand the candidate never mentioned — not on the tool they
   * put in their own skills list. Suppressing that one removes the exact keyword
   * an ATS searches for.
   */
  it("still forbids inventing a brand they never named", () => {
    const { system } = buildModePrompt("bullets", "Cajera: hice el arqueo", "es", SKILLS)
    expect(system).toMatch(/NO HAYA DECLARADO/)
  })

  /**
   * These bullets are prose that lands in the CV. Measured on the extraction
   * model: two mangled Spanish verb forms in four rounds ("Cobra o a las
   * clientas", "definid criterios"), both made of real words, so no spellchecker
   * catches them.
   */
  it("declares that the bullets are prose, so the caller uses the prose model", () => {
    expect(buildModePrompt("bullets", "QA: pruebas", "es", SKILLS).writesProse).toBe(true)
    // The other two modes emit a job title and short labels, not sentences.
    expect(buildModePrompt("seed", "Cajera", "es").writesProse).toBeUndefined()
    expect(buildModePrompt("certifications", "Cajera", "es").writesProse).toBeUndefined()
  })

  /**
   * These prompts are pure text and must stay loadable without a database. The
   * first version of the model override imported the model constant here, which
   * pulled in `ai-client` and through it `lib/db` — and `profile-modes.test.ts`
   * stopped loading entirely, taking its whole file out of the run.
   */
  it("stays free of the client and its database", () => {
    const src = readFileSync(join(process.cwd(), "lib/services/ai/modules/profile-modes.ts"), "utf8")
    expect(src).not.toMatch(/from "@\/lib\/ai-client"/)
    expect(src).not.toMatch(/from "@\/lib\/db"/)
  })
})

function completion(content: string): ChatCompletion {
  return {
    id: "t", object: "chat.completion", created: 0, model: "gpt-5.4-mini",
    choices: [{ index: 0, message: { role: "assistant", content, refusal: null }, finish_reason: "stop", logprobs: null }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  } as ChatCompletion
}

describe("the assistant's bullets answer to the same checker as every other bullet", () => {
  let logger: ILogger
  beforeEach(() => { logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }; vi.clearAllMocks() })

  /**
   * "Participé en la automatización de QA…" reached a real CV. "participé en"
   * has been on WEAK_OPENERS all along — nothing checked the assistant's output
   * against it.
   */
  it("retries once when a bullet opens with a duty phrase, and keeps the second answer", async () => {
    const weak = JSON.stringify({ bullets: ["Participé en la automatización de QA para nuevos features"] })
    const strong = JSON.stringify({ bullets: ["Automaticé la regresión de la app en Selenium, integrada al pipeline de CI"] })
    let call = 0
    const chat = vi.fn().mockImplementation(() => Promise.resolve(completion(++call === 1 ? weak : strong)))
    const r = await new AIService({ chat, embed: vi.fn() } as IAIClient, logger)
      .fillProfile("u1", { mode: "bullets", prompt: "QA: hice pruebas", sectionData: SKILLS, language: "es" }, "PRO")

    expect(chat.mock.calls.length).toBe(2)
    expect(r.bullets?.[0]).toContain("Automaticé")
    // The retry REPORTS the defect and quotes the line; it adds no new rule.
    const second = String(chat.mock.calls[1]?.[0]?.messages?.[1]?.content ?? "")
    expect(second).toMatch(/frase de tarea|duty phrase/)
    expect(second).toContain("Participé en")
  })

  it("does not spend a second call when the first answer is clean", async () => {
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({
      bullets: ["Automaticé la regresión de la app en Selenium, integrada al pipeline de CI"],
    })))
    await new AIService({ chat, embed: vi.fn() } as IAIClient, logger)
      .fillProfile("u1", { mode: "bullets", prompt: "QA: hice pruebas", sectionData: SKILLS, language: "es" }, "PRO")

    expect(chat.mock.calls.length).toBe(1)
  })

  /**
   * Never two retries: a second duty opener on the same input means the prompt
   * has stopped working, and the user still gets an answer rather than an error.
   */
  it("returns the second answer even if it is still weak, instead of failing", async () => {
    const weak = JSON.stringify({ bullets: ["Participé en la automatización de QA"] })
    const chat = vi.fn().mockResolvedValue(completion(weak))
    const r = await new AIService({ chat, embed: vi.fn() } as IAIClient, logger)
      .fillProfile("u1", { mode: "bullets", prompt: "QA: hice pruebas", sectionData: SKILLS, language: "es" }, "PRO")

    expect(chat.mock.calls.length).toBe(2)
    expect(r.bullets?.length).toBe(1)
  })
})
