// lib/ats/common-misspellings.ts
//
// Deterministic spelling corrector for resume prose — no LLM, no external
// dictionary, no network. Complements near-miss.ts: that one only catches a typo
// in a word that is ALSO a job keyword (e.g. "Javscript"); this catches the
// common, embarrassing misspellings anywhere in the CV, independent of any job
// posting ("managment", "corriculum", "recieved").
//
// CONTRACT: every KEY is a string that is NOT a valid word in English OR Spanish.
// That is the whole safety model — a curated list of unambiguous misspellings
// never flags a correct word, a proper noun, a tech term, or an acronym (which a
// general spell-checker would, drowning a CV full of names and stacks in noise).
// Missing-accent-only Spanish forms are deliberately EXCLUDED (too often accepted
// informally to flag). Keys are lowercase; matching is case-insensitive and the
// correction case-matches the token it replaces.

const MISSPELLINGS: Record<string, string> = {
  // ── English ──────────────────────────────────────────────────────────────
  // Short transpositions. These were invisible until now: the nspell layer
  // skips anything under 4 letters (lowering that threshold is not an option —
  // 27 of 32 common 3-letter tech terms are unknown to both dictionaries, so
  // "aws"→"awe" and "dev"→"deb" would flood the panel). A curated list has no
  // such problem: it only ever matches what is listed. Every key below was
  // checked against dictionary-en AND dictionary-es and is a word in neither.
  moe: "more",
  teh: "the",
  hte: "the",
  taht: "that",
  wiht: "with",
  tehn: "then",
  thsi: "this",
  jsut: "just",
  waht: "what",
  woh: "who",
  yuo: "you",
  cna: "can",
  managment: "management",
  enviroment: "environment",
  enviromental: "environmental",
  recieve: "receive",
  recieved: "received",
  acheive: "achieve",
  acheived: "achieved",
  achievment: "achievement",
  achievments: "achievements",
  sucessful: "successful",
  succesful: "successful",
  sucessfully: "successfully",
  succesfully: "successfully",
  sucess: "success",
  occured: "occurred",
  occurence: "occurrence",
  seperate: "separate",
  seperately: "separately",
  definately: "definitely",
  goverment: "government",
  developement: "development",
  experiance: "experience",
  experiances: "experiences",
  responsibilty: "responsibility",
  responsibilites: "responsibilities",
  maintainance: "maintenance",
  maintainence: "maintenance",
  knowlege: "knowledge",
  knowledgable: "knowledgeable",
  proffesional: "professional",
  buisness: "business",
  calender: "calendar",
  thier: "their",
  adress: "address",
  begining: "beginning",
  beleive: "believe",
  commited: "committed",
  existance: "existence",
  familar: "familiar",
  garantee: "guarantee",
  independant: "independent",
  liason: "liaison",
  neccessary: "necessary",
  noticable: "noticeable",
  occassion: "occasion",
  persistant: "persistent",
  priviledge: "privilege",
  recomend: "recommend",
  recomended: "recommended",
  recomendation: "recommendation",
  refered: "referred",
  relevent: "relevant",
  tommorow: "tomorrow",
  untill: "until",
  colaborate: "collaborate",
  colaboration: "collaboration",
  comunicate: "communicate",
  oportunity: "opportunity",
  oportunities: "opportunities",
  sofware: "software",
  architecure: "architecture",
  engeneering: "engineering",
  anaylsis: "analysis",
  acomplished: "accomplished",
  acomplishments: "accomplishments",
  leaderhip: "leadership",
  comitment: "commitment",
  // ── Spanish (clear letter errors only — never accent-only) ───────────────
  corriculum: "currículum",
  curiculum: "currículum",
  desarollo: "desarrollo",
  desarollador: "desarrollador",
  experencia: "experiencia",
  esperiencia: "experiencia",
  conocimeintos: "conocimientos",
  abilidades: "habilidades",
  abilidad: "habilidad",
  profeccional: "profesional",
  aprendisaje: "aprendizaje",
  responsabilidenes: "responsabilidades",
}

export interface Misspelling {
  /** The word exactly as it appears in the CV (case preserved). */
  typed: string
  /** The correction, case-matched to `typed`. */
  correct: string
}

// Letter runs only (Unicode letters, incl. accents). Single words — misspellings
// are never hyphenated tech terms, so we don't touch "Objective-C" / "front-end".
const WORD_RE = /\p{L}+/gu

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
 * Keys that are also a plausible proper noun (a surname, a brand). For these the
 * lowercase form is a typo but the capitalised one is somebody's name, so they
 * match ONLY in lowercase.
 *
 * Deliberately narrow: applying "capitalised = a name" to the whole list would
 * stop "Managment" at the start of a bullet from being reported, and that is a
 * real misspelling whatever its case.
 */
const PROPER_NOUN_RISK = new Set(["moe", "woh", "cna"])

/**
 * Find common misspellings in free text. Deduped by lowercased word (first
 * occurrence's case wins), so the same slip listed once. Pure — safe on the
 * client, recomputed live as the CV is edited.
 */
export function findMisspellings(text: string): Misspelling[] {
  if (!text) return []
  const out: Misspelling[] = []
  const seen = new Set<string>()
  for (const m of text.matchAll(WORD_RE)) {
    const tok = m[0]
    const lower = tok.toLowerCase()
    const correct = MISSPELLINGS[lower]
    if (!correct || seen.has(lower)) continue
    if (PROPER_NOUN_RISK.has(lower) && tok !== lower) continue
    seen.add(lower)
    out.push({ typed: tok, correct: matchCase(correct, tok) })
  }
  return out
}
