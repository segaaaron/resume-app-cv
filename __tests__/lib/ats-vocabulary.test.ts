import { describe, it, expect } from "vitest"
import { normalizeTerm, expandTerm, termPresent, VOCABULARY_SIZE } from "@/lib/ats/vocabulary"

describe("normalizeTerm", () => {
  it("lowercases and strips accents", () => {
    expect(normalizeTerm("Gestión DE Proyectos")).toBe("gestion de proyectos")
  })

  it("keeps the characters that make a skill name itself", () => {
    expect(normalizeTerm("C++")).toBe("c++")
    expect(normalizeTerm("C#")).toBe("c#")
    expect(normalizeTerm("Node.js")).toBe("node.js")
    expect(normalizeTerm("CI/CD")).toBe("ci/cd")
  })
})

describe("expandTerm — the dictionary the paid matcher used to ignore", () => {
  // These are the exact misses that motivated this module: the aliases already
  // existed in skills-dictionary.ts, and ats-matcher.ts never read it.
  it("knows the acronyms its own 13-group table lacked", () => {
    expect(expandTerm("aws")).toContain("amazon web services")
    expect(expandTerm("gcp")).toContain("google cloud")
  })

  it("bridges Spanish and English", () => {
    expect(expandTerm("liderazgo")).toContain("leadership")
    expect(expandTerm("gestion de proyectos")).toContain("project management")
    expect(expandTerm("trabajo en equipo")).toContain("teamwork")
  })

  it("is symmetric — either side finds the other", () => {
    expect(expandTerm("leadership")).toContain("liderazgo")
    expect(expandTerm("js")).toContain("javascript")
    expect(expandTerm("javascript")).toContain("js")
  })

  it("returns an unknown term as itself, so it still matches literally", () => {
    expect(expandTerm("Kubeflow Pipelines")).toEqual(["kubeflow pipelines"])
  })

  it("returns nothing for empty input", () => {
    expect(expandTerm("")).toEqual([])
    expect(expandTerm("   ")).toEqual([])
  })

  it("carries the whole dictionary, not a handful of aliases", () => {
    expect(VOCABULARY_SIZE).toBeGreaterThan(200)
  })
})

describe("termPresent", () => {
  it("finds a skill through its alias", () => {
    expect(termPresent("Amazon Web Services", "5 years on aws building services")).toBe(true)
    expect(termPresent("AWS", "deployed to amazon web services")).toBe(true)
  })

  it("finds an English requirement in a Spanish CV", () => {
    expect(termPresent("Leadership", "liderazgo de equipos de 5 personas")).toBe(true)
    expect(termPresent("Project Management", "gestion de proyectos en agile")).toBe(true)
  })

  it("respects word boundaries", () => {
    expect(termPresent("Java", "senior javascript developer")).toBe(false)
    expect(termPresent("Java", "backend in java and kotlin")).toBe(true)
  })

  // \b treats + and # as boundaries, so a naive \b regex matches "c++" inside a
  // bare "c" and vice versa. This is why the boundary is hand-rolled.
  it("does not confuse c, c++ and c#", () => {
    expect(termPresent("C++", "wrote c++ for embedded targets")).toBe(true)
    expect(termPresent("C++", "wrote c for embedded targets")).toBe(false)
    expect(termPresent("C#", "built services in c# and .net")).toBe(true)
  })

  it("does not match a term that is absent", () => {
    expect(termPresent("Kubernetes", "docker and terraform")).toBe(false)
  })

  it("finds k8s written either way", () => {
    expect(termPresent("Kubernetes", "ran workloads on k8s")).toBe(true)
    expect(termPresent("k8s", "ran workloads on kubernetes")).toBe(true)
  })

  // Regression: the ATS used to flag these as "missing" even when the CV had
  // them phrased differently (order, plural, or the other language).
  it("matches REST across order/plural/phrasing", () => {
    const cv = "built rest apis and restful services"
    expect(termPresent("APIs REST", cv)).toBe(true)
    expect(termPresent("REST API", cv)).toBe(true)
    expect(termPresent("RESTful", cv)).toBe(true)
  })

  it("bridges Clean Architecture es↔en", () => {
    expect(termPresent("Clean Architecture", "diseñé con arquitectura limpia")).toBe(true)
    expect(termPresent("Arquitectura Limpia", "designed using clean architecture")).toBe(true)
  })

  it("matches Async/Await and XCTest variants", () => {
    expect(termPresent("Async/Await", "used async await extensively")).toBe(true)
    expect(termPresent("XCTest", "wrote tests with xctest")).toBe(true)
    expect(termPresent("XCTest", "coverage via xctests")).toBe(true)
  })
})

describe("bilingual vocabulary beyond engineering", () => {
  // Measured before adding these: 10 of 16 common pairs were unknown, and the
  // gaps were almost all non-tech. A nurse listing "Atención al paciente"
  // against an English posting was told "patient care" was missing — real ATS
  // points lost, and a duplicate offered as the fix. These serve every surface
  // at once: the matcher, the dedup, the proven-skills card and tailor.
  const PAIRS: Array<[string, string]> = [
    ["team leadership", "Liderazgo de equipos"],
    ["risk management", "Gestión de riesgos"],
    ["inventory management", "Control de inventarios"],
    ["patient care", "Atención al paciente"],
    ["lesson planning", "Planificación curricular"],
    ["contract drafting", "Redacción de contratos"],
    ["blueprint reading", "Lectura de planos"],
    ["food safety", "Manipulación de alimentos"],
    ["cost control", "Control de costos"],
    ["occupational safety", "Seguridad industrial"],
    ["medication administration", "Administración de medicamentos"],
    ["vital signs", "Signos vitales"],
    ["classroom management", "Manejo de aula"],
    ["labor law", "Derecho laboral"],
  ]

  it.each(PAIRS)("matches %s against its Spanish form", (en, es) => {
    expect(termPresent(en, normalizeTerm(es))).toBe(true)
  })

  it("does not collapse skills that merely look similar", () => {
    // The risk of adding equivalences is over-matching: two different skills
    // treated as one would silently inflate the score.
    expect(termPresent("patient care", normalizeTerm("Atención al cliente"))).toBe(false)
    expect(termPresent("team leadership", normalizeTerm("Gestión del tiempo"))).toBe(false)
    expect(termPresent("food safety", normalizeTerm("Seguridad industrial"))).toBe(false)
    expect(termPresent("cost control", normalizeTerm("Control de inventarios"))).toBe(false)
  })
})
