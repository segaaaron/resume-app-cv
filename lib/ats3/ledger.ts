// lib/ats3/ledger.ts
//
// LA MEMORIA ENTRE VIÑETAS, y el presupuesto de espacio.
//
// ── EL PROBLEMA QUE RESUELVE, QUE NINGÚN GUARD DEL MOTOR VIEJO MIRABA ───────
// Cada llamada de reescritura ve UNA viñeta. Aislada, cada respuesta es
// correcta. Juntas, el CV termina con seis líneas que abren con "Lideré", la
// misma tecnología nombrada nueve veces y el mismo logro contado en dos puestos.
// Es el choque que un reclutador humano detecta en cinco segundos y el único que
// el aislamiento atómico no previene: lo CAUSA.
//
// El ledger es un acumulador que viaja en cada llamada y se actualiza después de
// cada sugerencia aceptada. Es la única forma de darle memoria a un modelo que
// mira por una rendija.
//
// ── LO QUE ACÁ NO HAY ───────────────────────────────────────────────────────
// Ninguna lista de verbos, de tecnologías ni de oficios. El ledger no sabe qué
// es un verbo "fuerte": sabe cuáles YA SE USARON en este CV, que es un dato del
// documento, no una opinión sobre el idioma. Por eso funciona igual para un
// tornero que para un anestesista.
//
// ── UNA COSA DEL DOCUMENTO v3 QUE NO ENTRA ──────────────────────────────────
// El ledger del PDF lleva `chars_remaining` y el prompt exige viñetas de 140 a
// 220 caracteres. El CEO retiró el techo de largo el 2026-08-19: "cuatro líneas
// largas con información de primera son bienvenidas". El presupuesto acá se mide
// en VIÑETAS —que es espacio real de página— y no en caracteres, que es una vara
// sobre la redacción.

import { normalize, type MetricType, type ResumeTree, type JobSpec, type Suggestion, sha256 } from "@/lib/ats3/contracts"

/**
 * Cuántas veces puede aparecer el mismo término en todo el CV.
 *
 * Más de dos no suma cobertura —el matcher lo cuenta una vez— y sí hace que el
 * texto se lea como relleno. Es una propiedad del documento, no del rubro.
 */
export const KEYWORD_MAX = 2

/**
 * Viñetas útiles que sostiene una página.
 *
 * Se pasa como parámetro con este valor por defecto: un CV de dos páginas es una
 * decisión del usuario, no una constante del motor. Sin un presupuesto, el
 * modelo siempre contesta "mejorá todo" y el CV crece a tres páginas.
 */
export const BULLETS_PER_PAGE = 15

/**
 * VIÑETAS QUE SE LEEN DE UN PUESTO (orden del CEO, 2026-09-09).
 *
 * «Si ves viñetas a mejorar y ya tenés 6, sugerí eliminar la más débil.» Seis es
 * lo que un reclutador lee de un mismo puesto antes de saltear; a partir de ahí,
 * una línea más no agrega, TAPA a las que valen.
 *
 * Es un techo del documento, no del rubro: el mismo número que el producto ya
 * usaba antes de v3.
 */
export const BULLETS_PER_ROLE_MAX = 6

/**
 * HABILIDADES QUE ENTRAN A LA PLANTILLA (orden del CEO, 2026-09-09).
 *
 * «Las plantillas con ATS pueden recibir hasta 20 skills; si tenés 100, sólo las
 * necesarias entran.» Es el mismo 20 que el CEO fijó el 2026-08-27 para los
 * requisitos duros que el motor mide, y por eso no es un número nuevo: una lista
 * de cien términos no se lee, y el filtro tampoco la premia — cuenta cada uno
 * una vez.
 *
 * Cuáles son «las necesarias» lo decide `skillPlan`, con los pesos medidos sobre
 * el aviso. Sin vacante no hay respuesta, y por eso este tope NO vive en la
 * plantilla: ahí sería «las primeras veinte que escribiste».
 */
export const SKILLS_MAX = 20

export interface Ledger {
  /** Aperturas ya gastadas, normalizadas. Ninguna se repite. */
  verbsUsed: string[]
  /** Término canónico → cuánto queda. `priority` = la vacante lo exige y el CV
   *  todavía no lo demuestra: es donde conviene gastar el presupuesto. */
  keywordBudget: Record<string, { max: number; used: number; priority: boolean }>
  metricTypesUsed: MetricType[]
  /** Los logros ya atribuidos. Un resultado no puede tener dos dueños. */
  claimsMade: string[]
  bulletsRemaining: number
}

/**
 * El ledger al empezar: lo que el CV YA gastó antes de que el motor toque nada.
 *
 * Arrancar en cero sería mentira — las viñetas que no se reescriben siguen en el
 * documento y siguen ocupando sus verbos y sus términos.
 */
export function openLedger(
  tree: ResumeTree,
  spec: JobSpec,
  covered: Set<string>,
  budget: number = BULLETS_PER_PAGE,
): Ledger {
  const texts = tree.roles.flatMap((r) => r.bullets.map((b) => b.text))
  const keywordBudget: Ledger["keywordBudget"] = {}
  /**
   * EL ORDEN DE LA VACANTE ES UNA DECISIÓN, Y SE RESPETA.
   *
   * P1 devuelve las listas ordenadas por peso real —lo que el aviso repite y lo
   * que enuncia al abrir pesa más—. Acá eso se conserva: `priority` marca lo que
   * la vacante exige y el CV todavía no demuestra, y el presupuesto se recorre
   * en ese orden, así que el primer término que se teje es el que más pesa. Un
   * `Record` conserva el orden de inserción para claves de texto, que es lo que
   * hace que esto no necesite un campo aparte.
   */
  for (const req of [...spec.mustHave, ...spec.niceToHave]) {
    keywordBudget[req.skill] = {
      max: KEYWORD_MAX,
      used: countMentions(texts, req.skill, req.raw),
      priority: !covered.has(req.skill),
    }
  }
  return {
    verbsUsed: openersOf(texts),
    keywordBudget,
    metricTypesUsed: [],
    claimsMade: [],
    bulletsRemaining: budget,
  }
}

/**
 * El ledger después de aceptar una sugerencia. Puro: devuelve uno nuevo.
 *
 * Que sea puro no es estética. El motor puntúa sobre una COPIA antes de
 * promover el cambio, y con un ledger mutable esa copia contaminaría el estado
 * real aunque el parche terminara rechazado.
 */
export function afterAccept(ledger: Ledger, s: Suggestion): Ledger {
  const verb = normalize(s.actionVerb).split(" ")[0]
  const budget = { ...ledger.keywordBudget }
  for (const k of s.keywordsUsed) {
    const slot = budget[k]
    if (slot) budget[k] = { ...slot, used: slot.used + 1, priority: false }
  }
  return {
    verbsUsed: verb && !ledger.verbsUsed.includes(verb) ? [...ledger.verbsUsed, verb] : ledger.verbsUsed,
    keywordBudget: budget,
    metricTypesUsed: s.metricType ? [...ledger.metricTypesUsed, s.metricType] : ledger.metricTypesUsed,
    claimsMade: s.claim ? [...ledger.claimsMade, s.claim] : ledger.claimsMade,
    bulletsRemaining: Math.max(0, ledger.bulletsRemaining - 1),
  }
}

/**
 * La firma del ledger, que entra en la clave de caché de una reescritura.
 *
 * Sin ella, la sugerencia guardada para la viñeta 5 se serviría igual aunque el
 * usuario haya aceptado antes otra que gastó ese mismo verbo — y volvería a
 * proponer el verbo que ya no está disponible.
 */
export function ledgerSignature(l: Ledger): string {
  const kw = Object.entries(l.keywordBudget)
    .map(([k, v]) => `${k}:${v.used}`)
    .sort()
    .join(",")
  /**
   * LOS LOGROS YA ATRIBUIDOS ENTRAN EN LA FIRMA, y faltaban.
   *
   * Una reescritura servida del caché NO vuelve a pasar por los guards: se
   * guardó ya aprobada. Con los `claimsMade` fuera de la clave, dos estados que
   * sólo se diferencian en qué logros están tomados compartían entrada, así que
   * al aceptar una línea que se atribuye un resultado, la siguiente podía
   * servirse desde el caché atribuyéndose EL MISMO — que es exactamente lo que
   * `duplicate_claim` existe para impedir, esquivado por la puerta de atrás.
   */
  const claims = [...l.claimsMade].map(normalize).sort().join(",")
  return sha256([...l.verbsUsed].sort().join(","), kw, l.metricTypesUsed.join(","), claims, String(l.bulletsRemaining)).slice(0, 16)
}

// ─────────────────────────────────────────────────────────────────────────────
// LAS CUATRO PREGUNTAS DEL LEDGER
//
// Devuelven el MOTIVO, no un booleano. Un guard que rechaza en silencio
// convierte el reintento en una segunda moneda tirada: el modelo tiene que
// enterarse de qué falló para poder corregirlo.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve el ledger sin la apertura de la línea que se está por reemplazar.
 *
 * El ledger arranca con los verbos que el CV ya usa, incluido el de la línea que
 * el usuario mandó a reescribir. Al modelo se le manda `verbsAlreadyUsed` con la
 * orden de no repetir ninguno, así que sin soltarlo esa línea choca contra SÍ
 * MISMA: "Atendí a los clientes" no podría volver como "Atendí a 60 clientes por
 * turno" —la mejor reescritura posible— y el modelo fuerza un verbo peor para
 * esquivar un choque que no existe. La línea vieja se va: su verbo queda libre.
 */
export function releaseOpener(l: Ledger, replacedText: string): Ledger {
  const opener = normalize(replacedText).split(" ")[0]
  if (!opener) return l
  return { ...l, verbsUsed: l.verbsUsed.filter((v) => v !== opener) }
}

/** Los tipos de métrica que convendría evitar: ya se usaron dos veces o más. */
export function saturatedMetricTypes(l: Ledger): MetricType[] {
  const count = new Map<MetricType, number>()
  for (const t of l.metricTypesUsed) count.set(t, (count.get(t) ?? 0) + 1)
  return [...count.entries()].filter(([, n]) => n >= 2).map(([t]) => t)
}

// ─────────────────────────────────────────────────────────────────────────────
// EL PRESUPUESTO DE ESPACIO
// ─────────────────────────────────────────────────────────────────────────────

export interface SpaceBudget {
  total: number
  /** Cuántas viñetas merece cada puesto. La suma nunca supera el total. */
  perRole: Record<string, number>
}

/**
 * Reparte el espacio por ANTIGÜEDAD RELATIVA, no por una tabla de años.
 *
 * El PDF fija "el puesto más reciente 4-6, el anterior 3-4, lo de más de 10 años
 * máximo 2". Eso supone una carrera con la forma de la de quien lo escribió. Acá
 * el reparto sale del orden del propio CV: el puesto más reciente pesa más, y
 * cada uno hacia atrás pesa menos, sea una carrera de tres años o de treinta.
 *
 * Si el CV tiene un solo puesto, se lleva todo el presupuesto: partirlo entre
 * puestos que no existen dejaría espacio sin usar.
 */
export function spaceBudget(tree: ResumeTree, total: number = BULLETS_PER_PAGE): SpaceBudget {
  const roles = [...tree.roles].sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
  const perRole: Record<string, number> = {}
  if (roles.length === 0) return { total, perRole }

  // Pesos decrecientes: 1, 1/2, 1/3… Es una curva, no una tabla de años.
  const weights = roles.map((_, i) => 1 / (i + 1))
  const sum = weights.reduce((s, w) => s + w, 0)

  let assigned = 0
  roles.forEach((role, i) => {
    /**
     * ── DOS RESPUESTAS A LA MISMA PREGUNTA, Y SE CONTRADECÍAN ────────────────
     *
     * El reparto por antigüedad le daba al puesto más reciente hasta DIEZ de
     * las quince de la página, mientras `BULLETS_PER_ROLE_MAX` dice que de un
     * mismo puesto se leen SEIS. Con eso, al modelo se le decía «acá caben
     * diez» y el motor proponía sacar de la séptima en adelante: el panel
     * pidiendo agregar y quitar al mismo tiempo.
     *
     * El techo manda y el reparto acomoda lo que queda debajo de él. Al menos
     * una, porque un puesto sin viñetas es un puesto que no se entiende.
     */
    const share = Math.min(BULLETS_PER_ROLE_MAX, Math.max(1, Math.round((weights[i] / sum) * total)))
    perRole[role.id] = share
    assigned += share
  })

  // El redondeo puede pasarse: se descuenta del más viejo hacia atrás, nunca del
  // más reciente, que es el que decide la entrevista.
  for (let i = roles.length - 1; i >= 0 && assigned > total; i--) {
    const id = roles[i].id
    while (perRole[id] > 1 && assigned > total) {
      perRole[id]--
      assigned--
    }
  }
  return { total, perRole }
}

// ─────────────────────────────────────────────────────────────────────────────
// internos
// ─────────────────────────────────────────────────────────────────────────────

function openersOf(texts: string[]): string[] {
  const out: string[] = []
  for (const t of texts) {
    const first = normalize(t).split(" ")[0]
    if (first && !out.includes(first)) out.push(first)
  }
  return out
}

function countMentions(texts: string[], canonical: string, raw: string): number {
  const needles = [normalize(canonical), normalize(raw)].filter(Boolean)
  let n = 0
  for (const t of texts) {
    const hay = ` ${normalize(t)} `
    if (needles.some((needle) => hay.includes(` ${needle} `))) n++
  }
  return n
}

