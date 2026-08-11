import { describe, it, expect } from "vitest"
import { findGrammarIssues } from "@/lib/ats/grammar-rules"

const typed = (texts: string[], lang: "es" | "en") =>
  findGrammarIssues(texts, lang).map((i) => i.typed)
const fixFor = (texts: string[], lang: "es" | "en", needle: string) =>
  findGrammarIssues(texts, lang).find((i) => i.typed.toLowerCase().includes(needle))?.suggestions[0]

describe("repeated words — both languages", () => {
  it("catches the repeat the model was being paid to find", () => {
    expect(typed(["Refactors resulting in in delays"], "en")).toEqual(["in in"])
    expect(typed(["Refactorizaciones resultando en en retrasos"], "es")).toEqual(["en en"])
  })

  it("fixes to a single word", () => {
    expect(fixFor(["resulting in in delays"], "en", "in in")).toBe("in")
  })

  it("leaves legitimate English doubles alone", () => {
    expect(typed(["The team had had two leads before me"], "en")).toEqual([])
  })

  it("ignores numbers and single letters", () => {
    expect(typed(["Scaled from 10 10 nodes and ran C C builds"], "en")).toEqual([])
  })

  it("does not join two separate bullets", () => {
    expect(typed(["Led the guild\nGuild of iOS engineers"], "en")).toEqual([])
  })

  it("catches an accented Spanish repeat", () => {
    expect(typed(["Diseñé más más de veinte pantallas"], "es")).toEqual(["más más"])
  })
})

describe("Spanish-only rules", () => {
  it("contracts a el / de el", () => {
    expect(typed(["Reporté a el gerente de el área"], "es")).toEqual(["a el", "de el"])
    expect(fixFor(["Reporté a el gerente"], "es", "a el")).toBe("al")
    expect(fixFor(["responsable de el área"], "es", "de el")).toBe("del")
  })

  it("leaves the accented pronoun alone — 'a él' is correct", () => {
    expect(typed(["El proyecto pasó a él y de él a mí"], "es")).toEqual([])
  })

  it("leaves a proper noun alone — 'de El Salvador' is not a contraction", () => {
    expect(typed(["Operaciones de El Salvador y de El Alto"], "es")).toEqual([])
  })

  it("accents 'mas' only in the quantity reading", () => {
    expect(typed(["Con mas de 7 años de experiencia"], "es")).toEqual(["mas"])
    expect(fixFor(["Con mas de 7 años"], "es", "mas")).toBe("más")
  })

  it("leaves 'mas' meaning 'pero' alone", () => {
    // A blanket rule here would flag correct Spanish prose.
    expect(typed(["Diseñé la interfaz, mas la migración quedó pendiente"], "es")).toEqual([])
  })

  it("does not apply Spanish rules to an English CV", () => {
    expect(typed(["Reported to el manager de el area"], "en")).toEqual([])
  })
})

describe("English-only rules", () => {
  it("catches the comparative confusables", () => {
    expect(typed(["More then 7 years, rather then less then five"], "en"))
      .toEqual(["More then", "rather then", "less then"])
  })

  it("keeps the writer's capitalisation", () => {
    expect(fixFor(["More then 7 years"], "en", "more then")).toBe("More than")
    expect(fixFor(["with more then 7 years"], "en", "more then")).toBe("more than")
  })

  it("catches 'would of'", () => {
    expect(fixFor(["A rollback would of cost a day"], "en", "would of")).toBe("would have")
  })

  it("fixes article agreement", () => {
    expect(fixFor(["Delivered a increase in retention"], "en", "a increase")).toBe("an increase")
    expect(fixFor(["Shipped an release every sprint"], "en", "an release")).toBe("a release")
  })

  it("stays out of the words a spelling proxy gets wrong", () => {
    // "u" and "h" are phonetic, not spelling; acronyms and capitals are ambiguous.
    expect(typed(["Built a user flow in a hierarchy over an hour with a SQL query"], "en")).toEqual([])
  })

  it("does not apply English rules to a Spanish CV", () => {
    expect(typed(["Entregué a increase y more then eso"], "es")).toEqual([])
  })
})

describe("deduplication", () => {
  it("reports the same slip once, because one Fix rewrites every field", () => {
    expect(typed(["more then 7 years", "more then five projects"], "en")).toEqual(["more then"])
  })
})
