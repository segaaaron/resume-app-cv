import { describe, it, expect } from "vitest"
import { filterVisibleMissingSkills } from "@/components/editor/tailor-dedupe"

describe("filterVisibleMissingSkills — Tailor never repeats what the ATS already showed", () => {
  it("hides a Tailor skill the ATS listed under a different spelling", () => {
    // ATS above shows "React.js"; Tailor returns "React" → same skill, one chip.
    expect(filterVisibleMissingSkills(["React"], [], ["React.js"])).toEqual([])
    expect(filterVisibleMissingSkills(["node"], [], ["Node.js"])).toEqual([])
    expect(filterVisibleMissingSkills(["Postgres"], [], ["PostgreSQL"])).toEqual([])
  })

  it("hides alias/expansion pairs, not just punctuation variants", () => {
    expect(filterVisibleMissingSkills(["AWS"], [], ["Amazon Web Services"])).toEqual([])
    expect(filterVisibleMissingSkills(["CI/CD"], [], ["continuous integration"])).toEqual([])
  })

  it("hides a skill the user already owns, even under a different spelling", () => {
    expect(filterVisibleMissingSkills(["React"], ["react.js"], [])).toEqual([])
  })

  it("keeps a genuinely new skill the ATS did not mention", () => {
    expect(filterVisibleMissingSkills(["Kubernetes"], [], ["React.js"])).toEqual(["Kubernetes"])
  })

  it("is case- and accent-insensitive", () => {
    expect(filterVisibleMissingSkills(["Liderazgo"], [], ["leadership"])).toEqual([])
  })

  it("drops empty/whitespace suggestions", () => {
    expect(filterVisibleMissingSkills(["", "  "], [], [])).toEqual([])
  })

  it("keeps distinct skills untouched", () => {
    expect(
      filterVisibleMissingSkills(["Kubernetes", "GraphQL"], [], ["React.js"]),
    ).toEqual(["Kubernetes", "GraphQL"])
  })
})
