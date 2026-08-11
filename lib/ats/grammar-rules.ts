// lib/ats/grammar-rules.ts
//
// Grammar errors that are ENUMERABLE, and therefore belong in code.
//
// The grammar pass costs a model call, is gated to PRO, is metered, and returned
// "resulting in in" → "resulting in a" as a paid finding. A repeated word is not a
// judgement call: it is two equal tokens side by side. Anything we can write down
// as a rule runs here instead — free, for every plan, identical on every run, no
// quota, no tokens.
//
// The model keeps only the classes that need reading comprehension (agreement
// across a clause, wrong preposition for the context). Each language gets rules
// written FOR it, never translated: contractions and the accent on "más" have no
// English counterpart, and "would of" and article agreement have no Spanish one.
// Mirroring rules across languages would either invent errors or miss the real
// ones.
//
// SAME ETHOS AS spellcheck.ts: a rule that cries wolf teaches the user to ignore
// the panel, so every rule stays silent when unsure. That is why the exclusions
// are longer than the rules.
//
// Findings use the shape the dictionary emits, so they ride the same free
// endpoint and the same Fix button (applySpellingFix replaces whole words and its
// regex handles multi-word spans like "in in" and "a el").

export interface GrammarIssue {
  /** The wrong text, exactly as written in the CV. */
  typed: string
  /** The correction; the first entry is what Fix applies. */
  suggestions: string[]
  /** Why it is wrong, in the CV's language. */
  why: string
  /** Rule that fired — so a false positive is diagnosed, not guessed at. */
  rule: string
}

/** A finding plus where it was found, so the list can be ordered by position. */
interface Located extends GrammarIssue {
  at: number
}

interface Token {
  text: string
  start: number
  end: number
  /** Letters only. Digits and symbols are tokens too, but never words. */
  word: boolean
}

/**
 * Words and numbers with their positions.
 *
 * The rules below all look at ADJACENT pairs, which a regex over the raw text
 * cannot do reliably: scanning "resulting in in delays" for two words in a row
 * consumes "resulting in" as the first match, so the actual repeat "in in" is
 * never examined. Tokenising once and comparing neighbours removes that whole
 * class of miss instead of working around it.
 */
function tokenize(text: string): Token[] {
  const out: Token[] = []
  const re = /\p{L}+|\d+/gu
  for (const m of text.matchAll(re)) {
    out.push({
      text: m[0],
      start: m.index,
      end: m.index + m[0].length,
      word: /^\p{L}/u.test(m[0]),
    })
  }
  return out
}

/** The raw text between two tokens — a newline means two separate bullets. */
const gapBetween = (text: string, a: Token, b: Token) => text.slice(a.end, b.start)
const spansLines = (gap: string) => /[\n\r]/.test(gap)

/** Copies a leading capital from the text being replaced onto the correction. */
function matchLeadingCase(sample: string, fix: string): string {
  const first = sample[0]
  return first && first === first.toUpperCase() && first !== first.toLowerCase()
    ? fix.charAt(0).toUpperCase() + fix.slice(1)
    : fix
}

/**
 * Word pairs that are legitimately repeated, so the repeat rule stays quiet.
 *
 * English "had had" and "that that" are correct constructions. Spanish has none
 * common in résumé prose; the empty set exists so adding one is a data change.
 */
const LEGITIMATE_REPEATS: Record<"es" | "en", Set<string>> = {
  en: new Set(["had", "that"]),
  es: new Set([]),
}

/** "resulting in in delays", "resultando en en retrasos". Both languages. */
function findRepeatedWords(text: string, tokens: Token[], language: "es" | "en"): Located[] {
  const out: Located[] = []
  for (let i = 0; i + 1 < tokens.length; i++) {
    const a = tokens[i]
    const b = tokens[i + 1]
    // Words only, and at least two letters: "10 10 nodes" and "C C builds" are not
    // typos, and single letters are initials.
    if (!a.word || !b.word || a.text.length < 2) continue
    if (a.text.toLowerCase() !== b.text.toLowerCase()) continue
    if (LEGITIMATE_REPEATS[language].has(a.text.toLowerCase())) continue
    const gap = gapBetween(text, a, b)
    if (spansLines(gap) || gap.trim()) continue
    out.push({
      at: a.start,
      typed: text.slice(a.start, b.end),
      suggestions: [a.text],
      why: language === "en" ? "repeated word" : "palabra repetida",
      rule: "REPEATED_WORD",
    })
  }
  return out
}

/**
 * Spanish-only: "a el" → "al", "de el" → "del".
 *
 * Two exclusions make this safe, and without them it is a false-positive machine:
 *   · "a él" and "de él" are CORRECT — the pronoun carries the accent, so only a
 *     bare unaccented "el" is an error;
 *   · "de El Salvador", "a El Alto" — a capitalised "El" belongs to a proper noun
 *     and is never contracted. Résumés are full of these.
 */
function findMissingContractions(text: string, tokens: Token[]): Located[] {
  const out: Located[] = []
  for (let i = 0; i + 2 < tokens.length; i++) {
    const [prep, article, next] = [tokens[i], tokens[i + 1], tokens[i + 2]]
    const p = prep.text.toLowerCase()
    if (p !== "a" && p !== "de") continue
    // Exactly "el": "él" carries an accent, "El" opens a proper noun.
    if (article.text !== "el") continue
    // A following lowercase word confirms a common noun follows.
    if (!/^\p{Ll}/u.test(next.text)) continue
    const gap = gapBetween(text, prep, article)
    if (spansLines(gap) || gap.trim()) continue
    out.push({
      at: prep.start,
      typed: text.slice(prep.start, article.end),
      suggestions: [matchLeadingCase(prep.text, p === "a" ? "al" : "del")],
      why: "contracción",
      rule: "CONTRACCION",
    })
  }
  return out
}

/**
 * Spanish-only: "mas de 7 años" → "más de 7 años".
 *
 * Restricted to the quantity reading. Bare "mas" is a valid word meaning "pero",
 * so a blanket rule would flag correct prose — "Diseñé la interfaz, mas la
 * migración quedó pendiente" needs no accent.
 */
function findMissingAccentOnMas(text: string, tokens: Token[]): Located[] {
  const out: Located[] = []
  for (let i = 0; i + 1 < tokens.length; i++) {
    const mas = tokens[i]
    if (mas.text.toLowerCase() !== "mas") continue
    const next = tokens[i + 1]
    const quantity =
      next.text.toLowerCase() === "del" ||
      (next.text.toLowerCase() === "de" && tokens[i + 2] && !tokens[i + 2].word)
    if (!quantity) continue
    out.push({
      at: mas.start,
      typed: mas.text,
      suggestions: [matchLeadingCase(mas.text, "más")],
      why: "cantidad: lleva tilde",
      rule: "MAS_TILDE",
    })
  }
  return out
}

/**
 * English-only confusables that are wrong in every reading a résumé produces.
 *
 * Not a general then/than rule — that needs the clause. These four comparatives
 * and the three "of" for "have" mis-hearings need only a lookup.
 */
const EN_CONFUSABLES = new Map<string, { fix: string; why: string }>([
  ["more then", { fix: "more than", why: "comparative takes “than”" }],
  ["less then", { fix: "less than", why: "comparative takes “than”" }],
  ["rather then", { fix: "rather than", why: "“rather than”, not “then”" }],
  ["other then", { fix: "other than", why: "“other than”, not “then”" }],
  ["would of", { fix: "would have", why: "“would have”, not “of”" }],
  ["could of", { fix: "could have", why: "“could have”, not “of”" }],
  ["should of", { fix: "should have", why: "“should have”, not “of”" }],
])

function findEnglishConfusables(text: string, tokens: Token[]): Located[] {
  const out: Located[] = []
  for (let i = 0; i + 1 < tokens.length; i++) {
    const a = tokens[i]
    const b = tokens[i + 1]
    if (!a.word || !b.word) continue
    const hit = EN_CONFUSABLES.get(`${a.text.toLowerCase()} ${b.text.toLowerCase()}`)
    if (!hit) continue
    const gap = gapBetween(text, a, b)
    if (spansLines(gap) || gap.trim()) continue
    out.push({
      at: a.start,
      typed: text.slice(a.start, b.end),
      suggestions: [matchLeadingCase(a.text, hit.fix)],
      why: hit.why,
      rule: "EN_CONFUSABLE",
    })
  }
  return out
}

/**
 * English-only: "a" before a vowel sound, "an" before a consonant.
 *
 * Deliberately narrow, because the real rule is PHONETIC and a spelling proxy
 * gets it wrong on exactly the words résumés are full of:
 *   · "u" is excluded — "a user", "a UI" are right, "an umbrella" is too, and the
 *     spelling does not tell them apart;
 *   · "h" is excluded — "an hour" vs "a hierarchy";
 *   · capitals and acronyms are excluded — "a SQL query" and "an SQL query" are
 *     both defensible depending on how it is read aloud.
 * What is left ("a increase", "an release") is wrong in every reading.
 */
const PHONETIC_EXCEPTIONS = /^[huHU]/

function findArticleAgreement(text: string, tokens: Token[]): Located[] {
  const out: Located[] = []
  for (let i = 0; i + 1 < tokens.length; i++) {
    const article = tokens[i]
    const word = tokens[i + 1]
    const a = article.text.toLowerCase()
    if (a !== "a" && a !== "an") continue
    if (!word.word || !/^\p{Ll}/u.test(word.text)) continue
    if (PHONETIC_EXCEPTIONS.test(word.text)) continue
    const vowel = /^[aeio]/.test(word.text)
    const isAn = a === "an"
    if (vowel === isAn) continue
    const gap = gapBetween(text, article, word)
    if (spansLines(gap) || gap.trim()) continue
    out.push({
      at: article.start,
      typed: text.slice(article.start, word.end),
      suggestions: [`${matchLeadingCase(article.text, isAn ? "a" : "an")}${gap}${word.text}`],
      why: vowel ? "“an” before a vowel" : "“a” before a consonant",
      rule: "EN_ARTICLE",
    })
  }
  return out
}

/**
 * Every enumerable grammar finding across the CV's prose, in reading order.
 *
 * Pure: same prose in, same findings out, no I/O and no model. Callable from the
 * free endpoint, testable without a harness.
 */
export function findGrammarIssues(texts: string[], language: "es" | "en"): GrammarIssue[] {
  const found: Located[] = []
  for (const text of texts) {
    if (!text?.trim()) continue
    const tokens = tokenize(text)
    // Shared: a word typed twice is a slip in any language.
    found.push(...findRepeatedWords(text, tokens, language))
    if (language === "es") {
      found.push(...findMissingContractions(text, tokens))
      found.push(...findMissingAccentOnMas(text, tokens))
    } else {
      found.push(...findEnglishConfusables(text, tokens))
      found.push(...findArticleAgreement(text, tokens))
    }
  }
  // Reading order, so the list matches the CV instead of the order the rules
  // happen to run in.
  found.sort((a, b) => a.at - b.at)
  // The same slip in two bullets is one row: Fix rewrites every prose field at
  // once, so a second button would have nothing left to do.
  const seen = new Set<string>()
  const out: GrammarIssue[] = []
  for (const f of found) {
    const key = f.typed.toLowerCase().replace(/\s+/g, " ")
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ typed: f.typed, suggestions: f.suggestions, why: f.why, rule: f.rule })
  }
  return out
}
