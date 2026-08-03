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
      if (LEADING_MARKER.test(l)) bullets.push("• " + l.replace(LEADING_MARKER, "").trim())
      else if (bullets.length) bullets[bullets.length - 1] += " " + l // wrapped continuation
    }
    return [intro, ...bullets].filter(Boolean).join("\n")
  }

  if (lines.length >= 2 && lines.every(looksLikeAchievement)) {
    return lines.map((l) => "• " + l).join("\n")
  }
  return lines.join("\n") // narrative prose — leave it as written
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
  for (const line of lines.slice(firstMarker)) {
    if (LEADING_MARKER.test(line)) bullets.push(escapeHtml(line.replace(LEADING_MARKER, "")))
    else if (bullets.length > 0) bullets[bullets.length - 1] += " " + escapeHtml(line)
  }
  const introHtml = introLines.length ? `<p style="margin:0 0 4px">${introLines.map(escapeHtml).join(" ")}</p>` : ""
  const ul = `<ul style="list-style-type:disc;padding-left:1.2em;margin:4px 0 0">${bullets.map((b) => `<li style="margin-bottom:4px;line-height:1.55">${b}</li>`).join("")}</ul>`
  return introHtml + ul
}
