import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "fs"
import { join } from "path"

// `apiFetch` is where a client request gets its timeout, its 5xx toast, and — the part
// that matters most — its record in the admin panel when it times out or never reaches
// the server. A raw `fetch("/api/…")` has none of that: it fails silently, and silence
// is what let "I pressed the button and nothing happened" go uncounted for weeks.
//
// This guard reads the source. Grep answers "are there any right now"; only a test
// answers "will the next one be caught". Two files are exempt, both deliberately:
//
//  · lib/apiFetch.ts — it IS the wrapper.
//  · lib/client-error-reporter.ts — the telemetry sink must NOT go through apiFetch, or a
//    failing report would report its own failure, forever.

const ROOTS = ["components", "hooks", "app", "stores", "contexts"]
const EXEMPT = ["lib/apiFetch.ts", "lib/client-error-reporter.ts"]

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
  }
  return out
}

/** `fetch("/api/…")` or `fetch(\`/api/…\`)` — an absolute call to our own API. */
const RAW_API_FETCH = /(?<![A-Za-z])fetch\(\s*[`"']\/api\//

describe("every client call to our API goes through apiFetch", () => {
  const files = ROOTS.flatMap((r) => {
    try { return walk(join(process.cwd(), r)) } catch { return [] }
  })

  it("finds the source tree (a guard over zero files proves nothing)", () => {
    expect(files.length).toBeGreaterThan(100)
  })

  it("has no raw fetch to /api/ outside the two exempt files", () => {
    const offenders: string[] = []
    for (const file of files) {
      const rel = file.replace(process.cwd() + "/", "")
      if (EXEMPT.some((e) => rel.endsWith(e))) continue
      const src = readFileSync(file, "utf8")
      src.split("\n").forEach((line, i) => {
        if (RAW_API_FETCH.test(line)) offenders.push(`${rel}:${i + 1}`)
      })
    }
    expect(offenders, `raw fetch to our API (no timeout, no toast, no error row): ${offenders.join(", ")}`).toEqual([])
  })
})
