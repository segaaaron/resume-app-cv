// lib/ats3/guards.ts
//
// LOS TRES CONTROLES DE TAILOR (CEO, 2026-09-29), y las piezas de la pantalla.
//
//   1. Una cifra que la persona no dio va como HUECO que ella llena
//      (`repairSuggestion`, `figureSlots`, `fillSlot`).
//   2. No se pierde ningún hecho de la línea: nombres propios y cifras
//      (`droppedNames`, `droppedFigures`).
//   3. Una propuesta 90% igual a la línea —o a otra del CV— no es una mejora
//      (`addsNothing`).
//
// Más `isStale`/`findNode` (no escribir sobre una línea que cambió) y `loyalty`
// (no volver a mostrar lo ya resuelto). Nada más decide acá.

import {
  METRIC_TYPES,
  nodeHash,
  normalize,
  rolDeNueva,
  type Suggestion,
  type ResumeTree,
  type Finding,
  type Resolution,
  type NodeId,
} from "@/lib/ats3/contracts"

/**
 * LO ÚNICO QUE NO SE ENTREGA: cuando no hay nada honesto que entregar.
 *
 * Ninguna de las dos es un juicio sobre lo que escribió el modelo: una dice que
 * no volvió texto, la otra que no se sabe sobre qué línea escribirlo —y escribir
 * igual pisaría una edición del usuario o la línea de al lado—.
 */
export type GuardReason =
  | "stale" // se pensó sobre una versión que ya no existe
  | "empty" // no hay texto que entregar
  | "declined" // la tarjeta prometía algo y el modelo no encontró cómo escribirlo sin agregar lo que el CV no dice
  /**
   * ── ACÁ VIVÍAN CUATRO RECHAZOS MÁS (CEO, 2026-09-11) ───────────────────────
   *
   * `repeats` —«se parece a otra línea»— pasó a aviso: `similarTo` la nombra, el
   * motor pide una vez más, y la propuesta llega con el aviso a la vista.
   *
   * `drops_content`, `too_many_placeholders` y `placeholder_in_summary`. Los tres
   * tiraban una propuesta ENTERA por algo que el código sabe arreglar o que el
   * usuario ve en el antes/después. Reportado con captura: «The rewrite dropped
   * something your line already says (30%). It was not written.» — el modelo
   * había cambiado el «30%» del candidato por «[x%]», que es lo que P4 le ordenaba
   * («si declarás un tamaño, la línea LLEVA su hueco»), y el guard lo castigaba.
   * «Lo que me das es un bloqueo, no una solución.»
   *
   * Cambiaron de herramienta, no desaparecieron: la cifra del candidato vuelve a
   * su lugar y el hueco sin declarar se vuelve un campo (`repairSuggestion`), lo
   * perdido se pide una vez más (`lostContent`), y P4 ya no ordena lo contrario.
   */

export type GuardVerdict = { ok: true } | { ok: false; reason: GuardReason; detail: string }

const pass: GuardVerdict = { ok: true }
const fail = (reason: GuardReason, detail: string): GuardVerdict => ({ ok: false, reason, detail })

export interface GuardContext {
  /** El texto que la sugerencia reemplaza. Sin esto no se puede juzgar nada. */
  original: string
  /** Las otras viñetas del CV: la propuesta no puede ser casi igual a ninguna. */
  siblings?: string[]
  /**
   * La identidad del CV —resumen, cargos, habilidades, otras secciones—: una
   * palabra que el CV ya dice ahí no cuenta como aporte (ver `addsNothing`).
   */
  known?: string
  /** Viñeta nueva: no reemplaza ninguna línea, así que no hay «antes» que exigir. */
  nueva?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// EL CHEQUEO COMPLETO
// ─────────────────────────────────────────────────────────────────────────────

export function checkSuggestion(s: Suggestion, ctx: GuardContext): GuardVerdict {
  if (!s.changed) return pass
  if (!s.text.trim()) return fail("empty", "la reescritura vino vacía")
  // Un "antes" vacío es no saber qué línea reemplaza: escribiría sobre otra.
  if (!ctx.original.trim() && !ctx.nueva) return fail("stale", "no se sabe qué línea reemplaza esta reescritura")
  return pass
}

// ─────────────────────────────────────────────────────────────────────────────
// LOS CHEQUEOS, UNO POR UNO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ¿La línea habla del candidato como si fuera otro?
 *
 * ── MEDIDO CONTRA LA API, EN CINCO OFICIOS ─────────────────────────────────
 * Dos de doce líneas entregadas volvieron así: "Controló los signos vitales de
 * los pacientes" y "Mantener comunicación con las familias". El prompt lo
 * prohíbe en los dos idiomas y el modelo igual lo escribe — un prompt es una
 * petición, no un contrato. En el CV se lee como una carta que escribió otro, o
 * como una lista de tareas del puesto en vez del trabajo de esta persona.
 *
 * Sólo español, y con las dos formas que de verdad aparecen:
 *   - tercera persona: la primera palabra termina en -ó acentuada (Controló).
 *   - infinitivo: la primera palabra termina en -ar/-er/-ir (Mantener).
 *
 * En inglés NO se juzga acá: los pasados irregulares (Led, Ran, Built, Wrote)
 * no tienen marca común, y una regla por sufijo rechazaría los verbos más
 * fuertes del idioma. Ese lado lo cubre el prompt — decirlo es mejor que
 * fingir que el código lo cubre.
 */
/**
 * PONE LA APERTURA EN PRIMERA PERSONA, cuando se puede probar cómo.
 *
 * ── POR QUÉ CORREGIR Y NO RECHAZAR (CEO, 2026-09-09) ────────────────────────
 * «Atendió a los clientes» era un rechazo: el usuario perdía la reescritura y
 * la ranura de cuota por una letra. La conjugación regular del pasado en
 * español es mecánica —-ó → -é para los verbos en -ar, -ió → -í para -er/-ir—
 * así que en ese caso el código PUEDE arreglarlo y no hace falta preguntarle a
 * nadie.
 *
 * Lo que NO se toca, a propósito: los irregulares (Mantuvo, Hizo, Puso) y los
 * sustantivos (Manejo de caja). Ahí no hay una regla que el código pueda
 * probar, y escribir una forma inventada sería peor que el rechazo. Esos siguen
 * cayendo en el guard, que es la respuesta honesta.
 */
export function toFirstPerson(text: string): string | null {
  const primera = text.trim().split(/\s+/)[0] ?? ""
  const limpia = primera.replace(/[^\p{L}]/gu, "")
  if (limpia.length < 4 || limpia === limpia.toUpperCase()) return null
  const corregida = /ió$/.test(limpia)
    ? limpia.replace(/ió$/, "í")
    : /ó$/.test(limpia)
      ? limpia.replace(/ó$/, "é")
      : null
  if (!corregida) return null
  return text.replace(primera, primera.replace(limpia, corregida))
}

export function wrongPerson(text: string, isSummary = false): string | null {
  const primera = text.trim().split(/\s+/)[0] ?? ""
  const limpia = primera.replace(/[^\p{L}]/gu, "")
  if (limpia.length < 4) return null
  // Un token en mayúsculas es una sigla, no un verbo conjugado.
  if (limpia === limpia.toUpperCase()) return null
  if (/ó$/.test(limpia)) return `"${primera}" habla de la persona en tercera`
  /**
   * LOS PASADOS IRREGULARES, QUE NO LLEVAN TILDE Y SE COLABAN.
   *
   * ── MEDIDO CONTRA LA API (2026-08-29) ──────────────────────────────────────
   * El motor ENTREGÓ "Mantuvo las máquinas en funcionamiento…" para el CV de un
   * soldador. La vara anterior era la tilde —Controló, Aplicó— y en español los
   * irregulares de tercera persona no la llevan: mantuvo, tuvo, hizo, puso,
   * dijo, estuvo, supo, quiso, vino, trajo, condujo.
   *
   * No hace falta una lista, y por eso no la hay: en español el pasado en
   * PRIMERA persona nunca termina en -o. Una apertura que termina en -o es un
   * pasado de otro (Mantuvo), un presente (Superviso) o un sustantivo (Manejo
   * de caja) — y las tres están mal en una viñeta por el mismo motivo: no dicen
   * lo que ESTA persona hizo.
   */
  /**
   * ── Y EL SUSTANTIVO ESTÁ BIEN EN EL RESUMEN, QUE ES OTRA COSA ──────────────
   *
   * Esta rama caza el sustantivo a propósito: en una VIÑETA, «Manejo de caja» no
   * dice lo que la persona hizo. Pero el resumen se escribe justo así, y no por
   * gusto — P5 lo pide con todas las letras: «IDENTIDAD: qué ES la persona (…)
   * se escribe como frase nominal o con el trabajo en sí», y la doctrina de la
   * casa lo repite desde el 2026-08-19: «Cajera con experiencia en…».
   *
   * Sin esta excepción el guard rechazaba la forma que el prompt acababa de
   * pedir, y de un modo que además discrimina: la vara es terminar en
   * consonante + «o», así que caían los masculinos y pasaban los femeninos.
   * Medido sobre 31 oficios reales: 14 rechazados —Cajero, Enfermero, Ingeniero,
   * Médico, Técnico, Abogado, Empleado, Obrero, Panadero, Carpintero,
   * Peluquero, Cocinero, Mecánico, Administrativo— y sus formas en femenino
   * pasando todas. El usuario gastaba la consulta, el reintento le pedía al
   * modelo lo contrario que P5, y se quedaba sin resumen.
   *
   * Lo que SÍ se sigue mirando en el resumen son las otras dos ramas: la tercera
   * persona con tilde («Controló») y el infinitivo («Mantener»). Ésas están mal
   * en los dos sitios.
   *
   * ── LO QUE ESTA EXCEPCIÓN DEJA PASAR, MEDIDO Y DICHO ───────────────────────
   * Un pasado irregular de tercera SIN tilde abriendo un resumen: «Mantuvo las
   * máquinas…». Esta rama era la única que lo cazaba, porque conflaciona tres
   * cosas que terminan igual —el sustantivo, el presente y el irregular— y no
   * hay forma de separarlas sin una lista de verbos, que este motor no tiene a
   * propósito.
   *
   * Se acepta ese borde a sabiendas: del otro lado había un rechazo SEGURO y
   * sistemático de la forma que el prompt pide, sesgado por género. Un guard
   * demasiado estricto no es seguro, borra el producto — medido tres veces en
   * este proyecto. Y el caso que queda no está solo: P5 lo prohíbe en prosa y
   * P6 revisa la salida.
   *
   * Ojo, y es PREVIO a esta excepción: el guard mira SÓLO la primera palabra, así
   * que «Su experiencia lo posiciona…» nunca se cazó, ni en viñeta ni en resumen.
   */
  if (!isSummary && /[^aeiouáéíóú]o$/.test(limpia)) {
    return `"${primera}" no es un pasado en primera persona: habla de otro, está en presente, o es un sustantivo`
  }
  if (/(ar|er|ir)$/i.test(limpia)) return `"${primera}" es un infinitivo, no lo que la persona hizo`
  return null
}

/**
 * UNA CIFRA QUE EL ORIGINAL YA DECLARABA NO SE BORRA.
 *
 * Es el espejo de `inventedFigure`, y faltaba. Reportado en producción con
 * captura el 2026-08-30, con la propuesta lista para aplicarse:
 *
 *   dice hoy   "…unit tests to ensure code reliability, reducing regressions by 5%."
 *   quedaría   "…unit tests to improve code reliability and reduce regressions."
 *
 * Los doce chequeos la dejaron pasar: `drops_content` mira los términos de la
 * VACANTE y ninguno mira los números. Así, el panel ofrecía como mejora una
 * línea estrictamente peor —la cifra es lo más difícil de conseguir y lo que
 * más pesa en una viñeta— y el usuario la aplicaba creyendo que subía.
 *
 * Un año suelto no cuenta: "2019" en "desde 2019" es una fecha, no una medida, y
 * exigir que sobreviva rechaza reescrituras buenas que reordenan el período.
 */
export function droppedFigures(original: string, rewritten: string): string[] {
  const after = digitsOf(rewritten)
  const perdidas: string[] = []
  // Se devuelve la cifra COMO EL CANDIDATO LA ESCRIBIÓ ("5%"), no sus dígitos:
  // es lo que viaja al reintento, y decirle al modelo «perdiste 5» en vez de
  // «perdiste 5%» le pide adivinar de qué número se le habla.
  for (const m of original.matchAll(/\d[\d.,]*\s*%?/g)) {
    const digits = m[0].replace(/\D/g, "")
    if (!digits || bareYear(digits) || after.has(digits)) continue
    // «7+ years», «7 años»: la antigüedad no es un logro, es una duración que se
    // mide sobre las fechas, y el resumen la escribe con el número medido.
    // Exigirla le pedía al modelo el «7» viejo y los «11» medidos a la vez
    // (medido el 2026-09-28).
    if (/^\s*\+?\s*(years?|yrs?|a[ñn]os?)\b/i.test(original.slice((m.index ?? 0) + m[0].length))) continue
    const escrita = m[0].trim()
    if (!perdidas.includes(escrita)) perdidas.push(escrita)
  }
  return perdidas
}

/** 1900–2099 a secas: una fecha, no una medida. */
function bareYear(digits: string): boolean {
  return /^(19|20)\d{2}$/.test(digits)
}

/**
 * ¿LA PROPUESTA APORTA ALGO, O ES LA MISMA LÍNEA? — la regla del 90% del CEO:
 * «si lo que sugerís como mejora es idéntico en un 90 a 100% no es mejora».
 *
 * Se mide contra TU línea: qué parte de sus palabras sigue igual. Medirlo contra
 * las dos frases juntas hacía que cada palabra de relleno bajara el porcentaje
 * (medido con el CV del CEO: 94% igual se leía como 62%).
 *
 * Con 90% o más igual, sólo aporta si trae algo nuevo para el CV —más de dos
 * palabras de cuatro letras o más que el CV no dice en `known`— y además crece
 * de verdad (más de un tercio). Un cambio de verbo con dos sinónimos no pasa;
 * «Construí la pantalla de pagos» → «…para una super-app con millones de
 * usuarios» sí.
 */
export function addsNothing(original: string, rewritten: string, known = ""): boolean {
  const a = new Set(normalize(original).split(" ").filter(Boolean))
  const b = new Set(normalize(rewritten).split(" ").filter(Boolean))
  if (a.size === 0 || b.size === 0) return false
  let shared = 0
  for (const w of a) if (b.has(w)) shared++
  if (shared / a.size < 0.9) return false
  const crece = b.size > a.size * 1.3
  // Una línea muy corta («Soldé piezas») que crece de verdad se enriqueció:
  // «con soldadura MIG» es justo lo que el aviso pide.
  if (a.size < 6) return !crece
  const yaDicho = new Set(normalize(known).split(" ").filter(Boolean))
  let novel = 0
  for (const w of b) if (!a.has(w) && w.length >= 4 && !yaDicho.has(w)) novel++
  return novel <= 2 || !crece
}

// ─────────────────────────────────────────────────────────────────────────────
// EL ESTADO: una sugerencia pensada sobre una versión que ya no existe
// ─────────────────────────────────────────────────────────────────────────────

/**
 * El usuario edita a mano una línea que ya tenía una sugerencia pendiente. Si se
 * aplica igual, su edición desaparece sin que se entere. Esa es la razón de que
 * cada nodo lleve versión.
 */
export function isStale(basedOnHash: string, nodeId: NodeId, tree: ResumeTree): boolean {
  const node = findNode(tree, nodeId)
  if (!node) return true
  return node.hash !== basedOnHash
}

export function findNode(tree: ResumeTree, id: NodeId): { text: string; hash: string } | null {
  if (tree.summary.id === id) return tree.summary
  const rol = rolDeNueva(id)
  if (rol) return tree.roles.some((r) => r.id === rol) ? { text: "", hash: nodeHash("") } : null
  for (const r of tree.roles) {
    const b = r.bullets.find((x) => x.id === id)
    if (b) return b
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// LEALTAD: no volver a señalar lo que el usuario ya resolvió
// ─────────────────────────────────────────────────────────────────────────────

export interface LoyaltyResult {
  shown: Finding[]
  /** Se cerró y el nodo sigue intacto: es una re-detección falsa. */
  suppressed: Finding[]
  /** Se cerró, el usuario lo tocó después y lo volvió a romper. Eso sí se avisa. */
  regressed: Finding[]
}

export function loyalty(
  findings: Finding[],
  log: Resolution[],
  /** Lo que el CV dice hoy. Con él, un arreglo que nunca se guardó no cuenta. */
  cvTexto?: string,
): LoyaltyResult {
  const byFinding = new Map(log.map((r) => [r.findingId, r]))
  const out: LoyaltyResult = { shown: [], suppressed: [], regressed: [] }

  for (const f of findings) {
    const closed = byFinding.get(f.id)
    if (!closed) {
      out.shown.push(f)
      continue
    }
    /**
     * UNA LÍNEA SACADA QUE VUELVE A ESTAR, VUELVE CON SUS TARJETAS.
     *
     * Sacar una viñeta se anota como descartado, y «descartado» no vuelve nunca.
     * Pero lo que esa anotación afirma es «esta línea ya no existe»: si el motor
     * la está leyendo otra vez, el usuario la devolvió —el «Deshacer» del
     * tablero, o escribiéndola a mano—. Medido en local el 2026-09-24: sacar y
     * deshacer dejaba la línea en el CV con su hallazgo suprimido para siempre.
     */
    if (closed.kind === "dropped") {
      out.shown.push(f)
      continue
    }
    /**
     * UN ARREGLO QUE EL CV NO DICE NO ESTÁ HECHO (medido el 2026-09-28).
     *
     * La resolución se anota al APLICAR, y aplicar no es guardar: se aplicaba,
     * se recargaba sin guardar, y el hallazgo volvía pintado como «Volvió a
     * aparecer» — una regresión que nadie provocó. Si lo que se escribió no está
     * en el CV, el arreglo no existe y el hallazgo es uno más.
     */
    if (closed.resolvedBy === "AI_SUGGESTION" && closed.after && cvTexto !== undefined && !cvTexto.includes(closed.after)) {
      out.shown.push(f)
      continue
    }
    // Descartado a mano: no vuelve nunca, salvo que cambie la vacante — y eso
    // cambia la clave del análisis entero, así que el registro ya no aplica.
    if (closed.resolvedBy === "DISMISSED") {
      out.suppressed.push(f)
      continue
    }
    // Mismo texto que cuando se cerró → re-detección falsa. Distinto → el
    // usuario lo tocó y lo volvió a romper, y eso sí merece avisarse.
    if (f.nodeHash === closed.nodeHashAtResolution) {
      out.suppressed.push(f)
    } else {
      out.regressed.push(f)
    }
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// EL MOTIVO QUE VIAJA AL MODELO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Qué se le dice al modelo cuando su respuesta no pasó.
 *
 * Le dice qué falló de lo que YA escribió; no le agrega reglas nuevas. Pedir de
 * nuevo sin decir por qué es tirar la moneda otra vez.
 */
export function retryNudge(v: GuardVerdict, language: "es" | "en"): string {
  if (v.ok) return ""
  const es: Record<GuardReason, string> = {
    stale: `La línea cambió desde que la leíste.`,
    empty: `Devolviste una reescritura vacía.`,
    declined: `Declinaste una línea que todavía tiene algo que arreglar.`,
  }
  const en: Record<GuardReason, string> = {
    stale: `The line changed since you read it.`,
    empty: `You returned an empty rewrite.`,
    declined: `You declined a line that still has something to fix.`,
  }
  return (language === "en" ? en : es)[v.reason]
}

/**
 * ¿ESTO YA ESTÁ DICHO? La línea del CV a la que la propuesta es casi igual, o
 * null: la que reemplaza o cualquier otra viñeta. Una sola vara, `addsNothing`.
 */
export function similarTo(s: Suggestion, ctx: GuardContext): string | null {
  const text = s.text.trim()
  if (!s.changed || !text) return null
  if (addsNothing(ctx.original, text, ctx.known)) return ctx.original
  return (ctx.siblings ?? []).find((otra) => otra.trim() && addsNothing(otra, text, ctx.known)) ?? null
}

// ─────────────────────────────────────────────────────────────────────────────

const HUECO = /\[[^\]]+\]/g

/**
 * LO QUE ESCRIBE LA PERSONA ENTRA EN EL LUGAR DE LA «x», CON LA UNIDAD DEL HUECO.
 *
 * El hueco trae su unidad adentro —`[x%]`, `[$x]`, `[x usuarios]`— y se
 * reemplazaba el corchete ENTERO por lo tipeado. Medido en local el
 * 2026-09-24: `[x%]` + «15» escribía «…completion rates by 15.» — sin el %, una
 * cifra que ya no dice qué mide. Si la persona ya escribió la unidad («15%»,
 * «500 usuarios»), no se duplica.
 */
export function fillSlot(token: string, value: string): string {
  const v = value.trim()
  const adentro = token.replace(/^\[|\]$/g, "")
  const variables = [...adentro.matchAll(/(^|[^\p{L}])([xXyYnN])(?=[^\p{L}]|$)/gu)]
  // `[de x a y]`, `[x/y]`: dos números. La persona escribe el rango entero y
  // no hay una sola «x» donde ponerlo.
  if (variables.length !== 1) return v
  const x = variables[0]
  if (x.index === undefined) return v
  const at = x.index + x[1].length
  const resto = normalize(adentro.slice(0, at) + " " + adentro.slice(at + 1))
  // Ya trae las palabras de la unidad: se escribe tal cual la persona lo dijo.
  if (resto && normalize(v).includes(resto)) return v
  let numero = v
  if (adentro.includes("%")) numero = numero.replace(/%/g, "").trim()
  if (adentro.includes("$")) numero = numero.replace(/\$/g, "").trim()
  return adentro.slice(0, at) + numero + adentro.slice(at + 1)
}

/**
 * LA CIFRA DEL CANDIDATO, PUESTA EN EL HUECO QUE LA REEMPLAZÓ.
 *
 * El modelo cambiaba «by 30%» por «by [x%]»: el dato era del candidato y se le
 * pedía otra vez. Cada cifra del original que la propuesta ya no dice se asigna
 * al primer hueco libre del mismo tipo —porcentaje con porcentaje, cantidad con
 * cantidad— y la hoja de confirmación lo muestra YA ESCRITO en ese campo.
 *
 * ── POR QUÉ NO ALCANZA CON EMPAREJAR POR TIPO (QA, 2026-09-11) ─────────────
 * La primera versión emparejaba porcentaje con porcentaje y en orden. Medido
 * ejecutándola: con el original «…user engagement by 30%» y la propuesta
 * «…cutting the crash rate by [x%]», precargaba 30% en la tasa de crashes —un
 * hecho que el candidato nunca dijo, a un clic de entrar al CV— y además
 * `lostContent` lo daba por conservado, así que NO se pedía el reintento que lo
 * habría corregido. La precarga apagaba su propia red.
 *
 * Ahora la cifra sólo se precarga si el hueco mide LO MISMO: las palabras con
 * contenido alrededor de la cifra en el original y alrededor del hueco en la
 * propuesta tienen que compartir una raíz de cuatro —la misma vara del resto
 * del archivo—. Si no la comparten, el campo queda vacío y la cifra cuenta como
 * perdida, así que el motor la reclama.
 *
 * ponytail: mira las cuatro palabras de cada lado, no el significado. En «de 40
 * a 6 minutos» precarga 40 donde la línea pide el valor final; la otra cifra
 * queda reclamada y el usuario ve el campo con su etiqueta antes de confirmar.
 */
export function figureSlots(original: string, s: Pick<Suggestion, "text" | "placeholders">): Record<string, string> {
  const perdidas = new Set(droppedFigures(original, s.text.replace(HUECO, " ")))
  if (perdidas.size === 0) return {}
  const out: Record<string, string> = {}
  for (const m of original.matchAll(/\d[\d.,]*\s*%?/g)) {
    const cifra = m[0].trim()
    if (!perdidas.has(cifra)) continue
    const pct = cifra.includes("%")
    const cerca = vecinas(original, m.index ?? 0, m[0].length)
    for (const p of s.placeholders) {
      const at = s.text.indexOf(p.token)
      if (p.token in out || at < 0 || p.token.includes("%") !== pct) continue
      // MIDE LO MISMO, o no se precarga: ver el comentario de arriba.
      if (!compartenRaiz(cerca, vecinas(s.text, at, p.token.length))) continue
      out[p.token] = p.token.startsWith("[$") && !cifra.startsWith("$") ? `$${cifra}` : cifra
      break
    }
  }
  return out
}

/** Las palabras con contenido pegadas a una posición: QUÉ se mide ahí. */
function vecinas(text: string, at: number, largo: number): string[] {
  const antes = normalize(text.slice(0, at)).split(" ").filter(Boolean).slice(-4)
  const despues = normalize(text.slice(at + largo)).split(" ").filter(Boolean).slice(0, 4)
  return [...antes, ...despues].filter((w) => w.length >= 4)
}

/** La misma raíz de cuatro que usa el resto del archivo. */
function compartenRaiz(a: string[], b: string[]): boolean {
  return a.some((x) => b.some((y) => x.slice(0, 4) === y.slice(0, 4)))
}

/**
 * ARREGLA LA FORMA DE LA PROPUESTA ANTES DE JUZGARLA.
 *
 * Tres cosas que rechazaban la propuesta entera y que el código puede resolver:
 *
 *   la ficha derramada      "[n personas; escala; evidencia: …]" → "[n personas]",
 *                           y "(SCALE; label: …)" pegado al lado, afuera.
 *                           Medido contra la API: las dos formas salieron.
 *   el hueco sin declarar   un corchete en el texto sin su campo se imprimía
 *                           tal cual —el resumen llega siempre así, porque su
 *                           módulo vacía `placeholders`—. Ahora es un campo que
 *                           el usuario llena antes de que se escriba nada.
 *   la variante inservible  sin huecos no hay «no tengo ese dato» que ofrecer, y
 *                           con un corchete adentro se imprimiría: se suelta.
 *
 * ponytail: la ficha derramada FUERA de un paréntesis no se toca —no se midió
 * esa forma—; si aparece, se ve en el antes/después.
 */
export function repairSuggestion(s: Suggestion): Suggestion {
  if (!s.changed) return s
  const ficha = new RegExp(`\\s*\\([^()]*(?:\\b(?:${METRIC_TYPES.join("|")})\\b|\\b(?:label|hint|evidenceNeeded)\\s*:)[^()]*\\)`, "g")
  const text = s.text
    .replace(HUECO, (hueco) => (hueco.includes(";") || hueco.length > 62 ? `[${hueco.slice(1, -1).split(";")[0].trim().slice(0, 40)}]` : hueco))
    .replace(ficha, "")

  /**
   * ── DOS HUECOS CON EL MISMO NOMBRE SON DOS DATOS DISTINTOS ─────────────────
   *    Blocker, medido contra la API el 2026-09-11.
   *
   * El modelo devolvió «Reduje los errores de medicación de [n] a [n] por mes»
   * sobre una línea que decía «de 12 a 3». El reemplazo es POR NOMBRE de token,
   * así que el valor del primer campo se escribía en los DOS y el CV terminaba
   * diciendo «de 12 a 12»: un dato que la persona nunca dio, con forma creíble y
   * a un clic de entrar al documento.
   *
   * Se separan acá, que es donde se arregla la forma: cada aparición es su
   * propio hueco y su propio campo. Con nombres únicos, un reemplazo no puede
   * pisar al de al lado.
   */
  const separados = separarRepetidos(text)
  const declarados = new Map(s.placeholders.map((p) => [p.token, p]))
  const placeholders = [...new Set(separados.match(HUECO) ?? [])].map((token) => {
    // Una aparición renombrada hereda la ficha del hueco que el modelo declaró.
    const base = declarados.get(token) ?? declarados.get(token.replace(/ \d+\]$/, "]"))
    return base
      ? { ...base, token }
      // El token tal cual: es lo que el usuario ve en el «después», así que el
      // campo se reconoce sin traducir nada. «x%» suelto no dice qué escribir.
      : { token, type: "SCALE" as const, label: token, hint: "", evidenceNeeded: "", required: true }
  })

  const variante = s.variantWithoutMetric?.trim()
  const variantWithoutMetric = variante && placeholders.length > 0 && !/\[[^\]]+\]/.test(variante) ? variante : null
  return { ...s, text: separados, placeholders, variantWithoutMetric }
}

/** «de [n] a [n]» → «de [n] a [n 2]»: cada aparición, su propio campo. */
function separarRepetidos(text: string): string {
  const vistos = new Set<string>()
  return text.replace(HUECO, (tok) => {
    if (!vistos.has(tok)) {
      vistos.add(tok)
      return tok
    }
    let n = 2
    let nuevo = `${tok.slice(0, -1)} ${n}]`
    while (vistos.has(nuevo)) nuevo = `${tok.slice(0, -1)} ${++n}]`
    vistos.add(nuevo)
    return nuevo
  })
}

/**
 * LOS NOMBRES PROPIOS DEL ORIGINAL QUE LA REESCRITURA SOLTÓ: tecnologías,
 * productos, siglas (Angular, TypeScript, RESTful, iOS). Cambiar uno por otro
 * altera un hecho de la persona. La primera palabra de cada oración lleva
 * mayúscula por gramática, no por nombre, y no cuenta.
 */
export function droppedNames(original: string, rewritten: string): string[] {
  const dicho = normalize(rewritten).split(" ")
  // «Core Data» escrito «CoreData», como lo escribe el aviso, sigue diciendo
  // «Data» (medido contra la API el 2026-09-28): se busca también pegado.
  const pegado = normalize(rewritten).replace(/ /g, "")
  // Por raíz de cuatro, como el resto del motor: «REST» sigue diciendo lo que
  // decía «RESTful»; «GraphQL», no. Las siglas cortas se comparan enteras.
  const sigue = (w: string) => {
    const x = normalize(w)
    return (
      dicho.some((d) => d === x || (x.length >= 4 && d.length >= 4 && d.slice(0, 4) === x.slice(0, 4))) ||
      (x.length >= 4 && pegado.includes(x))
    )
  }
  return [...new Set(original
    .split(/(?<=[.!?])\s+/)
    .flatMap((o) => o.split(/\s+/).slice(1))
    .map((w) => w.replace(/[^\p{L}\p{N}+#]/gu, ""))
    .filter((w) => w.length >= 2 && /\p{Lu}/u.test(w) && !sigue(w)))]
}


// ─────────────────────────────────────────────────────────────────────────────
// internos
// ─────────────────────────────────────────────────────────────────────────────

/** Los dígitos de una cifra, sin su formato: "1.400" y "1,400" son la misma. */
function digitsOf(text: string): Set<string> {
  const out = new Set<string>()
  for (const m of text.matchAll(/\d[\d.,]*/g)) {
    const digits = m[0].replace(/\D/g, "")
    if (digits) out.add(digits)
  }
  return out
}
