import { describe, it, expect } from "vitest"
import { findProvenUnlistedSkills, MAX_PROVEN_SKILLS } from "@/lib/services/ai/shared/proven-skills"

describe("findProvenUnlistedSkills", () => {
  it("surfaces a skill proven in experience but not listed", () => {
    const exp = "Built the checkout SPA in React with TypeScript and Docker."
    const result = findProvenUnlistedSkills(exp, ["HTML", "CSS"])
    expect(result).toContain("React")
    expect(result).toContain("TypeScript")
    expect(result).toContain("Docker")
  })

  it("only suggests skills from the curated vocabulary, never loose words", () => {
    // "wrote tests" and "collaborated" are not vocabulary skills → nothing invented.
    const exp = "Wrote unit tests and collaborated closely with the design team."
    expect(findProvenUnlistedSkills(exp, [])).toEqual([])
  })

  it("does not suggest a skill already listed (alias-aware)", () => {
    const exp = "Developed features in React."
    // "React.js" listed should count as having react → no suggestion
    const result = findProvenUnlistedSkills(exp, ["React.js"])
    expect(result).not.toContain("React")
  })

  it("keeps the candidate's own casing", () => {
    const exp = "Configured the CI/CD pipeline and deployed with Docker."
    const result = findProvenUnlistedSkills(exp, [])
    expect(result).toContain("CI/CD")
    expect(result).toContain("Docker")
  })

  it("returns nothing when experience is empty", () => {
    expect(findProvenUnlistedSkills("", ["React"])).toEqual([])
  })

  it("returns nothing when everything proven is already listed", () => {
    const exp = "Worked with Python and SQL."
    expect(findProvenUnlistedSkills(exp, ["Python", "SQL"])).toEqual([])
  })

  it("does not invent skills absent from the text", () => {
    const exp = "Managed a team and coordinated schedules."
    const result = findProvenUnlistedSkills(exp, [])
    // No hard tech skill was mentioned, so none should be fabricated.
    expect(result).not.toContain("React")
    expect(result).not.toContain("Python")
  })

  it("dedupes a multi-word skill listed under a different spacing", () => {
    // The dictionary term is "react native"; a candidate may have typed it with
    // no space or a hyphen. All must still count as already listed.
    const exp = "Shipped an iOS app with React Native."
    expect(findProvenUnlistedSkills(exp, ["React Native"])).not.toContain("React Native")
    expect(findProvenUnlistedSkills(exp, ["ReactNative"])).not.toContain("React Native")
    expect(findProvenUnlistedSkills(exp, ["React-Native"])).not.toContain("React Native")
    expect(findProvenUnlistedSkills(exp, ["React.Native"])).not.toContain("React Native")
  })

  it("collapse dedupe is exact per token, never substring", () => {
    // Listing "Java" must NOT suppress "JavaScript" proven in the text.
    const exp = "Built the frontend in JavaScript."
    expect(findProvenUnlistedSkills(exp, ["Java"])).toContain("JavaScript")
  })

  it("dedupes a MISTYPED listed skill against the canonical spelling", () => {
    // The exact bug the CEO hit: "React Navite" (typo, distance 2 from "native")
    // must still suppress the "React Native" suggestion.
    const exp = "Shipped an iOS app with React Native."
    expect(findProvenUnlistedSkills(exp, ["React Navite"])).not.toContain("React Native")
    // A single transposition typo is caught too.
    const exp2 = "Backend built in Kotlin."
    expect(findProvenUnlistedSkills(exp2, ["Koltin"])).not.toContain("Kotlin")
  })

  it("typo tolerance never collides distinct skills (Java ≠ JavaScript)", () => {
    // Length gap keeps them apart — listing one must not suppress the other.
    expect(findProvenUnlistedSkills("Built the frontend in JavaScript.", ["Java"])).toContain("JavaScript")
    // Short tokens (<6 chars) are exempt from fuzzy matching entirely.
    expect(findProvenUnlistedSkills("Wrote services in Go.", ["Ru"])).toContain("Go")
  })

  it("caps the number of suggestions", () => {
    const exp = "Used JavaScript TypeScript Python Java Go Rust Ruby PHP Swift Kotlin React Angular Vue."
    const result = findProvenUnlistedSkills(exp, [])
    expect(result.length).toBeLessThanOrEqual(MAX_PROVEN_SKILLS)
  })
})
