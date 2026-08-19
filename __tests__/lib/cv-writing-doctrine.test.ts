import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cvValueBar, neverInventRule, proseRules, alreadyGoodRule, cvWritingDoctrine } from "@/lib/services/ai/shared/cv-writing-doctrine"

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
    for (const part of [cvValueBar, neverInventRule, proseRules, alreadyGoodRule]) {
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
    const users = [
      "lib/services/ai/modules/profile-modes.ts",
      "lib/services/ai/modules/AISummaryModule.ts",
      // The four the bar reached on 2026-08-19, each measured against the live API
      // before and after. Listed by name so cutting one is a red test, not a quiet
      // regression back to every endpoint having its own idea of "good".
      "lib/services/ai/modules/AITailorModule.ts",
      "lib/services/ai/modules/AIReviewModule.ts",
      "lib/services/ai/modules/AICoverLetterModule.ts",
    ]
    for (const path of users) {
      const src = readFileSync(join(process.cwd(), path), "utf8")
      expect(src, path).toContain("cv-writing-doctrine")
      // And in both branches, not just the Spanish one.
      expect(src, `${path} es`).toMatch(/cvValueBar\("es"\)|cvValueBar\(language\)/)
      expect(src, `${path} en`).toMatch(/cvValueBar\("en"\)|cvValueBar\(language\)/)
    }
  })

  /**
   * The measured failure this closed: tailor-cv returned changedBullets: [] for
   * five of eight résumés whose every bullet was three words, because its prompt
   * said a bullet with a strong action verb is already good. "Soldé piezas."
   * clears that test and says nothing. There is now ONE definition of "already
   * good", it is the bar, and the two surfaces that decide whether to touch the
   * candidate's text must not carry their own.
   */
  it("defines 'already good' by the bar, and says a strong verb is not enough", () => {
    expect(alreadyGoodRule("es")).toMatch(/verbo de apertura fuerte NO hace buena/i)
    expect(alreadyGoodRule("en")).toMatch(/strong opening verb does NOT make a line good/i)
  })

  it("keeps the deciding surfaces from re-inventing 'already good'", () => {
    for (const path of ["lib/services/ai/modules/AITailorModule.ts", "lib/services/ai/modules/AIReviewModule.ts"]) {
      const src = readFileSync(join(process.cwd(), path), "utf8")
      // As a CALL in BOTH branches, not as a mention: checked the import only,
      // this passed with the rule deleted from the Spanish prompt — the import
      // line kept the name alive. Verified by breaking it on purpose.
      expect(src, `${path} es`).toMatch(/alreadyGoodRule\("es"\)|alreadyGoodRule\(language\)/)
      expect(src, `${path} en`).toMatch(/alreadyGoodRule\("en"\)|alreadyGoodRule\(language\)/)
      // The exact wording that made the model decline to rewrite a worthless line.
      expect(src, `${path} must not redefine it`).not.toMatch(/already good if it has|ya tiene verbo de acción fuerte y es relevante/)
    }
  })

  /**
   * The letter is prose, not a bullet list. `proseRules` describes how a CV line
   * opens and how long it runs; pasting it into the letter prompt would fight the
   * paragraph structure that prompt already specifies. Recorded so "apply the
   * doctrine everywhere" does not later get read as "apply all three parts".
   */
  it("gives the cover letter the content rules and not the bullet form rules", () => {
    const src = readFileSync(join(process.cwd(), "lib/services/ai/modules/AICoverLetterModule.ts"), "utf8")
    expect(src).toContain("cvValueBar")
    expect(src).toContain("neverInventRule")
    // Checked as a CALL, not as a mention: the module's own comment explains why
    // the form rules are excluded, and a substring match would fail on the reason.
    expect(src).not.toMatch(/proseRules\(/)
  })

  /**
   * The rule lived only inside the assistant's own prompt, so every other
   * surface was free to break it — and tailor did, on a real CV.
   */
  it("asks for first person, and names the third-person form it must not use", () => {
    expect(proseRules("es")).toMatch(/PRIMERA persona/)
    expect(proseRules("es")).toMatch(/NUNCA la forma -ó/)
    expect(proseRules("en")).toMatch(/FIRST PERSON/)
  })

  /**
   * The banned duty openers are QUOTED from the list the code enforces, so a
   * phrase can only be added in one place. They had already drifted: the
   * checker flagged "Participé en" and the doctrine never mentioned it, which is
   * how "Participé en la automatización de QA…" reached a real CV.
   */
  it("quotes the duty openers from the list the checker uses", () => {
    expect(proseRules("es")).toContain("Participé en")
    expect(proseRules("en")).toContain("Participated in")
    // Each language quotes its own half — an English phrase in the Spanish
    // prompt teaches nothing, and a regex split put one there once.
    expect(proseRules("es")).not.toContain("Responsible for")
    expect(proseRules("en")).not.toContain("Responsable de")
  })

  it("records that it names no profession as a condition", () => {
    // Trades appear only as examples of the principle. None may act as a gate:
    // the product serves any profession, and that is checked here and measured
    // live across 12 trades in two languages.
    expect(DOCTRINE).not.toMatch(/only for|solo para|únicamente para/i)
  })
})
