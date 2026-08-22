/**
 * LAS SEÑALES DE PARSEO: lo que un ATS documentadamente tropieza.
 *
 * Cada caso REPORTA un riesgo real —viñetas con glifos raros, formatos de fecha
 * mezclados, contacto repetido en cabecera/pie, encabezados que el parser no
 * reconoce— y nunca fabrica una penalización.
 *
 * ── POR QUÉ ESTE ARCHIVO CAMBIÓ DE OBJETIVO (2026-08-22) ───────────────────
 *
 * Apuntaba a `analyzeAts().breakdown.format`, y ese motor se borró: no lo
 * llamaba ningún producto —sólo sus propios tests— y adentro llevaba la regla de
 * «recortá a 1-2 páginas» que la investigación de 2026 desmintió.
 *
 * Pero la DETECCIÓN no era del motor muerto: vive en `computeResumeSignals`, que
 * sí está viva —la usa la herramienta pública y el camino del PDF verificado—.
 * Borrar el motor y llevarse estos quince casos habría sido perder cobertura de
 * código vivo por arrastre. Se reapuntan al dueño real: mismos casos, mismas
 * entradas, sin los mensajes que pertenecían al motor.
 */
import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/db", () => ({ db: {} }))

import { computeResumeSignals } from "@/lib/ats/signals"
import type { Locale } from "@/lib/ats/signals"

function format(resumeText: string, locale: Locale = "en") {
  return computeResumeSignals(resumeText, locale)
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
    expect(f.decorativeBullets).toBe(false)
    expect(f.mixedDates).toBe(false)
    // No new issue fires on a clean resume.
    expect(f.contactInHeaderFooter).toBe(false)
    expect(f.nonStandardHeadings).toEqual([])
    // El puntaje era del motor borrado. Lo que importa acá es que un CV limpio
    // no dispare NINGUNA señal, que es lo que estas cuatro líneas afirman.
    expect(f.extractable).toBe(true)
  })
})

describe("Unicode bullets (iCIMS flags / Taleo fails)", () => {
  it("flags arrow/check glyphs used as list markers", () => {
    const resume = CLEAN.replace("- Grew sales", "→ Grew sales").replace("- Ran analytics", "✓ Ran analytics")
    const f = format(resume)
    expect(f.decorativeBullets).toBe(true)
  })

  it("does NOT flag a single stray symbol mid-sentence", () => {
    const resume = CLEAN.replace("year over year", "year over year → strong growth")
    const f = format(resume)
    expect(f.decorativeBullets).toBe(false)
  })

  it("does NOT flag the universally-accepted bullet •", () => {
    const resume = CLEAN.replace("- Grew sales", "• Grew sales").replace("- Ran analytics", "• Ran analytics")
    const f = format(resume)
    expect(f.decorativeBullets).toBe(false)
  })
})

describe("inconsistent date formats (~15% of failures)", () => {
  it("flags a resume mixing 'Jan 2020' and '01/2022'", () => {
    const resume = CLEAN.replace("Jan 2020 - Mar 2024", "Jan 2020 - 03/2024")
    const f = format(resume)
    expect(f.mixedDates).toBe(true)
  })

  it("flags mixing month-name with apostrophe year", () => {
    const resume = CLEAN.replace("Mar 2016", "'16")
    const f = format(resume)
    expect(f.mixedDates).toBe(true)
  })

  it("does NOT flag a resume that uses one consistent format", () => {
    const f = format(CLEAN)
    expect(f.mixedDates).toBe(false)
  })
})

describe("contact repeated in header/footer (22% of failures)", () => {
  it("flags an email that appears on every page", () => {
    const resume = CLEAN + "\n\nPage 2\nana@example.com | +34 600 000 000\nMore experience..."
    const f = format(resume)
    expect(f.contactInHeaderFooter).toBe(true)
  })

  it("does NOT flag contact that appears once", () => {
    const f = format(CLEAN)
    expect(f.contactInHeaderFooter).toBe(false)
  })
})

describe("non-standard section labels (Greenhouse empty-array / Taleo)", () => {
  it("flags an ALL-CAPS heading the ATS won't recognise", () => {
    const resume = CLEAN.replace("EXPERIENCE", "MY CAREER STORY")
    const f = format(resume)
    expect(f.nonStandardHeadings.length).toBeGreaterThan(0)
  })

  it("does NOT flag a job title in title case", () => {
    // "Sales Lead at Acme" must never read as a section header.
    const f = format(CLEAN)
    expect(f.nonStandardHeadings).toEqual([])
  })

  it("accepts common extra sections (CERTIFICATIONS, PROJECTS)", () => {
    const resume = CLEAN + "\n\nCERTIFICATIONS\nAWS Solutions Architect\n\nPROJECTS\nInternal analytics platform"
    const f = format(resume)
    expect(f.nonStandardHeadings).toEqual([])
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
    expect(f.mixedDates).toBe(true)
  })

  it("clean Spanish resume earns Spanish passes, no false positive", () => {
    const f = format(CLEAN_ES, "es")
    expect(f.mixedDates).toBe(false)
    expect(f.nonStandardHeadings).toEqual([])
    expect(f.contactInHeaderFooter).toBe(false)
  })
})

describe("still deterministic", () => {
  it("same input -> byte-identical result across runs", () => {
    const a = JSON.stringify(computeResumeSignals(CLEAN, "en"))
    const b = JSON.stringify(computeResumeSignals(CLEAN, "en"))
    expect(a).toBe(b)
  })
})
