import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/db", () => ({ db: {} }))

import { extractTopKeywords, normalize } from "@/lib/ats/analyzer"
import { partitionByPresence } from "@/lib/ats/core/matching"

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

/**
 * ── POR QUÉ ESTE ARCHIVO CAMBIÓ DE OBJETIVO (2026-08-22) ───────────────────
 *
 * Apuntaba a `analyzeAts().breakdown.keywords`, y ese motor se borró: no lo
 * llamaba ningún producto y adentro llevaba la regla de páginas que la
 * investigación desmintió.
 *
 * Lo que estos casos prueban NO era del motor: `extractTopKeywords` alimenta hoy
 * el motor ATS de la CARTA, y `partitionByPresence` es la función compartida con
 * el matcher PRO. Las dos siguen vivas, así que los casos se reapuntan a ellas en
 * vez de irse a la basura con el envoltorio.
 */
function keywordsOf(resumeText: string, jobDescription: string) {
  return partitionByPresence(extractTopKeywords(jobDescription), normalize(resumeText))
}

describe("las keywords que se le muestran al usuario", () => {
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

  /** El caso del CV vacío probaba el punto de entrada borrado; lo que queda vivo
   *  es que la extracción no reviente con una vacante sin nada útil. */
  it("no revienta con una vacante vacía", () => {
    expect(keywordsOf("", "").matched).toEqual([])
  })

})
