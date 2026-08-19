// Verification that repairs instead of deleting.
//
// THE PROBLEM THIS FIXES, measured before it was written. The import checks
// every field against the source text before saving it, which is right — the
// model must not be able to invent an employer or an email. But the check was a
// literal substring match against text pulled out of a PDF, and PDF text
// extraction does not preserve spacing:
//
//   the PDF renders          the extractor yields        the check said
//   mikisaraviaios@gmail.com "mikisaravia ios@gmail.com"  NOT GROUNDED → deleted
//   +591 76944986            "+591 769 44986"             NOT GROUNDED → deleted
//   ...bugs by 15%           "...bugs by 15 %"            HALLUCINATED → line cut
//
// So the guard deleted the user's own email, their own phone, and lines of
// their own résumé — silently, and precisely for the users whose PDF was laid
// out in columns, which is most of them.
//
// The rule now: a check that fails does not get to empty a field. It escalates.
//   1. exact match on the raw text            (unchanged, fastest)
//   2. match on NORMALISED text               (spacing, case, punctuation)
//   3. recover the real value FROM THE SOURCE (the PDF has it — go find it)
//   4. only then, empty — and it is reported, never silent
//
// Steps 2 and 3 are what the literature calls extract-then-restore: verify in
// tiers and repair what is wrong instead of dropping the record. Step 3 is the
// important one — when the model's email does not match, the answer is not
// "this person has no email", it is "read the email out of the PDF".
//
// What does NOT change: nothing here ever invents. Every value it returns comes
// from the source document.

/** Case, whitespace and separators removed — what "the same value" means here. */
export function tighten(value: string): string {
  return value.toLowerCase().replace(/[\s ._\-()[\]]/g, "")
}

/**
 * Percentages, thousands separators and currency spacing made uniform, so a
 * figure the model re-rendered is recognised as the figure the CV states.
 * "15 %" / "15%" / "15 por ciento" are one number; "15%" and "20%" are two.
 */
export function normaliseFigures(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s*%/g, "%")
    .replace(/\s*(por ciento|percent|pct)\b/g, "%")
    .replace(/(\d)[.,](\d{3})\b/g, "$1$2")
    .replace(/\s+/g, " ")
}

/** True when `value` appears in `source` once spacing and case stop counting. */
export function appearsIn(value: string, source: string): boolean {
  const v = tighten(value)
  return v.length > 0 && tighten(source).includes(v)
}

const EMAIL_RE = /[a-z0-9._%+-]+\s*@\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}/i
// Long enough not to match a year or a postcode, loose enough for the way
// numbers are written across the countries this serves.
const PHONE_RE = /(\+?\d[\d\s().-]{7,17}\d)/
const URL_RE = (host: string) => new RegExp(`(?:https?://)?(?:www\\.)?${host}[^\\s,;]*`, "i")

/**
 * The contact value, recovered from the document when the model's version does
 * not check out.
 *
 * Returns "" only when the source genuinely contains nothing of that kind —
 * which is a fact about the CV, not a verification failure.
 */
export function recoverContact(
  kind: "email" | "phone" | "url",
  modelValue: string,
  source: string,
  host?: string,
): string {
  const value = modelValue.trim()
  if (value && appearsIn(value, source)) return value

  if (kind === "email") {
    const found = source.match(EMAIL_RE)?.[0]
    // The PDF split it; the address itself is what goes on the CV.
    return found ? found.replace(/\s+/g, "") : ""
  }
  if (kind === "phone") {
    const found = source.match(PHONE_RE)?.[0]
    return found ? found.trim().replace(/\s{2,}/g, " ") : ""
  }
  if (host) {
    const found = source.match(URL_RE(host))?.[0]
    return found ? found.replace(/\s+/g, "") : ""
  }
  return ""
}

/** Which host a profile URL belongs to, for the recovery above. */
export function hostOf(url: string): string | undefined {
  const known = ["linkedin.com", "github.com", "gitlab.com", "behance.net", "dribbble.com", "medium.com"]
  const lower = url.toLowerCase()
  return known.find((h) => lower.includes(h.split(".")[0]))
}

/** A line that reads as a bullet in extracted PDF text, whatever marker it used. */
const BULLET_LINE = /^\s*(?:[•·▪●○◦*\-–—]|\d+[.)])\s+\S/
/** The marker alone — stripping with BULLET_LINE would eat the first letter. */
const BULLET_MARKER = /^\s*(?:[•·▪●○◦*\-–—]|\d+[.)])\s+/

/**
 * The lines the document itself gives for one role.
 *
 * Used when verification left a role with no description at all. It walks the
 * source to the line naming that role (or its employer) and takes the bullet
 * lines that follow, stopping at the next role heading — so what lands in the
 * CV is the person's own text, copied, not a model's reconstruction of it.
 *
 * Returns "" when the document has no bullets there, which is a fact about the
 * CV rather than a failure: some roles genuinely carry no description.
 */
export function linesForRole(source: string, jobTitle: string, employer: string): string {
  const lines = source.split("\n")
  const emp = tighten(employer ?? "")
  const title = tighten(jobTitle ?? "")
  if (emp.length < 3 && title.length < 3) return ""

  // The employer identifies the block, the job title does not: a CV with four
  // "iOS Developer" roles would otherwise hand every one of them the bullets of
  // the first. Fall back to the title only when there is no employer to find.
  const find = (needle: string) =>
    needle.length > 2 ? lines.findIndex((line) => tighten(line).includes(needle)) : -1
  const start = find(emp) !== -1 ? find(emp) : find(title)
  if (start === -1) return ""

  const out: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    if (BULLET_LINE.test(line)) {
      out.push(line.replace(BULLET_MARKER, "").trim() || line.trim())
      continue
    }
    // A non-bullet line after we have started collecting is the next heading.
    if (out.length) break
    // Before any bullet, a heading-looking line means this role's block ended
    // without one — do not walk into the next job and steal its lines.
    if (/^\s*[A-ZÁÉÍÓÚÑ][^\n]{0,80}$/.test(line) && !BULLET_LINE.test(line)) break
  }
  return out.join("\n")
}
