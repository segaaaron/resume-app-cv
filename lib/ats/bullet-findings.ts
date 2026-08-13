// lib/ats/bullet-findings.ts
//
// ONE verdict per bullet. One owner, one decision, one action.
//
// THE PROBLEM THIS EXISTS TO KILL. Six different cards each looked at the work
// history on their own and each reached its own conclusion: "improve this line",
// "this line repeats another", "merge these two", "this one is diluting the role",
// "adapt this to the posting", "this one has no figure". Nothing coordinated them,
// so the same bullet appeared three times with three different instructions — and
// resolving it in one card left the other two still demanding work on text that no
// longer existed. Reported repeatedly, and correctly diagnosed: the logic was not
// separated, it was duplicated.
//
// A candidate cannot act on three verdicts about one sentence. Neither can a
// product: the moment two cards disagree, both lose their authority.
//
// So: every signal about every bullet is collected here, ranked by a single
// explicit order, and each bullet leaves with EXACTLY ONE action. The cards become
// what they should have been — views over one decision, filtered by kind.
//
// The ranking is not a preference. It follows what a repair COSTS the candidate if
// we get the order wrong:
//
//   1. broken     — an imported fragment. It is not a sentence yet; nothing else
//                   can be judged about it until it is whole again.
//   2. duplicate  — the same claim twice. Rewriting one copy leaves the repetition,
//                   which is the thing a recruiter reacts to.
//   3. cut        — a weak line in a role carrying more than a recruiter reads.
//                   POLISHING A LINE WE ARE ABOUT TO CUT IS THE CONTRADICTION THAT
//                   STARTED ALL OF THIS.
//   4. defect     — a cliché or a duty-phrased opener. Real, repairable, ours.
//   5. tailor     — adds a word this posting asks for. Optional by nature.
//   6. metric     — no figure. Only the candidate can supply it, so it is last:
//                   everything above can be done without waiting for them.
//
// Pure and deterministic. No model, no network — it only reconciles what the
// checks already measured.

export type BulletActionKind = "broken" | "duplicate" | "cut" | "defect" | "tailor" | "metric"

/** Order of authority. Earlier wins; a bullet never carries two actions. */
export const ACTION_PRIORITY: BulletActionKind[] = ["broken", "duplicate", "cut", "defect", "tailor", "metric"]

export interface BulletFinding {
  targetId: string
  jobTitle: string
  index: number
  text: string
  /** The one thing to do about this line. */
  action: BulletActionKind
  /** Everything that was observed, for the UI to explain the decision. */
  observed: BulletActionKind[]
}

export interface BulletSignals {
  /** Lines that are the tail of the one above them, split by a bad import. */
  broken?: { targetId: string; index: number }[]
  /** Lines that repeat another line, exactly or in different words. */
  duplicate?: { targetId: string; index: number }[]
  /** Weak lines in a role that carries more than a recruiter reads. */
  cut?: { targetId: string; index: number }[]
  /** Clichés, duty openers — repairable defects in the writing itself. */
  defect?: { targetId: string; index: number }[]
  /** Rewrites that add a term this posting asks for. */
  tailor?: { targetId: string; index: number }[]
  /** Lines with no figure. */
  metric?: { targetId: string; index: number }[]
}

const keyOf = (targetId: string, index: number) => `${targetId}::${index}`

/**
 * Reconciles every signal into one verdict per bullet.
 *
 * `bullets` is the source of truth for what exists: a signal pointing at a line
 * that is no longer there (applied, deleted, re-indexed) is dropped rather than
 * rendered, which is what left cards demanding work on vanished text.
 */
export function resolveBulletFindings(
  bullets: { targetId: string; jobTitle: string; index: number; text: string }[],
  signals: BulletSignals,
): BulletFinding[] {
  const alive = new Map(bullets.map((b) => [keyOf(b.targetId, b.index), b]))
  const observed = new Map<string, Set<BulletActionKind>>()

  for (const kind of ACTION_PRIORITY) {
    for (const hit of signals[kind] ?? []) {
      const k = keyOf(hit.targetId, hit.index)
      if (!alive.has(k)) continue
      const set = observed.get(k) ?? new Set<BulletActionKind>()
      set.add(kind)
      observed.set(k, set)
    }
  }

  const out: BulletFinding[] = []
  for (const [k, kinds] of observed) {
    const b = alive.get(k)
    if (!b) continue
    const action = ACTION_PRIORITY.find((p) => kinds.has(p))
    if (!action) continue
    out.push({ ...b, action, observed: ACTION_PRIORITY.filter((p) => kinds.has(p)) })
  }

  // Stable order: by the same authority, then by where the line sits in the CV, so
  // the list does not reshuffle under the user between two renders.
  return out.sort(
    (a, b) =>
      ACTION_PRIORITY.indexOf(a.action) - ACTION_PRIORITY.indexOf(b.action) ||
      a.targetId.localeCompare(b.targetId) ||
      a.index - b.index,
  )
}

/** The findings a given card is allowed to show. Cards never filter by hand. */
export function findingsFor(findings: BulletFinding[], kind: BulletActionKind): BulletFinding[] {
  return findings.filter((f) => f.action === kind)
}
