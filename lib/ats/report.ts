// lib/ats/report.ts
//
// EL INFORME. Uno solo, y es el único que el panel lee.
//
// EL PROBLEMA QUE ESTO CIERRA, auditado el 2026-08-20: ocho sistemas escribían en
// la misma pantalla sin saber uno del otro —el matcher, la extracción de la
// vacante, el análisis del reclutador, la salud del CV, el contenido, los chequeos
// de redacción, la credibilidad y tailor—. Seis podían hablar de la MISMA viñeta.
// Cada choque se tapaba a mano, uno por captura, y el siguiente volvía con otra
// cara. La regla del CEO estaba escrita desde la sesión anterior —"el ATS muestra
// lo que falta, tailor lo soluciona"— y lo que se había implementado era juntar
// las tarjetas en un panel, dejando a los productores intactos.
//
// La prueba de que no bajó al código: de todo el diagnóstico, tailor recibía UN
// array de keywords y la oferta cruda, así que volvía a interpretarla por su
// cuenta y devolvía su propio `missingSkills`, su propio `softSkillSuggestions`,
// su propio resumen y su propio diagnóstico de métricas. Cuatro diagnósticos
// duplicados que después el panel desempataba a mano.
//
// LAS TRES REGLAS DE ESTE ARCHIVO:
//
//   1. UN HALLAZGO, UN LUGAR. Cada `ReportCheck` vive en UNA sección. No existe
//      forma de escribirlo dos veces: el panel pinta secciones, no fuentes.
//   2. UN DUEÑO POR HALLAZGO. `owner` dice quién lo resuelve —tailor, el usuario,
//      o un arreglo determinista—. Tailor recibe los ítems que le tocan; no los
//      descubre.
//   3. SIN SALIDA NO SE MUESTRA. Un hallazgo sin `action` y sin `owner: "user"`
//      es una crítica sin botón, y eso es lo que hacía sentir el panel un pozo.
//
// EL PUNTAJE NO CAMBIA ACÁ. `score-breakdown.ts` sigue siendo su único dueño y sus
// cinco categorías siguen pesando lo mismo. Las secciones de este informe son un
// AGRUPAMIENTO DE PRESENTACIÓN: las que puntúan referencian la categoría real de
// la que salen, y las que no, lo declaran. Cambiar el modelo de puntaje es una
// decisión de producto abierta, y este archivo está escrito para no prejuzgarla.

import type { CvFixAction } from "@/lib/services/ai/shared/ai-types"
import type { ScoreCategory } from "./score-breakdown"

/**
 * Las seis secciones del informe.
 *
 * Salen del diseño aprobado (`ats-tailor-standalone.html`), que agrupa por lo que
 * el usuario reconoce —"¿me encuentra el buscador?", "¿me lee el parser?"— y no
 * por qué sistema nuestro calculó el dato. Un usuario no sabe ni tiene por qué
 * saber que las fechas las mira un chequeo determinista y el resumen un modelo.
 */
export type ReportSectionId =
  | "search"   // ¿el ATS te encuentra y te entiende?
  | "hard"     // habilidades duras que la vacante pide
  | "soft"     // habilidades blandas que la vacante pide
  | "other"    // vocabulario del rubro
  | "format"   // ¿el archivo se parsea limpio?
  | "tips"     // lo que mira la persona después del filtro

export const REPORT_SECTIONS: readonly ReportSectionId[] = [
  "search", "hard", "soft", "other", "format", "tips",
] as const

export type CheckState = "pass" | "warn" | "crit"

/**
 * Quién resuelve el hallazgo. Es el campo que hace cumplir la regla del CEO.
 *
 *   tailor  escribe el texto final. Recibe estos ítems; NO los descubre.
 *   auto    un arreglo determinista: agregar una skill, unificar fechas, borrar
 *           una línea repetida. No necesita modelo ni juicio.
 *   user    sólo lo sabe el candidato — la cifra real, el mes que falta, por qué
 *           hay un hueco entre dos puestos. Se le pregunta, no se le inventa.
 */
export type CheckOwner = "tailor" | "auto" | "user"

export interface ReportCheck {
  /** Estable entre corridas: es la clave con la que tailor dice qué resolvió. */
  id: string
  section: ReportSectionId
  state: CheckState
  /**
   * Puntos que este hallazgo mueve si se cierra. 0 es una respuesta legítima y
   * hay que decirla en voz alta: un consejo de reclutador no toca el número, y
   * callarlo es lo que hacía que alguien arreglara diez cosas y viera la nota
   * quieta, concluyendo que el panel mentía.
   */
  weight: number
  /** Clave i18n del título. Nunca texto literal: el panel es bilingüe. */
  titleKey: string
  /** Clave i18n del detalle, cuando el título no alcanza para actuar. */
  detailKey?: string
  /** Interpolaciones de las dos claves de arriba. */
  params?: Record<string, string | number>
  owner: CheckOwner
  /**
   * El botón. Ausente sólo cuando `owner === "user"`, que es el único caso en que
   * no hay nada que la aplicación pueda hacer por él.
   */
  action?: CvFixAction
  /**
   * Qué lo disparó, nombrado: los puestos, las líneas, los términos.
   *
   * "Tus fechas mezclan formatos" mandaba al usuario a buscar el problema puesto
   * por puesto — la parte que una persona hace peor sobre su propio CV. Con la
   * evidencia el aviso se vuelve accionable sin abrir nada.
   */
  evidence?: string[]
}

export interface ReportSection {
  id: ReportSectionId
  /**
   * La categoría del puntaje de la que sale esta sección, cuando sale de una.
   *
   * `null` = la sección NO mueve el puntaje, y el panel tiene que decirlo. Es la
   * respuesta al defecto reportado con captura: 100 arriba y arreglos críticos
   * abajo, sin nada explicando cómo las dos cosas pueden ser ciertas a la vez.
   */
  scoreCategory: ScoreCategory | null
  /** 0-100 de esa categoría, o `null` si la sección no puntúa. */
  coveragePct: number | null
  checks: ReportCheck[]
}

/**
 * Una skill de la vacante, con su cuenta a los dos lados.
 *
 * El conteo es lo que vuelve el informe AUDITABLE: "lo pide 4 veces, tu CV lo
 * dice 0" se puede verificar leyendo; "te falta esta skill" hay que creerlo.
 */
export interface ReportTerm {
  term: string
  /**
   * A qué sección pertenece.
   *
   * Sin este campo el riel no tenía forma de separar duras de blandas y pintaba
   * la MISMA tabla dos veces — el cruce exacto que este rediseño vino a terminar,
   * reaparecido dentro del rediseño. Lo cazó el pase de QA.
   */
  section: Extract<ReportSectionId, "hard" | "soft" | "other">
  /** Veces que aparece en la vacante. */
  jd: number
  /** Veces que aparece en el CV. */
  cv: number
  /** Aparece en el CV sólo dentro de la lista de habilidades, sin una viñeta que lo respalde. */
  listOnly: boolean
  /** El hallazgo que lo coloca, si hay uno. */
  checkId?: string
}

/**
 * La anatomía de una viñeta: verbo de acción · cifra · keyword.
 *
 * Las tres señales ya se calculaban por separado en tres lugares distintos. Verlas
 * juntas por línea es lo que convierte "mejorá tus viñetas" en "a ésta le falta
 * el número", que es una instrucción.
 */
export interface ReportBullet {
  targetId: string
  index: number
  text: string
  verb: boolean
  metric: boolean
  keywords: string[]
  words: number
}

/**
 * Lo que el lector concluye, resumido.
 *
 * NO es una fuente de hallazgos nuevos: es una NOTA sobre los mismos. Casi todo
 * lo que la credibilidad penaliza —orden invertido, fecha futura, años que no
 * cuadran, duplicados, fechas mezcladas, el título como habilidad— ya es un
 * chequeo con su sección y su botón. Emitirlos otra vez desde acá sería
 * duplicarlos, que es el defecto que este informe existe para cerrar.
 */
export interface ReportCredibility {
  /** 0-100: lo que queda de la confianza del lector. */
  score: number
  /** La peor banda abierta: qué concluye — «no es cierto», «lo escribió una máquina», «es descuidado». */
  band: "trust" | "authenticity" | "polish" | null
}

export interface AtsReport {
  /** El puntaje, tal como lo calcula `score-breakdown.ts`. Este archivo no lo toca. */
  score: number
  sections: ReportSection[]
  terms: ReportTerm[]
  bullets: ReportBullet[]
  /**
   * Pasado ~80 el riesgo se da vuelta: deja de ser el filtro y pasa a ser la
   * persona que lee al final. Se declara acá para que el panel no tenga que
   * redescubrir el umbral.
   */
  overOptimised: boolean
  credibility: ReportCredibility
  /**
   * La vacante, tal como la extrajo el análisis. Viaja acá para que el ejecutor
   * la reciba DEL INFORME y no del crudo del servidor: el panel leía 18 veces
   * `atsResult` por su cuenta, y todo lo que salía por esa puerta se mostraba
   * sin haber pasado por ninguna verificación.
   */
  posting?: ReportPosting
  /**
   * La lectura general del reclutador — prosa, sin botón.
   *
   * Es lo único del análisis que NO se puede volver un chequeo: no nombra una
   * línea, da el criterio. Por eso sobrevive cuando los hallazgos sin acción se
   * dejaron de emitir. Viaja dentro del informe por la misma razón que `posting`.
   *
   * PENDIENTE DECLARADO: su contenido todavía no se contrasta contra los
   * términos que el matcher contó. Cerrar el canal (que es esto) y filtrar la
   * prosa son dos cosas distintas; lo segundo sin un caso medido puede callar
   * justo la lectura que aporta.
   */
  verdict?: string
}

/** Lo que la vacante pide, ya extraído. El pedido al ejecutor sale de acá. */
export interface ReportPosting {
  jobTitle: string
  hardSkills: string[]
  softSkills: string[]
  mustHaves: string[]
}

/**
 * Lo que el ejecutor devuelve para UN hallazgo.
 *
 * Es la otra mitad del contrato: el informe dice qué falta, esto dice con qué se
 * cierra. La clave es `checkId` — sin ella una reescritura no sabe qué resolvió y
 * el panel vuelve a tener que adivinar por índice, que es de donde salió el
 * defecto medido: el modelo devolvió para el índice 0 una reescritura de la
 * viñeta 1, y aplicarla habría borrado una línea y duplicado otra.
 */
export interface ReportResolution {
  checkId: string
  /** El texto que entra al CV. */
  text: string
  /** Lo que hay hoy, para poder comparar antes de aplicar. */
  before?: string
  /**
   * La cifra propuesta se CONFIRMA, no se descarta.
   *
   * Antes la sugerencia entera se tiraba cuando traía un número que el CV no
   * respaldaba, y se perdía una línea mejor en todo lo demás por un dato que el
   * candidato conoce. Llega marcada: él confirma o corrige, y la cifra es suya.
   */
  needsFigureConfirm?: boolean
  /** Qué número levantaría esta línea. Nunca la cifra: qué medir. */
  metricHint?: string
  /** La blanda que esta línea pasa a demostrar. */
  demonstrates?: string
}

/** La resolución de un hallazgo, si el ejecutor la escribió. */
export function resolutionFor(
  resolutions: readonly ReportResolution[],
  checkId: string,
): ReportResolution | undefined {
  return resolutions.find((r) => r.checkId === checkId)
}

/** El umbral donde el riesgo cambia de dueño: del filtro, a la persona. */
export const OVER_OPTIMISATION_SCORE = 80

// ── Consultas sobre el informe ────────────────────────────────────────────────
//
// Viven acá y no en el panel a propósito: cada tarjeta que contestaba estas
// preguntas por su cuenta llegaba a una respuesta distinta, y así una viñeta
// terminó siendo señalada para reescribir, borrar y adaptar al mismo tiempo.

export function allChecks(report: AtsReport): ReportCheck[] {
  return report.sections.flatMap((s) => s.checks)
}

/**
 * Los ids repetidos, si los hay.
 *
 * El id es la clave con la que tailor dice qué hallazgo cerró. Repetido, una
 * reescritura cierra el equivocado y el panel muestra resuelto algo que nadie
 * tocó — un defecto silencioso, porque la pantalla queda coherente consigo misma.
 * Con ocho productores alimentando un informe, esperar que no choquen no es una
 * garantía: por eso se comprueba en vez de suponerse.
 */
export function findDuplicateCheckIds(report: AtsReport): string[] {
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const c of allChecks(report)) {
    if (seen.has(c.id)) dupes.add(c.id)
    seen.add(c.id)
  }
  return [...dupes]
}

/** Lo que todavía no está resuelto. Es lo único que se muestra como pendiente. */
export function openChecks(report: AtsReport): ReportCheck[] {
  return allChecks(report).filter((c) => c.state !== "pass")
}

/** Los que descalifican. Con uno abierto, el CV no está listo para mandar. */
export function criticalChecks(report: AtsReport): ReportCheck[] {
  return allChecks(report).filter((c) => c.state === "crit")
}

/**
 * Lo que tailor tiene que resolver, y nada más.
 *
 * Es el reemplazo del array de keywords que hoy es todo lo que recibe. Con esto
 * deja de leer la oferta cruda: se le dice qué cerrar, no que averigüe qué falta.
 */
export function tailorWorkload(report: AtsReport): ReportCheck[] {
  // `action` obligatoria: esto arma el PEDIDO AL MODELO, y un ítem sin objetivo
  // apuntado no le dice qué línea reescribir. Es el caso de los términos «sólo
  // en la lista» — son de tailor, pero viajan como término, con su propia
  // llamada, no como un hallazgo del que colgarle un `targetId` que no tiene.
  return openChecks(report).filter((c) => c.owner === "tailor" && !!c.action)
}

/**
 * TODO lo que el ejecutor puede cerrar — el flujo entero, en una función.
 *
 * «El ATS muestra lo que falta, tailor lo soluciona. Eso es todo» (CEO,
 * 2026-08-21). Mientras el ejecutor tomó SÓLO lo que escribe el modelo, el panel
 * se contradecía a la vista: el informe decía «13 sin resolver» y el botón de al
 * lado ofrecía «resolver 1». Los otros doce eran arreglos deterministas —fechas,
 * orden, una errata— que se aplicaban desde otro lado, y ese otro lado es
 * justamente el segundo lugar que este rediseño vino a cerrar.
 *
 * Un hallazgo entra si tiene una acción de verdad. Lo que queda afuera es lo que
 * NADIE puede resolver por el candidato —un requisito que cumple o no cumple, un
 * hueco entre dos empleos, los años que declara— y ésos se quedan en el informe,
 * dichos, porque ofrecer un botón que no puede cambiar nada es peor que no
 * ofrecerlo.
 */
/**
 * Los términos que la vacante pide y el CV no dice — TRABAJO, no decoración.
 *
 * Es lo que más mueve el puntaje: las duras pesan .45, más que cualquier otra
 * cosa del informe. Y sin embargo vivían sólo en la tabla, con sus dos botones
 * al costado, fuera del ejecutor. Por eso el informe decía «5 términos sin
 * decir» y el botón ofrecía «resolver 1»: lo más caro del CV no estaba contado
 * como trabajo.
 *
 * «El ATS muestra lo que falta, tailor lo soluciona» incluye esto, sobre todo
 * esto. La tabla sigue siendo la VISTA —el conteo a los dos lados es lo que la
 * vuelve auditable—; el ejecutor es el taller.
 */
/**
 * Todo lo que «aplicar todo» tiene que aplicar. Una sola respuesta, testeable.
 *
 * El botón decía «aplicar las 5» con 10 pendientes: entraban las reescrituras y
 * los términos quedaban afuera —y los términos son la palanca más grande del
 * puntaje—. Vivía como un bucle suelto dentro de un componente de 1.700 líneas,
 * donde ningún test podía mirarlo de verdad: sólo leer que la línea existía.
 */
export function applyAllPlan(
  report: AtsReport,
  appliedIds: ReadonlySet<string>,
  addedTerms?: ReadonlySet<string>,
): { checkIds: string[]; terms: string[] } {
  return {
    checkIds: solvableChecks(report).filter((c) => !appliedIds.has(c.id)).map((c) => c.id),
    // Los «sólo en la lista» NO se filtran por `addedTerms`: ese conjunto marca
    // lo agregado a Habilidades, y estos YA estaban ahí — lo que les falta es la
    // viñeta, que es otro trabajo.
    terms: weavableTerms(report).filter((x) => x.cv > 0 || !addedTerms?.has(x.term)).map((x) => x.term),
  }
}

export function missingTerms(report: AtsReport): ReportTerm[] {
  return report.terms.filter((t) => t.jd > 0 && t.cv === 0)
}

/**
 * Los que SÍ dice, pero sólo en la lista de habilidades.
 *
 * Para el filtro ya cuentan; para quien entrevista, no: una habilidad suelta en
 * una lista es una afirmación, la misma dentro de una viñeta con fecha es una
 * prueba. Escribir esa viñeta es trabajo del ejecutor — el modelo tiene el
 * puesto, la habilidad y lo que el usuario ya declaró.
 *
 * VIVÍAN FUERA. Tenían su botón en la tabla de términos y en ningún otro lado, y
 * el hallazgo que los cuenta les decía «esto sólo lo sabés vos» — una salida
 * negada en una tarjeta y ofrecida veinte líneas más abajo. Reportado con
 * captura: diez habilidades listadas y ninguna forma visible de resolverlas.
 */
export function unbackedTerms(report: AtsReport): ReportTerm[] {
  return report.terms.filter((t) => t.jd > 0 && t.cv > 0 && t.listOnly)
}

/**
 * Todo lo que el ejecutor puede escribir dentro de una viñeta. Una sola
 * respuesta, para que el modal, el riel y «aplicar todo» cuenten lo mismo.
 */
export function weavableTerms(report: AtsReport): ReportTerm[] {
  return [...missingTerms(report), ...unbackedTerms(report)]
}

export function solvableChecks(report: AtsReport): ReportCheck[] {
  return openChecks(report).filter((c) => !!c.action && c.action.kind !== "manual")
}

/**
 * Los puntos que quedan sobre la mesa.
 *
 * Suma sólo lo abierto: un hallazgo ya resuelto no promete nada, y prometer un
 * punto que no va a llegar es la clase de número que hace desconfiar del resto.
 */
export function recoverablePoints(report: AtsReport): number {
  return openChecks(report).reduce((sum, c) => sum + c.weight, 0)
}

/**
 * ¿Puede mandarlo?
 *
 * Nota por encima del umbral Y cero críticos abiertos. Las dos condiciones, no
 * una: con 100 de coincidencia y el resumen repetido tres veces, la respuesta
 * honesta es que todavía no.
 */
export const READY_SCORE = 80

export function isReadyToSend(report: AtsReport): boolean {
  return report.score >= READY_SCORE && criticalChecks(report).length === 0
}

/**
 * Un hallazgo sin salida no se muestra.
 *
 * `owner: "user"` es la única excepción y es deliberada: el mes que falta o la
 * cifra real sólo los sabe el candidato, así que la salida es la pregunta.
 */
export function isActionable(check: ReportCheck): boolean {
  // `tailor` sin `action` también tiene salida: el ejecutor. Es el caso de los
  // términos, que entran al modal como tarjeta propia en vez de como un ítem del
  // chequeo — contarlos en los dos lados era el doble conteo que este panel ya
  // pagó una vez.
  return check.owner === "user" || check.owner === "tailor" || !!check.action
}
