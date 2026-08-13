// lib/ats/merge-candidates.ts
//
// Finds the two bullets in one role that should be one bullet.
//
// A role with six thin lines reads worse than the same role with four solid ones:
// the recruiter skims, and every line that says half a thing spends a slot without
// buying a claim. The panel already knew how to REMOVE a weak line, which throws
// the content away, and how to REWRITE one, which cannot merge. Neither covers the
// common case — two lines about the same work, split because they were written on
// different days.
//
// WHICH two is decided in code, never by the model. A model asked "which of these
// should be merged" always finds a pair, the same way a model asked to improve a
// bullet always finds another variant — the stopping problem this codebase has
// already paid for twice. The algorithm decides IF; the model only decides HOW it
// reads.
//
// The first version of this file answered "are these about the same work?" with
// its own private heuristics — a shared-word count, a character-length cut-off, a
// crowding number — all chosen by looking at ONE résumé. Two features were
// answering one question in two ways, so they could disagree, and neither had been
// checked outside the CV that produced them.
//
// They are one question, and it lives in resume-integrity.ts:
//
//     same subject + one line adds nothing  →  a DUPLICATE (delete one)
//     same subject + each adds something    →  a MERGE     (fuse them)
//
// so this file no longer decides similarity at all. What remains here is the part
// that is genuinely about merging: only on a role a recruiter would find crowded,
// and only between lines that have not already earned their place.

import { sharesSubject, addsNothingNew } from "./resume-integrity"
import { BULLETS_PER_ROLE_MAX } from "./scoring-config"

export interface MergeCandidate {
  targetId: string
  jobTitle: string
  /** Indices into the role's bullet list, ascending. */
  indexes: [number, number]
  texts: [string, string]
}

/**
 * Crowded is not a new opinion: writing-checks already owns the recruiter norm and
 * calls a role "too many" above BULLET_MAX. Merging is offered one line BELOW that
 * line, because a role sitting exactly at the limit is the one where fusing two
 * thin bullets brings it back into range. One owner of the norm, no second number
 * drifting away from it.
 */
const CROWDED_ROLE = BULLETS_PER_ROLE_MAX.value - 2
/** Below this a line is barely a sentence, and fusing it fixes nothing. */
const TOO_SHORT_TO_KEEP = 25

/** A line that reports a result has earned its slot — never offer to fold it away. */
function carriesFigure(text: string): boolean {
  return /\d/.test(text)
}

export interface MergeInput {
  targetId: string
  jobTitle: string
  bullets: string[]
}

/**
 * The pairs worth offering to merge, best first.
 *
 * Conservative by construction, because merging is destructive: it only looks
 * inside ONE role (two roles saying similar things is a different problem, and
 * merging across them would rewrite history), only at roles already carrying more
 * lines than a recruiter reads, and only at pairs where BOTH lines are thin. A
 * line with a number in it is never offered — that one is doing its job.
 *
 * Each bullet appears in at most one pair, so applying every suggestion cannot
 * cascade into merging a role down to a single line.
 */
/**
 * The pairs worth offering to merge, best first.
 *
 * Conservative by construction, because merging is destructive: only inside ONE
 * role (two roles saying similar things is a different problem, and merging across
 * them would rewrite history), only on roles a recruiter would already find
 * crowded, and only between lines that are thin — a line carrying a figure has
 * earned its slot and is never folded away.
 *
 * A pair where one line adds NOTHING is not a merge, it is a duplicate, and it is
 * routed to the duplicate flow instead: fusing them would dress a deletion up as a
 * model call.
 *
 * Each bullet appears in at most one pair, so applying every suggestion cannot
 * cascade a role down to a single line.
 */
export function findMergeCandidates(roles: MergeInput[], max = 4): MergeCandidate[] {
  const out: (MergeCandidate & { score: number })[] = []

  for (const role of roles) {
    const { targetId, jobTitle, bullets } = role
    if (!targetId || bullets.length < CROWDED_ROLE) continue

    const thin = bullets
      .map((text, index) => ({ text: text.trim(), index }))
      .filter(({ text }) => text.length >= TOO_SHORT_TO_KEEP && !carriesFigure(text))

    const taken = new Set<number>()
    const pairs: { a: number; b: number }[] = []
    for (let i = 0; i < thin.length; i++) {
      for (let j = i + 1; j < thin.length; j++) {
        if (!sharesSubject(thin[i].text, thin[j].text)) continue
        // One of them contributes nothing → that is a duplicate, not a merge.
        if (addsNothingNew(thin[i].text, thin[j].text)) continue
        pairs.push({ a: thin[i].index, b: thin[j].index })
      }
    }

    for (const p of pairs) {
      if (taken.has(p.a) || taken.has(p.b)) continue
      taken.add(p.a)
      taken.add(p.b)
      out.push({
        targetId,
        jobTitle,
        indexes: [p.a, p.b],
        texts: [bullets[p.a], bullets[p.b]],
        score: bullets.length,
      })
    }
  }

  return out
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ score: _score, ...c }) => c)
}
