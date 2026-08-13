// lib/ats/fix-text.ts
//
// Separates the replacement text from the instruction addressed to the user.
//
// The analyst returns one `fix` string, and the panel used it for two different
// jobs: it printed it as the explanation, and it pasted it into the CV when the
// user pressed "Apply this text". Those are not the same string, and the model
// says so in every reply:
//
//   "Developed and shipped new iOS features for a Latin American delivery app,
//    improving app usability and reducing user-reported issues; add the exact
//    feature scope, the user base or release volume, and the measurable impact
//    you can defend."
//
// The first half is a bullet. The second half is a note to the candidate. Applied
// whole, the CV goes out to a recruiter carrying the words "add the exact feature
// scope … you can defend", which is the same failure as shipping "[X%]" — the
// resume reads as unfinished, and it is our text, not the user's.
//
// This is the recurring root cause in this codebase written one more time: one
// field answering two questions. So the field is split, deterministically, before
// anything can be applied — and the instruction is not thrown away, it becomes the
// reason shown next to the button, which is where it was useful all along.
//
// The detector is a closed word class (imperative verbs that address the reader),
// not a phrase list: it composes with any object and any wording after it.

/**
 * Verbs that open an order given TO the candidate. Accent-free, matched as WHOLE
 * words — never as prefixes.
 *
 * The prefix version was wrong and the test caught it: an English CV bullet is
 * written in the past tense, so "Added two-factor authentication to the admin
 * console" starts with "add" and was classified as an instruction, which would
 * have thrown away a perfectly good rewrite. "add" is an order; "added" is a
 * candidate describing their work. The tense IS the distinction, and whole-word
 * matching captures it for free — the same holds for included / listed / named /
 * noted / provided / stated, every one of which is an ordinary bullet opener.
 */
const IMPERATIVE: readonly string[] = [
  // en
  "add", "include", "quantify", "specify", "mention", "state", "insert", "replace",
  "provide", "list", "name", "clarify", "expand", "note", "attach", "consider",
  "use your", "fill in", "swap in", "back this", "put the", "give the",
  // es — imperative and infinitive, the two forms an instruction arrives in
  "agrega", "agregue", "agregar", "anade", "anada", "anadir", "incluye", "incluya",
  "incluir", "cuantifica", "cuantificar", "especifica", "especificar", "menciona",
  "mencionar", "indica", "indicar", "reemplaza", "reemplazar", "sustituye",
  "detalla", "detallar", "aclara", "aclarar", "completa", "completar", "pon",
  "poner", "coloca", "usa tu", "usa el", "usa la",
]

/**
 * Second person. A résumé bullet never addresses its own author.
 *
 * This is the signal the imperative-verb rule missed, and it missed the two cases
 * the CEO photographed: "…improving user engagement for YOUR actual user base by
 * adding the scale, metric, and impact YOU can defend" and "…which led to YOUR
 * actual measurable impact on load time". Neither clause opens with an order, so
 * neither was caught, and both would have been pasted into a resume that then went
 * to a recruiter reading "your actual user base".
 *
 * A candidate writes "Rebuilt checkout", never "your checkout". So the moment a
 * proposed bullet says "you" or "your", the model has stopped writing the CV and
 * started talking to its owner — and everything from that point on is advice.
 */
const SECOND_PERSON = /\b(you|your|yours|yourself|tu|tus|tuyo|tuya|vos|usted|ustedes|puedas|puedes|podes|podras|tengas|tienes)\b/

/** A bracketed blank is an instruction wearing the costume of content. */
const PLACEHOLDER = /\[[^\]]{0,60}\]|\{[^}]{0,60}\}|<[^>]{0,60}>/

function foldStart(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

/** True when this clause is talking TO the candidate rather than being their CV. */
function isInstruction(clause: string): boolean {
  const c = foldStart(clause)
  if (!c) return false
  if (PLACEHOLDER.test(clause)) return true
  if (SECOND_PERSON.test(c)) return true
  // Whole words only, and only at the start: an order announces itself first.
  const words = c.replace(/^[^a-z]+/, "").split(/\s+/)
  const first = words[0] ?? ""
  const firstTwo = words.slice(0, 2).join(" ")
  return IMPERATIVE.includes(first) || IMPERATIVE.includes(firstTwo)
}

export interface SplitFix {
  /** What may be written into the CV. Empty when nothing survives. */
  replacement: string
  /** What the candidate has to do, for the reason line. Empty when there is none. */
  instruction: string
}

/**
 * Splits a fix into the part that can be applied and the part that must only be
 * read.
 *
 * Clauses are cut on the separators the model actually uses to hinge from bullet
 * to advice — semicolon, em dash, and sentence end. Order is preserved and only
 * TRAILING instruction clauses are removed: an imperative in the middle of a
 * sentence is part of the sentence ("Add-to-cart flow rebuilt…" is not an order),
 * and cutting there would mangle real text.
 */
export function splitFixText(fix: string): SplitFix {
  const text = (fix ?? "").trim()
  if (!text) return { replacement: "", instruction: "" }

  // Commas count as clause boundaries too, and they have to: the advice does not
  // always arrive as its own sentence. "…improving user engagement for your actual
  // user base" hangs off a comma, and cutting only at semicolons left it attached.
  const parts = text
    .split(/(?<=[;.,])\s+|\s+[—–]\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length <= 1) {
    return isInstruction(text) ? { replacement: "", instruction: text } : { replacement: text, instruction: "" }
  }

  // Advice is a POINT OF NO RETURN, not a trailing tag. Once the model starts
  // talking to the candidate it does not go back to writing their resume, and both
  // reported cases proved it mid-sentence rather than at the end: "…improving user
  // engagement for your actual user base by adding the scale, metric, and impact
  // you can defend" runs three more clauses past the first "your", and "…; add the
  // exact feature scope, the user base or release volume, and the measurable
  // impact…" runs two past the first order. Trimming from the end left every one
  // of them in the text that gets pasted into the CV.
  const firstAdvice = parts.findIndex(isInstruction)
  const end = firstAdvice >= 0 ? firstAdvice : parts.length

  const replacement = parts.slice(0, end).join(" ").replace(/[;,\s]+$/, "").trim()
  const instruction = parts.slice(end).join(" ").trim()
  return { replacement, instruction }
}

/**
 * Whether what survived is worth an "Apply this text" button.
 *
 * A stub is worse than no button: the user presses it, their bullet is replaced by
 * half a sentence, and the CV is now worse than before they asked for help. The
 * bar is the same one the panel already used for the model's rewrites.
 */
export function isApplicableFix(replacement: string, original: string): boolean {
  const r = replacement.trim()
  if (r.length < 25) return false
  if (r === original.trim()) return false
  // A replacement that lost more than half the original is not a rewrite of it.
  return r.length >= original.trim().length * 0.5
}

/** One word the CV spells wrong, and the word it should be. */
export interface WordCorrection {
  from: string
  to: string
}

/**
 * Reads a finding as a spelling correction — or refuses to.
 *
 * The analyst reports typos it finds in titles and skills ("Debeloper", 
 * "Objetive-C") and writes the corrected string as the fix. Those arrived with NO
 * button: the finding named a defect, showed the answer, and left the user to go
 * hunt for the word themselves in another tab. It is the smallest, most certain
 * fix in the whole report and it was the only one with no way to act on it.
 *
 * The button can only exist if we know exactly WHICH word to replace, so this
 * returns word pairs rather than "replace the whole line" — the existing writer
 * (applySpellingFix) corrects a word everywhere it appears, which is what the user
 * means: the same typo is usually in more than one place.
 *
 * Refuses whenever it is not certain. A rewrite, a reordering, a different number
 * of words: all null. Replacing the wrong word in someone's job title is worse
 * than showing no button at all.
 */
export function detectWordCorrections(issue: string, fix: string): WordCorrection[] {
  // The finding quotes the offending text; the fix is the corrected version.
  const quoted = issue.match(/["“”']([^"“”']{2,160})["“”']/)?.[1]?.trim() ?? issue.trim()
  const before = quoted.replace(/\s+/g, " ").trim()
  const after = (fix ?? "").replace(/\s+/g, " ").trim()
  if (!before || !after || before === after) return []

  const a = before.split(" ")
  const b = after.split(" ")
  // A correction keeps the sentence and changes a word. Different word counts mean
  // something was added or removed, which is a rewrite, not a spelling fix.
  if (a.length !== b.length) return []

  const diffs: WordCorrection[] = []
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue
    diffs.push({ from: a[i], to: b[i] })
  }
  // More than two changed words is a rewording. And a "correction" that shares
  // nothing with the original is a different word, not a fix of this one.
  if (diffs.length === 0 || diffs.length > 2) return []
  for (const d of diffs) {
    const from = d.from.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "")
    const to = d.to.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "")
    if (!from || !to) return []
    if (Math.abs(from.length - to.length) > 3) return []
    // Must share the opening letters — "Debeloper"→"Developer" does, "Swift"→"Kotlin" does not.
    if (from[0] !== to[0]) return []
    const shared = [...from].filter((ch) => to.includes(ch)).length
    if (shared / Math.max(from.length, to.length) < 0.7) return []
  }
  return diffs
}
