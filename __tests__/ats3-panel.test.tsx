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
  section_tips: "Lo que mira la persona",
  section_tips_blurb: "Después del filtro automático",
  section_hard: "Habilidades duras",
  // La pantalla de entrada (espacio `editor.ats`).
  title: "ATS Score",
  pro_badge: "Pro",
  description: "La mayoría de empresas filtran CVs automáticamente.",
  placeholder: "Pega aquí el texto completo de la vacante...",
  hint: "Copia y pega el texto de la oferta tal como aparece.",
  analyze: "Analizar compatibilidad",
  type_no_metric: "Le falta la cifra",
}

vi.mock("next-intl", () => ({
  useTranslations: (ns?: string) => (key: string, params?: Record<string, string | number>) => {
    void ns
    const raw = messages[key] ?? key
    return params ? raw.replace(/\{(\w+)\}/g, (_m, k) => String(params[k] ?? `{${k}}`)) : raw
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
}

const setPosting = vi.fn()
vi.mock("@/stores/atsPostingStore", () => ({
  useAtsPostingStore: (selector: (s: { setPosting: typeof setPosting }) => unknown) => selector({ setPosting }),
}))

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
        relevance: { points: 25.4, max: 45, ratio: 0.56 },
        impact: { points: 21.4, max: 35, ratio: 0.61 },
      },
      components: [
        { key: "metric", pillar: "impact", numerator: 0, denominator: 2, ratio: 0, effectiveWeight: 10, points: 0, gainPerUnit: 5 },
      ],
    },
    // Los dos insumos con los que se midió: sin ellos la pantalla no puede
    // volver a medir cuando el usuario arregla algo.
    audit: {
      bullets: [],
      summary: { identity: true, proof: true, fit: true, extra: true },
      coverage: [],
      softCoverage: [],
      titleAlignment: 1,
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
    expect(texto()).toContain("Le falta la cifra")
  })

  it("el hallazgo cae en su sección, y la sección dice cuánto cubre", async () => {
    await analyze()
    // Un hallazgo, un lugar: la regla del informe sigue en pie con el motor nuevo.
    expect(texto()).toContain("Lo que mira la persona")
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
    const lineas = (d: string) => d.split("\n").map((l) => l.replace(/^\s*[•\-*]\s*/, "").trim()).filter(Boolean)
    const antes = lineas((storeState.sectionData.workExperience[0] as { description: string }).description)
    await click("Sacar del CV")
    await click("Sí, sacarla")
    expect(texto()).toContain("Línea sacada del CV")

    await click("Deshacer")
    const ultimo = updateSectionData.mock.calls[updateSectionData.mock.calls.length - 1]
    const despues = lineas((ultimo[1] as { description: string }[])[0].description)
    // EN SU LUGAR, no al final: pegarla al pie deja un CV distinto del que el
    // usuario tenía antes de apretar, y en un documento el orden es contenido.
    expect(despues).toEqual(antes)
  })

  it("no analiza con un aviso demasiado corto: el botón está apagado", async () => {
    await mount()
    expect(botón("Analizar compatibilidad").disabled).toBe(true)
    expect(apiFetch).not.toHaveBeenCalled()
  })
})

describe("la cifra la escribe el candidato", () => {
  async function openSheet() {
    await analyze()
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, suggestion: SUGGESTION, served: false }) })
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
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: false, reason: "already_good", detail: "" }) })
    await click("Escribirla mejor")
    // El modelo leyó la línea y declinó, y declinó bien: mostrarlo como rechazo
    // enseña a desconfiar de una respuesta honesta.
    expect(texto()).toContain("La línea ya está bien")
    expect(texto()).not.toContain("No pasó los controles")
  })

  it("si la línea ya no existe, NO se escribe y NO se dice que se aplicó", async () => {
    await analyze()
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
    await click("Aplicar a mi CV")

    // Un botón que marca "hecho" justo cuando no hace nada es el defecto que
    // este proyecto ya pagó: el usuario descarga un PDF que no cambió.
    expect(updateSectionData).not.toHaveBeenCalled()
    expect(texto()).toContain("stale_node")
  })

  it("un rechazo del motor se dice, con su motivo", async () => {
    await analyze()
    apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: false, reason: "verb_collision", detail: "Atendí" }),
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
    expect(texto()).toContain("server_error")
  })

  it("el botón de la fila pide la reescritura de ESA línea, no de otra", async () => {
    await analyze()
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
  })

  it("«no me interesa» cierra el hallazgo sin gastar una consulta, y lo RECUERDA", async () => {
    await analyze()
    apiFetch.mockClear()
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, stored: 1 }) })
    await click("No me interesa")
    // La única llamada es la que ANOTA que se resolvió: no llama al modelo y no
    // gasta cuota. Sin ella, el motor vuelve a señalarlo en la próxima corrida.
    const cuerpos = apiFetch.mock.calls.map((c) => JSON.parse((c[1] as { body: string }).body))
    expect(cuerpos).toHaveLength(1)
    expect(cuerpos[0].action).toBe("resolve")
    expect(cuerpos[0].entries[0].resolvedBy).toBe("DISMISSED")
    // La fila se va: lo único que sacaba una tarjeta de la pantalla era pagar por ella.
    expect(texto()).not.toContain("Le falta la cifra")
  })
})

describe("el puntaje se mueve mientras trabajás", () => {
  it("EL NÚMERO SE MUEVE AL ARREGLAR, y lo mide el motor", async () => {
    // Es lo que el CEO pidió textual: el score sube acorde a lo que se
    // soluciona. Antes el dial quedaba clavado hasta reanalizar —una llamada
    // más—, así que el usuario arreglaba cinco cosas y no veía moverse nada.
    await analyze()
    // Lo que el motor midió al analizar: el pilar de impacto, con la única
    // línea medible sin cifra.
    const antes = texto()
    expect(antes).toMatch(/Después del filtro automático/)

    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, suggestion: SUGGESTION, served: false }) })
    await click("Escribirla mejor")
    await escribir("#slot-\\[n\\]", "120")
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, stored: 1 }) })
    await click("Aplicar a mi CV")

    // La línea aceptada declara una cantidad, y ESE componente lo mide el código
    // sin preguntarle a nadie: la sección sube en el acto, sin gastar llamada.
    const pct = (t: string) => Number((t.match(/Lo que mira la persona(\d+)%/) ?? [])[1] ?? -1)
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

  it("agregar a Habilidades NO llama al modelo y escribe la lista", async () => {
    // Es el remedio que el motor declara para "lo demostrás y no está en
    // Habilidades". Reescribir la viñeta que ya lo demuestra no toca la sección
    // que el filtro lee literalmente, que es lo único que lo arregla.
    apiFetch.mockResolvedValueOnce(ndjsonResponse([
      ACTS[0],
      ACTS[1],
      {
        act: "findings",
        suppressed: 0,
        regressed: [],
        findings: [{
          id: "f9", type: "skill_not_listed", component: "must", remedy: "add_skill",
          subject: "Medios de pago", merged: ["skill_not_listed"], nodeId: NODE_ID,
          nodeText: "Atendí a los clientes en la línea de cajas", nodeHash: "h9",
          gain: 0, detail: "Medios de pago",
        }],
      },
    ]))
    await mount()
    await escribir("#ats3-jd", "Buscamos cajera con arqueo de caja y atención al cliente")
    await click("Analizar compatibilidad")

    apiFetch.mockClear()
    apiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, stored: 1 }) })
    await click("Agregar a Habilidades")

    const escrito = updateSectionData.mock.calls.find((c) => c[0] === "skills")
    expect(escrito).toBeTruthy()
    const skills = escrito![1] as { name: string; level: string }[]
    // Agrega al final, sin pisar lo que la persona ya tenía.
    expect(skills.map((s) => s.name)).toEqual(["Excel", "Medios de pago"])
    // El nivel NO lo decidimos nosotros: "advanced" era una afirmación sobre la
    // persona que nadie hizo. Se usa el valor por defecto del esquema del CV.
    expect(skills[1].level).toBe("intermediate")
    // Y ninguna llamada al modelo: la única petición es la que anota lo resuelto.
    const cuerpos = apiFetch.mock.calls.map((c) => JSON.parse((c[1] as { body: string }).body))
    expect(cuerpos.every((b) => b.action === "resolve")).toBe(true)
  })
})
