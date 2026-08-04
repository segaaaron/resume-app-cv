import { describe, it, expect } from "vitest"
import { replaceWord } from "@/lib/ats/apply-spelling"

describe("replaceWord — the 'Fix typo' engine", () => {
  it("corrects real-world resume typos", () => {
    expect(replaceWord("Skilled in GrahpQL and REST", "GrahpQL", "GraphQL")).toBe("Skilled in GraphQL and REST")
    expect(replaceWord("Built with React Navite here", "React Navite", "React Native")).toBe("Built with React Native here")
    expect(replaceWord("Worked on Objetive-C Core Data", "Objetive-C", "Objective-C")).toBe("Worked on Objective-C Core Data")
    expect(replaceWord("Analystical thinking", "Analystical", "Analytical")).toBe("Analytical thinking")
  })

  it("is case-insensitive but keeps the correct term's casing", () => {
    expect(replaceWord("uses grahpql daily", "GrahpQL", "GraphQL")).toBe("uses GraphQL daily")
  })

  it("never matches mid-word (no partial replacement)", () => {
    expect(replaceWord("ObjetiveCoding is fine", "Objetive-C", "Objective-C")).toBe("ObjetiveCoding is fine")
  })

  it("leaves already-correct text untouched", () => {
    expect(replaceWord("I use GraphQL already", "GrahpQL", "GraphQL")).toBe("I use GraphQL already")
  })

  it("replaces every occurrence", () => {
    expect(replaceWord("GrahpQL and more GrahpQL", "GrahpQL", "GraphQL")).toBe("GraphQL and more GraphQL")
  })

  it("no-ops on empty input", () => {
    expect(replaceWord("", "a", "b")).toBe("")
    expect(replaceWord("text", "  ", "b")).toBe("text")
  })
})
