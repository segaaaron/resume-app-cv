// lib/services/ai/shared/proofread-guards.ts
//
// The rules that decide whether a model's "correction" is a correction at all.
//
// A model asked for errors will always find some, so the grounding filters are
// what make the grammar pass usable — and the ones it had were passable by
// coincidence. "increased in sprint" → "increased sprint completion" has three
// words on both sides, so a word-count check waved it through, while it actually
// deleted "in" and invented "completion". Counting words is not comparing them.
//
// Pure and dependency-free so every rule below is testable against the exact
// strings that got through in production.

const squash = (s: string) => s.toLowerCase().replace(/\s+/g, "")
const tokens = (s: string) => s.trim().split(/\s+/)

/**
 * Does `correct` fix the words that are there, rather than rewrite them?
 *
 * A proofreader repairs ONE word per finding. "more then" → "more than",
 * "an increased in" → "an increase in", "resulting in in" → "resulting in a" —
 * every real slip is a single token. Two or more changed tokens is the model
 * rewriting the phrase, which is an edit the user never asked for and cannot
 * judge from a two-line row.
 *
 * The one exception is respacing the same letters: "Swift UI" → "SwiftUI" and
 * "alot" → "a lot" change the token count while changing no words at all.
 */
export function isInPlaceCorrection(wrong: string, correct: string): boolean {
  if (squash(wrong) === squash(correct)) return true
  const a = tokens(wrong)
  const b = tokens(correct)
  if (a.length !== b.length) return false
  let changed = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i].toLowerCase() !== b[i].toLowerCase()) changed++
  }
  return changed === 1
}

/**
 * Which line the correction really belongs to, or -1 if it belongs to none.
 *
 * The model is asked to name the line, which turns grounding from a search into a
 * lookup: if `wrong` is not on the line it named, the model was not reading the
 * text it claimed to read, and nothing it says about that span can be trusted —
 * so the finding goes, rather than being quietly relocated to wherever the string
 * happens to match.
 *
 * `line` is 1-based to match the numbering the prompt shows. Older responses
 * carry no line at all; those fall back to the first unit that contains the text,
 * which is the previous behaviour and still grounded, just less precise.
 */
export function groundedLineIndex(wrong: string, units: string[], line?: number): number {
  if (typeof line === "number" && Number.isInteger(line)) {
    const idx = line - 1
    return idx >= 0 && idx < units.length && units[idx].includes(wrong) ? idx : -1
  }
  return units.findIndex((u) => u.includes(wrong))
}

/**
 * Drops corrections that claim text another correction already claimed.
 *
 * Two findings over the same words are not two errors, they are one error the
 * model described twice — and they cannot both be applied: fixing either one
 * rewrites the text the other was pointing at, so its Fix button then reports
 * "that word is no longer in your CV". Earlier findings win; the list is ordered
 * by the model's own confidence.
 *
 * Spans are per unit (a field or bullet), because that is the only place a
 * correction is allowed to exist.
 */
export function rejectOverlapping<T extends { wrong: string; line?: number }>(
  corrections: T[],
  units: string[],
): T[] {
  const claimed: Array<Array<[number, number]>> = units.map(() => [])
  const out: T[] = []
  for (const c of corrections) {
    const u = groundedLineIndex(c.wrong, units, c.line)
    if (u < 0) continue
    const start = units[u].indexOf(c.wrong)
    const end = start + c.wrong.length
    if (claimed[u].some(([s, e]) => start < e && s < end)) continue
    claimed[u].push([start, end])
    out.push(c)
  }
  return out
}
