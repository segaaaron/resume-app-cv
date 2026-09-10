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
import { DETAIL_SEPARATOR, normalize, termKey } from "@/lib/ats3/contracts"
import { SCORED_COMPONENTS } from "@/lib/ats3/score"
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
export type PanelSectionId = "hard" | "soft" | "other" | "format" | "tips"


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
   * El cargo va acá y no en «Lo que mira la persona»: es lo PRIMERO que lee un
   * filtro y compara cadenas, igual que los requisitos duros. Sin esto caía en
   * la sección del reclutador por descarte —`title` no estaba en ninguna— que es
   * la clase de agrupamiento a dedo que este archivo existe para no tener.
   */
  hard: ["must", "title"],
  /**
   * Las blandas tienen componente propio y SÍ puntúan: 0,10 del pilar de
   * relevancia, el mismo peso que el motor viejo les daba y que v3 había
   * perdido. Antes esta lista estaba vacía y sus tarjetas caían en «Lo que mira
   * la persona» —la sección del reclutador— bajo un porcentaje que mide otra cosa.
   */
  soft: ["soft"],
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
export function checkOf(
  f: Finding,
  /**
   * QUÉ DICE ESA LÍNEA HOY.
   *
   * `f.nodeText` es lo que el motor LEYÓ al analizar, y la pantalla lo pintaba
   * como si fuera el texto actual. En la misma ventana el tablero de veredictos
   * ya mostraba la línea viva: dos versiones del mismo renglón, una al lado de
   * la otra, apenas el usuario editara algo. Una sola pregunta, una sola
   * respuesta — y la que corresponde es la del CV que la persona tiene delante,
   * porque es sobre ése que va a decidir.
   *
   * Sin resolutor se cae en la lectura del motor: es lo que había, y una
   * pantalla que no puede preguntar no debe quedarse muda.
   */
  textoVivo?: (nodeId: string) => string,
  /**
   * CÓMO SE DICE EN CASTELLANO LO QUE EL MOTOR NOMBRA CON UN TOKEN.
   *
   * `detail` de tres tipos —el chequeo de lectura que falló, el eje que le
   * falta a la viñeta, la función que el resumen no cumple— es vocabulario del
   * motor: `trayectoria_continua`, `resultado`, `identity`. Se pintaba CRUDO en
   * la tarjeta, reportado con captura: «trayectoria_continua, qué mierdas es
   * eso». El motor no escribe prosa —ni debe—, así que el nombre humano sale
   * del diccionario, que es su dueño natural. Sin traductor se cae al token: es
   * lo que había, y una pantalla que no puede preguntar no debe quedarse muda.
   */
  glosa?: (token: string, params?: Record<string, string>) => string,
): PanelCheck {
  const linea = textoVivo?.(f.nodeId) || f.nodeText
  return {
    id: f.id,
    // La sección sale del componente del que el motor sacó la ganancia, no de
    // una lista de tipos escrita a mano acá.
    section: SECTION_OF.get(f.component) ?? "tips",
    state: f.gain >= CRITICAL_GAIN ? "crit" : "warn",
    weight: Number(f.gain.toFixed(1)),
    titleKey: `type_${f.type}`,
    /**
     * CUÁNTOS REQUISITOS CIERRA ESTA TARJETA.
     *
     * Dos requisitos que caen en la misma línea se fusionan a propósito: UNA
     * reescritura los aterriza a los dos, y abrir dos tarjetas sobre la misma
     * viñeta sería pedir dos consultas para el mismo trabajo y que la segunda
     * pise a la primera.
     *
     * Pero el título seguía diciendo «falta un requisito» en singular llevando
     * tres adentro, y la tabla del informe contaba 7 mientras el botón ofrecía
     * 4: dos números ciertos que juntos se leen como una mentira. La tarjeta
     * dice cuántos cierra y los nombra de a uno.
     */
    /**
     * Lo que el título necesita nombrar, sacado del `detail` del propio
     * hallazgo. Sin esto la tarjeta pinta el marcador crudo —«{cargo}»— que es
     * el mismo defecto que los tokens del motor: un dato del código escrito
     * donde va la copia.
     */
    params:
      f.type === "missing_requirement"
        ? { count: partesDe(f.detail).length }
        : f.type === "title_mismatch"
          ? { cargo: f.detail }
          : f.type === "verb_repeated"
            ? { verbo: f.detail }
            : undefined,
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
     * QUÉ señala el hallazgo, no dónde aterrizó.
     *
     * En un requisito que falta, la evidencia es EL REQUISITO. La línea que el
     * motor eligió como mejor destino es sólo el lugar donde se escribiría, y
     * ponerla acá hacía que la cabecera dijera «lo crítico es: "Atendí a los
     * clientes…"» — el texto de una viñeta presentado como si fuera el defecto.
     * En los demás, la línea SÍ es lo señalado.
     */
    ...(() => {
      const { line, evidence, focus } = evidenciaDe(f, linea, glosa)
      return { line, evidence: evidence.filter((x) => x.trim().length > 0), focus }
    })(),
  }
}

/** Los tipos cuyo `detail` es vocabulario del motor y no texto del CV. */
const TIPOS_CON_TOKENS = new Set(["parse_risk", "no_result", "summary_gap"])

/**
 * LOS MOTIVOS QUE SON UN DATO SUELTO, DICHOS COMO FRASE.
 *
 * `verb_repeated` trae el verbo —«developed»— y `title_mismatch` el cargo. Solos
 * en la lista de motivos son una palabra en una caja gris: reportado con
 * captura. El título de la tarjeta ya los nombra bien cuando el hallazgo va
 * solo; el problema aparece cuando se FUSIONA y el título lo pone otro.
 */
const FRASE_DE = new Set(["verb_repeated", "title_mismatch"])

/**
 * QUÉ SE MUESTRA COMO «lo que disparó esto».
 *
 * `parse_risk` es la excepción y por eso no lleva la línea: los siete chequeos
 * de lectura se anclan en el resumen porque hay que anclarlos en algún lado,
 * pero hablan del DOCUMENTO —las fechas, el orden de los puestos—, así que
 * pintar el resumen debajo era señalar un párrafo que no tiene nada que ver con
 * el defecto.
 */
function evidenciaDe(
  f: Finding,
  linea: string,
  glosa?: (token: string, params?: Record<string, string>) => string,
): { line?: string; evidence: string[]; focus: string } {
  // El motor une con coma los ejes de la viñeta y las funciones del resumen, y
  // con el separador compartido lo que fusionó: se aceptan los dos.
  const dichos = f.detail.split(/\s*[,·]\s*/).map((x) => x.trim()).filter(Boolean)
  /**
   * LO QUE HAY QUE ARREGLAR, DICHO UNA VEZ Y EN CASTELLANO — para los dos.
   *
   * ── EL DEFECTO QUE ESTO CIERRA ─────────────────────────────────────────────
   * La pantalla glosaba el token («resultado» → «No dice en qué terminó») y al
   * MODELO se le mandaba el token crudo: «resultado, método». Dos lecturas del
   * mismo dato, y la del modelo además en castellano aunque el CV estuviera en
   * inglés, porque esas palabras las escribe el motor.
   *
   * Sale del mismo cálculo que la evidencia: una glosa, dos consumidores.
   */
  /**
   * UN DATO MARCADO SE DICE COMO FRASE, venga solo o fusionado.
   *
   * El motor manda `verbo:developed` cuando el motivo es un dato y no un token
   * del vocabulario. Sin esto, al fusionarse con otra tarjeta el usuario veía
   * «developed» suelto en una caja gris sin saber qué era — reportado con
   * captura. La marca sobrevive a la concatenación; el tipo del hallazgo, no.
   */
  const decir = (x: string) => {
    const corte = x.indexOf(":")
    if (corte > 0) {
      const marca = x.slice(0, corte)
      const dato = x.slice(corte + 1)
      return glosa?.(`motivo_${marca}`, { dato }) ?? dato
    }
    return glosa?.(x) ?? x
  }
  const glosados = TIPOS_CON_TOKENS.has(f.type) ? dichos.map(decir) : dichos
  const focus = glosados.join(" · ")
  if (f.type === "missing_requirement") return { line: linea, evidence: partesDe(f.detail), focus }
  if (FRASE_DE.has(f.type)) return { line: linea, evidence: [decir(f.detail)], focus }
  if (!TIPOS_CON_TOKENS.has(f.type)) return { line: linea, evidence: [f.detail], focus }
  return { line: f.type === "parse_risk" ? undefined : linea, evidence: glosados, focus }
}

/**
 * Los detalles que el motor fusionó, otra vez de a uno.
 *
 * Se separan con la MISMA constante con la que se unieron: leer el formato del
 * productor adivinando el separador es como una ficha termina diciendo
 * «Combine · async/await» como si fuera el nombre de una sola habilidad.
 */
function partesDe(detail: string): string[] {
  return detail.split(DETAIL_SEPARATOR).map((x) => x.trim()).filter(Boolean)
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
     * tiene uno. Las blandas tienen componente propio —para que sus tarjetas no
     * caigan en la sección del reclutador— y no se miden: la pregunta se le hace
     * a quien los enumera, `SCORED_COMPONENTS`, en vez de contar la lista.
     */
    scored: COMPONENTS_OF[id].some((k) => (SCORED_COMPONENTS as string[]).includes(k)),
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
