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
  /**
   * LAS BLANDAS PUNTÚAN, Y ESTE 0,10 NO ES NUEVO.
   *
   * ── LA REGRESIÓN QUE ESTO CIERRA (verificada, 2026-09-09) ──────────────────
   * El motor viejo las pesaba: `lib/ats/scoring-config.ts:56` —
   * `softSkills: { value: 0.10, basis: "chosen" }`—. Al construir v3 de cero el
   * 2026-08-29 ese peso no se volvió a escribir, y durante diez días el panel
   * pidió demostrarlas mientras el número no se movía: trabajo que el producto
   * exige y no paga.
   *
   * No fue una decisión de producto. Quedó anotado como si lo fuera y no lo era.
   *
   * Los otros tres bajan proporcionalmente para dejarle su lugar: `must` sigue
   * pesando más del doble que `nice`, y el orden entre ellos no cambia.
   */
  relevance: { must: 0.54, nice: 0.22, title: 0.14, soft: 0.1 },
  impact: { xyz: 0.45, metric: 0.3, verbs: 0.1, summary: 0.15 },
} as const

/**
 * LO QUE EL PUNTAJE MIDE. Cada uno tiene su pilar y su peso.
 */
export type ScoredComponent =
  | "checks"
  | "must"
  | "nice"
  | "title"
  | "xyz"
  | "metric"
  | "verbs"
  | "summary"
  | "soft"

/**
 * LO QUE UN HALLAZGO PUEDE NOMBRAR — hoy, lo mismo.
 *
 * ── EL CRUCE QUE ESTO CIERRA (CEO, 2026-09-09) ──────────────────────────────
 * Una habilidad blanda sin demostrar salía con el componente `xyz`, que
 * pertenece a «Lo que mira la persona»: la tarjeta de una blanda aparecía en la
 * sección del reclutador, bajo un porcentaje que mide otra cosa. Y la sección
 * «Habilidades blandas» existía sin poder recibir ni una tarjeta.
 *
 * `soft` es un componente que el puntaje NO mide, y eso es lo correcto: las
 * blandas no puntúan por decisión de producto. Al no estar entre los medidos, la
 * sección no pinta porcentaje —`pctOf` devuelve null— así que «esto no mueve el
 * número» queda dicho por construcción, no por una excepción escrita a mano.
 *
 * Son dos tipos porque son dos preguntas. Con uno solo había que elegir entre
 * dejar a las blandas fuera de las secciones o meterlas en el cálculo, y las dos
 * están mal.
 */
export type ComponentKey = ScoredComponent

const PILLAR_OF: Record<ScoredComponent, Pillar> = {
  checks: "parse",
  must: "relevance",
  nice: "relevance",
  title: "relevance",
  xyz: "impact",
  metric: "impact",
  verbs: "impact",
  summary: "impact",
  soft: "relevance",
}

/**
 * LOS COMPONENTES QUE EL PUNTAJE MIDE, como dato.
 *
 * Sale de `PILLAR_OF`, que es quien los enumera de verdad: preguntar «¿esto
 * puntúa?» en otra lista escrita a mano es como una sección termina diciendo que
 * mueve un número que nadie calcula.
 */
export const SCORED_COMPONENTS = Object.keys(PILLAR_OF) as ScoredComponent[]


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
  coverage: {
    skill: string
    requirement: "MUST" | "NICE"
    status: "FOUND" | "IMPLIED" | "NOT_FOUND"
    /** DÓNDE lo demuestra. Sin esto no se distingue lo cubierto de lo enterrado. */
    evidenceNodeId: string | null
  }[]
  /**
   * LAS BLANDAS QUE EL AVISO PIDE, JUZGADAS.
   *
   * Se extraían de la vacante, se pintaban en una tabla y NADIE las miraba: el
   * panel le mostraba al candidato una lista contando apariciones literales,
   * que es justo como NO se demuestra una habilidad blanda. Una blanda no se
   * cumple porque la palabra esté escrita —así se cumple sólo en la lista de
   * adjetivos que todo reclutador saltea—: se cumple si hay un logro que la
   * evidencia, y por eso el estado trae el id de esa línea.
   *
   * NO entra al puntaje, y es decisión de producto: sumarlas movería el número
   * de todos los CVs sin una medición que lo respalde. Informa, no puntúa.
   */
  softCoverage: {
    signal: string
    status: "DEMONSTRATED" | "DECLARED_ONLY" | "ABSENT"
    /** La línea que la demuestra. Sin ella, no está demostrada. */
    evidenceNodeId: string | null
  }[]
  /** Alineación del cargo con el que busca la vacante, de 0 a 1. */
  // Acá vivía `titleAlignment`, un 0..1 que el modelo devolvía para el cargo.
  // Lo reemplazó `titleWritten`, que mide lo que el filtro mide —si la cadena
  // está escrita— con la misma función que emite el hallazgo. Un campo que se le
  // pide al modelo y no lo lee nadie son tokens pagados por nada.
}

// ─────────────────────────────────────────────────────────────────────────────
// LO QUE SALE
// ─────────────────────────────────────────────────────────────────────────────

export interface ComponentScore {
  /** Sólo lo que el puntaje mide: `soft` no llega acá porque no se calcula. */
  key: ScoredComponent
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
/**
 * ¿EL CARGO QUE LA VACANTE BUSCA ESTÁ ESCRITO EN EL CV?
 *
 * Una sola función para las dos preguntas que dependen de esto: cuánto suma el
 * cargo al puntaje y si hay que señalarlo. Con dos, el panel muestra una tarjeta
 * que promete puntos que el número no da — medido.
 *
 * Por PALABRA y no por subcadena: una vacante que busca «Dev» no está cubierta
 * por un CV que dice «Developer», aunque la cadena viva adentro. Es el defecto
 * que este proyecto ya pagó con «plusvalía contiene plus».
 */
export function titleWritten(tree: ResumeTree, spec: JobSpec): boolean {
  const cargo = normalize(spec.roleTitleRaw ?? "")
  if (!cargo) return true // Sin cargo en el aviso no hay nada que comparar.
  const donde = ` ${[tree.summary.text, ...tree.roles.map((r) => r.title)].map(normalize).join(" · ")} `
  return donde.includes(` ${cargo} `)
}

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
  key: ScoredComponent
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

/**
 * CUÁNTO PESA CADA REQUISITO, MEDIDO SOBRE EL PROPIO AVISO.
 *
 * ── LA REGLA, DEL CEO ──────────────────────────────────────────────────────
 * «Lo que se repite y lo que abre la descripción pesa más que lo listado al
 * final». No todos los requisitos valen igual, y contarlos por cabeza le dice
 * al candidato que cubrir el que el aviso menciona al pasar vale tanto como
 * cubrir el que repite cuatro veces.
 *
 * ── POR QUÉ SE MIDE ACÁ Y NO SE LE PREGUNTA AL MODELO ──────────────────────
 * El orden que devuelve un modelo puede cambiar entre dos lecturas del MISMO
 * aviso, y este proyecto ya midió lo que eso hace: 19 puntos de diferencia en
 * el mismo CV. Esto se cuenta sobre el texto: la misma vacante da siempre el
 * mismo peso.
 *
 * ── LA ESCALA, Y POR QUÉ ES CORTA ──────────────────────────────────────────
 * Base 1. Nombrado en el cargo que la vacante busca, +0,5 — es lo que el aviso
 * pone en el título. Dicho tres veces o más, +0,25. Techo 1,75: una escala
 * larga convierte el puntaje en una opinión sobre cuánto vale repetir, y lo que
 * se puede probar es sólo que repetir importa, no cuánto.
 */
export function postingWeights(spec: JobSpec, jdText: string): Record<string, number> {
  const aviso = ` ${normalize(jdText)} `
  const titulo = ` ${normalize(`${spec.roleTitleRaw ?? ""} ${spec.roleTitleCanonical ?? ""}`)} `
  const pesos: Record<string, number> = {}
  for (const r of [...(spec.mustHave ?? []), ...(spec.niceToHave ?? [])]) {
    const aguja = normalize(r.raw || r.skill)
    if (!aguja) continue
    pesos[r.skill] = 1 + (titulo.includes(` ${aguja} `) ? 0.5 : 0) + (veces(aviso, aguja) >= 3 ? 0.25 : 0)
  }
  return pesos
}

/**
 * CUÁNTAS VECES DICE ESTE TEXTO ESE TÉRMINO — como PALABRA, no como subcadena.
 *
 * ── EL DEFECTO QUE ESTO CIERRA, MEDIDO ANTES DE SUBIRLO ────────────────────
 * La primera versión buscaba la subcadena y le daba peso extra a "R" en un
 * aviso donde la letra aparece dentro de "buscamos", "analista" y "reportes";
 * "Excel" contaba dentro de "excelente" y "excelencia". Es la misma clase que
 * este proyecto ya pagó con «plusvalía» conteniendo «plus».
 *
 * Los dos textos van rodeados de espacios y la aguja también: `normalize`
 * convierte toda puntuación en separador, así que un límite de palabra es un
 * espacio y nada más. Funciona igual para "SQL" que para "atención al público".
 */
function veces(textoConBordes: string, aguja: string): number {
  const pat = ` ${aguja} `
  let n = 0
  for (let i = textoConBordes.indexOf(pat); i !== -1; i = textoConBordes.indexOf(pat, i + 1)) n++
  return n
}

export function scoreResume(
  tree: ResumeTree,
  spec: JobSpec,
  audit: AuditFacts,
  checks: ParseChecks,
  /**
   * El peso de cada requisito. Sin él, todos valen 1 y el puntaje es el de
   * antes: el re-cálculo instantáneo de la pantalla no recibe el aviso, y un
   * puntaje que cambia según quién lo calcula es peor que uno más grueso.
   */
  termWeights: Record<string, number> = {},
): Score {
  const checkValues = Object.values(checks).filter((v): v is boolean => v !== null)

  // Cubrir el requisito que el aviso repite vale más que cubrir el que menciona
  // al pasar. Sin pesos, cada uno vale 1 y esto es la cuenta de siempre.
  const peso = (skill: string) => termWeights[skill] ?? 1
  const mustTotal = (spec.mustHave ?? []).reduce((n, r) => n + peso(r.skill), 0)
  const niceTotal = (spec.niceToHave ?? []).reduce((n, r) => n + peso(r.skill), 0)
  const mustFound = audit.coverage
    .filter((c) => c.requirement === "MUST" && c.status === "FOUND")
    .reduce((n, c) => n + peso(c.skill), 0)
  const niceFound = audit.coverage
    .filter((c) => c.requirement === "NICE" && c.status === "FOUND")
    .reduce((n, c) => n + peso(c.skill), 0)

  /**
   * UNA BLANDA DEMOSTRADA VALE MÁS QUE UNA SÓLO LISTADA.
   *
   * La vara ya estaba decidida en este proyecto —demostrada 1,0 · sólo listada
   * 0,6— y es la única honesta: un término dentro de una viñeta con fecha es
   * prueba; el mismo término suelto en una lista de adjetivos es una afirmación
   * que cualquiera puede escribir. Ausente no suma.
   *
   * Sale de `softCoverage`, que la auditoría ya juzga en cada análisis: no
   * cuesta una llamada nueva.
   */
  const softTotal = (spec.softSignals ?? []).length
  const softFound = audit.softCoverage.reduce(
    (n, s) => n + (s.status === "DEMONSTRATED" ? 1 : s.status === "DECLARED_ONLY" ? 0.6 : 0),
    0,
  )

  const bulletTexts = tree.roles.flatMap((r) => r.bullets.map((b) => b.text))
  /**
   * SÓLO LAS LÍNEAS QUE EL CV TIENE DE VERDAD.
   *
   * El juicio por viñeta lo devuelve un modelo, y un modelo puede contestar por
   * una línea que no existe —un id mal copiado, una que ya se borró—. Contarla
   * sube el numerador Y el denominador de un pilar entero con una línea que
   * nadie escribió, y encima el motor la ignora al emitir hallazgos: el puntaje
   * y la lista de arreglos hablarían de CVs distintos.
   */
  const idsReales = new Set(tree.roles.flatMap((r) => r.bullets.map((b) => b.id)))
  const bullets = audit.bullets.filter((b) => idsReales.has(b.id))
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
    /**
     * EL CARGO LO MIDE EL CÓDIGO, NO EL MODELO. Un dueño para una pregunta.
     *
     * ── LOS DOS DEFECTOS QUE ESTO CIERRA, MEDIDOS ──────────────────────────
     * El puntaje usaba `titleAlignment` —un número del modelo entre 0 y 1— y el
     * hallazgo del cargo usa una comprobación de cadena. Dos respuestas a «¿el
     * cargo coincide?», y se contradecían:
     *
     *   titleAlignment = 1   → la tarjeta salía y prometía 0,0 puntos
     *   titleAlignment = 0,5 → la tarjeta prometía el peso ENTERO del componente
     *
     * Y hay un motivo de fondo para que gane el código: el filtro compara
     * CADENAS. Que el modelo entienda que «Desarrollador iOS» y «iOS Engineer»
     * son el mismo puesto no sirve de nada si el filtro no lo ve escrito. Se
     * mide lo que el filtro mide, con la misma función que emite el hallazgo:
     * escribir el cargo cierra la tarjeta Y sube el número, por construcción.
     */
    { key: "title", numerator: titleWritten(tree, spec) ? 1 : 0, denominator: 1 },
    { key: "soft", numerator: softFound, denominator: softTotal },
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

// ─────────────────────────────────────────────────────────────────────────────
// EL SEMÁFORO
//
// Vive con el puntaje porque es una LECTURA del puntaje, y así ninguna pantalla
// necesita un módulo propio para preguntar de qué color va un número.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ¿Puede mandarlo?
 *
 * Nota por encima del umbral Y cero críticos abiertos. Las dos condiciones, no
 * una: con 100 de coincidencia y el resumen repetido tres veces, la respuesta
 * honesta es que todavía no.
 */
export const READY_SCORE = 80

/**
 * Debajo de esto el CV no compite: no es «podría mejorar», es que el filtro lo
 * deja afuera. Entre este número y `READY_SCORE`, amarillo — hay con qué trabajar.
 */
export const WARN_SCORE = 55

/** Rojo, amarillo o verde. La regla del CEO, en un solo lugar. */
export type ScoreBand = "bad" | "warn" | "ok"

/**
 * EL SEMÁFORO DEL PANEL, CON UN DUEÑO Y ACÁ.
 *
 * Vive con el puntaje porque es una LECTURA del puntaje: preguntar de qué color
 * va un número no puede obligar a nadie a cargar otro módulo. La regla es del
 * CEO —<55 rojo · 55-79 amarillo · ≥80 verde— y sólo la usa la pantalla de este
 * motor.
 */
export function scoreBand(pct: number): ScoreBand {
  if (pct >= READY_SCORE) return "ok"
  return pct >= WARN_SCORE ? "warn" : "bad"
}
