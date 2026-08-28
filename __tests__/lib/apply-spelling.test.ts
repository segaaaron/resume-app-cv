import { describe, it, expect } from "vitest"
import { applySpellingFix, replaceWord } from "@/lib/spellcheck/apply-spelling"

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

describe("reach — the writer must cover everything the analyst may cite", () => {
  // Reported from the panel: the finding named a certification, the button was
  // drawn, and pressing it said the word was not in the CV. The validator walks
  // every string; this must not stop short of it.
  it("fixes a typo inside a certification name", () => {
    const { patch, changed } = applySpellingFix(
      { certifications: [{ id: "c1", name: "Concurrency IOS swith Swift (2025)", issuer: "" }] },
      "swith",
      "with",
    )
    expect(changed).toBe(true)
    expect((patch.certifications as { name: string }[])[0].name).toBe("Concurrency IOS with Swift (2025)")
  })

  it("reaches the issuer, a project name and a language", () => {
    const { patch } = applySpellingFix(
      {
        certifications: [{ id: "c1", name: "Scrum", issuer: "Scrum Aliance" }],
        projects: [{ id: "p1", name: "Inventory Managment Tool", role: "", description: "" }],
        languages: [{ id: "l1", name: "Portugese" }],
      },
      "Aliance",
      "Alliance",
    )
    expect((patch.certifications as { issuer: string }[])[0].issuer).toBe("Scrum Alliance")

    const two = applySpellingFix(
      { projects: [{ id: "p1", name: "Inventory Managment Tool", role: "", description: "" }] },
      "Managment",
      "Management",
    )
    expect((two.patch.projects as { name: string }[])[0].name).toBe("Inventory Management Tool")
  })

  it("still refuses to touch what nothing checks", () => {
    const { changed } = applySpellingFix(
      {
        workExperience: [{ id: "w1", employer: "Xiobit Solucions", jobTitle: "", description: "" }],
        personalDetails: { email: "mi@solucions.com" },
      },
      "Solucions",
      "Solutions",
    )
    // An employer name and an email address are the user's data, not our spelling.
    expect(changed).toBe(false)
  })
})
