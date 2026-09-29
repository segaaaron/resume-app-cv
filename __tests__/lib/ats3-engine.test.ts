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
  termsOf,
  coverageOf,
  openLedger,
  fijarJuicios,
  JUICIOS_VACIOS,
  conFormasDelCv,
  type AtsAi,
  type AtsStore,
  type CacheKind,
  type RawResume,
} from "@/lib/ats3/engine"
import { MAL_ESCRITO, SIN_RESPALDO, buildTermIndex, nodeHash, type JobSpec, type ResumeTree, type Suggestion, type AnchoredSuggestion } from "@/lib/ats3/contracts"
import { SKILLS_MAX } from "@/lib/ats3/ledger"
import { experienceYears, formaPosible, scoreResume, type AuditFacts, type ParseChecks } from "@/lib/ats3/score"

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

/**
 * El juicio del CV QUE RECIBE, como hace el modelo real. Un doble que siempre
 * contesta por el CV original deja sin juicio a las líneas editadas, y desde el
 * 2026-09-24 el motor las vuelve a pedir: eso contaría como una auditoría más.
 */
function fakeAudit(tree: ResumeTree = buildTree(RAW)): AuditFacts {
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
  }
}

class CountingAi implements AtsAi {
  jd = 0
  audits = 0
  rewrites = 0
  verifies = 0
  /** Lo que el modelo devuelve; cada test lo ajusta. */
  nextSuggestion: Suggestion | null = null
  lastNudge: string | undefined

  async parseJob() {
    this.jd++
    return SPEC
  }
  async audit(tree: ResumeTree) {
    this.audits++
    return fakeAudit(tree)
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

describe("el análisis se entrega en actos", () => {
  it("el puntaje llega primero y no cuesta una llamada", async () => {
    const { acts } = await analyze(new CountingAi(), new MemoryStore())
    expect(acts[0].act).toBe("score")
    expect(acts.map((a) => a.act)).toEqual(["score", "job", "covered", "findings"])
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

  /**
   * UNA LÍNEA, UNA TARJETA — y esto lo comprueba EJECUTANDO el motor.
   *
   * ── EL DEFECTO QUE ESTO CIERRA (CEO, 2026-09-09, con captura) ──────────────
   * Cada emisor cumplía su parte y aun así la misma viñeta terminaba con dos
   * tarjetas: los ejes por un lado, el requisito de la vacante por otro, la
   * blanda por un tercero. Dos órdenes para UNA sola reescritura.
   *
   * El único hallazgo que puede abrir tarjeta propia es el que NO toca el texto
   * de la línea —agregar un término a Habilidades—, porque su botón necesita
   * saber qué término agregar y no compite con la reescritura.
   */
  it("ninguna línea recibe dos tarjetas que se cierren reescribiéndola", () => {
    const tree = buildTree({
      summary: "Desarrollador iOS",
      workExperience: [{
        jobTitle: "iOS Dev", employer: "Acme", startDate: "2021-03", endDate: "2024-06",
        description: "• Desarrollé apps con Swift\n• Mantuve la arquitectura del proyecto",
      }],
      skills: [{ name: "Swift" }],
    })
    const spec = {
      ...SPEC,
      mustHave: [{ skill: "Combine", raw: "Combine", years: null, category: null }],
      softSignals: ["Trabajo en equipo"],
    }
    const index = buildTermIndex(termsOf(spec, tree))
    const audit: AuditFacts = {
      bullets: tree.roles[0].bullets.map((b) => ({
        id: b.id, hasActionVerb: true, hasResult: false, hasMethod: false, specificity: 0.5,
      })),
      summary: { identity: true, proof: false, fit: false, extra: false },
      coverage: [{ skill: "Combine", requirement: "MUST", status: "NOT_FOUND", evidenceNodeId: null }],
      softCoverage: [{ signal: "Trabajo en equipo", status: "DECLARED_ONLY", evidenceNodeId: null }],
    }
    const score = scoreResume(tree, spec, audit, {})
    const hallazgos = findingsOf(tree, audit, score, index)

    // Cuentan las que se cierran REESCRIBIENDO la línea. La pregunta por un
    // requisito sin rastro habla del término y sólo sugiere el puesto.
    const porLinea = new Map<string, number>()
    for (const f of hallazgos.filter((h) => h.remedy === "rewrite")) {
      porLinea.set(f.nodeId, (porLinea.get(f.nodeId) ?? 0) + 1)
    }
    expect([...porLinea.values()].filter((n) => n > 1)).toHaveLength(0)

    // Y el nombre de la tarjeta es el del hallazgo que MÁS mueve el número: un
    // requisito de la vacante no puede quedar escondido dentro de «no dice qué
    // cambió», que es lo que pasaba cuando mandaba el orden del archivo.
    const conRequisito = hallazgos.find((f) => f.merged.includes("missing_requirement"))
    expect(conRequisito?.type).toBe("missing_requirement")
  })

  it("cada requisito aterriza en la línea que P2 citó como evidencia; sin rastro, no se escribe", () => {
    // Quién decide si una línea sostiene un requisito es la auditoría, no el
    // parecido de palabras: por raíces el motor escribió «Core ML» en la línea
    // de Core Data (medido contra la API el 2026-09-28).
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
        { skill: "Control de inventario", requirement: "MUST" as const, status: "IMPLIED" as const, evidenceNodeId: tree.roles[0].bullets[0].id },
        { skill: "Medios de pago", requirement: "MUST" as const, status: "IMPLIED" as const, evidenceNodeId: tree.roles[0].bullets[1].id },
      ],
      softCoverage: [],
    }
    const score = scoreResume(tree, spec2, audit, CHECKS)
    const index = buildTermIndex(termsOf(spec2, tree))
    const findings = findingsOf(tree, audit, score, index)

    const inventario = findings.find((f) => f.detail.includes("Control de inventario"))
    const pagos = findings.find((f) => f.detail.includes("Medios de pago"))
    expect(inventario).toBeDefined()
    expect(pagos).toBeDefined()
    // Cada uno en SU línea, no los dos en la misma.
    expect(inventario!.nodeId).not.toBe(pagos!.nodeId)
    expect(inventario!.nodeText).toContain("inventario")
    expect(pagos!.nodeText).toContain("pagos")
    expect(inventario!.remedy).toBe("rewrite")

    // La misma vacante sin evidencia citada: se informa, ninguna línea lo recibe.
    const sinRastro = { ...audit, coverage: audit.coverage.map((c) => ({ ...c, status: "NOT_FOUND" as const, evidenceNodeId: null })) }
    const nada = findingsOf(tree, sinRastro, scoreResume(tree, spec2, sinRastro, CHECKS), index)
    const inv2 = nada.find((f) => f.detail.includes("Control de inventario"))
    expect(inv2).toMatchObject({ remedy: "none", nodeId: tree.summary.id })
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

  it("UNA línea, UNA tarjeta: dos defectos en la misma viñeta no dan dos", async () => {
    const tree = buildTree(RAW)
    const audit = fakeAudit()
    const score = scoreResume(tree, SPEC, audit, CHECKS)
    const index = buildTermIndex(termsOf(SPEC, tree))
    const findings = findingsOf(tree, audit, score, index)
    /**
     * UNA TARJETA POR LÍNEA **Y SUJETO**, que es la regla que el motor declara.
     *
     * «Una línea, una tarjeta» vale para lo que se dice DE la línea: verbo,
     * resultado, cifra. Lo que habla de OTRA cosa —un término que falta, uno que
     * no está en Habilidades— trae sujeto y abre la suya, porque si no queda
     * escondido como detalle de un hallazgo que no es el suyo y pierde su
     * sección: reportado con captura, «faltan 8 habilidades duras» y ni una
     * tarjeta de habilidades en Tailor.
     */
    const claves = findings.map((f) => (f.subject ? `${f.nodeId}:${f.subject}` : f.nodeId))
    expect(new Set(claves).size).toBe(claves.length)
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

  it("si se parece a otra línea, se pide UNA vez más diciendo cuál, y llega igual con el aviso", async () => {
    const { tree, index, ledger } = setup()
    const ai = new CountingAi()
    const target = tree.roles[0].bullets[0]
    // Repite una línea que el CV ya tiene: es el único guard que JUZGA, y el
    // que el CEO pidió conservar.
    ai.nextSuggestion = {
      bulletId: target.id,
      changed: true,
      text: "Realicé el arqueo de caja al cierre",
      actionVerb: "Realicé",
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
    expect(ai.lastNudge ?? "").toMatch(/ya lo dice|already says/) // y le dijo qué falló
    // No bloquea (CEO, 2026-09-11): llega, con la línea parecida nombrada.
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.suggestion.similarTo).toBeTruthy()
  })

  /**
   * MEDIDO CONTRA LA API (2026-09-11): de 15 líneas reales, 3 volvían —también
   * tras el reintento— con el texto del usuario intacto, y el panel las mostraba
   * como propuesta con un cartel de aviso encima. Parecerse a OTRA viñeta es una
   * decisión del usuario; parecerse a LA QUE REEMPLAZA es que no hay mejora.
   */
  it("si el modelo devuelve la MISMA línea, contesta «ya está bien», no una propuesta con aviso", async () => {
    const { tree, index, ledger } = setup()
    const ai = new CountingAi()
    const target = tree.roles[0].bullets[0]
    ai.nextSuggestion = {
      bulletId: target.id,
      changed: true,
      // Su propia línea, devuelta tal cual.
      text: target.text,
      actionVerb: "Atendí",
      keywordsUsed: [],
      claim: "",
      metricType: null,
      placeholders: [],
      variantWithoutMetric: null,
      measurableAspect: null, declineBasis: null,
    }

    const r = await runRewrite({
      tree, nodeId: target.id, spec: SPEC, ledger, index, language: "es", model: "m1", jdKey: "jd", ai, store: new MemoryStore(),
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.alreadyGood).toBe(true)
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
      text: "Realicé el arqueo de caja al cierre",
      actionVerb: "Realicé", keywordsUsed: [], claim: "", metricType: null, placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null,
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
    basedOnHash: "h", originalText: "o", ...over,
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
  })

  it("lo demostrado en una viñeta y ausente de Habilidades se señala", () => {
    // El filtro lee esa sección literalmente y es de lo primero que mira.
    const t = arbol()
    const actual = t.roles[0].bullets[0].id
    const spec = { ...SPEC, mustHave: [{ skill: "Medios de pago", raw: "medios de pago", years: null, category: null }] }
    const index = buildTermIndex(termsOf(spec, t))
    const audit = facts(t, "Medios de pago", actual)
    const score = scoreResume(t, spec, audit, {})
    // ── QUIÉN CONTESTA ESTO AHORA ─────────────────────────────────────────
    // Era un hallazgo por término con su botón. Miraba uno por vez, así que
    // podía llevar la lista a cien entradas — y el filtro cuenta cada término
    // UNA vez. La pregunta completa —«cuáles lleva tu CV para esta vacante»— la
    // contesta `skillPlan`, con el techo de veinte y los pesos del aviso.
    expect(skillPlan(t.declaredSkills, spec, audit, {}).add).toContain("Medios de pago")
  })

  it("lo que YA está en Habilidades no se señala", () => {
    const t = arbol()
    const actual = t.roles[0].bullets[0].id
    const spec = { ...SPEC, mustHave: [{ skill: "Atención al cliente", raw: "atención al cliente", years: null, category: null }] }
    const index = buildTermIndex(termsOf(spec, t))
    const audit = facts(t, "Atención al cliente", actual)
    const score = scoreResume(t, spec, audit, {})
    void findingsOf(t, audit, score, index)
    // Ya está en la lista: el plan no la mueve de lugar ni la propone otra vez.
    expect(skillPlan(t.declaredSkills, spec, audit, {}).add).toHaveLength(0)
  })

  it("dos términos sobre la misma línea entran los DOS a la lista", () => {
    // Antes eran dos tarjetas con sujeto propio, y su motivo era real: un botón
    // compartido habría agregado a Habilidades la concatenación de los dos, que
    // no es la habilidad de nadie. Ahora ni siquiera hay dos botones: la lista
    // es una sola respuesta y entran los dos con su nombre.
    const t = arbol()
    const actual = t.roles[0].bullets[0].id
    const spec = {
      ...SPEC,
      mustHave: [
        { skill: "Facturación", raw: "facturación", years: null, category: null },
        { skill: "Medios de pago", raw: "medios de pago", years: null, category: null },
      ],
    }
    const audit: AuditFacts = {
      ...facts(t, "Facturación", actual),
      coverage: [
        { skill: "Facturación", requirement: "MUST", status: "FOUND", evidenceNodeId: actual },
        { skill: "Medios de pago", requirement: "MUST", status: "FOUND", evidenceNodeId: actual },
      ],
    }
    expect(skillPlan(t.declaredSkills, spec, audit, {}).add).toEqual(["Facturación", "Medios de pago"])
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
    const blanda = findingsOf(t, audit, score, index).find((f) => f.merged.includes("soft_not_shown"))
    expect(blanda?.detail).toContain("Trabajo en equipo")
    /**
     * SU COMPONENTE ES `soft`, y de ahí sale su sección.
     *
     * Salía con `xyz`, que pertenece a «Lo que mira la persona»: una línea cuyo
     * único defecto era una blanda sin demostrar abría su tarjeta en la sección
     * del RECLUTADOR, bajo un porcentaje que mide otra cosa. `soft` no lo mide
     * el puntaje —las blandas no puntúan— así que su sección tampoco promete
     * puntos.
     *
     * Se comprueba sobre una línea SIN otros hallazgos: cuando comparte tarjeta
     * con algo que sí puntúa, manda lo que mueve el número, y eso es correcto.
     */
    const soloBlanda = findingsOf(t, { ...audit, bullets: t.roles[0].bullets.map((b) => ({
      id: b.id, hasActionVerb: true, hasResult: true, hasMethod: true, specificity: 0.9,
    })) }, score, index).find((f) => f.merged.includes("soft_not_shown"))
    expect(soloBlanda?.component).toBe("soft")
    // Y NO abre tarjeta propia: la blanda se demuestra reescribiendo esa línea,
    // que es la misma reescritura que cierra lo demás que le falta.
    expect(findingsOf(t, audit, score, index).filter((f) => f.nodeId === blanda?.nodeId)).toHaveLength(1)
  })

  it("lo que el CV demuestra SIN NOMBRARLO también entra a la lista", () => {
    // Es el caso que más pierde: la persona lo hace, el filtro no lo ve porque
    // la sección que lee literalmente no lo nombra. `IMPLIED` cuenta igual que
    // `FOUND` para entrar.
    const t = arbol()
    const actual = t.roles[0].bullets[0].id
    const spec = { ...SPEC, mustHave: [{ skill: "Medios de pago", raw: "medios de pago", years: null, category: null }] }
    const audit: AuditFacts = {
      ...facts(t, "Medios de pago", actual),
      coverage: [{ skill: "Medios de pago", requirement: "MUST", status: "IMPLIED", evidenceNodeId: actual }],
    }
    expect(skillPlan(t.declaredSkills, spec, audit, {}).add).toContain("Medios de pago")
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
    void findingsOf(t, audit, score, index)
    // NO_FOUND: el CV no lo sostiene. Escribir "SAP" en sus habilidades sería
    // afirmar un hecho sobre esa persona que nadie declaró.
    expect(skillPlan(t.declaredSkills, spec, audit, {}).add).toHaveLength(0)
  })
})

const specSkills = {
  language: "es", roleTitleRaw: "iOS", seniority: null, metricThatMatters: null,
  mustHave: [{ skill: "Swift", raw: "Swift", years: null, category: null },
             { skill: "Combine", raw: "Combine", years: null, category: null }],
  niceToHave: [{ skill: "TestFlight", raw: "TestFlight", years: null, category: null }],
  responsibilities: [], softSignals: [],
} as unknown as JobSpec

const auditSkills = {
  bullets: [], summary: { identity: true, proof: true, fit: true, extra: true },
  coverage: [{ skill: "Combine", requirement: "MUST" as const, status: "FOUND" as const, evidenceNodeId: "b1" }],
  softCoverage: [],} as unknown as AuditFacts

/**
 * SI SE FUSIONA, NO SE PIDE ADEMÁS QUE SAQUES ALGO (CEO, 2026-09-09).
 *
 * «Si fusionás es porque tiene buen impacto para el currículum; si fusionás
 * cosas para luego pedir eliminar o sacar, eso no quiero.»
 *
 * El modelo puede devolver MERGE sobre una línea y DROP sobre la otra del par:
 * leído en pantalla, es el panel pidiendo juntarlas y tirar una a la vez.
 */

/**
 * ENTRE LAS QUE PUEDEN SOSTENER EL TÉRMINO, GANA LA MÁS DÉBIL (CEO, 2026-09-09).
 *
 * Antes las dos señales se sumaban y la afinidad es un entero mientras la
 * debilidad valía 0,01: una línea fuerte con una palabra más de afinidad le
 * ganaba SIEMPRE a la débil. Era un desempate, no una prioridad.
 */
describe("una blanda aterriza en la viñeta que menos aporta", () => {
  it("gana la floja, no la que ya trae más términos del aviso", () => {
    const tree = buildTree({
      summary: "Cajera",
      workExperience: [{
        jobTitle: "Cajera", employer: "Súper", startDate: "2021-03", endDate: "2024-06",
        description: [
          "• Realicé el arqueo de caja al cierre con conciliación de comprobantes y control de diferencias",
          "• Realicé el arqueo",
        ].join("\n"),
      }],
      skills: [],
    })
    const spec = { ...SPEC, mustHave: [{ skill: "Conciliación", raw: "conciliación", years: null, category: null }], softSignals: ["Orden en el arqueo"] }
    const index = buildTermIndex(termsOf(spec, tree))
    const audit: AuditFacts = {
      ...fakeAudit(),
      bullets: tree.roles[0].bullets.map((b) => ({ id: b.id, hasActionVerb: true, hasResult: true, hasMethod: true, specificity: 0.5 })),
      coverage: [],
      softCoverage: [{ signal: "Orden en el arqueo", status: "ABSENT", evidenceNodeId: null }],
    }
    const score = scoreResume(tree, spec, audit, {})
    const req = findingsOf(tree, audit, score, index, spec).find((f) => f.merged.includes("soft_not_shown"))
    // Las dos pueden sostenerlo; la segunda es la que menos aporta.
    expect(req?.nodeId).toBe(tree.roles[0].bullets[1].id)
  })
})

/**
 * LAS BLANDAS MUEVEN EL NÚMERO (regresión cerrada el 2026-09-09).
 *
 * El motor viejo las pesaba —`lib/ats/scoring-config.ts:56`, `softSkills: 0.10`—
 * y v3 perdió ese peso al construirse de cero. Durante diez días el panel pidió
 * demostrarlas mientras el puntaje no se movía: trabajo que el producto exige y
 * no paga.
 *
 * Medido con este mismo caso: 65,3 sin ninguna · 68,0 sólo listadas · 69,8
 * demostradas.
 */
/**
 * EL CARGO Y LOS VERBOS COBRABAN SIN REPORTAR (CEO, 2026-09-09).
 *
 * `title` descuenta 0,14 de la relevancia y `verbs` 0,10 del impacto, y ningún
 * hallazgo declaraba esos componentes: se podían cerrar las cuarenta y ocho
 * tarjetas del panel y quedar con casi un cuarto del peso perdido sin saber por
 * qué.
 */
/**
 * UN `FOUND` SE COMPRUEBA — si el modelo y el código discrepan, gana el código.
 *
 * ── EL DEFECTO QUE ESTO CIERRA, MEDIDO (CEO, 2026-09-09) ─────────────────────
 * El prompt de P2 lo dice con todas las letras —«FOUND sólo si el CV lo dice con
 * palabras que un lector literal reconocería»— y nada lo hacía cumplir. Con un
 * CV que dice «Recibí y orienté a los visitantes» y una vacante que pide
 * «Atención al público», el modelo devolvía FOUND: la tabla mostraba «tu CV lo
 * dice 0 veces» y el puntaje contaba el requisito al 100%.
 *
 * El filtro compara CADENAS. Decirle a alguien que está cubierto cuando el
 * término no está escrito es mandarlo a una postulación que ya perdió.
 */
/**
 * UNA BLANDA QUE LA VACANTE PIDE SIEMPRE TIENE SALIDA (CEO, 2026-09-09).
 *
 * Sólo salía tarjeta para la DECLARADA sin demostrar. La AUSENTE —la que más
 * puntos cuesta— no tenía ninguna: el usuario veía «Habilidades blandas 0%» y ni
 * una sugerencia debajo. Un porcentaje en cero sin nada que apretar es un
 * reproche, no un producto.
 */
describe("las blandas que faltan tienen tarjeta, declaradas o ausentes", () => {
  const arbol = () =>
    buildTree({
      summary: "Cajera",
      workExperience: [{ jobTitle: "Cajera", employer: "S", startDate: "2021-03", endDate: "2024-06",
        description: "• Atendí a los clientes en la línea de cajas" }],
      skills: [],
    })

  const conEstado = (estado: "DECLARED_ONLY" | "ABSENT" | "DEMONSTRATED") => {
    const t = arbol()
    // «Declarada» es un hecho del texto y «demostrada» cita su línea (`softCoverageOf`).
    if (estado === "DECLARED_ONLY") t.declaredSkills = ["Trabajo en equipo"]
    const spec = { ...SPEC, softSignals: ["Trabajo en equipo"] } as JobSpec
    const audit: AuditFacts = {
      ...fakeAudit(),
      softCoverage: [{ signal: "Trabajo en equipo", status: estado, evidenceNodeId: estado === "DEMONSTRATED" ? t.roles[0].bullets[0].id : null }],
    }
    const score = scoreResume(t, spec, audit, readableChecks(t))
    return findingsOf(t, audit, score, buildTermIndex([]), spec)
  }

  it("la ausente también, que es la que más cuesta", () => {
    expect(conEstado("ABSENT").some((f) => f.merged.includes("soft_not_shown"))).toBe(true)
  })

  it("la declarada sin demostrar, como siempre", () => {
    expect(conEstado("DECLARED_ONLY").some((f) => f.merged.includes("soft_not_shown"))).toBe(true)
  })

  it("la demostrada NO: ya está, y repetirla es el bucle", () => {
    expect(conEstado("DEMONSTRATED").some((f) => f.merged.includes("soft_not_shown"))).toBe(false)
  })
})

describe("un requisito que el CV no NOMBRA no cuenta como cubierto", () => {
  const raw = {
    summary: "Cajera",
    workExperience: [{ jobTitle: "Cajera", employer: "S", startDate: "2021-03", endDate: "2024-06",
      description: "• Recibí y orienté a los visitantes del local" }],
    skills: [],
  }
  const spec = {
    ...SPEC,
    mustHave: [{ skill: "Atención al público", raw: "atención al público", years: null, category: null }],
  } as JobSpec

  const correr = async () => {
    const ai: AtsAi = {
      parseJob: async () => spec,
      audit: async (t) => ({
        ...fakeAudit(),
        coverage: [{ skill: "Atención al público", requirement: "MUST", status: "FOUND", evidenceNodeId: t.roles[0].bullets[0].id }],
      }),
      rewriteBullet: async () => ({}) as Suggestion,
      rewriteSummary: async () => ({}) as Suggestion,
    }
    const actos: Record<string, unknown>[] = []
    for await (const a of runAnalysis({
      raw, jdText: "Buscamos cajera con atención al público en sucursal",
      language: "es", resumeId: "cv1", model: "m", ai, store: new MemoryStore(),
    })) actos.push(a as Record<string, unknown>)
    return actos
  }

  /**
   * Y SE COMPARA POR LLAVE, no por la cadena que el modelo escribió.
   *
   * Medido: con «Atención al Público» —una mayúscula— o «Atencion al publico»
   * —sin tilde— la comparación exacta degradaba un requisito que el CV SÍ dice,
   * y el usuario perdía puntos por cómo el modelo escribió una palabra.
   */
  it("una mayúscula o una tilde de diferencia NO degradan lo que el CV sí dice", async () => {
    const ai: AtsAi = {
      parseJob: async () => spec,
      audit: async (t) => ({
        ...fakeAudit(),
        coverage: [{ skill: "Atencion al Publico", requirement: "MUST", status: "FOUND", evidenceNodeId: t.roles[0].bullets[0].id }],
      }),
      rewriteBullet: async () => ({}) as Suggestion,
      rewriteSummary: async () => ({}) as Suggestion,
    }
    const actos: Record<string, unknown>[] = []
    for await (const a of runAnalysis({
      raw: { ...raw, workExperience: [{ ...raw.workExperience[0], description: "• Hice atención al público todos los días" }] },
      jdText: "Buscamos cajera con atención al público en sucursal",
      language: "es", resumeId: "cv1", model: "m", ai, store: new MemoryStore(),
    })) actos.push(a as Record<string, unknown>)
    const score = actos[0].score as { components: { key: string; numerator: number }[] }
    expect(score.components.find((c) => c.key === "must")!.numerator).toBeGreaterThan(0)
  })

  it("el FOUND del modelo se degrada, y el puntaje no lo cuenta", async () => {
    const actos = await correr()
    const score = actos[0].score as { components: { key: string; numerator: number }[] }
    expect(score.components.find((c) => c.key === "must")!.numerator).toBe(0)
  })

  it("y NO se pierde: el requisito sale con su tarjeta para escribirlo", async () => {
    // `IMPLIED` es exactamente eso —el trabajo lo demuestra y el CV no lo
    // nombra— y su salida ya existía. Se dice la verdad, no se esconde nada.
    const actos = await correr()
    const f = (actos.find((x) => x.act === "findings")!.findings as { merged: string[] }[])
    expect(f.some((x) => x.merged.includes("missing_requirement"))).toBe(true)
  })
})

describe("el cargo y los verbos repetidos tienen tarjeta", () => {
  const cv = (desc: string, titulo = "Cajera") => ({
    summary: "Cajera con experiencia",
    workExperience: [{ jobTitle: titulo, employer: "Súper", startDate: "2021-03", endDate: "2024-06", description: desc }],
    skills: [],
  })
  const hallazgos = (raw: ReturnType<typeof cv>, spec: JobSpec) => {
    const t = buildTree(raw)
    const a: AuditFacts = {
      ...fakeAudit(),
      bullets: t.roles[0].bullets.map((b) => ({ id: b.id, hasActionVerb: true, hasResult: true, hasMethod: true, specificity: 0.9 })),
    }
    return findingsOf(t, a, scoreResume(t, spec, a, readableChecks(t)), buildTermIndex([]), spec)
  }

  it("el cargo se compara POR PALABRA, no por subcadena", () => {
    /**
     * Medido: una vacante que busca «Dev» daba por escrito el cargo en un CV que
     * dice «Developer», porque «dev» vive dentro de «developer». Es el mismo
     * defecto que este proyecto ya pagó con «plusvalía contiene plus».
     */
    const spec = { ...SPEC, roleTitleRaw: "Dev" } as JobSpec
    const f = hallazgos(cv("• Atendí a los clientes", "Developer"), spec)
    expect(f.some((x) => x.merged.includes("title_mismatch"))).toBe(true)
  })

  it("el cargo abre SU tarjeta y nombra el cargo, no el detalle del resumen", () => {
    // Sin sujeto se fusionaba con «resumen incompleto» y el cargo quedaba dentro
    // de su detalle: «identity, proof, fit · Jefa de caja».
    const spec = { ...SPEC, roleTitleRaw: "Jefa de caja" } as JobSpec
    const c = hallazgos(cv("• Atendí a los clientes"), spec).find((x) => x.merged.includes("title_mismatch"))
    expect(c?.type).toBe("title_mismatch")
    expect(c?.detail).toBe("Jefa de caja")
  })

  /**
   * EL CARGO LO MIDE UNA SOLA FUNCIÓN — la tarjeta y el número no pueden
   * discrepar.
   *
   * Medido antes de unificarlos: con `titleAlignment` del modelo en 1, la
   * tarjeta salía prometiendo 0,0 puntos; en 0,5 prometía el peso entero. Dos
   * respuestas a «¿el cargo coincide?» y se contradecían en la misma pantalla.
   */
  it("si hay tarjeta del cargo, escribirlo SUBE el número; si no la hay, ya suma", () => {
    const spec = { ...SPEC, roleTitleRaw: "Jefa de sucursal" } as JobSpec
    const t = buildTree(cv("• Atendí a los clientes"))
    const a: AuditFacts = { ...fakeAudit(), bullets: [] }
    const sinEscribir = scoreResume(t, spec, a, readableChecks(t))
    expect(hallazgos(cv("• Atendí a los clientes"), spec).some((x) => x.merged.includes("title_mismatch"))).toBe(true)

    // El mismo CV con el cargo escrito tal cual: sin tarjeta y con más puntos.
    const conCargo = cv("• Atendí a los clientes", "Jefa de sucursal")
    const t2 = buildTree(conCargo)
    expect(hallazgos(conCargo, spec).some((x) => x.merged.includes("title_mismatch"))).toBe(false)
    expect(scoreResume(t2, spec, a, readableChecks(t2)).total).toBeGreaterThan(sinEscribir.total)
  })

  it("el cargo escrito tal cual NO se señala", () => {
    const spec = { ...SPEC, roleTitleRaw: "Cajera" } as JobSpec
    expect(hallazgos(cv("• Atendí a los clientes"), spec).some((x) => x.merged.includes("title_mismatch"))).toBe(false)
  })

  it("cada apertura repetida tiene la suya, sobre la línea más floja", () => {
    // Se emiten TODAS de una: resolver una y que aparezca la siguiente es el
    // bucle que este panel existe para no tener.
    const f = hallazgos(cv(["• Atendí a los clientes", "• Atendí el teléfono", "• Ordené la góndola", "• Ordené el depósito"].join("\n")), SPEC)
    const v = f.filter((x) => x.merged.includes("verb_repeated"))
    expect(v).toHaveLength(2)
    /**
     * EL VERBO VIAJA MARCADO. Al fusionarse con otra tarjeta el detalle se
     * concatena y se pierde de qué tipo vino cada pieza: sin la marca, la
     * pantalla mostraba «developed» suelto en una caja gris. Reportado con
     * captura.
     */
    // `includes` y no `startsWith`: si la línea ya tenía tarjeta, el detalle se
    // concatena y la marca queda en su pieza, no al principio.
    expect(v.every((x) => x.detail.includes("verbo:"))).toBe(true)
  })
})

describe("demostrar una blanda sube el puntaje", () => {
  const arbol = () =>
    buildTree({
      summary: "Cajera",
      workExperience: [{
        jobTitle: "Cajera", employer: "Súper", startDate: "2021-03", endDate: "2024-06",
        description: "• Realicé el arqueo de caja al cierre",
      }],
      skills: [],
    })

  const conBlandas = (estado: "DEMONSTRATED" | "DECLARED_ONLY" | "ABSENT", t: ResumeTree): AuditFacts => ({
    ...fakeAudit(),
    softCoverage: [{ signal: "Trabajo en equipo", status: estado, evidenceNodeId: estado === "DEMONSTRATED" ? t.roles[0].bullets[0].id : null }],
  })

  const spec = { ...SPEC, softSignals: ["Trabajo en equipo"] } as JobSpec

  it("demostrada vale más que sólo listada, y listada más que ausente", () => {
    // La blanda escrita en Habilidades: sin eso no hay «declarada» que medir.
    // «Ausente» es no tenerla escrita en ningún lado; las otras dos la escriben.
    const de = (e: "DEMONSTRATED" | "DECLARED_ONLY" | "ABSENT") => {
      const t = e === "ABSENT" ? arbol() : { ...arbol(), declaredSkills: ["Trabajo en equipo"] }
      return scoreResume(t, spec, conBlandas(e, t), readableChecks(t)).total
    }
    expect(de("DEMONSTRATED")).toBeGreaterThan(de("DECLARED_ONLY"))
    expect(de("DECLARED_ONLY")).toBeGreaterThan(de("ABSENT"))
  })

  it("una vacante que NO pide blandas no castiga al candidato", () => {
    /**
     * El componente no aplica y REPARTE su peso entre los que sí se midieron —
     * no se cuenta como un cero, que sería descontarle a alguien por algo que la
     * vacante nunca pidió. Por eso «no las piden» tiene que quedar por encima de
     * «las piden y no demostrás ninguna».
     *
     * No es igual a demostrarlas todas, y también es correcto: repartir 0,10
     * entre componentes que están al 60% rinde menos que un componente al 100%.
     */
    const t = arbol()
    const sinPedir = scoreResume(t, { ...SPEC, softSignals: [] } as JobSpec, { ...fakeAudit(), softCoverage: [] }, readableChecks(t))
    const ninguna = scoreResume(t, spec, conBlandas("ABSENT", t), readableChecks(t))
    expect(sinPedir.total).toBeGreaterThan(ninguna.total)
  })
})

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
    const p = skillPlan(cien, specSkills, auditSkills, { Swift: 1.75, Combine: 1, TestFlight: 0.5 })
    expect(p.final[0]).toBe("Combine")
    expect(p.final).not.toContain("Swift")
    for (const s of cien) expect(p.final).toContain(s)
    expect(p.final).toHaveLength(cien.length + p.add.length)
    // Lo que pasa a verse desplaza exactamente lo mismo que deja de verse.
    expect(p.entering).toContain("Combine")
    expect(p.leaving).toHaveLength(p.entering.length)
  })

  it("una habilidad que el aviso pide NUNCA queda fuera de las que se ven", () => {
    const p = skillPlan(["Swift", ...Array.from({ length: 40 }, (_, i) => `X${i}`)], specSkills, auditSkills, {})
    const seVen = p.final.slice(0, SKILLS_MAX)
    expect(seVen).toContain("Swift")
    expect(seVen).toContain("Combine")
    expect(p.leaving).not.toContain("Swift")
  })

  it("con pocas habilidades no deja de verse ninguna, y respeta TU orden", () => {
    const p = skillPlan(["Excel", "Swift", "Word"], specSkills, auditSkills, {})
    expect(p.leaving).toHaveLength(0)
    expect(p.final.filter((s) => !["Swift", "Combine"].includes(s))).toEqual(["Excel", "Word"])
  })
})

/**
 * LAS CONTRADICCIONES QUE SE VIERON EN PRODUCCIÓN (2026-09-24).
 *
 * Cada caso es una pantalla real: un iOS dev contra un aviso de fintech. Todas
 * salían de lo mismo —una pregunta con varios dueños, o un dato del CV que el
 * motor no leía—, y cada una se fija contra la función que la contesta.
 */
describe("una pregunta, una respuesta — lo medido en producción", () => {
  const specIos = (over: Partial<JobSpec> = {}): JobSpec => ({
    ...SPEC,
    mustHave: [
      { skill: "English", raw: "English B2 or higher", years: null, category: null },
      { skill: "Combine", raw: "Combine", years: null, category: null },
      { skill: "Keychain", raw: "Keychain", years: null, category: null },
    ],
    niceToHave: [],
    softSignals: [],
    ...over,
  })
  const cvIos: RawResume = {
    summary: "iOS Developer",
    workExperience: [
      {
        jobTitle: "iOS Developer",
        employer: "IA interactive",
        startDate: "2023",
        endDate: "2026",
        description: "• Built reactive flows with publishers and subscribers\n• Led code reviews for the team",
      },
    ],
    skills: [{ name: "Swift" }],
    otherText: "English B2 . Spanish Native",
  }
  const auditDe = (tree: ResumeTree, over: Partial<AuditFacts> = {}): AuditFacts => ({
    bullets: tree.roles.flatMap((r) => r.bullets.map((b) => ({ id: b.id, hasActionVerb: true, hasResult: true, hasMethod: true }))),
    summary: { identity: true, proof: true, fit: true, extra: true },
    coverage: [],
    softCoverage: [],
    ...over,
  })

  it("lo que el CV dice en Idiomas cuenta: el filtro lee el documento entero", () => {
    const tree = buildTree(cvIos)
    const cov = coverageOf(specIos(), auditDe(tree), tree, buildTermIndex(termsOf(specIos(), tree)))
    expect(cov.find((c) => c.skill === "English")?.status).toBe("FOUND")
  })

  it("un FOUND del modelo sin el término escrito es IMPLIED, y un nombre fuera de la vacante no existe", () => {
    const tree = buildTree(cvIos)
    const linea = tree.roles[0].bullets[0].id
    const audit = auditDe(tree, {
      coverage: [
        { skill: "Combine", requirement: "MUST", status: "FOUND", evidenceNodeId: linea },
        { skill: "Kubernetes", requirement: "MUST", status: "FOUND", evidenceNodeId: linea },
      ],
    })
    const cov = coverageOf(specIos(), audit, tree, buildTermIndex(termsOf(specIos(), tree)))
    expect(cov.map((c) => c.skill)).toEqual(["English", "Combine", "Keychain"])
    expect(cov.find((c) => c.skill === "Combine")).toMatchObject({ status: "IMPLIED", evidenceNodeId: linea })
    expect(cov.find((c) => c.skill === "Keychain")?.status).toBe("NOT_FOUND")
  })

  it("las blandas se cuentan contra las que la vacante pide: nunca 5 de 3", () => {
    const tree = buildTree(cvIos)
    const spec = specIos({ softSignals: ["communication", "collaborate", "mentor"] })
    // Una viñeta real: el resumen afirma, no demuestra (`softCoverageOf`).
    const vineta = tree.roles[0].bullets[0].id
    const demostrada = (signal: string) => ({ signal, status: "DEMONSTRATED" as const, evidenceNodeId: vineta })
    const audit = auditDe(tree, {
      softCoverage: ["mentor", "lead code reviews", "crash rate", "improve app performance", "collaborate with product"].map(demostrada),
    })
    const soft = scoreResume(tree, spec, audit, {}).components.find((c) => c.key === "soft")!
    expect(soft.denominator).toBe(3)
    expect(soft.numerator).toBe(1)
  })

  it("un deseable nunca vale más por unidad que un obligatorio", () => {
    const tree = buildTree(cvIos)
    const muchos = Array.from({ length: 17 }, (_, i) => ({ skill: `Must${i}`, raw: `Must${i}`, years: null, category: null }))
    const pocos = Array.from({ length: 3 }, (_, i) => ({ skill: `Nice${i}`, raw: `Nice${i}`, years: null, category: null }))
    const s = scoreResume(tree, specIos({ mustHave: muchos, niceToHave: pocos }), auditDe(tree), {})
    const unidad = (k: "must" | "nice") => s.components.find((c) => c.key === k)!.gainPerUnit
    expect(unidad("nice")).toBeLessThanOrEqual(unidad("must") + 1e-9)
  })

  it("un año sin mes es un rango: 2015–2016 y 2017–2020 no dejan un hueco seguro", () => {
    const puestos = (a: [string, string], b: [string, string]) =>
      buildTree({
        workExperience: [
          { jobTitle: "B", employer: "B", startDate: b[0], endDate: b[1], description: "• Hice algo" },
          { jobTitle: "A", employer: "A", startDate: a[0], endDate: a[1], description: "• Hice algo" },
        ],
      })
    expect(readableChecks(puestos(["2015", "2016"], ["2017", "2020"])).trayectoria_continua).toBe(true)
    expect(readableChecks(puestos(["2021", "2022"], ["2022", "2023"])).trayectoria_continua).toBe(true)
    // Dos años enteros sin nada en medio sí es un hueco, lo mires como lo mires.
    expect(readableChecks(puestos(["2015", "2016"], ["2019", "2020"])).trayectoria_continua).toBe(false)
    // Con mes, la cuenta es exacta.
    expect(readableChecks(puestos(["2015-01", "2016-01"], ["2016-10", "2020-01"])).trayectoria_continua).toBe(false)
  })

  it("el remedio sale de la evidencia: con o sin cita lo escribe la IA, un dato del documento no tiene botón", () => {
    const tree = buildTree({
      ...cvIos,
      workExperience: [
        { ...cvIos.workExperience![0], startDate: "2015-01", endDate: "2016-01" },
        { ...cvIos.workExperience![0], employer: "Otra", startDate: "2019-01", endDate: "2020-01" },
      ],
    })
    const linea = tree.roles[0].bullets[0].id
    const spec = specIos()
    const audit = auditDe(tree, { coverage: [{ skill: "Combine", requirement: "MUST", status: "IMPLIED", evidenceNodeId: linea }] })
    const index = buildTermIndex(termsOf(spec, tree))
    const hallazgos = findingsOf(tree, audit, scoreResume(tree, spec, audit, readableChecks(tree)), index, spec)
    const deTermino = (t: string) => hallazgos.find((f) => f.type === "missing_requirement" && f.detail.includes(t))!
    // Sin ninguna línea que lo sostenga NO se escribe (CEO, 2026-09-28: «no quiero
    // errores de información»): la tarjeta lo informa, con su sujeto, sin botón.
    expect(deTermino("Keychain")).toMatchObject({ remedy: "none", subject: "Keychain" })
    expect(deTermino("Keychain").detail).toBe(`${SIN_RESPALDO}:Keychain`)
    expect(deTermino("Combine")).toMatchObject({ remedy: "rewrite", nodeId: linea })
  })

  it("un chequeo del documento no tiene botón de IA: el de fechas reescribía el resumen", async () => {
    const raw: RawResume = {
      ...RAW,
      workExperience: [
        { ...RAW.workExperience![0], startDate: "2019-01", endDate: "2020-01" },
        { ...RAW.workExperience![0], employer: "Otro", startDate: "2015-01", endDate: "2016-01" },
      ],
    }
    const gen = runAnalysis({ raw, jdText: "Buscamos cajera con arqueo", language: "es", resumeId: "cv", model: "m", ai: new CountingAi(), store: new MemoryStore() })
    let hallazgos: { type: string; remedy: string }[] = []
    for (let out = await gen.next(); !out.done; out = await gen.next()) if (out.value.act === "findings") hallazgos = out.value.findings
    expect(hallazgos.find((f) => f.type === "parse_risk")?.remedy).toBe("none")
  })

  it("escribir el requisito que faltaba MUEVE el puntaje al aceptar", () => {
    const tree = buildTree(cvIos)
    const spec = specIos()
    const audit = auditDe(tree)
    const linea = tree.roles[0].bullets[0]
    const r = applySuggestion(
      tree,
      {
        bulletId: linea.id, changed: true, text: "Built reactive flows with Combine publishers and subscribers",
        actionVerb: "Built", keywordsUsed: ["Combine"], claim: "", metricType: null, placeholders: [],
        variantWithoutMetric: null, measurableAspect: null, declineBasis: null,
        basedOnHash: linea.hash, originalText: linea.text,
      },
      spec,
      audit,
      {},
      openLedger(tree, spec, new Set()),
    )
    expect(r.ok).toBe(true)
    expect(r.delta).toBeGreaterThan(0)
  })

  it("las viñetas que la auditoría no juzgó se piden otra vez, sólo ésas, en la misma petición", async () => {
    const ai = new CountingAi()
    const vistas: number[] = []
    ai.audit = async (tree: ResumeTree) => {
      ai.audits++
      const todas = tree.roles.flatMap((r) => r.bullets)
      vistas.push(todas.length)
      // La primera vez sólo contesta por la primera línea.
      const juzgadas = ai.audits === 1 ? todas.slice(0, 1) : todas
      return { ...fakeAudit(tree), bullets: juzgadas.map((b) => ({ id: b.id, hasActionVerb: true, hasResult: true, hasMethod: true })) }
    }
    const { telemetry, acts } = await analyze(ai, new MemoryStore())
    expect(vistas).toEqual([2, 1])
    expect(telemetry.calls).toBe(3) // vacante, auditoría y la vuelta por la que faltó
    const puntaje = acts.find((a) => a.act === "score") as { audit: AuditFacts }
    expect(puntaje.audit.bullets).toHaveLength(2)
  })
})

describe("el plan de habilidades no duplica lo que otra sección ya dice", () => {
  it("un término que está en Idiomas o en una certificación no se agrega a Habilidades; uno que una línea demuestra, sí", () => {
    const spec = { ...SPEC, mustHave: [
      { skill: "English", raw: "English", years: null, category: null },
      { skill: "Agile", raw: "Agile", years: null, category: null },
    ], niceToHave: [] } as JobSpec
    const audit = { ...fakeAudit(), coverage: [
      { skill: "English", requirement: "MUST" as const, status: "FOUND" as const, evidenceNodeId: null },
      { skill: "Agile", requirement: "MUST" as const, status: "FOUND" as const, evidenceNodeId: "b_linea" },
    ] }
    expect(skillPlan(["Swift"], spec, audit, {}).add).toEqual(["Agile"])
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

describe("una credencial se tiene: no se redacta como viñeta ni se agrega a Habilidades", () => {
  const spec = { ...SPEC, mustHave: [
    { skill: "Licencia de conducir B", raw: "Licencia de conducir categoría B", years: null, category: null, kind: "credential" as const },
    { skill: "Salesforce", raw: "Salesforce", years: null, category: null, kind: "capability" as const },
  ], niceToHave: [] } as JobSpec

  it("sin rastro, la credencial sale sin botón de IA y la capacidad la escribe la IA", () => {
    const tree = buildTree(RAW)
    const audit = { ...fakeAudit(tree), coverage: [] }
    const index = buildTermIndex(termsOf(spec, tree))
    const hallazgos = findingsOf(tree, audit, scoreResume(tree, spec, audit, readableChecks(tree)), index, spec)
    expect(hallazgos.find((f) => f.subject === "Licencia de conducir B")?.remedy).toBe("none")
    // Salesforce no aparece en ninguna viñeta: se informa, no se inventa.
    expect(hallazgos.find((f) => f.type === "missing_requirement" && f.detail.includes("Salesforce"))?.remedy).toBe("none")
  })

  it("una capacidad que una viñeta sostiene la escribe la IA en esa viñeta", () => {
    const tree = buildTree({ ...RAW, workExperience: [{ jobTitle: "Vendedor", employer: "X", startDate: "2020-01", endDate: "2023-01", description: "• Registré las oportunidades de venta en el CRM de Salesforce del equipo" }] })
    const spec2 = { ...spec, mustHave: [{ skill: "Salesforce CRM", raw: "Salesforce CRM", years: null, category: null, kind: "capability" as const }] } as JobSpec
    const audit = { ...fakeAudit(tree), coverage: [{ skill: "Salesforce CRM", requirement: "MUST" as const, status: "IMPLIED" as const, evidenceNodeId: tree.roles[0].bullets[0].id }] }
    const index = buildTermIndex(termsOf(spec2, tree))
    const hallazgos = findingsOf(tree, audit, scoreResume(tree, spec2, audit, readableChecks(tree)), index, spec2)
    const f = hallazgos.find((x) => x.merged.includes("missing_requirement"))
    expect(f).toMatchObject({ remedy: "rewrite", nodeId: tree.roles[0].bullets[0].id })
  })

  it("demostrada en una línea, una credencial NO entra a Habilidades; una capacidad sí", () => {
    const audit = { ...fakeAudit(), coverage: [
      { skill: "Licencia de conducir B", requirement: "MUST" as const, status: "IMPLIED" as const, evidenceNodeId: "b1" },
      { skill: "Salesforce", requirement: "MUST" as const, status: "IMPLIED" as const, evidenceNodeId: "b1" },
    ] }
    expect(skillPlan(["Excel"], spec, audit, {}).add).toEqual(["Salesforce"])
  })
})


/**
 * UN JUICIO SÓLO CAMBIA SI CAMBIÓ EL TEXTO QUE LO SOSTIENE (CEO, 2026-09-28).
 *
 * Medido en local: con la misma vacante y dos líneas agregadas, 8 de 42 viñetas
 * que nadie tocó cambiaron de juicio y las tarjetas pasaron de 3 a 12.
 */
describe("lo que no cambió conserva su juicio", () => {
  const conLineaNueva: RawResume = {
    ...RAW,
    workExperience: [{ ...RAW.workExperience![0], description: `${RAW.workExperience![0].description}\n• Controlé el inventario del depósito` }],
  }
  const juicio = (tree: ResumeTree, ejes: boolean, cov: AuditFacts["coverage"][number]["status"], cita: string | null): AuditFacts => ({
    ...fakeAudit(),
    bullets: tree.roles[0].bullets.map((b) => ({ id: b.id, hasActionVerb: true, hasResult: ejes, hasMethod: ejes })),
    coverage: [{ skill: "Inventario", requirement: "NICE", status: cov, evidenceNodeId: cita }],
  })

  it("una viñeta intacta no cambia de ejes aunque el modelo diga otra cosa", () => {
    const antes = buildTree(RAW)
    const primero = fijarJuicios(antes, juicio(antes, true, "NOT_FOUND", null), JUICIOS_VACIOS, "jd")
    const despues = buildTree(conLineaNueva)
    const segundo = fijarJuicios(despues, juicio(despues, false, "NOT_FOUND", null), primero.juicios, "jd")
    const vieja = despues.roles[0].bullets[0].id
    const nueva = despues.roles[0].bullets[2].id
    expect(segundo.audit.bullets.find((b) => b.id === vieja)?.hasResult).toBe(true)
    // La línea nueva recibe el juicio de hoy: no hay nada que respetar.
    expect(segundo.audit.bullets.find((b) => b.id === nueva)?.hasResult).toBe(false)
  })

  it("un requisito faltante no pasa a implícito citando una línea VIEJA; citando una nueva, sí", () => {
    const antes = buildTree(RAW)
    const primero = fijarJuicios(antes, juicio(antes, true, "NOT_FOUND", null), JUICIOS_VACIOS, "jd")
    const despues = buildTree(conLineaNueva)
    const vieja = despues.roles[0].bullets[0].id
    const nueva = despues.roles[0].bullets[2].id
    expect(fijarJuicios(despues, juicio(despues, true, "IMPLIED", vieja), primero.juicios, "jd").audit.coverage[0].status).toBe("NOT_FOUND")
    expect(fijarJuicios(despues, juicio(despues, true, "IMPLIED", nueva), primero.juicios, "jd").audit.coverage[0].status).toBe("IMPLIED")
  })

  it("la línea que escribió Tailor hereda los ejes de la que reemplazó y no descubre requisitos", () => {
    const antes = buildTree(RAW)
    const primero = fijarJuicios(antes, juicio(antes, true, "NOT_FOUND", null), JUICIOS_VACIOS, "jd")
    const vieja = antes.roles[0].bullets[0]
    const escrita = `${vieja.text} en [n] releases`
    const despues = buildTree({ ...RAW, workExperience: [{ ...RAW.workExperience![0], description: RAW.workExperience![0].description!.replace(vieja.text, escrita) }] })
    const nueva = despues.roles[0].bullets.find((b) => b.text === escrita)!.id
    const log = [{ findingId: "f", nodeId: vieja.id, nodeHashAtResolution: nodeHash(escrita), resolvedBy: "AI_SUGGESTION" as const, resolvedAt: "", kind: "applied" as const, before: vieja.text, after: escrita }]
    const segundo = fijarJuicios(despues, juicio(despues, false, "IMPLIED", nueva), primero.juicios, "jd", log)
    expect(segundo.audit.bullets.find((b) => b.id === nueva)?.hasResult).toBe(true)
    expect(segundo.audit.coverage[0].status).toBe("NOT_FOUND")
    // Sin el registro, la misma línea es de la persona: juicio de hoy.
    const sinLog = fijarJuicios(despues, juicio(despues, false, "IMPLIED", nueva), primero.juicios, "jd")
    expect(sinLog.audit.bullets.find((b) => b.id === nueva)?.hasResult).toBe(false)
    expect(sinLog.audit.coverage[0].status).toBe("IMPLIED")
  })

  it("tampoco descubre requisitos si la auditoría anterior no los juzgó", () => {
    const antes = buildTree(RAW)
    const primero = fijarJuicios(antes, { ...juicio(antes, true, "NOT_FOUND", null), coverage: [] }, JUICIOS_VACIOS, "jd")
    const vieja = antes.roles[0].bullets[0]
    const escrita = `${vieja.text} en [n] releases`
    const despues = buildTree({ ...RAW, workExperience: [{ ...RAW.workExperience![0], description: RAW.workExperience![0].description!.replace(vieja.text, escrita) }] })
    const nueva = despues.roles[0].bullets.find((b) => b.text === escrita)!.id
    const log = [{ findingId: "f", nodeId: vieja.id, nodeHashAtResolution: nodeHash(escrita), resolvedBy: "AI_SUGGESTION" as const, resolvedAt: "", kind: "applied" as const, before: vieja.text, after: escrita }]
    expect(fijarJuicios(despues, juicio(despues, true, "IMPLIED", nueva), primero.juicios, "jd", log).audit.coverage[0].status).toBe("NOT_FOUND")
  })

  it("una cita al resumen queda fijada como cualquier otra", () => {
    const tree = buildTree(RAW)
    const primero = fijarJuicios(tree, juicio(tree, true, "IMPLIED", tree.summary.id), JUICIOS_VACIOS, "jd")
    const otra = fijarJuicios(tree, juicio(tree, true, "IMPLIED", tree.roles[0].bullets[0].id), primero.juicios, "jd")
    expect(otra.audit.coverage[0].evidenceNodeId).toBe(tree.summary.id)
  })

  it("el análisis guarda los juicios y los respeta en la corrida siguiente", async () => {
    const store = new MemoryStore()
    await analyze(new CountingAi(), store)
    expect([...(store as unknown as { rows: Map<string, unknown> }).rows.keys()].some((k) => k.startsWith("ats3-lock:"))).toBe(true)
  })
})

/**
 * LO QUE UN ATS NECESITA Y EL MOTOR NO MIRABA (CEO, 2026-09-28): los años que
 * pide el aviso, cómo contactarte, las frases hechas y el largo de cada puesto.
 * Todo medido por el código sobre el CV: cero llamadas.
 */
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
    const f = findingsOf(t, fakeAudit(), score, buildTermIndex(termsOf(spec, t)), spec).find((x) => x.type === "years_short")
    expect(f?.remedy).toBe("none")
    expect(f?.detail).toBe("anios:3/5")
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

  it("una frase hecha y un puesto con más viñetas de las que se leen tienen su tarjeta", () => {
    const lineas = ["Team player en el equipo de caja", "Atendí la caja", "Cobré", "Ordené", "Repuse", "Conté", "Cerré"]
    const t = cv([{ desde: "2021-01", hasta: "2023-12", lineas }])
    const score = scoreResume(t, SPEC, fakeAudit(), {})
    const fs = findingsOf(t, fakeAudit(), score, buildTermIndex(termsOf(SPEC, t)), SPEC)
    expect(fs.some((f) => f.merged.includes("cliche") && f.nodeId === t.roles[0].bullets[0].id)).toBe(true)
    const largo = fs.find((f) => f.type === "role_too_long")
    // Con la empresa: tres puestos pueden llamarse igual y la tarjeta tiene que decir cuál.
    expect(largo?.detail).toBe("largo:Puesto 0 — E0/7/6")
  })
})


/**
 * CÓMO LO ESCRIBE EL CV: lo decide la auditoría, el código sólo comprueba que
 * el texto exista (CEO, 2026-09-28: «la IA debería saber todo esto»).
 */
describe("lo que el CV escribe distinto cuenta según lo que la auditoría reconoció", () => {
  const cv = buildTree({ ...RAW, skills: [{ name: "CoreData" }, { name: "Git" }, { name: "Objetive-C" }] })
  const spec = { ...SPEC, mustHave: [
    { skill: "Core Data", raw: "Core Data", years: null, category: null },
    { skill: "version control", raw: "version control", years: null, category: null },
    { skill: "Objective-C", raw: "Objective-C", years: null, category: null },
    { skill: "Kotlin", raw: "Kotlin", years: null, category: null },
  ], niceToHave: [] } as JobSpec
  const juicio = (inventa = false): AuditFacts => ({ ...fakeAudit(cv), coverage: [
    { skill: "Core Data", requirement: "MUST", status: "FOUND", evidenceNodeId: null, cvWording: "CoreData", match: "SAME" },
    { skill: "version control", requirement: "MUST", status: "IMPLIED", evidenceNodeId: null, cvWording: "Git", match: "EQUIVALENT" },
    { skill: "Objective-C", requirement: "MUST", status: "NOT_FOUND", evidenceNodeId: null, cvWording: "Objetive-C", match: "MISSPELLED" },
    { skill: "Kotlin", requirement: "MUST", status: "FOUND", evidenceNodeId: null, cvWording: inventa ? "Kotlin Multiplatform" : null, match: inventa ? "SAME" : null },
  ] })

  it("SAME entra como forma del requisito y cuenta escrito; EQUIVALENT es implícito sin tarjeta; MISSPELLED avisa", () => {
    const s2 = conFormasDelCv(spec, juicio(), cv)
    const index = buildTermIndex(termsOf(s2, cv))
    const cob = coverageOf(s2, juicio(), cv, index)
    const de = (k: string) => cob.find((c) => c.skill === k)!
    expect(de("Core Data").status).toBe("FOUND")
    expect(de("version control").status).toBe("IMPLIED")
    expect(de("Objective-C").status).toBe("NOT_FOUND")
    expect(de("Kotlin").status).toBe("NOT_FOUND")
    const audit = { ...juicio(), coverage: cob }
    const hallazgos = findingsOf(cv, audit, scoreResume(cv, s2, audit, readableChecks(cv)), index, s2)
    const req = (k: string) => hallazgos.find((f) => f.type === "missing_requirement" && f.subject === k)
    expect(req("version control")).toBeUndefined()
    expect(req("Objective-C")?.detail).toBe(`${MAL_ESCRITO}:Objetive-C`)
    expect(req("Kotlin")?.detail).toBe(`${SIN_RESPALDO}:Kotlin`)
    expect(skillPlan(cv.declaredSkills, s2, audit, {}).add).toContain("version control")
  })

  it("lo reconocido queda fijado aunque el análisis siguiente conteste distinto", () => {
    const primero = fijarJuicios(cv, juicio(), JUICIOS_VACIOS, "jd")
    const olvida = { ...juicio(), coverage: juicio().coverage.map((c) => ({ ...c, cvWording: null, match: null })) }
    const segundo = fijarJuicios(cv, olvida, primero.juicios, "jd")
    expect(segundo.audit.coverage.find((c) => c.skill === "Core Data")).toMatchObject({ cvWording: "CoreData", match: "SAME" })
  })

  it("un texto que el CV no tiene no se acepta aunque la auditoría lo diga", () => {
    const s2 = conFormasDelCv(spec, juicio(true), cv)
    expect(s2.mustHave.find((r) => r.skill === "Kotlin")).not.toHaveProperty("cvForms")
  })
})


describe("la cifra se pide una vez por línea", () => {
  it("una línea que Tailor escribió sin número no vuelve a pedir el tamaño", () => {
    const tree = buildTree(RAW)
    const audit = { ...fakeAudit(tree), bullets: tree.roles[0].bullets.map((b) => ({ id: b.id, hasActionVerb: true, hasResult: true, hasMethod: true })) }
    const score = scoreResume(tree, SPEC, audit, readableChecks(tree))
    const index = buildTermIndex(termsOf(SPEC, tree))
    const linea = tree.roles[0].bullets[0].id
    const cifra = (ya?: Set<string>) => findingsOf(tree, audit, score, index, SPEC, ya).some((f) => f.nodeId === linea && f.merged.includes("no_metric"))
    expect(cifra()).toBe(true)
    expect(cifra(new Set([linea]))).toBe(false)
  })
})


describe("una alternativa del aviso es un solo requisito", () => {
  it("«Scrum | Kanban» se cumple con cualquiera de las dos", () => {
    const tree = buildTree({ ...RAW, skills: [{ name: "Kanban" }] })
    const spec = { ...SPEC, mustHave: [{ skill: "Scrum | Kanban", raw: "Scrum or Kanban", years: null, category: null }], niceToHave: [] } as JobSpec
    const cob = coverageOf(spec, fakeAudit(tree), tree, buildTermIndex(termsOf(spec, tree)))
    expect(cob[0].status).toBe("FOUND")
  })
})


describe("el código descarta lo que la auditoría no puede tener razón", () => {
  const cv = "Skills: CoreData, Git, Objetive-C, Exel, JavaScript básico, SwiftUI, cajas registradoras, SOLID design principles, Atención al público"
  it.each([
    ["Objective-C", "Objetive-C", "MISSPELLED", true],
    ["Microsoft Excel", "Exel", "MISSPELLED", true],
    ["Java", "JavaScript básico", "MISSPELLED", false],
    ["Java", "JavaScript básico", "EQUIVALENT", false],
    ["Swift", "SwiftUI", "SAME", false],
    ["Core Data", "CoreData", "SAME", true],
    ["caja registradora", "cajas registradoras", "SAME", true],
    ["version control", "Git", "EQUIVALENT", true],
    ["SOLID principles", "SOLID design principles", "SAME", true],
    ["Kotlin", "Kotlin Multiplatform", "SAME", false],
    ["Kotlin", "Kotlin", "SAME", false],
  ])("%s ← «%s» (%s) → %s", (req, dice, match, ok) => {
    expect(formaPosible(req, dice, match, match === "SAME" && dice === "Kotlin" ? "sin eso" : cv)).toBe(ok)
  })
})
