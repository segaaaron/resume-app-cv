import { describe, it, expect } from "vitest"
import { sameSoftRequirement } from "@/lib/ats/skill-dedup"

// The panel hides a soft requirement once the bullets demonstrate it. The posting
// and the tailor pass word the same requirement differently, so an exact match let
// it come straight back — which is the "the list only ever grows" report.
describe("sameSoftRequirement — one requirement, many phrasings", () => {
  it.each([
    ["Ownership", "Sense of ownership"],
    ["Ownership", "Takes ownership of features end to end"],
    ["Cross-Functional Collaboration", "Collaboration with cross-functional teams"],
    ["Comfortable Working With Ambiguity", "Comfortable with ambiguity"],
    ["Trabajo en equipo", "Capacidad de trabajo en equipo"],
    ["Resolución de problemas", "Habilidad para la resolución de problemas"],
  ])("same: %s ≡ %s", (a, b) => {
    expect(sameSoftRequirement(a, b)).toBe(true)
  })

  // The expensive error here is hiding a requirement the CV has NOT demonstrated.
  it.each([
    ["Ownership", "Product Sense"],
    ["Cross-Functional Collaboration", "Debug Production Issues"],
    ["Comfortable Working With Ambiguity", "Fast Execution Without Lowering The Bar"],
    ["Trabajo en equipo", "Atención al detalle"],
    ["UX Focus", "Cost Focus"],
  ])("different: %s ≠ %s", (a, b) => {
    expect(sameSoftRequirement(a, b)).toBe(false)
  })

  it("is symmetric", () => {
    expect(sameSoftRequirement("Ownership", "Sense of ownership")).toBe(
      sameSoftRequirement("Sense of ownership", "Ownership"),
    )
  })

  it("never matches on connective words alone", () => {
    expect(sameSoftRequirement("Ability to work with the team", "Ability to work with the data")).toBe(false)
  })

  it("handles empty input", () => {
    expect(sameSoftRequirement("", "Ownership")).toBe(false)
    expect(sameSoftRequirement("and the", "for you")).toBe(false)
  })
})
