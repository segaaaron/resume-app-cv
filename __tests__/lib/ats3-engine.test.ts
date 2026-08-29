import { describe, it, expect } from "vitest"
import {
  buildTree,
  readBullets,
  cacheKey,
  runAnalysis,
  runRewrite,
  readableChecks,
  applySuggestion,
  writeInto,
  writeBack,
  findingsOf,
  termsOf,
  openLedger,
  type AtsAi,
  type AtsStore,
  type CacheKind,
  type RawResume,
} from "@/lib/ats3/engine"
import { buildTermIndex, type JobSpec, type Suggestion, type AnchoredSuggestion, type TriageDecision } from "@/lib/ats3/contracts"
import { scoreResume, type AuditFacts, type ParseChecks } from "@/lib/ats3/score"

/**
 * El motor, ejecutado de punta a punta con un modelo y un almacenamiento falsos.
 *
 * Lo que se mide acá es lo que ningún test de función suelta puede probar: cuántas
 * llamadas gasta una corrida. La promesa del producto —"reanalizar sin cambios
 * cuesta cero"— es un número, y un número se mide o no se afirma.
 */

// ── dobles ───────────────────────────────────────────────────────────────────

class MemoryStore implements AtsStore {
  private rows = new Map<string, unknown>()
  reads = 0
  writes = 0
  async read(kind: CacheKind, hash: string) {
    this.reads++
    return this.rows.get(`${kind}:${hash}`) ?? null
  }
  async write(kind: CacheKind, hash: string, payload: unknown) {
    this.writes++
    this.rows.set(`${kind}:${hash}`, payload)
  }
}

const SPEC: JobSpec = {
  roleTitleRaw: "Cajera de sucursal",
  roleTitleCanonical: "Cajera",
  metricThatMatters: "",
  seniority: null,
  yearsRequired: null,
  domain: null,
  workMode: null,
  language: "es",
  mustHave: [
    { skill: "Arqueo de caja", raw: "arqueo de caja", years: null, category: null },
    { skill: "Atención al cliente", raw: "atención al cliente", years: null, category: null },
  ],
  niceToHave: [{ skill: "Inventario", raw: "manejo de inventario", years: null, category: null }],
  responsibilities: [],
  softSignals: [],
}

const RAW: RawResume = {
  summary: "Cajera con experiencia en atención al cliente",
  workExperience: [
    {
      jobTitle: "Cajera",
      employer: "Supermercado Sur",
      startDate: "2021-03",
      endDate: "2024-06",
      description: "• Atendí a los clientes en la línea de cajas\n• Realicé el arqueo de caja al cierre",
    },
  ],
  skills: [{ name: "Excel" }],
}

function fakeAudit(): AuditFacts {
  const tree = buildTree(RAW)
  return {
    bullets: tree.roles[0].bullets.map((b, i) => ({
      id: b.id,
      hasActionVerb: true,
      hasResult: i === 0,
      hasMethod: i === 0,
    })),
    summary: { identity: true, proof: false, fit: false, extra: false },
    coverage: [
      { skill: "Arqueo de caja", requirement: "MUST", status: "FOUND", evidenceNodeId: null },
      { skill: "Atención al cliente", requirement: "MUST", status: "FOUND", evidenceNodeId: null },
      { skill: "Inventario", requirement: "NICE", status: "NOT_FOUND", evidenceNodeId: null },
    ],
    softCoverage: [],
    titleAlignment: 0.9,
  }
}

class CountingAi implements AtsAi {
  jd = 0
  audits = 0
  triages = 0
  rewrites = 0
  verifies = 0
  /** Lo que el modelo devuelve; cada test lo ajusta. */
  nextSuggestion: Suggestion | null = null
  lastNudge: string | undefined

  async parseJob() {
    this.jd++
    return SPEC
  }
  async audit() {
    this.audits++
    return fakeAudit()
  }
  triageDecisions: TriageDecision[] = []
  async triage() {
    this.triages++
    return this.triageDecisions
  }
  async rewriteBullet(input: { nudge?: string }) {
    this.rewrites++
    this.lastNudge = input.nudge
    return (
      this.nextSuggestion ?? {
        bulletId: "x",
        changed: true,
        // Sin cifra inventada a propósito: el guard la cazaría, y con razón.
        text: "Atendí a los clientes en la línea de cajas resolviendo consultas y cobros del turno",
        actionVerb: "Atendí",
        keywordsUsed: [],
        claim: "atención en caja",
        metricType: null,
        placeholders: [],
        variantWithoutMetric: null,
        measurableAspect: null, declineBasis: null,
      }
    )
  }
  async rewriteSummary() {
    this.rewrites++
    return {
      bulletId: "summary",
      changed: true,
      text: "Cajera con experiencia en atención al cliente y arqueo de caja en sucursal",
      actionVerb: "",
      keywordsUsed: [],
      claim: "",
      metricType: null,
      placeholders: [],
      variantWithoutMetric: null,
      measurableAspect: null, declineBasis: null,
    }
  }
  async verify() {
    this.verifies++
    return { pass: true, reason: "" }
  }
}

const CHECKS: ParseChecks = { contacto: true, unaColumna: true, fechas: true, imagenes: null }

async function analyze(ai: AtsAi, store: AtsStore) {
  const gen = runAnalysis({
    raw: RAW,
    jdText: "Buscamos cajera con arqueo de caja y atención al cliente",
    language: "es",
    resumeId: "cv1",
    model: "m1",
    checks: CHECKS,
    ai,
    store,
  })
  const acts = []
  let out = await gen.next()
  while (!out.done) {
    acts.push(out.value)
    out = await gen.next()
  }
  return { acts, telemetry: out.value }
}

// ── lectura del CV ───────────────────────────────────────────────────────────

describe("leer el CV", () => {
  it("acepta los tres separadores que un usuario produce escribiendo", () => {
    expect(readBullets("• Una\n- Dos\nTres")).toEqual(["Una", "Dos", "Tres"])
  })

  it("los ids no se mueven cuando se reordenan las líneas", () => {
    const a = buildTree(RAW)
    const flipped: RawResume = {
      ...RAW,
      workExperience: [
        { ...RAW.workExperience![0], description: "• Realicé el arqueo de caja al cierre\n• Atendí a los clientes en la línea de cajas" },
      ],
    }
    const b = buildTree(flipped)
    // Un id posicional convertiría cada hallazgo guardado en un puntero a la
    // línea equivocada en cuanto el usuario aplica algo.
    expect(new Set(a.roles[0].bullets.map((x) => x.id))).toEqual(new Set(b.roles[0].bullets.map((x) => x.id)))
  })

  /**
   * ── PÉRDIDA DE DATOS, MEDIDA ───────────────────────────────────────────────
   * Dos puestos con el mismo cargo, empresa y fecha de inicio —un "Freelance /
   * Independiente" repetido, que en un CV real pasa— derivaban el MISMO id, y al
   * escribir de vuelta el segundo pisaba al primero: desaparecían las viñetas de
   * un trabajo entero junto con la reescritura recién aceptada.
   */
  it("dos puestos idénticos NO comparten id", () => {
    const dup: RawResume = {
      summary: "x",
      workExperience: [
        { jobTitle: "Freelance", employer: "Independiente", startDate: "2020-01", endDate: "2021-01", description: "• Diseñé logotipos" },
        { jobTitle: "Freelance", employer: "Independiente", startDate: "2020-01", endDate: "2022-06", description: "• Edité video" },
      ],
      skills: [],
    }
    const t = buildTree(dup)
    expect(t.roles[0].id).not.toBe(t.roles[1].id)
  })

  it("y escribir en uno NO borra el otro", () => {
    const dup: RawResume = {
      summary: "x",
      workExperience: [
        { jobTitle: "Freelance", employer: "Independiente", startDate: "2020-01", endDate: "2021-01", description: "• Diseñé logotipos" },
        { jobTitle: "Freelance", employer: "Independiente", startDate: "2020-01", endDate: "2022-06", description: "• Edité video" },
      ],
      skills: [],
    }
    const t = buildTree(dup)
    const out = writeBack(writeInto(t, t.roles[0].bullets[0].id, "Diseñé identidad visual"), dup)
    expect(out.workExperience![0].description).toContain("Diseñé identidad visual")
    // El trabajo del segundo puesto sigue ahí: no lo pisó nadie.
    expect(out.workExperience![1].description).toContain("Edité video")
  })

  it("el mismo CV leído dos veces da los mismos ids", () => {
    expect(buildTree(RAW).roles[0].bullets.map((b) => b.id)).toEqual(buildTree(RAW).roles[0].bullets.map((b) => b.id))
  })
})

// ── LO QUE EL PRODUCTO PROMETE: el costo de reanalizar ───────────────────────

describe("cuántas llamadas cuesta cada escenario", () => {
  it("primera corrida: la vacante, la auditoría y el triage", async () => {
    const ai = new CountingAi()
    const { telemetry } = await analyze(ai, new MemoryStore())
    expect(telemetry.calls).toBe(3)
    expect(ai.jd).toBe(1)
    expect(ai.audits).toBe(1)
  })

  it("reanalizar sin tocar nada: CERO llamadas, y la MISMA respuesta", async () => {
    const store = new MemoryStore()
    const ai = new CountingAi()
    const first = await analyze(ai, store)
    const second = await analyze(ai, store)

    // El documento promete cero tokens al reanalizar. Es un número: se mide.
    // Medido antes de cerrarlo: costaba UNA llamada, porque el triage era la
    // única capa sin caché y nadie lo había contado.
    expect(second.telemetry.calls).toBe(0)
    expect(second.telemetry.served).toEqual({ jd: true, audit: true, triage: true })
    expect(ai.jd).toBe(1)
    expect(ai.audits).toBe(1)
    expect(ai.triages).toBe(1)

    // Y no basta con no gastar: tiene que decir LO MISMO. Un panel que cambia
    // solo entre dos clics es lo que hace que el usuario deje de creerle.
    expect(JSON.stringify(second.acts)).toBe(JSON.stringify(first.acts))
  })

  it("editar una viñeta re-audita; la vacante sigue servida del caché", async () => {
    const store = new MemoryStore()
    const ai = new CountingAi()
    await analyze(ai, store)

    const edited: RawResume = {
      ...RAW,
      workExperience: [{ ...RAW.workExperience![0], description: "• Atendí a los clientes rápido\n• Realicé el arqueo de caja al cierre" }],
    }
    const gen = runAnalysis({
      raw: edited,
      jdText: "Buscamos cajera con arqueo de caja y atención al cliente",
      language: "es",
      resumeId: "cv1",
      model: "m1",
      checks: CHECKS,
      ai,
      store,
    })
    let out = await gen.next()
    while (!out.done) out = await gen.next()

    expect(ai.jd).toBe(1) // la vacante no cambió
    expect(ai.audits).toBe(2) // el CV sí
  })

  it("un retoque cosmético NO dispara una corrida", async () => {
    const store = new MemoryStore()
    const ai = new CountingAi()
    await analyze(ai, store)

    const cosmetic: RawResume = {
      ...RAW,
      workExperience: [
        { ...RAW.workExperience![0], description: "•  Atendí a los clientes en la línea de cajas \n•   Realicé el arqueo de caja al cierre" },
      ],
    }
    const gen = runAnalysis({
      raw: cosmetic,
      jdText: "Buscamos cajera con arqueo de caja y atención al cliente",
      language: "es",
      resumeId: "cv1",
      model: "m1",
      checks: CHECKS,
      ai,
      store,
    })
    let out = await gen.next()
    while (!out.done) out = await gen.next()

    // Si el hash se calculara sobre el texto crudo, borrar un espacio doble
    // costaría una corrida entera y el caché no serviría de nada.
    expect(ai.audits).toBe(1)
  })

  it("la clave de la vacante no depende del CV: dos candidatos comparten", () => {
    expect(cacheKey.jd("Buscamos cajera", "m1")).toBe(cacheKey.jd("Buscamos  cajera ", "m1"))
    expect(cacheKey.jd("Buscamos cajera", "m1")).not.toBe(cacheKey.jd("Buscamos cajera", "m2"))
  })
})

// ── el pilar que el panel no medía ──────────────────────────────────────────

describe("¿se lee bien? — lo mide el motor, no el cliente", () => {
  it("un CV sano pasa sus chequeos", () => {
    const c = readableChecks(buildTree(RAW))
    expect(c.fechas_legibles).toBe(true)
    expect(c.resumen_presente).toBe(true)
    expect(c.puestos_con_contenido).toBe(true)
  })

  it("acepta los formatos que un CV produce de verdad", () => {
    // El regex de la primera versión no aceptaba "2021-03", que es EL formato
    // que esta aplicación guarda: marcaba las fechas de todos los CVs como
    // ilegibles. Un chequeo que falla siempre no informa, acusa.
    for (const fecha of ["2021-03", "2021", "03/2021", "marzo 2021", "marzo de 2021", "Presente"]) {
      const c = readableChecks(buildTree({ ...RAW, workExperience: [{ ...RAW.workExperience![0], startDate: fecha }] }))
      expect(c.fechas_legibles, `${fecha} debería ser legible`).toBe(true)
    }
  })

  it("una fecha ilegible se caza", () => {
    const c = readableChecks(buildTree({ ...RAW, workExperience: [{ ...RAW.workExperience![0], startDate: "hace tres años" }] }))
    expect(c.fechas_legibles).toBe(false)
  })

  it("un símbolo decorativo al abrir la línea se caza", () => {
    const c = readableChecks(buildTree({ ...RAW, workExperience: [{ ...RAW.workExperience![0], description: "• ★ Atendí la caja" }] }))
    expect(c.sin_simbolos_raros).toBe(false)
  })

  it("lo que NO se puede medir viaja como null, no como falla", () => {
    // Castigar por algo que nadie miró es fabricar un defecto.
    const c = readableChecks(buildTree({ summary: "x", workExperience: [], skills: [] }))
    expect(c.fechas_legibles).toBeNull()
    expect(c.orden_cronologico).toBeNull()
  })

  it("un CV perfecto llega a 100, no a 80", async () => {
    // Medido antes del arreglo: 80/100 con TODO cubierto, porque el pilar de
    // lectura llegaba vacío y sus 20 puntos eran inalcanzables.
    const { acts } = await analyze(new CountingAi(), new MemoryStore())
    const score = acts.find((a) => a.act === "score")
    if (score?.act !== "score") throw new Error("sin puntaje")
    const techo = score.score.components.reduce((s, c) => s + c.effectiveWeight, 0)
    expect(techo).toBeCloseTo(100, 6)
  })
})

// ── los actos ────────────────────────────────────────────────────────────────

describe("el análisis se entrega en actos", () => {
  it("el puntaje llega primero y no cuesta una llamada", async () => {
    const { acts } = await analyze(new CountingAi(), new MemoryStore())
    expect(acts[0].act).toBe("score")
    // El triage decide ANTES: es quien dice si una línea merece trabajo, y los
    // hallazgos dicen qué trabajo. Al revés, la misma viñeta salía "ya está
    // bien" arriba y "arreglala" abajo.
    expect(acts.map((a) => a.act)).toEqual(["score", "job", "covered", "triage", "findings"])
  })

  it("un requisito que falta sale como hallazgo con su ganancia medida", async () => {
    const { acts } = await analyze(new CountingAi(), new MemoryStore())
    const findings = acts.find((a) => a.act === "findings")
    if (findings?.act !== "findings") throw new Error("sin acto de hallazgos")
    // Puede venir como tarjeta propia o FUSIONADA en la de la línea que mejor
    // lo alojaría: lo que no puede es desaparecer.
    const missing = findings.findings.find((f) => f.merged.includes("missing_requirement"))
    expect(missing).toBeDefined()
    expect(missing!.gain).toBeGreaterThan(0)
    expect(missing!.detail).toContain("Inventario")
  })

  it("cada requisito que falta aterriza en la línea que MÁS se le parece", () => {
    // Antes: `bestHomeFor` ignoraba la habilidad y mandaba TODOS los requisitos
    // faltantes a la misma línea. Con la regla de fusión terminaban en una sola
    // tarjeta, y el usuario leía "te falta todo" sobre una viñeta al azar.
    const tree = buildTree({
      summary: "Cajera",
      workExperience: [
        {
          jobTitle: "Cajera", employer: "S", startDate: "2021-01", endDate: "2024-01",
          description: "• Ordené el inventario del depósito\n• Cobré con la terminal de pagos",
        },
      ],
      skills: [],
    })
    const spec2 = {
      ...SPEC,
      mustHave: [
        { skill: "Control de inventario", raw: "control de inventario", years: null, category: null },
        { skill: "Medios de pago", raw: "medios de pago", years: null, category: null },
      ],
      niceToHave: [],
    }
    const audit = {
      bullets: tree.roles[0].bullets.map((b) => ({ id: b.id, hasActionVerb: true, hasResult: true, hasMethod: true })),
      summary: { identity: true, proof: true, fit: true, extra: true },
      coverage: [
        { skill: "Control de inventario", requirement: "MUST" as const, status: "NOT_FOUND" as const, evidenceNodeId: null },
        { skill: "Medios de pago", requirement: "MUST" as const, status: "NOT_FOUND" as const, evidenceNodeId: null },
      ],
      softCoverage: [],
      titleAlignment: 1,
    }
    const score = scoreResume(tree, spec2, audit, CHECKS)
    const index = buildTermIndex(termsOf(spec2, tree))
    const findings = findingsOf(tree, spec2, audit, score, index)

    const inventario = findings.find((f) => f.detail.includes("Control de inventario"))
    const pagos = findings.find((f) => f.detail.includes("Medios de pago"))
    expect(inventario).toBeDefined()
    expect(pagos).toBeDefined()
    // Cada uno en SU línea, no los dos en la misma.
    expect(inventario!.nodeId).not.toBe(pagos!.nodeId)
    expect(inventario!.nodeText).toContain("inventario")
    expect(pagos!.nodeText).toContain("pagos")
  })

  it("dice qué términos de la vacante YA están cubiertos", async () => {
    // Sin esto el ledger marca TODO como prioritario y el modelo no sabe dónde
    // gastar el presupuesto de palabras clave, que es lo que mueve el puntaje.
    const { acts } = await analyze(new CountingAi(), new MemoryStore())
    const c = acts.find((a) => a.act === "covered")
    if (c?.act !== "covered") throw new Error("sin acto de cobertura")
    expect(c.terms).toContain("Arqueo de caja")
    expect(c.terms).not.toContain("Inventario") // ese no está demostrado
  })

  it("una línea que el triage marcó KEEP no recibe además una tarjeta que la corrija", async () => {
    const ai = new CountingAi()
    const tree = buildTree(RAW)
    // El triage dice "está bien"; el motor determinista ve que le falta cifra.
    ai.triageDecisions = [
      { bulletId: tree.roles[0].bullets[1].id, verdict: "KEEP", reason: "ya está bien", relevance: 0.9, proposedTopic: null, needsUserConfirm: null },
    ]
    const { acts } = await analyze(ai, new MemoryStore())
    const f = acts.find((a) => a.act === "findings")
    if (f?.act !== "findings") throw new Error("sin hallazgos")
    // Dos sistemas contradiciéndose en la misma pantalla: uno de los dos sobra.
    expect(f.findings.some((x) => x.nodeId === tree.roles[0].bullets[1].id)).toBe(false)
  })

  it("UNA línea, UNA tarjeta: dos defectos en la misma viñeta no dan dos", async () => {
    const tree = buildTree(RAW)
    const audit = fakeAudit()
    const score = scoreResume(tree, SPEC, audit, CHECKS)
    const index = buildTermIndex(termsOf(SPEC, tree))
    const findings = findingsOf(tree, SPEC, audit, score, index)
    const ids = findings.map((f) => f.nodeId)
    expect(new Set(ids).size).toBe(ids.length)
    // Y nada se perdió por el camino: el que se fusionó dejó su tipo.
    expect(findings.flatMap((f) => f.merged).length).toBeGreaterThanOrEqual(findings.length)
  })
})

// ── la reescritura ───────────────────────────────────────────────────────────

describe("la reescritura y su reintento", () => {
  const setup = () => {
    const tree = buildTree(RAW)
    const index = buildTermIndex(termsOf(SPEC, tree))
    const ledger = openLedger(tree, SPEC, new Set())
    return { tree, index, ledger }
  }

  it("una reescritura sana se entrega y se guarda", async () => {
    const { tree, index, ledger } = setup()
    const ai = new CountingAi()
    const store = new MemoryStore()
    const target = tree.roles[0].bullets[0]

    const r = await runRewrite({ tree, nodeId: target.id, spec: SPEC, ledger, index, language: "es", model: "m1", jdKey: "jd", ai, store })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.suggestion.originalText).toBe(target.text)
  })

  it("la segunda vez se sirve del caché: cero llamadas", async () => {
    const { tree, index, ledger } = setup()
    const ai = new CountingAi()
    const store = new MemoryStore()
    const target = tree.roles[0].bullets[0]
    const args = { tree, nodeId: target.id, spec: SPEC, ledger, index, language: "es" as const, model: "m1", jdKey: "jd", ai, store }

    await runRewrite(args)
    const rewrites = ai.rewrites
    const second = await runRewrite(args)
    expect(second.ok).toBe(true)
    if (second.ok) expect(second.served).toBe(true)
    expect(ai.rewrites).toBe(rewrites)
  })

  it("si el guard rechaza, se reintenta UNA vez diciendo qué falló", async () => {
    const { tree, index, ledger } = setup()
    const ai = new CountingAi()
    const target = tree.roles[0].bullets[0]
    // Una cifra que el candidato nunca dio: el guard la caza.
    ai.nextSuggestion = {
      bulletId: target.id,
      changed: true,
      text: "Atendí a 300 clientes por turno en la línea de cajas resolviendo consultas",
      actionVerb: "Atendí",
      keywordsUsed: [],
      claim: "atención en caja",
      metricType: null,
      placeholders: [],
      variantWithoutMetric: null,
      measurableAspect: null, declineBasis: null,
    }

    const r = await runRewrite({
      tree, nodeId: target.id, spec: SPEC, ledger, index, language: "es", model: "m1", jdKey: "jd", ai, store: new MemoryStore(),
    })
    expect(ai.rewrites).toBe(2) // pidió, falló, pidió UNA vez más
    expect(ai.lastNudge ?? "").toContain("300") // y le dijo qué falló
    expect(r.ok).toBe(false)
    if (!r.ok && !r.alreadyGood) expect(r.verdict.ok).toBe(false)
  })

  it("declinar diciendo que falta un eje es una contradicción: se pide una vez más", async () => {
    // Medido contra la API: el modelo devolvió "ya está bien" sobre una línea de
    // tres palabras sin resultado ni método. Reforzar la regla en prosa no lo
    // movió; declararlo sí, porque una contradicción declarada la ve el código.
    const { tree, index, ledger } = setup()
    const target = tree.roles[0].bullets[0]
    const nudges: string[] = []
    const ai = new CountingAi()
    const base = {
      bulletId: target.id, actionVerb: "Administré", keywordsUsed: [], claim: "", metricType: null,
      placeholders: [], variantWithoutMetric: null, measurableAspect: null,
    }
    ai.rewriteBullet = async (input: { nudge?: string }) => {
      nudges.push(input.nudge ?? "")
      ai.rewrites++
      return nudges.length === 1
        ? { ...base, changed: false, text: "", declineBasis: { hasActionVerb: true, hasResult: false, hasMethod: false } }
        : { ...base, changed: true, text: "Administré la medicación indicada según el horario y el registro del turno", declineBasis: null }
    }
  
    const r = await runRewrite({
      tree, nodeId: target.id, spec: SPEC, ledger, index, language: "es", model: "m1", jdKey: "jd", ai, store: new MemoryStore(),
    })
    expect(nudges).toHaveLength(2)
    expect(nudges[1]).toMatch(/resultado|método/)
    expect(r.ok).toBe(true)
  })

  it("nunca reintenta dos veces: eso escondería un prompt que dejó de funcionar", async () => {
    const { tree, index, ledger } = setup()
    const ai = new CountingAi()
    const target = tree.roles[0].bullets[0]
    ai.nextSuggestion = {
      bulletId: target.id, changed: true,
      text: "Atendí a 300 clientes por turno en la línea de cajas resolviendo consultas",
      actionVerb: "Atendí", keywordsUsed: [], claim: "", metricType: null, placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null,
    }
    await runRewrite({ tree, nodeId: target.id, spec: SPEC, ledger, index, language: "es", model: "m1", jdKey: "jd", ai, store: new MemoryStore() })
    expect(ai.rewrites).toBe(2)
  })
})

// ── aplicar ──────────────────────────────────────────────────────────────────

describe("aplicar mide, no promete", () => {
  const anchored = (over: Partial<AnchoredSuggestion>): AnchoredSuggestion => ({
    bulletId: "x", changed: true, text: "t", actionVerb: "Hice", keywordsUsed: [], claim: "",
    metricType: null, placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null,
    basedOnHash: "h", originalText: "o", delta: 0, ...over,
  })

  it("una sugerencia pensada sobre una versión vieja NO pisa la edición del usuario", () => {
    const tree = buildTree(RAW)
    const target = tree.roles[0].bullets[0]
    const edited = writeInto(tree, target.id, "Lo escribí yo a mano después")

    const r = applySuggestion(
      edited,
      anchored({ bulletId: target.id, basedOnHash: target.hash, text: "Propuesta vieja del modelo" }),
      SPEC, fakeAudit(), CHECKS, openLedger(tree, SPEC, new Set()),
    )
    expect(r.ok).toBe(false)
    expect(r.reason?.ok).toBe(false)
    // Y el texto del usuario sigue ahí.
    expect(r.tree.roles[0].bullets[0].text).toBe("Lo escribí yo a mano después")
  })

  it("el árbol original NUNCA se muta: se escribe sobre una copia", () => {
    const tree = buildTree(RAW)
    const target = tree.roles[0].bullets[0]
    const before = target.text
    applySuggestion(
      tree,
      anchored({ bulletId: target.id, basedOnHash: target.hash, text: "Texto nuevo" }),
      SPEC, fakeAudit(), CHECKS, openLedger(tree, SPEC, new Set()),
    )
    expect(tree.roles[0].bullets[0].text).toBe(before)
  })

  it("aceptar deja el nodo marcado como escrito por el motor", () => {
    const tree = buildTree(RAW)
    const target = tree.roles[0].bullets[0]
    const r = applySuggestion(
      tree,
      anchored({ bulletId: target.id, basedOnHash: target.hash, text: "Atendí a los clientes con cobro y consultas" }),
      SPEC, fakeAudit(), CHECKS, openLedger(tree, SPEC, new Set()),
    )
    expect(r.tree.roles[0].bullets[0].origin).toBe("AI_ACCEPTED")
    expect(r.resolution?.nodeId).toBe(target.id)
  })

  it("el delta sale de recalcular, no de lo que diga el modelo", () => {
    const tree = buildTree(RAW)
    const target = tree.roles[0].bullets[1]
    const audit = fakeAudit()
    const r = applySuggestion(
      tree,
      // Le agrega una cifra: el componente "metric" sube y el delta tiene que
      // ser exactamente el que la pantalla había prometido.
      anchored({ bulletId: target.id, basedOnHash: target.hash, text: "Realicé el arqueo de caja de 3 turnos al cierre" }),
      SPEC, audit, CHECKS, openLedger(tree, SPEC, new Set()),
    )
    const promised = scoreResume(tree, SPEC, audit, CHECKS).components.find((c) => c.key === "metric")!.gainPerUnit
    expect(r.delta).toBeCloseTo(promised, 10)
  })
})

// ── volver al formato de la aplicación ──────────────────────────────────────

describe("escribir de vuelta el CV", () => {
  it("devuelve las viñetas al campo del que salieron, sin perder ninguna", () => {
    const tree = buildTree(RAW)
    const changed = writeInto(tree, tree.roles[0].bullets[0].id, "Atendí a los clientes con cobro y consultas")
    const out = writeBack(changed, RAW)
    expect(out.workExperience![0].description).toContain("Atendí a los clientes con cobro y consultas")
    expect(readBullets(out.workExperience![0].description!)).toHaveLength(2)
  })

  it("un puesto que el motor no tocó vuelve intacto", () => {
    const out = writeBack(buildTree(RAW), RAW)
    expect(readBullets(out.workExperience![0].description!)).toEqual(readBullets(RAW.workExperience![0].description!))
  })
})

describe("la trayectoria se lee sin tropezar, y lo mide el código", () => {
  const conFechas = (rangos: [string, string][]) =>
    readableChecks(
      buildTree({
        workExperience: rangos.map(([startDate, endDate], i) => ({
          jobTitle: `Puesto ${i}`, employer: `Empresa ${i}`, startDate, endDate,
          description: "• Hice el trabajo del puesto con detalle suficiente",
        })),
      }),
    ).trayectoria_continua

  it("un hueco de más de seis meses se marca", () => {
    // Es de las primeras cosas que mira quien lee, y sale de las fechas que el
    // CV ya tiene: cero tokens.
    expect(conFechas([["2019-01", "2020-01"], ["2021-06", "2023-01"]])).toBe(false)
  })

  it("un hueco corto NO se marca: cambiar de trabajo lleva tiempo", () => {
    expect(conFechas([["2019-01", "2020-01"], ["2020-04", "2023-01"]])).toBe(true)
  })

  it("fechas superpuestas se marcan", () => {
    expect(conFechas([["2019-01", "2021-06"], ["2020-01", "2023-01"]])).toBe(false)
  })

  it("con un solo puesto no se puede medir, y NO se castiga", () => {
    // Castigar por algo que no se pudo mirar es fabricar un defecto.
    expect(conFechas([["2019-01", "2023-01"]])).toBeNull()
  })

  it("el puesto actual sin fecha de fin no cuenta como hueco", () => {
    expect(conFechas([["2019-01", "2021-01"], ["2021-03", "Presente"]])).toBe(true)
  })
})

describe("lo que está pero donde no se ve, y lo que no está en Habilidades", () => {
  const arbol = () =>
    buildTree({
      summary: "Cajera con experiencia",
      skills: [{ name: "Atención al cliente" }],
      workExperience: [
        { jobTitle: "Cajera", employer: "Súper", startDate: "2023-01", endDate: "Presente", description: "• Atendí a los clientes en la línea de cajas" },
        { jobTitle: "Repositora", employer: "Súper", startDate: "2021-01", endDate: "2022-12", description: "• Ordené la góndola por fecha de vencimiento" },
        { jobTitle: "Ayudante", employer: "Kiosco", startDate: "2019-01", endDate: "2020-12", description: "• Realicé el arqueo de caja al cierre" },
      ],
    })

  const facts = (arbolCV: ReturnType<typeof buildTree>, skill: string, nodo: string) => ({
    bullets: arbolCV.roles.flatMap((r) => r.bullets).map((b) => ({ id: b.id, hasActionVerb: true, hasResult: true, hasMethod: true })),
    summary: { identity: true, proof: true, fit: true, extra: true },
    coverage: [{ skill, requirement: "MUST" as const, status: "FOUND" as const, evidenceNodeId: nodo }],
    softCoverage: [],
    titleAlignment: 1,
  })

  it("un requisito demostrado SÓLO en el puesto más viejo se señala como enterrado", () => {
    // No es una brecha: es una ubicación. Por eso no suma puntos — mover, no
    // escribir de nuevo.
    const t = arbol()
    const viejo = t.roles[2].bullets[0].id
    const spec = { ...SPEC, mustHave: [{ skill: "Arqueo de caja", raw: "arqueo de caja", years: null, category: null }] }
    const index = buildTermIndex(termsOf(spec, t))
    const audit = facts(t, "Arqueo de caja", viejo)
    const score = scoreResume(t, spec, audit, {})
    const hallazgos = findingsOf(t, spec, audit, score, index)
    const enterrado = hallazgos.find((f) => f.merged.includes("buried_term"))
    // SE ANCLA EN EL PUESTO ACTUAL, no en el viejo: el problema no es cómo está
    // escrita la línea de 2015, es que el término sólo vive ahí. Anclarlo abajo
    // daba un botón que reescribía justo lo que no había que tocar.
    const arriba = t.roles[0].bullets.map((b) => b.id)
    expect(arriba).toContain(enterrado?.nodeId)
    expect(enterrado?.nodeId).not.toBe(viejo)
    // Y el remedio lo dice el motor: mencionarlo arriba, no reescribir.
    expect(enterrado?.remedy).toBe("weave")
  })

  it("lo demostrado en una viñeta y ausente de Habilidades se señala", () => {
    // El filtro lee esa sección literalmente y es de lo primero que mira.
    const t = arbol()
    const actual = t.roles[0].bullets[0].id
    const spec = { ...SPEC, mustHave: [{ skill: "Medios de pago", raw: "medios de pago", years: null, category: null }] }
    const index = buildTermIndex(termsOf(spec, t))
    const audit = facts(t, "Medios de pago", actual)
    const score = scoreResume(t, spec, audit, {})
    const hallazgos = findingsOf(t, spec, audit, score, index)
    const sinListar = hallazgos.find((f) => f.merged.includes("skill_not_listed"))
    expect(sinListar).toBeTruthy()
    // Lo cierra AGREGARLO A LA LISTA. Reescribir la viñeta que ya lo demuestra
    // no toca la sección que el filtro lee literalmente.
    expect(sinListar?.remedy).toBe("add_skill")
    expect(sinListar?.detail).toBe("Medios de pago")
  })

  it("lo que YA está en Habilidades no se señala", () => {
    const t = arbol()
    const actual = t.roles[0].bullets[0].id
    const spec = { ...SPEC, mustHave: [{ skill: "Atención al cliente", raw: "atención al cliente", years: null, category: null }] }
    const index = buildTermIndex(termsOf(spec, t))
    const audit = facts(t, "Atención al cliente", actual)
    const score = scoreResume(t, spec, audit, {})
    const hallazgos = findingsOf(t, spec, audit, score, index)
    expect(hallazgos.some((f) => f.merged.includes("skill_not_listed"))).toBe(false)
  })

  it("dos términos sobre la misma línea son DOS tarjetas, no una concatenada", () => {
    // "Una línea, una tarjeta" vale para lo que se dice DE LA LÍNEA. Un término
    // que falta en Habilidades habla del TÉRMINO: fusionarlos habría agregado a
    // Habilidades la concatenación de los dos, que no es habilidad de nadie.
    const t = arbol()
    const actual = t.roles[0].bullets[0].id
    const spec = {
      ...SPEC,
      mustHave: [
        { skill: "Medios de pago", raw: "medios de pago", years: null, category: null },
        { skill: "Facturación", raw: "facturación", years: null, category: null },
      ],
    }
    const index = buildTermIndex(termsOf(spec, t))
    const audit = {
      ...facts(t, "Medios de pago", actual),
      coverage: [
        { skill: "Medios de pago", requirement: "MUST" as const, status: "FOUND" as const, evidenceNodeId: actual },
        { skill: "Facturación", requirement: "MUST" as const, status: "FOUND" as const, evidenceNodeId: actual },
      ],
    }
    const score = scoreResume(t, spec, audit, {})
    const sinListar = findingsOf(t, spec, audit, score, index).filter((f) => f.merged.includes("skill_not_listed"))
    expect(sinListar.map((f) => f.detail).sort()).toEqual(["Facturación", "Medios de pago"])
    // Ids distintos: dos tarjetas con el mismo id se aplican sobre la equivocada.
    expect(new Set(sinListar.map((f) => f.id)).size).toBe(2)
  })

  it("la blanda que se declara y nada respalda tiene salida: demostrarla", () => {
    // Es la lista de adjetivos que todo reclutador saltea. Su remedio no es
    // tocar la lista: es demostrarla en una línea, y el motor elige cuál.
    const t = arbol()
    const spec = { ...SPEC, mustHave: [], softSignals: ["Trabajo en equipo"] }
    const index = buildTermIndex(termsOf(spec, t))
    const audit = {
      ...facts(t, "x", t.roles[0].bullets[0].id),
      coverage: [],
      softCoverage: [{ signal: "Trabajo en equipo", status: "DECLARED_ONLY" as const, evidenceNodeId: null }],
    }
    const score = scoreResume(t, spec, audit, {})
    const blanda = findingsOf(t, spec, audit, score, index).find((f) => f.merged.includes("soft_not_shown"))
    expect(blanda?.detail).toBe("Trabajo en equipo")
    expect(blanda?.remedy).toBe("weave")
    // Las blandas no puntúan: la tarjeta no puede prometer puntos.
    expect(blanda?.gain).toBe(0)
  })

  it("lo que el CV demuestra SIN NOMBRARLO también se ofrece para Habilidades", () => {
    // Es el caso que más pierde: la persona lo hace, el filtro no lo ve.
    const t = arbol()
    const actual = t.roles[0].bullets[0].id
    const spec = { ...SPEC, mustHave: [{ skill: "Medios de pago", raw: "medios de pago", years: null, category: null }] }
    const index = buildTermIndex(termsOf(spec, t))
    const audit = {
      ...facts(t, "Medios de pago", actual),
      coverage: [{ skill: "Medios de pago", requirement: "MUST" as const, status: "IMPLIED" as const, evidenceNodeId: actual }],
    }
    const score = scoreResume(t, spec, audit, {})
    const hallazgos = findingsOf(t, spec, audit, score, index)
    expect(hallazgos.find((f) => f.merged.includes("skill_not_listed"))?.remedy).toBe("add_skill")
  })

  it("un requisito que el CV NO tiene nunca se ofrece para Habilidades", () => {
    // Agregar una habilidad que la persona no tiene es mentir en su CV.
    const t = arbol()
    const spec = { ...SPEC, mustHave: [{ skill: "SAP", raw: "SAP", years: null, category: null }] }
    const index = buildTermIndex(termsOf(spec, t))
    const audit = {
      ...facts(t, "SAP", t.roles[0].bullets[0].id),
      coverage: [{ skill: "SAP", requirement: "MUST" as const, status: "NOT_FOUND" as const, evidenceNodeId: null }],
    }
    const score = scoreResume(t, spec, audit, {})
    const hallazgos = findingsOf(t, spec, audit, score, index)
    expect(hallazgos.some((f) => f.remedy === "add_skill")).toBe(false)
  })
})
