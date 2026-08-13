import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

/** Normalize a job/edu description for safe HTML rendering.
 *  Lines starting with • or - are rendered as <ul><li> items.
 *  Continuation lines (no bullet prefix) are merged into the previous bullet
 *  so mid-bullet Enter presses don't produce orphaned lines. */
// The full set of glyphs that show up as list markers across résumés and PDF-to-text
// extraction — never assume a single "•". Covers dots, squares, arrows, checks, dashes,
// and pluses. Numbered/lettered prefixes (1. 1) a. i)) are handled separately.
const BULLET_GLYPHS = "•●○◦▪▫■□‣⁃∙·◆◇►▶▸▹▷→➔➜➤⇒✓✔❖*+‑–—-"
// A leading list marker on a line: a glyph, OR a number/letter followed by . or ).
const LEADING_MARKER = new RegExp(`^\\s*(?:[${BULLET_GLYPHS.replace(/[\\\]^-]/g, "\\$&")}]|\\d{1,2}[.)]|[a-zA-Z][.)])\\s+`)
// Any of those glyphs sitting mid-line (an inline "a • b • c" list).
const INLINE_GLYPH = new RegExp(`([^\\n])\\s+([${BULLET_GLYPHS.replace(/[\\\]^-]/g, "\\$&")}])\\s+`, "g")
// Non-global tester for "does this line contain an inline glyph list?" (no lastIndex state).
const HAS_INLINE_GLYPH = new RegExp(`[^\\n]\\s+[${BULLET_GLYPHS.replace(/[\\\]^-]/g, "\\$&")}]\\s+`)

// A line like "a • b • c" is a full inline list: its FIRST item has no leading marker,
// so pre-mark it so every item is treated as a bullet (not the first as an intro).
function preMarkInlineLists(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim()
      return trimmed && !LEADING_MARKER.test(trimmed) && HAS_INLINE_GLYPH.test(trimmed) ? `• ${trimmed}` : line
    })
    .join("\n")
}

// A marker-less line that reads like a scannable achievement (short, a single clause)
// rather than flowing narrative prose. Used ONLY when a description has no markers at
// all, to decide whether its line breaks mean "bullets" or "a wrapped paragraph".
function looksLikeAchievement(line: string): boolean {
  const l = line.trim()
  if (l.length === 0 || l.length > 200) return false
  // Flowing prose runs long and often ends a line mid-thought on a connector.
  if (/\b(y|e|u|o|and|or|but|pero|además|sino|however|therefore|while|mientras|durante|because|porque)\s*$/i.test(l)) return false
  return true
}

/**
 * Does this line continue the previous one, or start a new item?
 *
 * ONE answer, used by both paths, because the defect showed up in both. Text
 * extracted from a PDF carries the VISUAL line breaks — one achievement arrives as
 * two or three lines — and it arrives that way whether or not the source had
 * bullet markers:
 *
 *   no markers   "…high-quality software solutions and" / "reducing timelines by 50%."
 *   with markers "• …user satisfaction by"               / "• 5%."
 *
 * In the first case the wrapped fragment dragged the whole role into prose. In the
 * second the fragment kept the marker the extractor gave it and became a bullet
 * reading "5%." on its own. Two symptoms, one cause: the format was being decided
 * before the layout breaks were repaired.
 *
 * Two signals, and BOTH are required:
 *   · the line starts lowercase or with a digit — a new achievement starts with a
 *     capitalised verb, a continuation does not
 *   · the previous line did not finish a sentence
 *
 * Either alone is wrong, and both mistakes were made and measured. Case alone
 * welds a legitimate bullet that happens to start with "iOS" onto the one above
 * it. Punctuation alone welds two real achievements together whenever the first
 * simply lacks a full stop — which then runs long enough to fail the achievement
 * test and take the whole role down to prose. Together they describe exactly one
 * thing: a sentence that was cut in half by the page width.
 */
function continuesPrevious(line: string, prev: string | undefined): boolean {
  if (!prev) return false
  const startsLower = /^[\p{Ll}\d]/u.test(line.trim())
  const prevUnfinished = !/[.!?:;]["')\]]?$/.test(prev.trim())
  return startsLower && prevUnfinished
}

/** Rejoin lines a PDF broke for layout rather than for meaning. */
function unwrapSoftBreaks(lines: string[]): string[] {
  const out: string[] = []
  for (const line of lines) {
    const prev = out[out.length - 1]
    if (continuesPrevious(line, prev)) out[out.length - 1] = `${prev} ${line}`
    else out.push(line)
  }
  return out
}

/**
 * Canonicalise a work/education/project description WITHOUT destroying intent. Some
 * résumés write experience as bullets, some as a narrative paragraph, some as an intro
 * paragraph followed by bullets — all valid. So:
 *  - Markers present (any glyph/number): marked lines become "• " bullets; unmarked
 *    text before the first marker is kept as an intro paragraph; a wrapped continuation
 *    line folds into its bullet.
 *  - No markers, several achievement-like lines: each becomes a bullet.
 *  - No markers, flowing prose / a single paragraph: LEFT UNTOUCHED — a narrative
 *    description is a legitimate format and must never be shredded into fake bullets.
 */
export function normalizeDescription(text: string): string {
  if (!text?.trim()) return ""
  const t = preMarkInlineLists(text.replace(/<br\s*\/?>/gi, "\n")).replace(INLINE_GLYPH, "$1\n$2 ")
  const lines = t.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return ""

  const firstMarker = lines.findIndex((l) => LEADING_MARKER.test(l))
  if (firstMarker !== -1) {
    const intro = lines.slice(0, firstMarker).join(" ").trim()
    const bullets: string[] = []
    for (const l of lines.slice(firstMarker)) {
      const marked = LEADING_MARKER.test(l)
      const body = marked ? l.replace(LEADING_MARKER, "").trim() : l.trim()
      const prev = bullets[bullets.length - 1]
      // A marker on a wrapped fragment is the extractor's, not the author's: the
      // page broke the line and the glyph came along. Reported verbatim — a bullet
      // reading "5%." sitting under the one it belongs to.
      if (bullets.length && continuesPrevious(body, prev?.replace(LEADING_MARKER, ""))) {
        bullets[bullets.length - 1] += " " + body
      } else if (marked) {
        bullets.push("• " + body)
      } else if (bullets.length) {
        bullets[bullets.length - 1] += " " + body // unmarked wrapped continuation
      }
    }
    return [intro, ...bullets].filter(Boolean).join("\n")
  }

  // No markers: repair the layout breaks BEFORE judging, or a single wrapped line
  // decides the format for the whole role.
  const whole = unwrapSoftBreaks(lines)
  if (whole.length >= 2 && whole.every(looksLikeAchievement)) {
    return whole.map((l) => "• " + l).join("\n")
  }
  return whole.join("\n") // narrative prose — leave it as written
}

/** The marker-free achievement lines only (no intro prose, no paragraph splitting). */
export function toBulletLines(text: string): string[] {
  return normalizeDescription(text)
    .split("\n")
    .filter((l) => LEADING_MARKER.test(l))
    .map((l) => l.replace(LEADING_MARKER, "").trim())
}

export function fmtDesc(text: string): string {
  const normalized = preMarkInlineLists(text.replace(/<br\s*\/?>/gi, "\n")).replace(INLINE_GLYPH, "$1\n$2 ")
  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean)
  const firstMarker = lines.findIndex((l) => LEADING_MARKER.test(l))

  // No markers → plain text (a narrative paragraph stays a paragraph).
  if (firstMarker === -1) {
    return lines.map((l) => escapeHtml(l)).join("<br>")
  }

  // Intro prose before the first bullet renders as a paragraph, not a fake bullet.
  const introLines = lines.slice(0, firstMarker)
  const bullets: string[] = []
  // The SAME continuation rule the normalizer uses, and it has to be: this renders
  // what the ATS panel counts. With the rule on only one side, a résumé whose page
  // break split "…user satisfaction by / 5%." showed ONE bullet in the panel and
  // TWO in the preview — the same stored text answering the same question twice.
  const raw: string[] = []
  for (const line of lines.slice(firstMarker)) {
    const marked = LEADING_MARKER.test(line)
    const body = marked ? line.replace(LEADING_MARKER, "").trim() : line.trim()
    const prev = raw[raw.length - 1]
    if (raw.length > 0 && continuesPrevious(body, prev)) raw[raw.length - 1] += " " + body
    else if (marked) raw.push(body)
    else if (raw.length > 0) raw[raw.length - 1] += " " + body
  }
  for (const b of raw) bullets.push(escapeHtml(b))
  const introHtml = introLines.length ? `<p style="margin:0 0 4px">${introLines.map(escapeHtml).join(" ")}</p>` : ""
  const ul = `<ul style="list-style-type:disc;padding-left:1.2em;margin:4px 0 0">${bullets.map((b) => `<li style="margin-bottom:4px;line-height:1.55">${b}</li>`).join("")}</ul>`
  return introHtml + ul
}
