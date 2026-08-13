import { describe, it, expect } from "vitest"
import { isKnownSkill, ATS_SKILLS } from "@/lib/ats/skills-dictionary"
import { SKILL_CATALOG, displaySkill, filterSkills } from "@/lib/ats/skill-catalog"

/**
 * Measured before the batch was written: Product was missing 21 of 30 terms and
 * Agile 15 of 20 — the two worst-covered disciplines in the dictionary, while iOS
 * was missing 2 of 44. A whole profession's vocabulary was invisible to the
 * matcher, so a Product Owner's CV could not match a Product Owner posting.
 */
describe("the disciplines that were missing", () => {
  it.each([
    ["agile", ["sprint planning", "daily standup", "sprint retrospective", "backlog grooming", "story points", "burndown chart", "definition of done", "user stories", "acceptance criteria", "agile coaching"]],
    ["product", ["product management", "product ownership", "product roadmap", "product discovery", "competitive analysis", "customer journey mapping", "funnel analysis", "cohort analysis", "go-to-market", "user personas"]],
    ["backend", ["event-driven architecture", "api gateway", "message queue", "rate limiting", "connection pooling", "database sharding", "idempotency", "circuit breaker"]],
    ["graphic design", ["adobe indesign", "adobe after effects", "editorial design", "print production", "vector illustration", "photo retouching", "brand identity", "storyboarding"]],
    ["qa", ["manual testing", "smoke testing", "performance testing", "test cases", "test plan", "bug tracking"]],
  ])("%s vocabulary is known", (_n, terms) => {
    for (const t of terms) expect(isKnownSkill(t)).toBe(true)
  })

  it("answers in Spanish too — the half of the userbase that writes it that way", () => {
    for (const t of [
      "planificacion de sprint", "retrospectiva", "historias de usuario", "criterios de aceptacion",
      "gestion de producto", "hoja de ruta del producto", "analisis de cohortes", "entrevistas con usuarios",
      "cola de mensajes", "escalado horizontal", "diseno editorial", "retoque fotografico", "pruebas manuales",
    ]) {
      expect(isKnownSkill(t)).toBe(true)
    }
  })

  it("finds them with accents, the way people actually type", () => {
    for (const t of ["planificación de sprint", "análisis de cohortes", "diseño editorial", "retoque fotográfico"]) {
      expect(isKnownSkill(t)).toBe(true)
    }
  })
})

/**
 * The rule this dictionary has already paid for twice: it is scanned against CV
 * PROSE, so a term that is also an ordinary word tags people who never claimed the
 * skill. Each of these enters ONLY in an unambiguous form.
 */
describe("words that must never enter bare", () => {
  const byNorm = new Set(SKILL_CATALOG.map((o) => o.norm))

  it.each([
    ["rice", "a staple food in half the world's CVs", "rice prioritization"],
    ["moscow", "a city somebody worked in", "moscow prioritization"],
    ["safe", "one of the commonest words in English", "scaled agile framework"],
    ["velocity", "an ordinary noun", "sprint velocity"],
    ["tca", "the tricarboxylic acid cycle in a biochemistry CV", "the composable architecture"],
  ])("%s stays out (%s) but %s is known", (bare, _why, qualified) => {
    expect(byNorm.has(bare)).toBe(false)
    expect(isKnownSkill(qualified)).toBe(true)
  })

  it("keeps the exclusions the dictionary already learned", () => {
    for (const w of ["room", "gin", "fiber", "bun", "coil", "glide", "expo", "vault", "epic"]) {
      expect(byNorm.has(w)).toBe(false)
    }
  })

  // A title is not a skill. Offering a Product Owner their own job title as a chip
  // to add is the same noise as a degree sitting in the Skills list.
  it("adds the ability, not the job title", () => {
    const terms = new Set(ATS_SKILLS.map((s) => s.term))
    expect(terms.has("product management")).toBe(true)
    expect(terms.has("product ownership")).toBe(true)
    expect(terms.has("product manager")).toBe(false)
    expect(terms.has("product owner")).toBe(false)
  })
})

describe("the batch did not break the dictionary", () => {
  it("has no duplicate canonical terms", () => {
    const terms = ATS_SKILLS.map((s) => s.term)
    expect(new Set(terms).size).toBe(terms.length)
  })

  it("every entry has a category and a non-empty term", () => {
    for (const s of ATS_SKILLS) {
      expect(s.term.trim().length).toBeGreaterThan(0)
      expect(s.category).toBeTruthy()
    }
  })
})

/**
 * The chip the user taps writes this exact string into their CV, so a brand whose
 * casing the title-caser cannot infer ships wrong. The batch produced "Adobe
 * Indesign", "Api Gateway", "Mvp Definition" and "Jetpack Datastore" before this.
 */
describe("the new entries display the way the brand spells itself", () => {
  it.each([
    ["adobe indesign", "Adobe InDesign"],
    ["adobe after effects", "Adobe After Effects"],
    ["api gateway", "API Gateway"],
    ["mvp definition", "MVP Definition"],
    ["jetpack datastore", "Jetpack DataStore"],
    ["azure devops", "Azure DevOps"],
    ["go-to-market", "Go-to-Market"],
    ["ceremonias agiles", "Ceremonias Ágiles"],
  ])("%s → %s", (term, expected) => {
    expect(displaySkill(term)).toBe(expected)
  })

  // The qualified forms carry the acronym the user is actually looking for, so
  // "SAFe" and "TCA" are visible on screen even though neither may enter bare.
  it("shows the acronym the excluded bare word would have been", () => {
    expect(displaySkill("scaled agile framework")).toContain("SAFe")
    expect(displaySkill("the composable architecture")).toContain("TCA")
    expect(displaySkill("rice prioritization")).toContain("RICE")
    expect(displaySkill("moscow prioritization")).toContain("MoSCoW")
  })
})

/**
 * Typing is the only interface the user has to this dictionary. Entries that exist
 * but cannot be found are the same as entries that do not exist — which is the
 * complaint that started this batch.
 */
describe("what you type finds what you meant", () => {
  it.each([
    ["swiftui", "SwiftUI"],
    ["uikit", "UIKit"],
    ["xctest", "XCTest"],
    ["jetpack", "Jetpack Compose"],
    ["sprint", "Sprint Planning"],
    ["backlog", "Backlog Grooming"],
    ["cohort", "Cohort Analysis"],
    ["funnel", "Funnel Analysis"],
    ["indesign", "Adobe InDesign"],
    ["editorial", "Editorial Design"],
    ["retoque", "Photo Retouching"],
    ["sharding", "Database Sharding"],
    ["smoke", "Smoke Testing"],
    ["vector data", "Vector Database"],
  ])("typing %s offers %s", (query, expected) => {
    expect(filterSkills(query, 6).matches.map((m) => m.display)).toContain(expected)
  })
})
