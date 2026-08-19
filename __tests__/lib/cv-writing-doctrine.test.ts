import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cvValueBar, neverInventRule, proseRules, cvWritingDoctrine } from "@/lib/services/ai/shared/cv-writing-doctrine"

/**
 * One bar for every AI surface, and it must not drift.
 *
 * Each endpoint used to carry its own idea of "good", and the weakest one set
 * the floor: the assistant answered "Realicé arqueo." — the user's own three
 * words tidied up — for a bank cashier. Nobody pays an AI to reorganise the
 * sentence they just typed.
 *
 * What can be tested here is the CONTRACT: that the bar exists in both
 * languages, that it draws the line in the same place on both sides, and that
 * the prompts actually use it. Whether the model clears the bar is measured
 * against the live API, and those numbers live in the module's header.
 */
const DOCTRINE = readFileSync(join(process.cwd(), "lib/services/ai/shared/cv-writing-doctrine.ts"), "utf8")
const LANGS = ["es", "en"] as const

describe("the CV-writing bar", () => {
  it("exists in both languages, and they are different texts", () => {
    for (const part of [cvValueBar, neverInventRule, proseRules]) {
      const es = part("es")
      const en = part("en")
      expect(es.length).toBeGreaterThan(300)
      expect(en.length).toBeGreaterThan(300)
      expect(es).not.toBe(en)
    }
  })

  /**
   * The promise the product makes about what it will not put on a CV. It is the
   * same list in both languages by design — a rule present in one branch is a
   * behaviour the other language never gets, and the English CV is the one read
   * in the markets this targets.
   */
  it("forbids the same six things on both sides", () => {
    const checks: [RegExp, RegExp][] = [
      [/cifras|porcentajes/i, /figures|percentages/i],
      [/empleadores/i, /employers/i],
      [/marca/i, /brand/i],
      [/resultados o logros/i, /results or achievements/i],
      [/certificaciones/i, /certifications/i],
      [/jerarquía|lideré/i, /seniority|led/i],
    ]
    const es = neverInventRule("es")
    const en = neverInventRule("en")
    for (const [reEs, reEn] of checks) {
      expect(es, `es: ${reEs}`).toMatch(reEs)
      expect(en, `en: ${reEn}`).toMatch(reEn)
    }
  })

  /**
   * The measured failure this fixed: a hairdresser's till was being reconciled
   * "before the accounting close" because the prompt's example came from
   * banking. The bar names the danger explicitly now, in both languages.
   */
  it("warns against borrowing another trade's vocabulary", () => {
    expect(cvValueBar("es")).toMatch(/peluquería|soldador/i)
    expect(cvValueBar("en")).toMatch(/hairdresser|welder/i)
  })

  it("asks for one tense, in both languages", () => {
    expect(proseRules("es")).toMatch(/UN SOLO tiempo verbal/)
    expect(proseRules("en")).toMatch(/ONE tense/)
  })

  it("bans the phrases that mark text as machine-written", () => {
    for (const lang of LANGS) {
      const rules = proseRules(lang)
      expect(rules.toLowerCase()).toContain(lang === "es" ? "sinergia" : "synergy")
    }
  })

  it("composes into one doctrine that carries all three parts", () => {
    for (const lang of LANGS) {
      const all = cvWritingDoctrine(lang)
      expect(all).toContain(cvValueBar(lang))
      expect(all).toContain(neverInventRule(lang))
      expect(all).toContain(proseRules(lang))
    }
  })

  /**
   * A shared bar that nobody imports is a document, not a rule. This reads the
   * source so the link cannot be quietly cut.
   */
  it("is actually used by the prompts that write résumé prose", () => {
    const users = ["lib/services/ai/modules/profile-modes.ts", "lib/services/ai/modules/AISummaryModule.ts"]
    for (const path of users) {
      const src = readFileSync(join(process.cwd(), path), "utf8")
      expect(src, path).toContain("cv-writing-doctrine")
      // And in both branches, not just the Spanish one.
      expect(src, `${path} es`).toMatch(/cvValueBar\("es"\)|cvValueBar\(language\)/)
      expect(src, `${path} en`).toMatch(/cvValueBar\("en"\)|cvValueBar\(language\)/)
    }
  })

  it("records that it names no profession as a condition", () => {
    // Trades appear only as examples of the principle. None may act as a gate:
    // the product serves any profession, and that is checked here and measured
    // live across 12 trades in two languages.
    expect(DOCTRINE).not.toMatch(/only for|solo para|únicamente para/i)
  })
})
