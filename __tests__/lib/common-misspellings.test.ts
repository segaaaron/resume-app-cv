import { describe, it, expect } from "vitest"
import { findMisspellings } from "@/lib/ats/common-misspellings"

describe("findMisspellings", () => {
  it("catches a common English misspelling", () => {
    const r = findMisspellings("Responsible for managment of the team.")
    expect(r).toEqual([{ typed: "managment", correct: "management" }])
  })

  it("catches a common Spanish misspelling", () => {
    const r = findMisspellings("Adjunto mi corriculum actualizado.")
    expect(r).toEqual([{ typed: "corriculum", correct: "currículum" }])
  })

  it("case-matches the correction to the token", () => {
    expect(findMisspellings("Managment skills")[0].correct).toBe("Management")
    expect(findMisspellings("RECIEVED an award")[0].correct).toBe("RECEIVED")
    expect(findMisspellings("i recieved it")[0].correct).toBe("received")
  })

  it("dedupes a repeated misspelling (first case wins)", () => {
    const r = findMisspellings("recieve and recieve again")
    expect(r).toHaveLength(1)
    expect(r[0]).toEqual({ typed: "recieve", correct: "receive" })
  })

  it("finds several distinct misspellings", () => {
    const r = findMisspellings("Enviroment, developement and experiance.")
    // First word is sentence-capitalized, so its fix is Title-cased too.
    expect(r.map((m) => m.correct.toLowerCase()).sort()).toEqual(["development", "environment", "experience"])
  })

  it("never flags correct words, proper nouns or tech terms", () => {
    expect(findMisspellings("Built a GraphQL API on Kubernetes with strong management skills.")).toEqual([])
    expect(findMisspellings("Currículum profesional con experiencia en desarrollo de software.")).toEqual([])
  })

  it("does not match inside a larger word (whole-word only)", () => {
    // "managments" is not a key; only the exact word "managment" is flagged.
    expect(findMisspellings("premanagment")).toEqual([])
  })

  it("returns nothing on empty or clean input", () => {
    expect(findMisspellings("")).toEqual([])
    expect(findMisspellings("A clean sentence with no errors.")).toEqual([])
  })
})

describe("findMisspellings — short transpositions", () => {
  it("catches the 3-letter typo the nspell layer cannot see", () => {
    // Reported from a real CV: "iOS Developer with moe then 7 years…". The
    // dictionary layer skips anything under 4 letters, so this read as clean.
    const r = findMisspellings("iOS Developer with moe then 7 years of experience")
    expect(r).toEqual([{ typed: "moe", correct: "more" }])
  })

  it("catches the usual transpositions", () => {
    expect(findMisspellings("teh taht wiht thsi jsut waht").map((m) => m.correct))
      .toEqual(["the", "that", "with", "this", "just", "what"])
  })

  it("leaves a capitalised proper noun alone", () => {
    // "Moe" mid-sentence is a surname, not a typo.
    expect(findMisspellings("Reported to Moe Johnson at Acme.")).toEqual([])
    expect(findMisspellings("Worked with Woh Industries.")).toEqual([])
  })

  it("still reports a capitalised misspelling that is not a name", () => {
    // The proper-noun guard is narrow on purpose: it must not silence a real
    // misspelling that happens to start a bullet.
    expect(findMisspellings("Managment of a team of 8.")).toEqual([
      { typed: "Managment", correct: "Management" },
    ])
  })

  it("does not flag tech abbreviations the dictionaries also fail", () => {
    // The reason the nspell threshold stays at 4: these are unknown to both
    // dictionaries and one edit from a real word.
    expect(findMisspellings("aws dev api npm ios sql css git jwt crm")).toEqual([])
  })
})
