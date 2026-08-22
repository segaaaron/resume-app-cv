// @vitest-environment happy-dom
//
// LA VISTA AGREGADA DE VIÑETAS.
//
// La anatomía dentro de una corrección contesta «¿esta línea mejoró?». Ésta
// contesta la que decide si el CV se manda: «¿cuántas de mis líneas dicen algo
// medible?». Sin ella el usuario arregla tres viñetas, no sabe si movió la aguja,
// y vuelve a preguntarle al panel lo mismo la próxima vez.
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createRoot } from "react-dom/client"
import * as React from "react"
import { act } from "react"
import type { AtsReport, ReportBullet, ReportCheck } from "@/lib/ats/report"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock("next-intl", () => ({
  useTranslations: () => (k: string, p?: Record<string, unknown>) =>
    p ? `${k}(${Object.entries(p).map(([a, b]) => `${a}=${String(b)}`).join(",")})` : k,
}))

const BulletQualityPanel = (await import("@/components/editor/ats-report/BulletQualityPanel")).default
const KeywordContextPanel = (await import("@/components/editor/ats-report/KeywordContextPanel")).default

const bullet = (over: Partial<ReportBullet> = {}): ReportBullet => ({
  targetId: "j1", index: 0, text: "Atendí clientes", verb: true, metric: true, keywords: ["Excel"], words: 18,
  ...over,
})

const report = (bullets: ReportBullet[], checks: ReportCheck[] = []): AtsReport => ({
  score: 70,
  sections: [{ id: "tips", scoreCategory: null, coveragePct: null, checks }],
  terms: [],
  bullets,
  overOptimised: false,
  credibility: { score: 100, band: null },
})

function render(node: React.ReactElement) {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => { root.render(node) })
  return { unmount: () => act(() => root.unmount()) }
}
const body = () => document.body.textContent ?? ""

describe("el porcentaje que decide si el CV se manda", () => {
  beforeEach(() => { document.body.innerHTML = "" })

  it("cuenta las viñetas con cifra sobre el total", () => {
    const { unmount } = render(React.createElement(BulletQualityPanel, {
      report: report([bullet(), bullet({ index: 1, metric: false }), bullet({ index: 2, metric: false }), bullet({ index: 3 })]),
      onSolve: () => {},
    }))
    expect(body()).toContain("bq_caption(withMetric=2,total=4")
    unmount()
  })

  /**
   * EL OBJETIVO ES UNA BANDA, NO EL 100%. Un CV donde todas las líneas terminan
   * en un número se lee fabricado — el riesgo del que este mismo panel avisa una
   * pantalla más arriba. Un objetivo simple («más números») empujaría justo
   * hacia donde no queremos.
   */
  it("dice el objetivo como rango, no como máximo", () => {
    const { unmount } = render(React.createElement(BulletQualityPanel, {
      report: report([bullet()]), onSolve: () => {},
    }))
    expect(body()).toContain("min=60,max=70")
    expect(body()).toContain("bq_note")
    unmount()
  })

  it("las tres señales se pintan por línea", () => {
    const { unmount } = render(React.createElement(BulletQualityPanel, {
      report: report([bullet({ verb: false, metric: true, keywords: [] })]), onSolve: () => {},
    }))
    const txt = body()
    expect(txt).toContain("V")
    expect(txt).toContain("#")
    expect(txt).toContain("K")
    unmount()
  })

  it("sin viñetas no se pinta nada", () => {
    const { unmount } = render(React.createElement(BulletQualityPanel, { report: report([]), onSolve: () => {} }))
    expect(body()).toBe("")
    unmount()
  })
})

describe("el botón por línea no inventa trabajo", () => {
  beforeEach(() => { document.body.innerHTML = "" })

  /**
   * Fabricar un hallazgo desde esta vista sería abrir trabajo por su cuenta —
   * justo lo que el rediseño le quitó a cada tarjeta. Sólo hay botón cuando el
   * informe YA emitió un hallazgo para esa línea.
   */
  it("sin hallazgo para esa línea, no hay botón", () => {
    const { unmount } = render(React.createElement(BulletQualityPanel, {
      report: report([bullet()]), onSolve: () => {},
    }))
    expect(body()).not.toContain("solve_with_tailor")
    unmount()
  })

  it("con hallazgo, el botón abre ESE hallazgo", () => {
    const seen: string[] = []
    const check: ReportCheck = {
      id: "tips.dilutes.j1", section: "tips", state: "warn", weight: 0,
      titleKey: "k", owner: "tailor", action: { kind: "rewrite_bullet", targetId: "j1", index: 0 },
    }
    const { unmount } = render(React.createElement(BulletQualityPanel, {
      report: report([bullet()], [check]), onSolve: (id: string) => seen.push(id),
    }))
    const btn = [...document.querySelectorAll("button")][0]
    act(() => { btn?.dispatchEvent(new MouseEvent("click", { bubbles: true })) })
    expect(seen).toEqual(["tips.dilutes.j1"])
    unmount()
  })
})

describe("afirmado contra probado", () => {
  beforeEach(() => { document.body.innerHTML = "" })

  /**
   * Para el filtro un término dentro de una viñeta con fecha y el mismo solo en
   * la lista valen igual. Para quien entrevista, no. Ésa es la única pregunta
   * que contesta este panel, y por eso no mueve la nota.
   */
  it("cuenta sólo lo que el CV dice, y separa lo que no respalda", () => {
    const { unmount } = render(React.createElement(KeywordContextPanel, {
      terms: [
        { term: "Excel", section: "hard", jd: 1, cv: 2, listOnly: false },
        { term: "Salesforce", section: "hard", jd: 1, cv: 1, listOnly: true },
        { term: "SAP", section: "hard", jd: 1, cv: 0, listOnly: false },
      ],
    }))
    // 2 afirmadas (Excel y Salesforce); SAP no cuenta porque el CV no la dice.
    expect(body()).toContain("ctx_caption(evidenced=1,claimed=2)")
    // LA PROPORCIÓN, NO LA LISTA. Los términos uno por uno se pintaban acá y en
    // la tabla y en el hallazgo y en el ejecutor: cuatro copias del mismo dato,
    // y ésta era la única sin botón. Su responsabilidad es el agregado —qué
    // parte de lo que decís está probado—, que no la contesta nadie más.
    expect(body()).not.toContain("Salesforce")
    unmount()
  })

  it("sin habilidades afirmadas no se pinta nada", () => {
    const { unmount } = render(React.createElement(KeywordContextPanel, {
      terms: [{ term: "SAP", section: "hard", jd: 1, cv: 0, listOnly: false }],
    }))
    expect(body()).toBe("")
    unmount()
  })
})
