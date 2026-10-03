// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
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
  analyzing: "Analizando…",
  failed: "No se pudo",
  write_failed: "No se pudo escribir la propuesta",
  error_stale: "Tu CV cambió mientras se preparaba esto. Volvé a pedirlo sobre el texto actual.",
  error_ai: "La IA no respondió bien esta vez. Probá de nuevo en un momento.",
  score_caption: "Preparación para esta vacante",
  pillar_parse: "Se lee bien",
  pillar_relevance: "Sirve para el puesto",
  served_from_cache: "Sin cambios: no se gastó ninguna consulta",
  findings_title: "cosas para mejorar",
  already_solved: "ya resueltas",
  nothing_open: "Nada abierto",
  badge_regressed: "Volvió a aparecer",
  points: "puntos",
  empty_line: "(vacía)",
  open_tailor: "Arreglar con Tailor",
  apply_all: "Aplicar las {count}",
  apply_all_rest: "{count} de a una",
  term_add: "Agregar a Habilidades",
  why_matters: "Por qué importa.",
  fix_applied: "Aplicado",
  diff_current: "Antes",
  diff_rewrite: "Ahora dice",
  tailor_title: "Tailor",
  tailor_pending: "cosas para arreglar",
  tailor_sub: "Cada tarjeta sale del análisis",
  tailor_none_done: "Nada resuelto todavía",
  filter_all: "Todas",
  filter_open: "Pendientes",
  filter_done: "Hechas",
  close: "Cerrar",
  rewrite_rejected: "No pasó los controles",
  already_good: "La línea ya está bien",
  fix_it: "Escribirla mejor",
  told_label: "¿Qué logró ese trabajo? (opcional)",
  writing: "Escribiendo…",
  dismiss: "No me interesa",
  confirm_title: "Confirmá antes de escribirlo",
  before: "Dice ahora",
  after: "Quedaría",
  evidence: "Dónde mirar",
  no_data: "No tengo ese dato",
  fill_required: "Completá la cifra",
  apply: "Aplicar a mi CV",
  skills_plan_apply: "Aplicar este orden",
  // La hoja de confirmación es `SuggestionDiffModal`, recuperado del historial:
  // su copia vive en `editor.cv_review` y el doble tiene que traerla, o la
  // pantalla se prueba contra claves crudas.
  diff_title: "Cambio sugerido",
  diff_before: "Actual",
  diff_after: "Sugerido",
  diff_confirm: "Confirmar cambio",
  diff_cancel: "Cancelar",
  diff_changes: "Cambios",
  diff_empty: "— vacío —",
  diff_where_line: "línea {n}",
  field_summary: "Resumen",
  field_work_description: "Experiencia",
  cancel: "Cancelar",
  // Las de la pantalla de siempre: el dial, las secciones y las filas.
  verdict_below: "Todavía no llega al umbral",
  verdict_ready: "Listo para mandar",
  threshold_label: "{score} recomendado",
  recoverable_label: "+{points} recuperables",
  // Copiado de messages/es.json: un doble que inventa su propia plantilla deja
  // pasar una pantalla que dice otra cosa.
  check_points: "{points}p",
  check_no_score: "no mueve el número",
  check_blocks_anyway: "te saca igual",
  check_only_you: "esto sólo lo sabés vos",
  solve_with_tailor: "Escribirla mejor",
  check_fix_now: "Agregar a Habilidades",
  section_other: "Lo deseable",
  section_hard: "Habilidades duras",
  // La pantalla de entrada (espacio `editor.ats`).
  title: "ATS Score",
  pro_badge: "Pro",
  description: "La mayoría de empresas filtran CVs automáticamente.",
  placeholder: "Pega aquí el texto completo de la vacante...",
  hint: "Copia y pega el texto de la oferta tal como aparece.",
  analyze: "Analizar compatibilidad",
  type_improve_bullet: "Mejorar esta viñeta",
  ask_write: "Escribirlo",
}

vi.mock("next-intl", () => ({
  useTranslations: (ns?: string) => {
    void ns
    const t = (key: string, params?: Record<string, string | number>) => {
      const raw = messages[key] ?? key
      return params ? raw.replace(/\{(\w+)\}/g, (_m, k) => String(params[k] ?? `{${k}}`)) : raw
    }
    /* El traductor REAL trae `has`, y sin él el doble rompe la pantalla que lo
       usa para caer al valor crudo cuando una clave todavía no existe: un doble
       incompleto no deja pasar el bug, esconde el código que lo evita. */
    t.has = (key: string) => key in messages
    return t
  },
}))

/**
 * El doble del store APLICA lo que se le escribe.
 *
 * Ignorando la escritura, cualquier segundo paso leía el CV original: el test
 * de «deshacer» veía la línea que el paso anterior había sacado y no podía
 * distinguir «la devolvió a su lugar» de «la duplicó». Un doble que se traga
 * las escrituras deja pasar exactamente los bugs de escritura.
 */
const updateSectionData = vi.fn((k: string, v: unknown) => {
  ;(storeState.sectionData as Record<string, unknown>)[k] = v
})
const CV_INICIAL = {
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
        // DOS líneas y la que se saca es la PRIMERA: con una sola, «devolverla
        // a su lugar» y «pegarla al final» dan el mismo resultado y el test no
        // puede distinguirlos — daba verde con el deshacer roto.
        description: "• Atendí a los clientes en la línea de cajas\n• Ordené la góndola al cierre",
      },
    ],
  skills: [{ id: "s1", name: "Excel", level: "intermediate" }],
}

const storeState = {
  resumeId: "cv1",
  config: { language: "es" },
  sectionData: JSON.parse(JSON.stringify(CV_INICIAL)) as typeof CV_INICIAL,
  updateSectionData,
  // El store real guarda: Tailor guarda al confirmar (2026-10-02). El doble lo expone igual.
  save: vi.fn(async () => {}),
  isDirty: false,
}

const setPosting = vi.fn()
vi.mock("@/stores/atsPostingStore", () => ({
  useAtsPostingStore: (selector: (s: { setPosting: typeof setPosting }) => unknown) => selector({ setPosting }),
}))

vi.mock("@/stores/resumeStore", () => ({
  /**
   * El doble expone `getState` porque el store real lo expone: quien escribe una
   * lista tiene que poder leer la que quedó, no la del render anterior. Sin esto
   * el doble ocultaba justo los defectos de escritura seguida.
   */
  useResumeStore: Object.assign(
    (selector: (s: typeof storeState) => unknown) => selector(storeState),
    { getState: () => storeState },
  ),
}))

/**
 * El id REAL que el motor le da a esa línea.
 *
 * Escribirlo a mano ("b1") haría que el test pase por un camino que en
 * producción no existe: los ids se derivan del texto, y una propuesta cuyo id no
 * corresponde a este CV no debe escribir nada.
 */
const { buildTree } = await import("@/lib/ats3/engine")
const { nodeHash } = await import("@/lib/ats3/contracts")
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
        relevance: { points: 46.8, max: 80, ratio: 0.59 },
      },
      components: [
        { key: "nice", pillar: "relevance", numerator: 0, denominator: 1, ratio: 0, effectiveWeight: 10, points: 0, gainPerUnit: 1.9 },
      ],
    },
    // Los dos insumos con los que se midió: sin ellos la pantalla no puede
    // volver a medir cuando el usuario arregla algo.
    audit: {
      bullets: [],
      hard: [{ skill: "Excel", requirement: "NICE", status: "listed", evidenceNodeId: null, writeIn: null, question: null }],
      soft: [],
      summary: { identity: true, proof: true, fit: true, extra: true },
    },
    checks: {},
  },
  {
    act: "job",
    spec: {
      roleTitleCanonical: "Cajera",
      roleTitleRaw: "Cajero/a",
      metricThatMatters: "",
      mustHave: [{ skill: "Arqueo de caja", raw: "manejo de arqueo de caja" }],
      niceToHave: [{ skill: "Excel", raw: "Excel avanzado" }],
      softSignals: [],
      responsibilities: [],
    },
  },
  {
    act: "findings",
    suppressed: 2,
    regressed: [],
    findings: [
      {
        id: "f1",
        type: "improve_bullet",
        // El motor SIEMPRE declara cómo se cierra un hallazgo: la tarjeta
        // dibuja la salida de su remedio y no otra.
        remedy: "rewrite",
        component: "nice",
        reason: "No dice con qué cuadraba la caja.",
        instruction: "Decí que cuadrabas la caja en Excel.",
        terms: ["Excel"],
        nodeId: NODE_ID,
        nodeText: "Atendí a los clientes en la línea de cajas",
        nodeHash: "h1",
        gain: 1.9,
        detail: "Excel",
      },
    ],
  },
  { act: "done", telemetry: { calls: 0, served: { jd: true, audit: true } } },
]

const SUGGESTION = {
  bulletId: NODE_ID,
  changed: true,
  text: "Atendí a [n] clientes por turno cuadrando la caja en Excel",
  actionVerb: "Atendí",
  keywordsUsed: [],
  claim: "atención en caja",
  metricType: "SCALE",
  placeholders: [
    { token: "[n]", type: "SCALE", label: "Clientes por turno", hint: "Suele estar entre 40 y 120", evidenceNeeded: "Tickets del turno", required: true },
  ],
  variantWithoutMetric: "Atendí a los clientes resolviendo consultas y cobros del turno",
  // El hash REAL de la línea sobre la que se pensó. Escribir uno cualquiera
  // hacía pasar el test por un camino que en producción no existe: el motor
  // rechaza aplicar sobre una línea que el usuario tocó después.
  basedOnHash: nodeHash("Atendí a los clientes en la línea de cajas"),
  originalText: "Atendí a los clientes en la línea de cajas",
  delta: 0,
}

function ndjsonResponse(acts: unknown[]) {
  const body = acts.map((a) => JSON.stringify(a)).join("\n")
  const chunks = [body.slice(0, 40), body.slice(40)]
  let i = 0
  return {
    // El doble responde como una Response de verdad: `ok` incluido. Sin él, el
    // panel no podía distinguir un 500 de un análisis y el fallo se veía como
    // una pantalla que no cambia.
    ok: true,
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
  updateSectionData.mockClear()
  // Cada caso arranca del MISMO CV: los que escriben dejaban el documento
  // cambiado para el siguiente, y un test que depende del que corrió antes
  // pasa o falla por el orden.
  storeState.sectionData = JSON.parse(JSON.stringify(CV_INICIAL))
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

/**
 * SE DESMONTA AL TERMINAR CADA CASO.
 *
 * Un árbol que queda montado deja trabajo pendiente en el planificador de React
 * —los efectos pasivos corren en un macrotask—, y ese trabajo se despierta
 * DESPUÉS de que vitest cierra el DOM del archivo: `ReferenceError: window is
 * not defined`, un error que no señala a ningún caso.
 */
afterEach(async () => {
  await act(async () => {
    root.unmount()
  })
  container.remove()
})

/** Montar y dejar que React termine: sin esto se afirma sobre un DOM a medias. */
async function mount() {
  await act(async () => {
    root.render(<Ats3Panel />)
  })
}

/**
 * Se mira el DOCUMENTO y no el contenedor: Tailor abre en un portal colgado del
 * `body`, así que buscar dentro del div del panel no lo encontraría nunca. El
 * contenedor está dentro del documento, así que esto cubre las dos pantallas.
 */
const texto = () => document.body.textContent ?? ""

function botón(nombre: string): HTMLButtonElement {
  // El último: Tailor abre en un portal al final del body, y la fila del informe
  // que lleva a Tailor puede decir lo mismo que el botón de la tarjeta.
  const b = [...document.body.querySelectorAll("button")].filter((x) => x.textContent?.trim() === nombre).at(-1)
  if (!b) throw new Error(`sin botón "${nombre}" · hay: ${[...document.body.querySelectorAll("button")].map((x) => x.textContent).join(" | ")}`)
  return b as HTMLButtonElement
}

async function click(nombre: string) {
  await act(async () => {
    botón(nombre).dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

async function escribir(selector: string, valor: string) {
  const el = document.body.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement
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
  const el = document.body.querySelector(selector) as HTMLInputElement
  if (!el) throw new Error(`sin casilla ${selector}`)
  await act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

async function analyze() {
  apiFetch.mockResolvedValueOnce(ndjsonResponse(ACTS))
  await mount()
  await escribir("#ats3-jd", "Buscamos cajera con arqueo de caja y atención al cliente")
  await click("Analizar compatibilidad")
  expect(texto()).toContain("64")
}

describe("el panel pinta lo que el motor midió", () => {
  it("el dial dice el puntaje sobre 100 y cuánto queda por recuperar", async () => {
    await analyze()
    // El número que ve el usuario es entero: media décima no es una decisión
    // que alguien pueda tomar.
    expect(texto()).toContain("64")
    expect(texto()).toContain("/ 100")
    expect(texto()).toContain("recuperables")
  })

  it("la fila del hallazgo muestra la ganancia MEDIDA, no una promesa del modelo", async () => {
    await analyze()
    expect(texto()).toContain("1.9p")
    expect(texto()).toContain("Mejorar esta viñeta")
  })

  it("el hallazgo cae en su sección, y la sección dice cuánto cubre", async () => {
    await analyze()
    // Un hallazgo, un lugar: la regla del informe sigue en pie con el motor nuevo.
    expect(texto()).toContain("Lo deseable")
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

  it("no analiza con un aviso demasiado corto: el botón está apagado", async () => {
    await mount()
    expect(botón("Analizar compatibilidad").disabled).toBe(true)
    expect(apiFetch).not.toHaveBeenCalled()
  })
})

describe("ninguna escritura se queda sin guardar (QA, 2026-10-02)", () => {
  it("si el CV cambia mientras se guarda, se vuelve a guardar", async () => {
    let primera = true
    storeState.save = vi.fn(async () => {
      // Otra escritura llega con el primer guardado en vuelo: el CV ya no es el que se mandó.
      if (primera) {
        primera = false
        storeState.sectionData = JSON.parse(JSON.stringify(storeState.sectionData))
      }
    })
    await analyze()
    await click("Arreglar con Tailor")
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, suggestion: SUGGESTION, served: false }) })
    await click("Escribirla mejor")
    await escribir("#slot-\\[n\\]", "80")
    await click("Confirmar cambio")
    await act(async () => { await new Promise((r) => setTimeout(r, 50)) })
    expect(storeState.save).toHaveBeenCalledTimes(2)
    storeState.save = vi.fn(async () => {})
  })
})

describe("una tarjeta que pide el logro o la cifra deja contarlo (2026-10-02)", () => {
  it("lo que la persona escribe viaja como su dato en el pedido de reescritura", async () => {
    const conCifra = JSON.parse(JSON.stringify(ACTS))
    conCifra.find((a: { act: string }) => a.act === "findings").findings[0].needsFigure = true
    apiFetch.mockResolvedValueOnce(ndjsonResponse(conCifra))
    await mount()
    await escribir("#ats3-jd", "Buscamos cajera con arqueo de caja y atención al cliente")
    await click("Analizar compatibilidad")
    await click("Arreglar con Tailor")
    expect(texto()).toContain("¿Qué logró ese trabajo?")
    await escribir("#f1-told", "atendía unos 80 clientes por turno")
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, suggestion: SUGGESTION, served: false }) })
    await click("Escribirla mejor")
    const cuerpo = String((apiFetch.mock.calls.at(-1) as unknown[])[1] && ((apiFetch.mock.calls.at(-1) as [unknown, { body?: string }])[1].body ?? ""))
    expect(cuerpo).toContain("80 clientes por turno")
  })
})

describe("la cifra la escribe el candidato", () => {
  async function openSheet() {
    await analyze()
    await click("Arreglar con Tailor")
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, suggestion: SUGGESTION, served: false }) })
    await click("Escribirla mejor")
    // El diálogo es `SuggestionDiffModal`, recuperado del historial: su título
    // es «Cambio sugerido» y dice DÓNDE cae antes del antes/después.
    expect(texto()).toContain("Cambio sugerido")
  }

  it("el botón de aplicar está APAGADO mientras falte la cifra obligatoria", async () => {
    await openSheet()
    expect(botón("Confirmar cambio").disabled).toBe(true)
    expect(updateSectionData).not.toHaveBeenCalled()
  })

  it("se escribe LO QUE ESTÁ EN LA CAJA, no la propuesta cruda del modelo", async () => {
    await openSheet()
    await escribir("#slot-\\[n\\]", "80")
    await click("Confirmar cambio")

    expect(updateSectionData).toHaveBeenCalled()
    const [key, value] = updateSectionData.mock.calls[0]
    expect(key).toBe("workExperience")
    const written = (value as { description: string }[])[0].description
    expect(written).toContain("80 clientes por turno")
    // El hueco no puede sobrevivir al CV: un corchete exportado es un CV roto.
    expect(written).not.toContain("[n]")
    // Y queda guardado sin un segundo clic (2026-10-02).
    expect(storeState.save).toHaveBeenCalled()
  })

  it("quien no tiene el dato recibe la versión SIN cifra, nunca un número puesto por el modelo", async () => {
    await openSheet()
    await marcar('input[type="checkbox"]')
    await click("Confirmar cambio")

    expect(updateSectionData).toHaveBeenCalled()
    const written = (updateSectionData.mock.calls[0][1] as { description: string }[])[0].description
    expect(written).toContain("resolviendo consultas y cobros del turno")
    expect(written).not.toMatch(/\d/)
  })

  it("«ya está bien» NO se pinta como un fallo", async () => {
    await analyze()
    // El trabajo vive en Tailor: el informe sólo lleva hasta su puerta.
    await click("Arreglar con Tailor")
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: false, reason: "already_good", detail: "" }) })
    await click("Escribirla mejor")
    // El modelo leyó la línea y declinó, y declinó bien: mostrarlo como rechazo
    // enseña a desconfiar de una respuesta honesta.
    expect(texto()).toContain("La línea ya está bien")
    expect(texto()).not.toContain("No pasó los controles")
  })

  it("si la línea ya no existe, NO se escribe y NO se dice que se aplicó", async () => {
    await analyze()
    // El trabajo vive en Tailor: el informe sólo lleva hasta su puerta.
    await click("Arreglar con Tailor")
    apiFetch.mockResolvedValueOnce({
      ok: true,
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
    await click("Confirmar cambio")

    // Un botón que marca "hecho" justo cuando no hace nada es el defecto que
    // este proyecto ya pagó: el usuario descarga un PDF que no cambió.
    expect(updateSectionData).not.toHaveBeenCalled()
    // Con su motivo en palabras: el código crudo no es un mensaje.
    expect(texto()).toContain("Tu CV cambió mientras se preparaba esto")
    expect(texto()).not.toContain("stale_node")
  })

  it("un rechazo del motor se dice, con su motivo", async () => {
    await analyze()
    // El trabajo vive en Tailor: el informe sólo lleva hasta su puerta.
    await click("Arreglar con Tailor")
    apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: false, reason: "unknown", detail: "" }),
    })
    await click("Escribirla mejor")
    // "No se pudo" con el uso ya cobrado es lo que hace que alguien deje de
    // apretar el botón: se dice QUÉ pasó.
    expect(texto()).toContain("No pasó los controles")
  })

  it("un fallo del servidor se dice, no deja la pantalla igual", async () => {
    await mount()
    await escribir("#ats3-jd", "Buscamos cajera con arqueo de caja y atención al cliente")
    apiFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: "server_error" }) })
    await click("Analizar compatibilidad")
    // Un 500 leído como NDJSON no coincidía con ningún acto: el usuario veía un
    // aviso genérico arriba y el panel exactamente igual que antes de apretar.
    expect(texto()).toContain("La IA no respondió bien esta vez")
    expect(texto()).not.toContain("server_error")
  })

  it("el botón de la fila pide la reescritura de ESA línea, no de otra", async () => {
    await analyze()
    // El trabajo vive en Tailor: el informe sólo lleva hasta su puerta.
    await click("Arreglar con Tailor")
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, suggestion: SUGGESTION, served: false }) })
    await click("Escribirla mejor")
    // El hallazgo viaja con su nodo: el índice se corre en cuanto el usuario
    // aplica algo, el id no.
    const body = JSON.parse((apiFetch.mock.calls[1][1] as { body: string }).body)
    expect(body.action).toBe("rewrite")
    // El id del hallazgo del acto, no un índice ni un id fabricado por la pantalla.
    expect(body.nodeId).toBe(NODE_ID)
    // Y la vacante ya parseada vuelve con el pedido: no se re-pregunta.
    expect(body.spec).toBeTruthy()
    // LO QUE EL ATS DECIDIÓ VIAJA CON EL PEDIDO, y es lo mismo que la tarjeta dice.
    expect(body.reason).toBe("No dice con qué cuadraba la caja.")
    expect(body.instruction).toBe("Decí que cuadrabas la caja en Excel.")
    expect(body.terms).toEqual(["Excel"])
    expect(texto()).toContain(body.instruction)
  })

  it("una skill sin rastro pregunta, y la respuesta viaja a la línea del puesto donde ese trabajo vive", async () => {
    const sinResultado = {
      ...ACTS[2],
      findings: [{
        id: "r1", type: "missing_skill", remedy: "ask", component: "must", subject: "Arqueo de caja",
        question: "¿Hacías el arqueo de caja?",
        nodeId: "summary", nodeText: "", nodeHash: "h1", gain: 1.5, detail: "missing",
      }],
    }
    apiFetch.mockResolvedValueOnce(ndjsonResponse([ACTS[0], ACTS[1], sinResultado, ACTS[3]]))
    await mount()
    await escribir("#ats3-jd", "Buscamos cajera con arqueo de caja y atención al cliente")
    await click("Analizar compatibilidad")
    await click("Arreglar con Tailor")
    // La tarjeta no le pregunta a la persona: la IA propone, el dato es opcional.
    expect(texto()).not.toContain("¿Hacías el arqueo de caja?")
    await escribir("#r1-ask", "cuadraba la góndola y la caja al cierre")
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, suggestion: SUGGESTION, served: false }) })
    await click("Escribirlo")
    const body = JSON.parse((apiFetch.mock.calls[1][1] as { body: string }).body)
    expect(body.terms).toEqual(["Arqueo de caja"])
    expect(body.told).toBe("cuadraba la góndola y la caja al cierre")
    // La línea del puesto que más comparte con lo contado: la de la góndola.
    expect(body.nodeId).not.toBe(NODE_ID)
  })

  it("«no me interesa» cierra el hallazgo sin gastar una consulta, y lo RECUERDA", async () => {
    await analyze()
    // El trabajo vive en Tailor: el informe sólo lleva hasta su puerta.
    await click("Arreglar con Tailor")
    apiFetch.mockClear()
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, stored: 1 }) })
    await click("No me interesa")
    // La única llamada es la que ANOTA que se resolvió: no llama al modelo y no
    // gasta cuota. Sin ella, el motor vuelve a señalarlo en la próxima corrida.
    const cuerpos = apiFetch.mock.calls.map((c) => JSON.parse((c[1] as { body: string }).body))
    expect(cuerpos).toHaveLength(1)
    expect(cuerpos[0].action).toBe("resolve")
    expect(cuerpos[0].entries[0].resolvedBy).toBe("DISMISSED")
    // Sale de PENDIENTES y queda en el registro, dicho por lo que fue.
    //
    // Antes desaparecía sin dejar rastro, y con ella el trabajo que el usuario
    // había hecho: reportado con captura —«si soluciono 30, en Hechas se ven 2
    // o 3»—. Descartar es una decisión suya y el registro es de lo que HIZO, no
    // sólo de lo que se escribió; por eso no lleva el tilde de «Aplicado».
    expect(texto()).toContain("done_dismissed")
    // La tarjeta ya no está entre las pendientes.
    expect(texto()).not.toContain("card_ats_says")
  })
})

describe("el puntaje se mueve mientras trabajás", () => {
  it("EL NÚMERO SE MUEVE AL ARREGLAR, y lo mide el motor", async () => {
    // Es lo que el CEO pidió textual: el score sube acorde a lo que se
    // soluciona. Antes el dial quedaba clavado hasta reanalizar —una llamada
    // más—, así que el usuario arreglaba cinco cosas y no veía moverse nada.
    await analyze()
    // El trabajo vive en Tailor: el informe sólo lleva hasta su puerta.
    await click("Arreglar con Tailor")
    // Lo que el motor midió al analizar: el deseable, sin escribir.
    const antes = texto()

    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, suggestion: SUGGESTION, served: false }) })
    await click("Escribirla mejor")
    await escribir("#slot-\\[n\\]", "120")
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, stored: 1 }) })
    await click("Confirmar cambio")

    // La línea aceptada escribe el deseable, y ESE componente lo mide el código
    // sin preguntarle a nadie: la sección sube en el acto, sin gastar llamada.
    const pct = (t: string) => Number((t.match(/Lo deseable(\d+)%/) ?? [])[1] ?? -1)
    expect(pct(texto())).toBeGreaterThan(pct(antes))
  })

  it("la vacante queda disponible para el resto del editor, con su alcance", async () => {
    // `atsPostingStore` tenía lector y no tenía escritor desde que se borró el
    // panel viejo: el asistente de IA volvía a escribir viñetas sin saber contra
    // qué puesto se postula la persona. No rompía nada, degradaba en silencio.
    await analyze()
    expect(setPosting).toHaveBeenCalled()
    const p = setPosting.mock.calls[setPosting.mock.calls.length - 1][0] as { terms: string[]; jobTitle: string; resumeId: string | null }
    // El término COMO LO ESCRIBE LA VACANTE: es la forma que el filtro reconoce.
    expect(p.terms).toEqual(["manejo de arqueo de caja", "Excel avanzado"])
    expect(p.jobTitle).toBe("Cajera")
    // El alcance: sin el id, otro CV heredaría la vacante de éste.
    expect(p.resumeId).toBe("cv1")
  })

  /**
   * «HECHAS» SOBREVIVE A RECARGAR LA PÁGINA (CEO, 2026-09-09).
   *
   * Vivía sólo en la memoria de la pantalla: un F5 y el registro de todo lo
   * resuelto desaparecía, junto con la única prueba de que el trabajo pasó. El
   * motor ya guardaba la resolución para no volver a señalar lo mismo, pero
   * guardaba lo mínimo para ESA pregunta —un id y un hash—, y con eso la lista
   * no se puede volver a dibujar: el hallazgo ya no existe cuando hace falta.
   */
  it("el registro se dibuja con lo que el motor ya tenía guardado", async () => {
    const conRegistro = {
      ...ACTS[2],
      resolved: [
        {
          findingId: "viejo1", nodeId: NODE_ID, nodeHashAtResolution: "h",
          resolvedBy: "AI_SUGGESTION", resolvedAt: "2026-09-08T10:00:00.000Z",
          title: "Le falta la cifra", kind: "applied",
          before: "Atendí a los clientes", after: "Atendí a 60 clientes por turno",
        },
        {
          findingId: "viejo2", nodeId: "otro", nodeHashAtResolution: "h2",
          resolvedBy: "DISMISSED", resolvedAt: "2026-09-08T10:05:00.000Z",
          title: "Sin tamaño", kind: "dismissed",
        },
      ],
    }
    // El CV guardado dice lo que se aplicó: es lo que queda tras guardar.
    ;(storeState.sectionData.workExperience[0] as { description: string }).description =
      "• Atendí a 60 clientes por turno\n• Ordené la góndola al cierre"
    apiFetch.mockResolvedValueOnce(ndjsonResponse([ACTS[0], ACTS[1], conRegistro]))
    await mount()
    await escribir("#ats3-jd", "Buscamos cajera con arqueo de caja y atención al cliente")
    await click("Analizar compatibilidad")
    await click("Arreglar con Tailor")

    // Las dos filas están, cada una dicha por lo que fue, sin haber tocado nada
    // en esta sesión.
    expect(texto()).toContain("Atendí a 60 clientes por turno")
    expect(texto()).toContain("done_dismissed")
  })

  it("«Deshacer» devuelve la línea a lo que decía antes", async () => {
    const conRegistro = {
      ...ACTS[2],
      resolved: [{
        findingId: "viejo1", nodeId: NODE_ID, nodeHashAtResolution: "h",
        resolvedBy: "AI_SUGGESTION", resolvedAt: "2026-09-08T10:00:00.000Z",
        title: "Le falta la cifra", kind: "applied",
        before: "Atendí a los clientes", after: "Atendí a 60 clientes por turno",
      }],
    }
    ;(storeState.sectionData.workExperience[0] as { description: string }).description =
      "• Atendí a 60 clientes por turno\n• Ordené la góndola al cierre"
    apiFetch.mockResolvedValueOnce(ndjsonResponse([ACTS[0], ACTS[1], conRegistro]))
    await mount()
    await escribir("#ats3-jd", "Buscamos cajera con arqueo de caja y atención al cliente")
    await click("Analizar compatibilidad")
    await click("Arreglar con Tailor")
    updateSectionData.mockClear()
    await click("done_undo")
    const escrito = updateSectionData.mock.calls.find((c) => c[0] === "workExperience")
    expect((escrito![1] as { description: string }[])[0].description).toContain("Atendí a los clientes")
    expect((escrito![1] as { description: string }[])[0].description).not.toContain("60 clientes")
  })

  it("«Ahora dice» no se muestra si el CV no lo dice: se aplicó y no se guardó", async () => {
    const conRegistro = {
      ...ACTS[2],
      resolved: [{
        findingId: "viejo1", nodeId: NODE_ID, nodeHashAtResolution: "h",
        resolvedBy: "AI_SUGGESTION", resolvedAt: "2026-09-08T10:00:00.000Z",
        title: "Le falta la cifra", kind: "applied",
        before: "Atendí a los clientes", after: "Atendí a 60 clientes por turno",
      }],
    }
    apiFetch.mockResolvedValueOnce(ndjsonResponse([ACTS[0], ACTS[1], conRegistro]))
    await mount()
    await escribir("#ats3-jd", "Buscamos cajera con arqueo de caja y atención al cliente")
    await click("Analizar compatibilidad")
    await click("Arreglar con Tailor")
    expect(texto()).not.toContain("Atendí a 60 clientes por turno")
  })

  it("un arreglo que otro volvió a mejorar sigue en «Hechas»", async () => {
    const conRegistro = {
      ...ACTS[2],
      resolved: [
        {
          findingId: "sin", nodeId: NODE_ID, nodeHashAtResolution: "h",
          resolvedBy: "AI_SUGGESTION", resolvedAt: "2026-09-08T10:00:00.000Z",
          title: "Falta SIN", kind: "applied",
          before: "", after: "Emití la factura electrónica del SIN",
        },
        {
          findingId: "fact", nodeId: NODE_ID, nodeHashAtResolution: "h2",
          resolvedBy: "AI_SUGGESTION", resolvedAt: "2026-09-08T10:05:00.000Z",
          title: "Falta facturación", kind: "applied",
          before: "Emití la factura electrónica del SIN", after: "Registré la facturación electrónica del SIN",
        },
      ],
    }
    ;(storeState.sectionData.workExperience[0] as { description: string }).description =
      "• Registré la facturación electrónica del SIN\n• Ordené la góndola al cierre"
    apiFetch.mockResolvedValueOnce(ndjsonResponse([ACTS[0], ACTS[1], conRegistro]))
    await mount()
    await escribir("#ats3-jd", "Buscamos cajera con arqueo de caja y atención al cliente")
    await click("Analizar compatibilidad")
    await click("Arreglar con Tailor")
    expect(texto()).toContain("Falta SIN")
    expect(texto()).toContain("Falta facturación")
  })

  /**
   * LAS HABILIDADES QUE ENTRAN A LA PLANTILLA, ENSEÑADAS ANTES DE ESCRIBIRLAS.
   *
   * Acá vivía el test del término suelto —una tarjeta por habilidad con su
   * botón—. Ese camino miraba un término por vez y podía llevar la lista a cien
   * entradas; la pregunta completa la contesta `skillPlan` con el techo de
   * veinte. Lo que NO cambió, y es lo que este caso protege: nada se escribe en
   * el CV sin que el usuario lo vea y lo acepte.
   */
  it("el plan de habilidades enseña qué entra y no escribe hasta que lo aceptás", async () => {
    // El CV DEMUESTRA «Arqueo de caja» en una viñeta y la lista no lo nombra:
    // es exactamente lo que el filtro lee literalmente y hoy no ve.
    const conCobertura = {
      ...ACTS[0],
      audit: {
        ...(ACTS[0] as { audit: Record<string, unknown> }).audit,
        hard: [{ skill: "Arqueo de caja", requirement: "MUST", status: "demonstrated", evidenceNodeId: NODE_ID, writeIn: null, question: null }],
      },
    }
    apiFetch.mockResolvedValueOnce(ndjsonResponse([conCobertura, ACTS[1], ACTS[2]]))
    await mount()
    await escribir("#ats3-jd", "Buscamos cajera con arqueo de caja y atención al cliente")
    await click("Analizar compatibilidad")
    await click("Arreglar con Tailor")

    updateSectionData.mockClear()
    // La vacante lo pide y el CV lo demuestra sin listarlo: entra.
    expect(texto()).toContain("Arqueo de caja")
    expect(updateSectionData.mock.calls.find((c) => c[0] === "skills")).toBeUndefined()

    const antes = (storeState.sectionData.skills ?? []).map((x: { name: string }) => x.name)
    await click("Aplicar este orden")
    const escrito = updateSectionData.mock.calls.find((c) => c[0] === "skills")
    expect(escrito).toBeTruthy()
    const skills = escrito![1] as { name: string; level: string }[]
    // Conserva TODO lo que la persona tenía —el plan ordena, no borra: el
    // 2026-09-24 borró 34 habilidades en producción— y suma lo que entra.
    for (const n of antes) expect(skills.map((s) => s.name)).toContain(n)
    expect(skills.map((s) => s.name)).toContain("Arqueo de caja")
  })
})
