import { describe, it, expect } from "vitest"
import { canonicalSkillName } from "@/lib/ats/skill-catalog"

/**
 * Taxonomy alignment, and the two ways it goes wrong.
 *
 * An ATS normalizes the résumé onto a canonical vocabulary; our 1,002 curated
 * terms are that vocabulary, so writing a skill the way the catalog writes it is
 * free on the parsers with an LLM layer and decisive on the older ones that
 * still token-match literal strings.
 *
 * Both failure modes below were caught by tests, not by reading the code.
 */
describe("canonicalSkillName", () => {
  it("fixes the spelling of a name the catalog knows", () => {
    expect(canonicalSkillName("reactjs")).toBe("React")
    expect(canonicalSkillName("postgres")).toBe("PostgreSQL")
    expect(canonicalSkillName("git")).toBe("Git")
  })

  it("returns null for a skill the catalog has never heard of", () => {
    // Kept by the caller, not dropped: 1,002 terms do not cover every trade, and
    // discarding the unknown is how a suggestion list ends up able to propose
    // only what we already thought of.
    expect(canonicalSkillName("manejo de guadaña")).toBeNull()
    expect(canonicalSkillName("herrería artesanal")).toBeNull()
  })

  /**
   * The catalog's display form is English and its aliases hold the Spanish
   * terms, so matching on any alias handed a Spanish CV an English skills
   * section.
   */
  it("never translates", () => {
    expect(canonicalSkillName("manejo de efectivo")).toBeNull()
    expect(canonicalSkillName("atencion al cliente")).toBeNull()
    expect(canonicalSkillName("trabajo en equipo")).toBeNull()
  })

  /**
   * "REST APIs" is an alias of the "REST" entry. A loose substring rule
   * shortened it to "REST" and threw away the half a job posting actually
   * writes.
   */
  it("never shortens a phrase to its first term", () => {
    expect(canonicalSkillName("REST APIs")).not.toBe("REST")
    expect(canonicalSkillName("Google Tag Manager")).not.toBe("Google")
  })
})
