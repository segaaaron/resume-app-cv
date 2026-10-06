// components/editor/ats3/view-model.ts
//
// LO QUE EL MOTOR v3 MIDE, DICHO EN LA FORMA QUE LA PANTALLA YA SABÍA PINTAR.
//
// La pantalla del ATS —el dial, las seis secciones plegables, las filas de
// chequeo, la tabla de términos— es la que el producto tiene desde hace meses y
// la que el CEO pidió conservar. Lo que cambió debajo es QUIÉN calcula: antes un
// motor con ocho productores, ahora `lib/ats3`.
//
// Este archivo es la traducción entre los dos, y no decide NADA: no puntúa, no
// juzga una línea, no inventa un porcentaje. Cada número que sale de acá lo
// midió `score.ts`, y por eso el dial y las tarjetas no pueden discrepar — es la
// misma medición mirada dos veces.
//
// Es una función pura y vive fuera del componente a propósito: el bucle que
// armaba estas listas dentro de un componente de mil líneas sólo se podía
// "probar" leyendo que la línea existía, y un test que lee el código no prueba
// nada.

import type { Finding, JobSpec, ResumeTree } from "@/lib/ats3/contracts"
import { mismaRaiz, buildTermIndex, normalize, nuevaEn, termCounts, termKey } from "@/lib/ats3/contracts"
import { cvTextOf, SCORED_COMPONENTS, statesQuantity, termsOf } from "@/lib/ats3/score"
import type { AuditFacts, ComponentKey, Score } from "@/lib/ats3/score"

// ─────────────────────────────────────────────────────────────────────────────
// LO QUE LA PANTALLA NECESITA SABER, DECLARADO ACÁ
//
// Estas formas describen lo que se PINTA, no lo que el motor calcula, y por eso
// viven con el productor de la vista y no en un módulo del motor. Traerlas de
// `lib/ats/report` habría hecho que abrir la pestaña ATS cargara doce módulos
// del motor viejo —medido: 15 archivos pasaban a 44— sólo para conocer la forma
// de un objeto.
// ─────────────────────────────────────────────────────────────────────────────

/** Las seis secciones del informe, agrupadas por lo que el usuario reconoce. */
/**
 * ── POR QUÉ YA NO HAY UNA SECCIÓN «QUE TE ENCUENTREN» ────────────────────────
 *
 * Se alimentaba del componente `title` y pintaba su porcentaje. El problema no
 * era el número —el cargo se mide bien y sigue pesando en el total— sino que
 * NINGÚN hallazgo del motor declara ese componente: los que emite son `must`,
 * `nice`, `metric`, `summary`, `xyz` y `checks`. La sección filtraba sus
 * tarjetas y el resultado era siempre cero, para cualquier CV y cualquier
 * vacante. Un cajón que nunca puede contener nada, con un porcentaje malo
 * arriba y nada que apretar debajo.
 *
 * La regla del CEO es «el ATS muestra lo que falta, tailor lo soluciona»: un
 * número que nadie puede mover la contradice. El cargo no desaparece del
 * producto —sigue valiendo 0,15 del pilar de relevancia y el dial lo cuenta—;
 * lo que desaparece es la promesa de que había algo que hacer con él.
 */
export type PanelSectionId = "hard" | "soft" | "other" | "format"


export interface PanelCheck {
  id: string
  section: PanelSectionId
  state: "pass" | "warn" | "crit"
  /** Puntos que mueve. 0 es una respuesta legítima y la fila lo dice en voz alta. */
  weight: number
  titleKey: string
  detailKey?: string
  params?: Record<string, string | number>
  /** Qué lo disparó, nombrado: la línea, el requisito, el término. */
  /**
   * LA LÍNEA DE TU CV que esta tarjeta va a reescribir. Vacío si no habla de una.
   *
   * Separada de los motivos porque son dos cosas distintas y se pintaban en
   * cajas idénticas: el usuario veía tres rectángulos grises —su viñeta, un
   * motivo y un verbo suelto— y no podía saber cuál era su texto. Reportado con
   * captura: «no se ve qué bullet se quiere cambiar».
   */
  line?: string
  /** Por qué se señala. Uno por defecto, ya dicho en castellano. */
  evidence?: string[]
  /**
   * LO QUE ESTA TARJETA PROMETE CERRAR, dicho como se lo lee el usuario.
   *
   * Viaja con la petición de reescritura: la pantalla y el modelo tienen que
   * leer la misma frase, o el panel promete una cosa y el pedido pide otra.
   */
  focus: string
  /**
   * CÓMO SE CIERRA, dicho por el motor. La tarjeta dibuja SU salida y no otra:
   * `rewrite` reescribe la línea, `ask` le pregunta a la persona si tiene el
   * requisito y dónde, `none` no tiene botón de IA —se arregla en el dato—.
   */
  remedy: Finding["remedy"]
  /** El término del que habla, cuando habla de un término y no de una línea. */
  subject?: string
  /**
   * LOS REQUISITOS DE LA VACANTE QUE ESTA TARJETA NOMBRA, y nada más.
   *
   * La cabecera los lista como «lo crítico». Leía la evidencia entera, y en una
   * tarjeta fusionada eso mete el eje de la viñeta junto al requisito: medido en
   * local el 2026-09-24, la lista decía «Salesforce · No dice de qué tamaño…»,
   * una frase leída como si fuera un requisito.
   */
  requirements: string[]
  /** Por qué, dicho por el ATS en el idioma del CV. */
  reason?: string
  /** Las skills que el ATS decidió escribir en esta línea. */
  terms?: string[]
  /** `ask`: la pregunta del ATS a la persona. */
  question?: string
  /** `missing_skills`: las skills sin evidencia en el CV; la persona elige cuál tiene. */
  subjects?: string[]
}

export interface PanelSection {
  id: PanelSectionId
  /** ¿Esta sección mueve el puntaje? `false` y la tarjeta lo pone por escrito. */
  scored: boolean
  coveragePct: number | null
  checks: PanelCheck[]
}

export interface PanelTerm {
  term: string
  section: Extract<PanelSectionId, "hard" | "soft" | "other">
  /** Veces que la vacante lo dice. Se cuenta sobre el aviso, no se estima. */
  jd: number
  /** Veces que el CV lo dice. */
  cv: number
  /** Está escrito, pero ninguna línea lo demuestra. */
  listOnly: boolean
  /**
   * La auditoría lo dio por demostrado.
   *
   * Es un dato APARTE de la cuenta: el CV puede demostrar «atención al público»
   * sin escribir esas tres palabras, y entonces `cv` es 0 y esto es `true`.
   * Antes se forzaba la cuenta a 1 para que la fila no cayera en «falta» — y esa
   * tabla promete que sus números se comprueban leyendo.
   */
  proven: boolean
}

/**
 * DE QUÉ COMPONENTE DEL PUNTAJE SE ALIMENTA CADA SECCIÓN.
 *
 * Es el ÚNICO mapa del archivo, y de él salen las dos cosas a la vez: qué
 * hallazgos entran en una sección y qué porcentaje se pinta arriba. Antes eran
 * dos mapas y podían decir cosas distintas —el hallazgo del resumen bajo un
 * porcentaje que medía el cargo—, que es exactamente cómo un panel termina
 * mostrando un número que no habla de lo que lista debajo.
 *
 * Una sección con VARIOS componentes muestra el porcentaje de su pilar, no el de
 * uno de ellos elegido a mano: el número tiene que cubrir todo lo que la sección
 * lista, y eso también se deriva acá abajo en vez de decidirse a dedo.
 */
const COMPONENTS_OF: Record<PanelSectionId, ComponentKey[]> = {
  /**
   * El cargo va con las duras: es lo PRIMERO que lee un filtro y compara
   * cadenas, igual que los requisitos duros.
   */
  hard: ["must", "title", "years"],
  /**
   * Las blandas tienen componente propio y SÍ puntúan: 0,10 del pilar de
   * relevancia, el mismo peso que el motor viejo les daba y que v3 había
   * perdido.
   */
  soft: ["soft"],
  other: ["nice"],
  format: ["checks"],
}

/** La sección de un componente. Se deriva del mapa de arriba: no hay segunda lista. */
const SECTION_OF = new Map<ComponentKey, PanelSectionId>(
  (Object.entries(COMPONENTS_OF) as [PanelSectionId, ComponentKey[]][])
    .flatMap(([section, keys]) => keys.map((k) => [k, section] as [ComponentKey, PanelSectionId])),
)

/** El umbral que separa un aviso de un crítico, en puntos del propio motor. */
const CRITICAL_GAIN = 3

/**
 * El porcentaje de una sección.
 *
 * Con un solo componente, el suyo. Con varios, el del pilar que los contiene —
 * elegir uno sería pintar un número que no cubre lo que la sección muestra. Y un
 * denominador en cero NO es 0%: es "no se pudo medir", y sale del cuadro en vez
 * de leerse como "tu CV falla en esto".
 */
function pctOf(score: Score, keys: ComponentKey[]): number | null {
  const míos = score.components.filter((c) => keys.includes(c.key))
  if (míos.length === 0) return null
  if (míos.length === 1) return míos[0].denominator === 0 ? null : Math.round(míos[0].ratio * 100)
  const pilar = score.pillars[míos[0].pillar]
  return pilar && pilar.max > 0 ? Math.round(pilar.ratio * 100) : null
}

/**
 * Una tarjeta del motor, dicha como fila de chequeo. No decide nada: la decisión
 * y el motivo son del ATS; el peso, del puntaje.
 */
export function checkOf(
  f: Finding,
  /** El texto vivo de una línea: la tarjeta habla del CV que la persona tiene delante. */
  textoVivo?: (nodeId: string) => string,
  /** El nombre humano de un token del motor (el chequeo que falló, la función del resumen). */
  glosa?: (token: string, params?: Record<string, string>) => string,
): PanelCheck {
  const linea = textoVivo?.(f.nodeId) || f.nodeText
  const tokens = f.type === "parse_risk" ? f.detail.split(/\s*,\s*/).filter(Boolean) : []
  const [tiene, pide] = f.type === "years_short" ? f.detail.split("/") : []
  const params: Record<string, string | number> | undefined =
    f.type === "missing_skill"
      ? { term: paraLeer(f.subject ?? "") }
      : f.type === "missing_skills"
        ? { n: f.subjects?.length ?? 0 }
      : f.type === "role_short"
        ? { puesto: f.subject ?? "", n: f.detail }
      : f.type === "eligibility"
        ? { term: f.subject ?? "", cv: f.reason ?? "" }
      : f.type === "title_mismatch"
        ? { cargo: f.subject ?? f.detail }
        : f.type === "years_short"
          ? { tiene: tiene ?? "", pide: pide ?? "" }
          : undefined
  const evidence = [...tokens.map((t) => glosa?.(t) ?? t), ...(f.terms ?? []), ...(f.subjects ?? []).map(paraLeer)].filter((x) => x.trim())
  return {
    id: f.id,
    remedy: f.remedy,
    subject: f.subject,
    section: SECTION_OF.get(f.component) ?? "hard",
    state: f.gain >= CRITICAL_GAIN ? "crit" : "warn",
    weight: Number(f.gain.toFixed(1)),
    titleKey: f.type === "parse_risk" ? `type_parse_risk_${f.detail}` : f.type === "missing_skill" && f.detail === "listed" ? "type_missing_skill_listed" : `type_${f.type}`,
    detailKey: f.type === "missing_skill" && f.remedy === "none"
        ? "type_missing_skill_credential_detail"
        : f.type === "missing_skill" && f.detail === "listed"
          ? "type_missing_skill_listed_detail"
          : f.type === "eligibility"
            ? `type_eligibility_${f.detail === "no" ? "no" : "unknown"}_detail`
            : `type_${f.type}_detail`,
    params,
    // La línea de tu CV que la tarjeta toca: el resumen cuando se reescribe.
    line: f.remedy === "rewrite" ? linea : undefined,
    evidence,
    focus: f.reason ?? "",
    requirements: f.type === "missing_skill" || f.type === "title_mismatch" ? [f.subject ?? f.detail] : f.type === "missing_skills" ? (f.subjects ?? []) : (f.terms ?? []),
    // La elegibilidad ya cita lo que dice el CV en su detalle.
    ...(f.reason && f.type !== "eligibility" ? { reason: f.reason } : {}),
    ...(f.terms?.length ? { terms: f.terms } : {}),
    ...(f.question ? { question: f.question } : {}),
    ...(f.subjects?.length ? { subjects: f.subjects } : {}),
  }
}

/** Las seis secciones, con sus hallazgos adentro y su cobertura medida. */
export function sectionsOf(
  score: Score | null,
  findings: readonly Finding[],
  /** El texto vivo de una línea. Se pasa una vez y lo usan todas las filas. */
  textoVivo?: (nodeId: string) => string,
  /** El nombre humano de un token del motor. Se pasa una vez, igual que arriba. */
  glosa?: (token: string, params?: Record<string, string>) => string,
): PanelSection[] {
  const ids = Object.keys(COMPONENTS_OF) as PanelSectionId[]
  const checks = findings.map((f) => checkOf(f, textoVivo, glosa))
  return ids.map((id) => ({
    id,
    /**
     * Puntúa la sección cuyo componente el PUNTAJE mide, no la que simplemente
     * tiene uno: la pregunta se le hace a quien los enumera,
     * `SCORED_COMPONENTS`, en vez de contar la lista.
     */
    scored: COMPONENTS_OF[id].some((k) => (SCORED_COMPONENTS as string[]).includes(k)),
    coveragePct: score ? pctOf(score, COMPONENTS_OF[id]) : null,
    checks: checks.filter((c) => c.section === id),
  }))
}

/**
 * La tabla de términos: lo que la vacante pide, a los dos lados.
 *
 * Las cuentas se MIDEN sobre los dos textos que el panel ya tiene en la mano —el
 * aviso pegado y el CV—, no se inventan ni se piden al modelo. Es lo que vuelve
 * la tabla auditable: "lo pide 4 veces, tu CV lo dice 0" se comprueba leyendo.
 */
export function termsOfSpec(spec: JobSpec | null, audit: AuditFacts | null, jdText: string, tree: ResumeTree): PanelTerm[] {
  if (!spec) return []
  const index = buildTermIndex(termsOf(spec, tree))
  const blandas = buildTermIndex((spec.softSignals ?? []).map((x) => ({ canonical: x, variants: [] })))
  const enCv = new Map([...termCounts(index, cvTextOf(tree)), ...termCounts(blandas, cvTextOf(tree))])
  const enAviso = new Map([...termCounts(index, jdText), ...termCounts(blandas, jdText)])
  const canonico = (x: string) => index.byKey.get(termKey(x)) ?? blandas.byKey.get(termKey(x)) ?? x
  // El estado lo decide el ATS; las cuentas son sólo para leer «lo pide N veces · lo decís M».
  const estado = new Map<string, "demonstrated" | "listed" | "missing">([
    ...(audit?.hard ?? []).map((h) => [normalize(h.skill), h.status] as [string, "demonstrated" | "listed" | "missing"]),
    ...(audit?.soft ?? []).map((x) => [normalize(x.signal), x.status] as [string, "demonstrated" | "listed" | "missing"]),
  ])
  const filas: PanelTerm[] = []
  const push = (term: string, section: PanelTerm["section"]) => {
    const nombre = term.trim()
    if (!nombre || filas.some((f) => termKey(f.term) === termKey(nombre))) return
    const e = estado.get(normalize(nombre))
    const cv = enCv.get(canonico(nombre)) ?? 0
    filas.push({
      term: nombre,
      section,
      jd: enAviso.get(canonico(nombre)) ?? 0,
      cv,
      listOnly: e === "listed",
      proven: e === "demonstrated",
    })
  }
  for (const r of spec.mustHave ?? []) push(r.skill, "hard")
  for (const r of spec.niceToHave ?? []) push(r.skill, "other")
  for (const x of spec.softSignals ?? []) push(x, "soft")
  return filas
}

/**
 * LOS CUATRO NÚMEROS DE LA CABECERA, CALCULADOS EN UN SOLO LUGAR.
 *
 * ── POR QUÉ ACÁ Y NO EN EL COMPONENTE (auditoría del 2026-08-29) ────────────
 * El panel los armaba a mano al pasar las props, y ahí se le coló el defecto:
 * el renglón que existe para decir QUÉ es lo crítico recibía el texto entero de
 * cada línea señalada — con seis hallazgos, un muro que tapaba justo el dato.
 * Cuatro cifras que tienen que concordar entre sí no pueden calcularse en el
 * borde donde se pintan: se derivan juntas, una vez, de la misma medición.
 */
/**
 * «A | B» ES UN REQUISITO CON ALTERNATIVAS, NO UN NOMBRE (2026-10-02). La barra es
 * del motor; en pantalla se leía «AI/ML | agentic development», como un símbolo
 * suelto. Se muestra con la barra común de «uno u otro».
 */
export function paraLeer(term: string): string {
  return term.replace(/\s*\|\s*/g, " / ")
}

export function headlineOf(score: Score | null, sections: readonly PanelSection[]) {
  const críticos = sections.flatMap((s) => s.checks).filter((c) => c.state === "crit")
  const abiertos = sections.flatMap((s) => s.checks)
  const suma = abiertos.reduce((n, c) => n + c.weight, 0)
  return {
    /** Entero: media décima de punto no es una decisión que alguien pueda tomar. */
    score: score ? Math.round(score.total) : 0,
    criticalCount: críticos.length,
    /** De esos, los que el ejecutor sí puede cerrar escribiendo. */
    /**
     * QUÉ es lo crítico — y sólo lo que NO tiene botón: un requisito que la
     * vacante exige. Lo que tiene botón ya se explica en su propia tarjeta, y
     * repetirlo acá convierte la cabecera en una lista de todo el panel.
     */
    /**
     * QUÉ es lo crítico. Son los requisitos que la vacante exige y el CV no
     * demuestra —las secciones de habilidades—, no el texto de cada línea
     * señalada: volcarlas todas convertía la cabecera en una lista del panel
     * entero y tapaba justo el dato que este renglón existe para dar.
     */
    detail: [...new Set(críticos.flatMap((c) => c.requirements).map(paraLeer))].slice(0, 5),
    /** Nunca promete más puntos de los que quedan por ganar. */
    recoverable: score ? Math.round(Math.min(suma, Math.max(0, 100 - score.total))) : 0,
  }
}

/**
 * QUÉ LE DECIMOS A LA PERSONA CUANDO ALGO FALLA — la única respuesta.
 *
 * El panel traducía el error con el diccionario de OTRO módulo (`editor.ai`) y
 * lo que no estaba ahí se pintaba crudo: «Falló · ai_error», «stale_node»,
 * «http_502» (QA, 2026-09-29). Todo código que el ATS puede recibir —del
 * servidor, de la red o del propio motor— cae en una de cuatro clases con su
 * frase, y ninguno llega a la pantalla sin traducir.
 */
export type ErrorKey = "error_quota" | "error_plan" | "error_stale" | "error_ai"
export function errorKeyOf(code: string): ErrorKey {
  if (/^(daily_cap_reached|free_quota_exhausted|rate_limit_exceeded|http_429)$/.test(code)) return "error_quota"
  if (/^(feature_pro_only|pro_only|http_403)$/.test(code)) return "error_plan"
  if (/^(stale_node|stale)$/.test(code)) return "error_stale"
  return "error_ai"
}

/**
 * DÓNDE ESCRIBIR LO QUE LA PERSONA CONTESTÓ, dentro del puesto que eligió: la
 * línea del puesto que más comparte con su respuesta, que es donde ese trabajo
 * ya vive. Sin nada en común, la primera del puesto.
 */
export function anclaDeRespuesta(bullets: readonly { id: string; text: string }[], respuesta: string): string | null {
  return encajaEn(bullets, respuesta) ?? bullets[0]?.id ?? null
}

/** La línea que comparte palabras con ese trabajo; ninguna si no comparte nada. */
export function encajaEn(bullets: readonly { id: string; text: string }[], respuesta: string): string | null {
  // Por raíz, como el resto del motor: «API» y «APIs» son la misma palabra.
  const dichas = [...new Set(normalize(respuesta).split(" ").filter((w) => w.length >= 3))]
  let mejor: { id: string } | null = null
  let puntos = 0
  for (const b of bullets) {
    const palabras = normalize(b.text).split(" ")
    const n = dichas.filter((w) => palabras.some((p) => mismaRaiz(p, w))).length
    if (n > puntos) {
      mejor = b
      puntos = n
    }
  }
  return mejor?.id ?? null
}

/**
 * DÓNDE ESCRIBE LA IA UNA SKILL QUE FALTA (CEO, 2026-09-30):
 *  · el puesto tiene lugar (menos del máximo) → una viñeta NUEVA;
 *  · está lleno y una línea ya habla de ese trabajo → se escribe DENTRO de ella;
 *  · está lleno y ninguna encaja → REEMPLAZA a la que menos aporta a esta vacante.
 *
 * UNA BLANDA VA SIEMPRE DENTRO DE UNA VIÑETA REAL (CEO, 2026-10-05). Se demuestra
 * con un hecho, y una viñeta nueva no tiene ninguno: medido contra la API, salía
 * «…with conviction to strengthen team alignment by [x%]», relleno. Va en la línea
 * que comparte palabras con ella o, si ninguna, en la primera del puesto que
 * declara un resultado medible; si tampoco, en la primera.
 */
export function destinoDeSkill(
  role: { id: string; bullets: readonly { id: string; text: string }[] },
  sobre: string,
  maximo: number,
  menosAporta: string | null,
  blanda = false,
): { nodeId: string; nueva: boolean } | null {
  if (blanda) {
    const linea = encajaEn(role.bullets, sobre) ?? role.bullets.find((b) => statesQuantity(b.text))?.id ?? role.bullets[0]?.id
    return linea ? { nodeId: linea, nueva: false } : { nodeId: nuevaEn(role.id), nueva: true }
  }
  if (role.bullets.length < maximo) return { nodeId: nuevaEn(role.id), nueva: true }
  const encaja = encajaEn(role.bullets, sobre)
  if (encaja) return { nodeId: encaja, nueva: false }
  return menosAporta ? { nodeId: menosAporta, nueva: true } : null
}
