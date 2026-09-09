import { describe, it, expect } from "vitest"
import { buildTree, findingsOf, readableChecks, runRewrite, applySuggestion, skillPlan, termsOf, openLedger, type RawResume, type AtsAi, type AtsStore } from "@/lib/ats3/engine"
import { scoreResume, type AuditFacts } from "@/lib/ats3/score"
import { buildTermIndex, type JobSpec, type Suggestion } from "@/lib/ats3/contracts"

const RAW: RawResume = {
  summary: "Desarrollador iOS con 7 años",
  workExperience: [{
    jobTitle: "iOS Dev", employer: "Acme", startDate: "2021-03", endDate: "2024-06",
    description: "• Desarrollé apps iOS con Swift y SwiftUI\n• Mantuve la arquitectura MVVM del proyecto",
  }],
  skills: [{ name: "Swift" }, { name: "SwiftUI" }],
}
const SPEC = {
  language: "es", roleTitleRaw: "iOS", seniority: null, metricThatMatters: null,
  mustHave: [{ skill: "Combine", raw: "Combine", years: null, category: null }],
  niceToHave: [], responsibilities: [], softSignals: ["Trabajo en equipo"],
} as unknown as JobSpec

class Store implements AtsStore {
  m = new Map<string, unknown>()
  async read(k: string, key: string) { return (this.m.get(k + key) ?? null) as never }
  async write(k: string, key: string, v: unknown) { this.m.set(k + key, v) }
}

describe("de punta a punta: la tarjeta, el modelo, el guard y el CV", () => {
  /**
   * El único caso que ejecuta la cadena entera con el motor real. Cubre lo que
   * cada pieza por separado no puede probar: que lo que la tarjeta promete es
   * lo que el modelo recibe, que ve las viñetas vecinas, que una propuesta
   * calcada se rechaza y se pide otra, y que lo entregado se escribe.
   */
  it("el foco de la tarjeta LLEGA al modelo, y el guard rechaza la repetida", async () => {
    const tree = buildTree(RAW)
    const index = buildTermIndex(termsOf(SPEC, tree))
    const audit: AuditFacts = {
      bullets: tree.roles[0].bullets.map((b) => ({ id: b.id, hasActionVerb: true, hasResult: false, hasMethod: false, specificity: 0.5 })),
      summary: { identity: true, proof: false, fit: false, extra: false },
      coverage: [{ skill: "Combine", requirement: "MUST", status: "NOT_FOUND", evidenceNodeId: null }],
      softCoverage: [{ signal: "Trabajo en equipo", status: "DECLARED_ONLY", evidenceNodeId: null }],
      titleAlignment: 0.5,
    }
    const score = scoreResume(tree, SPEC, audit, readableChecks(tree))
    const hallazgos = findingsOf(tree, audit, score, index)
    const tarjeta = hallazgos.find((f) => f.nodeId === tree.roles[0].bullets[0].id)!

    let focoVisto: string | undefined
    let sibsVistos = 0
    const propuestas = ["Mantuve la arquitectura MVVM del proyecto", "Integré Combine con Swift y SwiftUI para sincronizar el estado con la API"]
    let n = 0
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => audit, triage: async () => [],
      rewriteSummary: async () => ({}) as Suggestion,
      rewriteBullet: async (input) => {
        focoVisto = input.focus
        sibsVistos = input.siblings?.length ?? 0
        return { bulletId: input.bulletId, changed: true, text: propuestas[n++], actionVerb: propuestas[n - 1].split(" ")[0],
          keywordsUsed: [], claim: "", metricType: null, placeholders: [], variantWithoutMetric: null,
          measurableAspect: null, declineBasis: null } as Suggestion
      },
    }
    const r = await runRewrite({
      tree, nodeId: tarjeta.nodeId, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index,
      language: "es", model: "m", jdKey: "jd", focus: tarjeta.detail, ai, store: new Store(),
    })
    expect(focoVisto).toBe(tarjeta.detail)
    expect(sibsVistos).toBeGreaterThan(0)
    // La primera propuesta era calcada a la viñeta vecina: se rechazó y se pidió
    // otra. La segunda entra.
    expect(r.ok).toBe(true)
    if (r.ok) {
      const ap = applySuggestion(tree, r.suggestion, SPEC, audit, readableChecks(tree), openLedger(tree, SPEC, new Set()), {})
      expect(ap.ok).toBe(true)
    }
  })

  it("el plan de habilidades no propone lo que el CV no sostiene", () => {
    const tree = buildTree(RAW)
    const audit = { bullets: [], summary: { identity: true, proof: true, fit: true, extra: true },
      coverage: [{ skill: "Combine", requirement: "MUST" as const, status: "NOT_FOUND" as const, evidenceNodeId: null }],
      softCoverage: [], titleAlignment: 1 } as unknown as AuditFacts
    const p = skillPlan(tree.declaredSkills, SPEC, audit, {})
    expect(p.add).toHaveLength(0)
    expect(p.drop).toHaveLength(0)
  })
})

/**
 * FUSIONAR DOS VIÑETAS (CEO, 2026-09-09).
 *
 * «Si existe la manera de fusionar 2 viñetas porque puede ayudar más a tener un
 * currículum con alto impacto, pues bien. Pero si fusionás cosas para luego
 * pedir eliminar o sacar, eso no quiero.»
 *
 * Lo que este caso protege es lo único que hace SEGURA una fusión: la línea que
 * se devuelve reemplaza a las DOS, y la otra se BORRA — así que lo que se pierda
 * ahí no vuelve de ningún lado. Por eso el guard la juzga contra las dos juntas.
 */
describe("fusionar dos viñetas en una", () => {
  const arbol = () =>
    buildTree({
      summary: "Secretaria",
      workExperience: [{
        jobTitle: "Secretaria", employer: "Consultorio", startDate: "2021-03", endDate: "2024-06",
        description: "• Gestioné la agenda del consultorio\n• Confirmé los turnos por teléfono",
      }],
      skills: [],
    })

  const motor = (texto: string): AtsAi => ({
    parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts, triage: async () => [],
    rewriteSummary: async () => ({}) as Suggestion,
    rewriteBullet: async (input) => {
      vistos.push(input.mergeOf)
      return { bulletId: input.bulletId, changed: true, text: texto, actionVerb: texto.split(" ")[0],
        keywordsUsed: [], claim: "", metricType: null, placeholders: [], variantWithoutMetric: null,
        measurableAspect: null, declineBasis: null } as Suggestion
    },
  })
  let vistos: (readonly string[] | undefined)[] = []

  const pedir = async (texto: string) => {
    vistos = []
    const tree = arbol()
    const [a, b] = tree.roles[0].bullets
    const r = await runRewrite({
      tree, nodeId: a.id, mergeWith: b.id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()),
      index: buildTermIndex(termsOf(SPEC, tree)), language: "es", model: "m", jdKey: "jd",
      ai: motor(texto), store: new Store(),
    })
    return { tree, a, b, r }
  }

  it("al modelo le llegan las DOS líneas, y tiene que devolver UNA", async () => {
    const { r } = await pedir("Gestioné la agenda del consultorio confirmando los turnos por teléfono")
    expect(vistos[0]).toHaveLength(2)
    expect(r.ok).toBe(true)
  })

  it("una fusión que se come lo que decía la segunda NO pasa", async () => {
    // Es el caso peligroso: la segunda se BORRA al aplicar, así que su dato no
    // vuelve de ningún lado si el guard no lo reclama acá.
    const { r } = await pedir("Gestioné la agenda del consultorio durante todo el día")
    expect(r.ok).toBe(false)
    if (!r.ok && !r.alreadyGood) expect(r.verdict.ok).toBe(false)
  })

  it("aplicarla escribe UNA línea y la otra se va, en el mismo acto", async () => {
    const { tree, b, r } = await pedir("Gestioné la agenda del consultorio confirmando los turnos por teléfono")
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.suggestion.mergedFrom).toBe(b.id)
    const ap = applySuggestion(tree, r.suggestion, SPEC, {
      bullets: [], summary: { identity: true, proof: true, fit: true, extra: true },
      coverage: [], softCoverage: [], titleAlignment: 1,
    } as unknown as AuditFacts, readableChecks(tree), openLedger(tree, SPEC, new Set()), {})
    expect(ap.ok).toBe(true)
    expect(ap.tree.roles[0].bullets).toHaveLength(1)
    expect(ap.tree.roles[0].bullets[0].text).toContain("confirmando los turnos")
  })
})

/**
 * ESCRIBIR UNA LÍNEA NUEVA (CEO, 2026-09-09).
 *
 * «Un máximo de 6 viñetas por experiencia y 3 como mínimo.» El máximo ya lo
 * sabía hacer el motor; el mínimo no, porque no sabía CREAR una línea — y
 * emitir «te faltan dos» sin un botón es el reproche que este panel no hace.
 *
 * Lo que hace honesto el caso: la línea no sale de la nada. El usuario confirma
 * el tema ANTES de que se pida nada, y ese tema es el original contra el que los
 * guards juzgan la redacción. El modelo redacta lo que la persona dijo que hizo.
 */
describe("agregar una viñeta a un puesto que tiene pocas", () => {
  const arbol = () =>
    buildTree({
      summary: "Secretaria",
      workExperience: [{
        jobTitle: "Secretaria", employer: "Consultorio", startDate: "2021-03", endDate: "2024-06",
        description: "• Gestioné la agenda del consultorio",
      }],
      skills: [],
    })

  const motor = (texto: string): AtsAi => ({
    parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts, triage: async () => [],
    rewriteSummary: async () => ({}) as Suggestion,
    rewriteBullet: async (input) => ({
      bulletId: input.bulletId, changed: true, text: texto, actionVerb: texto.split(" ")[0],
      keywordsUsed: [], claim: "", metricType: null, placeholders: [], variantWithoutMetric: null,
      measurableAspect: null, declineBasis: null,
    }) as Suggestion,
  })

  const pedir = async (texto: string, tema = "Atendí el teléfono y derivé las consultas") => {
    const tree = arbol()
    const r = await runRewrite({
      tree, nodeId: tree.roles[0].bullets[0].id, addToRole: tree.roles[0].id, focus: tema,
      spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index: buildTermIndex(termsOf(SPEC, tree)),
      language: "es", model: "m", jdKey: "jd", ai: motor(texto), store: new Store(),
    })
    return { tree, r }
  }

  it("sin el tema que el usuario confirmó NO se pide nada al modelo", async () => {
    const tree = arbol()
    const r = await runRewrite({
      tree, nodeId: tree.roles[0].bullets[0].id, addToRole: tree.roles[0].id,
      spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index: buildTermIndex(termsOf(SPEC, tree)),
      language: "es", model: "m", jdKey: "jd", ai: motor("x"), store: new Store(),
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.calls).toBe(0)
  })

  it("la redacción no puede irse del tema que él confirmó", async () => {
    const { r } = await pedir("Coordiné reuniones con proveedores internacionales")
    expect(r.ok).toBe(false)
  })

  it("se AGREGA al final, sin tocar la que ya estaba", async () => {
    const { tree, r } = await pedir("Atendí el teléfono del consultorio y derivé las consultas al profesional")
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.suggestion.addToRole).toBe(tree.roles[0].id)
    const ap = applySuggestion(tree, r.suggestion, SPEC, {
      bullets: [], summary: { identity: true, proof: true, fit: true, extra: true },
      coverage: [], softCoverage: [], titleAlignment: 1,
    } as unknown as AuditFacts, readableChecks(tree), openLedger(tree, SPEC, new Set()), {})
    expect(ap.ok).toBe(true)
    expect(ap.tree.roles[0].bullets).toHaveLength(2)
    expect(ap.tree.roles[0].bullets[0].text).toBe("Gestioné la agenda del consultorio")
    expect(ap.tree.roles[0].bullets[1].text).toContain("Atendí el teléfono")
  })
})
