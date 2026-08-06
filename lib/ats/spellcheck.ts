// lib/ats/spellcheck.ts
//
// Real spelling check for résumé prose — full Hunspell dictionaries (es + en),
// deterministic, no LLM, no quota, no cost per run.
//
// It replaces a hand-written list of ~80 known misspellings, which only ever
// caught a typo somebody had thought to add to the list. A dictionary catches
// the word the user actually got wrong.
//
// SERVER ONLY. The dictionaries are ~1.5 MB of .dic/.aff and are loaded once per
// process, so the browser never downloads them; the client sends prose and gets
// back a short list of findings.
//
// The hard part of a CV spell-checker is NOT finding unknown words — it is not
// crying wolf. A résumé is full of proper nouns and stacks that no dictionary
// contains ("Kubernetes", "Dokploy", "Saravia", "iOS"). Every heuristic below
// exists to keep those out of the report, because a panel that flags a correct
// name teaches the user to ignore the panel. When in doubt, we stay silent.

import { isKnownSkill } from "@/lib/ats/skills-dictionary"

export interface SpellIssue {
  /** The word exactly as written in the CV. */
  typed: string
  /** Best correction (case-matched), plus up to 2 alternatives. */
  suggestions: string[]
}

type Speller = { correct: (w: string) => boolean; suggest: (w: string) => string[] }

const spellers = new Map<"es" | "en", Promise<Speller>>()

/** One Hunspell instance per language per process — the load is the expensive part. */
function getSpeller(language: "es" | "en"): Promise<Speller> {
  const cached = spellers.get(language)
  if (cached) return cached
  const loading = (async () => {
    const [{ default: nspell }, dict] = await Promise.all([
      import("nspell"),
      language === "es" ? import("dictionary-es") : import("dictionary-en"),
    ])
    return nspell((dict as { default: unknown }).default) as Speller
  })()
  spellers.set(language, loading)
  return loading
}

// Letter runs only. Hyphens and digits break the token on purpose: "front-end"
// checks as "front" + "end", and "S3"/"C++" never reach the dictionary at all.
const WORD_RE = /\p{L}+/gu
/** Ends a sentence — the next word may legitimately be capitalised. */
const SENTENCE_END = /[.!?:;•\n\r]\s*$/u

const MIN_LENGTH = 4
/**
 * Cap on reported words. Not a performance guard (6k words check in ~0 ms) — a
 * usability one: a list of eighty rows is not a fix list, it is a wall. The user
 * fixes these, re-runs, and gets the next batch.
 */
const MAX_ISSUES = 30
/** Beyond this the "correction" is a different word, not a fix. */
const MAX_EDIT_DISTANCE = 2

/** Levenshtein, capped: we only care whether it is within MAX_EDIT_DISTANCE. */
function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > MAX_EDIT_DISTANCE) return MAX_EDIT_DISTANCE + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = cur
  }
  return prev[b.length]
}

/**
 * Is `b` reachable from `a` by swapping two adjacent letters? ("recieved" →
 * "received"). Two edits by Levenshtein, one slip by hand — the only distance-2
 * shape we trust.
 */
function isTransposition(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const diff: number[] = []
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff.push(i)
  return diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]]
}

/**
 * Would a human read this "correction" as a fix, or as a different word?
 *
 * One edit is a typo. Two arbitrary edits is a substitution: "reutilizables" →
 * "fertilizables" and "mentorando" → "centonando" are both distance 2, and both
 * are the checker inventing a word the candidate never meant. Distance 2 is only
 * accepted as an adjacent swap, which is a real and common slip.
 */
function isPlausibleCorrection(typed: string, suggestion: string): boolean {
  const d = editDistance(typed, suggestion)
  if (d === 0 || d > MAX_EDIT_DISTANCE) return false
  if (d === 1) return true
  return isTransposition(typed, suggestion)
}

/**
 * Spanish derivational morphology the bundled dictionary does not carry.
 *
 * `dictionary-es` knows "monitor" but not "monitoreo", knows "utilizable" but
 * not "reutilizable", knows "mentor" but not "mentorando" — all real words the
 * checker was reporting with a confident, wrong fix. If stripping a productive
 * affix leaves a word either dictionary knows, the word is real and we stay
 * quiet.
 *
 * ENGLISH SUFFIXES ARE DELIBERATELY ABSENT. `dictionary-en` is comprehensive, so
 * there is nothing to rescue — and stripping "-ed"/"-ing"/"-s" would silence the
 * doubled-consonant misspellings we most want to catch ("occured" → "occur",
 * "refered" → "refer").
 */
const ES_SUFFIXES = [
  // Accented forms only: "-cion" without its accent IS the misspelling
  // ("produccion"), so accepting it as a suffix would silence the typo.
  "ización", "aciones", "ación", "ciones", "ción", "mente",
  "izados", "izadas", "izado", "izada", "izar", "eando", "eados", "eado", "ear", "eos", "eo",
  "ando", "endo", "ados", "adas", "ado", "ada", "ables", "able", "ibles", "ible",
  "dores", "doras", "dor", "dora", "istas", "ista", "es", "s",
]
const ES_PREFIXES = [
  "re", "des", "pre", "pro", "anti", "auto", "multi", "sub", "inter", "super",
  "micro", "macro", "semi", "contra", "sobre", "co",
]
/** Shortest stem we will accept — below this the "root" is a fragment, not a word. */
const MIN_STEM = 4

function isDerivedFromKnownWord(lower: string, known: (w: string) => boolean): boolean {
  for (const suffix of ES_SUFFIXES) {
    if (!lower.endsWith(suffix) || lower.length - suffix.length < MIN_STEM) continue
    const stem = lower.slice(0, -suffix.length)
    // The bare stem, or the stem restored to a citation form ("pagin" → "pagina",
    // "monitor" → "monitorar"). Spanish drops the theme vowel before a suffix.
    if (["", "o", "a", "e", "ar", "er", "ir"].some((tail) => known(stem + tail))) return true
  }
  for (const prefix of ES_PREFIXES) {
    if (!lower.startsWith(prefix) || lower.length - prefix.length < MIN_STEM) continue
    if (known(lower.slice(prefix.length))) return true
  }
  return false
}

/** Shortest half of a compound. "back" + "end" is the tightest real case. */
const MIN_COMPOUND_PART = 3

/**
 * Closed compounds neither dictionary lists: "backend", "frontend", "fullstack",
 * "roadmap". Both halves must be real words, which is strict enough that no
 * misspelling in the test corpus reaches it.
 */
function isCompoundOfKnownWords(lower: string, known: (w: string) => boolean): boolean {
  for (let i = MIN_COMPOUND_PART; i <= lower.length - MIN_COMPOUND_PART; i++) {
    if (known(lower.slice(0, i)) && known(lower.slice(i))) return true
  }
  return false
}

/** Copy the case pattern of `sample` (UPPER / Titlecase / lower) onto `correct`. */
function matchCase(correct: string, sample: string): string {
  if (sample.length > 1 && sample === sample.toUpperCase() && sample !== sample.toLowerCase()) {
    return correct.toUpperCase()
  }
  if (sample[0] === sample[0]?.toUpperCase() && sample[0] !== sample[0]?.toLowerCase()) {
    return correct.charAt(0).toUpperCase() + correct.slice(1)
  }
  return correct
}

/**
 * Words we never judge, whatever the dictionary thinks.
 *
 * `capitalisedMidSentence` is the strongest single signal in a résumé: a
 * capitalised word that is NOT starting a sentence is a name — of a company, a
 * product, a person, a city, a framework. Those are exactly the words no
 * dictionary has, and exactly the ones it must not "correct".
 */
function isExempt(token: string, capitalisedMidSentence: boolean): boolean {
  if (token.length < MIN_LENGTH) return true
  // ALL CAPS → acronym (SQL, CI, KPI, ATS).
  if (token === token.toUpperCase() && token !== token.toLowerCase()) return true
  // Internal capital → camelCase / PascalCase tech (JavaScript, PostgreSQL).
  if (/\p{Lu}/u.test(token.slice(1))) return true
  if (capitalisedMidSentence) return true
  if (isKnownSkill(token)) return true
  return false
}

/**
 * Finds misspellings in the candidate's prose.
 *
 * A word is reported ONLY when: the CV's language does not know it, the OTHER
 * language does not know it either (a Spanish CV is full of English tech words
 * and vice-versa), it is not exempt above, and the dictionary offers a fix
 * within two edits. Anything less certain is dropped — under-reporting is a
 * cosmetic loss, over-reporting makes the feature unusable.
 */
export async function checkSpelling(
  texts: string[],
  language: "es" | "en",
  properNouns: string[] = [],
): Promise<SpellIssue[]> {
  const joined = texts.filter(Boolean).join("\n")
  if (!joined.trim()) return []

  // Every word the CV itself uses as a name is off-limits, wherever it appears.
  const exempt = new Set<string>()
  for (const noun of properNouns) {
    for (const part of noun.toLowerCase().matchAll(WORD_RE)) exempt.add(part[0])
  }

  const [primary, secondary] = await Promise.all([
    getSpeller(language),
    getSpeller(language === "es" ? "en" : "es"),
  ])

  /** Known to EITHER dictionary — a CV mixes languages in every other sentence. */
  const known = (w: string) => primary.correct(w) || secondary.correct(w)

  const out: SpellIssue[] = []
  const seen = new Set<string>()

  for (const m of joined.matchAll(WORD_RE)) {
    const token = m[0]
    const lower = token.toLowerCase()
    if (seen.has(lower)) continue

    const startsSentence = m.index === 0 || SENTENCE_END.test(joined.slice(Math.max(0, m.index - 3), m.index))
    const capitalised = token[0] === token[0].toUpperCase() && token[0] !== token[0].toLowerCase()
    if (exempt.has(lower)) continue
    if (isExempt(token, capitalised && !startsSentence)) continue

    if (primary.correct(token) || primary.correct(lower)) continue
    // Loan words: "software" in a Spanish CV, "currículum" in an English one.
    if (secondary.correct(token) || secondary.correct(lower)) continue

    // Real words the bundled dictionaries simply do not carry. Reporting these
    // is worse than missing a typo: the user is told a correct word is wrong,
    // and handed a word that does not belong in the sentence.
    if (isDerivedFromKnownWord(lower, known)) continue
    if (isCompoundOfKnownWords(lower, known)) continue

    const suggestions = primary
      .suggest(lower)
      .filter((s) => isPlausibleCorrection(lower, s.toLowerCase()))
      .slice(0, 3)
    if (suggestions.length === 0) continue

    seen.add(lower)
    out.push({ typed: token, suggestions: suggestions.map((s) => matchCase(s, token)) })
    if (out.length >= MAX_ISSUES) break
  }

  return out
}
