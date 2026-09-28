import { describe, it, expect } from "vitest"
import {
  openLedger,
  afterAccept,
  ledgerSignature,
  saturatedMetricTypes,
  KEYWORD_MAX,
  type Ledger,
} from "@/lib/ats3/ledger"
import type { ResumeTree, JobSpec, Suggestion } from "@/lib/ats3/contracts"

/**
 * El ledger: la memoria que impide que seis viñetas optimizadas por separado
 * terminen escritas iguales.
 *
 * Los casos son de oficios distintos a propósito. Un motor afinado con un CV de
 * programador le presta a la peluquería el vocabulario de programación — este
 * proyecto ya pagó esa contaminación una vez.
 */

const tree = (bullets: string[], roles = 1): ResumeTree => ({
  roles: Array.from({ length: roles }, (_, i) => ({
    id: `r${i}`,
    title: `Puesto ${i}`,
    company: "Empresa",
    startDate: `20${20 - i}-01`,
    endDate: `20${21 - i}-01`,
    bullets: (i === 0 ? bullets : ["Otra tarea del puesto viejo"]).map((t, j) => ({
      id: `b${i}_${j}`,
      text: t,
      hash: "h1",
      origin: "USER" as const,
    })),
  })),
  summary: { id: "s", text: "", hash: "h1", origin: "USER" },
  declaredSkills: [],
  otherText: "",
})

const spec = (must: string[], nice: string[] = []): JobSpec => ({
  roleTitleRaw: "Puesto",
  roleTitleCanonical: "Puesto",
  metricThatMatters: "",
  seniority: null,
  yearsRequired: null,
  domain: null,
  workMode: null,
  language: "es",
  mustHave: must.map((s) => ({ skill: s, raw: s, years: null, category: null })),
  niceToHave: nice.map((s) => ({ skill: s, raw: s, years: null, category: null })),
  responsibilities: [],
  softSignals: [],
})

const suggestion = (over: Partial<Suggestion> = {}): Suggestion => ({
  declineBasis: null,
  bulletId: "b0_0",
  changed: true,
  text: "texto",
  actionVerb: "Reduje",
  keywordsUsed: [],
  claim: "",
  metricType: null,
  placeholders: [],
  variantWithoutMetric: null,
  measurableAspect: null,
  ...over,
})

describe("el ledger arranca con lo que el CV ya gastó", () => {
  it("no arranca en cero: las líneas que nadie reescribe siguen ocupando su verbo", () => {
    const l = openLedger(tree(["Corté el cabello por capas", "Apliqué color con técnica de mechas"]), spec([]), new Set())
    expect(l.verbsUsed).toContain("corte")
    expect(l.verbsUsed).toContain("aplique")
  })

  it("cuenta las apariciones que la vacante pide y el CV ya tiene", () => {
    const l = openLedger(tree(["Instalé cañerías de PVC", "Reparé cañerías del subsuelo"]), spec(["cañerías"]), new Set())
    expect(l.keywordBudget["cañerías"].used).toBe(2)
    expect(l.keywordBudget["cañerías"].max).toBe(KEYWORD_MAX)
  })

  it("marca como prioritario lo que la vacante exige y el CV no demuestra", () => {
    const l = openLedger(tree(["Atendí el mostrador"]), spec(["Arqueo de caja", "Atención"]), new Set(["Atención"]))
    expect(l.keywordBudget["Arqueo de caja"].priority).toBe(true)
    expect(l.keywordBudget["Atención"].priority).toBe(false)
  })
})

describe("lo que el ledger le cuenta al modelo", () => {
  const base: Ledger = {
    verbsUsed: ["lidere", "reduje"],
    keywordBudget: {
      Soldadura: { max: 2, used: 2, priority: false },
      Torno: { max: 2, used: 0, priority: true },
    },
    metricTypesUsed: ["PERCENT_DELTA", "PERCENT_DELTA"],
    claimsMade: ["reducción de mermas en el taller"],
    bulletsRemaining: 5,
  }

  it("avisa qué tipo de métrica ya está saturado", () => {
    expect(saturatedMetricTypes(base)).toEqual(["PERCENT_DELTA"])
  })

})

describe("aceptar una sugerencia actualiza la memoria y no muta la vieja", () => {
  it("suma el verbo, gasta el término y descuenta una viñeta", () => {
    const before = openLedger(tree(["Atendí clientes"]), spec(["Inventario"]), new Set())
    const used = before.keywordBudget["Inventario"].used
    const after = afterAccept(before, suggestion({ actionVerb: "Ordené", keywordsUsed: ["Inventario"], claim: "orden del depósito" }))

    expect(after.verbsUsed).toContain("ordene")
    expect(after.keywordBudget["Inventario"].used).toBe(used + 1)
    expect(after.bulletsRemaining).toBe(before.bulletsRemaining - 1)
    // El motor puntúa sobre una COPIA antes de promover el cambio: un ledger
    // mutable contaminaría el estado real aunque el parche terminara rechazado.
    expect(before.verbsUsed).not.toContain("ordene")
    expect(before.keywordBudget["Inventario"].used).toBe(used)
  })

  it("la firma cambia cuando la memoria cambia", () => {
    const before = openLedger(tree(["Atendí clientes"]), spec(["Inventario"]), new Set())
    const after = afterAccept(before, suggestion({ actionVerb: "Ordené", keywordsUsed: ["Inventario"] }))
    // Si no cambiara, la sugerencia guardada para la viñeta siguiente se
    // serviría del caché proponiendo un verbo que ya no está disponible.
    expect(ledgerSignature(after)).not.toBe(ledgerSignature(before))
  })
})
