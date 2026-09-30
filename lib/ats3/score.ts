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

import { normalize, specTerms, type JobSpec, type ResumeTree, type TermVariants } from "@/lib/ats3/contracts"

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
   *
   * ── LOS AÑOS DE EXPERIENCIA, 0,10 (CEO, 2026-09-28) ─────────────────────────
   * Los ATS que filtran de verdad —Workday, Taleo, Greenhouse— miran los años
   * que pide el aviso, y P1 ya los extraía (`yearsRequired`) sin que nadie los
   * usara. Entran con el mismo peso que las blandas, y los demás bajan en la
   * misma proporción (×0,9): el orden entre ellos no cambia.
   */
  relevance: { must: 0.486, nice: 0.198, title: 0.126, soft: 0.09, years: 0.1 },
  /**
   * EL IMPACTO LO DECIDE EL ATS (CEO, 2026-09-29): cuántas viñetas ya sirven
   * para este puesto tal como están, cuántas de las que necesitan cifra la
   * tienen, y el resumen.
   */
  impact: { bullets: 0.55, metric: 0.3, summary: 0.15 },
} as const

/**
 * LO QUE EL PUNTAJE MIDE. Cada uno tiene su pilar y su peso.
 */
export type ScoredComponent =
  | "checks"
  | "must"
  | "nice"
  | "title"
  | "years"
  | "bullets"
  | "metric"
  | "summary"
  | "soft"

/** Lo que un hallazgo puede nombrar: hoy, exactamente lo que el puntaje mide. */
export type ComponentKey = ScoredComponent

const PILLAR_OF: Record<ScoredComponent, Pillar> = {
  checks: "parse",
  must: "relevance",
  nice: "relevance",
  title: "relevance",
  years: "relevance",
  bullets: "impact",
  metric: "impact",
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

/**
 * EL DIAGNÓSTICO DEL ATS (P2), tal como lo decide el modelo (CEO, 2026-09-29).
 *
 * El código no reinterpreta nada de esto: comprueba que las líneas citadas
 * existan, lo muestra y puntúa con estos estados.
 */
export interface AuditFacts {
  /** Una decisión por viñeta, contra ESTE puesto. */
  bullets: {
    id: string
    /** keep: ya sirve así · improve: sirve y hay que mejorarla · remove: no sirve o repite a otra. */
    decision: "keep" | "improve" | "remove"
    /** Por qué, en una frase, en el idioma del CV. */
    reason: string
    /** improve: qué tiene que decir la línea nueva, con los hechos del CV a usar. */
    instruction: string | null
    /** improve: los hechos nuevos del CV que la línea va a decir, cada uno con su fuente. */
    facts?: string[]
    /** Este puesto necesita la cifra de este logro. */
    needsFigure: boolean
    /** Tailor ya escribió esta línea siguiendo al ATS: no recibe más encargos. */
    cerrada?: boolean
    /** Dice qué se hizo y no qué logró (X-Y-Z): Tailor agrega el logro con su hueco. */
    needsOutcome?: boolean
  }[]
  /** Cada hard skill del puesto, con su estado y dónde vive. */
  hard: {
    skill: string
    requirement: "MUST" | "NICE"
    /** demonstrated: una viñeta la prueba · listed: sólo está nombrada (habilidades, otra sección) · missing: no está. */
    status: "demonstrated" | "listed" | "missing"
    evidenceNodeId: string | null
    /** Si falta pero hay trabajo relacionado: la viñeta donde escribirla. */
    writeIn: string | null
    /** Si no hay rastro: la pregunta para la persona. */
    question: string | null
  }[]
  /** Cada soft skill del puesto, igual. Una soft se demuestra en un logro, no se lista. */
  soft: {
    signal: string
    status: "demonstrated" | "listed" | "missing"
    evidenceNodeId: string | null
    writeIn: string | null
  }[]
  /** Las cuatro funciones del resumen, cumplidas o no. */
  summary: { identity: boolean; proof: boolean; fit: boolean; extra: boolean }
  /** Las condiciones que filtran (residencia, permiso, idioma): si el CV muestra que se cumplen. */
  conditions?: { text: string; met: "yes" | "no" | "unknown"; cvSays: string | null }[]
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
/** Una fecha como rango de meses: con mes, un punto; con sólo el año, el año entero. */
export type Mes = { min: number; max: number }
/** El puesto sigue abierto: no termina, así que no deja hueco ni solape. */
export const ABIERTO: Mes = { min: Infinity, max: Infinity }
/** «Presente», «current», «actual»: el puesto sigue abierto. */
export const FECHA_ABIERTA = /presente|current|actual/i

/**
 * LA FECHA COMO CANTIDAD DE MESES. Un solo lector para todo el motor: la
 * línea de tiempo, el orden de los puestos y los años de experiencia.
 */
export function mes(fecha: string): Mes | null {
  const m = fecha.match(/(\d{4})[-/](\d{1,2})|(\d{1,2})[-/](\d{4})|(\d{4})/)
  if (!m) return null
  const anio = Number(m[1] ?? m[4] ?? m[5])
  const numeroMes = m[2] ?? m[3]
  if (numeroMes === undefined) return { min: anio * 12 + 1, max: anio * 12 + 12 }
  const punto = anio * 12 + Math.min(12, Math.max(1, Number(numeroMes)))
  return { min: punto, max: punto }
}

/**
 * ¿CUÁNTOS AÑOS DE EXPERIENCIA PRUEBA EL CV?
 *
 * La suma de los períodos de sus puestos SIN contar dos veces los que se
 * superponen: dos trabajos a la vez son un año de experiencia, no dos. Un año
 * sin mes se lee entero («2017 — 2020» va de enero de 2017 a diciembre de 2020),
 * que es como lo lee una persona. Un puesto abierto llega hasta hoy.
 */
export function experienceYears(tree: ResumeTree, hoy: Date = new Date()): number {
  const ahora = hoy.getFullYear() * 12 + hoy.getMonth() + 1
  const tramos = tree.roles
    .map((r) => {
      const desde = mes(r.startDate)
      const hasta = !r.endDate.trim() || FECHA_ABIERTA.test(r.endDate) ? null : mes(r.endDate)
      // Nunca más allá de hoy: un «2026» suelto es el año entero, y contaba los
      // meses que todavía no pasaron (medido el 2026-09-28: 12 años donde las
      // fechas daban 11).
      return desde ? { desde: desde.min, hasta: Math.min(hasta ? hasta.max : ahora, ahora) } : null
    })
    .filter((t): t is { desde: number; hasta: number } => t !== null && t.hasta >= t.desde)
    .sort((a, b) => a.desde - b.desde)
  let meses = 0
  let fin = -Infinity
  for (const t of tramos) {
    const desde = Math.max(t.desde, fin + 1)
    if (t.hasta >= desde) meses += t.hasta - desde + 1
    fin = Math.max(fin, t.hasta)
  }
  return meses / 12
}

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
  const formas = titleForms(spec.roleTitleRaw ?? "").map(normalize).filter(Boolean)
  if (formas.length === 0) return true // Sin cargo en el aviso no hay nada que comparar.
  const donde = ` ${[tree.summary.text, ...tree.roles.map((r) => r.title)].map(normalize).join(" · ")} `
  return formas.some((f) => donde.includes(` ${f} `))
}

/**
 * UN CARGO CON BARRA SON VARIOS CARGOS, Y CUALQUIERA CUMPLE.
 *
 * Medido el 2026-09-28: la vacante buscaba «Cajera / Cajero de Supermercado» y
 * el puntaje exigía esa cadena entera con la barra. Ningún CV la escribe así,
 * así que la tarjeta del cargo no se cerraba nunca. La barra separa formas del
 * mismo cargo, y la palabra suelta comparte el resto con su vecina:
 *
 *   «Cajera / Cajero de Supermercado»  → Cajera de Supermercado · Cajero de Supermercado
 *   «Frontend Developer / Engineer»    → Frontend Developer · Frontend Engineer
 *   «Vendedor/a»                       → Vendedor · Vendedora
 *
 * Sólo la barra con espacios, o la del género al final: «CI/CD» es un nombre.
 * ponytail: tres o más alternativas, o dos de varias palabras, quedan como
 * están escritas; alcanza para cómo se redactan los cargos de verdad.
 */
export function titleForms(raw: string): string[] {
  const t = raw.trim()
  if (!t) return []
  const genero = t.match(/^(.*\p{L})\/(as?|os?)$/iu)
  if (genero) {
    const base = genero[1]
    return [base, /[aeo]$/i.test(base) ? base.replace(/[aeo]$/i, genero[2]) : base + genero[2]]
  }
  // Alternativas del aviso («Scrum | Kanban», ver P1 regla 1b): cada una es su
  // propio nombre y escribir cualquiera cumple.
  const opciones = t.split(/\s*\|\s*/).filter(Boolean)
  if (opciones.length > 1) return opciones
  const partes = t.split(/\s+\/\s+/)
  if (partes.length !== 2) return [t]
  const [a, b] = partes.map((p) => p.split(/\s+/))
  if (a.length === 1 && b.length > 1) return [[a[0], ...b.slice(1)].join(" "), b.join(" ")]
  if (b.length === 1 && a.length > 1) return [a.join(" "), [...a.slice(0, -1), b[0]].join(" ")]
  return [a.join(" "), b.join(" ")]
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

/** Los términos en juego: los que la vacante nombra y los que el CV declara. */
export function termsOf(spec: JobSpec, tree: ResumeTree): TermVariants[] {
  const out = specTerms(spec)
  // «Swift Package Manager / SPM» son DOS nombres del mismo término, no uno
  // largo: entero, le robaba por match maximal la aparición a «Swift Package
  // Manager» y el panel decía que el CV no lo nombraba. Se parte sólo por la
  // barra CON espacios: «CI/CD» y «async/await» son un nombre.
  for (const s of tree.declaredSkills.flatMap((x) => x.split(/\s+\/\s+|\s*[,;|]\s*/))) {
    if (normalize(s) && !out.some((o) => normalize(o.canonical) === normalize(s))) out.push({ canonical: s.trim(), variants: [] })
  }
  return out
}

/**
 * TODO LO QUE EL CV DICE, como lo lee un filtro.
 *
 * ── EL CABLE QUE ESTABA CORTADO (2026-09-24, medido en producción) ─────────
 * `otherText` existía en el árbol desde el primer día —«participa del puntaje,
 * no se reescribe»— y nadie lo mandaba, la ruta lo descartaba y el motor no lo
 * leía. El aviso pedía «English B2» y el CV lo decía en Idiomas: el panel lo
 * daba por faltante. Un filtro lee el documento entero, no tres secciones.
 */
export function cvTextOf(tree: ResumeTree): string {
  return [
    tree.summary.text,
    ...tree.roles.flatMap((r) => [r.title, r.company, ...r.bullets.map((b) => b.text)]),
    ...tree.declaredSkills,
    tree.otherText,
  ].join(" . ")
}

export function scoreResume(tree: ResumeTree, spec: JobSpec, audit: AuditFacts, checks: ParseChecks): Score {
  const checkValues = Object.values(checks).filter((v): v is boolean => v !== null)

  /**
   * LAS SKILLS, CON LA MISMA VARA PARA DURAS Y BLANDAS: demostrada en un logro
   * vale 1, sólo nombrada 0,6, ausente 0. Lo decide el ATS; una que el ATS no
   * contestó cuenta como ausente — lo que no afirmó, no está.
   */
  const VALOR = { demonstrated: 1, listed: 0.6, missing: 0 } as const
  const lineas = new Set([tree.summary.id, ...tree.roles.flatMap((r) => r.bullets.map((b) => b.id))])
  const valor = (x: { status: keyof typeof VALOR; evidenceNodeId: string | null }) =>
    // Demostrada en una línea que ya no existe: queda nombrada, no probada.
    x.status === "demonstrated" && x.evidenceNodeId && !lineas.has(x.evidenceNodeId) ? VALOR.listed : VALOR[x.status]
  const suma = (req: "MUST" | "NICE") => {
    const pedidas = (req === "MUST" ? spec.mustHave : spec.niceToHave) ?? []
    const juicio = new Map(audit.hard.filter((h) => h.requirement === req).map((h) => [normalize(h.skill), h]))
    return {
      total: pedidas.length,
      found: pedidas.reduce((n, r) => {
        const h = juicio.get(normalize(r.skill))
        return n + (h ? valor(h) : 0)
      }, 0),
    }
  }
  const exigidos = suma("MUST")
  const deseables = suma("NICE")
  const juicioBlando = new Map(audit.soft.map((x) => [normalize(x.signal), x]))
  const pedidasBlandas = [...new Set((spec.softSignals ?? []).map(normalize).filter(Boolean))]
  const softFound = pedidasBlandas.reduce((n, x) => {
    const j = juicioBlando.get(x)
    return n + (j ? valor(j) : 0)
  }, 0)

  /**
   * LAS VIÑETAS: sólo las que el CV tiene hoy. Una que Tailor ya reescribió o
   * que se sacó deja de contar en los dos lados, y el número sube; el análisis
   * siguiente la juzga sobre su texto nuevo.
   */
  const idsReales = new Set(tree.roles.flatMap((r) => r.bullets.map((b) => b.id)))
  const textoDe = new Map(tree.roles.flatMap((r) => r.bullets.map((b) => [b.id, b.text] as const)))
  const juzgadas = audit.bullets.filter((b) => idsReales.has(b.id))
  const sirven = juzgadas.filter((b) => b.decision === "keep").length
  const conCifra = juzgadas.filter((b) => b.needsFigure)
  const cifradas = conCifra.filter((b) => statesQuantity(textoDe.get(b.id) ?? "")).length
  const summaryDone = [audit.summary.identity, audit.summary.proof, audit.summary.fit, audit.summary.extra].filter(Boolean).length

  const raws: RawComponent[] = [
    { key: "checks", numerator: checkValues.filter(Boolean).length, denominator: checkValues.length },
    { key: "must", numerator: exigidos.found, denominator: exigidos.total },
    { key: "nice", numerator: deseables.found, denominator: deseables.total },
    // El cargo lo mide el código: el filtro compara la cadena escrita.
    { key: "title", numerator: titleWritten(tree, spec) ? 1 : 0, denominator: 1 },
    { key: "soft", numerator: softFound, denominator: pedidasBlandas.length },
    // Con la mitad de los años pedidos, la mitad del peso. Sin años en el aviso no aplica.
    {
      key: "years",
      numerator: spec.yearsRequired ? Math.min(1, experienceYears(tree) / spec.yearsRequired) : 0,
      denominator: spec.yearsRequired ? 1 : 0,
    },
    { key: "bullets", numerator: sirven, denominator: juzgadas.length },
    { key: "metric", numerator: cifradas, denominator: conCifra.length },
    { key: "summary", numerator: summaryDone, denominator: 4 },
  ]

  const weights = effectiveWeights(raws)
  /**
   * UN DESEABLE NUNCA VALE MÁS QUE UN OBLIGATORIO.
   *
   * ── MEDIDO EN PRODUCCIÓN (2026-09-24) ───────────────────────────────────────
   * `must` y `nice` reparten su peso entre sus propios requisitos. Con 17
   * obligatorios y 3 deseables, cada deseable valía 3,3 puntos y cada
   * obligatorio 1,5: «Kotlin Multiplatform», que el aviso pone como «nice to
   * have», salía en la cabecera como arreglo CRÍTICO y por encima de lo que el
   * aviso exige. El orden de los pesos (0,54 contra 0,22) decía lo contrario de
   * lo que el usuario leía.
   *
   * El total de los dos no cambia; sólo se impide que la unidad deseable supere
   * a la obligatoria. En el tope valen lo mismo por unidad.
   */
  const must = raws.find((r) => r.key === "must")
  const nice = raws.find((r) => r.key === "nice")
  if (must && nice && must.denominator > 0 && nice.denominator > 0) {
    const juntos = (weights.get("must") ?? 0) + (weights.get("nice") ?? 0)
    const tope = (juntos * nice.denominator) / (must.denominator + nice.denominator)
    if ((weights.get("nice") ?? 0) > tope) {
      weights.set("nice", tope)
      weights.set("must", juntos - tope)
    }
  }
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
