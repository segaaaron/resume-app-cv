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
  skillPlan,
  type AtsAi,
  type AtsStore,
  type CacheKind,
  type RawResume,
  type RewriteInput,
} from "@/lib/ats3/engine"
import { nuevaEn, type JobSpec, type ResumeTree, type Suggestion, type AnchoredSuggestion } from "@/lib/ats3/contracts"
import { BULLETS_PER_ROLE_MIN, SKILLS_MAX } from "@/lib/ats3/ledger"
import { experienceYears, scoreResume, type AuditFacts, type ParseChecks } from "@/lib/ats3/score"

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
  conditions: [],
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

/** La decisión del ATS sobre el CV QUE RECIBE, como hace el modelo real. */
function fakeAudit(tree: ResumeTree = buildTree(RAW)): AuditFacts {
  return {
    bullets: tree.roles.flatMap((r) => r.bullets).map((b, i) => ({
      id: b.id,
      decision: i === 0 ? ("keep" as const) : ("improve" as const),
      reason: i === 0 ? "Ya prueba la atención." : "No dice qué se cuadraba.",
      instruction: i === 0 ? null : "Decí que el arqueo cuadraba efectivo y comprobantes del turno.",
      needsFigure: false,
    })),
    hard: [
      { skill: "Arqueo de caja", requirement: "MUST", status: "demonstrated", evidenceNodeId: tree.roles[0]?.bullets[1]?.id ?? null, writeIn: null, question: null },
      { skill: "Atención al cliente", requirement: "MUST", status: "demonstrated", evidenceNodeId: tree.roles[0]?.bullets[0]?.id ?? null, writeIn: null, question: null },
      { skill: "Inventario", requirement: "NICE", status: "missing", evidenceNodeId: null, writeIn: null, question: "¿Llevaste inventario?" },
    ],
    soft: [],
    summary: { identity: true, proof: false, fit: false, extra: false },
  }
}

const sug = (over: Partial<Suggestion> = {}): Suggestion => ({
  bulletId: "x",
  changed: true,
  text: "Atendí a los clientes en la línea de cajas resolviendo consultas y cobros del turno",
  actionVerb: "Atendí",
  keywordsUsed: [],
  claim: "",
  metricType: null,
  placeholders: [],
  variantWithoutMetric: null,
  measurableAspect: null,
  ...over,
})

class CountingAi implements AtsAi {
  jd = 0
  audits = 0
  rewrites = 0
  /** Lo que el modelo devuelve; cada test lo ajusta. */
  nextSuggestion: Suggestion | null = null
  lastNudge: string | undefined
  nudges: (string | undefined)[] = []
  auditFor: ((tree: ResumeTree, nudge?: string) => AuditFacts) | null = null
  alreadyFixedSeen: string[][] = []

  async parseJob() {
    this.jd++
    return SPEC
  }
  async audit(tree: ResumeTree, _spec: JobSpec, alreadyFixed: string[] = [], nudge?: string) {
    this.audits++
    this.alreadyFixedSeen.push(alreadyFixed)
    return this.auditFor ? this.auditFor(tree, nudge) : fakeAudit(tree)
  }
  tools = 0
  toolsFor: ((tree: ResumeTree) => { id: string; tools: string[]; sinTamano?: boolean; sinLogro?: boolean }[]) | null = null
  async matchTools(tree: ResumeTree) {
    this.tools++
    return this.toolsFor ? this.toolsFor(tree) : []
  }
  async rewriteBullet(input: RewriteInput) {
    this.rewrites++
    this.lastNudge = input.nudge
    this.nudges.push(input.nudge)
    return this.nextSuggestion ?? sug()
  }
  async rewriteSummary() {
    this.rewrites++
    return sug({ bulletId: "summary", text: "Cajera con experiencia en atención al cliente y arqueo de caja en sucursal", actionVerb: "" })
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
  it("primera corrida: la vacante, la auditoría y las herramientas", async () => {
    const ai = new CountingAi()
    const { telemetry } = await analyze(ai, new MemoryStore())
    expect(telemetry.calls).toBe(3)
    expect(ai.tools).toBe(1)
    expect(ai.jd).toBe(1)
    expect(ai.audits).toBe(1)
  })

  it("reanalizar sin tocar nada: CERO llamadas, y la MISMA respuesta", async () => {
    const store = new MemoryStore()
    const ai = new CountingAi()
    const first = await analyze(ai, store)
    const second = await analyze(ai, store)

    // El documento promete cero tokens al reanalizar. Es un número: se mide.
    expect(second.telemetry.calls).toBe(0)
    expect(second.telemetry.served).toEqual({ jd: true, audit: true })
    expect(ai.jd).toBe(1)
    expect(ai.audits).toBe(1)

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


// ── los actos ────────────────────────────────────────────────────────────────

describe("el análisis se entrega en actos", () => {
  it("el puntaje llega primero y no cuesta una llamada", async () => {
    const { acts } = await analyze(new CountingAi(), new MemoryStore())
    expect(acts.map((a) => a.act)).toEqual(["score", "job", "findings"])
  })

  it("cada decisión del ATS es UNA tarjeta, con lo que Tailor recibe", async () => {
    const { acts } = await analyze(new CountingAi(), new MemoryStore())
    const f = acts.find((a) => a.act === "findings")
    if (f?.act !== "findings") throw new Error("sin hallazgos")
    const tree = buildTree(RAW)
    // «Mejorar» sin nada verificable que agregar (sólo una instrucción libre) no abre tarjeta.
    expect(f.findings.filter((x) => x.type === "improve_bullet")).toHaveLength(0)
    // La que el ATS mantiene no tiene tarjeta.
    expect(f.findings.some((x) => x.nodeId === tree.roles[0].bullets[0].id)).toBe(false)
    // La skill sin rastro pregunta.
    const inv = f.findings.find((x) => x.type === "missing_skill")
    expect(inv?.remedy).toBe("ask")
    expect(inv?.question).toBe("¿Llevaste inventario?")
  })
})

describe("findingsOf traduce la decisión del ATS, no la juzga", () => {
  const tree = buildTree(RAW)
  const [b0, b1] = tree.roles[0].bullets
  const base = fakeAudit(tree)
  const fs = (audit: AuditFacts, spec: JobSpec = SPEC) => findingsOf(tree, audit, scoreResume(tree, spec, audit, CHECKS), spec)

  it("remove da una tarjeta de sacar con su motivo", () => {
    const a = { ...base, bullets: base.bullets.map((b) => (b.id === b1.id ? { ...b, decision: "remove" as const, reason: "Repite a otra." } : b)) }
    const f = fs(a).find((x) => x.nodeId === b1.id)
    expect(f?.type).toBe("remove_bullet")
    expect(f?.remedy).toBe("remove")
    expect(f?.reason).toBe("Repite a otra.")
  })

  it("ningún nombre del aviso se escribe dentro de una viñeta: aunque el ATS diga dónde, se pregunta", () => {
    const a: AuditFacts = { ...base, hard: [...base.hard, { skill: "Línea de cajas", requirement: "MUST", status: "missing", evidenceNodeId: null, writeIn: b0.id, question: null }] }
    expect(fs(a).some((x) => x.nodeId === b0.id && x.type === "improve_bullet")).toBe(false)
    expect(fs(a).find((x) => x.subject === "Línea de cajas")?.remedy).toBe("ask")
  })

  it("una soft que el CV no demuestra se pregunta", () => {
    const a: AuditFacts = { ...base, soft: [{ signal: "Trabajo en equipo", status: "missing", evidenceNodeId: null, writeIn: null }] }
    const f = fs(a).find((x) => x.subject === "Trabajo en equipo")
    expect(f?.remedy).toBe("ask")
    expect(f?.component).toBe("soft")
  })

  it("una skill que el CV no respalda no se escribe en ninguna viñeta: se pregunta", () => {
    const a: AuditFacts = { ...base, hard: [...base.hard, { skill: "POS", requirement: "MUST", status: "missing", evidenceNodeId: null, writeIn: b0.id, question: null }] }
    expect(fs(a).find((x) => x.nodeId === b0.id)?.terms).toBeUndefined()
    expect(fs(a).find((x) => x.subject === "POS")?.remedy).toBe("ask")
  })

  it("una credencial sin rastro sale sin botón de IA", () => {
    const spec = { ...SPEC, mustHave: [...SPEC.mustHave, { skill: "Licencia B", raw: "Licencia B", years: null, category: null, kind: "credential" as const }] } as JobSpec
    const a: AuditFacts = { ...base, hard: [...base.hard, { skill: "Licencia B", requirement: "MUST", status: "missing", evidenceNodeId: null, writeIn: null, question: "¿Tenés licencia?" }] }
    const f = fs(a, spec).find((x) => x.subject === "Licencia B")
    expect(f?.remedy).toBe("none")
    expect(f?.question).toBeUndefined()
  })

  it("needsFigure pide la cifra en la misma tarjeta", () => {
    const a = { ...base, bullets: base.bullets.map((b) => (b.id === b0.id ? { ...b, needsFigure: true } : b)) }
    const f = fs(a).filter((x) => x.nodeId === b0.id)
    expect(f).toHaveLength(1)
    expect(f[0].needsFigure).toBe(true)
  })
})

describe("las herramientas de tus habilidades que ese trabajo usó abren su tarjeta", () => {
  it("una viñeta que el ATS mantiene pero no nombra la herramienta pasa a Tailor con ese hecho", async () => {
    const ai = new CountingAi()
    const tree = buildTree(RAW)
    ai.toolsFor = () => [{ id: tree.roles[0].bullets[0].id, tools: ["Excel"] }]
    const { acts } = await analyze(ai, new MemoryStore())
    const f = acts.find((a) => a.act === "findings")
    if (f?.act !== "findings") throw new Error("sin hallazgos")
    const card = f.findings.find((x) => x.nodeId === tree.roles[0].bullets[0].id)
    expect(card?.type).toBe("improve_bullet")
    expect(card?.facts).toEqual(["Excel"])
  })

  it("una línea que afirma un resultado sin decir cuánto pide la cifra; una que ya la dice, no", async () => {
    const ai = new CountingAi()
    const tree = buildTree({ ...RAW, workExperience: [{ ...RAW.workExperience![0], description: "• Atendí a los clientes y mejoré la satisfacción\n• Reduje las diferencias de caja un 30%" }] })
    const [sin, con] = tree.roles[0].bullets
    ai.toolsFor = () => [{ id: sin.id, tools: [], sinTamano: true }, { id: con.id, tools: [], sinTamano: true }]
    const gen = runAnalysis({ raw: { ...RAW, workExperience: [{ ...RAW.workExperience![0], description: "• Atendí a los clientes y mejoré la satisfacción\n• Reduje las diferencias de caja un 30%" }] }, jdText: "Buscamos cajera", language: "es", resumeId: "cv1", model: "m1", ai, store: new MemoryStore() })
    const acts = []
    let out = await gen.next()
    while (!out.done) { acts.push(out.value); out = await gen.next() }
    const f = acts.find((a) => a.act === "findings")
    if (f?.act !== "findings") throw new Error("sin hallazgos")
    expect(f.findings.find((x) => x.nodeId === sin.id)?.needsFigure).toBe(true)
    expect(f.findings.find((x) => x.nodeId === con.id)?.needsFigure).toBeUndefined()
  })

  it("Tailor que no escribe la herramienta: se pide una vez más y, si no la escribe, no se ofrece", async () => {
    const ai = new CountingAi()
    const tree = buildTree(RAW)
    const r = await runRewrite({ tree, nodeId: tree.roles[0].bullets[0].id, spec: SPEC, language: "es", model: "m1", jdKey: "jd", ai, store: new MemoryStore(), facts: ["Xcode Instruments"] })
    expect(ai.rewrites).toBe(2)
    expect(ai.lastNudge).toMatch(/Xcode Instruments/)
    expect(r.ok).toBe(false)
  })
})

describe("lo que Tailor ya escribió siguiendo al ATS no se vuelve a pedir", () => {
  it("la línea del registro viaja al ATS y queda en «mantener» aunque diga otra cosa", async () => {
    const store = new MemoryStore()
    const tree = buildTree(RAW)
    const escrita = tree.roles[0].bullets[1].text
    const jdKey = cacheKey.jd("Buscamos cajera con arqueo de caja y atención al cliente", "m1")
    await store.write("ats3-log", cacheKey.log("cv1", jdKey), [{ findingId: "f", nodeId: tree.roles[0].bullets[1].id, kind: "applied", after: escrita, at: 0 }])
    const ai = new CountingAi()
    const { acts } = await analyze(ai, store)
    expect(ai.alreadyFixedSeen[0]).toEqual([escrita])
    const f = acts.find((a) => a.act === "findings")
    if (f?.act !== "findings") throw new Error("sin hallazgos")
    expect(f.findings.some((x) => x.type === "improve_bullet")).toBe(false)
  })
})

describe("X-Y-Z y viñetas nuevas", () => {
  it("la línea que dice qué hizo y no qué logró pide el logro con su hueco", async () => {
    const ai = new CountingAi()
    ai.auditFor = (t) => ({ ...fakeAudit(t), bullets: fakeAudit(t).bullets.map((b) => ({ ...b, decision: "keep" as const, instruction: null })) })
    ai.toolsFor = (t) => [{ id: t.roles[0].bullets[0].id, tools: [], sinLogro: true }]
    const { acts } = await analyze(ai, new MemoryStore())
    const f = acts.find((a) => a.act === "findings")
    if (f?.act !== "findings") throw new Error("sin hallazgos")
    const t = f.findings.find((x) => x.type === "improve_bullet")
    expect(t?.needsOutcome).toBe(true)
    expect(t?.needsFigure).toBe(true)
  })

  it("una viñeta nueva se escribe al final de su puesto sin exigir conservar nada", async () => {
    const ai = new CountingAi()
    const tree = buildTree(RAW)
    const id = nuevaEn(tree.roles[0].id)
    ai.nextSuggestion = sug({ bulletId: id, text: "Controlé el inventario semanal con planillas de Excel, reduciendo faltantes en [x%]", actionVerb: "Controlé", placeholders: [{ token: "[x%]", type: "PERCENT", required: true }] as never })
    const r = await runRewrite({ tree, nodeId: id, spec: SPEC, language: "es", model: "m1", jdKey: "jd", ai, store: new MemoryStore(), terms: ["Excel"], propone: true, nueva: true, needsFigure: true })
    if (!r.ok) throw new Error(JSON.stringify(r))
    expect(r.suggestion.originalText).toBe("")
    const escrito = writeInto(tree, id, r.suggestion.text)
    expect(escrito.roles[0].bullets).toHaveLength(tree.roles[0].bullets.length + 1)
    expect(escrito.roles[0].bullets.at(-1)?.text).toBe(r.suggestion.text)
  })
})

describe("lo que filtra y no se redacta: sólo se avisa", () => {
  const conCondiciones = (conditions: AuditFacts["conditions"], extra: Partial<AuditFacts> = {}) => async () => {
    const ai = new CountingAi()
    ai.parseJob = async () => ({ ...SPEC, mustHave: [...SPEC.mustHave, { skill: "Inglés", raw: "inglés", years: null, category: null, kind: "credential" as const }] })
    ai.auditFor = (t) => ({ ...fakeAudit(t), conditions, ...extra })
    const { acts } = await analyze(ai, new MemoryStore())
    const f = acts.find((a) => a.act === "findings")
    if (f?.act !== "findings") throw new Error("sin hallazgos")
    return f.findings
  }
  it("una condición que el CV contradice o no dice abre un aviso sin botón; la que cumple, no", async () => {
    const fs = await conCondiciones([
      { text: "Residir en Brasil", met: "no", cvSays: "Cochabamba, Bolivia" },
      { text: "Permiso de trabajo en la UE", met: "unknown", cvSays: null },
      { text: "Español nativo", met: "yes", cvSays: "Español nativo" },
    ])()
    const avisos = fs.filter((x) => x.type === "eligibility")
    expect(avisos.map((x) => [x.subject, x.detail, x.remedy])).toEqual([
      ["Residir en Brasil", "no", "none"],
      ["Permiso de trabajo en la UE", "unknown", "none"],
    ])
    expect(avisos[0].gain).toBe(0)
  })
  it("la credencial que ya es condición no se repite como skill que falta", async () => {
    const fs = await conCondiciones(
      [{ text: "Inglés fluido obligatorio", met: "no", cvSays: "Inglés B2" }],
      { hard: [{ skill: "Inglés", requirement: "MUST", status: "missing", evidenceNodeId: null, writeIn: null, question: null }] },
    )()
    expect(fs.filter((x) => x.type === "eligibility")).toHaveLength(1)
    expect(fs.some((x) => x.type === "missing_skill" && x.subject === "Inglés")).toBe(false)
  })
})

describe("ninguna skill suelta y ninguna que vuelva", () => {
  const listada = (t: ResumeTree) => ({ ...fakeAudit(t), hard: fakeAudit(t).hard.map((h) => (h.skill === "Arqueo de caja" ? { ...h, status: "listed" as const, evidenceNodeId: null } : h)) })
  const tarjetas = async (store: MemoryStore) => {
    const ai = new CountingAi()
    ai.auditFor = listada
    const { acts } = await analyze(ai, store)
    const f = acts.find((a) => a.act === "findings")
    if (f?.act !== "findings") throw new Error("sin hallazgos")
    return f.findings.filter((x) => x.type === "missing_skill" && x.subject === "Arqueo de caja")
  }

  it("la skill sólo nombrada tiene su tarjeta, y promete lo que le falta para quedar probada", async () => {
    const [t] = await tarjetas(new MemoryStore())
    expect(t?.remedy).toBe("ask")
    expect(t?.detail).toBe("listed")
  })

  it("si Tailor ya la escribió en una línea confirmada, esa línea es su prueba: no se vuelve a pedir", async () => {
    const store = new MemoryStore()
    const tree = buildTree(RAW)
    const jdKey = cacheKey.jd("Buscamos cajera con arqueo de caja y atención al cliente", "m1")
    await store.write("ats3-log", cacheKey.log("cv1", jdKey), [{ findingId: "f", nodeId: tree.roles[0].bullets[1].id, kind: "applied", after: tree.roles[0].bullets[1].text, at: 0 }])
    expect(await tarjetas(store)).toHaveLength(0)
  })
})

describe("sacar «por repetida» lo comprueba el código", () => {
  const raw: RawResume = { ...RAW, workExperience: [{ ...RAW.workExperience![0], description: [
    "• Resolved critical bugs to improve app stability, contributing to a 20% reduction in crash rates",
    "• Improved app stability and reduced crash rates through thorough debugging",
    "• Refactored the lunch box module on the main screen",
    "• Built the offline cache for the orders screen",
    "• Migrated the payment flow to SwiftUI",
  ].join("\n") }] }
  const run = async (reasons: string[]) => {
    const ai = new CountingAi()
    ai.auditFor = (t) => ({ ...fakeAudit(t), bullets: t.roles[0].bullets.map((b, i) => ({ id: b.id, decision: reasons[i] ? ("remove" as const) : ("keep" as const), reason: reasons[i] ?? "", instruction: null, needsFigure: false })) })
    const gen = runAnalysis({ raw, jdText: "Buscamos iOS", language: "en", resumeId: "cv1", model: "m1", ai, store: new MemoryStore() })
    let out = await gen.next()
    const acts = []
    while (!out.done) { acts.push(out.value); out = await gen.next() }
    const sc = acts.find((a) => a.act === "score")
    if (sc?.act !== "score") throw new Error("sin puntaje")
    return sc.audit.bullets.map((b) => b.decision)
  }

  it("no se saca la línea con cifra para dejar una sin cifra: se va la citada", async () => {
    const d = await run(["Overlaps with «Improved app stability and reduced crash rates through thorough debugging»."])
    expect(d[0]).not.toBe("remove")
    expect(d[1]).toBe("remove")
  })

  it("una línea que se cita a sí misma no se saca", async () => {
    const d = await run([undefined as unknown as string, undefined as unknown as string, "Adds less than «Refactored the lunch box module on the main screen»."])
    expect(d[2]).not.toBe("remove")
  })

  it("repetida de verdad, citando otra línea que también la prueba: se saca", async () => {
    const d = await run([undefined as unknown as string, "Repeats «Resolved critical bugs to improve app stability, contributing»."])
    expect(d[1]).toBe("remove")
  })
})

describe("el rango de viñetas por puesto lo garantiza el código", () => {
  it("«no sirve a este puesto» no saca: sólo lo repetido o lo que pasa del máximo", async () => {
    const lineas = ["Programé una web en Angular con 15% más de velocidad", "Hice el arqueo de caja al cierre", "Di atención al cliente en el mostrador", "Ordené la góndola", "Repuse mercadería"]
    const raw: RawResume = { ...RAW, workExperience: [{ ...RAW.workExperience![0], description: lineas.map((l) => `• ${l}`).join("\n") }] }
    const ai = new CountingAi()
    ai.auditFor = (t) => ({ ...fakeAudit(t), bullets: t.roles[0].bullets.map((b) => ({ id: b.id, decision: "remove" as const, reason: "no sirve", instruction: null, needsFigure: false })) })
    const gen = runAnalysis({ raw, jdText: "Buscamos cajera con arqueo de caja y atención al cliente", language: "es", resumeId: "cv1", model: "m1", ai, store: new MemoryStore() })
    const acts = []
    let out = await gen.next()
    while (!out.done) { acts.push(out.value); out = await gen.next() }
    const sc = acts.find((a) => a.act === "score")
    if (sc?.act !== "score") throw new Error("sin puntaje")
    const tree = sc.tree
    const quedan = sc.audit.bullets.filter((b) => b.decision !== "remove").map((b) => tree.roles[0].bullets.find((x) => x.id === b.id)!.text)
    expect(quedan).toHaveLength(lineas.length)
  })

  it("sacando repetidas, el puesto no baja del mínimo: vuelve primero lo que prueba el puesto", async () => {
    const lineas = ["Programé una web en Angular con 15% más de velocidad", "Hice el arqueo de caja al cierre", "Di atención al cliente en el mostrador", "Ordené la góndola", "Repuse mercadería"]
    const raw: RawResume = { ...RAW, workExperience: [{ ...RAW.workExperience![0], description: lineas.map((l) => `• ${l}`).join("\n") }] }
    const ai = new CountingAi()
    ai.auditFor = (t) => ({
      ...fakeAudit(t),
      bullets: t.roles[0].bullets.map((b, i) => ({ id: b.id, decision: "remove" as const, reason: `Repite a «${lineas[(i + 1) % lineas.length]}».`, instruction: null, needsFigure: false })),
    })
    const gen = runAnalysis({ raw, jdText: "Buscamos cajera con arqueo de caja y atención al cliente", language: "es", resumeId: "cv1", model: "m1", ai, store: new MemoryStore() })
    const acts = []
    let out = await gen.next()
    while (!out.done) { acts.push(out.value); out = await gen.next() }
    const sc = acts.find((a) => a.act === "score")
    if (sc?.act !== "score") throw new Error("sin puntaje")
    const quedan = sc.audit.bullets.filter((b) => b.decision !== "remove").map((b) => sc.tree.roles[0].bullets.find((x) => x.id === b.id)!.text)
    expect(quedan).toHaveLength(BULLETS_PER_ROLE_MIN)
    expect(quedan).toContain("Hice el arqueo de caja al cierre")
    expect(quedan).toContain("Di atención al cliente en el mostrador")
  })
})

describe("lo que el ATS ya decidió conservar no se vuelve a discutir", () => {
  it("un segundo análisis no saca una viñeta que el primero conservó y no cambió", async () => {
    const lineas = ["Atendí la caja del turno", "Hice el arqueo de caja al cierre", "Di atención al cliente", "Ordené la góndola", "Repuse mercadería"]
    const raw: RawResume = { ...RAW, workExperience: [{ ...RAW.workExperience![0], description: lineas.map((l) => `• ${l}`).join("\n") }] }
    const store = new MemoryStore()
    const correr = async (sacar: number[], resumen: string) => {
      const ai = new CountingAi()
      ai.auditFor = (t) => ({ ...fakeAudit(t), bullets: t.roles[0].bullets.map((b, i) => ({ id: b.id, decision: sacar.includes(i) ? ("remove" as const) : ("keep" as const), reason: "", instruction: null, needsFigure: false })) })
      const gen = runAnalysis({ raw: { ...raw, summary: resumen }, jdText: "Buscamos cajera", language: "es", resumeId: "cv1", model: "m1", ai, store })
      const acts = []
      let out = await gen.next()
      while (!out.done) { acts.push(out.value); out = await gen.next() }
      const sc = acts.find((a) => a.act === "score")
      if (sc?.act !== "score") throw new Error("sin puntaje")
      return sc.audit.bullets.map((b) => b.decision)
    }
    await correr([], "Cajera")
    // El resumen cambió, así que el diagnóstico se vuelve a pedir; las viñetas no. Ahora quiere sacar la 4.ª.
    const segunda = await correr([3], "Cajera con experiencia en sucursal")
    expect(segunda[3]).not.toBe("remove")
  })
})

describe("una línea que Tailor ya cerró no recibe más encargos", () => {
  it("la skill que el ATS mandaba escribir ahí pasa a pregunta", async () => {
    const store = new MemoryStore()
    const tree = buildTree(RAW)
    const escrita = tree.roles[0].bullets[1].text
    const jdKey = cacheKey.jd("Buscamos cajera con arqueo de caja y atención al cliente", "m1")
    await store.write("ats3-log", cacheKey.log("cv1", jdKey), [{ findingId: "f", nodeId: tree.roles[0].bullets[1].id, kind: "applied", after: escrita, at: 0 }])
    const ai = new CountingAi()
    ai.auditFor = (t) => ({ ...fakeAudit(t), hard: [...fakeAudit(t).hard, { skill: "Arqueo de caja diario", requirement: "MUST", status: "missing", evidenceNodeId: null, writeIn: t.roles[0].bullets[1].id, question: null }] })
    const { acts } = await analyze(ai, store)
    const f = acts.find((a) => a.act === "findings")
    if (f?.act !== "findings") throw new Error("sin hallazgos")
    expect(f.findings.some((x) => x.nodeId === tree.roles[0].bullets[1].id)).toBe(false)
    expect(f.findings.find((x) => x.subject === "Arqueo de caja diario")?.remedy).toBe("ask")
  })
})

describe("el rango de viñetas por puesto lo valida el código", () => {
  const siete: RawResume = {
    ...RAW,
    workExperience: [{ ...RAW.workExperience![0], description: Array.from({ length: 8 }, (_, i) => `• Atendí la caja número ${i + 1} del turno`).join("\n") }],
  }
  const run = async (ai: CountingAi) => {
    const gen = runAnalysis({ raw: siete, jdText: "Buscamos cajera", language: "es", resumeId: "cv1", model: "m1", ai, store: new MemoryStore() })
    let out = await gen.next()
    while (!out.done) out = await gen.next()
    return out.value
  }
  const todasKeep = (tree: ResumeTree, quitar: number): AuditFacts => ({
    ...fakeAudit(tree),
    bullets: tree.roles[0].bullets.map((b, i) => ({ id: b.id, decision: i < quitar ? ("remove" as const) : ("keep" as const), reason: "", instruction: null, needsFigure: false })),
  })

  it("más del tope: se pide UNA vez más nombrando el puesto", async () => {
    const ai = new CountingAi()
    ai.auditFor = (tree, nudge) => todasKeep(tree, nudge ? 2 : 0)
    const t = await run(ai)
    expect(ai.audits).toBe(2)
    expect(t.calls).toBe(4)
  })

  it("dentro del rango no se pide nada más", async () => {
    const ai = new CountingAi()
    ai.auditFor = (tree) => todasKeep(tree, 2)
    await run(ai)
    expect(ai.audits).toBe(1)
  })
})

// ── la reescritura ───────────────────────────────────────────────────────────

describe("la reescritura y su reintento", () => {
  const tree = buildTree(RAW)
  const target = tree.roles[0].bullets[0]
  const req = (ai: CountingAi, store: AtsStore = new MemoryStore(), over: Record<string, unknown> = {}) =>
    runRewrite({ tree, nodeId: target.id, spec: SPEC, language: "es", model: "m1", jdKey: "jd", ai, store, ...over })

  it("una reescritura sana se entrega y se guarda", async () => {
    const r = await req(new CountingAi())
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.suggestion.originalText).toBe(target.text)
  })

  it("la segunda vez se sirve del caché: cero llamadas", async () => {
    const ai = new CountingAi()
    const store = new MemoryStore()
    await req(ai, store)
    const antes = ai.rewrites
    const second = await req(ai, store)
    expect(second.ok).toBe(true)
    if (second.ok) expect(second.served).toBe(true)
    expect(ai.rewrites).toBe(antes)
  })

  it("lo que el ATS decidió viaja a Tailor tal cual", async () => {
    const ai = new CountingAi()
    let visto: RewriteInput | null = null
    ai.rewriteBullet = async (input) => {
      visto = input
      ai.rewrites++
      return sug({ text: "Atendí a los clientes en la línea de cajas resolviendo consultas y cobros con POS" })
    }
    await req(ai, new MemoryStore(), { reason: "r", instruction: "i", terms: ["POS"], needsFigure: false, told: "t" })
    expect(visto).toMatchObject({ reason: "r", instruction: "i", terms: ["POS"], told: "t" })
  })

  it("una skill que el ATS mandó escribir y falta: se pide una vez más nombrándola", async () => {
    const ai = new CountingAi()
    await req(ai, new MemoryStore(), { terms: ["Excel avanzado"] })
    expect(ai.rewrites).toBe(2)
    expect(ai.lastNudge).toMatch(/Excel avanzado/)
  })

  it("casi igual a OTRA viñeta: se pide una vez más y, si insiste, no se ofrece", async () => {
    const ai = new CountingAi()
    ai.nextSuggestion = sug({ text: "Realicé el arqueo de caja al cierre" })
    const r = await req(ai)
    expect(ai.rewrites).toBe(2)
    expect(ai.lastNudge ?? "").toMatch(/casi lo mismo/)
    expect(r.ok).toBe(false)
  })

  it("si el modelo devuelve la MISMA línea, contesta «ya está bien»", async () => {
    const ai = new CountingAi()
    ai.nextSuggestion = sug({ text: target.text })
    const r = await req(ai)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.alreadyGood).toBe(true)
  })

  it("changed:false es declinar, sin reintento", async () => {
    const ai = new CountingAi()
    ai.nextSuggestion = sug({ changed: false, text: "" })
    const r = await req(ai)
    expect(ai.rewrites).toBe(1)
    expect(r.ok).toBe(false)
  })

  it("nunca reintenta dos veces: eso escondería un prompt que dejó de funcionar", async () => {
    const ai = new CountingAi()
    ai.nextSuggestion = sug({ text: "Realicé el arqueo de caja al cierre" })
    await req(ai)
    expect(ai.rewrites).toBe(2)
  })
})

describe("aplicar mide, no promete", () => {
  const anchored = (over: Partial<AnchoredSuggestion>): AnchoredSuggestion => ({
    bulletId: "x", changed: true, text: "t", actionVerb: "Hice", keywordsUsed: [], claim: "",
    metricType: null, placeholders: [], variantWithoutMetric: null, measurableAspect: null,
    basedOnHash: "h", originalText: "o", ...over,
  })

  it("una sugerencia pensada sobre una versión vieja NO pisa la edición del usuario", () => {
    const tree = buildTree(RAW)
    const target = tree.roles[0].bullets[0]
    const edited = writeInto(tree, target.id, "Lo escribí yo a mano después")

    const r = applySuggestion(
      edited,
      anchored({ bulletId: target.id, basedOnHash: target.hash, text: "Propuesta vieja del modelo" }),
      SPEC, fakeAudit(), CHECKS,
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
      SPEC, fakeAudit(), CHECKS,
    )
    expect(tree.roles[0].bullets[0].text).toBe(before)
  })

  it("aceptar deja el nodo marcado como escrito por el motor", () => {
    const tree = buildTree(RAW)
    const target = tree.roles[0].bullets[0]
    const r = applySuggestion(
      tree,
      anchored({ bulletId: target.id, basedOnHash: target.hash, text: "Atendí a los clientes con cobro y consultas" }),
      SPEC, fakeAudit(), CHECKS,
    )
    expect(r.tree.roles[0].bullets[0].origin).toBe("AI_ACCEPTED")
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
      SPEC, audit, CHECKS,
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

const specSkills = {
  language: "es", roleTitleRaw: "iOS", seniority: null, metricThatMatters: null,
  mustHave: [{ skill: "Swift", raw: "Swift", years: null, category: null },
             { skill: "Combine", raw: "Combine", years: null, category: null }],
  niceToHave: [{ skill: "TestFlight", raw: "TestFlight", years: null, category: null }],
  responsibilities: [], softSignals: [],
} as unknown as JobSpec

const auditSkills: AuditFacts = {
  bullets: [], summary: { identity: true, proof: true, fit: true, extra: true },
  hard: [{ skill: "Combine", requirement: "MUST", status: "demonstrated", evidenceNodeId: "b1", writeIn: null, question: null }],
  soft: [],
}

describe("las habilidades que entran a la plantilla", () => {
  /**
   * ── LO QUE ESTO CIERRA (CEO, 2026-09-09) ──────────────────────────────────
   * «Según la postulación, que las skills se reemplacen por las necesarias; la
   * plantilla recibe hasta veinte.» Antes lo contestaban dos cosas a medias: un
   * hallazgo por término suelto que podía llevar la lista a cien, y dos
   * plantillas que cortaban en doce por su cuenta sin mirar la vacante.
   */
  it("con 100 habilidades se VEN 20, las del aviso primero, y no se borra ninguna", () => {
    // Medido en producción el 2026-09-24: el plan devolvía «las que salen» y la
    // pantalla escribía la lista sin ellas — 34 habilidades borradas del CV.
    // Las plantillas ya cortan en veinte respetando el orden: el plan ORDENA.
    const cien = Array.from({ length: 100 }, (_, i) => `Skill ${i + 1}`)
    const p = skillPlan(cien, specSkills, auditSkills)
    expect(p.final[0]).toBe("Combine")
    expect(p.final).not.toContain("Swift")
    for (const s of cien) expect(p.final).toContain(s)
    expect(p.final).toHaveLength(cien.length + p.add.length)
    // Lo que pasa a verse desplaza exactamente lo mismo que deja de verse.
    expect(p.entering).toContain("Combine")
    expect(p.leaving).toHaveLength(p.entering.length)
  })

  it("una habilidad que el aviso pide NUNCA queda fuera de las que se ven", () => {
    const p = skillPlan(["Swift", ...Array.from({ length: 40 }, (_, i) => `X${i}`)], specSkills, auditSkills)
    const seVen = p.final.slice(0, SKILLS_MAX)
    expect(seVen).toContain("Swift")
    expect(seVen).toContain("Combine")
    expect(p.leaving).not.toContain("Swift")
  })

  it("con pocas habilidades no deja de verse ninguna, y respeta TU orden", () => {
    const p = skillPlan(["Excel", "Swift", "Word"], specSkills, auditSkills)
    expect(p.leaving).toHaveLength(0)
    expect(p.final.filter((s) => !["Swift", "Combine"].includes(s))).toEqual(["Excel", "Word"])
  })

  it("una skill que el CV no sostiene nunca se agrega", () => {
    const a: AuditFacts = { ...auditSkills, hard: [{ skill: "SAP", requirement: "MUST", status: "missing", evidenceNodeId: null, writeIn: null, question: null }] }
    const spec = { ...specSkills, mustHave: [{ skill: "SAP", raw: "SAP", years: null, category: null }], niceToHave: [] } as unknown as JobSpec
    expect(skillPlan(["Excel"], spec, a).add).toHaveLength(0)
  })
})

describe("el orden de los puestos se lee como fechas, no como texto", () => {
  it("«01/2025», «06/2024», «2023» y un puesto sin fecha están en orden", () => {
    // Formatos medidos en un CV real de la base local (2026-09-24).
    const cv = buildTree({
      workExperience: ["", "01/2025", "06/2024", "2023", "2021", "2015"].map((d, i) => ({
        jobTitle: `P${i}`, employer: `E${i}`, startDate: d, endDate: "", description: "• Hice algo",
      })),
    })
    expect(readableChecks(cv).orden_cronologico).toBe(true)
    const alReves = buildTree({
      workExperience: ["2015", "06/2024"].map((d, i) => ({ jobTitle: `P${i}`, employer: `E${i}`, startDate: d, endDate: "", description: "• Hice algo" })),
    })
    expect(readableChecks(alReves).orden_cronologico).toBe(false)
  })
})
describe("lo esencial de un ATS, medido por el código", () => {
  const cv = (roles: { desde: string; hasta: string; lineas?: string[] }[], contacto?: { email: string; phone: string }) =>
    buildTree({
      summary: "Cajera con experiencia",
      workExperience: roles.map((r, i) => ({
        jobTitle: `Puesto ${i}`, employer: `E${i}`, startDate: r.desde, endDate: r.hasta,
        description: (r.lineas ?? ["Atendí la caja del turno"]).map((l) => `• ${l}`).join("\n"),
      })),
      skills: [],
      ...(contacto ? { contact: contacto } : {}),
    })

  it("los años no cuentan dos veces lo que se superpone, y un año solo se lee entero", () => {
    // 2015–2016 (24 meses) y 2016-06 → 2018-05 (se pisan 7 meses): 24 + 17 = 41.
    const t = cv([{ desde: "2015", hasta: "2016" }, { desde: "2016-06", hasta: "2018-05" }])
    expect(experienceYears(t)).toBeCloseTo(41 / 12, 5)
  })

  it("faltan años: suma menos y la tarjeta lo dice, sin botón de IA", () => {
    const t = cv([{ desde: "2021-01", hasta: "2023-12" }])
    const spec = { ...SPEC, yearsRequired: 5 }
    const score = scoreResume(t, spec, fakeAudit(), {})
    const anios = score.components.find((c) => c.key === "years")!
    expect(anios.ratio).toBeCloseTo(3 / 5, 5)
    const f = findingsOf(t, fakeAudit(t), score, spec).find((x) => x.type === "years_short")
    expect(f?.remedy).toBe("none")
    expect(f?.detail).toBe("3/5")
    // Sin años en el aviso no aplica: no suma ni castiga.
    expect(scoreResume(t, SPEC, fakeAudit(), {}).components.find((c) => c.key === "years")!.denominator).toBe(0)
  })

  it("el contacto se lee: sin email reconocible falla; sin el dato, no se castiga", () => {
    const roles = [{ desde: "2021-01", hasta: "2023-12" }]
    expect(readableChecks(cv(roles, { email: "ana@correo.com", phone: "+591 7694 4986" })).contacto_email).toBe(true)
    expect(readableChecks(cv(roles, { email: "ana arroba correo", phone: "12" })).contacto_email).toBe(false)
    expect(readableChecks(cv(roles, { email: "ana@correo.com", phone: "12" })).contacto_telefono).toBe(false)
    expect(readableChecks(cv(roles)).contacto_email).toBeNull()
  })
})
