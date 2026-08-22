import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs"
import { join, dirname } from "node:path"

const ROOT = "app/[locale]/(dashboard)"

function pagesUnder(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...pagesUnder(full))
    else if (entry === "page.tsx") out.push(full)
  }
  return out
}

/** Walks up from a page to the (dashboard) root looking for a loading.tsx. */
function loadingBoundaryFor(pagePath: string): string | null {
  let dir = dirname(pagePath)
  for (;;) {
    const candidate = join(dir, "loading.tsx")
    if (existsSync(candidate)) return candidate
    if (dir === ROOT) return null
    dir = dirname(dir)
  }
}

describe("dashboard tabs have a loading boundary", () => {
  // Switching tabs felt broken: the browser kept painting the OLD page until the
  // server answered. Root cause was that NO route in the project had a
  // loading.tsx, and Next can only prefetch a `force-dynamic` route up to that
  // boundary — so prefetch cached nothing and every click paid the full trip.
  // A new dynamic tab added without one brings the whole bug back silently.
  const dynamicPages = pagesUnder(ROOT).filter((p) =>
    /export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/.test(readFileSync(p, "utf-8")),
  )

  it("finds the dynamic pages it is supposed to guard", () => {
    expect(dynamicPages.length).toBeGreaterThanOrEqual(6)
  })

  it.each(dynamicPages)("%s renders a skeleton while it loads", (page) => {
    const boundary = loadingBoundaryFor(page)
    expect(boundary, `${page} is force-dynamic with no loading.tsx above it`).not.toBeNull()
    expect(readFileSync(boundary as string, "utf-8")).toContain("DashboardSkeleton")
  })
})
