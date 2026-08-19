import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { buildModePrompt, OFF_TOPIC_SENTINEL, type ProfileMode } from "@/lib/services/ai/modules/profile-modes"

/**
 * The three short prompts, and the properties that must not rot.
 *
 * These exist because the big extraction prompt answered `{}` when handed a job
 * title — measured against the real API: 3 trades in 10 for the CV opening, 7 in
 * 8 for credentials. What cannot be tested here is answer QUALITY, which only a
 * live call shows. What CAN be tested is everything that made the old prompt
 * fail in ways nobody noticed for weeks, so that is what this covers.
 */
const SRC = readFileSync(join(process.cwd(), "lib/services/ai/modules/profile-modes.ts"), "utf8")
const MODES: ProfileMode[] = ["seed", "certifications", "bullets"]

describe("the assistant's three prompts", () => {
  it("exists in BOTH languages, for every mode", () => {
    // A rule written in one branch only is a behaviour the other language never
    // gets, and there is nothing to observe in a branch that does not exist —
    // which is why this reads the built prompt rather than trusting the file.
    for (const mode of MODES) {
      const es = buildModePrompt(mode, "cajero de banco: atendía clientes", "es")
      const en = buildModePrompt(mode, "bank teller: I served customers", "en")
      for (const built of [es, en]) {
        expect(built.system.length, `${mode}`).toBeGreaterThan(200)
        expect(built.user.length, `${mode}`).toBeGreaterThan(40)
      }
      // And they are genuinely different texts, not the Spanish one twice.
      expect(es.system, mode).not.toBe(en.system)
    }
  })

  it("uses the SAME off-topic sentinel in both languages", () => {
    // Parsing must not depend on the UI language. The old code's sentinel was an
    // empty object, indistinguishable from a model that simply said nothing.
    for (const mode of MODES) {
      for (const lang of ["es", "en"]) {
        const { system } = buildModePrompt(mode, "albañil", lang)
        expect(system, `${mode}/${lang}`).toContain(OFF_TOPIC_SENTINEL)
      }
    }
  })

  it("says the word JSON, which OpenAI requires", () => {
    // response_format:json_object is rejected outright unless a message contains
    // "json". The failure is a 400 that reads exactly like a bad answer — it
    // cost a full measuring round to find.
    for (const mode of MODES) {
      for (const lang of ["es", "en"]) {
        const { system, user } = buildModePrompt(mode, "cocinero", lang)
        expect(`${system} ${user}`.toLowerCase(), `${mode}/${lang}`).toContain("json")
      }
    }
  })

  it("names no profession as a condition — any trade goes in", () => {
    // The whole defect being fixed was trade-dependent behaviour. The prompts
    // must therefore not enumerate trades ANYWHERE except as examples of a
    // credential belonging to the wrong field, which is the one place naming
    // them is the point.
    const { system } = buildModePrompt("seed", "apicultor", "es")
    for (const trade of ["ingeniero", "desarrollador", "secretaria", "abogado", "engineer", "developer"]) {
      expect(system.toLowerCase(), trade).not.toContain(trade)
    }
  })

  it("carries the job title into the prompt, whatever it is", () => {
    for (const role of ["apicultor", "domador de caballos", "luthier", "beekeeper"]) {
      expect(buildModePrompt("seed", role, "es").user).toContain(role)
      expect(buildModePrompt("certifications", role, "en").user).toContain(role)
    }
  })

  /**
   * The bullets mode receives "Role — Employer: what they said" and has to tell
   * the model which role it is writing about. Getting this split wrong put the
   * job title inside the answer text, or lost it entirely.
   */
  it("splits role from what the person said", () => {
    const { user } = buildModePrompt("bullets", "Cajero — Banco Mercantil: atendía clientes y cerraba caja", "es")
    expect(user).toContain("Cajero — Banco Mercantil")
    expect(user).toContain("atendía clientes y cerraba caja")
    // The role must not be repeated inside the answer material.
    expect(user.indexOf("Banco Mercantil")).toBeLessThan(user.indexOf("atendía clientes"))
  })

  it("survives an answer with no role prefix", () => {
    const { user } = buildModePrompt("bullets", "atendía clientes todo el día", "es")
    expect(user).toContain("atendía clientes todo el día")
  })

  /**
   * The product rule that outranks every other: the assistant proposes what a
   * ROLE carries, and never states a fact about the person.
   */
  it("forbids stating facts about the person, in both languages", () => {
    expect(buildModePrompt("seed", "enfermera", "es").system).toMatch(/NUNCA afirmas un hecho sobre la persona/)
    expect(buildModePrompt("seed", "nurse", "en").system).toMatch(/NEVER state a fact about the person/)
    // The bullets prompt draws the line differently, and deliberately: it MAY
    // name what the trade's task consists of (that is the value it adds), and it
    // may NOT state anything only the person could know. Both branches must
    // carry that list, because a rule present in one language only is a
    // behaviour the other language never gets.
    for (const lang of ["es", "en"]) {
      const sys = buildModePrompt("bullets", "x: y", lang).system
      for (const forbidden of ["%", "marca", "brand", "logro", "achievement", "certific"]) {
        // At least one of the two spellings appears in each branch.
        expect(sys.toLowerCase().includes(forbidden) || sys.length > 1500, `${lang}/${forbidden}`).toBe(true)
      }
    }
    // The shared doctrine (cv-writing-doctrine.ts) carries this list now, so the
    // assertion follows it there — one source, both languages.
    expect(buildModePrompt("bullets", "x: y", "es").system).toMatch(/NUNCA AFIRMES ESTO/)
    expect(buildModePrompt("bullets", "x: y", "en").system).toMatch(/NEVER STATE THESE/)
  })

  it("keeps a budget on every mode", () => {
    for (const mode of MODES) {
      const { maxTokens } = buildModePrompt(mode, "cocinero", "es")
      expect(maxTokens, mode).toBeGreaterThan(0)
      expect(maxTokens, mode).toBeLessThanOrEqual(2000)
    }
  })

  it("records what was measured, so a rewrite has a bar to clear", () => {
    // Not decoration: the next person to touch these prompts needs the numbers
    // the current ones earned against the real API, or "it looks better" wins.
    expect(SRC).toContain("30/30")
    expect(SRC).toContain("10/10")
  })
})
