import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Structural guard against a whole CLASS of silent bug, not one instance of it.
 *
 * Every AI route validates its body with a zod object, and zod STRIPS unknown
 * keys by default. So a field the client sends and the module reads, but the
 * route schema forgot to declare, is dropped without an error, without a log,
 * and without any visible symptom other than the feature quietly doing nothing.
 *
 * That is exactly how `jobDescription` disappeared from generate-cover-letter:
 * the editor sent the vacancy, the module destructured it to build the tailoring
 * brief, the schema never listed it, and every letter came out untailored for
 * three days with a green test suite the whole time.
 *
 * This test reads each route's schema and each module's input type from source
 * and fails when they drift, so the next missing field is caught at commit time
 * instead of in production.
 */

const ROUTE_TO_INPUT: Record<string, string> = {
  "ats-rescore": "ATSRescoreInput",
  "ats-score": "ATSScoreInput",
  "fill-profile": "FillProfileInput",
  "generate-cover-letter": "GenerateCoverLetterInput",
  "generate-summary": "GenerateSummaryInput",
  "improve-bullet": "ImproveBulletInput",
  "improve-cover-letter": "ImproveCoverLetterInput",
  "improve-summary": "ImproveSummaryInput",
  "review-cv": "ReviewCVInput",
  "skill-bullet": "SkillBulletInput",
  "tailor-cv": "TailorCVInput",
}

/**
 * Fields a route may legitimately omit: the server supplies them itself, so
 * accepting them from the client would be a trust bug, not a feature.
 * Each entry needs a reason — an unexplained exemption is how the guard rots.
 */
const SERVER_SUPPLIED: Record<string, string[]> = {
  // plan/userId never come from the body; they come from the session.
}

const TYPES_SRC = readFileSync(
  join(process.cwd(), "lib/services/ai/shared/ai-types.ts"),
  "utf8"
)

/** Top-level property names of an exported interface, nested objects included as one key. */
function interfaceFields(name: string): string[] {
  const start = TYPES_SRC.indexOf(`export interface ${name} {`)
  if (start === -1) throw new Error(`interface ${name} not found in ai-types.ts`)
  const open = TYPES_SRC.indexOf("{", start)
  let depth = 0
  let end = open
  for (let i = open; i < TYPES_SRC.length; i++) {
    if (TYPES_SRC[i] === "{") depth++
    else if (TYPES_SRC[i] === "}") {
      depth--
      if (depth === 0) { end = i; break }
    }
  }
  const body = TYPES_SRC.slice(open + 1, end)

  // Only depth-0 declarations: `highlights?: { motivation?: string }` counts once.
  const fields: string[] = []
  let nest = 0
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim()
    if (nest === 0) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)\??\s*:/.exec(line)
      if (m && !line.startsWith("//") && !line.startsWith("*")) fields.push(m[1])
    }
    nest += (line.match(/{/g) ?? []).length - (line.match(/}/g) ?? []).length
    if (nest < 0) nest = 0
  }
  return fields
}

describe("AI route schemas accept every field their module reads", () => {
  it.each(Object.entries(ROUTE_TO_INPUT))("%s", (route, inputType) => {
    const source = readFileSync(join(process.cwd(), `app/api/ai/${route}/route.ts`), "utf8")
    const exempt = SERVER_SUPPLIED[route] ?? []

    const missing = interfaceFields(inputType).filter((field) => {
      if (exempt.includes(field)) return false
      // The schema declares it as `field: z…` — a bare mention in a comment or
      // in the handler body does not count. `\s*` spans newlines so a multi-line
      // declaration (`field: z\n  .object({…})`) still counts as declared.
      return !new RegExp(`\\b${field}\\s*:\\s*z\\b`).test(source)
    })

    expect(missing, `${route}/route.ts drops these fields (zod strips unknown keys): ${missing.join(", ")}`).toEqual([])
  })

  it("covers every AI route that takes a typed input", () => {
    // A new route added without a mapping here would silently escape the guard.
    const mapped = Object.keys(ROUTE_TO_INPUT)
    expect(mapped).toContain("generate-cover-letter")
    expect(mapped.length).toBeGreaterThanOrEqual(11)
  })
})
