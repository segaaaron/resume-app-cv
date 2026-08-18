import { describe, it, expect } from "vitest"
import { isGroundedIn } from "@/lib/services/ai/shared/ai-helpers"

describe("isGroundedIn", () => {
  const PROMPT = "i worked at google as a backend dev for 3 years building apis"

  it("accepts a verbatim echo", () => {
    expect(isGroundedIn("backend dev", PROMPT)).toBe(true)
    expect(isGroundedIn("Google", PROMPT)).toBe(true)
  })

  // The reported failure: a plain substring check binned the model for
  // canonicalising the user's shorthand into the form a CV actually needs.
  it("accepts the canonical form of the user's shorthand", () => {
    expect(isGroundedIn("Backend Developer", PROMPT)).toBe(true)
  })

  it("accepts Spanish morphology", () => {
    const es = "trabajé en Google como ingeniero backend durante 3 años"
    expect(isGroundedIn("Ingeniería Backend", es)).toBe(true)
    expect(isGroundedIn("Ingeniero Backend", es)).toBe(true)
  })

  it("ignores stopwords when grounding", () => {
    expect(isGroundedIn("Developer at Google", PROMPT)).toBe(true)
  })

  it("rejects a role the user never mentioned", () => {
    expect(isGroundedIn("Product Manager", PROMPT)).toBe(false)
    expect(isGroundedIn("Data Scientist", PROMPT)).toBe(false)
  })

  it("rejects an employer the user never mentioned", () => {
    expect(isGroundedIn("Microsoft", PROMPT)).toBe(false)
  })

  // "dev" must ground "developer" but NOT "devops" — both are three-letter
  // prefixes, which is exactly why this uses an explicit alias list and not
  // prefix matching.
  it("does not ground a different role that merely shares a prefix", () => {
    expect(isGroundedIn("Devops Specialist", PROMPT)).toBe(false)
    expect(isGroundedIn("Device Engineer", PROMPT)).toBe(false)
  })

  it("rejects a partly-invented title", () => {
    // "backend" is grounded, "architect" is not — every significant word must be.
    expect(isGroundedIn("Backend Architect", PROMPT)).toBe(false)
  })

  it("rejects empty input", () => {
    expect(isGroundedIn("", PROMPT)).toBe(false)
    expect(isGroundedIn("   ", PROMPT)).toBe(false)
  })

  it("keeps dots and plus signs that carry meaning", () => {
    const p = "i write node.js and c++ every day"
    expect(isGroundedIn("Node.js", p)).toBe(true)
    expect(isGroundedIn("C++", p)).toBe(true)
  })

  // Real text from a real user, 2026-08-18. The prompts ORDER the model to write
  // the canonical spelling of a company so an ATS matches it exactly. It obeyed,
  // turned "banco mercanil" into "Banco Mercantil" — and exact-word grounding
  // then binned both jobs FOR OBEYING. The CV came back with a summary and a job
  // title and nothing else.
  describe("typos in the user's own text", () => {
    const TYPED =
      "soy administrador de empresas, con mas de 10 anos en el rubro, trabaje en el banco mercanil " +
      "en mayo del 2010, realize varias analisis de riesgo en carteras dfe clientes privados, tambien " +
      "trabaje en banco central de bolicia desde el octubre del 2015 realizando analisis de cartera"

    it("grounds the corrected spelling of what the user misspelled", () => {
      expect(isGroundedIn("Banco Mercantil", TYPED)).toBe(true)
      expect(isGroundedIn("Banco Central de Bolivia", TYPED)).toBe(true)
      expect(isGroundedIn("Administrador de Empresas", TYPED)).toBe(true)
    })

    it("still rejects an employer the user never named", () => {
      // "Banco" is in the text; "Santander" is not, and every word must match.
      expect(isGroundedIn("Banco Santander", TYPED)).toBe(false)
      expect(isGroundedIn("Google", TYPED)).toBe(false)
      expect(isGroundedIn("Microsoft", TYPED)).toBe(false)
      expect(isGroundedIn("Amazon Web Services", TYPED)).toBe(false)
      expect(isGroundedIn("Ingeniero de Software", TYPED)).toBe(false)
    })

    it("does not treat short lookalike words as the same word", () => {
      // One edit apart, but at three letters that is a different word.
      expect(isGroundedIn("car", "i have a cat")).toBe(false)
      expect(isGroundedIn("Sales", "i work in sale")).toBe(true)
    })
  })
})
