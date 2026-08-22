// @vitest-environment happy-dom
//
// EL RIEL LEE UN SOLO OBJETO.
//
// Antes llegaban ocho fuentes sueltas y cada tarjeta decidía por su cuenta qué
// pintar, así que una misma viñeta terminaba señalada para reescribir, borrar y
// adaptar a la vez. Estos tests fijan lo que no puede volver: un veredicto que
// contradiga los hallazgos, un hallazgo sin salida, y una sección que no diga si
// mueve el número.
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createRoot } from "react-dom/client"
import * as React from "react"
import { act } from "react"
import type { AtsReport, ReportCheck } from "@/lib/ats/report"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// El panel es bilingüe: se devuelve la clave para poder afirmar sobre ella sin
// atarse al texto, que es lo que cambia cuando se ajusta una redacción.
vi.mock("next-intl", () => ({
  useTranslations: () => (k: string, p?: Record<string, unknown>) =>
    p ? `${k}(${Object.entries(p).map(([a, b]) => `${a}=${String(b)}`).join(",")})` : k,
}))

const ReportRail = (await import("@/components/editor/ats-report/ReportRail")).default

const check = (over: Partial<ReportCheck> = {}): ReportCheck => ({
  id: "c1",
  section: "tips",
  state: "warn",
  weight: 0,
  titleKey: "check.no_link",
  owner: "user",
  ...over,
})

const report = (over: Partial<AtsReport> = {}): AtsReport => ({
  score: 72,
  sections: [
    { id: "search", scoreCategory: "title", coveragePct: 100, checks: [] },
    { id: "hard", scoreCategory: "hardSkills", coveragePct: 60, checks: [] },
    { id: "soft", scoreCategory: "softSkills", coveragePct: 80, checks: [] },
    { id: "other", scoreCategory: null, coveragePct: null, checks: [] },
    { id: "format", scoreCategory: "sections", coveragePct: 100, checks: [] },
    { id: "tips", scoreCategory: null, coveragePct: null, checks: [] },
  ],
  terms: [],
  bullets: [],
  overOptimised: false,
  credibility: { score: 100, band: null },
  ...over,
})

function render(r: AtsReport, onSolve = () => {}) {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => { root.render(React.createElement(ReportRail, { report: r, onSolve })) })
  return { host, unmount: () => act(() => root.unmount()) }
}

const text = (host: HTMLElement) => host.textContent ?? ""

describe("el veredicto no puede contradecir los hallazgos", () => {
  beforeEach(() => { document.body.innerHTML = "" })

  /**
   * EL DEFECTO REPORTADO CON CAPTURA. El panel anterior imprimía «Excelente»
   * —función pura de `score >= 80`— justo encima de dos arreglos críticos.
   */
  it("con 100 y un crítico abierto NO dice que está listo", () => {
    const { host, unmount } = render(report({
      score: 100,
      sections: report().sections.map((s) =>
        s.id === "tips" ? { ...s, checks: [check({ state: "crit", owner: "tailor", action: { kind: "rewrite_summary" } })] } : s,
      ),
    }))
    expect(text(host)).toContain("verdict_blocked")
    expect(text(host)).not.toContain("verdict_ready")
    expect(text(host)).not.toContain("ready_title")
    unmount()
  })

  it("con 100 y nada abierto sí lo dice", () => {
    const { host, unmount } = render(report({ score: 100 }))
    expect(text(host)).toContain("verdict_ready")
    expect(text(host)).toContain("ready_title")
    unmount()
  })

  it("el número se rotula por lo que mide, no como nota del CV", () => {
    const { host, unmount } = render(report())
    expect(text(host)).toContain("axis_match")
    unmount()
  })
})

describe("cada sección dice si mueve el número", () => {
  beforeEach(() => { document.body.innerHTML = "" })

  it("las seis se pintan, y las que no puntúan lo declaran", () => {
    const { host, unmount } = render(report())
    const t = text(host)
    for (const s of ["search", "hard", "soft", "other", "format", "tips"]) {
      expect(t, `falta la sección ${s}`).toContain(`section_${s}`)
    }
    expect(t).toContain("section_no_score")
    unmount()
  })
})

describe("el aviso de sobre-optimización", () => {
  beforeEach(() => { document.body.innerHTML = "" })

  it("aparece cuando el informe lo declara", () => {
    const { host, unmount } = render(report({ score: 92, overOptimised: true }))
    expect(text(host)).toContain("over_optimised")
    unmount()
  })

  it("y no aparece cuando no", () => {
    const { host, unmount } = render(report({ score: 60 }))
    expect(text(host)).not.toContain("over_optimised")
    unmount()
  })
})

describe("el riel no inventa trabajo", () => {
  beforeEach(() => { document.body.innerHTML = "" })

  it("sin hallazgos de tailor no ofrece resolverlos", () => {
    const { host, unmount } = render(report({
      sections: report().sections.map((s) =>
        s.id === "tips" ? { ...s, checks: [check({ owner: "user" })] } : s,
      ),
    }))
    expect(text(host)).not.toContain("solve_n")
    unmount()
  })

  it("con hallazgos de tailor ofrece resolver exactamente esos", () => {
    const { host, unmount } = render(report({
      sections: report().sections.map((s) =>
        s.id === "tips"
          ? { ...s, checks: [
              check({ id: "a", owner: "tailor", action: { kind: "rewrite_summary" } }),
              check({ id: "b", owner: "user" }),
              check({ id: "c", owner: "tailor", state: "pass", action: { kind: "rewrite_summary" } }),
            ] }
          : s,
      ),
    }))
    expect(text(host)).toContain("solve_n(count=1)")
    unmount()
  })
})

describe("lo que el número no promete", () => {
  beforeEach(() => { document.body.innerHTML = "" })

  /**
   * Un ATS real no le pone nota a un CV: filtra y ordena por las búsquedas del
   * reclutador. Decirlo es lo que separa una herramienta de una promesa.
   */
  it("el descargo está siempre a la vista", () => {
    const { host, unmount } = render(report())
    expect(text(host)).toContain("rail_disclaimer")
    unmount()
  })
})
