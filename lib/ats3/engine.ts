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
  DETAIL_SEPARATOR,
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
  type Finding,
  type FindingType,
  type JobSpec,
  type NodeId,
  type Verdict,
  type Resolution,
  type ResumeTree,
  type Suggestion,
  type TermIndex,
  type TermVariants,
  type TriageDecision,
} from "@/lib/ats3/contracts"
import { afterAccept, BULLETS_PER_ROLE_MAX, BULLETS_PER_ROLE_MIN, ledgerSignature, openLedger, releaseOpener, SKILLS_MAX, spaceBudget, type Ledger } from "@/lib/ats3/ledger"
import { checkSuggestion, findNode, isStale, loyalty, retryNudge, toFirstPerson, type GuardVerdict } from "@/lib/ats3/guards"
import { deltaOf, gainOf, postingWeights, scoreResume, statesQuantity, titleWritten, type AuditFacts, type ComponentKey, type ParseChecks, type Score } from "@/lib/ats3/score"

// ─────────────────────────────────────────────────────────────────────────────
// PUERTOS
// ─────────────────────────────────────────────────────────────────────────────

/** Las seis preguntas que sólo un modelo puede contestar. Ya validadas. */
export interface AtsAi {
  parseJob(jdText: string, language: "es" | "en"): Promise<JobSpec>
  audit(tree: ResumeTree, spec: JobSpec): Promise<AuditFacts>
  triage(tree: ResumeTree, spec: JobSpec, audit: AuditFacts, budget: Record<NodeId, number>): Promise<TriageDecision[]>
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
  /**
   * LAS DOS LÍNEAS DE UNA FUSIÓN, cuando la hay.
   *
   * Va aparte de `original` —que las lleva pegadas para que el guard juzgue
   * contra las dos— porque el modelo necesita saber que son DOS y que tiene que
   * devolver UNA. Sin decirlo, lo que devuelve es una de las dos retocada.
   */
  mergeOf?: [string, string]
  spec: JobSpec
  ledger: Ledger
  declaredSkills: string[]
  /** Qué falló del intento anterior. Vacío la primera vez. */
  nudge?: string
}

export interface SummaryInput {
  current: string
  spec: JobSpec
  topBullets: string[]
  ledger: Ledger
  declaredSkills: string[]
  nudge?: string
}

/** Memoria. La implementa quien tenga base de datos; el motor no la conoce. */
export interface AtsStore {
  read(kind: CacheKind, hash: string): Promise<unknown | null>
  write(kind: CacheKind, hash: string, payload: unknown): Promise<void>
}

export type CacheKind = "ats3-jd" | "ats3-audit" | "ats3-triage" | "ats3-fix" | "ats3-log"

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
    fechas_legibles: fechas.length === 0 ? null : fechas.every((d) => MES_ANIO.test(d) || /presente|current|actual/i.test(d)),
    // Del más reciente al más viejo: es el orden que espera quien lee.
    orden_cronologico: roles.length < 2 ? null : roles.every((r, i) => i === 0 || roles[i - 1].startDate >= r.startDate),
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
    .map((r) => ({ desde: mes(r.startDate), hasta: r.endDate.trim() && !/presente|current|actual/i.test(r.endDate) ? mes(r.endDate) : Infinity }))
    .filter((p) => p.desde !== null) as { desde: number; hasta: number }[]
  if (periodos.length < 2) return null
  const orden = [...periodos].sort((a, b) => a.desde - b.desde)
  for (let i = 1; i < orden.length; i++) {
    const previo = orden[i - 1]
    // Superpuestas: el puesto nuevo empieza antes de que el anterior termine.
    // Un mes de solape es un cambio de trabajo, no una contradicción.
    if (previo.hasta !== Infinity && orden[i].desde < previo.hasta - 1) return false
    // Hueco: más de seis meses entre que uno termina y el siguiente empieza.
    if (previo.hasta !== Infinity && orden[i].desde - previo.hasta > 6) return false
  }
  return true
}

/** La fecha como cantidad de meses. Acepta las mismas formas que `MES_ANIO`. */
function mes(fecha: string): number | null {
  const m = fecha.match(/(\d{4})[-/](\d{1,2})|(\d{1,2})[-/](\d{4})|(\d{4})/)
  if (!m) return null
  const anio = Number(m[1] ?? m[4] ?? m[5])
  const numeroMes = Number(m[2] ?? m[3] ?? 1)
  return anio * 12 + Math.min(12, Math.max(1, numeroMes))
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

  /**
   * El triage: qué merece el espacio de la página.
   *
   * Sin esta capa, reanalizar un CV que no cambió costaba UNA llamada — el
   * documento promete cero y era la única que quedaba suelta. Depende del CV,
   * de la vacante y del presupuesto de espacio: si los tres son los mismos, la
   * respuesta guardada sigue siendo válida por definición.
   */
  triage: (treeHashValue: string, jdHash: string, budget: string, model: string) =>
    sha256(treeHashValue, jdHash, budget, PROMPT_VERSION.P3, model),

  /** Lleva la firma del ledger: si otra viñeta gastó ese verbo, esto ya no vale. */
  fix: (nodeId: NodeId, nodeHashValue: string, jdHash: string, ledgerSig: string, model: string, focus = "") =>
    // El foco entra a la clave porque entra al prompt: sin él, pedir «le falta
    // el método» y «tejé este término» sobre la misma línea devolvía la primera
    // respuesta guardada para las dos.
    sha256(nodeId, nodeHashValue, jdHash, ledgerSig, PROMPT_VERSION.P4, model, focus),

  /** El registro de lo resuelto, por CV y vacante. */
  log: (resumeId: string, jdHash: string) => sha256(resumeId, jdHash),
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
    const clave = subject ? `${nodeId}:${subject}` : nodeId
    const existing = out.find((f) => (f.subject ? `${f.nodeId}:${f.subject}` : f.nodeId) === clave)
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
      if (gain > existing.gain) {
        existing.type = type
        existing.component = component
        existing.remedy = remedy
        existing.detail = detail ? `${detail}${existing.detail ? DETAIL_SEPARATOR + existing.detail : ""}` : existing.detail
      } else {
        existing.detail = existing.detail ? `${existing.detail}${DETAIL_SEPARATOR}${detail}` : detail
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
        push("no_metric", "metric", b.id, b.text, gainOf(score, "metric"), "el logro admite un tamaño y no lo declara")
      }
    }
  }


  // Lo que la vacante exige y el CV no demuestra. Es la palanca más grande del
  // puntaje, y en el motor viejo vivía fuera del ejecutor, como filas de tabla.
  for (const c of audit.coverage) {
    if (c.status === "FOUND") continue
    const key = c.requirement === "MUST" ? "must" : "nice"
    /**
     * DONDE LA AUDITORÍA YA DIJO QUE ESTÁ EL TRABAJO, Y SI NO, LA MEJOR CASA.
     *
     * `IMPLIED` significa «el trabajo descrito lo demuestra pero el CV no lo
     * NOMBRA», y en ese caso P2 puede citar la línea. Esa cita vale más que
     * `bestHomeFor`, que es una heurística de raíces compartidas: es el nodo
     * donde la evidencia vive de verdad.
     *
     * Y no es cosmético. El prompt de reescritura le exige al modelo que alguna
     * palabra del término ya esté en la línea —«si no comparte nada, NO ENTRA»—
     * y el prompt hace cumplir lo mismo. Anclar el requisito en
     * una línea que no lo respalda es pedir una reescritura que las dos reglas
     * van a rechazar; anclarlo donde la auditoría vio el trabajo es pedirla
     * donde puede salir bien.
     */
    const target = c.evidenceNodeId && findNode(tree, c.evidenceNodeId) ? c.evidenceNodeId : bestHomeFor(tree, c.skill, index)
    /**
     * COMPARTE LA TARJETA DE SU LÍNEA, y le da su nombre.
     *
     * Tuvo tarjeta propia por un motivo real: el primero en llegar fijaba el
     * título y la sección, y como los ejes de la viñeta se emiten antes, el
     * requisito quedaba dentro de «no dice qué cambió» y perdía las dos cosas
     * que lo hacen accionable. Pero dos tarjetas sobre una viñeta son dos
     * órdenes para UNA sola reescritura — lo que el CEO reportó con captura.
     *
     * Se cerró donde correspondía: en `push`, que ahora le da el título y la
     * sección al hallazgo que MÁS mueve el número. El requisito casi siempre lo
     * es, así que conserva su nombre sin abrir una tarjeta más.
     */
    push("missing_requirement", key, target, textOf(tree, target), gainOf(score, key), c.skill, "rewrite")
  }

  /**
   * LO QUE ESTÁ, PERO DONDE NO SE VE.
   *
   * Un requisito demostrado en el puesto más viejo del CV cuenta para el
   * puntaje —lo demuestra— y sin embargo el lector, humano o no, puede no
   * llegar nunca hasta ahí. No es una brecha: es una ubicación. Por eso NO
   * suma puntos (`gain` 0) y la tarjeta lo dice: mover, no escribir de nuevo.
   *
   * Se calcula sin gastar un token: la auditoría ya dice en qué nodo vive el
   * término, y el árbol sabe a qué puesto pertenece ese nodo.
   */
  const puestoDe = new Map<NodeId, number>()
  tree.roles.forEach((r, i) => r.bullets.forEach((b) => puestoDe.set(b.id, i)))
  const ultimoPuesto = Math.max(0, tree.roles.length - 1)
  for (const c of audit.coverage) {
    if (c.status !== "FOUND" || !c.evidenceNodeId) continue
    const dondeVive = puestoDe.get(c.evidenceNodeId)
    // Sólo el puesto MÁS VIEJO, y sólo si hay tres o más: en un CV de dos
    // puestos, "el de abajo" sigue estando en la primera pantalla.
    if (dondeVive === undefined || tree.roles.length < 3 || dondeVive !== ultimoPuesto) continue
    /**
     * Se ancla en el PUESTO ACTUAL, no en el viejo.
     *
     * El problema no es cómo está escrita la línea de 2015: es que el término
     * sólo vive ahí. Lo que lo cierra es mencionarlo arriba, donde el lector
     * llega. Anclarlo a la línea vieja daba un botón que reescribía justamente
     * lo que no había que tocar.
     */
    const arriba = bestHomeFor({ ...tree, roles: [tree.roles[0]] }, c.skill, index)
    // Sin sujeto, por lo mismo que la blanda: su remedio es REESCRIBIR esta
    // línea, así que comparte tarjeta con lo demás que se dice de ella. El
    // sujeto quedaría sólo para un remedio que NO toque el texto de la línea, y
    // hoy no hay ninguno.
    push("buried_term", "must", arriba, textOf(tree, arriba), 0, c.skill)
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
   * LA BLANDA QUE SE DECLARA Y NADA RESPALDA.
   *
   * La auditoría ya la juzga: DECLARED_ONLY es "aparece como adjetivo o en una
   * lista, sin ningún logro detrás" — la lista de adjetivos que todo reclutador
   * saltea. Hasta ahora se veía en la tabla y no tenía salida.
   *
   * Su remedio no es tocar la lista: es DEMOSTRARLA en una línea, y el motor ya
   * sabe elegir cuál encaja mejor. No suma puntos porque las blandas no entran
   * al puntaje, y la tarjeta lo dice.
   */
  for (const s of audit.softCoverage) {
    if (s.status !== "DECLARED_ONLY") continue
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
    push("verb_repeated", "verbs", masDebil.id, masDebil.text, gainOf(score, "verbs"), abre)
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
   * gana la que menos aporta — la misma señal que el triage usa para REPLACE.
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
       * estaba, y la floja se quedaba floja. Es la misma señal que el triage usa
       * para REPLACE —«la viñeta más débil del bloque»— y se mide igual: sin
       * términos del aviso y corta.
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
): { final: string[]; add: string[]; drop: string[] } {
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
    if (!n || final.some((x) => normalize(x) === n) || final.length >= SKILLS_MAX) return
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
  const demostradas = new Set(
    audit.coverage.filter((c) => c.status !== "NOT_FOUND").map((c) => normalize(c.skill)),
  )
  for (const s of pedidas) if (comoLoEscribio.has(normalize(s)) || demostradas.has(normalize(s))) meter(s)
  // 2 · lo tuyo, en tu orden, hasta llenar el cupo
  for (const s of declared) meter(s)

  const enFinal = new Set(final.map(normalize))
  return {
    final,
    add: final.filter((s) => !comoLoEscribio.has(normalize(s))),
    drop: declared.filter((s) => !enFinal.has(normalize(s))),
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
  | { act: "triage"; decisions: TriageDecision[]; budget: Record<NodeId, number> }

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
  served: { jd: boolean; audit: boolean; triage: boolean }
}

export async function* runAnalysis(input: AnalysisInput): AsyncGenerator<Act, AnalysisTelemetry> {
  const telemetry: AnalysisTelemetry = { calls: 0, served: { jd: false, audit: false, triage: false } }
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
    await input.store.write("ats3-audit", auditKey, audit)
  }

  /**
   * UN `FOUND` SE COMPRUEBA. Si el modelo y el código discrepan, gana el código.
   *
   * ── EL DEFECTO QUE ESTO CIERRA, MEDIDO ──────────────────────────────────────
   * El prompt de P2 lo dice con todas las letras: «FOUND sólo si el CV lo dice
   * con palabras que un lector literal reconocería» y «la frontera es lo que el
   * filtro puede ver, no lo que vos entendés». Pero un prompt es una petición, no
   * un contrato, y NADA lo hacía cumplir.
   *
   * Medido: con un CV que dice «Recibí y orienté a los visitantes» y una vacante
   * que pide «Atención al público», el modelo devolvía FOUND. La tabla mostraba
   * «tu CV lo dice 0 veces» y el puntaje contaba el requisito al 100%: dos
   * respuestas a la misma pregunta, y la que el usuario ve en pantalla era la que
   * NO movía su número.
   *
   * Peor que un número inflado: es una promesa. El filtro compara cadenas — ése
   * es el producto entero— así que decirle a alguien que está cubierto cuando el
   * término no está escrito es mandarlo a una postulación que ya perdió.
   *
   * `IMPLIED` es exactamente para eso —«el trabajo lo demuestra y el CV no lo
   * NOMBRA»— y ya tiene su salida: el hallazgo que pide tejer el término en la
   * línea donde la evidencia vive. No se pierde nada; se dice la verdad.
   *
   * Se comprueba con `termsIn`, la MISMA función con la que la tabla cuenta:
   * por construcción, lo que el usuario lee y lo que el número cuenta no pueden
   * discrepar.
   */
  /**
   * SE COMPARA POR LLAVE, NO POR LA CADENA QUE EL MODELO ESCRIBIÓ.
   *
   * Medido: `c.skill` viene del modelo, y con «Atención al Público» —una mayúscula
   * de diferencia— o «Atencion al publico» —sin tilde— la comparación exacta
   * fallaba y DEGRADABA un requisito que el CV sí dice. El usuario perdía puntos
   * por cómo el modelo escribió una palabra.
   *
   * `normalize` es la misma llave de igualdad que usan el matcher y la tabla:
   * dos formas de escribir el mismo término son el mismo término.
   */
  const dichoEnElCv = new Set(
    [
      ...termsIn(
        index,
        [tree.summary.text, ...tree.roles.flatMap((r) => [r.title, ...r.bullets.map((b) => b.text)])].join(" . "),
      ),
    ].map(normalize),
  )
  audit = {
    ...audit,
    coverage: audit.coverage.map((c) =>
      c.status === "FOUND" && !dichoEnElCv.has(normalize(c.skill)) ? { ...c, status: "IMPLIED" as const } : c,
    ),
  }

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
    terms: audit.coverage.filter((c) => c.status === "FOUND").map((c) => c.skill),
  }

  // ── el triage: qué merece el espacio de la página ─────────────────────────
  //
  // Corre ANTES de emitir los hallazgos y no por gusto: el triage decide si una
  // línea merece trabajo, y los hallazgos dicen qué trabajo. Emitidos por
  // separado, la misma viñeta salía marcada "KEEP — relevante y ya bien escrita"
  // arriba y "le falta una cifra" abajo. Dos sistemas contradiciéndose en la
  // misma pantalla es un defecto que este proyecto ya pagó con captura.
  const budget = spaceBudget(tree)
  const triageKey = cacheKey.triage(treeHash(tree), jdKey, JSON.stringify(budget.perRole), input.model)
  let decisions = (await input.store.read("ats3-triage", triageKey)) as TriageDecision[] | null
  if (decisions) {
    telemetry.served.triage = true
  } else {
    decisions = await input.ai.triage(tree, spec, audit, budget.perRole)
    telemetry.calls++
    await input.store.write("ats3-triage", triageKey, decisions)
  }
  /**
   * EL TECHO DE SEIS VIÑETAS POR PUESTO, CON SALIDA DE VERDAD.
   *
   * ── POR QUÉ ES UN VEREDICTO Y NO UN HALLAZGO (orden del CEO) ───────────────
   * «Si ves viñetas a mejorar y ya tenés 6, sugerí eliminar la más débil.» Un
   * hallazgo habría necesitado un remedio nuevo, un botón nuevo, una
   * confirmación nueva y su propio deshacer — cuatro piezas para algo que el
   * tablero YA hace: muestra la línea exacta, pide confirmación antes de borrar
   * y ofrece devolverla. Y el tablero se llama «Qué merece el espacio de la
   * página», que es literalmente esta pregunta.
   *
   * Así además no se pisa con nada: como DROP cierra la línea, esa viñeta deja
   * de recibir tarjetas pidiéndole mejoras. El panel no puede decir «sacala» y
   * «mejorala» a la vez.
   *
   * NO PISA AL MODELO: sólo habla de viñetas sobre las que el triage no dijo
   * nada. Si el modelo ya decidió esa línea, manda él.
   */
  /**
   * UNA FUSIÓN NO SE PIDE PARA DESPUÉS PEDIR QUE SAQUES ALGO (CEO, 2026-09-09).
   *
   * «Si fusionás es porque tiene buen impacto para el currículum; si fusionás
   * cosas para luego pedir eliminar o sacar, eso no quiero.»
   *
   * El modelo puede devolver MERGE sobre una línea y DROP o DEMOTE sobre la
   * otra del par: leído en pantalla, es el panel pidiendo juntarlas y tirar una
   * al mismo tiempo. Manda la fusión —es la que el usuario tiene delante con
   * las dos líneas— y el veredicto que la contradice se retira.
   *
   * Las dos salidas SÍ se ofrecen juntas, pero en la MISMA tarjeta y sin
   * encadenar: fusionar, o sacar una. Elige el usuario, no el motor.
   */
  const enFusion = new Set(
    decisions.filter((d) => d.verdict === "MERGE" && d.mergeWith).flatMap((d) => [d.bulletId, d.mergeWith as NodeId]),
  )
  decisions = decisions.filter(
    (d) => d.verdict === "MERGE" || !enFusion.has(d.bulletId) || d.verdict === "KEEP",
  )

  const conVeredicto = new Set(decisions.map((d) => d.bulletId))

  /**
   * EL MÍNIMO LO DETECTA EL CÓDIGO, NO EL MODELO (CEO, 2026-09-09).
   *
   * «Que controle un máximo de 6 por experiencia y 3 como mínimo.» El techo ya
   * lo contaba el motor; el piso quedaba en manos de que el modelo se acordara
   * de devolver `ADD`, guiado por un renglón del prompt. Un prompt es una
   * petición, no un contrato: un puesto con una sola viñeta podía pasar sin que
   * nadie lo señalara. Los dos umbrales los cuenta ahora el mismo bucle.
   *
   * LO QUE EL CÓDIGO NO INVENTA: el hecho. La pregunta se arma con una
   * responsabilidad que LA VACANTE enuncia y que este puesto todavía no
   * menciona — citarla y preguntar no afirma nada sobre la persona. El usuario
   * confirma, y recién ahí el modelo redacta.
   */
  for (const role of tree.roles) {
    if (role.bullets.length >= BULLETS_PER_ROLE_MIN) continue
    if (role.bullets.some((b) => conVeredicto.has(b.id))) continue
    const ancla = role.bullets[0]
    if (!ancla) continue
    const dicho = role.bullets.map((b) => normalize(b.text)).join(" ")
    const tema = spec.responsibilities.find((r) => {
      const palabras = normalize(r).split(" ").filter((w) => w.length >= 4)
      return palabras.length > 0 && !palabras.every((w) => dicho.includes(w))
    })
    if (!tema) continue
    decisions.push({
      bulletId: ancla.id,
      verdict: "ADD",
      reason:
        input.language === "en"
          ? `This role has ${role.bullets.length} of the ${BULLETS_PER_ROLE_MIN} bullets it needs to be understood.`
          : `Este puesto tiene ${role.bullets.length} de las ${BULLETS_PER_ROLE_MIN} viñetas que necesita para entenderse.`,
      relevance: 0.5,
      proposedTopic: tema,
      needsUserConfirm:
        input.language === "en"
          ? `The posting asks for this. Did you do it in this role? — "${tema}"`
          : `La vacante pide esto. ¿Lo hiciste en este puesto? — «${tema}»`,
      mergeWith: null,
    })
    conVeredicto.add(ancla.id)
  }

  for (const role of tree.roles) {
    const sobran = role.bullets.length - BULLETS_PER_ROLE_MAX
    if (sobran <= 0) continue
    const candidatas = role.bullets.filter((b) => !conVeredicto.has(b.id))
    // La más débil primero: la que menos términos del aviso dice y más corta es
    // — la misma señal con la que el motor elige dónde aterrizar un requisito.
    const porDebilidad = [...candidatas].sort((a, b) => peso(a.text, index) - peso(b.text, index))
    for (const b of porDebilidad.slice(0, sobran)) {
      decisions.push({
        bulletId: b.id,
        verdict: "DROP",
        reason:
          input.language === "en"
            ? `This role has ${role.bullets.length} bullets and ${BULLETS_PER_ROLE_MAX} get read: this is the weakest of the block.`
            : `Este puesto tiene ${role.bullets.length} viñetas y se leen ${BULLETS_PER_ROLE_MAX}: ésta es la más débil del bloque.`,
        relevance: 0,
        proposedTopic: null,
        needsUserConfirm: null,
        mergeWith: null,
      })
      conVeredicto.add(b.id)
    }
  }

  yield { act: "triage", decisions, budget: budget.perRole }

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
        // no reescribiendo una línea: la tarjeta lo dice y no ofrece botón.
        remedy: "rewrite",
        merged: ["parse_risk"],
        nodeId: tree.summary.id,
        nodeText: nombre,
        nodeHash: nodeHash(nombre),
        gain: gainOf(score, "checks"),
        detail: nombre,
      })
    }
  }

  /**
   * El triage manda sobre la línea.
   *
   * KEEP significa "no la toques" y DROP significa "se va": pedir una mejora
   * sobre cualquiera de las dos es contradecirse en la misma pantalla. Los
   * hallazgos que NO son de una viñeta —un requisito que falta, el resumen, la
   * lectura del documento— no los toca esta regla: no hay veredicto sobre ellos.
   */
  /**
   * UN VEREDICTO SOBRE LA LÍNEA CIERRA LA LÍNEA. LOS CUATRO.
   *
   * Estaban sólo KEEP y DROP. DEMOTE dice «se comprime» y REPLACE dice «ésta es
   * la más débil, la vacante exige otra cosa» — y aun así la línea seguía
   * recibiendo tarjetas pidiendo METERLE contenido: tejé esta blanda, agregá el
   * método que falta. Agrandar lo que el tablero manda achicar o reemplazar.
   *
   * REWRITE es el único que NO cierra, y es correcto: «relevante pero floja» es
   * exactamente la puerta que las tarjetas abren.
   */
  const CIERRAN: Verdict[] = ["KEEP", "DROP", "DEMOTE", "REPLACE"]
  const cerradas = new Set(decisions.filter((d) => CIERRAN.includes(d.verdict)).map((d) => d.bulletId))
  const vigentes = all.filter((f) => !cerradas.has(f.nodeId))

  const seen = loyalty(vigentes, log)
  yield { act: "findings", findings: seen.shown, suppressed: seen.suppressed.length, regressed: seen.regressed, resolved: log }

  return telemetry
}

/** Los términos en juego: los que la vacante nombra y los que el CV declara. */
export function termsOf(spec: JobSpec, tree: ResumeTree): TermVariants[] {
  const out: TermVariants[] = []
  for (const r of [...spec.mustHave, ...spec.niceToHave]) {
    out.push({ canonical: r.skill, variants: [r.raw] })
  }
  for (const s of tree.declaredSkills) {
    if (!out.some((o) => normalize(o.canonical) === normalize(s))) out.push({ canonical: s, variants: [] })
  }
  return out
}

/**
 * LA HUELLA DEL CV, Y CUBRE TODO LO QUE LA AUDITORÍA MIRA.
 *
 * Es la clave de las dos capas que preguntan por el documento entero: la
 * auditoría (P2) y el triage (P3). La regla que gobierna las claves de este
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
   * EL PUESTO AL QUE SE AGREGA UNA LÍNEA NUEVA.
   *
   * Es el único camino que no parte de una línea del CV, y por eso es el único
   * que exige un hecho del usuario ANTES de pedir nada: `focus` trae el tema que
   * él confirmó, y ese tema es el «original» contra el que se juzga todo. El
   * modelo redacta lo que la persona ya dijo que hizo; no lo inventa.
   */
  addToRole?: string
  /**
   * LA OTRA LÍNEA DE UNA FUSIÓN. Cambia QUÉ no se puede perder.
   *
   * Una fusión escribe UNA línea que tiene que conservar lo que decían LAS DOS.
   * Sin esto, `drops_content` juzga contra la primera y sola: la mitad de la
   * información de la segunda se podría caer sin que nada la reclame — y la
   * segunda se BORRA al aplicar, así que ese dato no vuelve de ningún lado.
   */
  mergeWith?: NodeId
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
   * `nodeId` ancla el veredicto en una línea que existe —para saber a qué puesto
   * pertenece— pero lo que se va a escribir no reemplaza a nadie. El hecho lo
   * puso el usuario al confirmar el tema, y ese tema hace de original: es contra
   * lo que los guards juzgan que la redacción no se lleve ni agregue nada.
   */
  const agregando = Boolean(req.addToRole)
  const node = findNode(req.tree, req.nodeId)
  if (!node && !agregando) return { ok: false, verdict: { ok: false, reason: "stale", detail: req.nodeId }, calls: 0 }
  if (agregando && !req.focus?.trim()) {
    return { ok: false, verdict: { ok: false, reason: "empty", detail: "una línea nueva necesita el tema que el usuario confirmó" }, calls: 0 }
  }

  const isSummary = !agregando && req.nodeId === req.tree.summary.id
  const sig = ledgerSignature(req.ledger)
  /** Al agregar no hay línea previa: el ancla del caché es el tema confirmado. */
  const hashBase = node?.hash ?? nodeHash(req.focus ?? "")
  const key = cacheKey.fix(
    req.nodeId, hashBase, req.jdKey, sig, req.model,
    `${req.focus ?? ""}|${req.mergeWith ?? ""}|${req.addToRole ?? ""}`,
  )

  // La línea que se reemplaza suelta su propia apertura: si no, choca consigo
  // misma y el modelo elige un verbo peor para esquivar un conflicto inexistente.
  // Al agregar no hay ninguna que soltar.
  const ledger = node ? releaseOpener(req.ledger, node.text) : req.ledger
  /**
   * EN UNA FUSIÓN, EL ORIGINAL SON LAS DOS LÍNEAS.
   *
   * Es lo único que hace segura la fusión: el resultado se juzga contra todo lo
   * que había, así que si se come un dato de cualquiera de las dos, el guard lo
   * caza. La que se fusiona se borra al aplicar; lo que se pierda acá no vuelve.
   */
  const otra = !agregando && req.mergeWith ? findNode(req.tree, req.mergeWith) : null
  /**
   * QUÉ NO SE PUEDE PERDER, según el caso:
   *   reescribir  → la línea que reemplaza
   *   fusionar    → las dos, porque una se borra
   *   agregar     → el TEMA que el usuario confirmó, porque es el único hecho
   *                 que hay: la línea todavía no existe.
   */
  const original = agregando ? (req.focus as string) : otra ? `${node!.text} ${otra.text}` : node!.text
  const ctx = {
    original,
    /**
     * Lo que se pierde si no entra: las dos líneas de una fusión, o el tema que
     * el usuario confirmó al agregar. En una reescritura normal no hay nada que
     * desaparezca, así que no va.
     */
    mustKeep: agregando ? [original] : otra ? [node!.text, otra.text] : undefined,
    index: req.index,
    ledger,
    isSummary,
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
      .filter((b) => b.id !== req.nodeId && b.id !== req.mergeWith)
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
  const cached = (await req.store.read("ats3-fix", key)) as Suggestion | null
  if (cached && checkSuggestion(cached, ctx).ok) {
    return { ok: true, suggestion: anchor(cached, hashBase, original, req.mergeWith, req.addToRole), served: true, calls: 0 }
  }
  const ask = (nudge?: string) =>
    isSummary
      ? req.ai.rewriteSummary({
          current: node!.text,
          spec: req.spec,
          topBullets: topBulletsOf(req.tree),
          ledger,
          declaredSkills: req.tree.declaredSkills,
          nudge,
        })
      : req.ai.rewriteBullet({
          original,
          mergeOf: otra ? [node!.text, otra.text] : undefined,
          bulletId: req.nodeId,
          roleContext: roleContextOf(req.tree, req.nodeId),
          spec: req.spec,
          ledger,
          declaredSkills: req.tree.declaredSkills,
          focus: req.focus,
          /**
           * LAS OTRAS LÍNEAS DEL PUESTO, para que no repita ninguna.
           *
           * El guard rechaza una reescritura calcada a otra viñeta, y hasta hoy
           * el modelo nunca las había visto: se lo castigaba por repetir algo
           * que nadie le mostró. Prevenir en la fuente cuesta cero tokens.
           */
          // La otra línea de la fusión NO entra: se va a borrar, así que "repetirla"
          // es exactamente lo que se le está pidiendo.
          siblings: req.tree.roles
            .flatMap((r) => r.bullets)
            .filter((b) => b.id !== req.nodeId && b.id !== req.mergeWith)
            .map((b) => b.text),
          nudge,
        })

  /**
   * EL TECHO DE ESTE CAMINO SON TRES LLAMADAS, Y LA CUOTA SE COBRA UNA.
   *
   * La propuesta (1), el reintento por declinar contradiciendo lo que el propio
   * modelo declaró (2), y el reintento por prometer una cifra y no ofrecer el
   * hueco (3). El reintento por guard comparte ranura con el primero de esos
   * dos, así que ninguna corrida los suma todos.
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
  if (!first.changed) {
    const ejes = first.declineBasis
    // Sin declaración tampoco se le cree: el prompt la pide justamente cuando
    // declina, y omitirla es la forma más barata de saltarse la vara.
    const falta = ejes
      ? [!ejes.hasActionVerb && "verbo", !ejes.hasResult && "resultado", !ejes.hasMethod && "método"].filter(Boolean)
      : ["la declaración de los tres ejes"]
    if (falta.length === 0) return { ok: false, alreadyGood: true, calls }
    first = await ask(
      req.language === "en"
        ? `You declined, yet you declared this line lacks: ${falta.join(", ")}. A line missing any of the three has something to fix — rewrite it, keeping strictly to what the original says.`
        : `Declinaste, pero declaraste que a esta línea le falta: ${falta.join(", ")}. Una línea a la que le falta cualquiera de los tres TIENE algo que arreglar — reescribila, ciñéndote a lo que el original dice.`,
    )
    calls++
    if (!first.changed) return { ok: false, alreadyGood: true, calls }
  }

  /**
   * LA TERCERA PERSONA REGULAR SE CORRIGE, NO SE RECHAZA.
   *
   * «Atendió a los clientes» costaba la reescritura entera y la ranura de cuota
   * por una letra que el código sabe conjugar. Se arregla acá, antes de juzgar;
   * lo que el código NO puede probar —un irregular, un sustantivo— sigue cayendo
   * en el guard, que es la respuesta honesta.
   */
  if (req.language !== "en") {
    const enPrimera = toFirstPerson(first.text)
    if (enPrimera) first = { ...first, text: enPrimera }
  }

  let verdict = checkSuggestion(first, ctx)

  if (!verdict.ok) {
    first = await ask(retryNudge(verdict, req.language))
    calls++
    if (!first.changed) return { ok: false, alreadyGood: true, calls }
    verdict = checkSuggestion(first, ctx)
  }
  if (!verdict.ok) return { ok: false, verdict, calls }

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
    if (segunda.changed && segunda.placeholders.length > 0 && checkSuggestion(segunda, ctx).ok) {
      first = segunda
    }
  }

  await req.store.write("ats3-fix", key, first)
  return { ok: true, suggestion: anchor(first, hashBase, original, req.mergeWith, req.addToRole), served: false, calls }
}

function anchor(s: Suggestion, hash: string, originalText: string, mergedFrom?: NodeId, addToRole?: string): AnchoredSuggestion {
  return { ...s, basedOnHash: hash, originalText, mergedFrom, addToRole }
}

function roleContextOf(tree: ResumeTree, nodeId: NodeId): string {
  const role = tree.roles.find((r) => r.bullets.some((b) => b.id === nodeId))
  return role ? `${role.title} — ${role.company}` : ""
}

function topBulletsOf(tree: ResumeTree): string[] {
  return tree.roles
    .flatMap((r) => r.bullets.map((b) => b.text))
    .filter(statesQuantity)
    .slice(0, 3)
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
  /**
   * UNA LÍNEA NUEVA NO PUEDE ESTAR OBSOLETA: no existía cuando se pensó.
   *
   * El control de obsolescencia compara el hash de la línea con el que tenía al
   * pedir la propuesta, y en un `ADD` no hay línea que comparar. Lo que sí se
   * comprueba es que el puesto siga existiendo: si el usuario lo borró entre
   * pedir y aceptar, no hay dónde escribir.
   */
  if (s.addToRole) {
    if (!tree.roles.some((r) => r.id === s.addToRole)) {
      return { ok: false, tree, ledger, delta: 0, reason: { ok: false, reason: "stale", detail: s.addToRole } }
    }
  } else if (isStale(s.basedOnHash, s.bulletId, tree)) {
    return { ok: false, tree, ledger, delta: 0, reason: { ok: false, reason: "stale", detail: s.bulletId } }
  }

  const before = scoreResume(tree, spec, audit, checks, termWeights)
  /**
   * UNA FUSIÓN ES UN SOLO ACTO: se escribe la línea y se va la otra.
   *
   * Si se escribiera la fusionada y la absorbida quedara en pie, el CV termina
   * con el mismo trabajo contado dos veces — justo lo que la fusión venía a
   * arreglar—, y el puntaje mediría un documento que nadie va a tener. Se hace
   * sobre la COPIA, como todo acá: si algo falla, el CV del usuario no se tocó.
   */
  const conTexto = s.addToRole ? appendBullet(tree, s.addToRole, s.text) : writeInto(tree, s.bulletId, s.text)
  const copy = s.mergedFrom ? removeNode(conTexto, s.mergedFrom) : conTexto
  const after = scoreResume(copy, spec, audit, checks, termWeights)

  return {
    ok: true,
    tree: copy,
    ledger: afterAccept(ledger, s),
    delta: deltaOf(before, after),
  }
}

/**
 * Agrega una viñeta al final de un puesto, devolviendo un árbol NUEVO.
 *
 * Al final y no al principio: el orden de las viñetas lo eligió el usuario, y
 * meter una línea nueva arriba de las suyas es reordenarle el CV sin permiso.
 * Su id sale del mismo `bulletIdFor` que todas —del puesto y del texto—, así
 * que el registro de lo resuelto y los hallazgos la nombran igual que a
 * cualquier otra.
 */
export function appendBullet(tree: ResumeTree, roleId: string, text: string): ResumeTree {
  return {
    ...tree,
    roles: tree.roles.map((r) =>
      r.id !== roleId
        ? r
        : {
            ...r,
            bullets: [
              ...r.bullets,
              { id: bulletIdFor(r.id, text, new Set(r.bullets.map((b) => b.id))), text, hash: nodeHash(text), origin: "AI_ACCEPTED" as const },
            ],
          },
    ),
  }
}

/**
 * Saca una viñeta devolviendo un árbol NUEVO. El resumen no se puede sacar.
 *
 * Vive acá, al lado de `writeInto`, porque es la otra mitad del mismo acto: la
 * fusión escribe una línea y retira la otra, y las dos tienen que pasar por la
 * copia antes de tocar nada.
 */
export function removeNode(tree: ResumeTree, nodeId: NodeId): ResumeTree {
  if (nodeId === tree.summary.id) return tree
  return { ...tree, roles: tree.roles.map((r) => ({ ...r, bullets: r.bullets.filter((b) => b.id !== nodeId) })) }
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
