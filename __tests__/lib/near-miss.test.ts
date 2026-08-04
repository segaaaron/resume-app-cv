import { describe, it, expect } from "vitest"
import { findNearMisses } from "@/lib/ats/near-miss"

describe("findNearMisses", () => {
  it("catches real-world typos that break exact ATS matching", () => {
    const cv = "Built apps with React Navite and GrahpQL on Objetive-C. Analystical thinking."
    const jd = ["React Native", "GraphQL", "Objective-C", "Analytical thinking"]
    const res = findNearMisses(jd, cv)
    const byKeyword = Object.fromEntries(res.map((r) => [r.keyword, r.typed.toLowerCase()]))
    expect(byKeyword["React Native"]).toContain("navite")
    expect(byKeyword["GraphQL"]).toContain("grahpql")
    expect(byKeyword["Objective-C"]).toContain("objetive-c")
    expect(byKeyword["Analytical thinking"]).toContain("analystical")
  })

  it("does NOT flag a keyword the CV spells correctly", () => {
    const cv = "Expert in React Native and GraphQL."
    expect(findNearMisses(["React Native", "GraphQL"], cv)).toEqual([])
  })

  it("does NOT flag a different, real skill as a typo (Vue vs Vuex, Java vs JavaScript)", () => {
    const cv = "Strong with Vuex and JavaScript."
    // "Vue" and "Java" are close by edit distance but are distinct real skills.
    const res = findNearMisses(["Vue", "Java"], cv)
    expect(res).toEqual([])
  })

  it("does NOT flag a subset phrase (React vs React Native) as a typo", () => {
    const cv = "Built with React Native across the app."
    // "React" is present as a token, so it must not be reported missing/typo'd.
    expect(findNearMisses(["React"], cv)).toEqual([])
  })

  it("skips very short keywords where one edit is a different word", () => {
    const cv = "Worked with Go and R."
    expect(findNearMisses(["Java", "AWS"], cv)).toEqual([])
  })

  it("caps the number of warnings", () => {
    const cv = "Reactt Angualr Vuee Sveltte Emberr Nextt Nuxtt Remixx"
    const jd = ["React", "Angular", "Vue", "Svelte", "Ember", "Next.js", "Nuxt", "Remix", "Astro"]
    expect(findNearMisses(jd, cv).length).toBeLessThanOrEqual(6)
  })
})
