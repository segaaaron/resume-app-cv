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
    }
    const score = scoreResume(tree, SPEC, audit, readableChecks(tree))
    const hallazgos = findingsOf(tree, audit, score, index)
    const tarjeta = hallazgos.find((f) => f.nodeId === tree.roles[0].bullets[0].id)!

    let focoVisto: string | undefined
    let sibsVistos = 0
    const propuestas = ["Mantuve la arquitectura MVVM del proyecto", "Integré Combine con Swift y SwiftUI para sincronizar el estado con la API"]
    let n = 0
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => audit,
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
    const audit = { coverage: [{ skill: "Combine", requirement: "MUST" as const, status: "NOT_FOUND" as const, evidenceNodeId: null }],
      softCoverage: []} as unknown as AuditFacts
    const p = skillPlan(tree.declaredSkills, SPEC, audit, {})
    expect(p.add).toHaveLength(0)
    expect(p.leaving).toHaveLength(0)
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
    parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
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

  it("si la redacción se va del tema que él confirmó, se pide UNA vez más y llega igual", async () => {
    const tree = arbol()
    const ai = motor("Coordiné reuniones con proveedores internacionales")
    const nudges: string[] = []
    const base = ai.rewriteBullet
    ai.rewriteBullet = async (input) => {
      nudges.push(input.nudge ?? "")
      return base(input)
    }
    const r = await runRewrite({
      tree, nodeId: tree.roles[0].bullets[0].id, addToRole: tree.roles[0].id, focus: "Atendí el teléfono y derivé las consultas",
      spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index: buildTermIndex(termsOf(SPEC, tree)),
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    expect(nudges).toHaveLength(2)
    expect(nudges[1]).toMatch(/tel[eé]fono/)
    expect(r.ok).toBe(true)
  })

  it("se AGREGA al final, sin tocar la que ya estaba", async () => {
    const { tree, r } = await pedir("Atendí el teléfono del consultorio y derivé las consultas al profesional")
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.suggestion.addToRole).toBe(tree.roles[0].id)
    const ap = applySuggestion(tree, r.suggestion, SPEC, {
      bullets: [], summary: { identity: true, proof: true, fit: true, extra: true },
      coverage: [], softCoverage: [],    } as unknown as AuditFacts, readableChecks(tree), openLedger(tree, SPEC, new Set()), {})
    expect(ap.ok).toBe(true)
    expect(ap.tree.roles[0].bullets).toHaveLength(2)
    expect(ap.tree.roles[0].bullets[0].text).toBe("Gestioné la agenda del consultorio")
    expect(ap.tree.roles[0].bullets[1].text).toContain("Atendí el teléfono")
  })
})


/**
 * LO QUE LA TARJETA PROMETIÓ ESCRIBIR TIENE QUE ESTAR ESCRITO (2026-09-28).
 * Medido en Chrome: la tarjeta del cargo devolvió un resumen sin el cargo.
 */
describe("la reescritura escribe lo que la tarjeta prometió", () => {
  it("si falta el término se pide una vez más nombrándolo, y se entrega la que lo escribe", async () => {
    const tree = buildTree(RAW)
    const index = buildTermIndex(termsOf(SPEC, tree))
    const textos = ["Desarrollé apps iOS con Swift y SwiftUI para el equipo", "Desarrollé apps iOS con Swift, SwiftUI y Combine para el equipo"]
    let n = 0
    let pedido = ""
    let primera: string[] | undefined
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteSummary: async () => ({}) as Suggestion,
      rewriteBullet: async (input) => {
        if (n === 0) primera = input.mustWrite
        pedido = input.nudge ?? pedido
        const text = textos[Math.min(n++, 1)]
        return { bulletId: input.bulletId, changed: true, text, actionVerb: "Desarrollé", keywordsUsed: [], claim: "", metricType: null,
          placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null } as Suggestion
      },
    }
    const r = await runRewrite({
      tree, nodeId: tree.roles[0].bullets[0].id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index,
      language: "es", model: "m", jdKey: "jd", focus: "Combine", mustWrite: ["Combine"], ai, store: new Store(),
    })
    // La promesa viaja en la PRIMERA llamada, no recién en la corrección.
    expect(primera).toEqual(["Combine"])
    expect(pedido).toContain("«Combine»")
    expect(r.ok && r.suggestion.text).toContain("Combine")
  })
})

describe("arreglar una línea no crea una repetición en otra", () => {
  it("si la propuesta abre con el verbo de otra viñeta, se pide otra que no lo repita", async () => {
    const tree = buildTree(RAW)
    const index = buildTermIndex(termsOf(SPEC, tree))
    // La otra viñeta abre con «Mantuve»: la primera propuesta lo repite.
    const textos = ["Mantuve apps iOS con Swift y SwiftUI para el equipo de producto", "Construí apps iOS con Swift y SwiftUI para el equipo de producto"]
    let n = 0
    let pedido = ""
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteSummary: async () => ({}) as Suggestion,
      rewriteBullet: async (input) => {
        pedido = input.nudge ?? pedido
        const text = textos[Math.min(n++, 1)]
        return { bulletId: input.bulletId, changed: true, text, actionVerb: text.split(" ")[0], keywordsUsed: [], claim: "", metricType: null,
          placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null } as Suggestion
      },
    }
    const r = await runRewrite({
      tree, nodeId: tree.roles[0].bullets[0].id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index,
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    expect(pedido).toContain("«Mantuve»")
    expect(r.ok && r.suggestion.text.startsWith("Construí")).toBe(true)
  })
})

describe("la línea nueva no abre con una tarea", () => {
  it("«Apoyé…» vuelve a pedirse diciendo qué falló, y gana la que abre con lo hecho", async () => {
    const tree = buildTree(RAW)
    const index = buildTermIndex(termsOf(SPEC, tree))
    const textos = ["Apoyé el desarrollo de apps iOS con Swift y SwiftUI para el equipo", "Construí apps iOS con Swift y SwiftUI para el equipo de producto"]
    let n = 0
    let pedido = ""
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteSummary: async () => ({}) as Suggestion,
      rewriteBullet: async (input) => {
        pedido = input.nudge ?? pedido
        const text = textos[Math.min(n++, 1)]
        return { bulletId: input.bulletId, changed: true, text, actionVerb: text.split(" ")[0], keywordsUsed: [], claim: "", metricType: null,
          placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null } as Suggestion
      },
    }
    const r = await runRewrite({
      tree, nodeId: tree.roles[0].bullets[0].id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index,
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    expect(pedido).toContain("Abre con una tarea")
    expect(r.ok && r.suggestion.text.startsWith("Construí")).toBe(true)
  })
})

describe("el resumen no habla de la persona en tercera", () => {
  it("«Realizó…, cobró…» se pide de nuevo nombrando las palabras, y gana la que no las tiene", async () => {
    const tree = buildTree(RAW)
    const index = buildTermIndex(termsOf(SPEC, tree))
    const textos = [
      "Desarrollador iOS con 3 años. Desarrolló apps con Swift y SwiftUI y mantuvo MVVM.",
      "Desarrollador iOS con 3 años en apps con Swift y SwiftUI sobre arquitectura MVVM.",
    ]
    let n = 0
    let pedido = ""
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteBullet: async () => ({}) as Suggestion,
      rewriteSummary: async (input) => {
        pedido = input.nudge ?? pedido
        const text = textos[Math.min(n++, 1)]
        return { bulletId: "summary", changed: true, text, actionVerb: "", keywordsUsed: [], claim: "", metricType: null,
          placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null } as Suggestion
      },
    }
    const r = await runRewrite({
      tree, nodeId: tree.summary.id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index,
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    expect(pedido).toContain("«Desarrolló»")
    expect(r.ok && r.suggestion.text).toBe(textos[1])
  })
})

describe("el resumen no copia las tareas del aviso", () => {
  it("una tarea pegada se pide de nuevo nombrándola", async () => {
    const tree = buildTree(RAW)
    const spec = { ...SPEC, responsibilities: ["Desarrollar pantallas nuevas en SwiftUI, revisar código del equipo"] } as unknown as JobSpec
    const index = buildTermIndex(termsOf(spec, tree))
    const textos = [
      "Desarrollador iOS con 3 años en Swift y SwiftUI. Busca desarrollar pantallas nuevas en SwiftUI.",
      "Desarrollador iOS con 3 años en apps con Swift y SwiftUI sobre arquitectura MVVM.",
    ]
    let n = 0
    let pedido = ""
    const ai: AtsAi = {
      parseJob: async () => spec, audit: async () => ({}) as AuditFacts,
      rewriteBullet: async () => ({}) as Suggestion,
      rewriteSummary: async (input) => {
        pedido = input.nudge ?? pedido
        const text = textos[Math.min(n++, 1)]
        return { bulletId: "summary", changed: true, text, actionVerb: "", keywordsUsed: [], claim: "", metricType: null,
          placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null } as Suggestion
      },
    }
    const r = await runRewrite({
      tree, nodeId: tree.summary.id, spec, ledger: openLedger(tree, spec, new Set()), index,
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    expect(pedido).toContain("«Desarrollar pantallas nuevas en SwiftUI»")
    expect(r.ok && r.suggestion.text).toBe(textos[1])
  })
})

describe("el resumen no deja datos sueltos", () => {
  it("«Bachiller.» se pide integrar en una oración", async () => {
    const tree = buildTree(RAW)
    const index = buildTermIndex(termsOf(SPEC, tree))
    const textos = ["Desarrollador iOS con 3 años en apps con Swift y SwiftUI. Bachiller.", "Desarrollador iOS con 3 años en apps con Swift y SwiftUI sobre MVVM."]
    let n = 0
    let pedido = ""
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteBullet: async () => ({}) as Suggestion,
      rewriteSummary: async (input) => {
        pedido = input.nudge ?? pedido
        const text = textos[Math.min(n++, 1)]
        return { bulletId: "summary", changed: true, text, actionVerb: "", keywordsUsed: [], claim: "", metricType: null,
          placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null } as Suggestion
      },
    }
    const r = await runRewrite({
      tree, nodeId: tree.summary.id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index,
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    expect(pedido).toContain("«Bachiller.»")
    expect(r.ok && r.suggestion.text).toBe(textos[1])
  })
})

describe("«ya está bien» no contesta una tarjeta abierta", () => {
  const declina = (): AtsAi => ({
    parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
    rewriteSummary: async () => ({}) as Suggestion,
    rewriteBullet: async (input) => ({ bulletId: input.bulletId, changed: false, text: "", actionVerb: "", keywordsUsed: [], claim: "", metricType: null,
      placeholders: [], variantWithoutMetric: null, measurableAspect: null,
      declineBasis: { hasActionVerb: true, hasResult: true, hasMethod: true } }) as Suggestion,
  })
  const pedir = (extra: { mustWrite?: string[]; focus?: string }) => {
    const tree = buildTree(RAW)
    return runRewrite({
      tree, nodeId: tree.roles[0].bullets[0].id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()),
      index: buildTermIndex(termsOf(SPEC, tree)), language: "es", model: "m", jdKey: "jd", ai: declina(), store: new Store(), ...extra,
    })
  }
  it("con un término prometido, dos negativas son «no se pudo», no «está bien»", async () => {
    const r = await pedir({ mustWrite: ["Combine"] })
    expect(r.ok).toBe(false)
    expect(!r.ok && "verdict" in r && r.verdict.ok === false && r.verdict.reason).toBe("declined")
  })
  it("sin nada prometido y con los tres ejes, declinar sigue siendo válido", async () => {
    const r = await pedir({})
    expect(!r.ok && "alreadyGood" in r && r.alreadyGood).toBe(true)
  })
})

describe("una promesa incumplida no se entrega como si cerrara la tarjeta", () => {
  it("el término prometido que no llega ni en el reintento es «no se pudo»", async () => {
    const tree = buildTree(RAW)
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteSummary: async () => ({}) as Suggestion,
      rewriteBullet: async (input) => ({ bulletId: input.bulletId, changed: true, text: "Construí apps iOS con Swift y SwiftUI para el equipo de producto", actionVerb: "Construí",
        keywordsUsed: [], claim: "", metricType: null, placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null }) as Suggestion,
    }
    const r = await runRewrite({
      tree, nodeId: tree.roles[0].bullets[0].id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()),
      index: buildTermIndex(termsOf(SPEC, tree)), language: "es", model: "m", jdKey: "jd", ai, store: new Store(), mustWrite: ["Combine"],
    })
    expect(!r.ok && "verdict" in r && r.verdict.ok === false && r.verdict.reason).toBe("declined")
  })
})

describe("los ejes prometidos: el resultado que sólo la persona puede dar", () => {
  const pedir = async (newBasis: { hasActionVerb: boolean; hasResult: boolean; hasMethod: boolean } | null, told?: string) => {
    const tree = buildTree(RAW)
    let primera: { axes?: string[]; told?: string } = {}
    let n = 0
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteSummary: async () => ({}) as Suggestion,
      rewriteBullet: async (input) => {
        if (n++ === 0) primera = { axes: input.axes, told: input.told }
        return { bulletId: input.bulletId, changed: true, text: "Construí apps iOS con Swift y SwiftUI para el equipo de producto", actionVerb: "Construí",
          keywordsUsed: [], claim: "", metricType: null, placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null, newBasis } as Suggestion
      },
    }
    const r = await runRewrite({
      tree, nodeId: tree.roles[0].bullets[0].id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()),
      index: buildTermIndex(termsOf(SPEC, tree)), language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
      axes: ["resultado"], told,
    })
    return { r, primera }
  }
  it("los ejes y lo contado viajan en la primera llamada", async () => {
    const { primera } = await pedir({ hasActionVerb: true, hasResult: true, hasMethod: true }, "bajó la fila")
    expect(primera).toEqual({ axes: ["resultado"], told: "bajó la fila" })
  })
  it("sin el dato de la persona no se llama al modelo: se le pide", async () => {
    const { r } = await pedir({ hasActionVerb: true, hasResult: true, hasMethod: true })
    expect(!r.ok && "verdict" in r && r.verdict.ok === false && r.verdict.reason).toBe("needs_fact")
    expect(r.calls).toBe(0)
  })
  it("con el dato, una línea que declara no tener el resultado es una negativa", async () => {
    const { r } = await pedir({ hasActionVerb: true, hasResult: false, hasMethod: true }, "bajó la fila")
    expect(!r.ok && "verdict" in r && r.verdict.ok === false && r.verdict.reason).toBe("declined")
  })
  it("la declaración omitida no cuenta como cumplida", async () => {
    const { r } = await pedir(null, "bajó la fila")
    expect(!r.ok && "verdict" in r && r.verdict.ok === false && r.verdict.reason).toBe("declined")
  })
  it("con el dato y el resultado escrito, se entrega", async () => {
    const { r } = await pedir({ hasActionVerb: true, hasResult: true, hasMethod: false }, "bajó la fila")
    expect(r.ok).toBe(true)
  })
})

describe("una declaración de ejes que el texto desmiente no vale", () => {
  it("agregar sólo términos de la vacante no es un método, aunque se declare", async () => {
    const tree = buildTree(RAW)
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteSummary: async () => ({}) as Suggestion,
      rewriteBullet: async (input) => ({ bulletId: input.bulletId, changed: true, text: "Mantuve la arquitectura MVVM del proyecto con Swift, SwiftUI y Combine", actionVerb: "Mantuve",
        keywordsUsed: [], claim: "", metricType: null, placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null,
        newBasis: { hasActionVerb: true, hasResult: true, hasMethod: true } }) as Suggestion,
    }
    const r = await runRewrite({
      tree, nodeId: tree.roles[0].bullets[1].id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()),
      index: buildTermIndex(termsOf(SPEC, tree)), language: "es", model: "m", jdKey: "jd", ai, store: new Store(), axes: ["método"],
    })
    expect(!r.ok && "verdict" in r && r.verdict.ok === false && r.verdict.reason).toBe("needs_fact")
  })
})

describe("lo que la persona cuenta es aporte, no texto ya dicho", () => {
  it("una línea escrita con su respuesta se entrega", async () => {
    const tree = buildTree(RAW)
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteSummary: async () => ({}) as Suggestion,
      rewriteBullet: async (input) => ({ bulletId: input.bulletId, changed: true, text: "Mantuve la arquitectura MVVM del proyecto y bajé los cierres inesperados", actionVerb: "Mantuve",
        keywordsUsed: [], claim: "", metricType: null, placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null,
        newBasis: { hasActionVerb: true, hasResult: true, hasMethod: true } }) as Suggestion,
    }
    const r = await runRewrite({
      tree, nodeId: tree.roles[0].bullets[1].id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()),
      index: buildTermIndex(termsOf(SPEC, tree)), language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
      axes: ["resultado"], told: "bajaron los cierres inesperados",
    })
    expect(r.ok).toBe(true)
  })
})

describe("el resumen no comenta el CV", () => {
  it("«The CV also shows…» se pide de nuevo", async () => {
    const tree = buildTree(RAW)
    const textos = ["Desarrollador iOS con 3 años en apps con Swift y SwiftUI. El CV muestra MVVM.", "Desarrollador iOS con 3 años en apps con Swift y SwiftUI sobre MVVM."]
    let n = 0
    let pedido = ""
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteBullet: async () => ({}) as Suggestion,
      rewriteSummary: async (input) => {
        pedido = input.nudge ?? pedido
        return { bulletId: "summary", changed: true, text: textos[Math.min(n++, 1)], actionVerb: "", keywordsUsed: [], claim: "", metricType: null,
          placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null } as Suggestion
      },
    }
    const r = await runRewrite({
      tree, nodeId: tree.summary.id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index: buildTermIndex(termsOf(SPEC, tree)),
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    expect(pedido).toContain("Hablaste del CV")
    expect(r.ok && r.suggestion.text).toBe(textos[1])
  })
})

describe("el resumen se arma con lo que ESTE puesto pide", () => {
  it("la prueba es la viñeta que demuestra lo pedido, y los términos llegan en orden de peso", async () => {
    const tree = buildTree({
      ...RAW,
      workExperience: [{
        jobTitle: "iOS Dev", employer: "Acme", startDate: "2021-03", endDate: "2024-06",
        description: "• Atendí 40 tickets de soporte por semana\n• Migré el flujo de pagos a Combine con Swift",
      }],
    })
    let recibido: { topBullets: string[]; provenTerms: string[] } | null = null
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteBullet: async () => ({}) as Suggestion,
      rewriteSummary: async (input) => {
        recibido = { topBullets: input.topBullets, provenTerms: input.provenTerms }
        return { bulletId: "summary", changed: true, text: "Desarrollador iOS con 3 años en Swift, SwiftUI y Combine sobre flujos de pagos.", actionVerb: "", keywordsUsed: [], claim: "", metricType: null,
          placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null } as Suggestion
      },
    }
    await runRewrite({
      tree, nodeId: tree.summary.id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index: buildTermIndex(termsOf(SPEC, tree)),
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    expect(recibido!.topBullets[0]).toBe("Migré el flujo de pagos a Combine con Swift")
    expect(recibido!.provenTerms).toEqual(["Combine"])
  })
})

describe("lo que el reintento no corrigió y se puede quitar, se quita", () => {
  it("la oración que habla del CV se retira si el modelo insiste", async () => {
    const tree = buildTree(RAW)
    const texto = "Desarrollador iOS con 3 años en apps con Swift y SwiftUI. Mantuvo la arquitectura MVVM de cada proyecto. El CV muestra además Combine."
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteBullet: async () => ({}) as Suggestion,
      rewriteSummary: async () => ({ bulletId: "summary", changed: true, text: texto, actionVerb: "", keywordsUsed: [], claim: "", metricType: null,
        placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null }) as Suggestion,
    }
    const r = await runRewrite({
      tree, nodeId: tree.summary.id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index: buildTermIndex(termsOf(SPEC, tree)),
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    expect(r.ok && r.suggestion.text).not.toContain("El CV")
    expect(r.ok && r.suggestion.text).toContain("Desarrollador iOS con 3 años")
  })
})

describe("un cargo con barra se escribe en una sola forma", () => {
  it("se deja la forma que se parece a los cargos de la persona", async () => {
    const tree = buildTree({ ...RAW, workExperience: [{ ...RAW.workExperience![0], jobTitle: "iOS Developer" }] })
    const spec = { ...SPEC, roleTitleRaw: "Senior iOS Engineer / Developer" } as unknown as JobSpec
    const ai: AtsAi = {
      parseJob: async () => spec, audit: async () => ({}) as AuditFacts,
      rewriteBullet: async () => ({}) as Suggestion,
      rewriteSummary: async () => ({ bulletId: "summary", changed: true, text: "Senior iOS Engineer / Developer con 3 años en apps con Swift y SwiftUI sobre MVVM.",
        actionVerb: "", keywordsUsed: [], claim: "", metricType: null, placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null }) as Suggestion,
    }
    const r = await runRewrite({
      tree, nodeId: tree.summary.id, spec, ledger: openLedger(tree, spec, new Set()), index: buildTermIndex(termsOf(spec, tree)),
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(), mustWrite: ["Senior iOS Engineer / Developer"],
    })
    expect(r.ok && r.suggestion.text).toBe("Senior iOS Developer con 3 años en apps con Swift y SwiftUI sobre MVVM.")
  })
})

describe("una viñeta casi copiada en el resumen es una viñeta pegada", () => {
  it("quitarle dos palabras no la esconde", async () => {
    const tree = buildTree({
      ...RAW,
      workExperience: [{ ...RAW.workExperience![0], description: "• Desarrollé y mantuve apps iOS usando los frameworks Swift y SwiftUI con equipos ágiles de producto" }],
    })
    const textos = [
      "Desarrollador iOS con 3 años. Desarrollé y mantuve apps iOS usando Swift y SwiftUI con equipos ágiles de producto.",
      "Desarrollador iOS con 3 años en apps con Swift y SwiftUI para equipos de producto.",
    ]
    let n = 0
    let pedido = ""
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteBullet: async () => ({}) as Suggestion,
      rewriteSummary: async (input) => {
        pedido = input.nudge ?? pedido
        return { bulletId: "summary", changed: true, text: textos[Math.min(n++, 1)], actionVerb: "", keywordsUsed: [], claim: "", metricType: null,
          placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null } as Suggestion
      },
    }
    const r = await runRewrite({
      tree, nodeId: tree.summary.id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index: buildTermIndex(termsOf(SPEC, tree)),
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    expect(pedido).toContain("Pegaste una viñeta")
    expect(r.ok && r.suggestion.text).toBe(textos[1])
  })
})

describe("la prueba del resumen es un resultado sobre lo que el puesto pide", () => {
  it("gana la viñeta con cifra que habla de lo pedido aunque no lo escriba literal", async () => {
    const tree = buildTree({
      ...RAW,
      workExperience: [{ ...RAW.workExperience![0], description: "• Migré el flujo de pagos a Combine con Swift\n• Reescribí los flujos combinados de datos y bajé la latencia 30%" }],
    })
    let top: string[] = []
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteBullet: async () => ({}) as Suggestion,
      rewriteSummary: async (input) => {
        top = input.topBullets
        return { bulletId: "summary", changed: true, text: "Desarrollador iOS con 3 años en Swift y Combine sobre flujos de pagos y datos.", actionVerb: "", keywordsUsed: [], claim: "", metricType: null,
          placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null } as Suggestion
      },
    }
    await runRewrite({
      tree, nodeId: tree.summary.id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index: buildTermIndex(termsOf(SPEC, tree)),
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    expect(top[0]).toBe("Reescribí los flujos combinados de datos y bajé la latencia 30%")
  })
  it("una oración que sólo enumera términos del aviso se pide de nuevo", async () => {
    const tree = buildTree(RAW)
    const textos = ["Desarrollador iOS con 3 años en apps. También Swift, SwiftUI y Combine.", "Desarrollador iOS con 3 años en apps con Swift y SwiftUI sobre MVVM."]
    let n = 0
    let pedido = ""
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteBullet: async () => ({}) as Suggestion,
      rewriteSummary: async (input) => {
        pedido = input.nudge ?? pedido
        return { bulletId: "summary", changed: true, text: textos[Math.min(n++, 1)], actionVerb: "", keywordsUsed: [], claim: "", metricType: null,
          placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null } as Suggestion
      },
    }
    const r = await runRewrite({
      tree, nodeId: tree.summary.id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index: buildTermIndex(termsOf(SPEC, tree)),
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    expect(pedido).toContain("enumera términos del aviso")
    expect(r.ok && r.suggestion.text).toBe(textos[1])
  })
})

describe("el resumen trae su prueba con cifra", () => {
  it("si el mejor logro tiene cifra y el resumen ninguna, se pide nombrando el logro", async () => {
    const tree = buildTree({
      ...RAW,
      workExperience: [{ ...RAW.workExperience![0], description: "• Migré los flujos de Combine y bajé la latencia 30%\n• Mantuve la arquitectura MVVM del proyecto" }],
    })
    const textos = ["Desarrollador iOS con 3 años en apps con Swift, SwiftUI y Combine sobre MVVM.", "Desarrollador iOS con 3 años en Swift y Combine; bajó la latencia 30% migrando flujos."]
    let n = 0
    let pedido = ""
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteBullet: async () => ({}) as Suggestion,
      rewriteSummary: async (input) => {
        pedido = input.nudge ?? pedido
        return { bulletId: "summary", changed: true, text: textos[Math.min(n++, 1)], actionVerb: "", keywordsUsed: [], claim: "", metricType: null,
          placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null } as Suggestion
      },
    }
    await runRewrite({
      tree, nodeId: tree.summary.id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index: buildTermIndex(termsOf(SPEC, tree)),
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    expect(pedido).toContain("El resumen no trae prueba")
    expect(pedido).toContain("latencia 30%")
  })
})

describe("la tercera persona en inglés, con el vocabulario del CV", () => {
  const RAW_EN = {
    summary: "iOS developer",
    workExperience: [{
      jobTitle: "iOS Developer", employer: "Acme", startDate: "2021-03", endDate: "2024-06",
      description: "• Developed apps with Swift and SwiftUI\n• Led code reviews while building shared components",
    }],
    skills: [{ name: "Swift" }, { name: "SwiftUI" }],
  }
  const correr = async (nodo: "summary" | "bullet", textos: string[]) => {
    const tree = buildTree(RAW_EN)
    let n = 0
    let pedido = ""
    const sug = (text: string, id: string) => ({ bulletId: id, changed: true, text, actionVerb: text.split(" ")[0], keywordsUsed: [], claim: "", metricType: null,
      placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null }) as Suggestion
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteSummary: async (input) => { pedido = input.nudge ?? pedido; return sug(textos[Math.min(n++, 1)], "summary") },
      rewriteBullet: async (input) => { pedido = input.nudge ?? pedido; return sug(textos[Math.min(n++, 1)], input.bulletId) },
    }
    const r = await runRewrite({
      tree, nodeId: nodo === "summary" ? tree.summary.id : tree.roles[0].bullets[0].id, spec: SPEC,
      ledger: openLedger(tree, SPEC, new Set()), index: buildTermIndex(termsOf(SPEC, tree)),
      language: "en", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    return { r, pedido }
  }
  it("«Develops…» en el resumen se pide de nuevo", async () => {
    const { pedido, r } = await correr("summary", [
      "iOS Developer with 3 years in Swift and SwiftUI. Develops apps with Swift and SwiftUI for product teams.",
      "iOS Developer with 3 years in Swift and SwiftUI, shipping apps for product teams.",
    ])
    expect(pedido).toContain('"Develops"')
    expect(r.ok && r.suggestion.text).toContain("shipping")
  })
  it("«Builds…» abriendo una viñeta se pide de nuevo", async () => {
    const { pedido } = await correr("bullet", ["Builds apps with Swift and SwiftUI for product teams", "Built apps with Swift and SwiftUI for product teams"])
    expect(pedido).toContain('"Builds"')
  })
  it("«Has integrated…» es tercera persona", async () => {
    const { pedido } = await correr("summary", [
      "iOS Developer with 3 years in Swift and SwiftUI. Has integrated Swift apps for product teams.",
      "iOS Developer with 3 years in Swift and SwiftUI for product teams.",
    ])
    expect(pedido).toContain('"Has"')
  })
  it("un plural al abrir no es un verbo", async () => {
    const { pedido } = await correr("summary", [
      "iOS Developer with 3 years in Swift and SwiftUI for product teams. Skills span Swift, SwiftUI and component design.",
      "iOS Developer with 3 years in Swift and SwiftUI for product teams.",
    ])
    expect(pedido).not.toContain("third person")
  })
})

describe("cada oración del resumen trabaja para este puesto", () => {
  it("una oración sin nada del aviso ni cifra se pide cambiar y, si sigue, se retira", async () => {
    const tree = buildTree(RAW)
    const texto = "Desarrollador iOS con 3 años. Construí apps con Swift y SwiftUI para el equipo. Inglés B2 y español nativo."
    let pedido = ""
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteBullet: async () => ({}) as Suggestion,
      rewriteSummary: async (input) => {
        pedido = input.nudge ?? pedido
        return { bulletId: "summary", changed: true, text: texto, actionVerb: "", keywordsUsed: [], claim: "", metricType: null,
          placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null } as Suggestion
      },
    }
    const r = await runRewrite({
      tree, nodeId: tree.summary.id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index: buildTermIndex(termsOf(SPEC, tree)),
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    expect(pedido).toContain("«Inglés B2 y español nativo.»")
    expect(r.ok && r.suggestion.text).toBe("Desarrollador iOS con 3 años. Construí apps con Swift y SwiftUI para el equipo.")
  })
})

describe("una oración con su acción no es una lista de términos", () => {
  it("«Migré flujos a Swift y SwiftUI con MVVM» no se marca; «También Swift, SwiftUI y Combine» sí", async () => {
    const tree = buildTree(RAW)
    let pedido = ""
    let n = 0
    const textos = ["Desarrollador iOS con 3 años. Migré flujos a Swift y SwiftUI. También Swift, SwiftUI y Combine.", "Desarrollador iOS con 3 años. Migré flujos a Swift y SwiftUI."]
    const ai: AtsAi = {
      parseJob: async () => SPEC, audit: async () => ({}) as AuditFacts,
      rewriteBullet: async () => ({}) as Suggestion,
      rewriteSummary: async (input) => {
        pedido = input.nudge ?? pedido
        return { bulletId: "summary", changed: true, text: textos[Math.min(n++, 1)], actionVerb: "", keywordsUsed: [], claim: "", metricType: null,
          placeholders: [], variantWithoutMetric: null, measurableAspect: null, declineBasis: null } as Suggestion
      },
    }
    await runRewrite({
      tree, nodeId: tree.summary.id, spec: SPEC, ledger: openLedger(tree, SPEC, new Set()), index: buildTermIndex(termsOf(SPEC, tree)),
      language: "es", model: "m", jdKey: "jd", ai, store: new Store(),
    })
    expect(pedido).toContain("«También Swift, SwiftUI y Combine.» enumera")
    expect(pedido).not.toContain("«Migré flujos a Swift y SwiftUI.» enumera")
  })
})
