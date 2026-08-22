// @vitest-environment happy-dom
//
// EL EJECUTOR RESUELVE LO QUE EL INFORME LISTÓ, Y NADA MÁS.
//
// Auditado el 2026-08-20: tailor recibía la oferta cruda y un array de keywords,
// así que devolvía su propio `missingSkills`, su propio `softSkillSuggestions`,
// su propio resumen y su propio diagnóstico de métricas — cuatro diagnósticos
// duplicados que el panel desempataba a mano. Estos tests fijan que el modal no
// pueda volver a inventar trabajo: si el hallazgo no está en el informe, no hay
// dónde ponerlo.
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createRoot } from "react-dom/client"
import * as React from "react"
import { act } from "react"
import type { AtsReport, ReportCheck, ReportResolution } from "@/lib/ats/report"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock("next-intl", () => ({
  useTranslations: () => (k: string, p?: Record<string, unknown>) =>
    p ? `${k}(${Object.entries(p).map(([a, b]) => `${a}=${String(b)}`).join(",")})` : k,
}))

const TailorModal = (await import("@/components/editor/ats-report/TailorModal")).default

const check = (over: Partial<ReportCheck> = {}): ReportCheck => ({
  id: "t1",
  section: "tips",
  state: "warn",
  weight: 0,
  titleKey: "check.near_duplicate",
  owner: "tailor",
  action: { kind: "rewrite_bullet", targetId: "j1", index: 0 },
  ...over,
})

const report = (checks: ReportCheck[], over: Partial<AtsReport> = {}): AtsReport => ({
  score: 72,
  sections: [
    { id: "search", scoreCategory: "title", coveragePct: 100, checks: [] },
    { id: "hard", scoreCategory: "hardSkills", coveragePct: 60, checks: [] },
    { id: "soft", scoreCategory: "softSkills", coveragePct: 80, checks: [] },
    { id: "other", scoreCategory: null, coveragePct: null, checks: [] },
    { id: "format", scoreCategory: "sections", coveragePct: 100, checks: [] },
    { id: "tips", scoreCategory: null, coveragePct: null, checks },
  ],
  terms: [{ term: "Salesforce", section: "hard", jd: 3, cv: 0, listOnly: false }],
  bullets: [],
  overOptimised: false, recoverable: 0,
  credibility: { score: 100, band: null },
  ...over,
})

function render(props: Partial<React.ComponentProps<typeof TailorModal>> = {}) {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const root = createRoot(host)
  const full: React.ComponentProps<typeof TailorModal> = {
    report: report([check()]),
    resolutions: [],
    appliedIds: new Set<string>(),
    onApply: () => {},
    onUndo: () => {},
    onApplyAll: () => {},
    onClose: () => {},
    ...props,
  }
  act(() => { root.render(React.createElement(TailorModal, full)) })
  return { unmount: () => act(() => root.unmount()) }
}

const body = () => document.body.textContent ?? ""

describe("el trabajo sale del informe", () => {
  beforeEach(() => { document.body.innerHTML = "" })

  /**
   * TODO lo resoluble, venga de donde venga (CEO, 2026-08-21: «tailor soluciona
   * lo que ats reportó, eso es todo»).
   *
   * Con el modal tomando sólo lo que escribe el modelo, el panel se contradecía a
   * la vista: el informe decía «13 sin resolver» y el botón de al lado ofrecía
   * «resolver 1». Los otros doce eran arreglos deterministas que se aplicaban
   * desde otro lado — el segundo lugar que este rediseño vino a cerrar.
   */
  it("muestra todo lo resoluble, lo escriba el modelo o no", () => {
    const { unmount } = render({
      report: report([
        check({ id: "mine", owner: "tailor" }),
        check({ id: "auto", owner: "auto", action: { kind: "fix_dates" } }),
      ]),
    })
    expect(document.querySelector('[data-check="mine"]')).not.toBeNull()
    expect(document.querySelector('[data-check="auto"]')).not.toBeNull()
    unmount()
  })

  /** Lo que nadie puede resolver por el candidato no recibe un botón que miente. */
  it("no muestra un hallazgo sin acción", () => {
    const { unmount } = render({
      report: report([check({ id: "hers", owner: "user", action: undefined })]),
    })
    expect(document.querySelector('[data-check="hers"]')).toBeNull()
    expect(body()).toContain("tailor_all_done")
    unmount()
  })
})

describe("nada se aplica sin que se vea", () => {
  beforeEach(() => { document.body.innerHTML = "" })

  const resolution: ReportResolution = {
    checkId: "t1",
    before: "Atendí clientes",
    text: "Atendí 120 operaciones de ventanilla por día usando Salesforce",
  }

  it("muestra el antes y el después juntos", () => {
    const { unmount } = render({ resolutions: [resolution] })
    expect(body()).toContain("diff_current")
    expect(body()).toContain("Atendí clientes")
    expect(body()).toContain("diff_rewrite")
    expect(body()).toContain("Atendí 120 operaciones")
    unmount()
  })

  /**
   * Una viñeta sin texto escrito NO apaga el botón: se lo pide a la IA.
   *
   * Tailor reescribe contra la vacante y no toca todo; una línea señalada por
   * otro motivo —sin cifra, verbo débil, duplicada— llega sin reemplazo. Apagar
   * el botón ahí la dejaba sin salida, que es lo que este panel existe para no
   * hacer.
   */
  it("una viñeta sin texto sigue siendo accionable: se le pide a la IA", () => {
    const { unmount } = render({ resolutions: [] })
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("fix_apply"))
    expect(btn?.hasAttribute("disabled")).toBe(false)
    unmount()
  })

  /** Lo que NO es una viñeta sí se apaga: aplicar un vacío borraría el campo. */
  it("un hallazgo que no es viñeta y no trae texto sí se apaga", () => {
    const { unmount } = render({
      report: report([check({ id: "t1", action: { kind: "rewrite_summary" }, evidence: [] })]),
      resolutions: [],
    })
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("fix_apply"))
    expect(btn?.hasAttribute("disabled")).toBe(true)
    unmount()
  })

  it("con texto escrito, sí", () => {
    const { unmount } = render({ resolutions: [resolution] })
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("fix_apply"))
    expect(btn?.hasAttribute("disabled")).toBe(false)
    unmount()
  })
})

describe("la cifra se confirma, no se descarta", () => {
  beforeEach(() => { document.body.innerHTML = "" })

  /**
   * Antes la sugerencia entera se tiraba cuando traía un número que el CV no
   * respaldaba, y se perdía una línea mejor en todo lo demás por un dato que el
   * candidato conoce. Llega marcada para que la confirme.
   */
  it("avisa cuando la reescritura propone una cifra que el CV no dice", () => {
    const { unmount } = render({
      resolutions: [{ checkId: "t1", before: "Atendí clientes", text: "Atendí 120 clientes", needsFigureConfirm: true }],
    })
    expect(body()).toContain("reason_confirm_figure_hint")
    unmount()
  })

  it("y no molesta cuando no hay ninguna cifra nueva", () => {
    const { unmount } = render({
      resolutions: [{ checkId: "t1", before: "Atendí clientes", text: "Atendí clientes en ventanilla" }],
    })
    expect(body()).not.toContain("reason_confirm_figure_hint")
    unmount()
  })
})

describe("la anatomía se mide, no se afirma", () => {
  beforeEach(() => { document.body.innerHTML = "" })

  /**
   * Un botón que dice «mejorar» pide un acto de fe. Con las tres señales antes y
   * después, la decisión deja de ser confiar y pasa a ser leer.
   */
  it("muestra verbo, cifra y keyword a los dos lados de una viñeta", () => {
    const { unmount } = render({
      resolutions: [{
        checkId: "t1",
        before: "Responsable de la atención al cliente",
        text: "Atendí 120 operaciones por día en Salesforce coordinando la caja del turno",
      }],
    })
    const txt = body()
    expect(txt).toContain("anatomy_verb")
    expect(txt).toContain("anatomy_metric")
    expect(txt).toContain("anatomy_keyword")
    expect(txt).toContain("anatomy_now")
    expect(txt).toContain("anatomy_after")
    // El término de la vacante que aterriza en la reescritura, nombrado.
    expect(txt).toContain("anatomy_landed")
    expect(txt).toContain("Salesforce")
    unmount()
  })

  it("no dibuja anatomía cuando el hallazgo no es de una viñeta", () => {
    const { unmount } = render({
      report: report([check({ id: "t1", action: { kind: "rewrite_summary" } })]),
      resolutions: [{ checkId: "t1", before: "Resumen viejo", text: "Resumen nuevo" }],
    })
    expect(body()).not.toContain("anatomy_verb")
    unmount()
  })
})

describe("lo aplicado se puede deshacer", () => {
  beforeEach(() => { document.body.innerHTML = "" })

  it("una corrección aplicada ofrece deshacer, no aplicar de nuevo", () => {
    const { unmount } = render({
      appliedIds: new Set(["t1"]),
      resolutions: [{ checkId: "t1", before: "a", text: "b" }],
    })
    expect(body()).toContain("fix_applied")
    expect(body()).toContain("fix_undo")
    unmount()
  })
})

/**
 * LO QUE MÁS MUEVE EL PUNTAJE TIENE QUE ESTAR EN EL EJECUTOR.
 *
 * «El ATS muestra lo que falta, tailor lo soluciona» (CEO, repetido el
 * 2026-08-21). Las habilidades duras pesan .45 —más que cualquier otra cosa del
 * informe— y vivían sólo en la tabla, con dos botones al costado de una fila.
 * Por eso el panel decía «5 términos sin decir» y el botón ofrecía «resolver 1».
 */
describe("los términos que faltan son trabajo del ejecutor", () => {
  beforeEach(() => { document.body.innerHTML = "" })

  const withTerms = (): AtsReport => ({
    ...report([]),
    terms: [
      { term: "Excel", section: "hard", jd: 2, cv: 0, listOnly: false },
      { term: "Salesforce", section: "hard", jd: 1, cv: 0, listOnly: false },
      { term: "Ventas", section: "hard", jd: 3, cv: 4, listOnly: false },
    ],
  })

  it("cada término sin decir es una tarjeta, y el que ya está no", () => {
    const { unmount } = render({ report: withTerms(), onWeaveTerm: () => {} })
    expect(document.querySelector('[data-term="Excel"]')).not.toBeNull()
    expect(document.querySelector('[data-term="Salesforce"]')).not.toBeNull()
    expect(document.querySelector('[data-term="Ventas"]')).toBeNull()
    unmount()
  })

  it("con términos pendientes el modal no dice que no queda nada", () => {
    const { unmount } = render({ report: withTerms(), onWeaveTerm: () => {} })
    expect(body()).not.toContain("tailor_all_done")
    expect(body()).toContain("tailor_pending(count=2)")
    unmount()
  })

  /** Uno ya colocado no vuelve a ofrecerse: era el bucle «lo aplico y vuelve». */
  it("un término ya agregado sale de la lista", () => {
    const { unmount } = render({
      report: withTerms(), onWeaveTerm: () => {}, addedTerms: new Set(["Excel"]),
    })
    expect(document.querySelector('[data-term="Excel"]')).toBeNull()
    expect(document.querySelector('[data-term="Salesforce"]')).not.toBeNull()
    unmount()
  })
})
