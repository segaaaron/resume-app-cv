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

import type { Finding, JobSpec } from "@/lib/ats3/contracts"
import { normalize, termKey } from "@/lib/ats3/contracts"
import type { ComponentKey, Score } from "@/lib/ats3/score"

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
export type PanelSectionId = "search" | "hard" | "soft" | "other" | "format" | "tips"

/** Quién cierra el hallazgo: el ejecutor, un arreglo determinista, o el usuario. */
export type PanelOwner = "tailor" | "auto" | "user"

export interface PanelCheck {
  id: string
  section: PanelSectionId
  state: "pass" | "warn" | "crit"
  /** Puntos que mueve. 0 es una respuesta legítima y la fila lo dice en voz alta. */
  weight: number
  titleKey: string
  detailKey?: string
  params?: Record<string, string | number>
  owner: PanelOwner
  /** El botón. Ausente cuando no hay nada que la aplicación pueda hacer sola. */
  action?: { kind: string; targetId?: string; originalText?: string; value?: string }
  /** Qué lo disparó, nombrado: la línea, el requisito, el término. */
  evidence?: string[]
  /** Informa y no se aplica: su salida es saberlo. */
  informational?: boolean
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
  search: ["title"],
  hard: ["must"],
  // El motor v3 lee las blandas de la vacante para poder nombrarlas, y no las
  // puntúa. La sección lo declara y la tarjeta lo dice por escrito.
  soft: [],
  other: ["nice"],
  format: ["checks"],
  tips: ["xyz", "metric", "verbs", "summary"],
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
 * Un hallazgo del motor, dicho como fila de chequeo.
 *
 * `weight` es la ganancia MEDIDA recalculando sobre una copia del CV, no una
 * promesa del modelo: es el mismo número que el dial suma como recuperable, así
 * que el panel no puede prometer puntos que el puntaje no vaya a dar.
 */
export function checkOf(f: Finding): PanelCheck {
  return {
    id: f.id,
    // La sección sale del componente del que el motor sacó la ganancia, no de
    // una lista de tipos escrita a mano acá.
    section: SECTION_OF.get(f.component) ?? "tips",
    state: f.gain >= CRITICAL_GAIN ? "crit" : "warn",
    weight: Number(f.gain.toFixed(1)),
    titleKey: `type_${f.type}`,
    /**
     * POR QUÉ IMPORTA, y sale del TIPO del hallazgo.
     *
     * El campo estaba declarado acá, lo leía la fila del informe y NADIE lo
     * llenaba: una explicación prometida por el tipo y por la pantalla que
     * nunca llegaba. El motor no emite prosa —ni debe—, pero el tipo ya dice
     * exactamente de qué defecto habla, así que la explicación es suya y no de
     * cada hallazgo. `detail` sigue diciendo el caso concreto (qué eje falta,
     * qué término), y viaja aparte en la evidencia.
     */
    detailKey: `type_${f.type}_detail`,
    /**
     * LA PUERTA LA DICE EL MOTOR, NO LA PANTALLA.
     *
     * Antes acá se decidía la acción a ojo y todo terminaba en "reescribí esta
     * línea". Con eso, dos hallazgos prometían algo que su botón no hacía:
     * reescribir la línea de 2015 no la desentierra, y reescribir la viñeta que
     * ya demuestra un término no lo agrega a Habilidades. El motor es el único
     * que ve el CV, la vacante y la auditoría a la vez; el remedio viaja con el
     * hallazgo y acá sólo se traduce a un botón.
     *
     *   add_skill → arreglo determinista, sin modelo ni cuota (`owner: "auto"`)
     *   weave / rewrite → lo escribe el ejecutor (`owner: "tailor"`)
     *
     * TODO HALLAZGO TIENE PUERTA, INCLUIDO EL REQUISITO QUE FALTA.
     *
     * Estaba como `owner: "user"` y sin botón — un cartel que decía «te falta
     * esto» y nada más. Pero el motor YA hizo el trabajo difícil: eligió la
     * viñeta donde ese término encaja mejor y ancló el hallazgo ahí. La puerta
     * existía y estaba tapiada.
     *
     * Se resuelve como todo lo demás: reescribiendo ESA línea, con los guards
     * en el medio. Si el trabajo descrito no sostiene el término, la reescritura
     * se rechaza y el usuario ve por qué — que es la respuesta honesta, no un
     * botón que promete lo que no puede cumplir.
     *
     * Lo que NO se hace, y es decisión: agregarlo suelto a la lista de
     * habilidades. Un término listado sin una línea que lo demuestre es
     * exactamente lo que la auditoría cuenta como "sólo declarado" y vale menos;
     * ofrecerlo como arreglo sería vender un punto que el puntaje no da.
     */
    owner: f.remedy === "add_skill" ? "auto" : "tailor",
    action:
      f.remedy === "add_skill"
        ? { kind: "add_skill", targetId: f.nodeId, value: f.detail }
        : { kind: "rewrite_bullet", targetId: f.nodeId, originalText: f.nodeText },
    /**
     * QUÉ señala el hallazgo, no dónde aterrizó.
     *
     * En un requisito que falta, la evidencia es EL REQUISITO. La línea que el
     * motor eligió como mejor destino es sólo el lugar donde se escribiría, y
     * ponerla acá hacía que la cabecera dijera «lo crítico es: "Atendí a los
     * clientes…"» — el texto de una viñeta presentado como si fuera el defecto.
     * En los demás, la línea SÍ es lo señalado.
     */
    evidence: (f.type === "missing_requirement" ? [f.detail] : [f.nodeText, f.detail])
      .filter((x) => x.trim().length > 0),
  }
}

/** Las seis secciones, con sus hallazgos adentro y su cobertura medida. */
export function sectionsOf(score: Score | null, findings: readonly Finding[]): PanelSection[] {
  const ids = Object.keys(COMPONENTS_OF) as PanelSectionId[]
  const checks = findings.map(checkOf)
  return ids.map((id) => ({
    id,
    // Puntúa la que tiene componentes: es verdad por construcción, no por
    // convención. El campo dice lo que es —si mueve el número— en vez de
    // devolver un identificador con nombre de categoría.
    scored: COMPONENTS_OF[id].length > 0,
    coveragePct: score ? pctOf(score, COMPONENTS_OF[id]) : null,
    checks: checks.filter((c) => c.section === id),
  }))
}

/** Cuántas veces dice este texto ese término. Se cuenta, no se estima. */
function veces(texto: string, termino: string): number {
  const aguja = normalize(termino)
  if (!aguja) return 0
  const hay = ` ${normalize(texto)} `
  let n = 0
  let from = 0
  for (;;) {
    const at = hay.indexOf(` ${aguja} `, from)
    if (at === -1) return n
    n++
    from = at + 1
  }
}

/**
 * La tabla de términos: lo que la vacante pide, a los dos lados.
 *
 * Las cuentas se MIDEN sobre los dos textos que el panel ya tiene en la mano —el
 * aviso pegado y el CV—, no se inventan ni se piden al modelo. Es lo que vuelve
 * la tabla auditable: "lo pide 4 veces, tu CV lo dice 0" se comprueba leyendo.
 */
export function termsOfSpec(
  spec: JobSpec | null,
  covered: readonly string[],
  jdText: string,
  cvText: string,
  /**
   * Lo que la auditoría dictaminó sobre las BLANDAS.
   *
   * Una blanda no se demuestra porque la palabra esté escrita —así se cumple
   * sólo en la lista de adjetivos que el reclutador saltea—, así que su estado
   * no puede salir de contar apariciones como el de las duras. Sale del juicio,
   * con el id del logro que la respalda.
   */
  soft: readonly { signal: string; status: "DEMONSTRATED" | "DECLARED_ONLY" | "ABSENT" }[] = [],
): PanelTerm[] {
  if (!spec) return []
  const demostrados = new Set(covered.map(normalize))
  const filas: PanelTerm[] = []
  const push = (term: string, raw: string, section: PanelTerm["section"]) => {
    /**
     * EL NOMBRE CANÓNICO ES LA IDENTIDAD Y ES LO QUE SE PINTA.
     *
     * `raw` es la redacción con la que el aviso lo enunció, y una sola oración
     * del aviso puede enunciar VARIOS requisitos: medido en producción el
     * 2026-08-30, P1 devolvió Xcode, Instruments y TestFlight —tres requisitos
     * distintos— los tres con el mismo `raw`, "Familiarity with Xcode,
     * Instruments, and TestFlight". La tabla pintaba `raw`, así que mostraba la
     * misma oración tres veces, y el dedup no las veía porque comparaba contra
     * el canónico mientras guardaba la oración. Tres filas idénticas, una tabla
     * ilegible y el usuario sin saber qué habilidad le falta.
     *
     * `raw` sigue sirviendo para CONTAR —el filtro compara cadenas y hay avisos
     * que sólo escriben la forma larga—, pero como respaldo del canónico, no
     * como su reemplazo: contar la oración entera devuelve siempre 1 en el aviso
     * y 0 en el CV, que es una medición sin información.
     */
    const nombre = (term || raw).trim()
    if (!nombre) return
    // Un término no puede estar en dos tablas: entraría dos veces al denominador
    // de la lectura y se leería como si la vacante lo pidiera dos veces. Se
    // compara con `termKey`, la misma llave de igualdad que usa el motor, para
    // que "CI/CD" y "ci-cd" no abran dos filas.
    if (filas.some((f) => termKey(f.term) === termKey(nombre))) return
    const cv = veces(cvText, nombre) || veces(cvText, raw)
    const probado = demostrados.has(normalize(nombre))
    filas.push({
      term: nombre,
      section,
      jd: veces(jdText, nombre) || veces(jdText, raw),
      cv,
      listOnly: cv > 0 && !probado,
      proven: probado,
    })
  }
  // Se defiende de una vacante a medias: la respuesta llega por el stream y una
  // lista ausente NO puede tumbar la pantalla entera con el análisis ya pagado.
  for (const r of spec.mustHave ?? []) push(r.skill, r.raw, "hard")
  for (const r of spec.niceToHave ?? []) push(r.skill, r.raw, "other")
  const juicio = new Map(soft.map((x) => [normalize(x.signal), x.status]))
  for (const s of spec.softSignals ?? []) {
    push(s, s, "soft")
    const fila = filas[filas.length - 1]
    const estado = juicio.get(normalize(s))
    if (fila && estado) {
      fila.proven = estado === "DEMONSTRATED"
      // "Sólo declarada" es exactamente eso: escrita, sin un logro detrás.
      fila.listOnly = estado === "DECLARED_ONLY"
    }
  }
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
export function headlineOf(score: Score | null, sections: readonly PanelSection[]) {
  const críticos = sections.flatMap((s) => s.checks).filter((c) => c.state === "crit")
  const abiertos = sections.flatMap((s) => s.checks)
  const suma = abiertos.reduce((n, c) => n + c.weight, 0)
  return {
    /** Entero: media décima de punto no es una decisión que alguien pueda tomar. */
    score: score ? Math.round(score.total) : 0,
    criticalCount: críticos.length,
    /** De esos, los que el ejecutor sí puede cerrar escribiendo. */
    criticalSolvable: críticos.filter((c) => c.owner === "tailor").length,
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
    detail: críticos
      .filter((c) => c.section === "hard" || c.section === "other")
      .flatMap((c) => c.evidence ?? [])
      .slice(0, 5),
    /** Nunca promete más puntos de los que quedan por ganar. */
    recoverable: score ? Math.round(Math.min(suma, Math.max(0, 100 - score.total))) : 0,
  }
}
