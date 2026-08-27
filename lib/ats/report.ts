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
  /**
   * QUÉ CAMBIAR, EN PALABRAS DEL MODELO. Texto crudo, no clave i18n.
   *
   * ── EL DEFECTO QUE CIERRA (reportado con captura, 2026-08-21) ─────────────
   *
   * El hallazgo del reclutador llega con cuatro campos —`issue`, `why`, `fix`,
   * `needsFromYou`— y la tarjeta mostraba UNO: `issue`, crudo, como título entre
   * comillas. El resto se tiraba en el `push()`.
   *
   * Resultado en pantalla: una cita, la etiqueta «AVISO · no mueve el número» y
   * un botón «Aplicar». Ni qué está mal, ni qué cambia si aprieta. La pregunta
   * del CEO fue literal: «me decís algo pero no existe mejora para eso, ¿qué
   * hago con eso?». No había respuesta posible en la tarjeta.
   *
   * Es texto del modelo y por eso NO es una clave: viaja crudo, igual que
   * `issue`. Va en su propio campo y no dentro de `detailKey` porque ese hueco
   * lo rotula la tarjeta como «Por qué importa», y el cambio a hacer no es la
   * razón — meterlo ahí sería etiquetar mal para ahorrarse un campo.
   */
  fixHint?: string
  /**
   * El ejemplo desarrollado de cómo se ve la línea terminada, con cifras de
   * MUESTRA. Se muestra rotulado como ejemplo y nunca se aplica: los números son
   * ilustrativos y sólo el candidato puede confirmar el suyo.
   */
  exampleHint?: string
  /**
   * ESTO INFORMA. NO HAY NADA QUE APLICAR, Y ES A PROPÓSITO.
   *
   * ── POR QUÉ HIZO FALTA UN TERCER ESTADO (CEO, 2026-08-22) ────────────────
   *
   *   «Agregá esta parte pero sólo como información, sin que se pueda ejecutar
   *    algún cambio.»
   *
   * Hasta acá un hallazgo era `tailor` (lo escribe el modelo), `auto` (lo aplica
   * el código) o `user` (sólo él tiene el dato que falta). Los tres asumen que
   * hay UNA respuesta correcta y que alguien la va a escribir.
   *
   * La foto en el CV no tiene respuesta correcta: en EE.UU. descarta por
   * precaución legal, en México es estándar. Depende de a dónde se postule, y eso
   * no lo sabemos. Con `owner: "user"` la tarjeta le prometía «ponelo en el
   * editor y el chequeo se cierra solo» — y este chequeo no se cierra nunca,
   * porque no hay nada que cerrar.
   *
   * Un informativo no lleva botón, no pesa en el puntaje, no cuenta como trabajo
   * pendiente y no dispara el aviso de «hallazgo sin salida»: su salida es
   * saberlo.
   */
  informational?: boolean
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
   * LOS PUNTOS QUE HAY DE VERDAD SOBRE LA MESA.
   *
   * Sale del desglose (`score-breakdown.ts`), el único que sabe cuánto vale
   * cerrar cada brecha: las duras pesan .45, los requisitos .20, el título .15.
   * Viaja en el informe porque el panel no puede recalcularlo — y porque
   * derivarlo de otra cosa fue exactamente el defecto que esto cierra.
   */
  recoverable: number
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
  /**
   * Nivel y años que pide el aviso (F2).
   *
   * Viajan para INFORMAR: la tarjeta los muestra y el crítico los lee. No entran
   * al puntaje —pesan cero— porque un dato que todavía no sabemos leer con
   * certeza no puede bajarle el techo a nadie.
   */
  seniority?: string
  yearsRequired?: number
  /**
   * Cuánto insiste el aviso en cada dura, medido sobre su texto
   * (`posting-priority`). Viaja DENTRO del informe porque el panel lo necesita
   * para decidir qué línea sobra, y el informe es la única puerta: leerlo del
   * crudo del servidor era abrir una segunda, que es el defecto que
   * `report-is-the-only-door` existe para impedir.
   */
  hardWeights?: Record<string, number>
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
  // Un informativo no es trabajo abierto: no hay nada que hacer con él, así que
  // contarlo inflaría «te quedan N pendientes» con algo que nunca baja.
  return allChecks(report).filter((c) => c.state !== "pass" && !c.informational)
}

/**
 * ── NO SE PINTA AL LADO DEL BOTÓN. Y ES LA RAZÓN DE QUE NO TENGA CONSUMIDOR ──
 *
 * Contesta «¿qué hallazgos siguen abiertos?», que NO es la pregunta que contesta
 * el botón de resolver: ése ofrece `solvableChecks` MÁS los términos que faltan,
 * y un término que la vacante pide no es un hallazgo. Los dos números son
 * ciertos y cuentan cosas distintas.
 *
 * Puestos uno al lado del otro se leyeron como una mentira: reportado con
 * captura el 2026-08-27, la cabecera decía «13 open checks» mientras el botón
 * debajo ofrecía «Solve 15 open items». El riel pasó a contar lo que el botón
 * resuelve, y esta función se quedó sin llamador en la app A PROPÓSITO.
 *
 * Sigue acá porque es la definición de dominio de «abierto» y sus tests
 * ejercitan el contrato del informe —que un informativo nunca cuente como
 * pendiente, que arreglar cierre de verdad—. Lo que no puede volver a pasar es
 * que su número se pinte junto a otro que cuenta distinto.
 */

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
/**
 * Arreglos que se ejecutan SOLOS: con sus propios parámetros, sin modelo, sin
 * cuota y sin abrir nada. Son los únicos que un clic masivo puede disparar N
 * veces sin consecuencias.
 */
const SE_APLICAN_SOLAS = new Set(["fix_dates", "remove_duplicates", "add_skill", "replace_text", "set_title", "strip_glyphs"])

/**
 * ¿ESTE HALLAZGO PUEDE ENTRAR EN «APLICAR TODO»?
 *
 * ── POR QUÉ ES UNA REGLA Y NO UNA LISTA DE EXCEPCIONES (2026-08-25) ─────────
 *
 * Esto se venía escribiendo como excepciones enumeradas —«todo menos los cortes»,
 * después «menos el tejido de términos», después «menos las que piden una
 * cifra»— y se olvidó DOS VECES seguidas. Cada olvido tuvo la misma forma: un
 * clic disparaba N llamadas al modelo, se cobraban N cuotas, cada una terminaba
 * en la MISMA pantalla de confirmación y sobrevivía la última. Las demás,
 * pagadas y tiradas.
 *
 * La regla que las cubre a todas, y a la que venga: **el masivo aplica lo que ya
 * está escrito o se ejecuta solo. Lo que necesita una llamada nueva o un dato del
 * usuario, se acepta de a uno.** Así un hallazgo nuevo no entra por olvido: entra
 * sólo si cumple, y si no cumple queda afuera sin que nadie tenga que acordarse.
 */
function entraAlMasivo(c: ReportCheck, ready?: ReadonlySet<string>): boolean {
  const kind = c.action?.kind
  if (!kind) return false
  if (SE_APLICAN_SOLAS.has(kind)) return true
  // Lo demás pide texto: sólo entra si el ejecutor YA lo escribió y no quedó
  // ningún dato pendiente de su parte.
  return ready?.has(c.id) ?? false
}

export function applyAllPlan(
  report: AtsReport,
  appliedIds: ReadonlySet<string>,
  addedTerms?: ReadonlySet<string>,
  /**
   * Los hallazgos que YA tienen su texto escrito y listo para aplicar.
   *
   * Lo sabe quien tiene las reescrituras en la mano —el panel—, no este archivo:
   * acá no llegan. Sin este conjunto, «aplicar todo» sólo aplica lo determinista,
   * que es el lado seguro de equivocarse.
   */
  ready?: ReadonlySet<string>,
): { checkIds: string[]; terms: string[] } {
  return {
    /**
     * CORTAR NUNCA ENTRA EN «APLICAR TODO».
     *
     * Todo lo demás que este botón hace se puede deshacer mirando el diff; borrar
     * una línea del CV de alguien en un clic masivo, no. `tips.cut.*` propone
     * cuál sobra y esa propuesta se acepta de a una, con la línea a la vista.
     *
     * ── Y TEJER UN TÉRMINO TAMPOCO (cazado por QA, 2026-08-25) ───────────────
     *
     * `search.stale.*` estrenó botón —tejer el término en un puesto reciente— y
     * con eso entró acá sin que nadie lo decidiera. Cada uno es UNA llamada al
     * modelo, una cuota y una confirmación: cuatro términos viejos disparaban
     * cuatro peticiones a la vez y **sólo la última sobrevivía**, porque el modal
     * de confirmación es un solo lugar. Tres pagadas y tiradas.
     *
     * Es exactamente la regla que este mismo botón ya aplicaba a los términos que
     * FALTAN —«se AGREGAN, no se tejen: tejer son cinco llamadas al modelo y cinco
     * esperas»—, que no se había extendido al hermano nuevo.
     */
    checkIds: solvableChecks(report)
      .filter((c) => !appliedIds.has(c.id) && !c.id.startsWith("tips.cut.") && entraAlMasivo(c, ready))
      .map((c) => c.id),
    // Los «sólo en la lista» NO se filtran por `addedTerms`: ese conjunto marca
    // lo agregado a Habilidades, y estos YA estaban ahí — lo que les falta es la
    // viñeta, que es otro trabajo.
    terms: weavableTerms(report).filter((x) => x.cv > 0 || !addedTerms?.has(x.term)).map((x) => x.term),
  }
}

/**
 * ── EL DEFECTO (reportado con captura, 2026-08-22) ────────────────────────────
 *
 *   «Agrego un Add o un Prove it pero me lleva al tailor y no me muestra nada.»
 *
 * Y la prueba estaba en la propia captura: las dos habilidades que fallaban
 * decían «could not count it» debajo. Eso es `jd === 0`, y estas dos funciones
 * exigían `jd > 0` para considerar el término trabajo del ejecutor.
 *
 * `jd` es el CONTADOR QUE SE MUESTRA —«la vacante lo pide 3 veces»—, y vale 0
 * cuando el aviso escribe el requisito con otras palabras: la extracción devuelve
 * la forma canónica («Strategic thinking») y el texto original dice «thinks
 * strategically». El contador no puede contarlo, y eso es correcto y está dicho
 * en pantalla.
 *
 * Lo que NO puede pasar es que ese contador decida la PERTENENCIA. Si el término
 * está en el informe con sección `hard` o `soft`, la vacante lo pide: lo decidió
 * la extracción, no una búsqueda literal. Con la regla vieja, el riel ofrecía el
 * término con sus dos botones y el ejecutor no lo tenía — el usuario apretaba y
 * el modal se abría vacío. Medido: de tres términos faltantes, el ejecutor veía
 * uno.
 *
 * `other` sigue fuera: esa sección son las habilidades PROPIAS del candidato que la oferta no
 * nombra. No mueven el puntaje, así que meterlas acá le daría trabajo al ejecutor
 * —y renglones a «aplicar todo»— que no puede mover el número. Un balde que
 * cuenta lo que no cobra es el mismo defecto, del otro lado.
 */
export function missingTerms(report: AtsReport): ReportTerm[] {
  return report.terms.filter((t) => t.section !== "other" && t.cv === 0)
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
  return report.terms.filter((t) => t.section !== "other" && t.cv > 0 && t.listOnly)
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
 * ── EL DEFECTO QUE ESTO CIERRA ─────────────────────────────────────────────
 *
 * Sumaba el peso de los CHEQUEOS abiertos e ignoraba los TÉRMINOS. Medido: un CV
 * con 68 de puntaje y cuatro habilidades que la vacante pide y él no dice
 * mostraba «+0 recuperables», mientras el desglose decía que había 32 puntos en
 * juego. Las duras pesan .45 —la palanca más grande del informe— y quedaban
 * fuera del único número que le promete algo al usuario.
 *
 * Es el mismo defecto que este panel ya pagó tres veces: una función que cuenta
 * lo que ELLA sabe hacer en vez de lo que el informe reporta. El botón decía
 * «resolver 1» con 13 abiertos; «aplicar las 5» con 10 pendientes; y éste, «+0»
 * con 32 en juego.
 *
 * NO se suma con los pesos de los chequeos, a propósito: `hard.requirements` ya
 * toma el suyo del mismo desglose (`recoverableOf`), así que sumarlos contaría
 * los requisitos dos veces.
 */
export function recoverablePoints(report: AtsReport): number {
  return report.recoverable
}

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
 * EL SEMÁFORO, CON UN DUEÑO.
 *
 * ── EL DEFECTO (auditoría del 2026-08-27) ───────────────────────────────────
 *
 * La misma regla —«<55 rojo · 55-79 amarillo · ≥80 verde», del CEO— vivía
 * escrita a mano en TRES lugares: el `toneOf` privado del dial, el ternario de
 * `ReportSectionCard` y un `CVCompletenessWidget` que además usaba hex crudos
 * en vez de los tokens del panel. Tres copias de un umbral es cómo dos pantallas
 * terminan pintando colores distintos para el mismo número.
 *
 * Y `READY_SCORE` estaba DECLARADO DOS VECES —acá y en `action-plan.ts`— con su
 * propio `isReadyToSend` al lado. Dos fuentes de verdad para «¿puede mandarlo?».
 */
export function scoreBand(pct: number): ScoreBand {
  if (pct >= READY_SCORE) return "ok"
  return pct >= WARN_SCORE ? "warn" : "bad"
}

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
  // Un informativo tiene salida por definición: su salida es saberlo. Sin esto
  // la tarjeta pintaría «diagnóstico sin puerta» sobre algo que nunca la tuvo.
  if (check.informational) return true
  return check.owner === "user" || check.owner === "tailor" || !!check.action
}
