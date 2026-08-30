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
  type Resolution,
  type ResumeTree,
  type Suggestion,
  type TermIndex,
  type TermVariants,
  type TriageDecision,
} from "@/lib/ats3/contracts"
import { afterAccept, ledgerSignature, openLedger, releaseOpener, spaceBudget, type Ledger } from "@/lib/ats3/ledger"
import { checkSuggestion, findNode, isStale, loyalty, retryNudge, type GuardVerdict } from "@/lib/ats3/guards"
import { deltaOf, gainOf, postingWeights, scoreResume, statesQuantity, type AuditFacts, type ComponentKey, type ParseChecks, type Score } from "@/lib/ats3/score"

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
  verify(original: string, rewritten: string, declared: string[]): Promise<{ pass: boolean; reason: string }>
}

export interface RewriteInput {
  original: string
  bulletId: NodeId
  roleContext: string
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
  fix: (nodeId: NodeId, nodeHashValue: string, jdHash: string, ledgerSig: string, model: string) =>
    sha256(nodeId, nodeHashValue, jdHash, ledgerSig, PROMPT_VERSION.P4, model),

  /** El registro de lo resuelto, por CV y vacante. */
  log: (resumeId: string, jdHash: string) => sha256(resumeId, jdHash),
}

// ─────────────────────────────────────────────────────────────────────────────
// LOS HALLAZGOS DETERMINISTAS
//
// Los emite el código, no el modelo, y cada uno trae su ganancia calculada por
// `score.ts`. Un hallazgo sin ganancia medida es una opinión.
// ─────────────────────────────────────────────────────────────────────────────

export function findingsOf(tree: ResumeTree, spec: JobSpec, audit: AuditFacts, score: Score, index: TermIndex): Finding[] {
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
     * Con sujeto propio, cada término tiene su tarjeta y su botón.
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
    const clave = subject ? `${nodeId}:${subject}` : nodeId
    const existing = out.find((f) => (f.subject ? `${f.nodeId}:${f.subject}` : f.nodeId) === clave)
    if (existing) {
      existing.detail = existing.detail ? `${existing.detail}${DETAIL_SEPARATOR}${detail}` : detail
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

  /** El sujeto que agrupa a los requisitos entre sí. Ver el bloque de abajo. */
  const REQUIREMENTS = "requisitos"

  // Lo que la vacante exige y el CV no demuestra. Es la palanca más grande del
  // puntaje, y en el motor viejo vivía fuera del ejecutor, como filas de tabla.
  for (const c of audit.coverage) {
    if (c.status === "FOUND") continue
    const key = c.requirement === "MUST" ? "must" : "nice"
    const target = bestHomeFor(tree, c.skill, index)
    /**
     * SU PROPIA TARJETA, Y NO LA DE LA VIÑETA DONDE ATERRIZA.
     *
     * Sin sujeto, la clave de fusión es la LÍNEA: el requisito caía dentro de la
     * tarjeta que esa viñeta ya tenía por su verbo o su cifra, y con ella se
     * perdían las dos cosas que lo hacen accionable — su título («faltan N
     * requisitos») y su sección, porque el que llega primero fija el componente.
     * Reportado con captura: el panel decía «faltan 8 habilidades duras» y en
     * Tailor no había NI UNA tarjeta de habilidades; el término aparecía
     * escondido como detalle de otra cosa, «verbo · TestFlight».
     *
     * El sujeto es COMPARTIDO por todos los requisitos de la misma línea, no el
     * término: así se agrupan entre ellos —una sola reescritura los aterriza a
     * todos— y no se mezclan con lo que se dice DE la línea.
     */
    push("missing_requirement", key, target, textOf(tree, target), gainOf(score, key), c.skill, "rewrite", REQUIREMENTS)
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
    push("buried_term", "must", arriba, textOf(tree, arriba), 0, c.skill, "weave", c.skill)
  }

  /**
   * LO QUE EL CV DEMUESTRA Y NO DICE EN HABILIDADES.
   *
   * El filtro lee esa sección literalmente y es de lo primero que mira. Un
   * término que la persona prueba en una viñeta y no figura en su lista existe
   * para el lector humano y no para el automático. Determinista y sin tokens:
   * el índice de términos ya sabe reconocerlo, y las habilidades declaradas
   * están en el árbol.
   */
  const enLista = new Set<string>()
  for (const s of tree.declaredSkills) for (const t of termsIn(index, s)) enLista.add(normalize(t))
  for (const c of audit.coverage) {
    /**
     * FOUND e IMPLIED, las dos.
     *
     * FOUND es "lo dice con palabras que un lector literal reconoce"; IMPLIED es
     * "el trabajo lo demuestra pero el CV no lo NOMBRA". El segundo es el caso
     * que más pierde: la persona lo hace, el filtro no lo ve, y escribir el
     * término en Habilidades es exactamente lo que lo arregla. Lo que NO se
     * ofrece es un requisito NOT_FOUND: agregar una habilidad que no tiene es
     * mentir en su CV.
     */
    if ((c.status !== "FOUND" && c.status !== "IMPLIED") || !c.evidenceNodeId) continue
    if (enLista.has(normalize(c.skill))) continue
    // Lo cierra AGREGARLO A LA LISTA, no reescribir la viñeta que ya lo prueba.
    push("skill_not_listed", "must", c.evidenceNodeId, textOf(tree, c.evidenceNodeId), 0, c.skill, "add_skill", c.skill)
  }

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
    push("soft_not_shown", "xyz", donde, textOf(tree, donde), 0, s.signal, "weave", s.signal)
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

  void spec
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

  let best: { id: NodeId; score: number } | null = null
  for (const role of tree.roles) {
    for (const b of role.bullets) {
      const texto = normalize(b.text).split(" ")
      // Lo que decide: cuántas palabras del requisito ya viven en esta línea.
      const afinidad = palabras.filter((p) => texto.some((t) => sameRoot(p, t))).length
      // Desempates, en orden de importancia y siempre por debajo de la afinidad.
      const yaTieneTerminos = termsIn(index, b.text).size * 0.01
      const esCorta = 1 / Math.max(6, texto.length) * 0.001
      const s = afinidad + yaTieneTerminos + esCorta
      if (!best || s > best.score) best = { id: b.id, score: s }
    }
  }
  return best?.id ?? tree.summary.id
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
  | { act: "findings"; findings: Finding[]; suppressed: number; regressed: Finding[] }
  | { act: "triage"; decisions: TriageDecision[]; budget: Record<NodeId, number> }

export interface AnalysisInput {
  raw: RawResume
  jdText: string
  language: "es" | "en"
  resumeId: string
  model: string
  checks: ParseChecks
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

  // ── acto 1: el puntaje, que no cuesta una sola llamada ────────────────────
  //
  // Lo que el motor puede medir solo, MÁS lo que el cliente haya medido sobre el
  // documento renderizado. El cliente gana: si midió el PDF de verdad, esa
  // medición vale más que una derivada de los datos.
  const checks = { ...readableChecks(tree), ...input.checks }
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
  yield { act: "triage", decisions, budget: budget.perRole }

  // ── los hallazgos, filtrados por lo que el usuario ya resolvió ────────────
  const log = ((await input.store.read("ats3-log", cacheKey.log(input.resumeId, jdKey))) as Resolution[] | null) ?? []
  const all = findingsOf(tree, spec, audit, score, index)
  for (const [nombre, ok] of Object.entries(checks)) {
    // Un chequeo que falla y no genera hallazgo es un punto perdido que el
    // usuario no puede recuperar porque nadie le dijo qué arreglar.
    if (ok === false) {
      all.push({
        id: findingId(tree.summary.id, "parse_risk"),
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
  const cerradas = new Set(decisions.filter((d) => d.verdict === "KEEP" || d.verdict === "DROP").map((d) => d.bulletId))
  const vigentes = all.filter((f) => !cerradas.has(f.nodeId))

  const seen = loyalty(vigentes, log)
  yield { act: "findings", findings: seen.shown, suppressed: seen.suppressed.length, regressed: seen.regressed }

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

function treeHash(tree: ResumeTree): string {
  return sha256(...tree.roles.flatMap((r) => r.bullets.map((b) => b.hash)), tree.summary.hash).slice(0, 16)
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
  const node = findNode(req.tree, req.nodeId)
  if (!node) return { ok: false, verdict: { ok: false, reason: "stale", detail: req.nodeId }, calls: 0 }

  const isSummary = req.nodeId === req.tree.summary.id
  const sig = ledgerSignature(req.ledger)
  const key = cacheKey.fix(req.nodeId, node.hash, req.jdKey, sig, req.model)

  // La línea que se reemplaza suelta su propia apertura: si no, choca consigo
  // misma y el modelo elige un verbo peor para esquivar un conflicto inexistente.
  const ledger = releaseOpener(req.ledger, node.text)
  const ctx = {
    original: node.text,
    index: req.index,
    declared: req.tree.declaredSkills,
    ledger,
    isSummary,
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
    return { ok: true, suggestion: anchor(cached, node.hash, node.text, 0), served: true, calls: 0 }
  }
  const ask = (nudge?: string) =>
    isSummary
      ? req.ai.rewriteSummary({
          current: node.text,
          spec: req.spec,
          topBullets: topBulletsOf(req.tree),
          ledger,
          declaredSkills: req.tree.declaredSkills,
          nudge,
        })
      : req.ai.rewriteBullet({
          original: node.text,
          bulletId: req.nodeId,
          roleContext: roleContextOf(req.tree, req.nodeId),
          spec: req.spec,
          ledger,
          declaredSkills: req.tree.declaredSkills,
          nudge,
        })

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

  let verdict = checkSuggestion(first, ctx)

  if (!verdict.ok) {
    first = await ask(retryNudge(verdict, req.language))
    calls++
    if (!first.changed) return { ok: false, alreadyGood: true, calls }
    verdict = checkSuggestion(first, ctx)
  }
  if (!verdict.ok) return { ok: false, verdict, calls }

  // El validador del modelo corre AL FINAL y sólo puede rechazar: nunca aprueba
  // algo que los guards rechazaron. Si discrepan, gana el código.
  const check = await req.ai.verify(node.text, first.text, req.tree.declaredSkills)
  calls++
  if (!check.pass) {
    return { ok: false, verdict: { ok: false, reason: "invented_term", detail: check.reason }, calls }
  }

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
  const yaTieneCifra = /\d/.test(node.text)
  if (prometeTamano && first.placeholders.length === 0 && !yaTieneCifra) {
    const segunda = await ask(
      req.language === "en"
        ? `You wrote that this work can be measured in "${first.measurableAspect}" and then offered no slot for it. Add the typed slot with its believable range for this trade — or set measurableAspect to null if there is truly nothing to measure.`
        : `Escribiste que este trabajo se mide en "${first.measurableAspect}" y después no ofreciste el hueco. Agregá el hueco tipado con su rango creíble para este oficio — o poné measurableAspect en null si de verdad no hay nada que medir.`,
    )
    calls++
    if (segunda.changed && segunda.placeholders.length > 0 && checkSuggestion(segunda, ctx).ok) {
      const revisada = await req.ai.verify(node.text, segunda.text, req.tree.declaredSkills)
      calls++
      if (revisada.pass) first = segunda
    }
  }

  await req.store.write("ats3-fix", key, first)
  return { ok: true, suggestion: anchor(first, node.hash, node.text, 0), served: false, calls }
}

function anchor(s: Suggestion, hash: string, originalText: string, delta: number): AnchoredSuggestion {
  return { ...s, basedOnHash: hash, originalText, delta }
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
  resolution?: Resolution
}

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
): ApplyResult {
  if (isStale(s.basedOnHash, s.bulletId, tree)) {
    return { ok: false, tree, ledger, delta: 0, reason: { ok: false, reason: "stale", detail: s.bulletId } }
  }

  const before = scoreResume(tree, spec, audit, checks)
  const copy = writeInto(tree, s.bulletId, s.text)
  const after = scoreResume(copy, spec, audit, checks)

  return {
    ok: true,
    tree: copy,
    ledger: afterAccept(ledger, s),
    delta: deltaOf(before, after),
    resolution: {
      findingId: findingId(s.bulletId, "no_result"),
      nodeId: s.bulletId,
      nodeHashAtResolution: nodeHash(s.text),
      resolvedBy: "AI_SUGGESTION",
      resolvedAt: new Date().toISOString(),
    },
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
