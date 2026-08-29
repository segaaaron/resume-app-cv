// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createRoot, type Root } from "react-dom/client"
import * as React from "react"
import { act } from "react"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/**
 * La pantalla del motor v3.
 *
 * Se prueba lo que un usuario reportaría con captura: que el número que promete
 * la tarjeta sea el que el motor midió, que el botón no diga "hecho" cuando
 * falta un dato, y que aplicar escriba lo que quedó en la caja y no la propuesta
 * cruda del modelo.
 */

const messages: Record<string, string> = {
  posting_label: "Pegá la vacante",
  posting_placeholder: "Pegá el aviso",
  analyze: "Analizar",
  analyzing: "Analizando…",
  failed: "No se pudo",
  score_caption: "Preparación para esta vacante",
  pillar_parse: "Se lee bien",
  pillar_relevance: "Sirve para el puesto",
  pillar_impact: "Convence",
  served_from_cache: "Sin cambios: no se gastó ninguna consulta",
  findings_title: "cosas para mejorar",
  already_solved: "ya resueltas",
  nothing_open: "Nada abierto",
  badge_regressed: "Volvió a aparecer",
  points: "puntos",
  empty_line: "(vacía)",
  rewrite_rejected: "No pasó los controles",
  already_good: "La línea ya está bien",
  fix_it: "Escribirla mejor",
  writing: "Escribiendo…",
  dismiss: "No me interesa",
  triage_title: "Qué merece el espacio",
  triage_caption: "Una página sostiene pocas líneas",
  verdict_DROP: "Sacar",
  drop_it: "Sacar del CV",
  confirm_drop: "Sí, sacarla",
  dropped: "Línea sacada del CV",
  undo: "Deshacer",
  yes_i_did: "Sí, lo hice — escribirla",
  verdict_KEEP: "Dejar",
  verdict_REPLACE: "Reemplazar",
  confirm_title: "Confirmá antes de escribirlo",
  before: "Dice ahora",
  after: "Quedaría",
  evidence: "Dónde mirar",
  no_data: "No tengo ese dato",
  fill_required: "Completá la cifra",
  apply: "Aplicar a mi CV",
  cancel: "Cancelar",
}

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => messages[key] ?? key,
}))

const updateSectionData = vi.fn()
const storeState = {
  resumeId: "cv1",
  config: { language: "es" },
  sectionData: {
    summary: "Cajera con experiencia",
    workExperience: [
      {
        id: "w1",
        jobTitle: "Cajera",
        employer: "Súper",
        city: "",
        startDate: "2021-03",
        endDate: "2024-01",
        currentlyWorking: false,
        description: "• Atendí a los clientes en la línea de cajas",
      },
    ],
    skills: [{ id: "s1", name: "Excel", level: "intermediate" }],
  },
  updateSectionData,
}

vi.mock("@/stores/resumeStore", () => ({
  useResumeStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}))

/**
 * El id REAL que el motor le da a esa línea.
 *
 * Escribirlo a mano ("b1") haría que el test pase por un camino que en
 * producción no existe: los ids se derivan del texto, y una propuesta cuyo id no
 * corresponde a este CV no debe escribir nada.
 */
const { buildTree } = await import("@/lib/ats3/engine")
const NODE_ID = buildTree({
  summary: storeState.sectionData.summary,
  workExperience: storeState.sectionData.workExperience,
  skills: storeState.sectionData.skills,
}).roles[0].bullets[0].id

/** Los actos, tal como el motor los emite por NDJSON. */
const ACTS = [
  {
    act: "score",
    score: {
      total: 63.5,
      pillars: {
        parse: { points: 16.7, max: 20, ratio: 0.83 },
        relevance: { points: 25.4, max: 45, ratio: 0.56 },
        impact: { points: 21.4, max: 35, ratio: 0.61 },
      },
      components: [],
    },
  },
  { act: "job", spec: { roleTitleCanonical: "Cajera", mustHave: [], niceToHave: [] } },
  {
    act: "findings",
    suppressed: 2,
    regressed: [],
    findings: [
      {
        id: "f1",
        type: "no_metric",
        merged: ["no_metric"],
        nodeId: NODE_ID,
        nodeText: "Atendí a los clientes en la línea de cajas",
        nodeHash: "h1",
        gain: 1.9,
        detail: "el logro admite un tamaño",
      },
    ],
  },
  {
    act: "triage",
    budget: {},
    decisions: [
      { bulletId: NODE_ID, verdict: "DROP", reason: "no aporta a esta vacante", relevance: 0.1, proposedTopic: null, needsUserConfirm: null },
    ],
  },
  { act: "done", telemetry: { calls: 0, served: { jd: true, audit: true } } },
]

const SUGGESTION = {
  bulletId: NODE_ID,
  changed: true,
  text: "Atendí a [n] clientes por turno resolviendo consultas y cobros",
  actionVerb: "Atendí",
  keywordsUsed: [],
  claim: "atención en caja",
  metricType: "SCALE",
  placeholders: [
    { token: "[n]", type: "SCALE", label: "Clientes por turno", hint: "Suele estar entre 40 y 120", evidenceNeeded: "Tickets del turno", required: true },
  ],
  variantWithoutMetric: "Atendí a los clientes resolviendo consultas y cobros del turno",
  basedOnHash: "h1",
  originalText: "Atendí a los clientes en la línea de cajas",
  delta: 0,
}

function ndjsonResponse(acts: unknown[]) {
  const body = acts.map((a) => JSON.stringify(a)).join("\n")
  const chunks = [body.slice(0, 40), body.slice(40)]
  let i = 0
  return {
    body: {
      getReader: () => ({
        read: async () =>
          i < chunks.length
            ? { done: false, value: new TextEncoder().encode(chunks[i++]) }
            : { done: true, value: undefined },
      }),
    },
  }
}

const apiFetch = vi.fn()
vi.mock("@/lib/apiFetch", () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }))

const Ats3Panel = (await import("@/components/editor/ats3/Ats3Panel")).default

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  apiFetch.mockReset()
  updateSectionData.mockReset()
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

/** Montar y dejar que React termine: sin esto se afirma sobre un DOM a medias. */
async function mount() {
  await act(async () => {
    root.render(<Ats3Panel />)
  })
}

const texto = () => container.textContent ?? ""

function botón(nombre: string): HTMLButtonElement {
  const b = [...container.querySelectorAll("button")].find((x) => x.textContent?.trim() === nombre)
  if (!b) throw new Error(`sin botón "${nombre}" · hay: ${[...container.querySelectorAll("button")].map((x) => x.textContent).join(" | ")}`)
  return b as HTMLButtonElement
}

async function click(nombre: string) {
  await act(async () => {
    botón(nombre).dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

async function escribir(selector: string, valor: string) {
  const el = container.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement
  if (!el) throw new Error(`sin campo ${selector}`)
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
      "value",
    )!.set!
    setter.call(el, valor)
    el.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

/**
 * Marcar una casilla.
 *
 * React mapea el `onChange` de un checkbox al evento CLICK, no a `change`:
 * setear `checked` a mano y disparar `change` no ejecuta el manejador y el test
 * pasaría a afirmar sobre una pantalla que nunca se enteró.
 */
async function marcar(selector: string) {
  const el = container.querySelector(selector) as HTMLInputElement
  if (!el) throw new Error(`sin casilla ${selector}`)
  await act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

async function analyze() {
  apiFetch.mockResolvedValueOnce(ndjsonResponse(ACTS))
  await mount()
  await escribir("#ats3-jd", "Buscamos cajera con arqueo de caja y atención al cliente")
  await click("Analizar")
  expect(texto()).toContain("64")
}

describe("el panel pinta lo que el motor midió", () => {
  it("el dial muestra el puntaje y los tres pilares", async () => {
    await analyze()
    expect(texto()).toContain("Se lee bien")
    expect(texto()).toContain("16.7 / 20")
  })

  it("la tarjeta muestra la ganancia MEDIDA, no una promesa del modelo", async () => {
    await analyze()
    expect(texto()).toContain("+1.9")
  })

  it("dice cuántas cosas ya resueltas NO se están repitiendo", async () => {
    // Sin esto, arreglar algo se siente como que el panel siempre pide más.
    await analyze()
    expect(texto()).toContain("ya resueltas")
  })

  it("avisa cuando la corrida no gastó ninguna consulta", async () => {
    await analyze()
    expect(texto()).toContain("no se gastó ninguna consulta")
  })

  it("el triage se ve, con su veredicto por línea", async () => {
    await analyze()
    expect(texto()).toContain("Qué merece el espacio")
    expect(texto()).toContain("Sacar")
  })

  it("NINGÚN veredicto queda sin puerta: DROP ofrece su botón", async () => {
    // Un veredicto que sólo se mira es un reproche, no un producto.
    await analyze()
    expect(botón("Sacar del CV")).toBeTruthy()
  })

  it("sacar una línea PIDE confirmación y recién entonces toca el CV", async () => {
    await analyze()
    await click("Sacar del CV")
    // Es la primera acción que DESTRUYE contenido: se ve la línea antes.
    expect(updateSectionData).not.toHaveBeenCalled()

    await click("Sí, sacarla")
    expect(updateSectionData).toHaveBeenCalled()
    const escrito = (updateSectionData.mock.calls[0][1] as { description: string }[])[0].description
    expect(escrito).not.toContain("Atendí a los clientes en la línea de cajas")
  })

  it("y se puede deshacer: un borrado sin vuelta atrás no se ofrece", async () => {
    await analyze()
    await click("Sacar del CV")
    await click("Sí, sacarla")
    expect(texto()).toContain("Línea sacada del CV")

    await click("Deshacer")
    const ultimo = updateSectionData.mock.calls[updateSectionData.mock.calls.length - 1]
    expect((ultimo[1] as { description: string }[])[0].description).toContain("Atendí a los clientes en la línea de cajas")
  })

  it("no analiza con un aviso demasiado corto: el botón está apagado", async () => {
    await mount()
    expect(botón("Analizar").disabled).toBe(true)
    expect(apiFetch).not.toHaveBeenCalled()
  })
})

describe("la cifra la escribe el candidato", () => {
  async function openSheet() {
    await analyze()
    apiFetch.mockResolvedValueOnce({ json: async () => ({ ok: true, suggestion: SUGGESTION, served: false }) })
    await click("Escribirla mejor")
    expect(texto()).toContain("Confirmá antes de escribirlo")
  }

  it("el botón de aplicar está APAGADO mientras falte la cifra obligatoria", async () => {
    await openSheet()
    expect(botón("Completá la cifra").disabled).toBe(true)
    expect(updateSectionData).not.toHaveBeenCalled()
  })

  it("se escribe LO QUE ESTÁ EN LA CAJA, no la propuesta cruda del modelo", async () => {
    await openSheet()
    await escribir("#slot-\\[n\\]", "80")
    await click("Aplicar a mi CV")

    expect(updateSectionData).toHaveBeenCalled()
    const [key, value] = updateSectionData.mock.calls[0]
    expect(key).toBe("workExperience")
    const written = (value as { description: string }[])[0].description
    expect(written).toContain("80 clientes por turno")
    // El hueco no puede sobrevivir al CV: un corchete exportado es un CV roto.
    expect(written).not.toContain("[n]")
  })

  it("quien no tiene el dato recibe la versión SIN cifra, nunca un número puesto por el modelo", async () => {
    await openSheet()
    await marcar('input[type="checkbox"]')
    await click("Aplicar a mi CV")

    expect(updateSectionData).toHaveBeenCalled()
    const written = (updateSectionData.mock.calls[0][1] as { description: string }[])[0].description
    expect(written).toContain("resolviendo consultas y cobros del turno")
    expect(written).not.toMatch(/\d/)
  })

  it("«ya está bien» NO se pinta como un fallo", async () => {
    await analyze()
    apiFetch.mockResolvedValueOnce({ json: async () => ({ ok: false, reason: "already_good", detail: "" }) })
    await click("Escribirla mejor")
    // El modelo leyó la línea y declinó, y declinó bien: mostrarlo como rechazo
    // enseña a desconfiar de una respuesta honesta.
    expect(texto()).toContain("La línea ya está bien")
    expect(texto()).not.toContain("No pasó los controles")
  })

  it("si la línea ya no existe, NO se escribe y NO se dice que se aplicó", async () => {
    await analyze()
    apiFetch.mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        // Una propuesta que apunta a una línea que este CV no tiene: pasa cuando
        // el usuario edita entre pedirla y aceptarla.
        suggestion: { ...SUGGESTION, bulletId: "b_que_no_existe" },
        served: false,
      }),
    })
    await click("Escribirla mejor")
    await escribir("#slot-\\[n\\]", "80")
    await click("Aplicar a mi CV")

    // Un botón que marca "hecho" justo cuando no hace nada es el defecto que
    // este proyecto ya pagó: el usuario descarga un PDF que no cambió.
    expect(updateSectionData).not.toHaveBeenCalled()
    expect(texto()).toContain("stale_node")
  })

  it("un rechazo del motor se dice, con su motivo", async () => {
    await analyze()
    apiFetch.mockResolvedValueOnce({
      json: async () => ({ ok: false, reason: "verb_collision", detail: "Atendí" }),
    })
    await click("Escribirla mejor")
    // "No se pudo" con el uso ya cobrado es lo que hace que alguien deje de
    // apretar el botón: se dice QUÉ pasó.
    expect(texto()).toContain("No pasó los controles")
  })
})
