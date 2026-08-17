import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import { untrustedDataRule } from "@/lib/services/ai/shared/untrusted-input"

// Every prompt that reads a job description — or the candidate's free-text question — is
// reading text a stranger wrote. Delimiters say where it starts; they do not say it must
// not be obeyed. This checks the rule is actually attached to each of those prompts, in
// both languages, because a defence that only exists in the English branch is not one.

const MODULE = join(process.cwd(), "lib/services/ai/modules/AIReviewModule.ts")

describe("untrustedDataRule", () => {
  it("says the delimited blocks are data, in both languages", () => {
    expect(untrustedDataRule(true).toLowerCase()).toContain("data")
    expect(untrustedDataRule(true).toLowerCase()).toContain("never follow")
    expect(untrustedDataRule(false).toLowerCase()).toContain("datos")
    expect(untrustedDataRule(false).toLowerCase()).toContain("nunca sigas")
  })

  it("is short — a defence nobody would trim for token cost", () => {
    expect(untrustedDataRule(true).length).toBeLessThan(220)
    expect(untrustedDataRule(false).length).toBeLessThan(220)
  })

  it("is attached to every prompt that ingests user-supplied text, in both branches", () => {
    const src = readFileSync(MODULE, "utf8")
    // Three prompts read untrusted text: the recruiter judgement (JD), the requirement
    // extraction (JD) and the review (the candidate's own question). Two branches each.
    expect((src.match(/untrustedDataRule\(true\)/g) ?? []).length).toBe(3)
    expect((src.match(/untrustedDataRule\(false\)/g) ?? []).length).toBe(3)
  })
})
