// lib/ats/spellcheck-runs.ts
// The two decisions the spelling card got wrong, pulled out of the component so
// they can be tested without timers, fetch mocks or a React harness:
//
//   1. WHEN an automatic re-check is allowed to replace the list on screen.
//   2. WHAT the list contains when the grammar pass did not run this time.
//
// Both produced the same user-visible failure: after fixing four of eight
// findings, an automatic run landed, returned only the dictionary half, and the
// card announced "no known mistakes" over four mistakes still in the CV.

/** Why a run is happening — see SpellCheckCard for what each mode costs. */
export type RunMode = "manual" | "auto" | "verify"

export interface Finding {
  typed: string
  suggestions: string[]
  /**
   * Why this is wrong, in the grammar pass's own words (≤8 words, set by the
   * model). Absent for dictionary findings, where the misspelling is the
   * explanation. Shown to the user because a correction they cannot evaluate is
   * one they should not be asked to apply to their CV.
   */
  why?: string
}

export interface AutoRunState {
  /** Rows the user still has in front of them. */
  pending: number
  /** Prose about to be sent. */
  joined: string
  /** Prose sent by the previous run, if any. */
  lastChecked: string | null
  now: number
  lastRunAt: number
  minIntervalMs: number
}

/**
 * Whether the automatic pass may run right now.
 *
 * The list is the user's workspace while anything is left on it. Every Fix
 * rewrites the CV, which reschedules this run, so an unguarded automatic pass
 * lands in the middle of a fixing session and swaps the rows out — pagination
 * back to the first page, numbering changed, no cause the user can see.
 *
 * `manual` and `verify` are never throttled: the first is the user asking, the
 * second is the run that has to confirm an empty list before the card claims the
 * CV is clean.
 */
export function shouldAutoRun(mode: RunMode, s: AutoRunState): boolean {
  if (mode !== "auto") return true
  if (s.pending > 0) return false
  if (s.joined === s.lastChecked) return false
  return s.now - s.lastRunAt >= s.minIntervalMs
}

/** Line breaks differ between how the CV stores prose and how we joined it. */
const flat = (s: string) => s.toLowerCase().replace(/\s+/g, " ")

/**
 * Findings whose wrong text is still somewhere in the CV.
 *
 * This is what lets a skipped grammar pass keep its previous findings instead of
 * discarding them. A correction stops being pending because the words are gone,
 * never because the pass that found them did not run this time.
 */
export function stillPresent(findings: Finding[], joined: string): Finding[] {
  const hay = flat(joined)
  return findings.filter((f) => hay.includes(flat(f.typed)))
}

/**
 * One list from both passes. The dictionary wins on a tie: it is exact where the
 * model is a judgement.
 */
export function mergeFindings(dictionary: Finding[], grammar: Finding[]): Finding[] {
  const byTyped = new Set(dictionary.map((f) => f.typed.toLowerCase()))
  return [...dictionary, ...grammar.filter((g) => !byTyped.has(g.typed.toLowerCase()))]
}

/**
 * What the card is entitled to tell the user after a run.
 *
 * The point of naming this: an empty list is NOT the same claim as a clean CV.
 * The list is empty whenever the passes that ran found nothing — including when
 * the grammar pass never happened, because the plan does not include it, the
 * quota is spent, the endpoint failed, or an automatic run declined to pay for a
 * model call. Deriving "no known mistakes" from `length === 0` announced a clean
 * CV in all four cases, over prose that still read "more then 7 years".
 */
export type Verdict = "unknown" | "issues" | "clean" | "spelling-only"

/**
 * `grammarKnown` means this result reflects a grammar pass that actually ran —
 * now, or earlier with its unresolved findings carried forward since.
 */
export function verdictFor(findings: Finding[], grammarKnown: boolean): Verdict {
  if (findings.length > 0) return "issues"
  return grammarKnown ? "clean" : "spelling-only"
}

/** Drops the duplicates two passes can report for the same word. */
export function dedupeFindings(findings: Finding[]): Finding[] {
  return findings.filter(
    (f, i, all) => all.findIndex((o) => o.typed.toLowerCase() === f.typed.toLowerCase()) === i
  )
}
