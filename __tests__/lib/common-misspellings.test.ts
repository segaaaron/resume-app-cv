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
