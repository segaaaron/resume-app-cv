/**
 * Phase-1 ATS depth: documented parser-failure checks added to scoreFormat.
 *
 * Each check REPORTS a risk that real ATS engines are documented to trip on
 * (see the sources in the session notes) — it never fabricates a penalty. The
 * tests prove: (a) a risky resume surfaces the right issue, (b) a clean resume
 * surfaces the matching pass and NO false positive, (c) the score stays
 * deterministic, and (d) the existing clean-resume score is not dragged down.
 */
import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/db", () => ({ db: {} }))

import { analyzeAts, type Locale } from "@/lib/ats/analyzer"

const JD = "Sales Lead with Kubernetes and analytics experience."

function format(resumeText: string, locale: Locale = "en") {
  return analyzeAts({ resumeText, jobDescription: JD, locale }).breakdown.format
}

const CLEAN = [
  "Ana Rivas - Sales Lead",
  "ana@example.com | +34 600 000 000",
  "",
  "SUMMARY",
  "Sales lead with Kubernetes and analytics experience.",
  "",
  "EXPERIENCE",
  "Sales Lead at Acme, Jan 2020 - Mar 2024",
  "- Grew sales 30 percent year over year",
  "- Ran analytics on Kubernetes clusters",
  "",
  "SKILLS",
  "Sales, Kubernetes, Analytics, Leadership",
  "",
  "EDUCATION",
  "BSc Computer Science, Mar 2016",
].join("\n")

describe("clean resume — no false positives, earns the passes", () => {
  it("reports standard bullets, consistent dates, and no header/label issue", () => {
    const f = format(CLEAN)
    expect(f.passes).toContain("Standard ATS-readable bullets")
    expect(f.passes).toContain("Consistent date format")
    // No new issue fires on a clean resume.
    expect(f.issues.join(" ")).not.toMatch(/bullets|date formats|header\/footer|Non-standard/)
    expect(f.score).toBeGreaterThanOrEqual(80)
  })
})

describe("Unicode bullets (iCIMS flags / Taleo fails)", () => {
  it("flags arrow/check glyphs used as list markers", () => {
    const resume = CLEAN.replace("- Grew sales", "→ Grew sales").replace("- Ran analytics", "✓ Ran analytics")
    const f = format(resume)
    expect(f.issues.join(" ")).toMatch(/special glyphs/)
    expect(f.passes).not.toContain("Standard ATS-readable bullets")
  })

  it("does NOT flag a single stray symbol mid-sentence", () => {
    const resume = CLEAN.replace("year over year", "year over year → strong growth")
    const f = format(resume)
    expect(f.issues.join(" ")).not.toMatch(/special glyphs/)
  })

  it("does NOT flag the universally-accepted bullet •", () => {
    const resume = CLEAN.replace("- Grew sales", "• Grew sales").replace("- Ran analytics", "• Ran analytics")
    const f = format(resume)
    expect(f.issues.join(" ")).not.toMatch(/special glyphs/)
  })
})

describe("inconsistent date formats (~15% of failures)", () => {
  it("flags a resume mixing 'Jan 2020' and '01/2022'", () => {
    const resume = CLEAN.replace("Jan 2020 - Mar 2024", "Jan 2020 - 03/2024")
    const f = format(resume)
    expect(f.issues.join(" ")).toMatch(/Mixed date formats/)
  })

  it("flags mixing month-name with apostrophe year", () => {
    const resume = CLEAN.replace("Mar 2016", "'16")
    const f = format(resume)
    expect(f.issues.join(" ")).toMatch(/Mixed date formats/)
  })

  it("does NOT flag a resume that uses one consistent format", () => {
    const f = format(CLEAN)
    expect(f.issues.join(" ")).not.toMatch(/Mixed date formats/)
    expect(f.passes).toContain("Consistent date format")
  })
})

describe("contact repeated in header/footer (22% of failures)", () => {
  it("flags an email that appears on every page", () => {
    const resume = CLEAN + "\n\nPage 2\nana@example.com | +34 600 000 000\nMore experience..."
    const f = format(resume)
    expect(f.issues.join(" ")).toMatch(/header\/footer/)
  })

  it("does NOT flag contact that appears once", () => {
    const f = format(CLEAN)
    expect(f.issues.join(" ")).not.toMatch(/header\/footer/)
  })
})

describe("non-standard section labels (Greenhouse empty-array / Taleo)", () => {
  it("flags an ALL-CAPS heading the ATS won't recognise", () => {
    const resume = CLEAN.replace("EXPERIENCE", "MY CAREER STORY")
    const f = format(resume)
    expect(f.issues.join(" ")).toMatch(/Non-standard section heading/)
  })

  it("does NOT flag a job title in title case", () => {
    // "Sales Lead at Acme" must never read as a section header.
    const f = format(CLEAN)
    expect(f.issues.join(" ")).not.toMatch(/Non-standard section heading/)
  })

  it("accepts common extra sections (CERTIFICATIONS, PROJECTS)", () => {
    const resume = CLEAN + "\n\nCERTIFICATIONS\nAWS Solutions Architect\n\nPROJECTS\nInternal analytics platform"
    const f = format(resume)
    expect(f.issues.join(" ")).not.toMatch(/Non-standard section heading/)
  })
})

describe("Spanish resumes get the checks in Spanish", () => {
  const CLEAN_ES = [
    "Ana Rivas - Lider de Ventas",
    "ana@example.com | +34 600 000 000",
    "",
    "RESUMEN",
    "Lider de ventas con experiencia en analitica.",
    "",
    "EXPERIENCIA",
    "Lider de Ventas en Acme, Ene 2020 - Mar 2024",
    "- Crecio ventas 30 por ciento",
    "",
    "HABILIDADES",
    "Ventas, Analitica, Liderazgo",
    "",
    "EDUCACION",
    "Ingenieria, Mar 2016",
  ].join("\n")

  it("flags mixed dates in Spanish", () => {
    const resume = CLEAN_ES.replace("Mar 2024", "03/2024")
    const f = format(resume, "es")
    expect(f.issues.join(" ")).toMatch(/Formatos de fecha mezclados/)
  })

  it("clean Spanish resume earns Spanish passes, no false positive", () => {
    const f = format(CLEAN_ES, "es")
    expect(f.passes).toContain("Formato de fecha consistente")
    expect(f.issues.join(" ")).not.toMatch(/no estandar|mezclados|encabezado\/pie/)
  })
})

describe("still deterministic", () => {
  it("same input -> byte-identical result across runs", () => {
    const a = JSON.stringify(analyzeAts({ resumeText: CLEAN, jobDescription: JD, locale: "en" }))
    const b = JSON.stringify(analyzeAts({ resumeText: CLEAN, jobDescription: JD, locale: "en" }))
    expect(a).toBe(b)
  })
})
