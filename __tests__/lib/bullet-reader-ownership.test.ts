import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

/**
 * ONE READER FOR BULLETS.
 *
 * THE BUG THIS SHIPPED FOR. A work description is STORED with its "• " marker.
 * `parseBullets` strips it and is what every write path, every guard and every
 * template renderer compares against. One hook read the same field with a plain
 * `split("\n")` instead, so its snapshot carried the marker — and every guard
 * that compared the two rejected the user's action: Remove, Rewrite and their
 * own edit all answered "could not apply", with nothing shown server-side
 * because no request was ever made. A second template read it by hand too and
 * printed the marker next to its own bullet glyph.
 *
 * Neither was a typo. Both are what happens when a stored format has more than
 * one reader: the pair drifts and nobody notices until a user photographs it.
 *
 * Reads the source on purpose — a unit test cannot catch a SECOND
 * implementation of something that already works.
 */

const ROOTS = ["components", "hooks", "lib", "app"]
/** The owner of the format, and the utils module that defines the markers. */
const OWNERS = [
  join("lib", "services", "ai", "shared", "bullets.ts"),
  join("lib", "utils.ts"),
]

/**
 * Comments are not code. The first version of this guard scanned the raw file,
 * so a file that MENTIONED parseBullets in a comment while splitting by hand
 * passed — which is exactly the shape of the bug it exists to catch. Verified by
 * reintroducing the defect: the guard stayed green until this was added.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
}

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) { out.push(...sourceFiles(p)); continue }
    if (/\.(ts|tsx)$/.test(entry)) out.push(p)
  }
  return out
}

/**
 * The official readers. Any of them proves the file went through code that
 * knows about the marker.
 */
const OFFICIAL_READER = /\b(parseBullets|fmtDesc|toBulletLines|normalizeDescription|serializeBullets|serializeBulletsReporting)\b/

/**
 * Files that split lines for a reason unrelated to work descriptions. Each one
 * is listed deliberately — an escape hatch that has to be argued for, not a
 * pattern that lets the next mistake through silently.
 */
const ALLOWED = new Set<string>([
  // Parses a whole uploaded résumé into sections; descriptions do not exist yet.
  join("lib", "parseResumeText.ts"),
  // Reads a plain-text rendering of the CV, never the stored field.
  join("lib", "ats", "signals.ts"),
  join("lib", "ats", "analyzer.ts"),
  join("lib", "ats", "ats-safe.ts"),
  // Scans joined text for figures. Never renders or writes a bullet, and a
  // leading marker cannot change whether a line contains a number.
  join("lib", "services", "ai", "shared", "summary-quality.ts"),
])

describe("bullets have exactly one reader", () => {
  it("no file turns a work description into lines without an official reader", () => {
    const offenders: string[] = []
    for (const root of ROOTS) {
      for (const file of sourceFiles(root)) {
        if (OWNERS.some((o) => file.endsWith(o)) || ALLOWED.has(file)) continue
        const src = stripComments(readFileSync(file, "utf8"))
        const splitsLines = /\.split\(\s*["'`]\\n["'`]\s*\)/.test(src)
        const touchesDescription = /\.description\b/.test(src)
        if (splitsLines && touchesDescription && !OFFICIAL_READER.test(src)) offenders.push(file)
      }
    }
    expect(
      offenders,
      `A work description is STORED with its "• " marker. Read it with parseBullets()/fmtDesc(), never a bare split:\n${offenders.join("\n")}`,
    ).toEqual([])
  })
})
