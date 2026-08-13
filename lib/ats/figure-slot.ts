// lib/ats/figure-slot.ts
//
// "Add a number" — where, and a number of WHAT?
//
// The panel asks for a figure on a line the candidate wrote months ago, and then
// leaves them staring at it. Most people do not stall because they refuse to
// quantify; they stall because they cannot see which part of their own sentence
// takes a number. So this shows the answer ON their sentence: their words, with a
// slot in the position that fits, and a label for the unit that belongs there.
//
// It is a PREVIEW, never content. The slot is drawn in the hint and is never
// written into a CV — bracket placeholders reaching a recruiter is the one thing
// this product refuses to ship, and this file exists to make that refusal
// survivable instead of unhelpful.
//
// The verb classes below are closed and short, and they are about the SHAPE of a
// claim, not an industry: a nurse reduces wait times and an engineer reduces build
// times, and both take a before→after. Nothing here is tuned to one résumé.

/** What kind of figure the sentence is asking for. */
export type FigureKind = "delta" | "volume" | "people" | "money" | "time" | "reach" | "scale"

export interface FigureSlot {
  kind: FigureKind
  /** The candidate's own line with the slot placed. Display only. */
  example: string
  /**
   * Other placements that fit the same sentence. Shown when the verb does not
   * pin down ONE unit — a built thing can be measured by how much, by who used
   * it, or by what it saved, and only the candidate knows which of those they
   * can actually back up in an interview.
   */
  alternatives?: string[]
}

const SLOT = "___"

/** Verbs that describe a change: the figure is a before and an after. */
const DELTA =
  /^(reduc|decreas|cut|lower|increas|improv|rais|grew|grow|boost|speed|aumen|redu|mejor|increment|disminu|baj|subi|acelera)/i
/** Verbs that describe throughput: the figure is how many, how often. */
const VOLUME = /^(process|handl|deliver|ship|complet|resolv|clos|produc|proces|atend|entreg|resolv|complet)/i
/** Verbs that act on people: the figure is headcount. */
const PEOPLE = /^(led|lead|manag|supervis|train|mentor|coach|coordinat|lider|dirig|superv|capacit|form|coordin)/i
/** Verbs about money. */
const MONEY = /^(sold|sell|negotiat|budget|sav|bill|invoic|vend|negoci|ahorr|factur|presupuest)/i
/** Verbs that make a thing exist. What was built is measured, not a percentage. */
const BUILD = /^(develop|built|build|creat|design|implement|launch|ship|wrote|write|desarroll|constru|cre|diseñ|implement|lanz|escrib)/i
/** Verbs about duration. */
const TIME = /^(automat|streamlin|shorten|schedul|automatiz|agiliz|program)/i

/**
 * Where the number goes in THIS line.
 *
 * Falls back to `scale` — "how many, how much, how often" appended at the end —
 * because a line whose verb we do not recognise still deserves an answer, and the
 * end of the clause is where a qualifier always reads correctly.
 */
export function suggestFigureSlot(text: string, locale: "es" | "en" = "en"): FigureSlot | null {
  const line = text.trim().replace(/[.;]+$/, "")
  if (!line || /\d/.test(line)) return null // Already carries a figure.

  const first = line.split(/\s+/)[0] ?? ""
  const es = locale === "es"

  if (DELTA.test(first)) {
    return { kind: "delta", example: es ? `${line}, de ${SLOT} a ${SLOT}` : `${line}, from ${SLOT} to ${SLOT}` }
  }
  if (PEOPLE.test(first)) {
    return { kind: "people", example: es ? `${line} (equipo de ${SLOT})` : `${line} (team of ${SLOT})` }
  }
  if (MONEY.test(first)) {
    return { kind: "money", example: es ? `${line}, por ${SLOT}` : `${line}, worth ${SLOT}` }
  }
  if (TIME.test(first)) {
    return { kind: "time", example: es ? `${line}, ahorrando ${SLOT} por semana` : `${line}, saving ${SLOT} per week` }
  }
  if (VOLUME.test(first)) {
    return { kind: "volume", example: es ? `${line}, ${SLOT} por mes` : `${line}, ${SLOT} per month` }
  }
  if (BUILD.test(first)) {
    // "Developed modular and reusable components…" — the honest question is not a
    // percentage, it is how much got built and who used it.
    return {
      kind: "reach",
      // Industry-neutral on purpose. "used across ___ screens" would fit this one
      // résumé and no other; a teacher, a welder and a nurse all build things
      // that get used by someone, exist in some quantity, and save some time.
      example: es ? `${line}, usado por ${SLOT} personas` : `${line}, used by ${SLOT} people`,
      alternatives: es
        ? [`${line} (${SLOT} en total)`, `${line}, ahorrando ${SLOT} por semana`]
        : [`${line} (${SLOT} in total)`, `${line}, saving ${SLOT} per week`],
    }
  }
  // Nothing recognised the verb. "(___)" alone was a slot with no question
  // attached — reported as exactly that: "no veo algo muy claro ahí". So the
  // fallback asks the three questions that fit any job, in any industry, and
  // shows each one written onto the candidate's own sentence.
  return {
    kind: "scale",
    example: es ? `${line} (${SLOT} en total)` : `${line} (${SLOT} in total)`,
    alternatives: es
      ? [`${line}, para ${SLOT} personas`, `${line}, en ${SLOT} semanas`]
      : [`${line}, for ${SLOT} people`, `${line}, in ${SLOT} weeks`],
  }
}
