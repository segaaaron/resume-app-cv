// lib/ats3/engine.ts
//
// EL ORQUESTADOR. Lee el CV, decide qué se pregunta y qué se sirve del caché,
// aplica los parches sobre una copia y mide el delta real.
//
// ── LA REGLA QUE ORDENA TODO EL MOTOR ───────────────────────────────────────
// El modelo PROPONE contenido; el código DECIDE. Ninguna salida de modelo llega
// al usuario sin pasar por `guards.ts`, y ningún puntaje sale de un modelo:
// se recalcula acá, sobre una copia, y se resta.
//
// ── POR QUÉ EL MOTOR NO IMPORTA EL MÓDULO DE IA ─────────────────────────────
// Recibe un PUERTO (`AtsAi`): seis funciones que devuelven datos ya validados.
// Con eso, todo lo que este archivo decide —qué se cachea, qué se reintenta, qué
// se aplica, cuánto sumó— se prueba ejecutándolo, sin red y sin gastar un token.
// Un motor que sólo se puede probar llamando a OpenAI no se prueba nunca.
//
// ── EL CACHÉ, EN UNA LÍNEA ──────────────────────────────────────────────────
// Cada capa se direcciona por CONTENIDO: la clave es el hash de todo aquello de
// lo que depende la respuesta, incluido el modelo y la versión del prompt. Si
// nada de eso cambió, la respuesta guardada sigue siendo válida por definición,
// y reanalizar cuesta cero.

import {
  PROMPT_VERSION,
  detailParts,
  encodeDetail,
  RUBRIC_VERSION,
  bulletIdFor,
  buildTermIndex,
  findingId,
  nodeHash,
  normalize,
  roleIdFor,
  sha256,
  termsIn,
  type AnchoredSuggestion,
  type Axis,
  type Finding,
  type FindingType,
  type JobSpec,
  type NodeId,
  type Resolution,
  type ResumeTree,
  type Suggestion,
  type TermIndex,
  termKey,
} from "@/lib/ats3/contracts"
import { namedCliches } from "@/lib/services/ai/shared/cliches"
import { isEmptyPhrasing, opensWeakly } from "@/lib/services/ai/shared/empty-phrasing"
import { afterAccept, BULLETS_PER_ROLE_MAX, ledgerSignature, openLedger, releaseOpener, SKILLS_MAX, type Ledger } from "@/lib/ats3/ledger"
import { checkSuggestion, droppedNames, findNode, isStale, lossNudge, lostContent, loyalty, repairSuggestion, retryNudge, similarNudge, similarTo, toFirstPerson, type GuardVerdict } from "@/lib/ats3/guards"
import { ABIERTO, coverageOf, cvTextOf, deltaOf, experienceYears, FECHA_ABIERTA, gainOf, mes, postingWeights, scoreResume, softCoverageOf, statesQuantity, titleForms, termsOf, titleWritten, type AuditFacts, type ComponentKey, type Mes, type ParseChecks, type Score } from "@/lib/ats3/score"
// Viven con quien mide; se re-exportan porque el motor es la puerta de siempre.
export { coverageOf, cvTextOf, termsOf } from "@/lib/ats3/score"

// ─────────────────────────────────────────────────────────────────────────────
// PUERTOS
// ─────────────────────────────────────────────────────────────────────────────

/** Las seis preguntas que sólo un modelo puede contestar. Ya validadas. */
export interface AtsAi {
  parseJob(jdText: string, language: "es" | "en"): Promise<JobSpec>
  audit(tree: ResumeTree, spec: JobSpec): Promise<AuditFacts>
  rewriteBullet(input: RewriteInput): Promise<Suggestion>
  rewriteSummary(input: SummaryInput): Promise<Suggestion>
}

export interface RewriteInput {
  original: string
  /**
   * LO QUE ESTA LÍNEA TIENE QUE RESOLVER, dicho UNA vez.
   *
   * Es el `detail` de la tarjeta que apretó el usuario — la única tarjeta que
   * esa línea puede tener— con todo adentro: el eje que falta, el término
   * enterrado, la blanda sin demostrar. Antes el modelo reescribía A CIEGAS:
   * recibía el CV, la vacante y el ledger, y NADA de lo que el panel le había
   * prometido al usuario. Por eso podía volver con una línea que no cerraba lo
   * que la tarjeta decía, y el usuario leía el panel contradiciéndose.
   *
   * Va acá y en ningún otro lado: una sola tarjeta, una sola instrucción, una
   * sola reescritura.
   */
  focus?: string
  bulletId: NodeId
  roleContext: string
  /** Las otras viñetas del CV: no puede devolver ninguna calcada. */
  siblings?: string[]
  spec: JobSpec
  ledger: Ledger
  declaredSkills: string[]
  /**
   * LO QUE LA TARJETA PROMETIÓ, EN LA PRIMERA LLAMADA Y NO SÓLO EN EL REINTENTO.
   *
   * Viajaban nada más como corrección del reintento: el modelo no sabía en la
   * primera llamada que tenía que escribir el término, esquivar un verbo o
   * dejar el hueco de la cifra, así que fallaba siempre una vez y se pagaba una
   * segunda llamada por algo que nadie le había dicho (2026-09-28).
   */
  mustWrite?: string[]
  avoidOpener?: string
  wantsSize?: boolean
  /** Los ejes que la tarjeta dice que faltan: la línea nueva tiene que tenerlos. */
  axes?: Axis[]
  /** Lo que la persona contó en la tarjeta sobre esta línea (en qué terminó, cómo). */
  told?: string
  /** Qué falló del intento anterior. Vacío la primera vez. */
  nudge?: string
}

export interface SummaryInput {
  current: string
  /**
   * TODO LO QUE EL CV DICE: cada viñeta y el resto de sus secciones (idiomas,
   * educación, certificaciones). Con sólo tres viñetas el modelo pegaba una tal
   * cual y afirmaba que el CV no decía un idioma que estaba en Idiomas
   * (medido el 2026-09-28).
   */
  cvLines: string[]
  otherSections: string
  /** Lo que la tarjeta prometió cerrar sobre el resumen, como en las viñetas. */
  focus?: string
  /** Lo que la tarjeta prometió escribir tal cual —el cargo—, desde la primera llamada. */
  mustWrite?: string[]
  /**
   * AÑOS DE EXPERIENCIA MEDIDOS SOBRE LAS FECHAS, completos y sin redondear
   * hacia arriba. La identidad del resumen dice cuántos años lleva la persona,
   * y el modelo los sacaba sumando períodos a ojo. null si no hay fechas.
   */
  yearsOfExperience: number | null
  spec: JobSpec
  topBullets: string[]
  /** Lo que la vacante pide y el CV ya demuestra, en su orden de peso (`provenTermsOf`). */
  provenTerms: string[]
  ledger: Ledger
  declaredSkills: string[]
  nudge?: string
}

/** Memoria. La implementa quien tenga base de datos; el motor no la conoce. */
export interface AtsStore {
  read(kind: CacheKind, hash: string): Promise<unknown | null>
  write(kind: CacheKind, hash: string, payload: unknown): Promise<void>
}

export type CacheKind = "ats3-jd" | "ats3-audit" | "ats3-fix" | "ats3-log" | "ats3-lock"

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA DEL CV
//
// Las viñetas se guardan dentro de una sola cadena por puesto. El separador es
// del documento, no del motor: se aceptan los tres que un usuario produce
// escribiendo (viñeta, guion y salto de línea) y se conserva el texto tal cual.
// ─────────────────────────────────────────────────────────────────────────────

interface RawRole {
  jobTitle?: string
  employer?: string
  startDate?: string
  endDate?: string
  description?: string
}

export interface RawResume {
  summary?: string
  workExperience?: RawRole[]
  skills?: { name?: string }[]
  /** Todo lo demás en texto plano: participa del puntaje, no se reescribe. */
  otherText?: string
  /** Email y teléfono: sólo se mira que un lector los encuentre. */
  contact?: { email?: string; phone?: string }
}

/**
 * EL LECTOR DE VIÑETAS DE ESTE MOTOR, Y ES SUYO.
 *
 * Una descripción se guarda con su marca —«• », un guion o nada— y este motor la
 * parte acá, sin pedirle nada al motor viejo ni a sus módulos compartidos: la
 * regla del CEO es que el ATS v3 no se cuelgue de nada de aquello. Se aceptan
 * los tres separadores que un usuario produce escribiendo, y el texto se
 * conserva tal cual.
 *
 * LO QUE NO HACE, dicho para que nadie lo descubra tarde: no colapsa líneas
 * repetidas al escribir de vuelta. El motor las trata antes —`duplicate_claim`
 * es uno de los doce guards— así que una repetición se caza donde se decide, no
 * al guardar.
 */
export function readBullets(description: string): string[] {
  return description
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[•·\-*•]\s*/, "").trim())
    .filter((line) => line.length > 0)
}

/**
 * El CV como árbol, con ids estables.
 *
 * Los ids se derivan del TEXTO dentro de su puesto, no de la posición. Aplicar
 * un arreglo reordena las líneas, y un id posicional convertiría cada hallazgo
 * guardado en un puntero a la línea equivocada — el defecto que este proyecto ya
 * pagó tres veces.
 */
export function buildTree(raw: RawResume): ResumeTree {
  const seen = new Set<NodeId>()
  // Los puestos también se desempatan: dos idénticos con el mismo id hacen que
  // uno pise al otro al escribir de vuelta, y se pierde un trabajo entero.
  const seenRoles = new Set<NodeId>()
  const roles = (raw.workExperience ?? []).map((r) => {
    const title = r.jobTitle ?? ""
    const company = r.employer ?? ""
    const startDate = r.startDate ?? ""
    const id = roleIdFor(title, company, startDate, seenRoles)
    return {
      id,
      title,
      company,
      startDate,
      endDate: r.endDate ?? "",
      bullets: readBullets(r.description ?? "").map((text) => ({
        id: bulletIdFor(id, text, seen),
        text,
        hash: nodeHash(text),
        origin: "USER" as const,
      })),
    }
  })
  const summary = raw.summary ?? ""
  return {
    roles,
    summary: { id: "summary", text: summary, hash: nodeHash(summary), origin: "USER" },
    declaredSkills: (raw.skills ?? []).map((s) => s.name ?? "").filter(Boolean),
    otherText: raw.otherText ?? "",
    ...(raw.contact ? { contact: { email: raw.contact.email ?? "", phone: raw.contact.phone ?? "" } } : {}),
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// ¿SE LEE BIEN? — lo que el motor puede medir por su cuenta
//
// El panel mandaba un objeto vacío y el pilar entero quedaba sin medir. Con el
// reparto de peso eso ya no roba puntos, pero un pilar vacío tampoco INFORMA
// nada: el usuario no se entera de que su CV tiene fechas ilegibles.
//
// Estas seis se derivan del propio documento, sin plantilla y sin PDF. Las que
// necesitan el archivo renderizado (fuentes incrustadas, texto dentro de una
// imagen, una sola columna) las mide quien tenga el PDF y llegan por `checks`;
// mientras no lleguen viajan como `null`, que significa NO MEDIDO y sale del
// denominador. Castigar por algo que nadie miró es fabricar un defecto.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Las formas de fecha que un CV produce de verdad.
 *
 * La primera versión sólo aceptaba "2024", "03/2024" y "marzo 2024" — y el
 * formato que ESTA aplicación guarda es "2021-03". Medido con el CV de prueba:
 * marcaba las fechas como ilegibles en TODOS los currículums. Un chequeo que
 * falla siempre no informa nada: acusa.
 */
const MES_ANIO = /^\s*(\d{4}([-/]\d{1,2})?|\d{1,2}[-/]\d{4}|[a-záéíóúñ]{3,}\.?\s+(de\s+)?\d{4})\s*$/i

export function readableChecks(tree: ResumeTree): ParseChecks {
  const roles = tree.roles
  const bullets = roles.flatMap((r) => r.bullets)
  const fechas = roles.flatMap((r) => [r.startDate, r.endDate]).filter((d) => d.trim())

  return {
    // Un puesto sin fechas legibles se ordena mal en cualquier buscador interno.
    fechas_legibles: fechas.length === 0 ? null : fechas.every((d) => MES_ANIO.test(d) || FECHA_ABIERTA.test(d)),
    // Del más reciente al más viejo: es el orden que espera quien lee.
    orden_cronologico: ordenCronologico(roles),
    // Un puesto sin una sola línea no dice qué hizo la persona ahí.
    puestos_con_contenido: roles.length === 0 ? null : roles.every((r) => r.bullets.length > 0),
    // Es la primera línea que lee cualquiera, humano o máquina.
    resumen_presente: tree.summary.text.trim().length > 0,
    // Un símbolo decorativo al principio de la línea se arrastra al texto extraído.
    sin_simbolos_raros: bullets.length === 0 ? null : bullets.every((b) => !/^[^\p{L}\p{N}"'(¿¡]/u.test(b.text.trim())),
    // Una línea de más de 400 caracteres es un párrafo disfrazado de viñeta.
    lineas_en_rango: bullets.length === 0 ? null : bullets.every((b) => b.text.trim().length <= 400),
    /**
     * TRAYECTORIA SIN HUECOS SIN EXPLICAR NI FECHAS SUPERPUESTAS.
     *
     * Las dos son de las primeras cosas que mira quien lee, y las dos se
     * calculan con las fechas que el CV ya tiene: cero tokens. Un hueco corto
     * no cuenta —cambiar de trabajo lleva tiempo—; el umbral son seis meses,
     * que es donde una pausa deja de leerse como transición.
     *
     * Se miden juntas porque son la misma pregunta —¿la línea de tiempo se
     * entiende?— y dos avisos sobre lo mismo se leen como que el panel insiste.
     */
    trayectoria_continua: continuidad(roles),
    /**
     * LO PRIMERO QUE UN ATS EXTRAE: CÓMO CONTACTARTE (CEO, 2026-09-28).
     *
     * Un CV sin un email o un teléfono que el lector reconozca no llega a nadie,
     * por bueno que sea. `null` cuando no llegó el dato: no se castiga lo que
     * no se pudo mirar.
     */
    contacto_email: tree.contact ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(tree.contact.email.trim()) : null,
    contacto_telefono: tree.contact ? tree.contact.phone.replace(/\D/g, "").length >= 7 : null,
  }
}

/**
 * ¿La línea de tiempo se lee sin tropezar?
 *
 * `null` cuando no hay con qué medir: un CV de un solo puesto no tiene huecos
 * entre puestos, y castigarlo por eso sería inventar un defecto.
 */
function continuidad(roles: ResumeTree["roles"]): boolean | null {
  const periodos = roles
    .map((r) => ({
      desde: mes(r.startDate),
      hasta: r.endDate.trim() && !FECHA_ABIERTA.test(r.endDate) ? mes(r.endDate) : ABIERTO,
    }))
    .filter((p): p is { desde: Mes; hasta: Mes } => p.desde !== null && p.hasta !== null)
  if (periodos.length < 2) return null
  const orden = [...periodos].sort((a, b) => a.desde.min - b.desde.min)
  for (let i = 1; i < orden.length; i++) {
    const previo = orden[i - 1]
    const actual = orden[i]
    if (previo.hasta === ABIERTO) continue
    /**
     * SÓLO LO QUE ES SEGURO.
     *
     * Un año sin mes es un RANGO de doce meses, no enero. Medido en producción
     * el 2026-09-24: «2015–2016» seguido de «2017–2020» se leía enero-2016 →
     * enero-2017, doce meses de hueco, y la tarjeta acusaba «más de seis meses
     * sin explicar» sobre una trayectoria que puede no tener ni uno. Se marca un
     * hueco sólo si ni en el mejor caso baja de seis meses, y un solape sólo si
     * ni en el mejor caso deja de haberlo.
     */
    // Superpuestas: aun empezando lo más tarde posible, empieza antes de que
    // el anterior pueda haber terminado. Un mes de solape es un cambio de
    // trabajo, no una contradicción.
    if (actual.desde.max < previo.hasta.min - 1) return false
    // Hueco: aun con el fin más tardío y el comienzo más temprano posibles,
    // quedan más de seis meses en medio.
    if (actual.desde.min - previo.hasta.max > 6) return false
  }
  return true
}

/**
 * ¿Los puestos van del más reciente al más viejo?
 *
 * Comparaba las fechas COMO TEXTO. Medido en local el 2026-09-24 sobre un CV
 * real: «06/2024» quedaba antes que «2023» (el «0» ordena antes que el «2») y
 * un puesto sin fecha de inicio comparaba «» contra todo. El chequeo acusaba un
 * orden que estaba bien. Se leen con el mismo lector que la línea de tiempo, y
 * un puesto sin fecha legible no opina: no se puede decir que esté fuera de
 * lugar.
 */
function ordenCronologico(roles: ResumeTree["roles"]): boolean | null {
  const inicios = roles.map((r) => mes(r.startDate)).filter((m): m is Mes => m !== null)
  if (inicios.length < 2) return null
  // Fuera de orden sólo si es seguro: el anterior empieza, en el mejor caso,
  // antes de que el siguiente pueda haber empezado.
  return inicios.every((m, i) => i === 0 || inicios[i - 1].max >= m.min)
}

// ─────────────────────────────────────────────────────────────────────────────
// CLAVES DE CACHÉ
//
// Cada una nombra TODO de lo que depende su respuesta. Una clave incompleta es
// peor que no tener caché: sirve la respuesta de otra pregunta.
// ─────────────────────────────────────────────────────────────────────────────

export const cacheKey = {
  /** La vacante no depende del CV: dos usuarios con el mismo aviso comparten. */
  jd: (jdText: string, model: string) => sha256(normalize(jdText), PROMPT_VERSION.P1, model),

  /**
   * Por CV COMPLETO, no por nodo — y el comentario anterior decía lo contrario.
   *
   * La auditoría es UNA llamada que mira el documento entero: necesita ver todas
   * las viñetas juntas para detectar logros repetidos entre puestos. Partirla
   * por nodo costaría catorce llamadas para ahorrar una.
   *
   * Editar una línea invalida la auditoría entera y cuesta esa única llamada.
   * El documento habla de "reauditar sólo ese nodo": acá no aplica, porque el
   * precio de la pieza completa es el mismo que el de una sola.
   */
  audit: (nodeHashValue: string, jdHash: string, model: string) =>
    sha256(nodeHashValue, jdHash, RUBRIC_VERSION, PROMPT_VERSION.P2, model),

  /** Lleva la firma del ledger: si otra viñeta gastó ese verbo, esto ya no vale. */
  fix: (nodeId: NodeId, nodeHashValue: string, jdHash: string, ledgerSig: string, model: string, focus = "") =>
    // El foco entra a la clave porque entra al prompt: sin él, pedir «le falta
    // el método» y «tejé este término» sobre la misma línea devolvía la primera
    // respuesta guardada para las dos.
    // Las dos versiones: el resumen lo escribe P5 y se guarda acá igual que una
    // viñeta. Sólo con P4, un cambio del prompt del resumen no llegaba nunca —
    // se servía el resumen viejo (medido el 2026-09-28).
    sha256(nodeId, nodeHashValue, jdHash, ledgerSig, PROMPT_VERSION.P4, PROMPT_VERSION.P5, model, focus),

  /** El registro de lo resuelto, por CV y vacante. */
  log: (resumeId: string, jdHash: string) => sha256(resumeId, jdHash),

  /** Los juicios fijados al texto que los sostiene, por CV. Ver `fijarJuicios`. */
  lock: (resumeId: string, model: string) => sha256("lock", resumeId, RUBRIC_VERSION, PROMPT_VERSION.P2, model),
}

// ─────────────────────────────────────────────────────────────────────────────
// LOS HALLAZGOS DETERMINISTAS
//
// Los emite el código, no el modelo, y cada uno trae su ganancia calculada por
// `score.ts`. Un hallazgo sin ganancia medida es una opinión.
// ─────────────────────────────────────────────────────────────────────────────

export function findingsOf(
  tree: ResumeTree,
  audit: AuditFacts,
  score: Score,
  index: TermIndex,
  /**
   * LA VACANTE. Hace falta para el cargo: es lo único que ella dice y el CV no.
   *
   * Opcional para no romper a quien ya la llama sin ella; sin vacante el
   * hallazgo del cargo no se emite, que es lo correcto —no hay contra qué
   * compararlo—.
   */
  spec?: JobSpec,
): Finding[] {
  const out: Finding[] = []
  /**
   * `component` no es un dato extra: es DE DÓNDE sale `gain`, dicho en la misma
   * llamada donde se lo pide. Así la pantalla puede agrupar por la medición en
   * vez de inventarse un mapa paralelo que se separa de ella.
   */
  const push = (
    type: FindingType,
    component: ComponentKey,
    nodeId: NodeId,
    text: string,
    gain: number,
    detail: string,
    /** Cómo se cierra. El que llega primero también decide esto. */
    remedy: Finding["remedy"] = "rewrite",
    /**
     * DE QUÉ HABLA ESTE HALLAZGO, cuando no habla de la línea.
     *
     * "Una línea, una tarjeta" vale para lo que se dice DE LA LÍNEA: verbo,
     * resultado, cifra, apertura. Dos hallazgos así sobre la misma viñeta son
     * el panel contradiciéndose, y por eso se fusionan.
     *
     * Pero "este término no está en Habilidades" no habla de la línea: habla
     * del TÉRMINO, y su remedio es agregarlo. Fusionarlo con la tarjeta de la
     * línea se comía el remedio —el botón volvía a ser "reescribir"— y con dos
     * términos sobre la misma viñeta habría agregado a Habilidades la
     * concatenación de los dos, que no es una habilidad de nadie.
     *
     * ── LA VARA, Y VALE PARA TODO LO QUE EL MOTOR ENTREGA (CEO, 2026-09-09) ───
     *
     * Lleva sujeto SÓLO el hallazgo cuyo remedio NO toca el texto de la línea.
     * Hoy NO lo lleva ninguno: el único que escribía fuera de la línea era
     * `skill_not_listed`, y su pregunta la contesta ahora `skillPlan`. El campo
     * se queda porque la regla sigue valiendo el día que aparezca otro.
     *
     * Todo lo que se cierra REESCRIBIENDO la línea comparte tarjeta, porque es
     * la misma reescritura: el eje que falta, la cifra, el término enterrado y
     * la blanda sin demostrar. Con tarjetas separadas la misma viñeta recibía
     * dos órdenes a la vez y el usuario veía el panel contradecirse sobre una
     * línea que él acababa de construir — reportado con captura.
     */
    subject?: string,
  ) => {
    // UNA LÍNEA, UNA TARJETA. La garantía vive acá y no en la memoria de quien
    // escriba el emisor siguiente: cuando se cumplía a mano, se olvidaba.
    //
    // Y EL QUE LLEGA SEGUNDO NO SE TIRA. Descartarlo silencia a un emisor
    // entero: los requisitos que faltan aterrizan casi siempre sobre líneas que
    // YA tienen tarjeta, así que tirarlos borraría el hallazgo más valioso del
    // panel. Su consejo se FUSIONA en la tarjeta que ya existe, y la ganancia se
    // suma porque cerrar las dos cosas mueve las dos componentes.
    /**
     * UNA LÍNEA, UNA TARJETA — y su sección la da el hallazgo que MÁS pesa.
     *
     * Partir por sección se probó y da tres tarjetas sobre la misma viñeta: el
     * eje que le falta, el requisito de la vacante y la blanda. Las tres se
     * cierran con LA MISMA reescritura, así que serían tres botones para un solo
     * acto — el panel contradiciéndose, que es lo que esto existe para no tener.
     *
     * El cruce que el CEO reportó se cierra por el otro lado: con `soft` como
     * componente propio, una línea cuyo ÚNICO hallazgo es la blanda abre su
     * tarjeta en la sección de blandas. Cuando comparte línea con algo que sí
     * puntúa, manda lo que mueve el número — y eso es correcto: el usuario
     * necesita ver primero lo que le cambia el puntaje.
     */
    // Un hallazgo con sujeto es DEL TÉRMINO: su identidad no puede depender de
    // la línea que se sugirió para escribirlo, que cambia al editar el CV.
    const claveDe = (id: NodeId, sujeto?: string) => (sujeto ? `term:${normalize(sujeto)}` : id)
    const clave = claveDe(nodeId, subject)
    const existing = out.find((f) => claveDe(f.nodeId, f.subject) === clave)
    if (existing) {
      /**
       * MANDA EL QUE MÁS PESA, NO EL QUE LLEGÓ PRIMERO.
       *
       * ── EL DEFECTO QUE ESTO CIERRA ──────────────────────────────────────────
       * El primero fijaba el título y el componente, y el orden del archivo es
       * un accidente: los ejes de la viñeta se emiten antes que los requisitos,
       * así que un requisito de la vacante —el hallazgo más valioso del panel—
       * caía dentro de «no dice qué cambió» y perdía las dos cosas que lo hacen
       * accionable: su título y su sección. Por esquivar eso se le había dado
       * sujeto propio, y con sujeto abre OTRA tarjeta sobre la misma línea: dos
       * tarjetas para una sola reescritura, que es lo que el CEO reportó.
       *
       * La tarjeta es de la LÍNEA, así que su nombre y su sección tienen que ser
       * los de lo que más mueve el número. Determinista: mismos insumos, mismo
       * ganador, misma pantalla.
       *
       * El `id` NO cambia: lo fija el primero y con él empareja `loyalty`. Si el
       * id se moviera, cerrar el hallazgo hoy y volver mañana no encontraría la
       * anotación, y el motor volvería a señalar lo ya resuelto.
       */
      // Cada pieza viaja con el tipo que la dijo (`encodeDetail`): sin eso la
      // tarjeta contaba el eje «método» como un requisito de la vacante.
      const previas = detailParts(existing)
      const nueva = { type, detail }
      if (gain > existing.gain) {
        existing.type = type
        existing.component = component
        existing.remedy = remedy
        existing.detail = encodeDetail([nueva, ...previas])
      } else {
        existing.detail = encodeDetail([...previas, nueva])
      }
      existing.gain += gain
      if (!existing.merged.includes(type)) existing.merged.push(type)
      return
    }
    // El que llega primero da el título Y el componente: es el que la tarjeta
    // nombra, así que es el que tiene que decidir bajo qué número se lee.
    out.push({ id: findingId(clave, type), type, component, remedy, subject, merged: [type], nodeId, nodeText: text, nodeHash: nodeHash(text), gain, detail })
  }


  const byId = new Map(audit.bullets.map((b) => [b.id, b]))
  for (const role of tree.roles) {
    for (const b of role.bullets) {
      const facts = byId.get(b.id)
      /**
       * UNA VIÑETA QUE LA AUDITORÍA NO DEVOLVIÓ NO RECIBE HALLAZGO, Y ES CALLADO.
       *
       * P2 juzga el documento entero en una llamada; si omite una línea, acá no
       * hay con qué decidir y se sigue de largo. El puntaje no se descuadra
       * —`score` filtra por los ids que el CV tiene de verdad, así que esa línea
       * sale del numerador Y del denominador— pero el usuario lee que está bien
       * cuando en realidad nadie la miró.
       *
       * Se deja así a propósito: rellenar los ejes que faltan sería fabricar un
       * juicio sobre una línea que el modelo no leyó, que es peor que callarse.
       * Pedirle la diferencia cuesta una llamada más por análisis y decirlo en
       * pantalla es una decisión de producto — las dos exceden lo que este
       * archivo puede decidir solo. Queda escrito para que el próximo no lo
       * descubra tarde ni lo tape con un valor por defecto.
       */
      if (!facts) continue
      if (!facts.hasResult || !facts.hasMethod || !facts.hasActionVerb) {
        push("no_result", "xyz", b.id, b.text, gainOf(score, "xyz"), missingParts(facts))
        continue
      }
      if (!statesQuantity(b.text)) {
        // Un token, como los ejes de la viñeta: el motor no escribe prosa. Salía
        // «el logro admite un tamaño…» en castellano sobre una pantalla en inglés.
        push("no_metric", "metric", b.id, b.text, gainOf(score, "metric"), "tamaño")
      }
    }
  }


  // Lo que la vacante exige y el CV no demuestra. Es la palanca más grande del
  // puntaje, y en el motor viejo vivía fuera del ejecutor, como filas de tabla.
  //
  // La cobertura se deriva del CV que se está mirando —la misma que puntúa—,
  // no de la foto que trajo la auditoría: una tarjeta no puede pedir un término
  // que el puntaje ya cuenta.
  const cobertura = spec ? coverageOf(spec, audit, tree, index) : audit.coverage
  for (const c of cobertura) {
    if (c.status === "FOUND") continue
    const key = c.requirement === "MUST" ? "must" : "nice"
    /**
     * EL REMEDIO SALE DE LA EVIDENCIA, NO DE UNA COSTUMBRE (2026-09-24).
     *
     * `IMPLIED` — el trabajo está en una línea que el modelo CITÓ y el CV sólo
     * no lo nombra. Se escribe el término ahí, que es donde la evidencia vive:
     * la reescritura nombra lo que la línea ya demuestra.
     *
     * `NOT_FOUND` — no hay rastro. Antes se anclaba igual en «la mejor casa»
     * (una heurística de palabras compartidas) y se pedía reescribir esa línea.
     * Medido en producción: el modelo escribió «applying security best practices
     * for fintech apps» sobre un puesto de 2015 que no era fintech, y la
     * tarjeta prometía escribirlo «donde tu trabajo ya lo respalda». Nada lo
     * respaldaba. Ahora se PREGUNTA —¿lo tenés?, ¿en qué puesto?— y la línea se
     * redacta con lo que la persona contesta, como una línea nueva en ese puesto.
     * El hallazgo habla del TÉRMINO, así que lleva sujeto: tarjeta propia, que
     * no se fusiona con la de ninguna línea. El nodo sólo sugiere el puesto.
     */
    if (c.status === "IMPLIED" && c.evidenceNodeId) {
      push("missing_requirement", key, c.evidenceNodeId, textOf(tree, c.evidenceNodeId), gainOf(score, key), c.skill, "rewrite")
      continue
    }
    const puesto = bestHomeFor(tree, c.skill, index)
    /**
     * UNA CREDENCIAL NO SE REDACTA EN UNA VIÑETA.
     *
     * Una licencia, un título o un idioma se TIENE, no se ejerce: preguntar
     * «¿qué hiciste con Licencia de conducir B?» y ofrecer una línea de
     * experiencia es un sinsentido (medido en local el 2026-09-24). Si la
     * persona la tiene, va en su sección del CV — sin botón de IA.
     */
    const credencial = [...(spec?.mustHave ?? []), ...(spec?.niceToHave ?? [])].some(
      (r) => normalize(r.skill) === normalize(c.skill) && r.kind === "credential",
    )
    // LA IA ESCRIBE; LA PERSONA SÓLO PONE LAS CIFRAS (CEO, 2026-09-28). Sin
    // rastro en el CV, el término se escribe en la línea donde mejor encaja y
    // la persona confirma en el antes/después. Preguntarle «¿lo tenés?» le
    // devolvía el trabajo que el producto existe para hacer.
    // Sin sujeto, como el implícito: se fusiona con la tarjeta de esa línea, y
    // UNA reescritura aterriza todo. Con sujeto, la línea recibía dos tarjetas
    // que la reescribían y la segunda pisaba a la primera. La credencial sí
    // lleva el suyo: no reescribe nada, es su propia nota.
    if (credencial) push("missing_requirement", key, puesto, textOf(tree, puesto), gainOf(score, key), c.skill, "none", c.skill)
    else push("missing_requirement", key, puesto, textOf(tree, puesto), gainOf(score, key), c.skill, "rewrite")
  }

  /**
   * ── ACÁ VIVÍA `skill_not_listed`, EL TÉRMINO SUELTO (CEO, 2026-09-09) ──────
   *
   * Emitía una tarjeta por cada término que el CV demuestra y la lista no
   * nombra, con su botón para agregarlo. Servía, y aun así era media respuesta:
   * miraba un término por vez, así que podía llevar tu sección de Habilidades a
   * cien entradas — y una lista de cien no la lee nadie, ni el filtro la premia,
   * porque cuenta cada término UNA vez.
   *
   * La pregunta completa es «cuáles lleva tu CV para ESTA vacante», y la
   * contesta `skillPlan` con el techo de veinte y los pesos medidos sobre el
   * aviso. Dos dueños para la misma pregunta es lo que este panel estuvo
   * pagando toda la sesión: queda uno.
   */

  /**
   * LA BLANDA QUE LA VACANTE PIDE Y EL CV NO DEMUESTRA — declarada o ausente.
   *
   * ── EL DEFECTO QUE ESTO CIERRA (CEO, 2026-09-09, con captura) ──────────────
   * Sólo salía tarjeta para `DECLARED_ONLY` —«aparece como adjetivo, sin ningún
   * logro detrás»—. La ausente, que es la que MÁS puntos cuesta, no tenía
   * ninguna: el usuario veía «Habilidades blandas 0%» y ni una sugerencia
   * debajo. Un porcentaje en cero sin nada que apretar es un reproche.
   *
   * Ahora las dos tienen la misma salida, que es la misma para las dos:
   * demostrarla en una línea, y el motor elige cuál encaja mejor. `FOUND` no
   * entra —ya está demostrada— y por eso el bucle no las repite.
   *
   * Y SÍ suma puntos: las blandas pesan 0,10 de la relevancia desde que se
   * recuperó el peso que v3 había perdido. La ganancia sale del puntaje.
   */
  for (const s of spec ? softCoverageOf(spec, audit, tree) : audit.softCoverage) {
    if (s.status === "DEMONSTRATED") continue
    const donde = bestHomeFor(tree, s.signal, index)
    /**
     * SIN SUJETO: se FUSIONA con la tarjeta que esa línea ya tenía.
     *
     * El sujeto existe para el requisito que va a Habilidades —dos términos
     * sobre una viñeta no pueden compartir un botón que agregue la
     * concatenación de los dos—, y se le había puesto también a la blanda. Con
     * eso la misma línea recibía DOS órdenes en la misma sección: «reescribila,
     * le falta un eje» y «tejé esta blanda acá». Reportado por el CEO: el panel
     * contradiciéndose sobre una viñeta que él acababa de construir.
     *
     * Tejer la blanda y arreglar el eje que falta son LA MISMA reescritura. Una
     * sola tarjeta, un solo botón, una sola consulta.
     */
    // Componente PROPIO: la tarjeta de una blanda va a la sección de blandas, no
    // a la del reclutador. `soft` no lo mide el puntaje —las blandas no puntúan—
    // así que la sección no pinta porcentaje, que es lo que corresponde.
    // La ganancia sale del puntaje, como todas: desde que las blandas pesan
    // 0,10, un 0 escrito a mano decía «no mueve el número» sobre algo que sí lo
    // mueve. Un número a mano al lado de uno calculado se desincroniza siempre.
    push("soft_not_shown", "soft", donde, textOf(tree, donde), gainOf(score, "soft"), s.signal)
  }

  /**
   * EL CARGO QUE LA VACANTE BUSCA, ESCRITO TAL CUAL.
   *
   * `title` pesa 0,14 de la relevancia y ningún hallazgo lo declaraba: el
   * puntaje descontaba por el cargo y el panel no lo mencionaba en ningún lado.
   *
   * La detección es DETERMINISTA y no usa `titleAlignment`: ese número es una
   * opinión del modelo entre 0 y 1, y cortarlo por un umbral sería inventar una
   * vara. Se pregunta lo que el filtro pregunta —¿la cadena está escrita?— sobre
   * los cargos de los puestos y el resumen, que es donde un lector la busca.
   *
   * Se ancla en el RESUMEN porque es lo único de esos dos que este motor sabe
   * escribir, y porque es la primera línea que lee cualquiera. El motor no toca
   * el cargo de un puesto: eso es un dato del usuario y se edita en Contenido.
   */
  const cargo = (spec?.roleTitleRaw ?? "").trim()
  if (cargo && spec) {
    // La MISMA función que puntúa el cargo: con dos, la tarjeta promete puntos
    // que el número no da. Medido antes de unificarlas.
    if (!titleWritten(tree, spec)) {
      /**
       * CON SUJETO: tarjeta propia, y no la del resumen donde se ancla.
       *
       * Medido: sin él se fusionaba con «resumen incompleto» y el cargo quedaba
       * escondido dentro de su detalle —«identity, proof, fit · Jefa de caja»—.
       * El hallazgo no habla del resumen: habla del CARGO, y el resumen es sólo
       * el único lugar de los dos que este motor sabe escribir.
       */
      push("title_mismatch", "title", tree.summary.id, tree.summary.text, gainOf(score, "title"), cargo, "rewrite", cargo)
    }
  }

  /**
   * LOS AÑOS QUE LA VACANTE PIDE (CEO, 2026-09-28).
   *
   * Se cuentan con el código sobre las fechas del CV (`experienceYears`), no se
   * le preguntan al modelo. No tiene botón de IA: la experiencia no se redacta.
   * Lo que sí se puede es que falte un puesto o una fecha, y la tarjeta lo dice.
   * Promete lo que queda del componente, no su peso entero.
   */
  const pideAnios = spec?.yearsRequired ?? null
  if (pideAnios) {
    const tiene = experienceYears(tree)
    const comp = score.components.find((c) => c.key === "years")
    if (tiene < pideAnios && comp) {
      push("years_short", "years", tree.summary.id, tree.summary.text, comp.effectiveWeight - comp.points,
        `anios:${Math.floor(tiene)}/${pideAnios}`, "none", "years")
    }
  }

  /**
   * LA FRASE QUE PODRÍA ESTAR EN EL CV DE CUALQUIERA.
   *
   * La lista vive en un solo lugar —`cliches.ts`, la misma que el prompt de
   * reescritura prohíbe— así que lo que acá se señala es exactamente lo que
   * Tailor tiene prohibido escribir. No mueve el número por sí sola; se cierra
   * reescribiendo la línea, y por eso comparte su tarjeta.
   */
  for (const nodo of [tree.summary, ...tree.roles.flatMap((r) => r.bullets)]) {
    // Una frase de la lista se cita; una cualidad declarada sin trabajo detrás
    // no tiene frase que citar, y se dice lo que es.
    const frase = namedCliches(nodo.text)[0]
    const detalle = frase ? `frase:${frase}` : isEmptyPhrasing(nodo.text) ? "vacia" : null
    if (detalle) push("cliche", nodo.id === tree.summary.id ? "summary" : "xyz", nodo.id, nodo.text, 0, detalle)
  }

  /**
   * UN PUESTO CON MÁS VIÑETAS DE LAS QUE SE LEEN.
   *
   * El tope es el que el proyecto ya fijó (`BULLETS_PER_ROLE_MAX`). No hay botón
   * de IA: elegir qué se va es una decisión de la persona, y la tarjeta le dice
   * con qué criterio — quedarse con las que prueban lo que esta vacante pide.
   */
  for (const role of tree.roles) {
    if (role.bullets.length <= BULLETS_PER_ROLE_MAX) continue
    push("role_too_long", "xyz", role.bullets[0].id, role.bullets[0].text, 0,
      `largo:${[role.title, role.company].filter(Boolean).join(" — ")}/${role.bullets.length}/${BULLETS_PER_ROLE_MAX}`, "none", `role:${role.id}`)
  }

  /**
   * DOS VIÑETAS QUE ABREN CON EL MISMO VERBO.
   *
   * `verbs` pesa 0,10 del impacto y tampoco tenía quién lo reportara. Y desde
   * que `verb_collision` se retiró —bloqueaba una reescritura buena por un
   * motivo de estilo— no quedaba NADA que tocara el tema mientras el puntaje
   * seguía cobrándolo.
   *
   * Se señala la más débil de las que comparten apertura: es la que menos
   * pierde al reescribirse, y la reescritura ya sabe no repetir un verbo del CV
   * porque el ledger se lo dice al modelo.
   */
  const porApertura = new Map<string, typeof tree.roles[number]["bullets"]>()
  for (const role of tree.roles) {
    for (const b of role.bullets) {
      const abre = normalize(b.text).split(" ")[0]
      if (!abre) continue
      porApertura.set(abre, [...(porApertura.get(abre) ?? []), b])
    }
  }
  for (const [abre, repetidas] of porApertura) {
    if (repetidas.length < 2) continue
    const masDebil = [...repetidas].sort((a, b) => peso(a.text, index) - peso(b.text, index))[0]
    /**
     * EL DATO VIAJA MARCADO CON LO QUE ES: `verbo:developed`.
     *
     * Al fusionarse con otra tarjeta, el detalle se concatena y se pierde de qué
     * tipo vino cada pieza: la pantalla mostraba «developed» solo, en una caja
     * gris, sin decir qué era. Reportado con captura. Con la marca, la pantalla
     * sabe traducirlo a una frase venga solo o fusionado — y sin la marca cae al
     * dato, que es lo que había.
     */
    push("verb_repeated", "verbs", masDebil.id, masDebil.text, gainOf(score, "verbs"), `verbo:${abre}`)
  }

  const summaryGaps = [
    ["identity", audit.summary.identity],
    ["proof", audit.summary.proof],
    ["fit", audit.summary.fit],
  ] as const
  if (summaryGaps.some(([, ok]) => !ok)) {
    push(
      "summary_gap",
      "summary",
      tree.summary.id,
      tree.summary.text,
      gainOf(score, "summary"),
      summaryGaps.filter(([, ok]) => !ok).map(([k]) => k).join(", "),
    )
  }

  return out
}

function missingParts(f: { hasActionVerb: boolean; hasResult: boolean; hasMethod: boolean }): string {
  const missing: string[] = []
  if (!f.hasActionVerb) missing.push("verbo")
  if (!f.hasResult) missing.push("resultado")
  if (!f.hasMethod) missing.push("método")
  return missing.join(", ")
}

/**
 * Dónde conviene demostrar un requisito que falta.
 *
 * ── EL DEFECTO QUE ESTO CIERRA ──────────────────────────────────────────────
 * La primera versión IGNORABA la habilidad (`void skill`) mientras su comentario
 * prometía "el puesto que más se le parece". Todos los requisitos faltantes
 * caían en la MISMA línea y, por la regla de una-línea-una-tarjeta, se fusionaban
 * en una sola: el usuario leía "te falta todo" sobre una viñeta cualquiera, sin
 * ninguna relación con lo que le falta.
 *
 * Ahora gana la línea que MÁS habla de eso —comparando por raíz, que es lo que
 * hace que "inventario" encuentre "inventarios" y "pagos" encuentre "pagos"—, y
 * el empate lo desempata la línea más floja: la que menos pierde al reescribirse.
 */
function bestHomeFor(tree: ResumeTree, skill: string, index: TermIndex): NodeId {
  const palabras = normalize(skill)
    .split(" ")
    .filter((w) => w.length >= 4)

  /**
   * ── LA AFINIDAD DECIDE QUIÉN ES CANDIDATA; LA DEBILIDAD, QUIÉN GANA ────────
   *
   * «Si el hard y el soft recomiendan, dar prioridad a las viñetas más débiles o
   * que no aportan mucho» (CEO, 2026-09-09).
   *
   * Antes las dos señales se sumaban, y la afinidad es un ENTERO mientras la
   * debilidad valía como mucho 0,01: una línea fuerte con una palabra más de
   * afinidad le ganaba SIEMPRE a la débil. La debilidad era un desempate, no una
   * prioridad — que es lo contrario de lo que se pidió.
   *
   * Se separan las dos preguntas. La afinidad sigue primero y no se negocia: una
   * línea que no puede sostener el término no es candidata por más floja que
   * esté, porque ahí el término se cae en el guard. Entre las que SÍ pueden,
   * gana la que menos aporta.
   */
  const candidatas: { id: NodeId; afinidad: number; peso: number }[] = []
  for (const role of tree.roles) {
    for (const b of role.bullets) {
      const texto = normalize(b.text).split(" ")
      // Lo que decide: cuántas palabras del requisito ya viven en esta línea.
      // Sigue primero porque una línea que no puede sostener el término no es
      // candidata por más floja que esté: ahí el término se cae en el guard.
      const afinidad = palabras.filter((p) => texto.some((t) => sameRoot(p, t))).length
      /**
       * ENTRE DOS QUE PUEDEN SOSTENERLO, GANA LA MÁS DÉBIL (CEO, 2026-09-09).
       *
       * «Si el hard y el soft recomiendan, dar prioridad a las viñetas más
       * débiles o que no aportan mucho.» Antes el desempate premiaba a la que ya
       * traía términos del aviso: el requisito caía sobre la línea que MEJOR
       * estaba, y la floja se quedaba floja. La más débil se mide sin opinión:
       * sin términos del aviso y corta.
       */
      candidatas.push({ id: b.id, afinidad, peso: peso(b.text, index) })
    }
  }
  if (candidatas.length === 0) return tree.summary.id

  const sostienen = candidatas.filter((c) => c.afinidad > 0)
  // Entre las que pueden sostenerlo, la más débil. Si ninguna puede, la que más
  // se le acerca: es la única con alguna chance de pasar el guard.
  const elegidas = sostienen.length > 0 ? sostienen : candidatas
  return [...elegidas].sort((a, b) =>
    sostienen.length > 0 ? a.peso - b.peso : b.afinidad - a.afinidad || a.peso - b.peso,
  )[0].id
}

/**
 * LAS HABILIDADES QUE ESTE CV LLEVA PARA ESTA VACANTE.
 *
 * ── QUÉ PREGUNTA CONTESTA, Y POR QUÉ ES UNA SOLA ───────────────────────────
 * «Según la postulación, que las skills se reemplacen por las necesarias; la
 * plantilla recibe hasta veinte» (CEO, 2026-09-09). Antes esto lo contestaban
 * dos cosas a medias: un hallazgo por término suelto —«esto lo demostrás y no
 * está en la lista»— que podía llevar la lista a cien, y dos plantillas que
 * cortaban en doce por su cuenta. Ni una ni otra miraban la vacante entera.
 *
 * ── LA REGLA, Y ES DETERMINISTA: no llama al modelo ni gasta cuota ──────────
 *   1. Lo que el aviso PIDE va primero, ordenado por el peso medido sobre su
 *      texto. Un requisito nunca se cae del corte.
 *   2. Se suma lo que el CV DEMUESTRA en una viñeta y la lista no nombra: es lo
 *      que el filtro lee literalmente y hoy no ve.
 *   3. El resto de tus habilidades llena lo que queda, EN TU ORDEN. No se
 *      reordena lo que vos escribiste sin motivo.
 *
 * Nada se escribe acá: devuelve el plan y la pantalla lo enseña. Quién lo
 * acepta es el usuario.
 */
export function skillPlan(
  declared: readonly string[],
  spec: JobSpec,
  audit: AuditFacts,
  weights: Record<string, number> = {},
): { final: string[]; add: string[]; entering: string[]; leaving: string[] } {
  const pedidos = new Map<string, number>()
  for (const r of spec.mustHave) pedidos.set(normalize(r.skill), (weights[r.skill] ?? 1) + 1)
  for (const r of spec.niceToHave) if (!pedidos.has(normalize(r.skill))) pedidos.set(normalize(r.skill), weights[r.skill] ?? 1)

  /** El nombre tal como está escrito: se conserva el del usuario si ya lo tiene. */
  const comoLoEscribio = new Map(declared.map((d) => [normalize(d), d]))
  const nombre = (s: string) => comoLoEscribio.get(normalize(s)) ?? s

  const pedidas = [...new Set([...spec.mustHave, ...spec.niceToHave].map((r) => r.skill))]
    .filter((s) => pedidos.has(normalize(s)))
    .sort((a, b) => (pedidos.get(normalize(b)) ?? 0) - (pedidos.get(normalize(a)) ?? 0))

  const final: string[] = []
  const meter = (s: string) => {
    const n = normalize(s)
    if (!n || final.some((x) => normalize(x) === n)) return
    final.push(nombre(s))
  }

  /**
   * 1 · Lo que el aviso pide Y tu CV sostiene —porque ya está en tu lista o
   *     porque una viñeta lo demuestra—, ordenado por el peso del aviso.
   *
   * NO se agrega un término que el CV no sostiene, por más que la vacante lo
   * pida. Escribir "Swift" en las habilidades de alguien que nunca lo nombró es
   * afirmar un hecho sobre esa persona, y eso no lo decide el motor: para eso
   * está la tarjeta que le pide demostrarlo en una línea.
   */
  /**
   * DEMOSTRADA ES DENTRO DE UNA LÍNEA, con su cita.
   *
   * Desde que la cobertura lee el CV entero, «encontrado» también es «está en
   * Idiomas» o «en el título de una certificación». Medido en local el
   * 2026-09-24: el plan agregaba «English» a Habilidades —ya estaba en Idiomas—
   * y «Combine» por una certificación. Lo que ya está escrito en otra sección
   * no necesita repetirse en la lista; lo que una LÍNEA demuestra sin
   * nombrarlo en la lista, sí.
   */
  const demostradas = new Set(
    audit.coverage.filter((c) => c.status !== "NOT_FOUND" && c.evidenceNodeId).map((c) => normalize(c.skill)),
  )
  // Una credencial no se agrega a Habilidades: vive en su sección (Idiomas,
  // Educación, Certificaciones). Si la persona ya la listó ahí, se respeta.
  const credenciales = new Set(
    [...spec.mustHave, ...spec.niceToHave].filter((r) => r.kind === "credential").map((r) => normalize(r.skill)),
  )
  for (const s of pedidas) {
    if (comoLoEscribio.has(normalize(s))) meter(s)
    else if (demostradas.has(normalize(s)) && !credenciales.has(normalize(s))) meter(s)
  }
  // 2 · lo tuyo, en tu orden
  for (const s of declared) meter(s)

  /**
   * NADA SE BORRA: EL PLAN ORDENA (2026-09-24).
   *
   * Devolvía `drop` —lo que no entraba en las veinte— y la pantalla lo
   * escribía como la lista nueva: 34 habilidades BORRADAS del CV de un usuario
   * en producción, con una tarjeta que decía «salen de la plantilla». Y era
   * innecesario: las plantillas ya cortan en `SKILLS_MAX` respetando el orden
   * (`useAtsData`), así que lo único que el plan tiene que decidir es QUÉ va
   * primero. Lo que queda después de la veinte sigue en tus datos y vuelve a
   * verse en cuanto otra vacante lo pida.
   */
  const visibles = (xs: readonly string[]) => new Set(xs.slice(0, SKILLS_MAX).map(normalize))
  const hoy = visibles(declared)
  const despues = visibles(final)
  return {
    final,
    add: final.filter((s) => !comoLoEscribio.has(normalize(s))),
    /** Las que pasan a verse en la plantilla: nuevas, o tuyas que suben. */
    entering: final.slice(0, SKILLS_MAX).filter((s) => !hoy.has(normalize(s))),
    /** Las que dejan de verse. Siguen en tus datos. */
    leaving: declared.slice(0, SKILLS_MAX).filter((s) => !despues.has(normalize(s))),
  }
}

/**
 * CUÁNTO APORTA UNA LÍNEA A ESTA VACANTE. Más alto, más fuerte.
 *
 * Una sola definición de «débil» para las dos preguntas que la usan: dónde
 * aterrizar un requisito y cuál sacar cuando sobran. Con dos definiciones, el
 * motor podía aterrizar un término en la línea que a la vez proponía borrar.
 */
function peso(texto: string, index: TermIndex): number {
  return termsIn(index, texto).size * 10 + normalize(texto).split(" ").length
}

/** Dos palabras con la misma raíz de cuatro letras hablan de lo mismo. */
function sameRoot(a: string, b: string): boolean {
  if (a.length < 4 || b.length < 4) return false
  return a.slice(0, 4) === b.slice(0, 4)
}

function textOf(tree: ResumeTree, id: NodeId): string {
  return findNode(tree, id)?.text ?? ""
}

// ─────────────────────────────────────────────────────────────────────────────
// EL ANÁLISIS, EN ACTOS
//
// El puntaje está listo en milisegundos; la auditoría tarda segundos. Hacer
// esperar al primero por el segundo es regalar pantalla quieta.
// ─────────────────────────────────────────────────────────────────────────────

export type Act =
  /**
   * El puntaje viaja con los DOS insumos con los que se calculó.
   *
   * Sin ellos la pantalla no puede volver a medir cuando el usuario arregla algo
   * —y hasta hoy no lo hacía: el dial quedaba clavado hasta reanalizar, que
   * cuesta una llamada—. Con la auditoría y las verificaciones en la mano, el
   * re-cálculo es la MISMA función del motor sobre el CV nuevo: cero llamadas,
   * cero lógica de puntaje en la interfaz, y ningún número que el código no
   * pueda probar.
   */
  | { act: "score"; score: Score; tree: ResumeTree; audit: AuditFacts; checks: ParseChecks; weights: Record<string, number> }
  | { act: "job"; spec: JobSpec }
  /** Lo que la vacante pide y el CV ya demuestra: guía dónde gastar términos. */
  | { act: "covered"; terms: string[] }
  /**
   * `resolved` es EL REGISTRO DE LO QUE EL USUARIO YA CERRÓ, y viaja acá.
   *
   * El motor lo lee igual para no volver a señalar lo mismo; entregarlo cuesta
   * cero y es lo único que le permite a la pantalla volver a dibujar «Hechas»
   * después de recargar. Sin esto ese registro vivía en memoria y se perdía con
   * un F5, junto con todo el trabajo que la persona había hecho.
   */
  | { act: "findings"; findings: Finding[]; suppressed: number; regressed: Finding[]; resolved: Resolution[] }

export interface AnalysisInput {
  raw: RawResume
  jdText: string
  language: "es" | "en"
  resumeId: string
  model: string
  ai: AtsAi
  store: AtsStore
}

export interface AnalysisTelemetry {
  /** Llamadas al modelo que ESTA corrida gastó de verdad. */
  calls: number
  served: { jd: boolean; audit: boolean }
}

export async function* runAnalysis(input: AnalysisInput): AsyncGenerator<Act, AnalysisTelemetry> {
  const telemetry: AnalysisTelemetry = { calls: 0, served: { jd: false, audit: false } }
  const tree = buildTree(input.raw)

  // ── acto 2: la vacante ────────────────────────────────────────────────────
  const jdKey = cacheKey.jd(input.jdText, input.model)
  let spec = (await input.store.read("ats3-jd", jdKey)) as JobSpec | null
  if (spec) {
    telemetry.served.jd = true
  } else {
    spec = await input.ai.parseJob(input.jdText, input.language)
    telemetry.calls++
    await input.store.write("ats3-jd", jdKey, spec)
  }

  const index = buildTermIndex(termsOf(spec, tree))

  // ── acto 3: la auditoría ──────────────────────────────────────────────────
  const auditKey = cacheKey.audit(treeHash(tree), jdKey, input.model)
  let audit = (await input.store.read("ats3-audit", auditKey)) as AuditFacts | null
  if (audit) {
    telemetry.served.audit = true
  } else {
    audit = await input.ai.audit(tree, spec)
    telemetry.calls++
    /**
     * CADA VIÑETA TIENE SU JUICIO, O LA PANTALLA NO PUEDE DECIR «12/12».
     *
     * ── MEDIDO EN PRODUCCIÓN (2026-09-24) ─────────────────────────────────────
     * Sobre un CV de 42 viñetas la auditoría devolvió 12. Las otras 30 no
     * recibieron hallazgo ni cuenta, y el cuadro dijo «12/12 abren con acción»:
     * el usuario leyó que su CV entero estaba revisado. Rellenar lo que falta
     * sería inventar un juicio; callarlo, mentir por omisión.
     *
     * Lo que faltó se pide UNA vez más, sólo esas líneas, dentro de la misma
     * petición: la cuota del usuario no cambia. Lo que tampoco vuelva queda sin
     * juicio, y la pantalla lo cuenta contra el total de líneas del CV.
     */
    const juzgadas = new Set(audit.bullets.map((b) => b.id))
    const faltan = new Set(tree.roles.flatMap((r) => r.bullets).filter((b) => !juzgadas.has(b.id)).map((b) => b.id))
    if (faltan.size > 0) {
      const resto: ResumeTree = {
        ...tree,
        roles: tree.roles
          .map((r) => ({ ...r, bullets: r.bullets.filter((b) => faltan.has(b.id)) }))
          .filter((r) => r.bullets.length > 0),
      }
      const segunda = await input.ai.audit(resto, spec)
      telemetry.calls++
      audit = { ...audit, bullets: [...audit.bullets, ...segunda.bullets.filter((b) => faltan.has(b.id))] }
    }
    await input.store.write("ats3-audit", auditKey, audit)
  }

  // Un juicio sólo cambia si cambió el texto que lo sostiene. Ver `fijarJuicios`.
  const lockKey = cacheKey.lock(input.resumeId, input.model)
  const previos = ((await input.store.read("ats3-lock", lockKey)) as Juicios | null) ?? JUICIOS_VACIOS
  const fijado = fijarJuicios(tree, audit, previos, jdKey)
  audit = fijado.audit
  if (JSON.stringify(fijado.juicios) !== JSON.stringify(previos)) await input.store.write("ats3-lock", lockKey, fijado.juicios)

  // El modelo aporta la cita; el estado de cada requisito lo decide el código
  // sobre el CV entero. Ver `coverageOf`.
  audit = { ...audit, coverage: coverageOf(spec, audit, tree, index), softCoverage: softCoverageOf(spec, audit, tree) }

  // ── acto 1: el puntaje, que no cuesta una sola llamada ────────────────────
  //
  // ── UN SOLO DUEÑO PARA «¿ESTE CV SE LEE BIEN?» (CEO, 2026-09-09) ──────────
  //
  // Acá se fusionaba lo que el motor mide con lo que mandara el CLIENTE, y el
  // cliente ganaba: `{ ...readableChecks(tree), ...input.checks }`. La idea era
  // dejar lugar a una medición futura sobre el PDF renderizado — pero esa
  // medición no existe, el panel manda `{}`, y mientras tanto la pregunta tenía
  // dos dueños con el de afuera decidiendo. El borde aceptaba cualquier clave
  // con cualquier booleano y pisaba lo que el motor había leído del documento.
  //
  // El motor lee el CV: es el único que lo tiene entero delante. Si algún día se
  // mide el PDF de verdad, esa medición entra como un chequeo MÁS de
  // `readableChecks`, no como alguien que le corrige la respuesta desde afuera.
  const checks = readableChecks(tree)
  /**
   * Los pesos salen del TEXTO del aviso, no del modelo: la misma vacante da
   * siempre el mismo peso. Viajan con el puntaje porque la pantalla vuelve a
   * medir al aplicar y no recibe el aviso — un puntaje que cambia según quién
   * lo calcula es peor que uno más grueso.
   */
  const weights = postingWeights(spec, input.jdText)
  const score = scoreResume(tree, spec, audit, checks, weights)
  yield { act: "score", score, tree, audit, checks, weights }
  yield { act: "job", spec }
  yield {
    act: "covered",
    // DEMOSTRADO es escrito DENTRO de una línea: la misma vara que la tabla usa
    // para separar «probado» de «sólo en la lista».
    terms: audit.coverage.filter((c) => c.status === "FOUND" && c.evidenceNodeId).map((c) => c.skill),
  }

  // ── los hallazgos, filtrados por lo que el usuario ya resolvió ────────────
  const log = ((await input.store.read("ats3-log", cacheKey.log(input.resumeId, jdKey))) as Resolution[] | null) ?? []
  const all = findingsOf(tree, audit, score, index, spec)
  for (const [nombre, ok] of Object.entries(checks)) {
    // Un chequeo que falla y no genera hallazgo es un punto perdido que el
    // usuario no puede recuperar porque nadie le dijo qué arreglar.
    if (ok === false) {
      all.push({
        // El matiz es el chequeo: sin él los siete comparten huella y cerrar
        // uno acusa a los demás de una regresión que nadie provocó.
        id: findingId(tree.summary.id, "parse_risk", nombre),
        type: "parse_risk",
        component: "checks",
        // Lo que un lector automático no extrae bien se arregla en el documento,
        // no reescribiendo una línea: la tarjeta lo dice y no ofrece botón. El
        // comentario lo prometía y el campo decía «rewrite»: el botón de la
        // tarjeta de fechas reescribía el RESUMEN (medido el 2026-09-24).
        remedy: "none",
        merged: ["parse_risk"],
        nodeId: tree.summary.id,
        nodeText: nombre,
        nodeHash: nodeHash(nombre),
        gain: gainOf(score, "checks"),
        detail: nombre,
      })
    }
  }

  const seen = loyalty(all, log, cvTextOf(tree))
  yield { act: "findings", findings: seen.shown, suppressed: seen.suppressed.length, regressed: seen.regressed, resolved: log }

  return telemetry
}


/**
 * UN JUICIO SÓLO PUEDE CAMBIAR SI CAMBIÓ EL TEXTO QUE LO SOSTIENE (CEO, 2026-09-28).
 *
 * ── EL DEFECTO QUE ESTO CIERRA, MEDIDO ──────────────────────────────────────
 * La auditoría se pedía de nuevo con cualquier cambio del CV, y el modelo no
 * juzga igual dos veces: con la misma vacante y dos líneas AGREGADAS, 8 de 42
 * viñetas que nadie tocó cambiaron de juicio y las tarjetas pasaron de 3 a 12.
 * «Arreglo una cosa y aparece trabajo en otro lado» — el panel contradiciéndose
 * sobre lo que el usuario no tocó. Lo mismo con la cobertura: «async/await»
 * pasó de faltante a implícito sin que ninguna línea cambiara.
 *
 * La regla: cada juicio se guarda atado al hash del texto que lo sostiene, y
 * el siguiente análisis lo RESPETA mientras ese texto exista.
 *   · los tres ejes de una viñeta → por el hash de la viñeta;
 *   · las funciones del resumen   → por el hash del resumen y la vacante;
 *   · un requisito o una blanda   → por la línea que lo prueba. Uno que no
 *     tenía prueba sólo cambia si la cita nueva es una línea NUEVA o editada:
 *     el modelo no puede descubrir hoy en una línea vieja lo que ayer no vio.
 *
 * Lo que el código mide —el término escrito, la cifra, la apertura— no pasa
 * por acá: no oscila.
 */
type Ejes = { hasActionVerb: boolean; hasResult: boolean; hasMethod: boolean }
type Estado<S> = { status: S; evidencia: string | null }
export interface Juicios {
  lineas: Record<string, Ejes>
  resumen: Record<string, AuditFacts["summary"]>
  requisitos: Record<string, Estado<AuditFacts["coverage"][number]["status"]>>
  blandas: Record<string, Estado<AuditFacts["softCoverage"][number]["status"]>>
}
export const JUICIOS_VACIOS: Juicios = { lineas: {}, resumen: {}, requisitos: {}, blandas: {} }

export function fijarJuicios(
  tree: ResumeTree,
  audit: AuditFacts,
  previos: Juicios,
  jdKey: string,
): { audit: AuditFacts; juicios: Juicios } {
  const lineas = tree.roles.flatMap((r) => r.bullets)
  const hashDe = new Map(lineas.map((b) => [b.id, b.hash]))
  const idDe = new Map(lineas.map((b) => [b.hash, b.id]))
  const vistas = new Set(Object.keys(previos.lineas))
  const nueva = (id: string | null) => Boolean(id && hashDe.has(id) && !vistas.has(hashDe.get(id)!))

  // Sólo se guardan las líneas que el CV tiene hoy: el registro no crece sin fin.
  const ejes: Record<string, Ejes> = {}
  const bullets = audit.bullets.map((b) => {
    const h = hashDe.get(b.id)
    if (!h) return b
    const fijo = previos.lineas[h] ?? { hasActionVerb: b.hasActionVerb, hasResult: b.hasResult, hasMethod: b.hasMethod }
    ejes[h] = fijo
    return { ...b, ...fijo }
  })

  const claveResumen = `${jdKey}:${tree.summary.hash}`
  const summary = previos.resumen[claveResumen] ?? audit.summary

  /** El mismo criterio para requisitos y blandas: la prueba manda. */
  const fijar = <S extends string>(clave: string, nuevo: Estado<S> & { id: string | null }, guardados: Record<string, Estado<S>>) => {
    const antes = guardados[clave]
    const lineaDeAntes = antes?.evidencia ? idDe.get(antes.evidencia) : undefined
    if (antes && lineaDeAntes) return { status: antes.status, id: lineaDeAntes }
    if (antes && !antes.evidencia && !nueva(nuevo.id)) return { status: antes.status, id: null }
    return { status: nuevo.status, id: nuevo.id }
  }
  const requisitos = { ...previos.requisitos }
  const coverage = audit.coverage.map((c) => {
    const clave = `${jdKey}:${normalize(c.skill)}`
    const r = fijar(clave, { status: c.status, evidencia: null, id: c.evidenceNodeId }, previos.requisitos)
    requisitos[clave] = { status: r.status, evidencia: r.id ? (hashDe.get(r.id) ?? null) : null }
    return { ...c, status: r.status, evidenceNodeId: r.id }
  })
  const blandas = { ...previos.blandas }
  const softCoverage = audit.softCoverage.map((s) => {
    const clave = `${jdKey}:${normalize(s.signal)}`
    const r = fijar(clave, { status: s.status, evidencia: null, id: s.evidenceNodeId }, previos.blandas)
    blandas[clave] = { status: r.status, evidencia: r.id ? (hashDe.get(r.id) ?? null) : null }
    return { ...s, status: r.status, evidenceNodeId: r.id }
  })

  return {
    audit: { ...audit, bullets, summary, coverage, softCoverage },
    juicios: { lineas: ejes, resumen: { ...previos.resumen, [claveResumen]: summary }, requisitos, blandas },
  }
}

/**
 * LA HUELLA DEL CV, Y CUBRE TODO LO QUE LA AUDITORÍA MIRA.
 *
 * Es la clave de la capa que pregunta por el documento entero: la auditoría
 * (P2). La regla que gobierna las claves de este
 * motor está escrita veinte líneas más arriba —«cada una nombra TODO de lo que
 * depende su respuesta»— y ésta la incumplía: contaba las viñetas y el resumen,
 * y `compactTree` le manda al modelo ADEMÁS el cargo, la empresa, el período y
 * las habilidades declaradas.
 *
 * La consecuencia no se veía como un error. El candidato corregía su cargo —lo
 * que la vacante pide, lo que `titleAlignment` puntúa— la huella salía idéntica,
 * se servía la auditoría vieja y el dial no se movía. Treinta días, que es lo
 * que tarda `purgeAiCaches` en borrar la fila. Hacer lo correcto y que el número
 * no responda es la forma callada del bucle que este motor existe para no tener.
 *
 * El orden es el del documento y no se ordena aparte: mover un puesto de sitio
 * cambia lo que el modelo lee —qué llega primero, qué queda enterrado— así que
 * también tiene que cambiar la huella.
 */
function treeHash(tree: ResumeTree): string {
  return sha256(
    ...tree.roles.flatMap((r) => [r.title, r.company, r.startDate, r.endDate, ...r.bullets.map((b) => b.hash)]),
    tree.summary.hash,
    // Separadas del resto: una habilidad que se llame igual que una empresa no
    // puede producir la misma huella que el caso donde están intercambiadas.
    "skills",
    ...tree.declaredSkills,
  ).slice(0, 16)
}

// ─────────────────────────────────────────────────────────────────────────────
// LA REESCRITURA, CON SU REINTENTO
// ─────────────────────────────────────────────────────────────────────────────

export interface RewriteRequest {
  tree: ResumeTree
  nodeId: NodeId
  spec: JobSpec
  ledger: Ledger
  index: TermIndex
  language: "es" | "en"
  model: string
  jdKey: string
  /** Lo que la tarjeta prometió cerrar. Ver `RewriteInput.focus`. */
  focus?: string
  /**
   * LOS TÉRMINOS QUE LA TARJETA PROMETIÓ ESCRIBIR, tal como los pide la vacante
   * de ESTE CV: los requisitos que faltan y el cargo. Salen de la tarjeta, no de
   * ninguna lista: valen para cualquier oficio.
   */
  mustWrite?: string[]
  /** El verbo que la tarjeta promete dejar de repetir: otra viñeta ya abre con él. */
  avoidOpener?: string
  /** La tarjeta promete el tamaño del logro: una cifra escrita o su hueco. */
  wantsSize?: boolean
  /** Los ejes que la tarjeta promete cerrar («no dice en qué terminó»). */
  axes?: Axis[]
  /**
   * LO QUE LA PERSONA CONTÓ SOBRE ESTA LÍNEA —en qué terminó, cómo lo hizo—.
   * Un resultado que el CV no dice no lo puede escribir nadie más: es el único
   * camino honesto para cerrar ese eje.
   */
  told?: string
  ai: AtsAi
  store: AtsStore
}

export type RewriteResult =
  | { ok: true; suggestion: AnchoredSuggestion; served: boolean; calls: number }
  /**
   * El modelo leyó la línea y dice que ya está bien. NO es un fallo: es la
   * respuesta que el prompt le pide cuando no hay nada que mejorar, y mostrarla
   * como error —o peor, como una propuesta vacía— convierte una respuesta
   * honesta en una pantalla rota.
   */
  | { ok: false; alreadyGood: true; calls: number }
  | { ok: false; alreadyGood?: false; verdict: GuardVerdict; calls: number }

/**
 * Pide UNA reescritura y la juzga.
 *
 * Un solo reintento, y le dice al modelo QUÉ falló de lo que ya escribió. Dos
 * reintentos esconderían un prompt que dejó de funcionar; cero convierte cada
 * rechazo en una pantalla vacía con el uso ya cobrado.
 */
export async function runRewrite(req: RewriteRequest): Promise<RewriteResult> {
  /**
   * UNA LÍNEA NUEVA NO TIENE NODO, y ése es todo el caso especial.
   *
   * `nodeId` ancla el pedido en una línea que existe —para saber a qué puesto
   * pertenece— pero lo que se va a escribir no reemplaza a nadie. El hecho lo
   * puso el usuario al confirmar el tema, y ese tema hace de original: es contra
   * lo que los guards juzgan que la redacción no se lleve ni agregue nada.
   */
  const node = findNode(req.tree, req.nodeId)
  if (!node) return { ok: false, verdict: { ok: false, reason: "stale", detail: req.nodeId }, calls: 0 }

  const isSummary = req.nodeId === req.tree.summary.id
  const sig = ledgerSignature(req.ledger)
  const hashBase = node.hash
  const key = cacheKey.fix(
    req.nodeId, hashBase, req.jdKey, sig, req.model,
    `${req.focus ?? ""}||${(req.mustWrite ?? []).join("\u0001")}|${req.avoidOpener ?? ""}|${req.wantsSize ? "S" : ""}|${(req.axes ?? []).join(",")}|${req.told ?? ""}`,
  )

  // La línea que se reemplaza suelta su propia apertura: si no, choca consigo
  // misma y el modelo elige un verbo peor para esquivar un conflicto inexistente.
  const ledger = releaseOpener(req.ledger, node.text)
  /** QUÉ NO SE PUEDE PERDER: la línea que se reemplaza. */
  const original = node.text
  const ctx = {
    original,
    index: req.index,
    ledger,
    language: req.language,
    /**
     * LAS OTRAS LÍNEAS DEL CV, para que una reescritura no vuelva calcada a una
     * viñeta que ya existe (orden del CEO, 2026-09-09). Se excluye la que se
     * está reemplazando: chocaría contra sí misma, igual que el verbo.
     *
     * Acá vivía `grounding` —el CV entero como respaldo de lo que el resumen
     * podía nombrar—, que existía sólo para `invented_term` e `invented_figure`.
     * Sin esos dos guards no tiene a quién contestarle.
     */
    siblings: req.tree.roles
      .flatMap((r) => r.bullets)
      .filter((b) => b.id !== req.nodeId)
      .map((b) => b.text),
  }

  /**
   * LO GUARDADO VUELVE A PASAR POR LOS GUARDS.
   *
   * Se servía tal cual, y ahí estaba el agujero: los guards juzgan la respuesta
   * el día que llega, así que una propuesta escrita ANTES de que existiera un
   * chequeo lo esquiva para siempre — el caché la sirve idéntica en cada visita
   * y ningún reintento la vuelve a mirar. Cazado el 2026-08-30 al agregar el
   * chequeo de la cifra que el original ya traía: sin esto, la línea reportada
   * con captura seguía ofreciendo borrar su propio "5%" después de arreglarlo.
   *
   * Un guard nuevo tiene que valer para lo ya guardado, o no vale.
   *
   * Si lo guardado ya no pasa, se sigue de largo como si no hubiera nada: se
   * gasta una llamada —sólo la primera vez, porque lo bueno se vuelve a
   * guardar— en vez de entregar algo que hoy sabemos que está mal.
   */
  /**
   * LO QUE LA TARJETA PROMETIÓ ESCRIBIR TIENE QUE ESTAR ESCRITO (2026-09-28).
   *
   * La tarjeta dice «la vacante pide X» y el botón promete escribirlo; nada lo
   * comprobaba. Medido en Chrome: la del cargo devolvió un resumen sin el cargo.
   * Se comprueba por PALABRA, como compara un filtro, y se pide una vez más
   * nombrando lo que falta. Si tampoco llega NO se entrega como si cerrara la
   * tarjeta: la persona confirmaba, la tarjeta pasaba a «Hechas» y el análisis
   * siguiente la volvía a abrir — el bucle. Se dice que no se pudo (`declined`).
   */
  const escrito = (texto: string, termino: string) => ` ${normalize(texto)} `.includes(` ${normalize(termino)} `)
  // Un cargo con barra se cumple con cualquiera de sus formas (`titleForms`).
  const faltan = (s: Suggestion) => (req.mustWrite ?? []).filter((t) => normalize(t) && !titleForms(t).some((f) => escrito(s.text, f)))
  /** Lo prometido como lo lee el modelo: las formas de un mismo término, separadas por « | ». */
  const prometido = req.mustWrite?.map((t) => titleForms(t).join(" | "))
  /**
   * Y EL RESUMEN NO AFIRMA NI COPIA LO QUE EL CV NO DICE.
   *
   * Dos cosas medibles para cualquier CV y cualquier vacante: un término que la
   * vacante pide y que el CV no escribe en ninguna parte (el resumen lo
   * afirmaría sin respaldo), y una viñeta pegada entera. Medido en Chrome: el
   * resumen nombró una herramienta del aviso que el CV no tenía y copió una
   * viñeta textual. Lo que la tarjeta pide escribir no cuenta como ajeno.
   */
  const enElCv = termsIn(req.index, cvTextOf(req.tree))
  const ajenos = (s: Suggestion) =>
    isSummary
      ? [...termsIn(req.index, s.text)].filter(
          (t) => !enElCv.has(t) && !(req.mustWrite ?? []).some((m) => normalize(m) === normalize(t)),
        )
      : []
  /**
   * NI COPIA LAS TAREAS DEL AVISO COMO SI FUERAN SUYAS. Medido el 2026-09-28:
   * «Ajuste a registrar ventas, realizar arqueo de caja al cierre, atender
   * reclamos y apoyar en reposición de mercadería» — las funciones del aviso
   * pegadas, y una que el CV no dice. Cuenta cada tramo de tres palabras o más.
   */
  const copiaAviso = (s: Suggestion) => {
    if (!isSummary) return []
    const texto = ` ${normalize(s.text)} `
    return (req.spec.responsibilities ?? [])
      .flatMap((r) => r.split(/[,;]|\s+y\s+|\s+and\s+/))
      .map((r) => r.trim())
      .filter((r) => normalize(r).split(" ").length >= 3 && texto.includes(` ${normalize(r)} `))
  }
  /**
   * NI HABLA DEL CV. «The CV also shows…», «The profile includes…» (medido el
   * 2026-09-28): el resumen es el texto impreso, no un comentario sobre él.
   */
  const comenta = (s: Suggestion) => (isSummary ? s.text.match(/\b(cv|curr[íi]culum|r[ée]sum[ée])\b/gi) ?? [] : [])
  /**
   * NI ENUMERA TÉRMINOS SUELTOS. «Also demonstrated code reviews, Combine,
   * XCTest, and CI/CD.» (medido el 2026-09-28): tres términos del aviso o más
   * y casi nada más es relleno de palabras clave, no una oración.
   */
  const terminosDelAviso = [...req.index.ordered.map((o) => o.needle), ...(req.spec.softSignals ?? []).map(normalize)].filter(Boolean)
  const enumera = (s: Suggestion) =>
    isSummary
      ? s.text.split(/(?<=[.!?])\s+/).filter((o) => {
          let resto = ` ${normalize(o)} `
          let n = 0
          for (const t of terminosDelAviso) if (resto.includes(` ${t} `)) { n++; resto = resto.split(` ${t} `).join(" ") }
          // Lista: tres términos o más, y al menos el doble que el resto de las
          // palabras con contenido. «Migré flujos a Combine con Swift y SwiftUI»
          // tiene su acción y no es una lista.
          return n >= 3 && n >= 2 * resto.split(" ").filter((w) => w.length >= 4).length
        })
      : []
  /**
   * LA PRUEBA LLEVA SU RESULTADO. Medido el 2026-09-28: con «20% reduction in
   * crash rates» entre los logros, tres resúmenes seguidos salieron sin una sola
   * cifra — identidad, lista de tareas, idiomas. Si el mejor logro elegido para
   * este puesto trae cifra, el resumen tiene que traer alguna además de los años.
   */
  const pruebaElegida = isSummary ? topBulletsOf(req.tree, req.spec)[0] : undefined
  const anios = String(Math.floor(experienceYears(req.tree)))
  const sinPrueba = (s: Suggestion) =>
    pruebaElegida && statesQuantity(pruebaElegida) && !(s.text.match(/\d+/g) ?? []).some((d) => d !== anios) ? [pruebaElegida] : []
  /**
   * CADA ORACIÓN TRABAJA PARA ESTE PUESTO. Salvo la identidad, una oración del
   * resumen trae algo que el aviso pide o la cifra de un logro. «English B2 and
   * Spanish native.» sobre un aviso que no pide idiomas no trae ninguna de las
   * dos (medido el 2026-09-28): ocupa la línea que un reclutador sí lee.
   */
  const fueraDelPuesto = (s: Suggestion) =>
    isSummary
      ? s.text
          .split(/(?<=[.!?])\s+/)
          .slice(1)
          .filter((o) => {
            const t = ` ${normalize(o)} `
            // Una CANTIDAD, no cualquier dígito: el «2» de «B2» no es un resultado.
            return o.trim() && !statesQuantity(o) && !terminosDelAviso.some((x) => t.includes(` ${x} `))
          })
      : []
  /** Y ninguna oración es un dato suelto: «Bachiller.» (medido el 2026-09-28). */
  const sueltas = (s: Suggestion) =>
    isSummary ? s.text.split(/(?<=[.!?])\s+/).map((o) => o.trim()).filter((o) => o && o.split(/\s+/).length < 3) : []
  /**
   * Una viñeta pegada no es sólo la copia exacta: medido el 2026-09-28, quitarle
   * «the … frameworks» a la primera viñeta la hacía pasar. Una oración de ocho
   * palabras o más con el 85% de sus palabras en UNA sola viñeta es esa viñeta.
   */
  const palabras = (t: string) => new Set(normalize(t).split(" ").filter((w) => w.length >= 3))
  const pegadas = (s: Suggestion) => {
    if (!isSummary) return []
    const vinetas = req.tree.roles.flatMap((r) => r.bullets)
    return s.text
      .split(/(?<=[.!?])\s+/)
      .flatMap((o) => {
        const po = palabras(o)
        if (normalize(o).split(" ").length < 8) return []
        const copia = vinetas.find((b) => {
          const pb = palabras(b.text)
          return [...po].filter((w) => pb.has(w)).length / po.size >= 0.85
        })
        return copia ? [copia.text] : []
      })
  }
  /**
   * UN VERBO QUE OTRA VIÑETA YA USA NO SE ESTRENA ACÁ.
   *
   * La tarjeta prometía dejar de repetir «Resolved» y la propuesta abría con
   * «Reduced», que ya abría otra línea (medido el 2026-09-28): arreglar una
   * repetición creaba otra. Cuenta si la línea nueva abre con el verbo que la
   * tarjeta prometió dejar, o con uno de otra viñeta que la original no usaba.
   */
  const aperturaDe = (texto: string) => normalize(texto).split(" ")[0] ?? ""
  const otrasAperturas = new Set(
    req.tree.roles.flatMap((r) => r.bullets).filter((b) => b.id !== req.nodeId).map((b) => aperturaDe(b.text)),
  )
  const repite = (s: Suggestion) => {
    if (isSummary) return []
    const abre = aperturaDe(s.text)
    if (req.avoidOpener && abre === normalize(req.avoidOpener)) return [req.avoidOpener]
    return abre !== aperturaDe(original) && otrasAperturas.has(abre) ? [s.text.split(/\s+/)[0]] : []
  }
  /**
   * LA TARJETA DE LA CIFRA PROMETE EL TAMAÑO. Medido en Chrome: devolvía la
   * misma línea con las palabras en otro orden, sin cifra ni hueco — una
   * consulta cobrada por nada. Cumple con una cifra que la línea ya diga o con
   * el hueco tipado para que la persona la escriba.
   */
  const sinTamano = (s: Suggestion) => (req.wantsSize && !statesQuantity(s.text) && s.placeholders.length === 0 ? 1 : 0)
  /**
   * UN HUECO SIN SALIDA TRABA LA TARJETA. Medido postulando el 2026-09-28: la
   * propuesta traía «across [n] reviews» sin su versión sin cifra, y la ventana
   * no podía ofrecer «no tengo ese dato» — el botón de confirmar quedaba
   * apagado para quien no sabe el número.
   */
  const sinVariante = (s: Suggestion) => (!isSummary && s.placeholders.length > 0 && !s.variantWithoutMetric?.trim() ? 1 : 0)
  /**
   * LA LÍNEA NUEVA NO ABRE CON UNA TAREA. La tarjeta prometía «abrí con lo que
   * hiciste» y la propuesta volvió con «Apoyé el inventario…» (medido el
   * 2026-09-28): la auditoría siguiente la habría vuelto a señalar.
   */
  const debil = (s: Suggestion) => (!isSummary && opensWeakly(s.text) ? 1 : 0)
  /**
   * LOS EJES QUE LA TARJETA PROMETIÓ, CONTRA LOS QUE EL MODELO DECLARA DE SU
   * LÍNEA NUEVA (`newBasis`). Sin declaración no se le cree: cuenta como no
   * cumplido. El verbo lo prueba además el código (`debil`).
   */
  const ejeDe: Record<Axis, "hasActionVerb" | "hasResult" | "hasMethod"> = { verbo: "hasActionVerb", resultado: "hasResult", método: "hasMethod" }
  /**
   * Y LA DECLARACIÓN SE CONTRASTA CON LO QUE EL CÓDIGO PUEDE VER. Medido en
   * Chrome el 2026-09-28: «Resolví reclamos de clientes con atención al
   * cliente» volvió con los tres ejes en true. Lo único que agregaba era un
   * término de la vacante. Un resultado o un método son palabras NUEVAS que no
   * están en el original ni son un término del aviso —las de lo que la persona
   * contó sí cuentan—; con menos de dos, no se agregó ninguno de los dos.
   * ponytail: el umbral de dos palabras de cuatro letras o más no mira sentido;
   * alcanza para ver relleno de palabra clave, no para juzgar calidad.
   */
  // Lo conocido es el original. Lo que la persona contó ES el aporte legítimo:
  // contarlo como «ya dicho» hacía que una línea escrita con su respuesta
  // pareciera no agregar nada (medido en Chrome el 2026-09-28).
  const conocidas = normalize(original).split(" ").filter((w) => w.length >= 4)
  const aporta = (s: Suggestion) => {
    let texto = ` ${normalize(s.text)} `
    // Todo lo que la vacante nombra —duras, deseables, blandas— y lo declarado.
    const terminos = [...req.index.ordered.map((o) => o.needle), ...(req.spec.softSignals ?? []).map(normalize)]
    for (const t of terminos) if (t) texto = texto.split(` ${t} `).join(" ")
    return texto.split(" ").filter((w) => w.length >= 4 && !conocidas.some((c) => sameRoot(w, c))).length >= 2
  }
  const ejesFaltan = (s: Suggestion): Axis[] =>
    isSummary
      ? []
      : (req.axes ?? []).filter((e) => !s.newBasis?.[ejeDe[e]] || (e !== "verbo" && !aporta(s)))
  /**
   * EL RESUMEN NO HABLA DE LA PERSONA EN TERCERA. Medido el 2026-09-28: abrió
   * «Cajera con 4 años…» y siguió «Realizó el arqueo…, cobró…, atendió…». El
   * guard de persona sólo mira la primera palabra, y en el resumen la tercera
   * aparece en la segunda oración. En español una palabra de cuatro letras o
   * más terminada en «ó» es un pasado de tercera persona.
   * ponytail: los pocos sustantivos así (dominó, buró) contarían.
   *
   * EN INGLÉS, CON EL VOCABULARIO DEL PROPIO CV. «Builds…», «Specializes…» no
   * tienen una marca como la tilde, pero sí una prueba: si una oración abre con
   * una palabra en -s y el CV usa esa raíz como verbo —«developed»,
   * «leading»—, es un verbo en tercera persona. «Skills in…» no tiene esas
   * formas y pasa. Vale para el resumen (cada oración) y la viñeta (su
   * apertura), sin una lista de verbos.
   */
  const vocabulario = new Set(normalize(`${cvTextOf(req.tree)} ${original}`).split(" "))
  const verboEnS = (w: string) => {
    const x = w.toLowerCase()
    // Los tres auxiliares irregulares: una clase cerrada de la gramática, no una
    // lista de verbos que llega tarde. «Has integrated…» (medido el 2026-09-28).
    if (x === "has" || x === "is" || x === "does") return true
    if (x.length < 4 || !x.endsWith("s") || x.endsWith("ss") || w === w.toUpperCase()) return false
    const raices = [x.slice(0, -1), x.endsWith("es") ? x.slice(0, -2) : "", x.endsWith("ies") ? `${x.slice(0, -3)}y` : ""].filter(Boolean)
    return raices.some((r) =>
      [`${r}ed`, `${r}d`, `${r}ing`, r.endsWith("e") ? `${r.slice(0, -1)}ing` : "", r.endsWith("y") ? `${r.slice(0, -1)}ied` : ""].some((f) => f && vocabulario.has(f)),
    )
  }
  const terceraPersona = (s: Suggestion) => {
    if (req.language === "en") {
      const aperturas = (isSummary ? s.text.split(/(?<=[.!?])\s+/) : [s.text]).map((o) => o.trim().split(/\s+/)[0]?.replace(/[^\p{L}]/gu, "") ?? "")
      return [...new Set(aperturas.filter(verboEnS))]
    }
    return isSummary ? [...new Set((s.text.match(/\p{L}{3,}ó(?!\p{L})/gu) ?? []).filter((w) => w !== w.toUpperCase()))] : []
  }
  const problemas = (s: Suggestion) =>
    faltan(s).length + ajenos(s).length + pegadas(s).length + repite(s).length + sinTamano(s) + debil(s) + terceraPersona(s).length + copiaAviso(s).length + sueltas(s).length + ejesFaltan(s).length + comenta(s).length + enumera(s).length + sinPrueba(s).length + fueraDelPuesto(s).length + sinVariante(s)

  const guardada = (await req.store.read("ats3-fix", key)) as Suggestion | null
  // Sólo una reescritura tiene una línea a la que superar: al agregar, parecerse
  // al tema confirmado no es «no aporta».
  const parecidaA = (s: Suggestion) => similarTo(s, ctx, true)
  const cached = guardada ? repairSuggestion(guardada) : null
  // Lo guardado pasa también por el ciclo de corrección: con problemas, no se sirve.
  if (cached && checkSuggestion(cached, ctx).ok && problemas(cached) === 0) {
    return { ok: true, suggestion: anchor(cached, hashBase, original, parecidaA(cached)), served: true, calls: 0 }
  }
  const ask = (nudge?: string) =>
    isSummary
      ? req.ai.rewriteSummary({
          current: node!.text,
          focus: req.focus,
          mustWrite: prometido,
          yearsOfExperience: Math.floor(experienceYears(req.tree)) || null,
          cvLines: req.tree.roles.flatMap((r) => r.bullets.map((b) => b.text)),
          otherSections: req.tree.otherText,
          spec: req.spec,
          topBullets: topBulletsOf(req.tree, req.spec),
          provenTerms: provenTermsOf(req.tree, req.spec, req.index),
          ledger,
          declaredSkills: req.tree.declaredSkills,
          nudge,
        })
      : req.ai.rewriteBullet({
          original,
          bulletId: req.nodeId,
          roleContext: roleContextOf(req.tree, req.nodeId),
          spec: req.spec,
          ledger,
          declaredSkills: req.tree.declaredSkills,
          focus: req.focus,
          mustWrite: prometido,
          avoidOpener: req.avoidOpener,
          wantsSize: req.wantsSize,
          axes: req.axes,
          told: req.told?.trim() || undefined,
          /**
           * LAS OTRAS LÍNEAS DEL PUESTO, para que no repita ninguna.
           *
           * El guard rechaza una reescritura calcada a otra viñeta, y hasta hoy
           * el modelo nunca las había visto: se lo castigaba por repetir algo
           * que nadie le mostró. Prevenir en la fuente cuesta cero tokens.
           */
          siblings: req.tree.roles
            .flatMap((r) => r.bullets)
            .filter((b) => b.id !== req.nodeId)
            .map((b) => b.text),
          nudge,
        })

  /**
   * EL TECHO DE ESTE CAMINO SON CUATRO LLAMADAS, Y LA CUOTA SE COBRA UNA.
   *
   * La propuesta (1), el reintento por declinar contradiciendo lo que el propio
   * modelo declaró (2), el reintento por lo perdido o el parecido (3) y el
   * reintento por prometer una cifra y no ofrecer el hueco (4). Los cuatro son
   * secuenciales e independientes: nada impide que una misma corrida los sume.
   *
   * Acá decía TRES, afirmando que dos de esos reintentos «comparten ranura».
   * Medido contra la API el 2026-09-11: una línea real gastó CUATRO. El número
   * era una suposición escrita como hecho.
   *
   * Eran SEIS hasta el 2026-09-09. Bajaron solas al sacar lo que el CEO mandó
   * sacar: el reintento por verbo repetido, la verificación de P6 y su segunda
   * verificación. Menos llamadas por la misma ranura, no más.
   */
  let calls = 0
  let first = await ask()
  calls++

  /**
   * "Ya está bien" se contesta antes de cualquier guard: no hay texto que juzgar,
   * y pedirle una segunda opinión al validador sería pagar una llamada por
   * preguntar si la nada tiene una cifra inventada.
   *
   * PERO SE COMPRUEBA LA COHERENCIA, igual que con la cifra. Declinar es válido
   * sólo si la línea original ya tiene los tres ejes; el modelo los DECLARA en
   * `declineBasis`, así que decir "está bien" mientras se declara que le falta
   * el método es una contradicción que el código puede ver. Se pide una vez más
   * nombrando lo que falta; si vuelve a declinar, se le cree y no se cobra.
   *
   * Medido contra la API: declinó sobre "Participé en las reuniones con los
   * padres" —apertura que el propio prompt prohíbe— y sobre "Di la medicación",
   * tres palabras sin resultado ni método.
   */
  /**
   * «YA ESTÁ BIEN» NO CONTESTA UNA TARJETA ABIERTA (2026-09-28).
   *
   * Medido en Chrome: sobre «Atendí en mostrador y vendí medicamentos.», con la
   * tarjeta prometiendo escribir «Retail» y señalando que faltaban resultado y
   * método, el modelo declinó declarando los tres ejes en true, y la pantalla
   * pintó «la línea ya está bien» encima de la tarjeta que seguía abierta. Lo
   * que la tarjeta promete lo sabe el motor —lo midió la auditoría—, así que la
   * negativa se juzga contra eso y no sólo contra lo que el modelo declara.
   * Si vuelve a negarse con la promesa abierta, se dice eso, no «está bien».
   */
  const promesa = [
    ...(req.mustWrite ?? []).map((t) => titleForms(t).join(" / ")),
    req.wantsSize ? (req.language === "en" ? "the size of the achievement" : "el tamaño del logro") : "",
    req.focus ?? "",
  ].filter(Boolean)
  // Un eje que sólo la persona puede dar, sin su dato: se le pide, no se niega.
  // Los ejes los escribe la IA (CEO, 2026-09-28): si no llegan, es una negativa.
  const ejesDeLaPersona = (req.axes ?? []).filter((e) => e !== "verbo")
  const negada: RewriteResult =
    promesa.length || ejesDeLaPersona.length
        ? { ok: false, verdict: { ok: false, reason: "declined", detail: [...promesa, ...ejesDeLaPersona].join(" · ") }, calls: 0 }
        : { ok: false, alreadyGood: true, calls: 0 }
  if (!first.changed) {
    const ejes = first.declineBasis
    // Sin declaración tampoco se le cree: el prompt la pide justamente cuando
    // declina, y omitirla es la forma más barata de saltarse la vara.
    const falta = [
      ...(ejes
        ? [!ejes.hasActionVerb && "verbo", !ejes.hasResult && "resultado", !ejes.hasMethod && "método"].filter(Boolean)
        : ["la declaración de los tres ejes"]),
      ...promesa,
    ]
    if (falta.length === 0) return { ok: false, alreadyGood: true, calls }
    first = await ask(
      req.language === "en"
        ? `You declined, yet this line still needs: ${falta.join(" · ")}. It has something to fix — rewrite it, keeping strictly to what the original says.`
        : `Declinaste, pero a esta línea todavía le falta: ${falta.join(" · ")}. TIENE algo que arreglar — reescribila, ciñéndote a lo que el original dice.`,
    )
    calls++
    if (!first.changed) return { ...negada, calls }
  }

  /**
   * LA TERCERA PERSONA REGULAR SE CORRIGE, NO SE RECHAZA.
   *
   * «Atendió a los clientes» costaba la reescritura entera y la ranura de cuota
   * por una letra que el código sabe conjugar. Se arregla acá, antes de juzgar;
   * lo que el código NO puede probar —un irregular, un sustantivo— sigue cayendo
   * en el guard, que es la respuesta honesta.
   */
  const preparar = (s: Suggestion): Suggestion => {
    const enPrimera = req.language !== "en" ? toFirstPerson(s.text) : null
    return repairSuggestion(enPrimera ? { ...s, text: enPrimera } : s)
  }
  first = preparar(first)

  let verdict = checkSuggestion(first, ctx)
  // Menos es mejor: parecerse a otra línea pesa más que cualquier palabra perdida.
  /** Lo que falta, lo ajeno, lo pegado y el verbo repetido, dicho en UN pedido. */
  const correccion = (s: Suggestion): string => {
    const [f, a, p, v, t, d, tp, ca, su, ej, co, en_, sp, fp, sv] = [faltan(s), ajenos(s), pegadas(s), repite(s), sinTamano(s), debil(s), terceraPersona(s), copiaAviso(s), sueltas(s), ejesFaltan(s), comenta(s), enumera(s), sinPrueba(s), fueraDelPuesto(s), sinVariante(s)]
    const en = req.language === "en"
    return [
      f.length ? (en ? `The card promised to write ${f.map((t) => titleForms(t).map((x) => `"${x}"`).join(" or ")).join(", ")} exactly as the posting writes it, and your text does not. Add it next to what the line already names, dropping nothing.` : `La tarjeta prometió escribir ${f.map((t) => titleForms(t).map((x) => `«${x}»`).join(" o ")).join(", ")} tal cual lo escribe la vacante, y tu texto no lo dice. Agregalo al lado de lo que la línea ya nombra, sin soltar nada.`) : "",
      a.length ? (en ? `The CV never says ${a.map((t) => `"${t}"`).join(", ")}: remove it.` : `El CV no dice ${a.map((t) => `«${t}»`).join(", ")} en ninguna parte: sacalo.`) : "",
      p.length ? (en ? `You pasted a CV bullet verbatim ("${p[0]}"): tell that achievement in the summary's own voice.` : `Pegaste una viñeta tal cual («${p[0]}»): contá ese logro con la voz del resumen.`) : "",
      v.length ? (en ? `Another bullet already opens with "${v[0]}": open with a different verb that says the same.` : `Otra viñeta ya abre con «${v[0]}»: abrí con otro verbo que diga lo mismo.`) : "",
      sv ? (en ? `Your line carries a slot but no variantWithoutMetric: add the same line without the slot, keeping every figure the original had.` : `Tu línea lleva un hueco y no trae variantWithoutMetric: agregá la misma línea sin el hueco, conservando toda cifra que el original tenía.`) : "",
      fp.length ? (en ? `"${fp[0]}" names nothing this posting asks for and no result: replace it with what the person did that the posting asks, or leave it out.` : `«${fp[0]}» no nombra nada de lo que el aviso pide ni un resultado: cambiala por lo que la persona hizo y el aviso pide, o sacala.`) : "",
      sp.length ? (en ? `The summary has no proof: tell this achievement in the summary's voice, with its result and its figure exactly as the CV states them — "${sp[0]}".` : `El resumen no trae prueba: contá este logro con la voz del resumen, con su resultado y su cifra tal cual los dice el CV — «${sp[0]}».`) : "",
      en_.length ? (en ? `"${en_[0]}" lists posting terms: name them inside what the person did, or leave them out.` : `«${en_[0]}» enumera términos del aviso: nombralos dentro de lo que la persona hizo, o sacalos.`) : "",
      co.length ? (en ? `You wrote about the CV ("${co[0]}"): the summary is the printed text itself, never a comment about the document.` : `Hablaste del CV («${co[0]}»): el resumen es el texto impreso, nunca un comentario sobre el documento.`) : "",
      ej.length ? (en ? `The card promised this line would have: ${ej.join(", ")}, and your newBasis says it does not. Use what the original and the person say; if they do not say it, keep it false — never fill it with a posting term.` : `La tarjeta prometió que esta línea tendría: ${ej.join(", ")}, y tu newBasis dice que no. Usá lo que dicen el original y la persona; si no lo dicen, dejalo en false — nunca lo rellenes con un término de la vacante.`) : "",
      su.length ? (en ? `${su.map((x) => `"${x}"`).join(", ")} is a loose datum: fold it into a complete sentence or leave it out.` : `${su.map((x) => `«${x}»`).join(", ")} es un dato suelto: integralo en una oración completa o sacalo.`) : "",
      ca.length ? (en ? `You copied the posting's duties (${ca.map((x) => `"${x}"`).join(", ")}): the summary says what the CV shows this person did.` : `Copiaste tareas del aviso (${ca.map((x) => `«${x}»`).join(", ")}): el resumen dice lo que el CV muestra que esta persona hizo.`) : "",
      tp.length
        ? en
          ? `${tp.map((w) => `"${w}"`).join(", ")} speaks of the person in the third person: ${isSummary ? "the summary is a noun phrase or the work itself, in one voice" : "open with a past-tense verb"}.`
          : `${tp.map((w) => `«${w}»`).join(", ")} habla de la persona en tercera: el resumen va como frase nominal o con el trabajo en sí, en una sola voz.`
        : "",
      d ? (en ? `It opens with a duty ("${s.text.split(/\s+/).slice(0, 2).join(" ")}…"): open with the verb of what was done.` : `Abre con una tarea («${s.text.split(/\s+/).slice(0, 2).join(" ")}…»): abrí con el verbo de lo que se hizo.`) : "",
      t ? (en ? `The card promised the size of this achievement: add the typed slot with its believable range, so the person writes the number.` : `La tarjeta prometió el tamaño de este logro: agregá el hueco tipado con su rango creíble, para que la persona escriba el número.`) : "",
    ].filter(Boolean).join(" ")
  }
  // Lo prometido pesa más que una palabra perdida y menos que repetir otra línea.
  const costo = (s: Suggestion) => (parecidaA(s) ? 1000 : 0) + problemas(s) * 10 + lostContent(s, ctx).length
  const parecida = verdict.ok ? parecidaA(first) : null
  const perdido = verdict.ok ? lostContent(first, ctx) : []

  /**
   * UN REINTENTO, Y NADA DE LO QUE ESCRIBIÓ EL MODELO BLOQUEA (CEO, 2026-09-11).
   *
   * Vacía o sin línea donde escribir: se pide una vez más y, si vuelve igual, no
   * hay nada honesto que entregar. Parecida a otra línea, o que dejó de decir
   * algo —un término, una cifra, una palabra de la línea que se borra—: también
   * se pide una vez más diciendo QUÉ, pero la respuesta llega SIEMPRE. Gana la
   * que menos cuesta; lo perdido se ve tachado en el antes/después y el parecido
   * se avisa con la línea nombrada. Antes eso era «It was not written» con la
   * consulta gastada.
   */
  const aCorregir = verdict.ok ? correccion(first) : ""
  if (!verdict.ok || parecida || perdido.length > 0 || aCorregir) {
    const nudge = !verdict.ok
      ? retryNudge(verdict, req.language)
      : [
          parecida ? similarNudge(parecida, req.language) : "",
          perdido.length > 0 ? lossNudge(perdido, req.language) : "",
          aCorregir ? `${aCorregir} ${req.language === "en" ? "Keep strictly to what the CV says." : "Ceñite a lo que el CV dice."}` : "",
        ]
          .filter(Boolean)
          .join("\n")
    const segundo = await ask(nudge)
    calls++
    if (!segundo.changed) {
      if (!verdict.ok) return { ...negada, calls }
    } else {
      const reparado = preparar(segundo)
      const v2 = checkSuggestion(reparado, ctx)
      if (!verdict.ok) {
        first = reparado
        verdict = v2
      } else if (v2.ok && costo(reparado) < costo(first)) {
        first = reparado
      }
    }
  }
  if (!verdict.ok) return { ok: false, verdict, calls }

  /**
   * LA MISMA LÍNEA DEVUELTA NO ES UNA PROPUESTA: ES «YA ESTÁ BIEN».
   *
   * ── MEDIDO CONTRA LA API (2026-09-11) ──────────────────────────────────────
   * De 15 líneas reales, 3 volvieron —también tras el reintento— con el texto
   * del usuario intacto, y el panel las mostraba como propuesta con un cartel
   * amarillo encima: «se parece a una línea que ya tenés». El usuario apretaba,
   * esperaba, gastaba una consulta y recibía su propia línea. Una de ellas
   * costó cuatro llamadas.
   *
   * No es un bloqueo: es la respuesta que el producto ya tiene para este caso, y
   * el panel la pinta en verde. La vara es la del CEO —90% idéntico no es
   * mejora—, la misma que ya usa `similarTo`.
   */
  if (parecidaA(first) === original) {
    return { ...negada, calls }
  }

  /**
   * ── ACÁ CORRÍA P6, EL VALIDADOR (CEO, 2026-09-09) ──────────────────────────
   *
   * Era una llamada más al modelo, DESPUÉS de que los guards dieran OK, con una
   * sola tarea: «detectar si la reescritura afirma algo que el original no
   * sostiene» — herramienta no declarada, entidad nueva, cifra no dada. Es
   * exactamente la pregunta de `invented_term` e `invented_figure`, que el CEO
   * mandó sacar. Dejarlo habría vuelto la orden un no-op: la misma reescritura
   * seguiría muriendo, sólo que decidido por un segundo modelo en vez de por el
   * código, y cobrando una llamada extra por hacerlo.
   *
   * Ya había tenido que acotarse una vez porque borraba producto: haciéndole
   * caso a todo, la entrega caía de 14/15 a 9/15 — etiquetaba como invención el
   * vocabulario del oficio («estilismo», «salón», «datos clínicos»), que es lo
   * que la doctrina obliga a nombrar.
   *
   * Efecto medido por construcción: el techo de esta función baja de CINCO
   * llamadas a TRES.
   */

  /**
   * ── LA CIFRA QUE EL MODELO DECLARÓ Y NO OFRECIÓ ────────────────────────────
   *
   * `measurableAspect` es lo que el modelo dijo que se puede medir de este
   * trabajo. Si dijo que hay algo y NO propuso el hueco, se le pide una vez —
   * medido, la cifra es la palanca de impacto más grande del producto y venía
   * saliendo 0 o 1 vez cada quince líneas.
   *
   * Si la segunda tampoco lo trae, se ENTREGA IGUAL. Una línea buena sin cifra
   * vale mucho más que una pantalla vacía con el uso ya cobrado, y este producto
   * ya pagó una vez por confundir "faltó lo ideal" con "no hay nada que dar".
   */
  const prometeTamano = Boolean(first.measurableAspect?.trim())
  const yaTieneCifra = /\d/.test(original)
  if (prometeTamano && first.placeholders.length === 0 && !yaTieneCifra) {
    const segunda = await ask(
      req.language === "en"
        ? `You wrote that this work can be measured in "${first.measurableAspect}" and then offered no slot for it. Add the typed slot with its believable range for this trade — or set measurableAspect to null if there is truly nothing to measure.`
        : `Escribiste que este trabajo se mide en "${first.measurableAspect}" y después no ofreciste el hueco. Agregá el hueco tipado con su rango creíble para este oficio — o poné measurableAspect en null si de verdad no hay nada que medir.`,
    )
    calls++
    const conHueco = preparar(segunda)
    if (
      conHueco.changed &&
      conHueco.placeholders.length > 0 &&
      checkSuggestion(conHueco, ctx).ok &&
      costo(conHueco) <= costo(first)
    ) {
      first = conHueco
    }
  }

  /**
   * LO QUE EL REINTENTO NO CORRIGIÓ Y SE PUEDE QUITAR SIN TOCAR LO DEMÁS.
   *
   * Una oración que habla del CV («The CV also shows…», medido dos veces
   * seguidas el 2026-09-28), que es un dato suelto o una lista de términos no
   * tiene redacción que rescatar: se retira, y el resto del resumen queda como el modelo lo
   * escribió. Sólo si quedan al menos dos oraciones — si no, no hay resumen.
   */
  /**
   * UN CARGO CON BARRA SE ESCRIBE EN UNA SOLA FORMA. Medido el 2026-09-28: el
   * resumen abrió «Senior iOS Engineer / Developer», la cadena del aviso con su
   * barra. Se deja la forma que más se parece a los cargos que la persona tuvo
   * — un «iOS Developer» lleva a «Senior iOS Developer» —, sin otra llamada.
   */
  const cargos = normalize(req.tree.roles.map((r) => r.title).join(" ")).split(" ")
  for (const t of req.mustWrite ?? []) {
    const formas = titleForms(t)
    if (formas.length < 2) continue
    const conBarra = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s*\/\s*/g, "\\s*/\\s*"), "i")
    if (!conBarra.test(first.text)) continue
    const afinidad = (f: string) => normalize(f).split(" ").filter((w) => cargos.includes(w)).length
    const mejor = [...formas].sort((a, b) => afinidad(b) - afinidad(a))[0]
    first = { ...first, text: first.text.replace(conBarra, mejor) }
  }
  if (isSummary) {
    const oraciones = first.text.split(/(?<=[.!?])\s+/).map((o) => o.trim()).filter(Boolean)
    // La oración parecida a su viñeta NO se retira: suele ser la prueba con su
    // cifra, y perderla deja un resumen sin resultado (medido el 2026-09-28).
    const sinDefecto = oraciones.filter((o) => {
      const sola = { ...first, text: o }
      return comenta(sola).length === 0 && sueltas(sola).length === 0 && enumera(sola).length === 0
    })
    // Lo que no trabaja para el puesto se quita sólo si quedan dos: es la razón
    // más débil, y un resumen de una oración rinde menos que uno con una floja.
    const delPuesto = sinDefecto.filter((o, i) => i === 0 || fueraDelPuesto({ ...first, text: `. ${o}` }).length === 0)
    const sanas = delPuesto.length >= 2 ? delPuesto : sinDefecto
    if (sanas.length >= 1 && sanas.length < oraciones.length) first = { ...first, text: sanas.join(" ") }
  }
  // Si ni el reintento trajo la versión sin cifra, la salida es la línea tal
  // como está: «no tengo ese dato» nunca puede quedar sin opción.
  if (sinVariante(first)) first = { ...first, variantWithoutMetric: original }
  // Una tecnología o nombre propio que la persona afirma y el reintento siguió
  // soltando: reemplazarla altera un hecho suyo (medido: «RESTful» → «GraphQL»).
  const nombresPerdidos = isSummary ? [] : droppedNames(original, first.text)
  if (nombresPerdidos.length > 0) return { ok: false, verdict: { ok: false, reason: "declined", detail: nombresPerdidos.join(", ") }, calls }
  // Un término prometido que tampoco llegó en el reintento: ver `faltan`.
  if (faltan(first).length > 0) return { ...negada, calls }
  /**
   * UN EJE PROMETIDO QUE SÓLO LA PERSONA PUEDE DAR. Si el resultado o el método
   * no están ni en el original ni en lo que ella contó, no se entrega relleno:
   * se le pide el dato en la misma tarjeta. Si ya lo contó y aun así no llegó,
   * es una negativa como cualquier otra.
   */
  if (ejesFaltan(first).some((e) => e !== "verbo")) return { ...negada, calls }

  await req.store.write("ats3-fix", key, first)
  return { ok: true, suggestion: anchor(first, hashBase, original, parecidaA(first)), served: false, calls }
}

function anchor(
  s: Suggestion,
  hash: string,
  originalText: string,
  similar?: string | null,
): AnchoredSuggestion {
  return { ...s, basedOnHash: hash, originalText, ...(similar ? { similarTo: similar } : {}) }
}

function roleContextOf(tree: ResumeTree, nodeId: NodeId): string {
  const role = tree.roles.find((r) => r.bullets.some((b) => b.id === nodeId))
  return role ? `${role.title} — ${role.company}` : ""
}

/**
 * LO QUE LA VACANTE PIDE Y EL CV YA DEMUESTRA, en el orden en que la vacante lo
 * pide: primero los obligatorios, en el orden de peso que P1 devuelve, después
 * los deseables. Es lo único que el resumen puede nombrar de la vacante.
 */
function provenTermsOf(tree: ResumeTree, spec: JobSpec, index: TermIndex): string[] {
  const escritos = termsIn(index, cvTextOf(tree))
  const pedidos = [...(spec.mustHave ?? []), ...(spec.niceToHave ?? [])].map((r) => index.byKey.get(termKey(r.skill)) ?? r.skill)
  return [...new Set(pedidos.filter((t) => escritos.has(t)))]
}

/**
 * LA PRUEBA DEL RESUMEN SALE DE LO QUE ESTE PUESTO PIDE (2026-09-28).
 *
 * Eran las tres primeras viñetas con un número, sin mirar la vacante: el
 * resumen podía probar lo que el puesto no pide y callar lo que sí. Ahora gana
 * la viñeta que demuestra más de lo pedido —cada término vale más cuanto antes
 * lo pide la vacante—, y a igual demostración, la que trae cifra y la del
 * puesto más reciente.
 */
function topBulletsOf(tree: ResumeTree, spec: JobSpec): string[] {
  // Lo que el puesto pide, con su peso: antes pedido, más pesa. Por RAÍZ, como
  // `bestHomeFor`: para elegir la prueba importa que la viñeta hable de eso
  // —«RESTful APIs» habla de «REST APIs»—, no que lo escriba literal; eso lo
  // mide el puntaje, no esta elección.
  const pedidos = [...(spec.mustHave ?? []), ...(spec.niceToHave ?? [])].map((r) => normalize(r.skill).split(" ").filter((w) => w.length >= 4))
  return tree.roles
    .flatMap((r, ri) => r.bullets.map((b) => ({ b, ri })))
    .map(({ b, ri }) => {
      const palabras = normalize(b.text).split(" ")
      const relevancia = pedidos.reduce(
        (n, ws, i) => n + (ws.length > 0 && ws.some((w) => palabras.some((p) => sameRoot(w, p))) ? pedidos.length - i : 0),
        0,
      )
      // La PRUEBA es un resultado: entre las viñetas que hablan de lo pedido,
      // primero las que traen cifra — sin cifra el modelo no tiene qué contar y
      // copia la viñeta (medido el 2026-09-28). Una cifra sobre trabajo que el
      // puesto no pide no prueba ajuste.
      const cifra = statesQuantity(b.text) && relevancia > 0 ? 100_000 : 0
      return { texto: b.text, valor: cifra + relevancia * 10 - ri }
    })
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 3)
    .map((x) => x.texto)
}

// ─────────────────────────────────────────────────────────────────────────────
// APLICAR: sobre una copia, y recién después sobre el CV
// ─────────────────────────────────────────────────────────────────────────────

export interface ApplyResult {
  ok: boolean
  tree: ResumeTree
  ledger: Ledger
  delta: number
  reason?: GuardVerdict
}

// Acá vivía una `resolution` que nadie leía, y además mentía: armaba su id con
// el tipo quemado en "no_result", así que para un `no_metric` o un requisito —que
// lleva sujeto en su clave— habría anotado un hallazgo distinto del que se
// cerró. La resolución buena la arma el cliente con los ids que el motor ya le
// entregó, que son los únicos que `loyalty` puede emparejar.

/**
 * Aplica una sugerencia y devuelve cuánto sumó DE VERDAD.
 *
 * El orden importa y es el del documento v3: copia → recálculo → delta → recién
 * ahí el árbol real y el ledger. Si algo falla en el medio, el CV del usuario
 * nunca se tocó.
 */
export function applySuggestion(
  tree: ResumeTree,
  s: AnchoredSuggestion,
  spec: JobSpec,
  audit: AuditFacts,
  checks: ParseChecks,
  ledger: Ledger,
  /**
   * LOS MISMOS PESOS CON LOS QUE SE PINTA EL DIAL.
   *
   * ── LO QUE ESTO NO ARREGLA, MEDIDO ─────────────────────────────────────────
   * Hoy no cambia ni un decimal, y conviene que quede escrito para que nadie lo
   * "verifique" con una sonda que mide otra cosa. La auditoría es la MISMA antes
   * y después —esta función sólo reescribe un texto— y los pesos entran
   * únicamente en `must`/`nice`, que salen de `audit.coverage`. Lo que sí cambia
   * al reescribir —`metric`, `verbs`— se pondera con `COMPONENT_WEIGHT`, que es
   * fijo. Medido sobre un aviso que repite SAP tres veces: delta 6,5625 con
   * pesos y 6,5625 sin ellos.
   *
   * Se pasan igual, y por una sola razón: el número que esta función promete y
   * el que la pantalla pinta después tienen que salir de los MISMOS insumos, no
   * coincidir de casualidad. Hoy coinciden porque ningún componente que dependa
   * del árbol usa los pesos; el día que uno lo haga, esto ya está bien y nadie
   * tiene que acordarse.
   */
  termWeights: Record<string, number> = {},
): ApplyResult {
  if (isStale(s.basedOnHash, s.bulletId, tree)) {
    return { ok: false, tree, ledger, delta: 0, reason: { ok: false, reason: "stale", detail: s.bulletId } }
  }

  const before = scoreResume(tree, spec, audit, checks, termWeights)
  // Sobre la COPIA, como todo acá: si algo falla, el CV del usuario no se tocó.
  const copy = writeInto(tree, s.bulletId, s.text)
  const after = scoreResume(copy, spec, audit, checks, termWeights)

  return {
    ok: true,
    tree: copy,
    ledger: afterAccept(ledger, s),
    delta: deltaOf(before, after),
  }
}


/** Escribe un nodo devolviendo un árbol NUEVO. El original no se toca. */
export function writeInto(tree: ResumeTree, nodeId: NodeId, text: string): ResumeTree {
  if (nodeId === tree.summary.id) {
    return { ...tree, summary: { ...tree.summary, text, hash: nodeHash(text), origin: "AI_ACCEPTED" } }
  }
  return {
    ...tree,
    roles: tree.roles.map((r) => ({
      ...r,
      bullets: r.bullets.map((b) =>
        b.id === nodeId ? { ...b, text, hash: nodeHash(text), origin: "AI_ACCEPTED" as const } : b,
      ),
    })),
  }
}

/** El CV de vuelta al formato en que la aplicación lo guarda. */
export function writeBack(tree: ResumeTree, raw: RawResume): RawResume {
  const byRole = new Map(tree.roles.map((r) => [r.id, r]))
  // El MISMO desempate que al leer, recorriendo en el mismo orden: es lo que
  // hace que cada puesto del documento encuentre exactamente su propio nodo.
  const seenRoles = new Set<NodeId>()
  return {
    ...raw,
    summary: tree.summary.text,
    workExperience: (raw.workExperience ?? []).map((r) => {
      const node = byRole.get(roleIdFor(r.jobTitle ?? "", r.employer ?? "", r.startDate ?? "", seenRoles))
      if (!node) return r
      return { ...r, description: node.bullets.map((b) => `• ${b.text}`).join("\n") }
    }),
  }
}

export { openLedger }
