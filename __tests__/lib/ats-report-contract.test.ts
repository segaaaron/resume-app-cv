import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import {
  REPORT_SECTIONS,
  allChecks,
  openChecks,
  criticalChecks,
  tailorWorkload,
  solvableChecks,
  recoverablePoints,
  isReadyToSend,
  isActionable,
  applyAllPlan,
  missingTerms,
  unbackedTerms,
  weavableTerms,
  findDuplicateCheckIds,
  READY_SCORE,
  OVER_OPTIMISATION_SCORE,
  type AtsReport,
  type ReportCheck,
  type ReportSectionId,
} from "@/lib/ats/report"

/**
 * EL CONTRATO DEL INFORME.
 *
 * Auditado el 2026-08-20: ocho sistemas escribían en el panel sin saber uno del
 * otro, y seis podían hablar de la misma viñeta. Cada choque se tapaba a mano y
 * el siguiente volvía. Este archivo no arregla el panel — hace imposible que el
 * informe se rompa en silencio mientras se lo migra.
 */
const check = (over: Partial<ReportCheck> = {}): ReportCheck => ({
  id: "c1",
  section: "search",
  state: "warn",
  weight: 3,
  titleKey: "editor.ats.check.demo",
  owner: "auto",
  action: { kind: "fix_dates" },
  ...over,
})

const report = (over: Partial<AtsReport> = {}): AtsReport => ({
  score: 72,
  sections: [
    { id: "search", scoreCategory: "sections", coveragePct: 80, checks: [] },
    { id: "tips", scoreCategory: null, coveragePct: null, checks: [] },
  ],
  terms: [],
  bullets: [],
  overOptimised: false, recoverable: 0,
  credibility: { score: 100, band: null },
  ...over,
})

describe("las seis secciones", () => {
  it("son exactamente las acordadas con el diseño", () => {
    expect([...REPORT_SECTIONS]).toEqual(["search", "hard", "soft", "other", "format", "tips"])
  })

  /**
   * Agregar una séptima sección obliga a decidir de qué lado va —lo que falta, o
   * la solución— en vez de sumarla en silencio y volver a la pantalla de la que
   * el CEO se quejó con capturas.
   */
  it("son seis, ni una más", () => {
    expect(REPORT_SECTIONS).toHaveLength(6)
  })
})

describe("un hallazgo, un lugar", () => {
  it("cada hallazgo declara una sola sección", () => {
    const r = report({
      sections: [
        { id: "search", scoreCategory: "sections", coveragePct: 80, checks: [check({ id: "a" })] },
        { id: "tips", scoreCategory: null, coveragePct: null, checks: [check({ id: "b", section: "tips" })] },
      ],
    })
    const ids = allChecks(r).map((c) => c.id)
    expect(ids).toEqual(["a", "b"])
    expect(new Set(ids).size).toBe(ids.length)
  })

  /**
   * El id es la clave con la que tailor dice qué cerró. Repetido, una reescritura
   * cierra el hallazgo equivocado y el panel muestra resuelto algo que nadie tocó:
   * un defecto silencioso, porque la pantalla queda coherente consigo misma.
   */
  it("delata dos hallazgos que comparten id", () => {
    const r = report({
      sections: [
        { id: "hard", scoreCategory: "hardSkills", coveragePct: 50, checks: [check({ id: "dup" })] },
        { id: "soft", scoreCategory: "softSkills", coveragePct: 50, checks: [check({ id: "dup", section: "soft" })] },
      ],
    })
    expect(findDuplicateCheckIds(r)).toEqual(["dup"])
  })

  it("y calla cuando son todos distintos", () => {
    const r = report({
      sections: [
        { id: "hard", scoreCategory: "hardSkills", coveragePct: 50, checks: [check({ id: "a" })] },
        { id: "soft", scoreCategory: "softSkills", coveragePct: 50, checks: [check({ id: "b", section: "soft" })] },
      ],
    })
    expect(findDuplicateCheckIds(r)).toEqual([])
  })
})

describe("un dueño por hallazgo", () => {
  it("tailor sólo recibe lo abierto que le toca", () => {
    const r = report({
      sections: [{
        id: "tips", scoreCategory: null, coveragePct: null,
        checks: [
          check({ id: "t1", owner: "tailor", state: "crit" }),
          check({ id: "t2", owner: "tailor", state: "pass" }),   // resuelto
          check({ id: "t3", owner: "auto", state: "crit" }),     // no es suyo
          check({ id: "t4", owner: "user", state: "warn", action: undefined }),
        ],
      }],
    })
    expect(tailorWorkload(r).map((c) => c.id)).toEqual(["t1"])
  })

  it("no descubre trabajo: si el informe no lo lista, no existe", () => {
    expect(tailorWorkload(report())).toEqual([])
  })
})

describe("sin salida no se muestra", () => {
  it("un hallazgo con botón es accionable", () => {
    expect(isActionable(check({ action: { kind: "fix_dates" } }))).toBe(true)
  })

  /**
   * La única excepción, y es deliberada: el mes que falta o la cifra real sólo
   * los sabe el candidato. Ahí la salida es la pregunta.
   */
  it("un hallazgo del usuario es accionable aunque no tenga botón", () => {
    expect(isActionable(check({ owner: "user", action: undefined }))).toBe(true)
  })

  it("un diagnóstico sin botón y sin dueño humano no lo es", () => {
    expect(isActionable(check({ owner: "auto", action: undefined }))).toBe(false)
  })
})

describe("lo que el panel pregunta y ya no calcula cada tarjeta por su cuenta", () => {
  const r = report({
    score: 100,
    sections: [{
      id: "tips", scoreCategory: null, coveragePct: null,
      checks: [
        check({ id: "a", state: "crit", weight: 5 }),
        check({ id: "b", state: "warn", weight: 3 }),
        check({ id: "c", state: "pass", weight: 8 }),
      ],
    }],
  })

  it("lo abierto excluye lo resuelto", () => {
    expect(openChecks(r).map((c) => c.id)).toEqual(["a", "b"])
  })

  it("los críticos son sólo los críticos", () => {
    expect(criticalChecks(r).map((c) => c.id)).toEqual(["a"])
  })

  /**
   * LOS PUNTOS PROMETIDOS YA NO SE DERIVAN DE LOS CHEQUEOS.
   *
   * Este test esperaba 8 — la suma de los pesos abiertos. Era correcto para lo
   * que la función hacía, y la función estaba mal: ignoraba los TÉRMINOS, que
   * son la palanca más grande del puntaje. Medido: un CV con 68 y cuatro duras
   * faltando mostraba «+0» con 32 puntos en juego.
   *
   * Ahora sale del desglose y viaja en el informe. La preocupación original
   * —no prometer un punto ya cobrado— sigue cubierta, pero por quien
   * corresponde: `score-breakdown` calcula sobre la cobertura ACTUAL, así que lo
   * ya ganado nunca entra. Se verifica ejecutando en `recoverable-points.test.ts`.
   */
  it("los puntos prometidos salen del informe, no de los pesos abiertos", () => {
    expect(recoverablePoints(r)).toBe(r.recoverable)
  })
})

describe("listo para mandar: las dos condiciones, no una", () => {
  /**
   * EL DEFECTO REPORTADO CON CAPTURA. 100 de coincidencia, y el mismo panel
   * listando el resumen repetido tres veces y una viñeta con un carácter roto.
   * El puntaje mide coincidencia con la vacante; la redacción no pesa en él. Con
   * un crítico abierto, la respuesta honesta es que todavía no.
   */
  it("100 con un crítico abierto NO está listo", () => {
    const r = report({
      score: 100,
      sections: [{ id: "tips", scoreCategory: null, coveragePct: null, checks: [check({ state: "crit" })] }],
    })
    expect(isReadyToSend(r)).toBe(false)
  })

  it("100 sin críticos sí lo está", () => {
    const r = report({
      score: 100,
      sections: [{ id: "tips", scoreCategory: null, coveragePct: null, checks: [check({ state: "warn" })] }],
    })
    expect(isReadyToSend(r)).toBe(true)
  })

  it("cero críticos pero bajo el umbral tampoco", () => {
    expect(isReadyToSend(report({ score: READY_SCORE - 1 }))).toBe(false)
  })
})

describe("una sección que no puntúa lo declara", () => {
  /**
   * Es la mitad que faltaba de la contradicción: no alcanza con no sumar puntos,
   * hay que poder DECIRLO en pantalla. Un consejo de reclutador con peso 0 y una
   * sección sin categoría de puntaje son lo que permite escribir "no mueve el
   * número" al lado del hallazgo.
   */
  it("las secciones sin categoría de puntaje no traen cobertura", () => {
    const tips = report().sections.find((s) => s.id === "tips")
    expect(tips?.scoreCategory).toBeNull()
    expect(tips?.coveragePct).toBeNull()
  })

  it("un hallazgo puede valer 0 puntos y seguir siendo válido", () => {
    const c = check({ weight: 0, owner: "tailor" })
    expect(c.weight).toBe(0)
    expect(isActionable(c)).toBe(true)
  })
})

describe("el puntaje sigue teniendo un solo dueño", () => {
  /**
   * Cambiar el modelo de puntaje es una decisión de producto abierta. Este archivo
   * está escrito para no prejuzgarla: si empieza a calcular, hay dos verdades otra
   * vez y volvemos exactamente al defecto que la auditoría encontró.
   */
  it("report.ts no calcula el puntaje", () => {
    const src = readFileSync("lib/ats/report.ts", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "")
    expect(src).not.toContain("SCORE_WEIGHTS")
    expect(src).not.toContain("computeScore")
    expect(src).not.toMatch(/\bscore\s*=\s*[^=]/)
  })

  it("el umbral de sobre-optimización está declarado una vez", () => {
    expect(OVER_OPTIMISATION_SCORE).toBe(80)
  })
})

describe("las secciones cubren lo que el panel pinta hoy", () => {
  // El inventario cerrado de bloques del panel actual, mapeado a su sección
  // nueva. Si aparece un bloque sin sección, esto obliga a decidir dónde va.
  const PANEL_BLOCKS: Record<string, ReportSectionId> = {
    "ats-gaps": "hard",          // requisitos que faltan
    "ats-skills": "hard",        // keywords faltantes
    "ats-typos": "search",       // una errata cuesta una keyword
    "ats-credibility": "tips",   // lo que ve la persona
    "ats-structure": "format",   // fechas y equilibrio
    "ats-neardup": "tips",       // el mismo logro dos veces
    "ats-bullets": "tips",       // la lista de viñetas
  }

  it("los siete bloques del panel tienen sección asignada", () => {
    for (const [block, section] of Object.entries(PANEL_BLOCKS)) {
      expect(REPORT_SECTIONS, `${block} apunta a una sección inexistente`).toContain(section)
    }
    expect(Object.keys(PANEL_BLOCKS)).toHaveLength(7)
  })
})

/**
 * «2 arreglos críticos» arriba y «resolver 1 pendiente» abajo — CEO, 2026-08-21,
 * con captura: «¿cuál de estos dice la verdad?».
 *
 * Los dos, y por eso era peor que un error. Uno era una reescritura; el otro, un
 * requisito de la vacante que el CV no cumple, y ninguna reescritura lo cambia.
 * Llamar «arreglo» a un requisito manda a buscar un botón que no puede existir.
 */
describe("los dos números críticos no pueden contradecirse", () => {
  const crit = (over: Partial<ReportCheck>): ReportCheck => ({
    id: "c", section: "hard", state: "crit", weight: 5, titleKey: "k", owner: "user", ...over,
  })
  const build = (checks: ReportCheck[]): AtsReport => ({
    score: 70,
    sections: [{ id: "hard", scoreCategory: "hardSkills", coveragePct: 40, checks }],
    terms: [], bullets: [], overOptimised: false, recoverable: 0, credibility: { score: 100, band: null },
  })

  it("un requisito sin cubrir cuenta como crítico pero NO como resoluble", () => {
    const r = build([
      crit({ id: "hard.requirements" }),
      crit({ id: "tips.recruiter.0", owner: "tailor", action: { kind: "rewrite_summary" } }),
    ])
    expect(criticalChecks(r)).toHaveLength(2)
    expect(solvableChecks(r).map((c) => c.id)).toEqual(["tips.recruiter.0"])
  })
})

/**
 * LOS «SÓLO EN LA LISTA» SON TRABAJO DEL EJECUTOR.
 *
 * Reportado con captura: diez habilidades listadas bajo «10 habilidades están
 * sólo en la lista, sin una viñeta que las respalde», y debajo la banda «esto
 * sólo lo sabés vos». Era falso — cada una tenía su botón en la tabla de
 * términos, veinte líneas más abajo. Una tarjeta negaba la salida que la otra
 * ofrecía, que es el mismo defecto de fondo que este panel ya cerró tres veces:
 * cada capa contaba lo que ELLA sabía hacer, no lo que el informe reportó.
 */
describe("los términos afirmados sin respaldo", () => {
  const withTerms = () =>
    report({
      terms: [
        { term: "CRM", section: "hard", jd: 3, cv: 0, listOnly: false },
        { term: "Venta consultiva", section: "hard", jd: 2, cv: 1, listOnly: true },
        { term: "Excel", section: "hard", jd: 1, cv: 4, listOnly: false },
      ],
    })

  it("los que están sólo en la lista se separan de los que faltan", () => {
    expect(missingTerms(withTerms()).map((x) => x.term)).toEqual(["CRM"])
    expect(unbackedTerms(withTerms()).map((x) => x.term)).toEqual(["Venta consultiva"])
  })

  it("los dos son trabajo que el ejecutor puede escribir", () => {
    expect(weavableTerms(withTerms()).map((x) => x.term)).toEqual(["CRM", "Venta consultiva"])
  })

  /** Lo probado no es trabajo: ofrecerlo sería un clic que no cambia nada. */
  it("lo ya demostrado queda fuera", () => {
    expect(weavableTerms(withTerms()).map((x) => x.term)).not.toContain("Excel")
  })

  /**
   * `addedTerms` marca lo agregado a HABILIDADES. Un «sólo en la lista» ya está
   * ahí: filtrarlo por ese conjunto lo sacaría del plan sin que nadie escriba la
   * viñeta, que es justo lo que le falta.
   */
  it("«aplicar todo» incluye los afirmados sin respaldo aunque la skill ya esté", () => {
    const plan = applyAllPlan(withTerms(), new Set(), new Set(["Venta consultiva"]))
    expect(plan.terms).toContain("Venta consultiva")
  })

  it("y deja fuera el que falta y el usuario ya agregó a la lista", () => {
    const plan = applyAllPlan(withTerms(), new Set(), new Set(["CRM"]))
    expect(plan.terms).not.toContain("CRM")
  })
})
