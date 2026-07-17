// The prefix swap is the answer to the one phrase prompting could not remove.
//
// "I am excited to" survived the banlist AND the retry, in both attempts, every
// run — the model has no other way to close a letter warmly. The alternatives
// are worse: logit_bias is a position-independent map over single tokens, so
// "I", " am" and " to" are unbannable and biasing " excited" bans the word
// everywhere (and routes to "thrilled"/"eager"); Structured Outputs constrain
// the JSON shape, never string content; and Antislop (arXiv:2510.15061) reports
// token banning "becomes unusable at just 2,000" patterns, solving it by
// backtracking a sampler we do not host.
//
// A regex on a string we already enumerated has perfect recall and costs
// nothing. What it can break is the seam, so that is what this file pins.
import { describe, it, expect } from "vitest"
import { substituteCliches, hasCliche, findCliches, clicheBanList } from "@/lib/services/ai/shared/cliches"

describe("substituteCliches — the prefix swap", () => {
  it("keeps every word behind the opener", () => {
    expect(substituteCliches("I am excited to discuss the migration plan.")).toBe(
      "I would welcome the chance to discuss the migration plan.",
    )
  })

  it("clears the detector afterwards", () => {
    const out = substituteCliches("I am excited to talk about the platform work.")
    expect(hasCliche(out)).toBe(false)
  })

  it("drops the hedge and keeps the claim", () => {
    expect(substituteCliches("I believe I would be a great fit.")).toBe("I would be a great fit.")
  })

  it("routes the near-misses to the same plain form", () => {
    expect(substituteCliches("I am thrilled to join.")).toBe("I would welcome the chance to join.")
    expect(substituteCliches("I am eager to start.")).toBe("I would welcome the chance to start.")
  })

  // The seam is where this technique breaks. Mid-sentence, a replacement must
  // not arrive capitalised.
  it("does not capitalise mid-sentence", () => {
    expect(substituteCliches("Given the scope, estoy emocionado de aportar.")).toBe(
      "Given the scope, me gustaría aportar.",
    )
  })

  it("capitalises when it opens a sentence", () => {
    expect(substituteCliches("Gracias. Estoy emocionado de aportar.")).toBe("Gracias. Me gustaría aportar.")
  })

  it("capitalises at the very start of the text", () => {
    expect(substituteCliches("estoy emocionado de aportar.")).toBe("Me gustaría aportar.")
  })

  it("leaves English I capital wherever it lands", () => {
    expect(substituteCliches("Beyond that, I am excited to help.")).toBe(
      "Beyond that, I would welcome the chance to help.",
    )
  })

  // The candidate's gender is not ours to assume, and "emocionado/a" is theirs.
  it("replaces both Spanish genders with one genderless form", () => {
    expect(substituteCliches("Estoy emocionada de empezar.")).toBe("Me gustaría empezar.")
    expect(substituteCliches("Estoy emocionado de empezar.")).toBe("Me gustaría empezar.")
  })

  it("matches whatever case the model wrote", () => {
    expect(substituteCliches("I AM EXCITED TO help.")).toBe("I would welcome the chance to help.")
  })

  it("swaps every occurrence, not just the first", () => {
    const out = substituteCliches("I am excited to start. I am excited to help.")
    expect(out).toBe("I would welcome the chance to start. I would welcome the chance to help.")
  })

  it("crosses a paragraph break cleanly", () => {
    expect(substituteCliches("Thanks.\n\nI am excited to talk.")).toBe(
      "Thanks.\n\nI would welcome the chance to talk.",
    )
  })

  // The whole point of the split: these ARE the sentence. There is nothing
  // behind them to keep, so a swap cannot fix them and the model must rewrite.
  it("leaves whole-sentence clichés for the model", () => {
    for (const s of [
      "Passionate about leveraging technical expertise.",
      "A hard-working team player with a proven track record.",
      "Responsible for the billing service.",
      "Soy una persona proactiva con don de gentes.",
    ]) {
      expect(substituteCliches(s)).toBe(s)
      expect(hasCliche(s)).toBe(true)
    }
  })

  it("does not touch text that carries no filler", () => {
    const clean = "Cut deploy time from 40 minutes to under 6 at Acme."
    expect(substituteCliches(clean)).toBe(clean)
  })

  it("survives empty input", () => {
    expect(substituteCliches("")).toBe("")
  })
})

describe("cliches — one list, three readers", () => {
  it("bans in the prompt what it rejects in the output", () => {
    expect(clicheBanList("en").toLowerCase()).toContain("proven track record")
    expect(clicheBanList("es").toLowerCase()).toContain("don de gentes")
    expect(hasCliche("with a proven track record")).toBe(true)
    expect(hasCliche("tiene don de gentes")).toBe(true)
  })

  // A phrase we can swap is still a phrase we ask the model not to write: the
  // swap is a safety net, not permission.
  it("still bans the phrases it can substitute", () => {
    expect(clicheBanList("en").toLowerCase()).toContain("i am excited to")
    expect(findCliches("I am excited to help")).toContain("i am excited to")
  })

  it("checks both languages whatever the document's own", () => {
    expect(hasCliche("Resumen en español de un passionate about developer")).toBe(true)
  })
})
