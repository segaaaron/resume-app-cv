import { describe, it, expect } from "vitest"
import {
  openLedger,
  afterAccept,
  ledgerSignature,
  verbCollides,
  keywordsOverBudget,
  saturatedMetricTypes,
  claimAlreadyMade,
  spaceBudget,
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

describe("las cuatro reglas", () => {
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

  it("un verbo, una vez", () => {
    expect(verbCollides(base, "Lideré")).toBe(true)
    expect(verbCollides(base, "Soldé")).toBe(false)
  })

  it("un término no puede aparecer más de dos veces en todo el CV", () => {
    expect(keywordsOverBudget(base, ["Soldadura"])).toEqual(["Soldadura"])
    expect(keywordsOverBudget(base, ["Torno"])).toEqual([])
  })

  it("dos usos en la MISMA reescritura también se pasan del presupuesto", () => {
    expect(keywordsOverBudget(base, ["Torno", "Torno", "Torno"])).toContain("Torno")
  })

  it("avisa qué tipo de métrica ya está saturado", () => {
    expect(saturatedMetricTypes(base)).toEqual(["PERCENT_DELTA"])
  })

  it("un logro, un dueño: aunque esté redactado distinto", () => {
    expect(claimAlreadyMade(base, "mermas del taller reducidas")).not.toBeNull()
    expect(claimAlreadyMade(base, "capacitación de aprendices")).toBeNull()
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

describe("el presupuesto de espacio", () => {
  it("el puesto más reciente se lleva más, sin una tabla de años", () => {
    const b = spaceBudget(tree(["a", "b"], 3), 15)
    expect(b.perRole["r0"]).toBeGreaterThan(b.perRole["r1"])
    expect(b.perRole["r1"]).toBeGreaterThanOrEqual(b.perRole["r2"])
  })

  it("nunca reparte más espacio del que hay", () => {
    for (const roles of [1, 2, 3, 5, 8]) {
      const b = spaceBudget(tree(["a"], roles), 15)
      const sum = Object.values(b.perRole).reduce((s, n) => s + n, 0)
      expect(sum).toBeLessThanOrEqual(15)
    }
  })

  it("ningún puesto queda sin viñetas: un puesto vacío no se entiende", () => {
    const b = spaceBudget(tree(["a"], 8), 15)
    for (const n of Object.values(b.perRole)) expect(n).toBeGreaterThanOrEqual(1)
  })

  it("con un solo puesto, se lleva todo el presupuesto", () => {
    expect(spaceBudget(tree(["a"], 1), 15).perRole["r0"]).toBe(15)
  })
})
