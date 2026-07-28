/**
 * The sitemap must never advertise a page that carries `robots: { index: false }`.
 *
 * /register and /login were listed here while their own metadata said noindex, so Google
 * reported them under "Excluded by 'noindex' tag" and burned crawl budget on pages we
 * explicitly do not want indexed. The salary leaf pages were already kept out for the
 * same reason. This guard fails if any known-noindexed path reappears in the sitemap.
 */
import { describe, it, expect } from "vitest"
import sitemap from "@/app/sitemap"

const NOINDEX_PATHS = [
  "/register",
  "/login",
  "/forgot-password",
  "/dashboard",
  "/billing/recover",
]

describe("sitemap never lists a noindexed page", () => {
  const urls = sitemap().map((e) => e.url)

  it.each(NOINDEX_PATHS)("does not advertise %s (it is noindexed)", (path) => {
    const offenders = urls.filter((u) => u.endsWith(path) || u.includes(`${path}/`) || u.includes(`${path}?`))
    // Match the exact locale-prefixed segment, not a substring of a longer slug.
    const exact = urls.filter((u) => new RegExp(`/(es|en)${path}$`).test(u))
    expect(exact, `sitemap advertises ${exact.join(", ")}`).toHaveLength(0)
    expect(offenders.every((o) => new RegExp(`/(es|en)${path}`).test(o)) || offenders.length === 0).toBe(true)
  })

  it("still lists the core public pages", () => {
    // Guard the other direction: the cleanup must not have dropped real pages.
    for (const path of ["/pricing", "/templates", "/blog", "/guide", "/faq"]) {
      expect(urls.some((u) => new RegExp(`/(es|en)${path}$`).test(u)), `missing ${path}`).toBe(true)
    }
    // The bare locale home must be present.
    expect(urls.some((u) => /\/(es|en)$/.test(u))).toBe(true)
  })
})
