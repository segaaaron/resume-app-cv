/**
 * Marketing copy quotes a template count a visitor can literally count on the
 * /templates page. It drifted once: the site advertised "164+ templates" while
 * only 128 shipped — across 57 localized strings and Google-indexed JSON-LD.
 *
 * Code claims now derive from TEMPLATE_COUNT (types/resume.ts). Localized strings
 * in messages/*.json can't import a constant, so this test is their guard: any
 * template-count number in the copy must equal the real catalogue size. Add a
 * template, or write the wrong number, and CI fails until the copy matches.
 */
import { describe, it, expect } from "vitest"
import { TEMPLATE_COUNT, TEMPLATES } from "@/types/resume"
import en from "@/messages/en.json"
import es from "@/messages/es.json"

/** Numbers in copy that refer to the template catalogue, not something else. */
const TEMPLATE_PHRASE =
  /(\d{2,4})\s*\+?\s*(?:professional\s+|premium\s+|ATS[- ]?(?:friendly|optimized)\s+)?(?:resume\s+)?(templates?|plantillas?|designs?|diseños?)/gi

function offendingCounts(messages: unknown): { count: number; snippet: string }[] {
  const hits: { count: number; snippet: string }[] = []
  const walk = (node: unknown) => {
    if (typeof node === "string") {
      for (const m of node.matchAll(TEMPLATE_PHRASE)) {
        const n = Number(m[1])
        // Ignore small numbers ("7 AI tools", "10 categories") the regex can't reach
        // anyway, and only flag values that look like a catalogue-size claim.
        if (n >= 20 && n !== TEMPLATE_COUNT) hits.push({ count: n, snippet: m[0] })
      }
    } else if (node && typeof node === "object") {
      for (const v of Object.values(node)) walk(v)
    }
  }
  walk(messages)
  return hits
}

describe("template count claims stay in sync with the catalogue", () => {
  it("TEMPLATE_COUNT equals the real array length", () => {
    expect(TEMPLATE_COUNT).toBe(TEMPLATES.length)
  })

  it("English copy never quotes a wrong template count", () => {
    expect(offendingCounts(en)).toEqual([])
  })

  it("Spanish copy never quotes a wrong template count", () => {
    expect(offendingCounts(es)).toEqual([])
  })
})
