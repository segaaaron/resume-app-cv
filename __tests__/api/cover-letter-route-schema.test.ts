import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * The generate-cover-letter route validates its body with a zod object, and zod
 * STRIPS unknown keys. A field the editor sends and the module reads, but the
 * schema does not declare, is dropped in silence — no error, no log, just a
 * feature that quietly does nothing.
 *
 * That is exactly what happened to `jobDescription`: the editor sent the
 * vacancy, AICoverLetterModule destructured it to build the tailoring brief, and
 * the schema never listed it, so every generated letter was built with an empty
 * brief. This guard fails if any input the module consumes goes missing from the
 * schema again.
 */
const ROUTE = join(process.cwd(), "app/api/ai/generate-cover-letter/route.ts")

const FIELDS_THE_MODULE_READS = [
  "resumeId",
  "recipientName",
  "recipientTitle",
  "company",
  "jobTitle",
  "tone",
  "language",
  "userPrompt",
  "highlights",
  "jobDescription",
]

describe("generate-cover-letter route schema", () => {
  const source = readFileSync(ROUTE, "utf8")

  it.each(FIELDS_THE_MODULE_READS)("declares %s so zod does not strip it", (field) => {
    expect(source).toMatch(new RegExp(`\\b${field}:`))
  })

  it("declares the three structured answers inside highlights", () => {
    for (const answer of ["motivation", "achievement", "fit"]) {
      expect(source).toMatch(new RegExp(`\\b${answer}:`))
    }
  })
})
