import { describe, it, expect } from "vitest"
import { categoryOfSkill, displaySkill, filterSkills, SKILL_CATALOG } from "@/lib/skills/skill-catalog"

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

describe("filterSkills — the entry you typed is IN the catalog", () => {
  it("offers the exact match first instead of hiding it", () => {
    // Reported from a real iOS CV: typing "swift" answered only "Swift Package
    // Manager"/"SwiftUI", which reads as "Swift itself is not in your base".
    const { matches } = filterSkills("swift")
    expect(matches[0]?.display).toBe("Swift")
    expect(filterSkills("uikit").matches[0]?.display).toBe("UIKit")
  })

  it("finds an entry by the acronym the user actually types", () => {
    // The acronym lives in `aliases`, which the search used to ignore, so "PWA"
    // and "GCD" returned nothing at all.
    expect(filterSkills("pwa").matches[0]?.display).toBe("Progressive Web Apps")
    expect(filterSkills("gcd").matches[0]?.display).toBe("Grand Central Dispatch")
    expect(filterSkills("kmp").matches[0]?.display).toBe("Kotlin Multiplatform")
  })

  it("does not let a mid-string alias hit leak in", () => {
    // "ios" sits inside the alias "microservicios" — prefix/exact only on aliases.
    expect(filterSkills("ios").matches.map((m) => m.display)).not.toContain("Microservices")
  })
})

describe("dictionary coverage — what a real CV names", () => {
  const known = (t: string) => SKILL_CATALOG.some((o) => o.norm === t || o.aliases.includes(t))
  it.each([
    "uikit", "swiftui", "core data", "core location", "grand central dispatch", "urlsession",
    "xcuitest", "app store connect", "in-app purchases", "swift concurrency", "tvos",
    "room database", "okhttp", "kotlin flow", "rxjava", "proguard", "kotlin multiplatform",
    "webassembly", "service workers", "core web vitals", "trpc",
    "penetration testing", "owasp", "iso 27001", "zero trust",
    "test automation", "appium", "jmeter", "load testing",
    "site reliability engineering", "pulumi", "observability",
  ])("knows %s", (t) => expect(known(t)).toBe(true))

  it.each(["room", "glide", "expo", "less", "recoil", "unity", "metal", "vault", "epic"])(
    "keeps the ordinary word %s OUT of the dictionary",
    // These are scanned against the CV's own prose by proven-skills, so an
    // ordinary word here produces "you already proved this" about a meeting
    // room or a trade fair. They enter only in an unambiguous form.
    (t) => expect(SKILL_CATALOG.some((o) => o.norm === t)).toBe(false),
  )
})

describe("dictionary coverage — the CV is not always in English, or about tech", () => {
  const known = (t: string) => SKILL_CATALOG.some((o) => o.norm === t || o.aliases.includes(t))

  it.each([
    "patient education", "venipuncture", "discharge planning", "intensive care",
    "curriculum design", "early childhood education", "montessori",
    "accounts payable", "reconciliation", "tax preparation", "cash flow management",
    "plumbing", "carpentry", "preventive maintenance", "heavy machinery",
    "bartending", "catering", "front desk", "menu planning",
    "employee relations", "data entry", "calendar management", "minute taking",
    "ux research", "user testing",
  ])("knows the non-tech skill %s", (t) => expect(known(t)).toBe(true))

  it.each([
    "signos vitales", "cuidado de heridas", "atencion al paciente", "historia clinica",
    "planificacion de clases", "gestion del aula", "gestion de inventario",
    "servicio al cliente", "atencion al cliente", "soldadura", "primeros auxilios",
    "manejo de caja", "facturacion", "cobranzas", "docencia", "seguridad industrial",
    "atencion telefonica", "nomina", "auditoria",
  ])("finds %s written in Spanish, with or without accents", (t) => expect(known(t)).toBe(true))
})

describe("QA regressions — accents in the display layer", () => {
  it("does not upper-case the letter after an accent", () => {
    // \b\w treats "ó" as a non-word char, so the old regex produced
    // "AtencióN Al Paciente" — and the ATS add-skill button wrote it INTO the CV.
    expect(displaySkill("atención al paciente")).toBe("Atención al Paciente")
    expect(displaySkill("gestión de proyectos")).toBe("Gestión de Proyectos")
    expect(displaySkill("comunicación")).toBe("Comunicación")
  })

  it("keeps the field category for a skill written in Spanish", () => {
    // categoryOfSkill only knew canonical terms, so a CV listed entirely in
    // Spanish gave the autocomplete no field signal at all.
    expect(categoryOfSkill("atención al paciente")).toBe("healthcare")
    expect(categoryOfSkill("gestion de inventario")).toBe("operations")
    expect(categoryOfSkill("soldadura")).toBe("operations")
  })
})
