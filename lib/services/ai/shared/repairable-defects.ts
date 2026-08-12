// lib/services/ai/shared/repairable-defects.ts
//
// WHICH defects an AI rewrite can actually repair — the single answer used by
// both the button and the endpoint behind it.
//
// It used to be answered twice, differently. The ATS panel counted a missing
// figure as a defect and drew "Rewrite this bullet"; the endpoint refuses to
// invent numbers, so it answered "already well written" and the press was wasted.
// The user saw a button offering to fix something that, on click, was declared
// fine — the panel promising work the engine had already ruled out.
//
// Pure and dependency-light on purpose: the panel imports it in the browser to
// decide whether to draw the button at all, so the two can no longer disagree.
import { assessDescription } from "./bullet-quality"
import { hasCliche } from "./cliches"

/**
 * Is the defect the caller declared actually still in this text?
 *
 * The panel's focus is a snapshot: it was true when the CV was analysed, and it
 * may have been repaired since — by us, on the previous press. Verifying it
 * turns "the user asked" into "the user asked and it is still broken".
 *
 * `metric` deliberately never counts: we refuse to invent figures, so a missing
 * number is not a defect an AI rewrite can repair, and treating it as one is
 * what kept the rewrite button live forever.
 */
export function defectStillPresent(focus: string, text: string): boolean {
  const { bullets } = assessDescription(text)
  switch (focus) {
    case "weak_verb":
      return bullets.some((b) => b.weakOpener)
    case "cliche":
      return bullets.some((b) => hasCliche(b.text))
    case "metric":
      return false
    default:
      // An unknown focus is not evidence of anything.
      return false
  }
}

/**
 * Everything a rewrite of this text could still fix, in the order the prompt
 * reads best. Empty means the engine will decline — so the caller must not
 * offer the button.
 */
export function repairableDefects(text: string): string[] {
  return ["weak_verb", "cliche"].filter((d) => defectStillPresent(d, text))
}
