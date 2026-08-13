// lib/ats/bullet-locate.ts
//
// Where the line the user acted on lives RIGHT NOW.
//
// THE PROBLEM THIS EXISTS TO KILL. Every write into the work history is guarded
// by "is the bullet at `index` still the text we showed?" — the guard that stops
// an edit from overwriting a neighbour. It compared against a snapshot index, so
// any drift between the analysis and the click turned Remove, Rewrite and the
// user's own edit into "Could not apply change" / "Could not improve the
// achievement", with nothing the candidate could do about it. Reported with
// three screenshots in a row: a suggestion that errors when applied is worse
// than no suggestion.
//
// The index is a HINT; the TEXT is the identity.

/** Comparison key: spacing and case are not part of a bullet's identity. */
const key = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase()

/**
 * Resolves the live position of `current` in `bullets`.
 *
 * Uses `index` when it still points at the right line, otherwise looks the line
 * up by text and takes the match CLOSEST to where the line used to be.
 *
 * TWO IDENTICAL LINES ARE NOT AN AMBIGUITY. An earlier version refused them —
 * "we cannot know which one the user was looking at" — which sounds careful and
 * is wrong: the two lines say exactly the same thing, so removing either leaves
 * the same résumé, and replacing either leaves the same résumé. Refusing bought
 * no safety and cost the user their action. The risk the guard actually exists
 * for is writing over a DIFFERENT line, and that is still impossible: the text
 * must match, not the position.
 *
 * @returns the live index, or -1 only when the line is genuinely gone.
 */
export function resolveBulletIndex(bullets: string[], index: number, current: string): number {
  const want = key(current)
  if (!want) return -1
  if (index >= 0 && index < bullets.length && key(bullets[index]) === want) return index
  let best = -1
  bullets.forEach((line, i) => {
    if (key(line) !== want) return
    if (best < 0 || Math.abs(i - index) < Math.abs(best - index)) best = i
  })
  return best
}
