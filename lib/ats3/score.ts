// lib/ats3/score.ts
//
// EL NÚMERO. Aditivo por cobertura, nunca punitivo.
//
// ── LA REGLA, Y ES ÚNICA ────────────────────────────────────────────────────
// Nada resta. Cada componente es una razón entre 0 y 1 multiplicada por un peso
// conocido, y el total es la suma. Por construcción cae en [0, 100]: no hay una
// sola operación en este archivo que pueda sacarlo de ahí.
//
// El motor viejo penalizaba, y penalizar tiene dos defectos que se pagan en
// pantalla: el resultado depende del ORDEN en que se aplican los castigos (dos
// auditorías del mismo CV daban números distintos), y no se puede decir cuánto
// vale arreglar algo, porque el castigo no es una fracción de nada.
//
// ── POR QUÉ LA GANANCIA Y EL DELTA NO PUEDEN DISCREPAR ──────────────────────
// La pantalla promete "+3,4 puntos" ANTES de aceptar, y muestra un delta real
// DESPUÉS de aplicar. Si salieran de dos cálculos distintos, tarde o temprano se
// contradicen y el usuario deja de creerle a los dos. Acá `gainPerUnit` es
// literalmente la derivada del puntaje respecto de ese componente: cerrar una
// unidad mueve el total exactamente eso. Hay un test que lo ata sobre corridas
// generadas al azar.
//
// ── LO QUE ESTE ARCHIVO NO SABE ─────────────────────────────────────────────
// Ningún oficio. Ninguna lista de verbos, de herramientas ni de unidades. Recibe
// hechos (los deterministas los mide él; los de juicio los trae la auditoría) y
// los suma. Un CV de soldadura y uno de iOS recorren el mismo código.

import { normalize, type ResumeTree, type JobSpec } from "@/lib/ats3/contracts"

// ─────────────────────────────────────────────────────────────────────────────
// PESOS
// ─────────────────────────────────────────────────────────────────────────────

export const PILLAR_WEIGHT = { parse: 20, relevance: 45, impact: 35 } as const
export type Pillar = keyof typeof PILLAR_WEIGHT

/** Reparto dentro de cada pilar. Cada bloque suma 1. */
export const COMPONENT_WEIGHT = {
  parse: { checks: 1 },
  relevance: { must: 0.6, nice: 0.25, title: 0.15 },
  impact: { xyz: 0.45, metric: 0.3, verbs: 0.1, summary: 0.15 },
} as const

export type ComponentKey =
  | "checks"
  | "must"
  | "nice"
  | "title"
  | "xyz"
  | "metric"
  | "verbs"
  | "summary"

const PILLAR_OF: Record<ComponentKey, Pillar> = {
  checks: "parse",
  must: "relevance",
  nice: "relevance",
  title: "relevance",
  xyz: "impact",
  metric: "impact",
  verbs: "impact",
  summary: "impact",
}

// ─────────────────────────────────────────────────────────────────────────────
// LO QUE ENTRA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verificaciones de lectura automática.
 *
 * `null` significa NO APLICABLE (o todavía no medible), y entonces la
 * verificación sale del denominador en vez de contar como fallada. Es la
 * diferencia entre "tu CV falla 4 de 12" y "de lo que se pudo medir, pasa 8 de
 * 10" — castigar por algo que no se pudo mirar es inventar un defecto.
 *
 * Las claves las declara quien mide (el motor, sobre el CV estructurado y la
 * plantilla). Este archivo sólo cuenta.
 */
export type ParseChecks = Record<string, boolean | null>

/** Lo que la auditoría (P2) aporta: juicio sobre cada línea, con evidencia. */
export interface AuditFacts {
  bullets: {
    id: string
    hasActionVerb: boolean
    hasResult: boolean
    hasMethod: boolean
  }[]
  /** Las cuatro funciones del resumen, cumplidas o no. */
  summary: { identity: boolean; proof: boolean; fit: boolean; extra: boolean }
  /** Cobertura por requisito. `IMPLIED` no cuenta como cubierto: se infiere del
   *  contexto y no hay una línea que lo demuestre. Cuenta a medias sería decidir
   *  por el reclutador. */
  coverage: { skill: string; requirement: "MUST" | "NICE"; status: "FOUND" | "IMPLIED" | "NOT_FOUND" }[]
  /** Alineación del cargo con el que busca la vacante, de 0 a 1. */
  titleAlignment: number
}

// ─────────────────────────────────────────────────────────────────────────────
// LO QUE SALE
// ─────────────────────────────────────────────────────────────────────────────

export interface ComponentScore {
  key: ComponentKey
  pillar: Pillar
  numerator: number
  denominator: number
  ratio: number
  /** El peso REAL de este componente en el total, ya repartido (ver abajo). */
  effectiveWeight: number
  points: number
  /**
   * Cuánto sube el total al cerrar UNA unidad de este componente.
   * Es la única fuente de la ganancia que la pantalla promete.
   */
  gainPerUnit: number
}

export interface Score {
  total: number
  pillars: Record<Pillar, { points: number; max: number; ratio: number }>
  components: ComponentScore[]
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDICIONES DETERMINISTAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ¿Esta línea declara un tamaño?
 *
 * Sin lista de unidades. La vara es si el número CUANTIFICA algo, y eso se ve
 * en que lo acompaña una palabra: "12 turnos", "un 20%", "de 3 a 1". Un año
 * suelto ("2024") no cuantifica nada, y un token con dígitos pegados a letras
 * ("MIG-350", "iPhone 14") es un nombre, no una medida.
 *
 * Una lista de unidades cubriría el rubro de quien la escribió: este proyecto ya
 * midió que una así reconocía nueve unidades y dejaba pasar un rango entero.
 */
export function statesQuantity(text: string): boolean {
  const t = normalize(text)
  const tokens = t.split(" ")
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]
    if (!/\d/.test(tok)) continue
    // Un identificador (mezcla dígitos y letras) no es una medida.
    if (/^\d+$/.test(tok) === false && /%/.test(tok) === false) continue
    // Un año suelto no cuantifica.
    if (/^(19|20)\d{2}$/.test(tok)) continue
    const before = tokens[i - 1] ?? ""
    const after = tokens[i + 1] ?? ""
    // Necesita una palabra que diga DE QUÉ es ese número.
    if (/^\p{L}{2,}$/u.test(after) || /^\p{L}{2,}$/u.test(before)) return true
  }
  // El símbolo de porcentaje se pierde en la normalización de puntuación, así
  // que se lo busca sobre el crudo: "un 20%" es una medida aunque no la siga
  // ninguna palabra.
  return /\d\s*%/.test(text)
}

/**
 * Diversidad de verbos: cuántas líneas abren distinto.
 *
 * La primera palabra normalizada, comparada entre sí. No hay lista de verbos
 * fuertes ni débiles —esa lista siempre llega tarde y no existe para todos los
 * oficios—: acá sólo se mide REPETICIÓN, que es lo que un reclutador ve en
 * cinco segundos cuando seis líneas empiezan igual.
 */
export function distinctOpeners(texts: string[]): number {
  const openers = new Set<string>()
  for (const t of texts) {
    const first = normalize(t).split(" ")[0]
    if (first) openers.add(first)
  }
  return openers.size
}

// ─────────────────────────────────────────────────────────────────────────────
// EL PUNTAJE
// ─────────────────────────────────────────────────────────────────────────────

interface RawComponent {
  key: ComponentKey
  numerator: number
  /** 0 = el componente NO APLICA a este CV contra esta vacante. */
  denominator: number
}

/**
 * Reparte el peso de un pilar SOLO entre sus componentes aplicables.
 *
 * El caso que obliga a esto: una vacante sin requisitos deseables. Con el peso
 * fijo, ese 0,25 quedaría muerto y el techo del CV bajaría a 88 sin que el
 * candidato pueda hacer nada — un puntaje que castiga por cómo escribieron el
 * aviso. Repartido, quien cubre todo lo exigible llega a 100.
 */
function effectiveWeights(raws: RawComponent[]): Map<ComponentKey, number> {
  const out = new Map<ComponentKey, number>()

  /**
   * ── EL PILAR QUE NO SE PUDO MEDIR NO SE COME SUS PUNTOS ────────────────────
   *
   * Medido: un CV PERFECTO —todo cubierto, todas las viñetas completas, resumen
   * entero— mostraba 80/100 porque el pilar de lectura llegaba vacío. Veinte
   * puntos inalcanzables y un dial que dice "/100": el usuario arregla todo y el
   * número no llega nunca. Este proyecto ya pagó exactamente ese defecto con el
   * dial que prometía puntos que el techo real no permitía.
   *
   * Un pilar sin nada aplicable reparte su peso entre los que SÍ se midieron.
   * El total sigue siendo "de lo medible, cuánto cubrís", que es lo único
   * honesto que se puede decir.
   */
  const activo = (pillar: Pillar) =>
    raws.some((r) => PILLAR_OF[r.key] === pillar && r.denominator > 0)
  const pilares = Object.keys(PILLAR_WEIGHT) as Pillar[]
  const vivos = pilares.filter(activo)
  const pesoTotalVivo = vivos.reduce((s, p) => s + PILLAR_WEIGHT[p], 0)
  const escala = pesoTotalVivo > 0 ? 100 / pesoTotalVivo : 0

  for (const pillar of pilares) {
    const inPillar = raws.filter((r) => PILLAR_OF[r.key] === pillar)
    const weights = COMPONENT_WEIGHT[pillar] as Record<string, number>
    const applicable = inPillar.filter((r) => r.denominator > 0)
    const share = applicable.reduce((s, r) => s + (weights[r.key] ?? 0), 0)
    for (const r of inPillar) {
      const own = weights[r.key] ?? 0
      const w = r.denominator > 0 && share > 0 ? (own / share) * PILLAR_WEIGHT[pillar] * escala : 0
      out.set(r.key, w)
    }
  }
  return out
}

export function scoreResume(tree: ResumeTree, spec: JobSpec, audit: AuditFacts, checks: ParseChecks): Score {
  const checkValues = Object.values(checks).filter((v): v is boolean => v !== null)

  const mustTotal = spec.mustHave.length
  const niceTotal = spec.niceToHave.length
  const mustFound = audit.coverage.filter((c) => c.requirement === "MUST" && c.status === "FOUND").length
  const niceFound = audit.coverage.filter((c) => c.requirement === "NICE" && c.status === "FOUND").length

  const bulletTexts = tree.roles.flatMap((r) => r.bullets.map((b) => b.text))
  const bullets = audit.bullets
  const complete = bullets.filter((b) => b.hasActionVerb && b.hasResult && b.hasMethod).length
  const withQuantity = bulletTexts.filter(statesQuantity).length
  const summaryDone = [audit.summary.identity, audit.summary.proof, audit.summary.fit, audit.summary.extra].filter(
    Boolean,
  ).length

  const raws: RawComponent[] = [
    { key: "checks", numerator: checkValues.filter(Boolean).length, denominator: checkValues.length },
    { key: "must", numerator: mustFound, denominator: mustTotal },
    { key: "nice", numerator: niceFound, denominator: niceTotal },
    // El título es una razón continua: su "denominador" es 1 porque se cubre
    // entero o en parte, no de a unidades.
    { key: "title", numerator: clamp01(audit.titleAlignment), denominator: 1 },
    { key: "xyz", numerator: complete, denominator: bullets.length },
    { key: "metric", numerator: withQuantity, denominator: bulletTexts.length },
    { key: "verbs", numerator: distinctOpeners(bulletTexts), denominator: bulletTexts.length },
    { key: "summary", numerator: summaryDone, denominator: 4 },
  ]

  const weights = effectiveWeights(raws)
  const components: ComponentScore[] = raws.map((r) => {
    const w = weights.get(r.key) ?? 0
    const ratio = r.denominator > 0 ? clamp01(r.numerator / r.denominator) : 0
    return {
      key: r.key,
      pillar: PILLAR_OF[r.key],
      numerator: r.numerator,
      denominator: r.denominator,
      ratio,
      effectiveWeight: w,
      points: w * ratio,
      // Cerrar una unidad más sube esto, ni más ni menos. Si el componente ya
      // está completo, no queda nada que ganar.
      gainPerUnit: r.denominator > 0 && r.numerator < r.denominator ? w / r.denominator : 0,
    }
  })

  const pillars = {} as Score["pillars"]
  for (const p of Object.keys(PILLAR_WEIGHT) as Pillar[]) {
    const own = components.filter((c) => c.pillar === p)
    const points = own.reduce((s, c) => s + c.points, 0)
    const max = own.reduce((s, c) => s + c.effectiveWeight, 0)
    pillars[p] = { points, max, ratio: max > 0 ? points / max : 0 }
  }

  return {
    total: components.reduce((s, c) => s + c.points, 0),
    pillars,
    components,
  }
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return n < 0 ? 0 : n > 1 ? 1 : n
}

/**
 * La ganancia que la pantalla promete antes de aceptar.
 *
 * Sale del mismo objeto que el puntaje, no de una fórmula paralela. Ese es todo
 * el truco: no hay dos maneras de calcularlo, así que no pueden discrepar.
 */
export function gainOf(score: Score, key: ComponentKey): number {
  return score.components.find((c) => c.key === key)?.gainPerUnit ?? 0
}

/**
 * El delta REAL, medido.
 *
 * El modelo nunca dice cuánto vale su propia mejora: escribe texto, el motor lo
 * aplica sobre una COPIA, vuelve a puntuar y resta. Con catorce viñetas cuesta
 * milisegundos, así que no hay nada que optimizar ni ninguna razón para creerle
 * a una promesa.
 */
export function deltaOf(before: Score, after: Score): number {
  return after.total - before.total
}
