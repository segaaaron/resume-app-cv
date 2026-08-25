import { describe, it, expect, vi, beforeEach } from "vitest"

// Isolate the module from quota/db and cost logging.
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/ai-client", () => ({
  AI_MODEL: "gpt-4o-mini",
  AI_MODEL_PROSE: "gpt-x-prose",
  AI_TEMPERATURE_PRECISE: 0.1,
  logAIUsage: vi.fn(),
}))

import { AITranslateModule } from "@/lib/services/ai/modules/AITranslateModule"
import { ResumeSectionsSchema } from "@/types/resume"

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

/** Parses the batch the module sent and returns a canned "translation". */
function extractItems(messages: Array<{ role: string; content: string }>): Array<{ i: number; s: string }> {
  const user = messages.find((m) => m.role === "user")!
  return JSON.parse(user.content).items
}

function reply(t: Array<{ i: number; v: string }>) {
  return {
    choices: [{ message: { content: JSON.stringify({ t }) } }],
    usage: { prompt_tokens: 10, completion_tokens: 10 },
  }
}

const baseInput = () =>
  ResumeSectionsSchema.parse({
    summary: "Resumen profesional",
    workExperience: [{ id: "w1", employer: "Acme", jobTitle: "Desarrollador", description: "• Hice cosas" }],
  }) as unknown as Record<string, unknown>

describe("AITranslateModule.translateCV", () => {
  beforeEach(() => vi.clearAllMocks())

  it("maps translations back by index and preserves proper nouns / structure", async () => {
    const chat = vi.fn(async ({ messages }: { messages: Array<{ role: string; content: string }> }) => {
      const items = extractItems(messages)
      return reply(items.map((it) => ({ i: it.i, v: `EN(${it.s})` })))
    })
    const mod = new AITranslateModule({ chat } as never, logger as never)

    const res = await mod.translateCV("u1", { sectionData: baseInput(), sectionLabels: ["Experiencia"], targetLang: "en" }, "PRO")
    const data = res.sectionData as ReturnType<typeof ResumeSectionsSchema.parse>

    expect(data.summary).toBe("EN(Resumen profesional)")
    expect(data.workExperience[0].jobTitle).toBe("EN(Desarrollador)")
    expect(data.workExperience[0].description).toBe("EN(• Hice cosas)")
    // proper noun + id untouched
    expect(data.workExperience[0].employer).toBe("Acme")
    expect(data.workExperience[0].id).toBe("w1")
    // label translated
    expect(res.sectionLabels).toEqual(["EN(Experiencia)"])
    expect(res.targetLang).toBe("en")
  })

  it("falls back to the original text when the model drops an index", async () => {
    // Return a translation for index 0 only; everything else must survive verbatim.
    const chat = vi.fn(async ({ messages }: { messages: Array<{ role: string; content: string }> }) => {
      const items = extractItems(messages)
      const first = items[0]
      return reply([{ i: first.i, v: `EN(${first.s})` }])
    })
    const mod = new AITranslateModule({ chat } as never, logger as never)

    const res = await mod.translateCV("u1", { sectionData: baseInput(), targetLang: "en" }, "PRO")
    const data = res.sectionData as ReturnType<typeof ResumeSectionsSchema.parse>

    // exactly one field translated; the rest keep their Spanish originals
    const translatedCount = [data.summary, data.workExperience[0].jobTitle, data.workExperience[0].description]
      .filter((v) => v.startsWith("EN(")).length
    expect(translatedCount).toBe(1)
    expect(data.workExperience[0].employer).toBe("Acme")
  })

  it("leaves an oversized field in its original language instead of truncating it", async () => {
    const huge = "• " + "palabra ".repeat(4000) // > 6000 chars
    const input = ResumeSectionsSchema.parse({
      summary: "Resumen corto",
      workExperience: [{ id: "w1", employer: "Acme", jobTitle: "Dev", description: huge }],
    }) as unknown as Record<string, unknown>

    const chat = vi.fn(async ({ messages }: { messages: Array<{ role: string; content: string }> }) => {
      const items = extractItems(messages)
      return reply(items.map((it) => ({ i: it.i, v: `EN(${it.s})` })))
    })
    const mod = new AITranslateModule({ chat } as never, logger as never)

    const res = await mod.translateCV("u1", { sectionData: input, targetLang: "en" }, "PRO")
    const data = res.sectionData as ReturnType<typeof ResumeSectionsSchema.parse>

    // short field translated, oversized description preserved verbatim (no loss)
    expect(data.summary).toBe("EN(Resumen corto)")
    expect(data.workExperience[0].description).toBe(huge)
  })

  it("no-ops on an empty resume (nothing to translate)", async () => {
    const chat = vi.fn()
    const mod = new AITranslateModule({ chat } as never, logger as never)

    const res = await mod.translateCV("u1", { sectionData: ResumeSectionsSchema.parse({}) as unknown as Record<string, unknown>, targetLang: "en" }, "PRO")
    expect(res.translatedCount).toBe(0)
    expect(chat).not.toHaveBeenCalled()
  })

  it("throws only on a TOTAL service failure so no untranslated copy is persisted", async () => {
    const chat = vi.fn().mockRejectedValue(new Error("boom"))
    const mod = new AITranslateModule({ chat } as never, logger as never)

    // Every batch (and every split-retry) fails → nothing translated → must surface
    // as an error, NEVER silently return originals. The route relies on this to
    // avoid creating a copy that looks translated but isn't (which would block retry).
    await expect(
      mod.translateCV("u1", { sectionData: baseInput(), targetLang: "en" }, "PRO"),
    ).rejects.toThrow("translate_service_error")
    expect(logger.warn).toHaveBeenCalled()
  })

  it("self-heals a whole-batch failure by splitting and retrying smaller", async () => {
    // Simulate the truncation failure mode: a multi-item batch blows up, but each
    // item translates fine on its own. Split-and-retry must recover the FULL CV.
    const chat = vi.fn(async ({ messages }: { messages: Array<{ role: string; content: string }> }) => {
      const items = extractItems(messages)
      if (items.length > 1) throw new Error("output truncated / unparseable JSON")
      return reply(items.map((it) => ({ i: it.i, v: `EN(${it.s})` })))
    })
    const mod = new AITranslateModule({ chat } as never, logger as never)

    const res = await mod.translateCV("u1", { sectionData: baseInput(), targetLang: "en" }, "PRO")
    const data = res.sectionData as ReturnType<typeof ResumeSectionsSchema.parse>

    // Every segment ended up translated despite the initial batch failure.
    expect(data.summary).toBe("EN(Resumen profesional)")
    expect(data.workExperience[0].jobTitle).toBe("EN(Desarrollador)")
    expect(data.workExperience[0].description).toBe("EN(• Hice cosas)")
  })
})
