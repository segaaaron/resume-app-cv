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
    hard: [
      { skill: "Arqueo de caja", requirement: "MUST", status: "demonstrated", evidenceNodeId: tree.roles[0]?.bullets[1]?.id ?? null, writeIn: null, question: null },
      { skill: "Atención al cliente", requirement: "MUST", status: "demonstrated", evidenceNodeId: tree.roles[0]?.bullets[0]?.id ?? null, writeIn: null, question: null },
      { skill: "Inventario", requirement: "NICE", status: "missing", evidenceNodeId: null, writeIn: null, question: "¿Llevaste inventario?" },
    ],
    soft: [],
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
  auditFor: ((tree: ResumeTree) => AuditFacts) | null = null

  async parseJob() {
    this.jd++
    return SPEC
  }
  async audit(tree: ResumeTree) {
    this.audits++
    return this.auditFor ? this.auditFor(tree) : fakeAudit(tree)
  }
  async rewriteBullet(input: RewriteInput) {
    this.rewrites++
    this.lastNudge = input.nudge
    this.nudges.push(input.nudge)
    return this.nextSuggestion ?? sug()
  }
  async rewriteSummary(_input?: unknown) {
    void _input
    this.rewrites++
    return sug({ bulletId: "summary", text: "Cajera con experiencia en atención al cliente y arqueo de caja en sucursal", actionVerb: "" })
  }
}

const CHECKS: ParseChecks = { contacto: true, unaColumna: true, fechas: true, imagenes: null }

async function analyze(ai: AtsAi, store: AtsStore, raw: RawResume = RAW) {
  const gen = runAnalysis({
    raw,
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
  it("primera corrida: la vacante y la auditoría", async () => {
    const ai = new CountingAi()
    const { telemetry } = await analyze(ai, new MemoryStore())
    expect(telemetry.calls).toBe(2)
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
  it("la vacante llega primero —abre el stream— y el puntaje después", async () => {
    const { acts } = await analyze(new CountingAi(), new MemoryStore())
    expect(acts.map((a) => a.act)).toEqual(["job", "score", "findings"])
  })

  it("cada decisión del ATS es UNA tarjeta, con lo que Tailor recibe", async () => {
    const { acts } = await analyze(new CountingAi(), new MemoryStore())
    const f = acts.find((a) => a.act === "findings")
    if (f?.act !== "findings") throw new Error("sin hallazgos")
    const tree = buildTree(RAW)
    // Ninguna viñeta tiene tarjeta propia: sólo lo que mira un filtro.
    expect(f.findings.some((x) => tree.roles[0].bullets.some((b) => b.id === x.nodeId))).toBe(false)
    // Lo deseable que falta no tiene tarjeta: va en la tabla de términos.
    expect(f.findings.some((x) => x.subject === "Inventario")).toBe(false)
  })
})

describe("findingsOf traduce la decisión del ATS, no la juzga", () => {
  const tree = buildTree(RAW)
  const [b0, b1] = tree.roles[0].bullets
  const base = fakeAudit(tree)
  const fs = (audit: AuditFacts, spec: JobSpec = SPEC) => findingsOf(tree, audit, scoreResume(tree, spec, audit, CHECKS), spec)

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

})

describe("las herramientas de tus habilidades que ese trabajo usó abren su tarjeta", () => {
  it("el resumen no suelta un requisito del aviso que ya decía: se pide una vez más y, si igual lo suelta, no se ofrece", async () => {
    // Medido en producción: la reescritura del cargo borró Claude Code, que el aviso exige. Acá, atención al cliente.
    const ai = new CountingAi()
    ai.rewriteSummary = async () => { ai.rewrites++; return sug({ bulletId: "summary", text: "Cajera con experiencia en sucursales de barrio y trato amable con cada persona", actionVerb: "" }) }
    const tree = buildTree({ ...RAW, summary: "Cajera con experiencia en atención al cliente en Supermercado Sur" })
    const r = await runRewrite({ tree, nodeId: tree.summary.id, spec: SPEC, language: "es", model: "m1", jdKey: "jd", ai, store: new MemoryStore() })
    expect(ai.rewrites).toBe(2)
    expect(r.ok).toBe(false)
  })

})

describe("X-Y-Z y viñetas nuevas", () => {
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
  it("una credencial que el ATS da por tenida no se vuelve «falta» porque el CV la escribe con otras palabras", async () => {
    const ai = new CountingAi()
    ai.parseJob = async () => ({ ...SPEC, mustHave: [...SPEC.mustHave, { skill: "Bachelor's degree", raw: "Bachelor's in computer science or related", years: null, category: null, kind: "credential" as const }] })
    ai.auditFor = (t) => ({ ...fakeAudit(t), hard: [...fakeAudit(t).hard, { skill: "Bachelor's degree", requirement: "MUST" as const, status: "listed" as const, evidenceNodeId: null, writeIn: null, question: null }] })
    const raw = { ...RAW, otherText: "Systems engineer Catolica University" }
    const gen = runAnalysis({ raw, jdText: "Buscamos iOS", language: "en", resumeId: "cv1", model: "m1", ai, store: new MemoryStore() })
    const acts = []
    for (let out = await gen.next(); !out.done; out = await gen.next()) acts.push(out.value)
    const f = acts.find((a) => a.act === "findings")
    if (f?.act !== "findings") throw new Error("sin hallazgos")
    expect(f.findings.some((x) => x.type === "missing_skill" && x.subject === "Bachelor's degree")).toBe(false)
  })

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
  it("un nivel de idioma que el CV cumple no se avisa aunque el modelo diga que no (B2 cumple A1)", async () => {
    const fs = await conCondiciones([
      { text: "Inglés: A1", met: "no", cvSays: "Inglés B2" },
      { text: "Inglés C1", met: "no", cvSays: "Inglés B1" },
    ])()
    expect(fs.filter((x) => x.type === "eligibility").map((x) => x.subject)).toEqual(["Inglés C1"])
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
  const listada = (t: ResumeTree) => ({ ...fakeAudit(t), hard: fakeAudit(t).hard.map((h) => (h.skill === "Arqueo de caja" ? { ...h, status: "listed" as const, evidenceNodeId: null, writeIn: t.roles[0].bullets[1]?.id ?? null } : h)) })
  // La skill vive sólo en Habilidades: ninguna viñeta la escribe.
  const SOLO_LISTA: RawResume = {
    ...RAW,
    workExperience: [{ ...RAW.workExperience![0], description: "• Atendí a los clientes en la línea de cajas\n• Cuadré el efectivo y los comprobantes al cierre" }],
    skills: [{ name: "Excel" }, { name: "Arqueo de caja" }],
  }
  const tarjetas = async (store: MemoryStore, raw: RawResume = SOLO_LISTA) => {
    const ai = new CountingAi()
    ai.auditFor = listada
    const { acts } = await analyze(ai, store, raw)
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
    expect(await tarjetas(store, RAW)).toHaveLength(0)
  })

  it("una viñeta que escribe la skill con su nombre la prueba, aunque el modelo diga «sólo en la lista»", async () => {
    // Medido en producción: «TypeScript — sólo en la lista» con «…with Angular and TypeScript» en el CV.
    expect(await tarjetas(new MemoryStore(), RAW)).toHaveLength(0)
  })
})

describe("una línea que no cambió conserva su juicio entre análisis (medido en producción, 2026-10-02)", () => {
  it("el modelo cambia de opinión sobre lo que nadie tocó: manda el juicio anterior", async () => {
    const store = new MemoryStore()
    const correr = async (resumen: string, cambiaDeOpinion: boolean) => {
      const ai = new CountingAi()
      ai.auditFor = (t) => {
        const base = fakeAudit(t)
        if (!cambiaDeOpinion) return base
        // Segunda lectura: la skill demostrada pasa a faltante.
        return {
          ...base,
          hard: base.hard.map((h) => (h.skill === "Atención al cliente" ? { ...h, status: "missing" as const, evidenceNodeId: null } : h)),
        }
      }
      const gen = runAnalysis({ raw: { ...RAW, summary: resumen }, jdText: "Buscamos cajera con arqueo de caja y atención al cliente", language: "es", resumeId: "cv1", model: "m1", ai, store })
      const acts = []
      let out = await gen.next()
      while (!out.done) { acts.push(out.value); out = await gen.next() }
      const sc = acts.find((a) => a.act === "score")
      if (sc?.act !== "score") throw new Error("sin puntaje")
      return sc
    }
    const primera = await correr("Cajera", false)
    // El resumen cambió: la auditoría se vuelve a pedir. Las viñetas no cambiaron.
    const segunda = await correr("Cajera de sucursal", true)
    expect(primera.audit.hard.find((h) => h.skill === "Atención al cliente")?.status).toBe("demonstrated")
    expect(segunda.audit.hard.find((h) => h.skill === "Atención al cliente")?.status).toBe("demonstrated")
  })
})

describe("lo que el ATS cita con las palabras del CV cuenta, aunque no sea la palabra del aviso (2026-10-02)", () => {
  const correr = async (cvWording: string) => {
    const ai = new CountingAi()
    ai.auditFor = (t) => ({
      ...fakeAudit(t),
      hard: [...fakeAudit(t).hard, { skill: "Servicio al público", requirement: "NICE", status: "demonstrated", evidenceNodeId: t.roles[0].bullets[0].id, writeIn: null, question: null, cvWording }],
    })
    const { acts } = await analyze(ai, new MemoryStore())
    const sc = acts.find((a) => a.act === "score")
    if (sc?.act !== "score") throw new Error("sin puntaje")
    return sc.audit.hard.find((h) => h.skill === "Servicio al público")?.status
  }

  it("la cita está en la línea de la prueba: se respeta («Mobile» ↔ «aplicaciones móviles»)", async () => {
    expect(await correr("Atendí a los clientes")).toBe("demonstrated")
  })

  it("la cita no está en la línea: el código la baja a faltante", async () => {
    expect(await correr("atendí al público en ventanilla")).toBe("missing")
  })
  it("«sólo en la lista» exige el nombre entero o una cita: palabras sueltas no alcanzan (Clean Code ≠ Clean Architecture + código)", async () => {
    const lista = async (cvWording: string | null) => {
      const ai = new CountingAi()
      ai.auditFor = (t) => ({ ...fakeAudit(t), hard: [...fakeAudit(t).hard, { skill: "Excel avanzado", requirement: "NICE", status: "listed", evidenceNodeId: null, writeIn: null, question: null, cvWording }] })
      const { acts } = await analyze(ai, new MemoryStore(), { ...RAW, skills: [{ name: "Excel" }, { name: "Inglés avanzado" }] })
      const sc = acts.find((a) => a.act === "score")
      if (sc?.act !== "score") throw new Error("sin puntaje")
      return sc.audit.hard.find((h) => h.skill === "Excel avanzado")?.status
    }
    expect(await lista(null)).toBe("missing")
    expect(await lista("Excel")).toBe("listed")
  })
})

describe("una línea que Tailor ya cerró no recibe más encargos", () => {
  it("la línea que Tailor ya escribió no recibe otra skill", async () => {
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
    // No se pierde: encaja con ese puesto, así que va en una viñeta nueva de él.
    expect(f.findings.find((x) => x.subject === "Arqueo de caja diario")?.nodeId).toBe(`nuevo:${tree.roles[0].id}`)
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
    await req(ai, new MemoryStore(), { reason: "r", terms: ["POS"], needsFigure: false, told: "t" })
    expect(visto).toMatchObject({ reason: "r", terms: ["POS"], told: "t" })
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

  describe("lo que una línea no puede traer de otro puesto (medido en producción, 2026-10-02)", () => {
    const DOS: RawResume = {
      ...RAW,
      workExperience: [
        { jobTitle: "Cajera", employer: "Supermercado Sur", startDate: "2022-01", endDate: "2024-06", description: "• Atendí a los clientes en la línea de cajas\n• Realicé el arqueo de caja al cierre" },
        { jobTitle: "Vendedora", employer: "Tienda Norte", startDate: "2019-01", endDate: "2021-12", description: "• Atendí a 50 clientes por día en el mostrador" },
      ],
    }
    const t2 = buildTree(DOS)
    const linea = t2.roles[0].bullets[0]
    const pedir = (ai: CountingAi, over: Record<string, unknown> = {}) =>
      runRewrite({ tree: t2, nodeId: linea.id, spec: SPEC, language: "es", model: "m1", jdKey: "jd", ai, store: new MemoryStore(), ...over })

    it("nombrar la empresa de otro puesto: se pide una vez más y, si insiste, no se ofrece", async () => {
      const ai = new CountingAi()
      ai.nextSuggestion = sug({ text: "Atendí a los clientes en la línea de cajas y en Tienda Norte resolví cobros" })
      const r = await pedir(ai)
      expect(ai.lastNudge ?? "").toMatch(/Tienda Norte/)
      expect(r.ok).toBe(false)
    })

    it("una cifra que la persona no dio para esta línea: se pide una vez más y, si insiste, no se ofrece", async () => {
      const ai = new CountingAi()
      ai.nextSuggestion = sug({ text: "Atendí a los clientes en la línea de cajas, para 50 usuarios por turno" })
      const r = await pedir(ai)
      expect(ai.lastNudge ?? "").toMatch(/50/)
      expect(r.ok).toBe(false)
    })

    it("la cifra que contó la persona sí entra", async () => {
      const ai = new CountingAi()
      ai.nextSuggestion = sug({ text: "Atendí a 80 clientes por turno en la línea de cajas resolviendo cobros" })
      const r = await pedir(ai, { told: "unos 80 clientes por turno" })
      expect(r.ok).toBe(true)
    })

    it("la misma palabra nueva dos veces en la línea no se ofrece", async () => {
      const ai = new CountingAi()
      // Con «Proponer con IA», que admite hasta 16 palabras nuevas: así llegó en producción.
      ai.nextSuggestion = sug({ text: "Atendí a los clientes en la línea de cajas con procesos escalables para que el servicio escale" })
      const r = await pedir(ai, { propone: true })
      expect(r.ok).toBe(false)
    })
  })

  it("la barra de un requisito con alternativas nunca entra al CV, y al resumen le llega la alternativa que el CV escribe", async () => {
    const ai = new CountingAi()
    let visto: { provenTerms?: string[] } = {}
    ai.rewriteSummary = async (input?: unknown) => {
      visto = input as { provenTerms?: string[] }
      ai.rewrites++
      return sug({ bulletId: "summary", text: "Cajera con 3 años en atención al cliente y arqueo de caja | conteo de efectivo en sucursal.", actionVerb: "" })
    }
    const spec: JobSpec = { ...SPEC, mustHave: [...SPEC.mustHave, { skill: "Excel | Google Sheets", raw: "Excel o Google Sheets", years: null, category: null }] }
    const r = await runRewrite({ tree, nodeId: tree.summary.id, spec, language: "es", model: "m1", jdKey: "jd", ai, store: new MemoryStore() })
    if (r.ok) expect(r.suggestion.text).not.toMatch(/\|/)
    expect(visto.provenTerms ?? []).not.toContain("Excel | Google Sheets")
    expect(visto.provenTerms ?? []).toContain("Excel")
  })

  it("lo que el resumen ya probaba del aviso le llega como término a conservar, en la forma en que lo escribe", async () => {
    const ai = new CountingAi()
    let visto: { mustWrite?: string[] } = {}
    ai.rewriteSummary = async (input?: unknown) => {
      visto = input as { mustWrite?: string[] }
      ai.rewrites++
      return sug({ bulletId: "summary", text: "Cajera con experiencia en atención al cliente y arqueo de caja en sucursal.", actionVerb: "" })
    }
    const spec: JobSpec = { ...SPEC, mustHave: [{ skill: "Servicio | Atención al cliente", raw: "servicio o atención al cliente", years: null, category: null }] }
    await runRewrite({ tree, nodeId: tree.summary.id, spec, language: "es", model: "m1", jdKey: "jd", ai, store: new MemoryStore() })
    expect(visto.mustWrite ?? []).toContain("Atención al cliente")
  })

  it("un resumen en inglés en tercera persona («Holds a…») se pide una vez más diciéndolo", async () => {
    const ai = new CountingAi()
    const nudges: (string | undefined)[] = []
    ai.rewriteSummary = async (input?: unknown) => {
      nudges.push((input as { nudge?: string }).nudge)
      ai.rewrites++
      return sug({ bulletId: "summary", text: "Cashier with 3 years of experience in customer service and cash handling. Balanced the till at every close with zero discrepancies across 3 years. Holds a retail certificate and has worked night shifts.", actionVerb: "" })
    }
    await runRewrite({ tree, nodeId: tree.summary.id, spec: SPEC, language: "en", model: "m1", jdKey: "jd", ai, store: new MemoryStore() })
    expect(nudges[1] ?? "").toMatch(/third person/)
  })

  it("al cambiar una apertura débil se va la fórmula, no el trabajo: «Encargado del mantenimiento…» → «Mantuve las máquinas» no se ofrece", async () => {
    const raw: RawResume = { ...RAW, workExperience: [{ ...RAW.workExperience![0], description: "• Encargado del mantenimiento de las máquinas\n• Soldé piezas" }] }
    const t = buildTree(raw)
    const ai = new CountingAi()
    ai.nextSuggestion = sug({ text: "Mantuve las máquinas" })
    const malo = await runRewrite({ tree: t, nodeId: t.roles[0].bullets[0].id, spec: SPEC, language: "es", model: "m1", jdKey: "jd", ai, store: new MemoryStore() })
    expect(malo.ok).toBe(false)
    const ai2 = new CountingAi()
    ai2.nextSuggestion = sug({ text: "Realicé el mantenimiento preventivo de las máquinas" })
    const bueno = await runRewrite({ tree: t, nodeId: t.roles[0].bullets[0].id, spec: SPEC, language: "es", model: "m1", jdKey: "jd", ai: ai2, store: new MemoryStore() })
    expect(bueno.ok).toBe(true)
  })

  it("una apertura débil cambiada por otra apertura débil no se ofrece («Helped with» → «Assisted with»)", async () => {
    const raw: RawResume = { ...RAW, workExperience: [{ ...RAW.workExperience![0], description: "• Helped with the stock counts\n• Moved pallets with the forklift" }] }
    const t = buildTree(raw)
    const ai = new CountingAi()
    ai.nextSuggestion = sug({ text: "Assisted with the stock counts across the warehouse" })
    const r = await runRewrite({ tree: t, nodeId: t.roles[0].bullets[0].id, spec: SPEC, language: "en", model: "m1", jdKey: "jd", ai, store: new MemoryStore() })
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

  it("escribir una línea no reformatea los OTROS puestos: su descripción vuelve byte a byte (QA, 2026-10-02)", () => {
    const otro = "Empresa familiar de alimentos.\n\n- Repuse mercadería\n* Ordené la góndola"
    const raw: RawResume = { ...RAW, workExperience: [RAW.workExperience![0], { jobTitle: "Repositor", employer: "Almacén", startDate: "2019-01", endDate: "2020-12", description: otro }] }
    const tree = buildTree(raw)
    const out = writeBack(writeInto(tree, tree.roles[0].bullets[0].id, "Atendí a los clientes con cobro y consultas"), raw)
    expect(out.workExperience![1].description).toBe(otro)
    expect(out.workExperience![0].description).toContain("Atendí a los clientes con cobro y consultas")
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

  it("un requisito con alternativas no entra con la barra: sube la que ya está, o la citada (visto en local, 2026-10-02)", () => {
    const spec = { ...specSkills, mustHave: [{ skill: "RESTful APIs | GraphQL", raw: "APIs RESTful/GraphQL", years: null, category: null }], niceToHave: [] } as unknown as JobSpec
    const a = (cvWording: string | null): AuditFacts => ({ ...auditSkills, hard: [{ skill: "RESTful APIs | GraphQL", requirement: "MUST", status: "demonstrated", evidenceNodeId: "b1", writeIn: null, question: null, cvWording }] })
    const ya = skillPlan(["Excel", "RESTful APIs"], spec, a(null))
    expect(ya.final.some((x) => x.includes("|"))).toBe(false)
    expect(ya.final[0]).toBe("RESTful APIs")
    expect(skillPlan(["Excel"], spec, a("consumo de GraphQL")).add).toEqual(["GraphQL"])
    expect(skillPlan(["Excel"], spec, a(null)).add).toHaveLength(0)
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

describe("la fórmula de una apertura débil son sus palabras, no las tres primeras (2026-10-02)", () => {
  it("devuelve la fórmula y el artículo que la cierra, nunca el contenido", async () => {
    const { weakOpenerWords } = await import("@/lib/services/ai/shared/empty-phrasing")
    expect(weakOpenerWords("Encargado del mantenimiento de las máquinas")).toEqual(["encargado", "del"])
    expect(weakOpenerWords("Responsible for receiving trucks")).toEqual(["responsible", "for"])
    expect(weakOpenerWords("Soldé piezas")).toEqual([])
  })
})
