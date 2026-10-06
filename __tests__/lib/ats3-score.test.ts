import { describe, it, expect } from "vitest"
import {
  scoreResume,
  titleForms,
  experienceYears,
  titleWritten,
  cargoNucleo,
  gainOf,
  deltaOf,
  statesQuantity,
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
  metricThatMatters: "",
    seniority: null,
    yearsRequired: null,
    domain: null,
    workMode: null,
    language: "es",
    mustHave: req(must, "M"),
    niceToHave: req(nice, "N"),
    responsibilities: [],
    softSignals: [],
    conditions: [],
  }
}

/**
 * El diagnóstico del ATS: las primeras `mustFound`/`niceFound` skills demostradas,
 * el resto faltantes.
 */
function makeAudit(tree: ResumeTree, spec: JobSpec, mustFound: number, niceFound: number): AuditFacts {
  const skill = (skill: string, requirement: "MUST" | "NICE", ok: boolean) => ({
    skill, requirement, status: (ok ? "demonstrated" : "missing") as "demonstrated" | "missing", evidenceNodeId: null, writeIn: null, question: null,
  })
  return {
    hard: [...spec.mustHave.map((m, i) => skill(m.skill, "MUST", i < mustFound)), ...spec.niceToHave.map((n, i) => skill(n.skill, "NICE", i < niceFound))],
    soft: [],
  }
}

/** Cerrar una skill es que el ATS la dé por demostrada. */
function demostrar(audit: AuditFacts, skill: string): AuditFacts {
  return { ...audit, hard: audit.hard.map((h) => (h.skill === skill ? { ...h, status: "demonstrated" as const } : h)) }
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
      hard: spec.mustHave.map((m) => ({ skill: m.skill, requirement: "MUST" as const, status: "demonstrated" as const, evidenceNodeId: null, writeIn: null, question: null })),
      soft: [],
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

      const after = scoreResume(tree, spec, demostrar(audit, spec.mustHave[found].skill), CHECKS)
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
      const after = scoreResume(tree, spec, demostrar(audit, spec.niceToHave[found].skill), CHECKS)
      expect(deltaOf(before, after)).toBeCloseTo(promised, 10)
    }
  })

  it("un componente ya completo no promete nada", () => {
    const tree = makeTree(3)
    const spec = makeSpec(2, 0)
    const audit = makeAudit(tree, spec, 2, 0)
    const s = scoreResume(tree, spec, audit, CHECKS)
    expect(gainOf(s, "must")).toBe(0)
  })
})


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

describe("una skill demostrada vale más que una sólo nombrada", () => {
  it("demostrada 1, nombrada 0,6, ausente 0; y demostrada en una línea que ya no existe cuenta como nombrada", () => {
    const tree = makeTree(2)
    const spec = { ...makeSpec(0, 0), softSignals: ["honestidad", "atención al cliente", "trabajo bajo presión"] }
    const audit: AuditFacts = {
      hard: [],
      soft: [
        { signal: "honestidad", status: "listed", evidenceNodeId: null, writeIn: null },
        { signal: "atención al cliente", status: "demonstrated", evidenceNodeId: "no-existe", writeIn: null },
        { signal: "trabajo bajo presión", status: "demonstrated", evidenceNodeId: "b1", writeIn: null },
      ],
    }
    const soft = scoreResume(tree, spec, audit, CHECKS).components.find((c) => c.key === "soft")!
    expect(soft.numerator).toBeCloseTo(0.6 + 0.6 + 1, 10)
    expect(soft.denominator).toBe(3)
  })
})

describe("un cargo con barra son varios cargos", () => {
  it("parte por la barra con espacios o de género, nunca por la de un nombre", () => {
    expect(titleForms("Cajera / Cajero de Supermercado")).toEqual(["Cajera de Supermercado", "Cajero de Supermercado"])
    expect(titleForms("Frontend Developer / Engineer")).toEqual(["Frontend Developer", "Frontend Engineer"])
    expect(titleForms("Vendedor/a")).toEqual(["Vendedor", "Vendedora"])
    expect(titleForms("CI/CD Engineer")).toEqual(["CI/CD Engineer"])
  })
  it("el cargo está escrito si lo está cualquiera de sus formas", () => {
    const tree = makeTree(1)
    tree.summary = { ...tree.summary, text: "Cajera de Supermercado con 4 años" }
    const spec = { ...makeSpec(0, 0), roleTitleRaw: "Cajera / Cajero de Supermercado" }
    expect(titleWritten(tree, spec)).toBe(true)
    expect(titleWritten(tree, { ...spec, roleTitleRaw: "Repositor / Repositora" })).toBe(false)
  })
  it("lo que va entre paréntesis califica al cargo y no se exige escrito", () => {
    // Medido en producción: «Mobile Engineer (LATAM)» pedía escribir «(LATAM)» en el resumen.
    const tree = makeTree(1)
    tree.summary = { ...tree.summary, text: "Mobile Engineer with 7+ years" }
    expect(titleWritten(tree, { ...makeSpec(0, 0), roleTitleRaw: "Mobile Engineer (LATAM, All Levels)" })).toBe(true)
    expect(cargoNucleo("Mobile Engineer (LATAM)")).toBe("Mobile Engineer")
    expect(cargoNucleo("(Remote)")).toBe("(Remote)")
  })
})

describe("los años no cuentan meses que no pasaron", () => {
  it("un año suelto en curso cuenta hasta hoy, no hasta diciembre", () => {
    const tree = makeTree(1)
    tree.roles[0] = { ...tree.roles[0], startDate: "2021", endDate: "2026" }
    expect(experienceYears(tree, new Date(2026, 8, 28))).toBeCloseTo(69 / 12, 5)
  })
})
