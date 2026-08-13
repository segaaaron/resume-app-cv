// lib/ats/bullet-strength.ts
//
// Which lines in an overloaded role are carrying it, and which are diluting it.
//
// The structure check already said the useful half — "past six on one role your
// strongest lines compete with your weakest" — and then left the candidate to work
// out WHICH ones. That is the hard part, and it is the part a person is worst at
// on their own writing. Naming a problem without naming its instances is a
// diagnosis with no prescription.
//
// Everything here is deterministic and additive: a bullet earns points for the
// things a recruiter reads for. No model, no threshold tuned to one résumé, and
// the ordering is what matters — the exact numbers only have to rank consistently.
//
// It never deletes. It sorts, and the candidate decides: the weakest lines get a
// Remove and, where two of them tell one story, a Merge — so cutting the role down
// does not have to mean throwing information away.

import { isEmptyPhrasing } from "@/lib/services/ai/shared/empty-phrasing"

export interface RankedBullet {
  index: number
  text: string
  score: number
  /** Why it scored what it scored, for the UI to show instead of a bare number. */
  reasons: string[]
}

/** Reasons that argue for cutting a line. The rest are reasons to keep it. */
const NEGATIVE = new Set(["duty_opener", "empty_phrasing", "too_short", "too_long"])

/**
 * What to tell someone about a line we are asking them to cut.
 *
 * Never a compliment: showing "starts with an action" as the reason to delete
 * something is worse than showing nothing, and picking the first reason in the
 * list did exactly that — a well-formed line with no defects at all fell through
 * to "too short to make a claim", which was simply untrue.
 *
 * A line can be perfectly written and still be the seventh best. That is not a
 * defect and must not be dressed as one: it gets its own honest answer.
 */
export function cutReason(b: RankedBullet): string {
  return b.reasons.find((r) => NEGATIVE.has(r)) ?? "outranked"
}

export interface RoleBulletRanking {
  targetId: string
  jobTitle: string
  /** The ones worth keeping, strongest first. */
  strongest: RankedBullet[]
  /** The ones diluting the role, weakest first. Capped at MAX_WEAK_SHOWN. */
  weakest: RankedBullet[]
  /** Weak lines beyond the cap. Shown as a count, never dropped in silence. */
  weakestHidden: number
}

/** A result the reader can place: a before→after, a unit, money, or a real count. */
const ANCHORED = [
  /\bfrom\s+[\d.,]+\s*%?\s+to\s+[\d.,]+/i,
  /\bde\s+[\d.,]+\s*%?\s+a\s+[\d.,]+/i,
  /[\d.,]+\s*(?:ms|s|seg|segundos|min|minutos|h|horas|hrs|kb|mb|gb|tb)\b/i,
  /[$€£]\s?[\d.,]+/,
  /\b\d[\d.,]*\s*(?:k|m|mil|millones|million)\b/i,
  /\b\d[\d.,]*\s+[a-záéíóúñ]{3,}/i,
]

/**
 * Openers that describe a duty rather than an achievement. A closed, short list of
 * VERB FORMS — not of topics — so it carries across industries: a nurse's
 * "responsible for medication rounds" fails for the same reason an engineer's
 * "responsible for the build" does.
 */
const DUTY_OPENER =
  /^(responsible for|in charge of|tasked with|duties included|worked on|helped|assisted with|participated in|involved in|encargado de|encargada de|responsable de|a cargo de|colabor[oó] en|particip[oó] en|apoy[oó] en)\b/i

/** Something specific enough that only this candidate could have written it. */
function namesSomethingConcrete(text: string): boolean {
  // A capitalised word mid-sentence (a tool, a product, a place) or a digit.
  const words = text.trim().split(/\s+/)
  for (let i = 1; i < words.length; i++) {
    const w = words[i].replace(/^[^\p{L}]+/u, "")
    if (/^\p{Lu}/u.test(w) && !/^I$/.test(w)) return true
  }
  return /\d/.test(text)
}

/** Bullets a recruiter reads before attention drops. Mirrors the structure check. */
export const KEEP_PER_ROLE = 6

/**
 * Most weak lines shown at once. A role carrying sixty bullets — an import from a
 * badly parsed PDF usually — produced fifty-four rows of "consider cutting this",
 * which nobody reads and which buries the six that matter. The count of what is
 * hidden travels with the result, because silently showing part of someone's CV
 * as if it were all of it is the failure this project keeps paying for.
 */
export const MAX_WEAK_SHOWN = 8

/**
 * Scores one line the way a recruiter skims it.
 *
 * The weights encode an ordering, not a measurement: a defensible result outranks
 * a bare percentage, which outranks naming a real tool, which outranks simply
 * being well-formed. Nothing here is tuned against a particular CV.
 */
export function scoreBullet(text: string): { score: number; reasons: string[] } {
  const t = text.trim()
  const reasons: string[] = []
  let score = 0

  if (ANCHORED.some((re) => re.test(t))) {
    score += 5
    reasons.push("anchored_result")
  } else if (/\d/.test(t)) {
    score += 3
    reasons.push("has_figure")
  }

  if (DUTY_OPENER.test(t)) {
    score -= 3
    reasons.push("duty_opener")
  } else if (/^[\p{Lu}]?[\p{L}]+(ed|ó|ió|é|aron|ieron)\b/u.test(t)) {
    // Past-tense opener: something happened, rather than something was assigned.
    score += 2
    reasons.push("action_verb")
  }

  if (isEmptyPhrasing(t)) {
    score -= 4
    reasons.push("empty_phrasing")
  }

  if (namesSomethingConcrete(t)) {
    score += 2
    reasons.push("specific")
  }

  // Very short lines say too little; very long ones are not skimmed at all.
  const words = t.split(/\s+/).length
  if (words < 6) {
    score -= 2
    reasons.push("too_short")
  } else if (words > 34) {
    score -= 1
    reasons.push("too_long")
  }

  return { score, reasons }
}

/**
 * Splits an overloaded role into the lines worth keeping and the ones diluting it.
 *
 * Returns nothing for a role a recruiter can already read: a four-bullet role has
 * no weakest line worth cutting, and saying otherwise would push people to delete
 * work they should keep.
 *
 * Ties keep the résumé's own order, so the ranking never reshuffles two lines the
 * candidate deliberately placed one after the other.
 */
export function rankRoleBullets(
  roles: { id?: string; jobTitle?: string; bullets: string[] }[],
  keep = KEEP_PER_ROLE,
): RoleBulletRanking[] {
  const out: RoleBulletRanking[] = []
  for (const role of roles) {
    if (!role.id || role.bullets.length <= keep) continue
    const ranked: RankedBullet[] = role.bullets
      .map((text, index) => ({ index, text: text.trim(), ...scoreBullet(text) }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
    const weak = ranked.slice(keep).reverse()
    out.push({
      targetId: role.id,
      jobTitle: role.jobTitle?.trim() ?? "",
      strongest: ranked.slice(0, keep),
      weakest: weak.slice(0, MAX_WEAK_SHOWN),
      weakestHidden: Math.max(0, weak.length - MAX_WEAK_SHOWN),
    })
  }
  return out
}
