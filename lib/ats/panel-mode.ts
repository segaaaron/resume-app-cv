// lib/ats/panel-mode.ts
//
// Two jobs were sharing one screen, and the fast one was paying the slow one's
// price.
//
// Getting a résumé into shape is done once, or twice a year: weak bullets,
// duplicated lines, dates, spelling, credibility. Adapting it to ONE posting is
// done ten times a week and should take two minutes. The panel showed both at
// once, with the same visual weight, twenty-eight cards deep — so applying to a
// job cost the same as rewriting a career.
//
// Nothing is removed. This decides what is shown FIRST, and everything else is
// one click away. The measurements that justify each choice:
//
//   · Our own weights: hardSkills .45 · mustHaves .20 · title .15 · softSkills
//     .10 · sections .10. The industry agrees titles and hard skills are what
//     recruiters actually search on.
//   · Bullets move the match by exactly ZERO — they are half the panel. They
//     decide the interview, not the filter, so they belong to the résumé pass.
//   · Soft skills weigh a tenth and almost no filter ranks on them.
//   · Manual tailoring costs 15-45 minutes per application; a tool that does not
//     beat that has no reason to exist.

import { fixAxis } from "./fix-impact"

export type PanelMode = "application" | "resume"

/**
 * Keyword coverage at which we say STOP.
 *
 * The recommended range is 60-80% of a posting's keywords; past that, adding more
 * is stuffing, which modern parsers penalise. The panel never said "you are done"
 * — it always had one more suggestion, which is how a tool trains someone to keep
 * editing a résumé that was ready twenty minutes ago.
 */
export const READY_COVERAGE = 80

/** Most actions shown in the application view. More than three is a list again. */
export const MAX_APPLICATION_ACTIONS = 3

/**
 * Does this repair belong in the two-minute view?
 *
 * Only two things qualify: it moves the match with THIS posting, or it gets the
 * résumé thrown out before a human sees it (a layout a parser mangles). Anything
 * that improves the document in general — a stronger bullet, a cleaner date, a
 * fixed typo — is real work and stays in the résumé pass, where the candidate is
 * not in a hurry.
 */
export function belongsToApplication(actionKind: string | undefined): boolean {
  return fixAxis(actionKind) === "match"
}

/** Levers that change what the matcher indexes for this posting. */
const APPLICATION_LEVERS = new Set(["hardSkills", "mustHaves", "title", "template"])

/** Does this gap lever belong in the two-minute view? */
export function leverBelongsToApplication(key: string): boolean {
  return APPLICATION_LEVERS.has(key)
}

/**
 * Ready to send.
 *
 * Deliberately a floor and not a target: 80% of the posting's keywords with a
 * layout that parses is the point at which more editing stops paying. Saying so
 * is the whole difference between a tool that finishes and one that nags.
 */
export function readyToApply(coveragePct: number | null | undefined, templateSafe: boolean): boolean {
  return (coveragePct ?? 0) >= READY_COVERAGE && templateSafe
}
