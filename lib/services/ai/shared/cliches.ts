// lib/services/ai/shared/cliches.ts
//
// One owner of the phrases that say nothing about the candidate.
//
// They lived inside summary-quality.ts, which was fine while only the summary
// checked them — and then the cover letter needed the same list and there was
// no honest place to import it from. Worse, the prompts each restated the list
// from memory and drifted: the detector rejected "proven track record" while
// the English prompt never mentioned it, and the Spanish prompt banned five
// phrases including one the detector does not check. The clichés that reached
// users were exactly the ones the model had never been told about.
//
// So the list is the only definition, and everything else reads from it: the
// checks (hasCliche), the prompts (clicheBanList), and the deterministic fixes
// (substituteCliches). Adding a phrase here bans it in the prompt and rejects
// it in the output, in one edit.
//
// A phrase belongs here when it would fit any candidate in any role. Anything
// specific to one document — a summary's missing metric, a letter's generic
// opener — belongs in that document's own quality module.

import { isEmptyPhrasing } from "./empty-phrasing"

interface Cliche {
  /** Lowercase. What the checks match and the prompt bans. */
  readonly phrase: string
  /**
   * Set only when the phrase is a PREFIX carrying real content behind it, so
   * swapping it keeps every fact and changes only the register.
   *
   * This split is the whole point. "I am excited to discuss the migration plan"
   * is a stock opener in front of a real sentence — replace the opener and the
   * sentence survives intact. "Passionate about leveraging technical expertise"
   * IS the sentence: there is nothing behind it to keep, so the only fix is to
   * write a different one, which needs the model.
   *
   * Measured, this is where the last English residual lived. "I am excited to"
   * survived the banlist AND the retry, in both attempts, every time — the
   * model has no other way to close a letter warmly and we removed the one it
   * knows. A regex settles it for free and cannot fail; a third model call
   * would cost money to land on the same phrase again.
   */
  readonly replacement?: string
}

// Wording note for the replacements: they must be genderless in Spanish (the
// letter's author is unknown to us) and must not introduce a claim of their own
// — they carry the sentence, they do not add to it.
const CLICHES_EN: readonly Cliche[] = [
  { phrase: "responsible for" },
  { phrase: "passionate about" },
  { phrase: "looking for new challenges" },
  // "experienced in" / "con experiencia en" REMOVED, measured, not on taste.
  // They matched every legitimate summary opener that names a real specialty —
  // "Enfermera con experiencia en sala de emergencias", "Ingeniero de software
  // con experiencia en sistemas de pago", "Experienced in Kubernetes and
  // Terraform" — and each match sent the quality gate off to rewrite text that
  // was correct, on almost every Spanish CV. The phrase is not the defect; the
  // defect is when what follows it is generic too, and that is a rating attached
  // to a quality noun ("Amplia experiencia en diversos entornos"), which
  // empty-phrasing.ts catches structurally without touching the honest ones.
  { phrase: "team player" },
  { phrase: "detail-oriented" },
  { phrase: "hard-working" },
  { phrase: "hard worker" },
  { phrase: "results-driven" },
  { phrase: "results-oriented" },
  { phrase: "go-getter" },
  { phrase: "self-starter" },
  { phrase: "proven track record" },
  { phrase: "think outside the box" },
  { phrase: "wear many hats" },
  { phrase: "seasoned professional" },
  { phrase: "dynamic professional" },
  { phrase: "track record of success" },
  { phrase: "a proactive person" },
  { phrase: "proactive attitude" },
  // Prefixes: the content behind them is the candidate's and survives the swap.
  { phrase: "i am excited to", replacement: "I would welcome the chance to" },
  { phrase: "i am thrilled to", replacement: "I would welcome the chance to" },
  { phrase: "i am eager to", replacement: "I would welcome the chance to" },
  // "I believe I would be a great fit" -> "I would be a great fit". The hedge
  // was the filler; dropping it leaves the claim the candidate meant to make.
  { phrase: "i believe i", replacement: "I" },
]

const CLICHES_ES: readonly Cliche[] = [
  { phrase: "responsable de" },
  { phrase: "apasionado por" },
  { phrase: "apasionada por" },
  { phrase: "busco nuevos retos" },
  // Claim forms only. The bare nouns were too broad and it cost real money:
  // "mejoraron la efectividad del trabajo en equipo" describes work the
  // candidate did, and "un enfoque proactivo al monitoreo" describes how they
  // did it — neither is self-praise, and flagging them sent the gate off to
  // retry a letter that was fine (13 model calls per 8 runs against English's
  // 8). English does not have this problem because "team player" is always a
  // claim, while "trabajo en equipo" is just the noun for teamwork.
  { phrase: "capacidad de trabajo en equipo" },
  { phrase: "habilidades de trabajo en equipo" },
  { phrase: "espíritu de trabajo en equipo" },
  { phrase: "orientado al detalle" },
  { phrase: "orientada al detalle" },
  { phrase: "persona proactiva" },
  { phrase: "perfil proactivo" },
  { phrase: "soy proactivo" },
  { phrase: "soy proactiva" },
  { phrase: "actitud proactiva" },
  { phrase: "orientado a resultados" },
  { phrase: "orientada a resultados" },
  { phrase: "don de gentes" },
  { phrase: "amplia trayectoria" },
  { phrase: "trayectoria probada" },
  { phrase: "profesional dinámico" },
  { phrase: "profesional dinámica" },
  { phrase: "me motiva" },
  { phrase: "creo firmemente" },
  // Genderless on purpose: "emocionado/a" is the candidate's, and we do not
  // know which. "Me gustaría" carries the sentence without claiming a gender.
  { phrase: "estoy emocionado de", replacement: "Me gustaría" },
  { phrase: "estoy emocionada de", replacement: "Me gustaría" },
]

/**
 * Checked against both languages whatever the document's own: a Spanish letter
 * that opens "Passionate about" is just as empty, and mixed-language text is
 * ordinary in tech CVs.
 */
const ALL: readonly Cliche[] = [...CLICHES_EN, ...CLICHES_ES]

/** Longest first, so a longer phrase is matched before a shorter one inside it. */
const SUBSTITUTABLE: readonly (Cliche & { replacement: string })[] = ALL
  .filter((c): c is Cliche & { replacement: string } => typeof c.replacement === "string")
  .sort((a, b) => b.phrase.length - a.phrase.length)

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * True when the text leans on a phrase that fits anyone.
 *
 * Two layers, and the second is the one that generalises. The list above answers
 * "is this one of the phrases we know", and measured against 50 ordinary empty
 * phrasings taken from real CVs in both languages it answered YES to none of them
 * — not because they were exotic ("Excellent communication and interpersonal
 * skills", "Profesional altamente motivado") but because a list only ever knows
 * what somebody typed into it. empty-phrasing.ts answers the structural question
 * instead — does this praise a quality rather than report work — and finds 39 of
 * the 50 while flagging NONE of ten real generated summaries.
 *
 * It could find 46 by also flagging a bare quality noun in a short line, and that
 * version was built, measured and thrown away: it hit seven of those ten real
 * summaries, because "Enfermera con experiencia en sala de emergencias" and
 * "Amplia experiencia en diversos entornos" differ only in whether the object is
 * specific. Seven false positives buy seven wasted model calls and seven users
 * told their correct sentence is a cliché; eleven misses cost one unflagged weak
 * line each.
 *
 * The list stays because it still earns its place: it carries the prefix
 * substitutions (substituteCliches) and the exact wording the prompts ban
 * (clicheBanList), and it catches set phrases that are empty for idiomatic rather
 * than structural reasons ("wear many hats").
 */
export function hasCliche(text: string): boolean {
  const lower = (text ?? "").toLowerCase()
  return ALL.some((c) => lower.includes(c.phrase)) || isEmptyPhrasing(text)
}

/** Every cliché the text carries — for logs, so a run can be explained. */
export function findCliches(text: string): string[] {
  const lower = (text ?? "").toLowerCase()
  const named = ALL.filter((c) => lower.includes(c.phrase)).map((c) => c.phrase)
  // The structural finding has no phrase to name — say so rather than return an
  // empty list for a text the gate just rejected, which reads like a bug in a log.
  if (named.length === 0 && isEmptyPhrasing(text)) return ["(empty phrasing: a quality claimed, not work reported)"]
  return named
}

/**
 * Swap the prefix clichés for their plain equivalent. Nothing else is touched.
 *
 * Runs before hasCliche, so the retry is spent only on the phrases a rewrite
 * can actually fix. Research on this problem is blunt about the alternatives:
 * logit_bias cannot express a phrase at all (it is a position-independent map
 * over single tokens — "I", " am" and " to" are load-bearing and unbannable,
 * and banning " excited" would ban the word everywhere and route the model to
 * "thrilled"/"eager"), and constrained decoding through OpenAI's Structured
 * Outputs constrains the JSON shape, never the string content. Antislop
 * (arXiv:2510.15061) reports token banning "becomes unusable at just 2,000"
 * patterns and solves it by backtracking the sampler — which needs local
 * weights we do not have. A regex on a literal string we already enumerated has
 * perfect recall and costs nothing.
 */
export function substituteCliches(text: string): string {
  let out = text ?? ""
  for (const { phrase, replacement } of SUBSTITUTABLE) {
    out = out.replace(new RegExp(escapeRe(phrase), "gi"), (match, offset: number, whole: string) =>
      fitToSentence(replacement, offset, whole),
    )
  }
  return out
}

/**
 * Keep the seam invisible: a replacement dropped mid-sentence must not arrive
 * capitalised, and one that starts a sentence must not arrive lowercase.
 * English "I" is the exception — it is capital wherever it lands.
 */
function fitToSentence(replacement: string, offset: number, whole: string): string {
  const before = whole.slice(0, offset)
  const atStart = before.trim().length === 0 || /[.!?:]\s*$|\n\s*$/.test(before)
  if (atStart) return replacement.charAt(0).toUpperCase() + replacement.slice(1)
  if (/^I\b/.test(replacement)) return replacement
  return replacement.charAt(0).toLowerCase() + replacement.slice(1)
}

/**
 * The banned list as the prompt states it, straight from the detector.
 *
 * The model is told exactly what will be rejected — nothing more, nothing less.
 * Naming them is safe: the "don't think of a pink elephant" claim is folklore
 * for LLMs — the article that ranks for it concedes its evidence is "anecdotal
 * … not controlled experiments", and the paper usually cited (arXiv:2402.07896)
 * is a fine-tuning method, not evidence that listing a phrase summons it. What
 * IS measured is the opposite failure: asking for a thing and banning its most
 * natural form at once. Control Illusion (arXiv:2502.15851) put gpt-4o-mini
 * through 1,200 mutually exclusive constraint pairs — including include-vs-
 * exclude-a-keyword, this exact shape — and obedience fell to 9.6–45.8% against
 * a 74.8–90.8% single-constraint baseline. So: ban freely, but never ban
 * something the same prompt asks for.
 */
export function clicheBanList(language: "es" | "en"): string {
  const list = language === "en" ? CLICHES_EN : CLICHES_ES
  return list.map((c) => `"${c.phrase.charAt(0).toUpperCase()}${c.phrase.slice(1)}"`).join(", ")
}
