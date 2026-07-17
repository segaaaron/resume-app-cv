import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/db", () => ({ db: {} }))

import { assessCoverLetter } from "@/lib/services/ai/shared/cover-letter-quality"
import { hasCliche, clicheBanList } from "@/lib/services/ai/shared/cliches"

// Concrete, quantified, cliché-free, four paragraphs. Rule 7 of the prompt calls
// this "already strong" — and the model said so 0 times in 3 runs.
const STRONG = [
  "Dear Ms. Vega,",
  "Northwind's posting mentions consolidating three payment services onto one platform. That is the same problem I spent 2023 solving at Acme.",
  "I led the billing migration off a legacy monolith and cut deploy time from 40 minutes to under 6. I rebuilt the mobile sync layer, dropping crash rates 20% across three releases, and mentored five engineers who were all promoted within 18 months.",
  "What I would bring is the part that is hard to hire for: I have already made this migration once, including the rollback plan nobody wants to write.",
  "I would welcome the chance to talk it through.",
].join("\n\n")

const CLICHED = [
  "Dear Hiring Manager,",
  "Northwind's payment platform work is exactly where I want to be next.",
  "I am a hard-working and passionate team player with a proven track record in software development.",
  "I would bring the same energy to your team.",
  "Thank you for your time.",
].join("\n\n")

const GENERIC_OPENER = [
  "Dear Hiring Manager,",
  "I am writing to apply for the platform engineer role at Northwind.",
  "I led the billing migration at Acme and cut deploy time from 40 minutes to under 6.",
  "I rebuilt the sync layer and dropped crash rates 20% across three releases.",
  "I would welcome the chance to talk.",
].join("\n\n")

describe("assessCoverLetter", () => {
  it("calls a concrete, quantified, cliché-free letter already good", () => {
    expect(assessCoverLetter(STRONG)).toEqual({ alreadyGood: true, issues: [] })
  })

  it("catches the filler the prompt bans", () => {
    expect(assessCoverLetter(CLICHED).issues).toContain("cliche")
  })

  it("catches the opener the prompt names by example", () => {
    expect(assessCoverLetter(GENERIC_OPENER).issues).toContain("generic_opener")
  })

  // "I am writing to..." three paragraphs in is a sentence, not a weak hook.
  it("only judges the opener at the opening", () => {
    const r = assessCoverLetter(STRONG.replace(
      "I would welcome the chance to talk it through.",
      "I am writing to confirm I can start in March.",
    ))
    expect(r.issues).not.toContain("generic_opener")
  })

  // Every letter opens with one; it is not the hook the rule is about.
  it("does not mistake the salutation for the hook", () => {
    expect(assessCoverLetter(STRONG).issues).not.toContain("generic_opener")
    expect(assessCoverLetter(STRONG).issues).not.toContain("thin_structure")
  })

  it("flags a letter with no structure to speak of", () => {
    expect(assessCoverLetter("Dear team,\n\nI would like the job.").issues).toContain("thin_structure")
  })

  it("counts the body, so a salutation cannot pass as a paragraph", () => {
    const three = "Dear team,\n\nOne real paragraph here.\n\nTwo real paragraphs here."
    expect(assessCoverLetter(three).issues).toContain("thin_structure")
  })

  // The one criterion assessSummary has that a letter must NOT inherit: a cover
  // letter is written in the first person, and copying the summary's check over
  // would have flagged every correct letter.
  it("does not object to the first person", () => {
    expect(assessCoverLetter(STRONG).alreadyGood).toBe(true)
    expect(STRONG).toMatch(/\bI\b/)
  })

  it("reads Spanish clichés too", () => {
    const es = [
      "Estimada Sra. Vega:",
      "Su oferta de plataforma de pagos es justo donde quiero estar.",
      "Soy una persona proactiva y con don de gentes, responsable de varios proyectos.",
      "Aportaría la misma energía a su equipo.",
      "Gracias por su tiempo.",
    ].join("\n\n")
    expect(assessCoverLetter(es).issues).toContain("cliche")
  })

  it("catches a Spanish generic opener", () => {
    const es = [
      "Estimada Sra. Vega:",
      "Me dirijo a usted para expresar mi interés en el puesto.",
      "Lideré la migración de facturación y bajé el deploy de 40 minutos a 6.",
      "Reconstruí la capa de sincronización, reduciendo los crashes un 20%.",
      "Gracias por su tiempo.",
    ].join("\n\n")
    expect(assessCoverLetter(es).issues).toContain("generic_opener")
  })

  it("survives empty input without throwing", () => {
    expect(assessCoverLetter("").alreadyGood).toBe(false)
  })
})

// The detector and the prompts drifted apart once: the list rejected phrases the
// prompt never mentioned, and the clichés that reached users were exactly those.
describe("cliches — one list, two readers", () => {
  it("bans in the prompt everything it rejects in the output", () => {
    for (const lang of ["en", "es"] as const) {
      const banned = clicheBanList(lang)
      const phrase = lang === "en" ? "proven track record" : "don de gentes"
      expect(hasCliche(`A candidate with a ${phrase} here`)).toBe(true)
      expect(banned.toLowerCase()).toContain(phrase)
    }
  })

  it("checks both languages whatever the document's own", () => {
    expect(hasCliche("Resumen en español de un passionate about developer")).toBe(true)
  })

  it("is case-insensitive", () => {
    expect(hasCliche("PROVEN TRACK RECORD")).toBe(true)
  })

  it("says nothing about text that carries no filler", () => {
    expect(hasCliche("Cut deploy time from 40 minutes to under 6 at Acme.")).toBe(false)
  })
})
