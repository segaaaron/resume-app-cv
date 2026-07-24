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
import { readFileSync, readdirSync, statSync } from "fs"
import { join } from "path"
import { TEMPLATE_COUNT, TEMPLATES } from "@/types/resume"
import en from "@/messages/en.json"
import es from "@/messages/es.json"

/** Numbers in copy that refer to the template catalogue, not something else.
 *  A trailing \b after the noun stops it matching identifiers like `templateId`
 *  (e.g. the hash `h * 31 + templateId` is not a "31 templates" claim). */
const TEMPLATE_PHRASE =
  /(\d{2,4})\s*\+?\s*(?:professional\s+|premium\s+|ATS[- ]?(?:friendly|optimized)\s+)?(?:resume\s+)?(templates?|plantillas?|designs?|diseños?)\b/gi

/** Drop // and block comments so a dev note ("40 templates get SEO copy") is not
 *  read as a user-facing claim. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")
}

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

/**
 * The count also lives HARD-CODED in TSX/TS (layout meta, OG image, blog CTAs,
 * SEO strings) that can't import TEMPLATE_COUNT into a template literal cheaply —
 * and those drifted to "111+"/"164+" while messages/*.json said 128. Scanning the
 * source closes that gap: any \d+ templates/plantillas claim in app/ or lib/ must
 * be TEMPLATE_COUNT (or use the ${TEMPLATE_COUNT} interpolation, which the regex
 * skips because the digits aren't literal).
 */
const ROOT = process.cwd()
function collectSource(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) collectSource(full, out)
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(full)
  }
  return out
}

function offendingSourceCounts(): { file: string; snippet: string }[] {
  const hits: { file: string; snippet: string }[] = []
  for (const dir of ["app", "lib"]) {
    for (const file of collectSource(join(ROOT, dir))) {
      const src = stripComments(readFileSync(file, "utf8"))
      for (const m of src.matchAll(TEMPLATE_PHRASE)) {
        const n = Number(m[1])
        if (n >= 20 && n !== TEMPLATE_COUNT) hits.push({ file: file.slice(ROOT.length + 1), snippet: m[0] })
      }
    }
  }
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

  it("no hard-coded wrong template count in app/ or lib/ source", () => {
    expect(offendingSourceCounts()).toEqual([])
  })
})
