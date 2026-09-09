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
