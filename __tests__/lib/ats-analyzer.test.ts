import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/db", () => ({ db: {} }))

import { analyzeAts } from "@/lib/ats/analyzer"

const RESUME = [
  "Ana Rivas - Sales Lead",
  "ana@example.com | +34 600 000 000",
  "",
  "SUMMARY",
  "Sales lead with Kubernetes and analytics experience.",
  "",
  "EXPERIENCE",
  "Sales Lead at Acme 2020-2024",
  "- Grew sales 30 percent year over year",
  "- Ran analytics on Kubernetes clusters",
  "",
  "SKILLS",
  "Sales, Kubernetes, Analytics, Leadership",
  "",
  "EDUCATION",
  "BSc Computer Science, UMSS, 2016",
].join("\n")

const JD = "Looking for a Sales Lead with Kubernetes and analytics experience across sales teams."

function keywordsOf(resumeText: string, jobDescription: string) {
  return analyzeAts({ resumeText, jobDescription, locale: "en" }).breakdown.keywords
}

describe("analyzeAts — keywords shown to the user", () => {
  // The bug: extractTopKeywords keyed its frequency map on singularize(raw),
  // which strips "es"/"s" blindly — "sales" became "sal", "kubernetes" became
  // "kubernet" — and those keys were returned and rendered on the public
  // /tools/ats-checker page.
  it("never shows a stemmed stub as a keyword", () => {
    const k = keywordsOf(RESUME, JD)
    const shown = [...k.matched, ...k.missing]
    for (const stub of ["sal", "kubernet", "analytic", "experi", "compani"]) {
      expect(shown).not.toContain(stub)
    }
  })

  it("shows real words", () => {
    const k = keywordsOf(RESUME, JD)
    const shown = [...k.matched, ...k.missing].join(" ")
    expect(shown).toMatch(/sales|kubernetes|analytics/)
  })

  it("does not list the same concept as both matched and missing", () => {
    const k = keywordsOf(RESUME, JD)
    const overlap = k.matched.filter((m) => k.missing.includes(m))
    expect(overlap).toEqual([])
  })

  it("matches a skill the CV states through an alias", () => {
    const k = keywordsOf(
      "Ana Rivas\nana@example.com\n\nSUMMARY\nEngineer.\n\nEXPERIENCE\nRan workloads on k8s at Acme.\n\nSKILLS\nk8s\n\nEDUCATION\nBSc",
      "We need Kubernetes experience.",
    )
    expect(k.missing).not.toContain("kubernetes")
  })

  it("returns a score without throwing on an empty CV", () => {
    const r = analyzeAts({ resumeText: "", jobDescription: JD, locale: "en" })
    expect(typeof r.scoreOverall).toBe("number")
  })
})
