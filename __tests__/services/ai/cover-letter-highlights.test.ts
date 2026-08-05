import { describe, it, expect, vi, beforeEach } from "vitest"

// Same isolation as cover-letter-generate-guard: no quota, no db, no cost. The
// résumé context is empty so the prompt only carries what the input provided.
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/ai-client", () => ({
  AI_MODEL_PROSE: "gpt-prose",
  AI_TEMPERATURE_STRUCTURED: 0.3,
  buildResumeContext: () => "",
  logAIUsage: vi.fn(),
}))
vi.mock("@/lib/db", () => ({ db: { resume: { findFirst: vi.fn() } } }))

import { AICoverLetterModule } from "@/lib/services/ai/modules/AICoverLetterModule"
import { db } from "@/lib/db"

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

const CLEAN_BODY =
  "I have followed your payments work for a while and would like to build it with you.\n\nGlad to walk you through the details."

function client() {
  const chat = vi.fn(async () => ({
    choices: [{ message: { content: JSON.stringify({ body: CLEAN_BODY }) } }],
    usage: { prompt_tokens: 10, completion_tokens: 10 },
  }))
  return { client: { chat } as never, chat }
}

/** The user prompt string the module actually sent to the model. */
function sentPrompt(chat: { mock: { calls: unknown[][] } }): string {
  const call = chat.mock.calls[0]?.[0] as { messages: { role: string; content: string }[] } | undefined
  if (!call) throw new Error("chat() was never called")
  return call.messages.map((m) => m.content).join("\n")
}

const base = { company: "Acme", jobTitle: "Engineer", tone: "balanced", language: "en" as const }

describe("generateCoverLetter — structured candidate input", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sends the three answers labelled, so each one lands in its own paragraph", async () => {
    const { client: c, chat } = client()
    const mod = new AICoverLetterModule(c, logger as never)
    await mod.generateCoverLetter(
      "u1",
      {
        ...base,
        highlights: {
          motivation: "I have used your app for two years",
          achievement: "Migrated the iOS app to SwiftUI in four months",
          fit: "Seven years on iOS and led a team of three",
        },
      },
      "PRO"
    )
    const prompt = sentPrompt(chat)
    expect(prompt).toContain("CANDIDATE'S OWN WORDS")
    expect(prompt).toContain("Why this company/role: I have used your app for two years")
    expect(prompt).toContain("Most relevant achievement: Migrated the iOS app to SwiftUI in four months")
    expect(prompt).toContain("What they bring to the role: Seven years on iOS and led a team of three")
    // The routing instruction is the whole point of asking three questions.
    expect(prompt).toContain("motivation for paragraph 1")
  })

  it("omits the questions left blank instead of sending empty labels", async () => {
    const { client: c, chat } = client()
    const mod = new AICoverLetterModule(c, logger as never)
    await mod.generateCoverLetter(
      "u1",
      { ...base, highlights: { motivation: "Your LATAM payments work", achievement: "", fit: "   " } },
      "PRO"
    )
    const prompt = sentPrompt(chat)
    expect(prompt).toContain("Why this company/role: Your LATAM payments work")
    expect(prompt).not.toContain("Most relevant achievement:")
    expect(prompt).not.toContain("What they bring to the role:")
  })

  it("writes the block in Spanish when the letter is Spanish", async () => {
    const { client: c, chat } = client()
    const mod = new AICoverLetterModule(c, logger as never)
    await mod.generateCoverLetter(
      "u1",
      { ...base, language: "es", highlights: { motivation: "Sigo su trabajo en pagos", achievement: "Reduje los crashes al 0,4%" } },
      "PRO"
    )
    const prompt = sentPrompt(chat)
    expect(prompt).toContain("PALABRAS DEL PROPIO CANDIDATO")
    expect(prompt).toContain("Por qué esta empresa/puesto: Sigo su trabajo en pagos")
    expect(prompt).toContain("Logro más relevante: Reduje los crashes al 0,4%")
  })

  it("falls back to the free-text prompt when no question was answered", async () => {
    const { client: c, chat } = client()
    const mod = new AICoverLetterModule(c, logger as never)
    await mod.generateCoverLetter(
      "u1",
      { ...base, userPrompt: "iOS developer with seven years of experience", highlights: {} },
      "PRO"
    )
    const prompt = sentPrompt(chat)
    expect(prompt).toContain("CANDIDATE DESCRIPTION")
    expect(prompt).toContain("iOS developer with seven years of experience")
    expect(prompt).not.toContain("CANDIDATE'S OWN WORDS")
  })

  it("keeps the answers as grounding — a figure the candidate gave is not an invention", async () => {
    const chat = vi.fn(async () => ({
      choices: [{ message: { content: JSON.stringify({ body: "I cut crashes from 3% to 0.4% on the iOS app.\n\nHappy to share the details." }) } }],
      usage: { prompt_tokens: 10, completion_tokens: 10 },
    }))
    const mod = new AICoverLetterModule({ chat } as never, logger as never)
    const res = await mod.generateCoverLetter(
      "u1",
      { ...base, highlights: { achievement: "Cut crashes from 3% to 0.4% on the iOS app" } },
      "PRO"
    )
    // One call: the anti-invention retry must NOT fire on the user's own number.
    expect(chat).toHaveBeenCalledTimes(1)
    expect(res.body).toContain("0.4%")
  })

  it("rejects an answer longer than the server limit", async () => {
    const { client: c } = client()
    const mod = new AICoverLetterModule(c, logger as never)
    await expect(
      mod.generateCoverLetter("u1", { ...base, highlights: { motivation: "a".repeat(401) } }, "PRO")
    ).rejects.toMatchObject({ code: "invalid_input" })
  })
})

describe("generateCoverLetter — letter language follows the résumé", () => {
  beforeEach(() => vi.clearAllMocks())

  it("writes in English for an English résumé even when the app is in Spanish", async () => {
    vi.mocked(db.resume.findFirst).mockResolvedValue({
      personalDetails: {
        summary:
          "Software engineer with experience in the development of projects and the management of teams for the company.",
      },
    } as never)
    const { client: c, chat } = client()
    const mod = new AICoverLetterModule(c, logger as never)
    await mod.generateCoverLetter("u1", { ...base, language: "es", resumeId: "r1" }, "PRO")
    const prompt = sentPrompt(chat)
    expect(prompt).toContain("=== TARGET POSITION ===")
    expect(prompt).not.toContain("=== PUESTO OBJETIVO ===")
  })

  it("keeps the caller's language when the résumé is too thin to judge", async () => {
    vi.mocked(db.resume.findFirst).mockResolvedValue({ personalDetails: { summary: "Dev" } } as never)
    const { client: c, chat } = client()
    const mod = new AICoverLetterModule(c, logger as never)
    await mod.generateCoverLetter("u1", { ...base, language: "es", resumeId: "r1" }, "PRO")
    expect(sentPrompt(chat)).toContain("=== PUESTO OBJETIVO ===")
  })
})

describe("improveCoverLetter — rewrite follows the letter's own language", () => {
  beforeEach(() => vi.clearAllMocks())

  const EN_LETTER =
    "<p>I am writing about the backend role at your company, and the work your team does on the payments platform is the reason I want to join.</p>" +
    "<p>In the last two years I have led the migration of the checkout service and mentored the two engineers who own it today.</p>"

  function versionsClient() {
    const chat = vi.fn(async () => ({
      choices: [{ message: { content: JSON.stringify({ versions: ["Version one text.", "Version two text.", "Version three text."] }) } }],
      usage: { prompt_tokens: 10, completion_tokens: 10 },
    }))
    return { client: { chat } as never, chat }
  }

  it("rewrites an English letter in English even when the app is in Spanish", async () => {
    const { client: c, chat } = versionsClient()
    const mod = new AICoverLetterModule(c, logger as never)
    await mod.improveCoverLetter("u1", { body: EN_LETTER, language: "es" }, "PRO")
    expect(chat).toHaveBeenCalled()
    const prompt = sentPrompt(chat)
    // English prompt for an English letter, even though the caller said "es".
    expect(prompt).toContain("CRITICAL ANTI-HALLUCINATION RULES")
    expect(prompt).not.toContain("REGLAS CRÍTICAS")
  })
})
