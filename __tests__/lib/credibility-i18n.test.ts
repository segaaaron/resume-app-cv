import { describe, it, expect } from "vitest"
import en from "@/messages/en.json"
import es from "@/messages/es.json"
import { computeCredibility } from "@/lib/ats/credibility"
import type { WritingChecks } from "@/lib/ats/writing-checks"

/**
 * The panel builds this message key dynamically — t(`cred_${f.key}`) — which the
 * i18n guard cannot see: it scans for literal t("...") calls. So two findings
 * added after the first batch shipped with no message at all and the panel threw
 * MISSING_MESSAGE in the user's face.
 *
 * A guard that reads source text cannot cover a key computed at runtime. This one
 * derives the keys from the CODE THAT PRODUCES THEM — every finding the engine can
 * emit must have a message in both locales — so a new finding without a message
 * fails here the moment it is written.
 */
const ats = (m: Record<string, unknown>) =>
  ((m as { editor: { ats: Record<string, string> } }).editor.ats)

/** A checks object that triggers EVERY finding at once. */
const allFindings: WritingChecks = {
  clicheBullets: [{ targetId: "j", jobTitle: "x", index: 0, text: "y".repeat(40), cliches: ["team player"] }],
  weakVerbBullets: [],
  duplicateBullets: [{ targetId: "j", jobTitle: "x", index: 1, text: "y".repeat(40), duplicateOfJobTitle: "x" }],
  dateInconsistency: { formats: ["MM/YYYY", "YYYY"] },
  bulletBalance: [{ targetId: "j", jobTitle: "x", count: 12, kind: "too_many" }],
  mergeCandidates: [],
  chronology: { kind: "reverse_order", firstShown: "A", mostRecent: "B" },
  futureDates: [{ targetId: "j", jobTitle: "x", value: "2030" }],
  yearsClaim: { claimed: 20, actual: 3 },
  nearDuplicates: [{ targetId: "j", jobTitle: "x", index: 2, text: "z".repeat(40), otherIndex: 0, otherText: "w".repeat(40) }],
  orphanFragments: [],
  bulletRanking: [],
  incompleteEducation: [{ index: 0, school: "Catolica University", missingDegree: true, missingDates: true }],
  metrics: { quantified: 5, bareDelta: 5, anchored: 0, total: 5, saturated: true },
  degreeInSkills: ["Systems engineer"],
  hasLink: false,
}

describe("every credibility finding can be shown to a user", () => {
  const findings = computeCredibility(allFindings).findings

  it("produces every finding the engine knows about", () => {
    expect(findings.length).toBeGreaterThanOrEqual(9)
  })

  it.each([["en", en], ["es", es]] as const)("has a message for each of them in %s", (_locale, messages) => {
    const missing = findings.map((f) => `cred_${f.key}`).filter((k) => !(k in ats(messages)))
    expect(missing).toEqual([])
  })

  it("keeps both locales in step", () => {
    for (const f of findings) {
      const k = `cred_${f.key}`
      expect(k in ats(en)).toBe(k in ats(es))
    }
  })
})

/**
 * The same blind spot, five more times.
 *
 * The i18n guard scans for literal t("...") calls, so EVERY message key this panel
 * builds from a variable is invisible to it. One of them shipped broken today;
 * these are the others, each one a MISSING_MESSAGE waiting for somebody to add a
 * value to an enum.
 *
 * Listed here as the VALUE SETS the code can produce, so adding a score category,
 * a health dimension, a gap lever or a rewrite angle fails this test instead of
 * failing in front of a user.
 */
const DYNAMIC_KEYS: [string, string[]][] = [
  // ATSScorePanel: t(`health_${...}`) — the CV-health card, both the verdict chips
  // and the five dimensions.
  ["health_", ["verdict_strong", "verdict_good", "verdict_fair", "verdict_weak", "dim_impact", "dim_action_verbs", "dim_completeness", "dim_brevity", "dim_recruiter_scan"]],
  // t(`bar_${category}`) — the score composition bars.
  ["bar_", ["hard_skills", "soft_skills", "title_match", "must_haves", "sections"]],
  // t(`path_lever_${lever.key}`) — GapLever["key"], including the template lever.
  ["path_lever_", ["hardSkills", "mustHaves", "title", "softSkills", "sections", "template"]],
  // t(`bullet_angle_${angle}`) — the alternative rewrites offered in the modal.
  ["bullet_angle_", ["recommended", "technical", "business", "leadership"]],
]

describe("every dynamically-built message key resolves", () => {
  it.each([["en", en], ["es", es]] as const)("in %s", (_locale, messages) => {
    const dict = ats(messages)
    const missing: string[] = []
    for (const [prefix, values] of DYNAMIC_KEYS) {
      for (const v of values) if (!(`${prefix}${v}` in dict)) missing.push(`${prefix}${v}`)
    }
    expect(missing).toEqual([])
  })
})
