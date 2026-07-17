// lib/services/ai/shared/cover-letter-quality.ts
//
// Deterministic "is this letter already good?" — the same move that fixed the
// summary, with the letter's own criteria.
//
// improve-cover-letter asks the model this in prose (rule 7: "if the letter is
// already strong ... return already_optimized"). Measured live, it said yes 0
// times out of 3 on a letter that was concrete, quantified and cliché-free. The
// reason is structural, not wording: the endpoint returns three versions or
// nothing, so "return nothing" reads to the model like failing the task. The
// summary's STEP 0 lost the same argument 0/5, and no amount of licensing in
// the prompt moved it.
//
// Every criterion here is one the prompts already state, made checkable:
//   • clichés            — "Avoid clichés: passionate, team player, hard worker"
//   • generic opener     — "No generic openers like 'I am writing to apply...'"
//   • paragraph structure — "Keep the 3-4 paragraph structure"
//
// What is NOT checked matters as much. Rule 7 also says "aligned to the role",
// which needs the job description this endpoint never receives; and "concrete
// and specific" has no honest regex. So this cannot prove a letter is strong —
// only that it carries none of the three faults the prompt names. That is why
// the pre-check demands all three pass before it declines to spend a call: a
// wrong "already good" costs the user an improvement they wanted, and it is the
// one direction where being conservative is free.
//
// Deliberately NOT reused from the summary: assessSummary rejects personal
// pronouns, and a cover letter is written in the first person. Copying it over
// would have flagged every correct letter.
import { hasCliche } from "./cliches"

export interface CoverLetterQuality {
  /** True when the letter carries none of the faults the prompts ban. */
  alreadyGood: boolean
  issues: ("cliche" | "generic_opener" | "thin_structure")[]
}

/**
 * The openers the prompt already calls out by name, plus the shapes they take.
 *
 * Anchored to the letter's opening — "I am writing to..." three paragraphs in
 * is a sentence, not a weak hook. The salutation is skipped first, since every
 * letter opens with one and it is not the hook the rule is about.
 */
const GENERIC_OPENERS: readonly RegExp[] = [
  /^i am writing (to|in|regarding|about|because)/i,
  /^i'm writing (to|in|regarding|about|because)/i,
  /^i would like to (apply|express|submit)/i,
  /^i am applying (for|to)/i,
  /^please (accept|find) (this|my|attached)/i,
  /^me dirijo a (usted|ustedes)/i,
  /^escribo para (expresar|solicitar|manifestar|postular)/i,
  /^(quisiera|me gustaría) (expresar|postular|solicitar|manifestar)/i,
  /^por medio de la presente/i,
  /^adjunto (mi|el) (cv|curr[ií]culum|curriculum)/i,
]

/** Dear X, / Estimado X: — present in every letter, never the hook itself. */
const SALUTATION = /^(dear|estimad[oa]s?|apreciad[oa]s?|hola|a quien corresponda|to whom it may concern)\b[^\n]*/i

/**
 * @param plain the letter as text, not the HTML the editor stores.
 */
export function assessCoverLetter(plain: string): CoverLetterQuality {
  const text = (plain ?? "").trim()
  const issues: CoverLetterQuality["issues"] = []

  if (hasCliche(text)) issues.push("cliche")

  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const body = paragraphs.filter((p) => !SALUTATION.test(p))
  const hook = body[0] ?? ""
  if (GENERIC_OPENERS.some((re) => re.test(hook))) issues.push("generic_opener")

  // Rule 1 of the improve prompt: hook → achievements → value → closing CTA.
  // Counting the body, so the salutation cannot pass as one of the four.
  if (body.length < 3) issues.push("thin_structure")

  return { alreadyGood: issues.length === 0, issues }
}
