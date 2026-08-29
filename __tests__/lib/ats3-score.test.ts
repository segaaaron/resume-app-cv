import { describe, it, expect } from "vitest"
import {
  scoreResume,
  gainOf,
  deltaOf,
  statesQuantity,
  distinctOpeners,
  PILLAR_WEIGHT,
  type AuditFacts,
  type ParseChecks,
} from "@/lib/ats3/score"
import type { ResumeTree, JobSpec } from "@/lib/ats3/contracts"

/**
 * El puntaje aditivo.
 *
 * Dos propiedades sostienen todo el producto y por eso se prueban generando
 * corridas al azar, no con tres ejemplos elegidos:
 *
 *   1. El total SIEMPRE cae en [0, 100]. No por un clamp final, sino porque no
 *      hay una operación que pueda sacarlo de ahí.
 *   2. La ganancia prometida ANTES de aceptar es EXACTAMENTE el delta medido
 *      DESPUÉS de aplicar. Si discrepan, la pantalla miente en una de las dos.
 */

// ── generadores ──────────────────────────────────────────────────────────────

let seed = 1
/** Aleatorio reproducible: una corrida en rojo se puede volver a correr igual. */
function rnd(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const int = (max: number) => Math.floor(rnd() * (max + 1))

function makeTree(bulletCount: number): ResumeTree {
  const bullets = Array.from({ length: bulletCount }, (_, i) => ({
    id: `b${i}`,
    text: `Verbo${i % 5} tarea ${i} del puesto con detalle suficiente`,
    hash: `h${i}`,
    origin: "USER" as const,
  }))
  return {
    roles: [
      { id: "r1", title: "Puesto", company: "Empresa", startDate: "2020-01", endDate: "2024-01", bullets },
    ],
    summary: { id: "s1", text: "Resumen", hash: "h1", origin: "USER" },
    declaredSkills: [],
    otherText: "",
  }
}

function makeSpec(must: number, nice: number): JobSpec {
  const req = (n: number, p: string) =>
    Array.from({ length: n }, (_, i) => ({ skill: `${p}${i}`, raw: `${p}${i}`, years: null, category: null }))
  return {
    roleTitleRaw: "Puesto",
    roleTitleCanonical: "Puesto",
    seniority: null,
    yearsRequired: null,
    domain: null,
    workMode: null,
    language: "es",
    mustHave: req(must, "M"),
    niceToHave: req(nice, "N"),
    responsibilities: [],
    softSignals: [],
  }
}

function makeAudit(tree: ResumeTree, spec: JobSpec, mustFound: number, niceFound: number): AuditFacts {
  const cov: AuditFacts["coverage"] = [
    ...spec.mustHave.map((m, i) => ({
      skill: m.skill,
      requirement: "MUST" as const,
      status: (i < mustFound ? "FOUND" : "NOT_FOUND") as "FOUND" | "NOT_FOUND",
    })),
    ...spec.niceToHave.map((n, i) => ({
      skill: n.skill,
      requirement: "NICE" as const,
      status: (i < niceFound ? "FOUND" : "NOT_FOUND") as "FOUND" | "NOT_FOUND",
    })),
  ]
  const bullets = tree.roles[0].bullets.map((b, i) => ({
    id: b.id,
    hasActionVerb: i % 2 === 0,
    hasResult: i % 3 === 0,
    hasMethod: i % 2 === 0,
  }))
  return {
    bullets,
    summary: { identity: true, proof: false, fit: true, extra: false },
    coverage: cov,
    titleAlignment: rnd(),
  }
}

const CHECKS: ParseChecks = { a: true, b: true, c: false, d: null, e: true }

// ── propiedad 1: el total no puede salirse ───────────────────────────────────

describe("el total cae en [0,100] por construcción", () => {
  it("sobre 300 corridas generadas al azar", () => {
    seed = 7
    for (let n = 0; n < 300; n++) {
      const bulletCount = int(20)
      const must = int(12)
      const nice = int(8)
      const tree = makeTree(bulletCount)
      const spec = makeSpec(must, nice)
      const audit = makeAudit(tree, spec, int(must), int(nice))
      const s = scoreResume(tree, spec, audit, CHECKS)
      expect(s.total).toBeGreaterThanOrEqual(0)
      expect(s.total).toBeLessThanOrEqual(100)
      expect(Number.isFinite(s.total)).toBe(true)
    }
  })

  it("un CV vacío contra una vacante vacía no rompe ni da NaN", () => {
    const tree = makeTree(0)
    const spec = makeSpec(0, 0)
    const audit = makeAudit(tree, spec, 0, 0)
    const s = scoreResume(tree, spec, audit, {})
    expect(Number.isFinite(s.total)).toBe(true)
    expect(s.total).toBeGreaterThanOrEqual(0)
  })

  it("cubrirlo todo da exactamente 100, aunque la vacante no tenga deseables", () => {
    const tree = makeTree(4)
    const spec = makeSpec(3, 0) // sin "nice to have"
    const audit: AuditFacts = {
      bullets: tree.roles[0].bullets.map((b) => ({ id: b.id, hasActionVerb: true, hasResult: true, hasMethod: true })),
      summary: { identity: true, proof: true, fit: true, extra: true },
      coverage: spec.mustHave.map((m) => ({ skill: m.skill, requirement: "MUST" as const, status: "FOUND" as const })),
      titleAlignment: 1,
    }
    const tree2: ResumeTree = {
      ...tree,
      roles: [
        {
          ...tree.roles[0],
          // Cuatro aperturas distintas y una cifra en cada línea.
          bullets: tree.roles[0].bullets.map((b, i) => ({
            ...b,
            text: `Palabra${i} el trabajo con 12 turnos por semana`,
          })),
        },
      ],
    }
    const s = scoreResume(tree2, spec, audit, { a: true, b: true })
    expect(s.total).toBeCloseTo(100, 6)
  })
})

// ── propiedad 2: la promesa y la medición son el mismo número ────────────────

describe("la ganancia prometida ES el delta medido", () => {
  it("cerrar un requisito obligatorio, sobre 60 corridas", () => {
    seed = 42
    for (let n = 0; n < 60; n++) {
      const must = 1 + int(10)
      const found = int(must - 1)
      const tree = makeTree(1 + int(15))
      const spec = makeSpec(must, int(6))
      const audit = makeAudit(tree, spec, found, 0)

      const before = scoreResume(tree, spec, audit, CHECKS)
      const promised = gainOf(before, "must")

      const after = scoreResume(tree, spec, makeAuditSameBut(audit, found + 1, "MUST"), CHECKS)
      expect(deltaOf(before, after)).toBeCloseTo(promised, 10)
    }
  })

  it("cerrar un deseable, sobre 60 corridas", () => {
    seed = 99
    for (let n = 0; n < 60; n++) {
      const nice = 1 + int(8)
      const found = int(nice - 1)
      const tree = makeTree(1 + int(15))
      const spec = makeSpec(1 + int(6), nice)
      const audit = makeAudit(tree, spec, 0, found)

      const before = scoreResume(tree, spec, audit, CHECKS)
      const promised = gainOf(before, "nice")
      const after = scoreResume(tree, spec, makeAuditSameBut(audit, found + 1, "NICE"), CHECKS)
      expect(deltaOf(before, after)).toBeCloseTo(promised, 10)
    }
  })

  it("llevar una viñeta a estructura completa", () => {
    const tree = makeTree(8)
    const spec = makeSpec(4, 3)
    const audit = makeAudit(tree, spec, 2, 1)
    const flojo = audit.bullets.findIndex((b) => !(b.hasActionVerb && b.hasResult && b.hasMethod))
    expect(flojo).toBeGreaterThanOrEqual(0)

    const before = scoreResume(tree, spec, audit, CHECKS)
    const promised = gainOf(before, "xyz")

    const fixed: AuditFacts = {
      ...audit,
      bullets: audit.bullets.map((b, i) =>
        i === flojo ? { ...b, hasActionVerb: true, hasResult: true, hasMethod: true } : b,
      ),
    }
    expect(deltaOf(before, scoreResume(tree, spec, fixed, CHECKS))).toBeCloseTo(promised, 10)
  })

  it("un componente ya completo no promete nada", () => {
    const tree = makeTree(3)
    const spec = makeSpec(2, 0)
    const audit = makeAudit(tree, spec, 2, 0)
    const s = scoreResume(tree, spec, audit, CHECKS)
    expect(gainOf(s, "must")).toBe(0)
  })
})

function makeAuditSameBut(audit: AuditFacts, found: number, kind: "MUST" | "NICE"): AuditFacts {
  let seen = 0
  return {
    ...audit,
    coverage: audit.coverage.map((c) => {
      if (c.requirement !== kind) return c
      seen++
      return { ...c, status: seen <= found ? ("FOUND" as const) : ("NOT_FOUND" as const) }
    }),
  }
}

// ── el peso muerto que castigaba por cómo escribieron el aviso ──────────────

describe("el peso se reparte entre lo que aplica", () => {
  it("sin deseables, su 25% no queda muerto", () => {
    const tree = makeTree(5)
    const conNice = scoreResume(tree, makeSpec(4, 3), makeAudit(tree, makeSpec(4, 3), 4, 3), CHECKS)
    const sinNice = scoreResume(tree, makeSpec(4, 0), makeAudit(tree, makeSpec(4, 0), 4, 0), CHECKS)
    // Los dos cubren TODO lo exigible: el pilar de relevancia vale lo mismo.
    expect(sinNice.pillars.relevance.max).toBeCloseTo(PILLAR_WEIGHT.relevance, 6)
    expect(conNice.pillars.relevance.max).toBeCloseTo(PILLAR_WEIGHT.relevance, 6)
  })
})

// ── las dos mediciones deterministas ────────────────────────────────────────

describe("¿la línea declara un tamaño?", () => {
  it("reconoce la medida en cualquier oficio, sin lista de unidades", () => {
    expect(statesQuantity("Reduje las mermas un 20%")).toBe(true)
    expect(statesQuantity("Atendí 40 clientes por turno")).toBe(true)
    expect(statesQuantity("Soldé 15 estructuras por semana")).toBe(true)
    expect(statesQuantity("clarifying 10 to 15 edge cases per sprint")).toBe(true)
  })

  it("un año suelto no es una medida, y un identificador tampoco", () => {
    expect(statesQuantity("Trabajé ahí desde 2021")).toBe(false)
    expect(statesQuantity("Operé la máquina MIG350 del taller")).toBe(false)
  })

  it("una línea sin números no declara nada", () => {
    expect(statesQuantity("Responsable de la atención al cliente")).toBe(false)
  })
})

describe("diversidad de aperturas", () => {
  it("cuenta cuántas líneas empiezan distinto, sin lista de verbos", () => {
    expect(distinctOpeners(["Lideré el equipo", "Lideré la migración", "Reduje costos"])).toBe(2)
  })

  it("ignora mayúsculas y acentos: es la misma apertura", () => {
    expect(distinctOpeners(["Gestioné la agenda", "gestione los turnos"])).toBe(1)
  })
})
