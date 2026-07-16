// lib/services/ai/shared/bullets.ts
// Single owner of the bullet convention.
//
// `WorkExperienceItem.description` (types/resume.ts) is a plain string: bullets
// exist only as newline-separated lines inside it. That convention had no owner,
// so every consumer re-implemented it with a different rule — buildResumeContext
// never split at all, which is why review-cv saw a paragraph and returned a
// paragraph, collapsing multi-bullet descriptions. Route every read/write of
// that field through here.

/** Marker written back into `description`. Matches what the editor renders. */
export const BULLET_MARKER = "•"

/**
 * Leading list markers accepted on input.
 *
 * `•`/`·` are unambiguous, so a trailing space is optional. `-`/`*` are NOT:
 * they occur inside real content, and stripping them blindly corrupts it —
 * "-5% churn" would become "5% churn" (sign flipped, meaning inverted) and
 * "*Important* fix" would become "Important* fix". Require whitespace after
 * them, which every actual list marker has.
 */
const LEADING_MARKER_RE = /^\s*(?:[•·]+\s*|[-*]+\s+)/

/** Strips any leading list marker and surrounding whitespace from one line. */
function stripMarker(line: string): string {
  return line.replace(LEADING_MARKER_RE, "").trim()
}

/**
 * Splits a `description` into bullet texts, markers removed. Blank lines are
 * dropped. Empty/whitespace input yields [].
 */
export function parseBullets(description: string): string[] {
  if (!description) return []
  return description.split("\n").map(stripMarker).filter((line) => line.length > 0)
}

/**
 * Serializes bullet texts back into a `description`, one per line, each marked.
 * Empty entries are dropped. Round-trips with parseBullets, and normalizes
 * unmarked lines to marked ones — matching the marker the AI prompts already
 * emit and the editor already renders.
 */
export function serializeBullets(bullets: string[]): string {
  return bullets
    .map(stripMarker)
    .filter((b) => b.length > 0)
    .map((b) => `${BULLET_MARKER} ${b}`)
    .join("\n")
}

/**
 * Formats one bullet text for display, marker included and never doubled.
 * Use when a single bullet is rendered next to AI output (which already carries
 * a marker) so both sides of a diff look alike.
 */
export function formatBullet(text: string): string {
  const clean = stripMarker(text)
  return clean ? `${BULLET_MARKER} ${clean}` : ""
}

export interface RenderBulletsOptions {
  /** Prefix per line. Default two spaces. */
  indent?: string
  /** Max chars per bullet before eliding. 0 = no per-bullet limit. */
  maxLength?: number
  /**
   * Total char budget. Whole bullets are dropped once exceeded — never cut
   * mid-bullet — and an explicit notice tells the model the list is partial,
   * so it cannot mistake a truncated list for a complete one. 0 = unbounded.
   */
  maxTotalLength?: number
  /** Rendered when there are no bullets. */
  emptyLabel?: string
}

/**
 * Renders bullets as 0-based indexed lines for a prompt:
 *   [0] Optimized data synchronization…
 *   [1] Reduced crash rates…
 *
 * The index IS the contract: models reference a bullet by it (see
 * TailorBulletChange.index in ai-types.ts), so it must stay 0-based and aligned
 * with parseBullets order.
 */
export function renderBulletsForPrompt(bullets: string[], opts: RenderBulletsOptions = {}): string {
  const { indent = "  ", maxLength = 0, maxTotalLength = 0, emptyLabel = "" } = opts
  if (!bullets.length) return emptyLabel

  const rendered: string[] = []
  let total = 0

  for (let i = 0; i < bullets.length; i++) {
    let text = maxLength > 0 && bullets[i].length > maxLength
      ? `${bullets[i].slice(0, maxLength)}…`
      : bullets[i]
    let line = `${indent}[${i}] ${text}`

    if (maxTotalLength > 0 && total + line.length > maxTotalLength) {
      if (rendered.length > 0) {
        rendered.push(`${indent}[… ${bullets.length - i} more not shown]`)
        break
      }
      // A single bullet over budget — a prose description parses to exactly one.
      // Elide it to fit: letting it through whole would make maxTotalLength a
      // suggestion rather than a cap, and blow the caller's context limit.
      const room = maxTotalLength - indent.length - `[${i}] `.length - 1
      if (room <= 0) break
      text = `${text.slice(0, room)}…`
      line = `${indent}[${i}] ${text}`
    }

    rendered.push(line)
    total += line.length + 1
  }

  return rendered.join("\n")
}
