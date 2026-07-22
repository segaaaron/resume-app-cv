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
