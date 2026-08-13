// lib/ats/resume-integrity.ts
//
// The defects a recruiter sees in the first seven seconds and the panel never
// mentioned.
//
// Written after reading a real CV end to end the way a hiring manager would. Every
// check here comes from something that CV actually got wrong and the product
// stayed silent about — not from a list of best practices someone imagined:
//
//   · roles listed oldest-first, so the seven-second scan lands on a job from 2015
//     and the current one sits at the bottom of page two
//   · a summary claiming "7+ years" over dates that span eleven
//   · a current role written as "2023 — 2026", an end date that has not happened
//   · the same achievement written twice with a different ending, which reads as
//     machine-written and costs the candidate credibility on every other line
//
// All deterministic and pure: these run client-side on every keystroke next to the
// other writing checks, cost nothing, and cannot vary between two runs on the same
// CV.


interface Role {
  id?: string
  jobTitle?: string
  startDate?: string
  endDate?: string
  currentlyWorking?: boolean
  description?: string
}

/** Roles are listed oldest-first — the opposite of what every recruiter expects. */
export interface ChronologyIssue {
  kind: "reverse_order"
  /** The role a recruiter reads first today. */
  firstShown: string
  /** The role they should be reading first. */
  mostRecent: string
}

/** A date that has not happened yet, written as if it had. */
export interface FutureDateIssue {
  targetId: string
  jobTitle: string
  /** The offending value, exactly as typed. */
  value: string
}

/** The summary claims a number of years the dates do not support. */
export interface YearsClaimIssue {
  claimed: number
  actual: number
}

/** An education entry a parser cannot read: no degree, or no dates. */
export interface IncompleteEducation {
  index: number
  school: string
  missingDegree: boolean
  missingDates: boolean
}

/** A bullet that is the tail of the one above it, split by a page break. */
export interface OrphanFragment {
  targetId: string
  jobTitle: string
  index: number
  text: string
  /** The line it belongs to. */
  previousText: string
}

/** Two lines that say the same thing in different words. */
export interface NearDuplicate {
  targetId: string
  jobTitle: string
  index: number
  text: string
  otherIndex: number
  otherText: string
}

/** The last four-digit year in a date string, or null. */
function yearOf(raw: string | undefined): number | null {
  const years = (raw ?? "").match(/(19|20)\d{2}/g)
  if (!years?.length) return null
  const y = Number(years[years.length - 1])
  return Number.isFinite(y) ? y : null
}

function firstYearOf(raw: string | undefined): number | null {
  const y = (raw ?? "").match(/(19|20)\d{2}/)?.[0]
  return y ? Number(y) : null
}

/**
 * How recent a role is, on the same reading the chronology check uses.
 *
 * Exported because the BUTTON that reorders roles must agree with the CHECK that
 * says they are out of order. It did not: the check reads a bare year ("2015 –
 * 2016") happily, while the reorder read MM/YYYY and treated a bare year as
 * unreadable — so on a résumé written with plain years the panel said "your roles
 * are listed oldest first", and pressing the fix answered "your roles are already
 * in order". Two readers, one question, opposite answers, and the user in the
 * middle.
 *
 * An ongoing role sorts above every finished one. Null means the date cannot be
 * read at all, and the caller must leave that row where the candidate put it —
 * inventing an order is the same harm as inventing a date.
 */
export function roleRecency(role: Role): number | null {
  if (role.currentlyWorking) return Number.MAX_SAFE_INTEGER
  return yearOf(role.endDate) ?? yearOf(role.startDate)
}

/**
 * Reverse-chronological order is the single most universal résumé convention, and
 * breaking it is invisible to a keyword matcher and glaring to a person. Reported
 * only when the FIRST role is older than the LAST one — the unambiguous case. A CV
 * with one out-of-place role in the middle is untidy; a CV listed backwards is
 * showing a recruiter the wrong job.
 */
export function checkChronology(roles: Role[]): ChronologyIssue | null {
  const dated = roles
    .map((r) => ({ role: r, start: firstYearOf(r.startDate), end: r.currentlyWorking ? 9999 : yearOf(r.endDate) }))
    .filter((r): r is { role: Role; start: number; end: number } => r.start !== null && r.end !== null)
  if (dated.length < 2) return null

  const first = dated[0]
  const last = dated[dated.length - 1]
  // Strictly older, by more than a year, so two roles in the same period do not
  // trip it — someone who held two jobs in 2021 has not made a mistake.
  if (last.end - first.end < 2) return null

  const newest = dated.reduce((a, b) => (b.end > a.end ? b : a))
  if (newest.role === first.role) return null

  return {
    kind: "reverse_order",
    firstShown: first.role.jobTitle?.trim() || "—",
    mostRecent: newest.role.jobTitle?.trim() || "—",
  }
}

/**
 * An end date in the future reads as a typo at best and as carelessness at worst,
 * and it is the first thing a recruiter checks against LinkedIn. The current role
 * should say "Present", not a year that has not arrived.
 *
 * `currentYear` is injected rather than read from the clock so the check is a pure
 * function and its tests do not expire.
 */
export function checkFutureDates(roles: Role[], currentYear: number): FutureDateIssue[] {
  const out: FutureDateIssue[] = []
  for (const r of roles) {
    if (!r.id || r.currentlyWorking) continue
    const y = yearOf(r.endDate)
    if (y !== null && y > currentYear) {
      out.push({ targetId: r.id, jobTitle: r.jobTitle?.trim() || "—", value: (r.endDate ?? "").trim() })
    }
  }
  return out
}

/**
 * "7+ years of experience" over a history that spans eleven.
 *
 * Both numbers were already being computed in this codebase — the claim is in the
 * summary, the span is in the dates — and nothing ever compared them. A recruiter
 * compares them immediately, and the contradiction makes them doubt the rest.
 *
 * Only flagged when the gap is large enough to be a real inconsistency rather than
 * rounding: someone with 7.5 years writing "7 years" is being modest, not wrong.
 */
export function checkYearsClaim(summary: string, roles: Role[], currentYear: number): YearsClaimIssue | null {
  const claimed = summary.match(/(\d{1,2})\s*\+?\s*(?:years|años|year|año)/i)?.[1]
  if (!claimed) return null
  const claim = Number(claimed)
  if (!Number.isFinite(claim) || claim <= 0) return null

  const starts = roles.map((r) => firstYearOf(r.startDate)).filter((y): y is number => y !== null)
  const ends = roles.map((r) => (r.currentlyWorking ? currentYear : yearOf(r.endDate))).filter((y): y is number => y !== null)
  if (starts.length === 0 || ends.length === 0) return null

  // Span, not the sum of roles: overlapping jobs must not double-count.
  const actual = Math.max(...ends) - Math.min(...starts)
  if (actual <= 0) return null
  if (Math.abs(actual - claim) < 3) return null
  return { claimed: claim, actual }
}

/**
 * Two lines that make the same claim in different words.
 *
 * The first version of this was a similarity threshold, and it was a patch: the
 * number was fitted to the duplicates of ONE résumé, and a number fitted to one
 * document tells you about that document. It also could not answer the only
 * question that matters — WHY are these the same line? — so it had no defence
 * against a CV whose sentences happen to rhyme.
 *
 * Two bullets are one achievement written twice for one of two structural reasons,
 * and each is checkable without a magic constant:
 *
 *   1. SAME OPENING. The lines begin with the same action and the same object and
 *      then diverge — "Developed responsive SwiftUI from UI/UX designs in
 *      collaboration with designers and product owners, improving engagement" and
 *      "…, translating design requirements into a user-facing experience". A
 *      recruiter reads the first six words of each bullet; identical openings are
 *      the same claim regardless of how the tails differ.
 *
 *   2. NOTHING NEW. One line introduces essentially no content word the other
 *      lacks — "Implemented Core Data for local storage and offline capabilities,
 *      improving app functionality" next to "…, enhancing user experience". The
 *      second spends a slot to say what the first already said. This is the same
 *      principle the bullet guards already use (dropsContentWithoutGain): a line
 *      that adds no content has not earned its place.
 *
 * Either signal is enough. Both are about MEANING, so they carry across languages
 * and industries: a nurse's two lines about medication administration trip rule 1
 * exactly the way an engineer's two lines about unit tests do.
 */
/**
 * Three content words: verb + object + qualifier. That is the linguistic unit of
 * "the same action on the same thing", not a tuned number — "Administered
 * medication to patients" is one claim whether the tail is "per shift, documenting
 * each dose" or "on the ward, coordinating dosage with the physician".
 *
 * Six was the first attempt and it was too literal: it demanded the lines agree
 * well past the point where the claim is already established, so a real duplicate
 * that diverged at word four walked through. Three is validated against twelve
 * held-out pairs across nursing, accounting, teaching, warehouse, sales,
 * construction and hospitality, in both languages — see
 * resume-integrity-heldout.test.ts, which is the file that gets to decide this.
 */
const OPENING_WORDS = 3
/** How much of the shorter line's vocabulary must already be in the longer one. */
const NOTHING_NEW_RATIO = 0.8

const DUP_STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "into", "using", "used",
  "our", "their", "its", "was", "were", "have", "has", "had", "not", "but", "all",
  "new", "more", "also", "than", "when", "while", "which", "each", "per", "via",
  "to", "of", "in", "on", "by", "at", "as", "a", "an", "it",
  "los", "las", "una", "unos", "unas", "del", "con", "que", "para", "por", "como",
  "sus", "muy", "mas", "entre", "sobre", "desde", "hasta", "fue", "fueron", "han",
  "sin", "este", "esta", "estos", "estas", "de", "la", "el", "un", "y", "o", "en",
])

function contentWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9+#.]+/)
    .filter((w) => w.length > 2 && !DUP_STOPWORDS.has(w))
}

/**
 * Do these two lines talk about the SAME WORK?
 *
 * This is the one question underneath two features that were solving it
 * separately: a duplicate is two lines about the same work where one adds nothing,
 * and a merge candidate is two lines about the same work where each adds a little.
 * Answering it once means the two can never disagree — and it stops each of them
 * growing its own private thresholds.
 */
export function sharesSubject(a: string, b: string): boolean {
  return sameOpening(a, b) || overlapRatio(a, b) >= SAME_SUBJECT_RATIO
}

/** Share of the shorter line's vocabulary that the longer one also has. */
function overlapRatio(a: string, b: string): number {
  const wa = new Set(contentWords(a))
  const wb = new Set(contentWords(b))
  const [small, big] = wa.size <= wb.size ? [wa, wb] : [wb, wa]
  if (small.size < 4) return 0
  return [...small].filter((w) => big.has(w)).length / small.size
}

/**
 * Half the shorter line's vocabulary. Below this the lines are about different
 * work however similar they sound; at or above it they are circling one thing.
 * Distinct from NOTHING_NEW_RATIO, which is the much stricter bar for "and one of
 * them contributes nothing".
 */
const SAME_SUBJECT_RATIO = 0.5

/** True when the shorter line contributes essentially nothing the longer lacks. */
export function addsNothingNew(a: string, b: string): boolean {
  return overlapRatio(a, b) >= NOTHING_NEW_RATIO
}

/** Rule 1: the same action on the same object, then a different tail. */
function sameOpening(a: string, b: string): boolean {
  const wa = contentWords(a).slice(0, OPENING_WORDS)
  const wb = contentWords(b).slice(0, OPENING_WORDS)
  if (wa.length < OPENING_WORDS || wb.length < OPENING_WORDS) return false
  const n = Math.min(wa.length, wb.length)
  for (let i = 0; i < n; i++) if (wa[i] !== wb[i]) return false
  return true
}

export function findNearDuplicateBullets(
  roles: { id?: string; jobTitle?: string; bullets: string[] }[],
  max = 6,
): NearDuplicate[] {
  const out: NearDuplicate[] = []
  for (const role of roles) {
    if (!role.id) continue
    const lines = role.bullets.map((b) => b.trim()).filter((b) => b.length >= 30)
    for (let i = 0; i < lines.length && out.length < max; i++) {
      for (let j = i + 1; j < lines.length && out.length < max; j++) {
        // Identical is the other check's job — this one is for the rewrites.
        if (lines[i].toLowerCase() === lines[j].toLowerCase()) continue
        if (!sameOpening(lines[i], lines[j]) && !addsNothingNew(lines[i], lines[j])) continue
        out.push({
          targetId: role.id,
          jobTitle: role.jobTitle?.trim() ?? "",
          index: role.bullets.indexOf(lines[j]),
          text: lines[j],
          otherIndex: role.bullets.indexOf(lines[i]),
          otherText: lines[i],
        })
      }
    }
  }
  return out
}

/**
 * A bullet that is really the tail of the one above it.
 *
 * Import now repairs these before they are stored (see normalizeDescription), but
 * a CV imported BEFORE that fix still carries them, and no check could see them: a
 * line reading "5%." or "crash reports." sitting under the achievement it was cut
 * out of. Preventing the defect does not heal the documents that already have it.
 *
 * Same signals as the repair, so the two can never disagree: the line starts
 * lowercase or with a digit, the line above did not finish its sentence, and it is
 * short enough to be a fragment rather than a terse achievement. Reported with the
 * line it belongs to, so joining them is one click and the user can see it is right.
 */
const FRAGMENT_MAX_CHARS = 45

export function findOrphanFragments(
  roles: { id?: string; jobTitle?: string; bullets: string[] }[],
  max = 8,
): OrphanFragment[] {
  const out: OrphanFragment[] = []
  for (const role of roles) {
    if (!role.id) continue
    for (let i = 1; i < role.bullets.length && out.length < max; i++) {
      const line = role.bullets[i]?.trim() ?? ""
      const prev = role.bullets[i - 1]?.trim() ?? ""
      if (!line || line.length > FRAGMENT_MAX_CHARS) continue
      if (!continuesPreviousLine(line, prev)) continue
      out.push({ targetId: role.id, jobTitle: role.jobTitle?.trim() ?? "", index: i, text: line, previousText: prev })
    }
  }
  return out
}

/** The same test the description repair uses — one definition of "continues". */
function continuesPreviousLine(line: string, prev: string): boolean {
  if (!prev) return false
  return /^[\p{Ll}\d]/u.test(line) && !/[.!?:;]["')\]]?$/.test(prev)
}

/**
 * An education entry that names a school and nothing else.
 *
 * Reported from a real CV: "Education: at Catolica University" — no degree, no
 * dates. Both a parser and a recruiter expect those, and for a senior candidate a
 * bare institution reads as an unfinished form. The analyst happened to notice it
 * once; this notices it every time, in every language, without a model.
 *
 * A school with no name at all is not reported: an empty entry is something the
 * user has not filled in yet, not something they got wrong.
 */
export function findIncompleteEducation(
  entries: { school?: string; institution?: string; degree?: string; fieldOfStudy?: string; startDate?: string; endDate?: string; currentlyStudying?: boolean }[],
): IncompleteEducation[] {
  const out: IncompleteEducation[] = []
  entries.forEach((e, index) => {
    const school = (e.school ?? e.institution ?? "").trim()
    if (!school) return
    const missingDegree = !(e.degree ?? "").trim() && !(e.fieldOfStudy ?? "").trim()
    const missingDates = !(e.startDate ?? "").trim() && !(e.endDate ?? "").trim() && !e.currentlyStudying
    if (missingDegree || missingDates) out.push({ index, school, missingDegree, missingDates })
  })
  return out
}
