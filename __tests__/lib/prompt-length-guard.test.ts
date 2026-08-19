import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { AI_INPUT_LIMITS } from "@/lib/services/ai/shared/ai-types"
import esMessages from "@/messages/es.json"
import enMessages from "@/messages/en.json"

/**
 * Every prompt this panel builds has to fit what the endpoint accepts.
 *
 * `/api/ai/fill-profile` validates `prompt` at max 500 characters and answers
 * 422 invalid_data before a model ever runs. The anti-repetition list — the
 * bullets the other roles already carry, sent so the model does not write them
 * again — pushed straight past that the moment a second job existed, and every
 * suggestion request failed with a generic "could not complete".
 */
const SRC = readFileSync(join(process.cwd(), "components/editor/AIProfileInterview.tsx"), "utf8")

describe("prompts fit the endpoint", () => {
  it("clamps to the limit no matter what the copy says", () => {
    // The last line of defence, read from the source: a slice at the cap. The
    // bullets answer is now free text the user types, so the cap is the only
    // thing standing between a long paste and a 422 nobody can act on.
    expect(SRC).toContain(".slice(0, PROMPT_MAX)")
    expect(SRC).toContain("const room = PROMPT_MAX - about.length")
    expect(SRC).toContain("const PROMPT_MAX = AI_INPUT_LIMITS.prompt")
  })

  it("leaves room for an answer under the cap", () => {
    for (const [loc, m] of [["es", esMessages], ["en", enMessages]] as const) {
      const intv = (m as unknown as { editor: { ai_profile_fill: { interview: Record<string, string> } } })
        .editor.ai_profile_fill.interview
      // The templates, with generous stand-ins for what gets interpolated.
      const role = "Ingeniero de Telecomunicaciones Senior"
      const certs = intv.certs_prompt.replace("{role}", role)
      const seed = intv.seed_prompt.replace("{role}", role)
      for (const [name, built] of [["certs", certs], ["seed", seed]]) {
        expect(built.length, `${loc} ${name}`).toBeLessThan(AI_INPUT_LIMITS.prompt)
        // And enough headroom that the anti-repeat list is not pointless.
        expect(built.length, `${loc} ${name} leaves no room`).toBeLessThan(AI_INPUT_LIMITS.prompt - 120)
      }
    }
  })
})
