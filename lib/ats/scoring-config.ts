// lib/ats/scoring-config.ts
//
// EVERY tunable number the ATS score depends on, in one file, each one stating
// what backs it.
//
// They used to live in four files with a sentence of justification each, which
// made an honest question — "why is this an 89?" — impossible to answer without
// reading the engine. Worse, it hid how few of them there are: five constants
// decide the whole number, and none of them is measured. Calling that out in one
// place is the difference between a model we can defend and a number that merely
// looks precise.
//
// THE HONEST FRAME. Nobody has a real "ATS score" — not Jobscan, not Rezi, not
// Teal. No applicant tracking system exposes its ranking, so every score in this
// category is a weighting somebody chose. Ours is too. What we can be is the only
// one that SAYS SO and shows its arithmetic, and that backs the parts that are
// facts (does this keyword appear? does the PDF parse?) with actual verification.
//
// RULE FOR CHANGING ANY OF THESE: they move every user's score at once. A change
// needs a reason written here — not a hunch, and never a number tuned until one
// example looked better.

/** How a value got here. Displayed nowhere; it exists to keep us honest. */
export type Basis =
  /** Observable behaviour of real parsers, reproducible on demand. */
  | "verified"
  /** Widely published résumé-writing convention. Not measured by us. */
  | "convention"
  /** Our judgement. No evidence behind the exact figure. */
  | "chosen"

export interface Tunable {
  value: number
  basis: Basis
  /** Why this number and not another — in the terms a user could be told. */
  why: string
}

/**
 * How much each category moves the score.
 *
 * Hard skills dominate because keyword matching is the one ATS behaviour that is
 * actually documented across vendors: postings are indexed by required skills and
 * candidates are filtered on them. That the split is exactly 45/20/15/10/10 is
 * OURS — the ordering is defensible, the precise figures are not measured, and
 * pretending otherwise would be the kind of false precision this file exists to
 * prevent.
 *
 * Categories the posting does not mention are dropped and the rest renormalize,
 * so a job that lists no soft skills never costs the candidate points for it.
 */
export const SCORE_WEIGHTS: Record<"hardSkills" | "mustHaves" | "title" | "softSkills" | "sections", Tunable> = {
  hardSkills: { value: 0.45, basis: "chosen", why: "Required skills are what keyword filters index and rank on — the largest single lever." },
  mustHaves: { value: 0.20, basis: "chosen", why: "Stated hard requirements: missing one is often a hard reject, not a deduction." },
  title: { value: 0.15, basis: "chosen", why: "Recruiters and search filters both match on job title before reading anything else." },
  softSkills: { value: 0.10, basis: "chosen", why: "Asked for in most postings, rarely used to filter — present but small." },
  sections: { value: 0.10, basis: "convention", why: "A résumé missing a standard section (experience, education, skills) parses incompletely." },
}

/**
 * Credit for the target title when it appears only in an OLD role.
 *
 * "Senior iOS Developer" three jobs ago is weaker evidence than the same title
 * today — that direction is not controversial. That the discount is 0.6 rather
 * than 0.5 or 0.7 is ours.
 */
export const OLD_TITLE_CREDIT: Tunable = {
  value: 0.6,
  basis: "chosen",
  why: "The target title in a past role still counts, but a current one counts more.",
}

/**
 * Crédito de una habilidad que el CV dice SÓLO en la lista.
 *
 * ── LA REGLA QUE ESTO HACE CUMPLIR ─────────────────────────────────────────
 *
 * «Toda la información que tenemos debe cuadrar con el score, y viceversa. Las
 * cosas opcionales no aportan score» (CEO, 2026-08-21).
 *
 * El panel viene señalando desde hace meses la diferencia entre una habilidad
 * DEMOSTRADA —dentro de una viñeta, en un puesto con fecha— y una AFIRMADA —
 * suelta en la lista de habilidades—. Le pide al candidato que la demuestre, le
 * da un botón para hacerlo… y el puntaje contaba las dos igual. El candidato
 * hacía el trabajo, el número no se movía, y concluía —con razón— que el panel
 * le pedía cosas que no cuentan.
 *
 * Los ATS modernos hacen *context scoring*: el mismo término pesa distinto según
 * dónde aparezca. Esto es lo mismo, con el descuento explícito.
 *
 * 0.6, EL MISMO QUE `OLD_TITLE_CREDIT`, y por la misma razón: la señal es real
 * —el término ESTÁ en el documento y el filtro lo va a encontrar— pero es más
 * débil que la prueba. Que el descuento sea 0.6 y no 0.5 ni 0.7 es nuestro, y se
 * declara como tal.
 */
export const LISTED_ONLY_CREDIT: Tunable = {
  value: 0.6,
  basis: "chosen",
  why: "A skill inside a dated bullet is proof; the same skill alone in a list is a claim. Both are found by the filter, one is weaker.",
}

/**
 * Multiplier applied when the chosen template is multi-column.
 *
 * The EFFECT is verified, not assumed: we render the real PDF, run it through a
 * parser and read back the text — multi-column layouts come out reordered or
 * interleaved. The 5% size of the penalty is ours: enough to matter, small enough
 * that a strong candidate is never sunk by a design choice.
 */
export const MULTI_COLUMN_PENALTY: Tunable = {
  value: 0.95,
  basis: "verified",
  why: "Two-column layouts get reordered by real parsers — visible in the extracted text.",
}

/**
 * Cosine similarity above which two phrasings count as the same requirement.
 *
 * What stops "APIs REST" on a Spanish CV from reading as missing when the posting
 * says "REST APIs". Overridable in production via SEMANTIC_MATCH_THRESHOLD without
 * a deploy, precisely because it is the one number here most likely to need
 * adjusting against real CVs.
 */
export const SEMANTIC_THRESHOLD: Tunable = {
  value: 0.62,
  basis: "chosen",
  why: "Above this, two phrasings mean the same requirement; below, they are different skills.",
}

/**
 * Bullets on one role before the strong lines compete with the weak ones.
 *
 * Standard résumé-writing guidance, published widely enough to call a convention:
 * 3-5 on a recent role, fewer on older ones. Six is the point at which we speak
 * up rather than the target we push people to.
 */
export const BULLETS_PER_ROLE_MAX: Tunable = {
  value: 6,
  basis: "convention",
  why: "Past six on one role, the lines that show results get diluted by the ones that do not.",
}

/**
 * Everything above, for a UI that wants to show its work.
 *
 * A score you can audit beats a "better" one nobody can question: the user sees
 * which categories were measured, what each is worth, and what our basis for it
 * is. That is the honest version of a number that cannot be validated against
 * hiring outcomes we do not have.
 */
export const ALL_TUNABLES: Record<string, Tunable> = {
  ...Object.fromEntries(Object.entries(SCORE_WEIGHTS).map(([k, v]) => [`weight.${k}`, v])),
  oldTitleCredit: OLD_TITLE_CREDIT,
  listedOnlyCredit: LISTED_ONLY_CREDIT,
  multiColumnPenalty: MULTI_COLUMN_PENALTY,
  semanticThreshold: SEMANTIC_THRESHOLD,
  bulletsPerRoleMax: BULLETS_PER_ROLE_MAX,
}

/**
 * CREDIBILITY PENALTIES — the second number.
 *
 * The keyword score answers "will a filter pass this?". It cannot answer the
 * question that decides the interview: "does a person believe this document?" A
 * résumé listed oldest-first, claiming seven years over dates spanning eleven,
 * with the same achievement written twice, scores well on keywords and loses the
 * seven-second screen. Our own writing score rated exactly that CV 81, because its
 * five dimensions measure craft — impact, verbs, sections, brevity, scan — and
 * none of them measures whether the reader trusts you.
 *
 * These are penalties off 100, and their ORDER is what matters and what is
 * defensible: a contradiction the reader can catch against LinkedIn costs more
 * than an untidy date format, because one ends the application and the other
 * costs a frown. The exact figures are ours and unmeasured — the same honest
 * caveat as SCORE_WEIGHTS, stated rather than hidden.
 *
 * Grouped by what the reader concludes:
 *   · "this is not true"        → the document is over
 *   · "a machine wrote this"    → every other line is now suspect
 *   · "this is careless"        → a deduction, not a rejection
 */
export const CREDIBILITY_PENALTIES = {
  /** Roles oldest-first: the seven-second scan lands on the wrong job. */
  reverseOrder: {
    value: 18,
    basis: "convention" as Basis,
    why: "Reverse-chronological is the most universal résumé convention there is. Breaking it means the reader's first impression is a job the candidate may have left a decade ago.",
  },
  /** An end date that has not happened. */
  futureDate: {
    value: 15,
    basis: "convention" as Basis,
    why: "A date in the future is checked against LinkedIn immediately. It reads as carelessness at best and as editing at worst — and it is the cheapest possible thing to have got right.",
  },
  /** The summary claims years the dates contradict. */
  yearsContradiction: {
    value: 15,
    basis: "convention" as Basis,
    why: "Two numbers in the same document that disagree. A reader who notices stops taking the rest at face value, and this one is visible without effort.",
  },
  /** Each pair of lines saying the same thing. Machine-written tell. */
  duplicatePair: {
    value: 8,
    basis: "convention" as Basis,
    why: "One achievement written twice is the clearest signal that nobody re-read the document. It compounds: two pairs read as a pattern, not a slip.",
  },
  /** Cap so a long CV with many repeats cannot zero the score by itself. */
  duplicateCap: {
    value: 24,
    basis: "chosen" as Basis,
    why: "Three pairs already establish the impression; further ones tell the reader nothing new and should not drive the number to zero on their own.",
  },
  /** A role carrying more lines than a recruiter reads. */
  overloadedRole: {
    value: 5,
    basis: "convention" as Basis,
    why: "Above the recruiter norm the strong lines get diluted. It costs attention, not trust — a deduction, never a rejection.",
  },
  /** Mixed date formats across roles. */
  mixedDates: {
    value: 5,
    basis: "convention" as Basis,
    why: "Inconsistent formats make the timeline harder to trust at a glance and give strict parsers two shapes to reconcile.",
  },
  /** Empty phrasing / clichés, per affected line, capped. */
  emptyLine: {
    value: 3,
    basis: "convention" as Basis,
    why: "A line that would fit any candidate spends a slot without making a claim. Individually minor, collectively the reason a CV feels generic.",
  },
  /** Every figure is an unanchored percentage — the document reads manufactured. */
  metricSaturation: {
    value: 12,
    basis: "convention" as Basis,
    why: "No career produces a clean percentage for every task. A reader who sees fifteen consecutive 'by N%' endings stops believing all fifteen, including the true ones — and the candidate finds out in the interview, when asked forty percent of what.",
  },
  /** The candidate's degree sitting in the Skills list. */
  degreeAsSkill: {
    value: 4,
    basis: "convention" as Basis,
    why: "It is what they studied, not something they can do, and it dilutes the one section an ATS indexes most heavily. Small, but free to fix.",
  },
  emptyLineCap: {
    value: 12,
    basis: "chosen" as Basis,
    why: "Past this the message is already delivered; the fix belongs in the bullet list, not in driving the headline number down further.",
  },
} as const
