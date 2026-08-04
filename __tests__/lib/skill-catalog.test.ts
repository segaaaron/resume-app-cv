import { describe, it, expect } from "vitest"
import { displaySkill, filterSkills, SKILL_CATALOG } from "@/lib/ats/skill-catalog"

describe("displaySkill — casing", () => {
  it("fixes acronyms/brands the title-case fallback gets wrong", () => {
    expect(displaySkill("aws certified")).toBe("AWS Certified")
    expect(displaySkill("b2b")).toBe("B2B")
    expect(displaySkill("b2c sales")).toBe("B2C Sales")
    expect(displaySkill("bamboohr")).toBe("BambooHR")
    expect(displaySkill("bigquery")).toBe("BigQuery")
    expect(displaySkill("adobe xd")).toBe("Adobe XD")
    expect(displaySkill("graphql")).toBe("GraphQL")
  })
  it("title-cases plain terms", () => {
    expect(displaySkill("project management")).toBe("Project Management")
  })
})

describe("filterSkills — autocomplete search", () => {
  it("returns empty for an empty query (dropdown closed)", () => {
    expect(filterSkills("")).toEqual({ matches: [], fuzzy: false })
  })

  it("ranks prefix matches above mid-string matches", () => {
    const { matches, fuzzy } = filterSkills("java")
    expect(fuzzy).toBe(false)
    // "Java"/"JavaScript" (prefix) must come before something that only contains 'java'
    expect(matches[0].display.toLowerCase().startsWith("java")).toBe(true)
  })

  it("caps the number of results", () => {
    expect(filterSkills("a", 8).matches.length).toBeLessThanOrEqual(8)
  })

  it("falls back to fuzzy 'did you mean' for a typo", () => {
    const { matches, fuzzy } = filterSkills("graphq")
    // 'graphq' is a prefix of 'graphql' → still a direct match, not fuzzy.
    expect(matches.some((m) => m.display === "GraphQL")).toBe(true)
    expect(fuzzy).toBe(false)
  })

  it("uses fuzzy when there is no substring match at all", () => {
    const { matches, fuzzy } = filterSkills("kubernets") // typo of kubernetes
    expect(fuzzy).toBe(true)
    expect(matches.some((m) => m.display.toLowerCase().includes("kubernetes"))).toBe(true)
  })

  it("every catalog option carries a friendly category label", () => {
    expect(SKILL_CATALOG.length).toBeGreaterThan(200)
    expect(SKILL_CATALOG.every((o) => o.categoryLabel.length > 0)).toBe(true)
  })

  it("includes the 2026 technical batch, correctly cased and searchable", () => {
    const byNorm = new Map(SKILL_CATALOG.map((o) => [o.norm, o.display]))
    // A sample across the added domains — present + cased right.
    expect(byNorm.get("langchain")).toBe("LangChain")
    expect(byNorm.get("jest")).toBe("Jest")
    expect(byNorm.get("cypress")).toBe("Cypress")
    expect(byNorm.get("rxswift")).toBe("RxSwift")
    expect(byNorm.get("power bi")).toBe("Power BI")
    expect(byNorm.get("argocd")).toBe("ArgoCD")
    // And they surface in autocomplete.
    expect(filterSkills("langch").matches.some((m) => m.display === "LangChain")).toBe(true)
    expect(filterSkills("cypre").matches.some((m) => m.display === "Cypress")).toBe(true)
  })

  it("includes native iOS/Android/backend tooling, cased right", () => {
    const byNorm = new Map(SKILL_CATALOG.map((o) => [o.norm, o.display]))
    expect(byNorm.get("swift package manager")).toBe("Swift Package Manager")
    expect(byNorm.get("core ml")).toBe("Core ML")
    expect(byNorm.get("arkit")).toBe("ARKit")
    expect(byNorm.get("android sdk")).toBe("Android SDK")
    expect(byNorm.get("retrofit")).toBe("Retrofit")
    expect(byNorm.get("hilt")).toBe("Hilt")
    expect(byNorm.get("sqlalchemy")).toBe("SQLAlchemy")
    // "spm" alias resolves to Swift Package Manager in the ATS matcher.
    expect(filterSkills("swift pack").matches.some((m) => m.display === "Swift Package Manager")).toBe(true)
  })

  it("excludes common words that would false-match the ATS matcher (whole-word)", () => {
    // These read as normal prose ("meeting room", "gin/bun" in a culinary CV,
    // "AC coil/fiber" for a technician) → they must NOT be skills.
    const byNorm = new Map(SKILL_CATALOG.map((o) => [o.norm, true]))
    for (const w of ["room", "gin", "fiber", "bun", "coil", "glide", "expo", "vault", "epic"]) {
      expect(byNorm.has(w)).toBe(false)
    }
  })
})
