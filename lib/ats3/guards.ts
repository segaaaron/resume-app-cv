// lib/ats3/guards.ts
//
// LO QUE DECIDE SI UNA SALIDA DEL MODELO LLEGA A LA PANTALLA.
//
// Un prompt es una petición, no un contrato. En volumen, el modelo va a nombrar
// una herramienta que no estaba y va a salir a producción. Estas comprobaciones
// son deterministas, corren sobre TODA salida, y son las que mandan: si el
// validador del modelo y este archivo discrepan, gana este archivo. (El validador
// P6 se retiró el 2026-09-09 por orden del CEO: preguntaba lo mismo que los dos
// guards de invención, con una llamada más.)
//
// ── LOS DOS MOTIVOS DE QUE ESTO SEA UN SOLO ARCHIVO ─────────────────────────
// 1. Cuando cada escritor corre "sus" chequeos, se desincronizan: uno termina
//    corriendo cinco y su hermano cuatro, y el hueco no se ve hasta que un
//    usuario lo reporta con captura.
// 2. Un guard que descarta EN SILENCIO convierte el reintento en una segunda
//    moneda tirada. Acá todo rechazo dice QUÉ falló y con qué evidencia, y ese
//    motivo viaja al modelo.
//
// ── LO QUE NO SE CHEQUEA, Y ES DECISIÓN ─────────────────────────────────────
// El PDF exige viñetas de 140 a 220 caracteres y rechaza fuera de ese rango. No
// entra: el CEO retiró el techo de largo el 2026-08-19 ("cuatro líneas largas
// con información de primera son bienvenidas"). El largo se MIDE y se reporta;
// no rechaza una reescritura buena.

import {
  METRIC_TYPES,
  normalize,
  termsIn,
  type TermIndex,
  type Suggestion,
  type ResumeTree,
  type Finding,
  type Resolution,
  type NodeId,
} from "@/lib/ats3/contracts"
import { type Ledger } from "@/lib/ats3/ledger"

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
  /** Términos en juego: los de la vacante y los que el candidato declaró. */
  index: TermIndex
  ledger: Ledger
  /**
   * TEXTOS QUE DESAPARECEN SI NO ENTRAN EN EL RESULTADO.
   *
   * ── POR QUÉ ESTOS DOS CASOS NECESITAN UNA VARA MÁS DURA ───────────────────
   * `lostContent` mira los términos de la VACANTE y las cifras: es la vara
   * correcta para una reescritura, donde lo demás sigue escrito en el CV aunque
   * la línea cambie. Hay dos casos donde no:
   *
   *   fusionar → la segunda línea SE BORRA
   *   agregar  → la línea no existe; el tema que el usuario confirmó es el
   *              ÚNICO hecho que hay
   *
   * En los dos, lo que no entre en el resultado no vuelve de ningún lado.
   * Medido con el par que el CEO puso de ejemplo —«Gestioné la agenda» /
   * «Confirmé los turnos por teléfono»—: no hay ni un término del aviso ni una
   * cifra, así que el guard general las daba por buenas aunque el resultado se
   * comiera la mitad. El motor viejo tenía esta comprobación con el nombre
   * `contentDroppedFrom` y se perdió al construir v3 de cero.
   *
   * Es UNA sola pregunta —«¿sobrevivió todo esto?»— y por eso es un solo campo:
   * con uno por caso, el próximo llega sin nadie que lo reclame.
   */
  mustKeep?: string[]
  /**
   * LAS OTRAS VIÑETAS DEL CV. Sin ellas no se puede contestar «¿esto repite?».
   *
   * Orden del CEO (2026-09-09): «lo que sí deberías validar es que una viñeta no
   * debería ser idéntica con las otras, no repetir». Es la única pregunta que
   * el guard no podía contestar: comparaba la reescritura contra SU PROPIO
   * original y contra los `claim` que el modelo declara, nunca contra el texto
   * de las líneas vecinas.
   */
  siblings?: string[]
  /**
   * EL IDIOMA DEL CV. `wrongPerson` es una regla del español y sólo del español.
   *
   * Sin esto corría sobre TODO. Medido ejecutando la función: "Photo retouching
   * workflows delivered weekly" y "Micro frontends rolled out across four
   * squads" se rechazaban como tercera persona, porque la vara es «la primera
   * palabra termina en consonante + o» y en inglés eso es un sustantivo común.
   * El usuario perdía la reescritura con un motivo que no existe en su idioma.
   */
  language?: "es" | "en"
}

// ─────────────────────────────────────────────────────────────────────────────
// EL CHEQUEO COMPLETO
// ─────────────────────────────────────────────────────────────────────────────

export function checkSuggestion(s: Suggestion, ctx: GuardContext): GuardVerdict {
  if (!s.changed) return pass
  const text = s.text.trim()
  if (!text) return fail("empty", "la reescritura vino vacía")

  // Un "antes" vacío significa que no sabemos qué línea reemplaza. Publicar eso
  // escribe sobre la línea equivocada: este proyecto ya pagó ese defecto con un
  // botón que marcaba "hecho" justo cuando no hacía nada.
  if (!ctx.original.trim()) return fail("stale", "no se sabe qué línea reemplaza esta reescritura")

  /**
   * ── LOS HUECOS YA NO RECHAZAN: SE ARREGLAN ANTES DE LLEGAR ACÁ ─────────────
   *
   * Vivían aquí cuatro rechazos sobre los huecos: el resumen con un corchete, la
   * variante sin cifra con un corchete o comiéndose un dato, la ficha del hueco
   * derramada al texto, y más de dos huecos. Ninguno protegía al CV de algo que
   * el código no pudiera resolver solo: `repairSuggestion` limpia la ficha,
   * vuelve el corchete sin declarar un campo que el usuario llena, y suelta la
   * variante que no se puede escribir tal cual. Lo que queda —tres huecos, una
   * variante que dice menos— lo ve el usuario en el antes/después y decide él.
   */

  /**
   * ── ACÁ VIVÍA `wrong_person` COMO RECHAZO (CEO, 2026-09-09) ────────────────
   *
   * «Los guards tienen que cumplir sólo que no se creen viñetas similares.»
   * Escribir «Mantuvo las máquinas» en vez de «Mantuve» es un defecto de
   * redacción, no una línea repetida ni un dato perdido — y costaba la
   * reescritura entera con la cuota gastada.
   *
   * NO SE PERDIÓ NADA, cambió de herramienta: la conjugación regular la arregla
   * el código sin preguntar (`toFirstPerson`, en el motor, antes de juzgar), y
   * la regla sigue escrita en P4 y P5 en los dos idiomas. Lo que queda —un
   * irregular, un sustantivo— se entrega y lo ve el usuario en la confirmación,
   * que es quien firma el CV.
   *
   * `wrongPerson` sigue exportada: es lo que decide si hay algo que corregir.
   */

  /**
   * ── ACÁ VIVÍAN `invented_term` E `invented_figure` (CEO, 2026-09-09) ────────
   *
   * Tiraban la reescritura entera si nombraba una herramienta ausente del
   * original y de las Habilidades declaradas, o si traía una cifra que el
   * candidato no había dado. Orden del CEO, dicha dos veces: «no quiero cosas
   * que digan mentiras o inventos en tus guards».
   *
   * LO QUE ESTO CAMBIA, dicho sin adornos: una reescritura que nombre una
   * herramienta que el CV no menciona, o que escriba una cifra como texto fijo,
   * ya NO se descarta. Llega a la hoja de confirmación y el usuario decide —
   * que es donde el CEO puso siempre la decisión.
   *
   * LO QUE NO CAMBIA: la regla sigue entera en el PROMPT. P4 le dice al modelo
   * que la cifra se pide como hueco tipado (`[x%]`, `[x usuarios]`) y que el
   * número lo pone quien lo vivió, y `truthRule` le prohíbe afirmar un hecho
   * que el original no sostiene. Prevenir en la fuente cuesta cero tokens;
   * castigar después costaba una llamada, un reintento y la cuota del usuario.
   *
   * Y el mecanismo del hueco NO dependía de este guard: lo sostienen el prompt
   * y la hoja de confirmación, que desde hoy no deja pasar un corchete sin
   * llenar —ni siquiera uno marcado como opcional—.
   */

  /**
   * ── POR QUÉ REPETIR UN VERBO YA NO TIRA LA REESCRITURA (CEO, 2026-09-09) ────
   *
   * Acá vivía `verb_collision`: si la propuesta abría con un verbo que ya abre
   * otra línea del CV, se descartaba entera. Reportado con captura y con la
   * pregunta correcta: «¿los guards ayudan o cagan el proyecto?».
   *
   * Los otros once guards protegen la VERDAD del CV — que no se nombre una
   * herramienta que la persona no declaró, que no aparezca una cifra que nunca
   * dio, que no se pierda lo que la línea ya decía. Repetir un verbo no miente
   * ni pierde nada: es ESTILO. Y por un motivo cosmético se tiraba una línea
   * verdadera y mejor escrita, con la ranura de cuota ya gastada y hasta dos
   * llamadas al modelo hechas.
   *
   * Este proyecto ya lo midió dos veces y escribió la regla: «un guard
   * demasiado estricto no es seguro: borra el producto» (invención 3/15, P6
   * 5/15). Éste era el caso donde no se había aplicado.
   *
   * LA REGLA NO SE FUE, CAMBIÓ DE LUGAR: el prompt sigue recibiendo
   * `verbsAlreadyUsed` con la lista entera y la orden de no repetirla (P4,
   * "MEMORIA DEL CV"). Prevenir en la fuente cuesta CERO tokens; castigar
   * después cuesta una llamada, un reintento y la cuota del usuario.
   *
   * Efecto lateral medido por construcción: el reintento por este motivo
   * desaparece, así que el techo de `runRewrite` baja de SEIS llamadas a CINCO.
   */

  /**
   * ── ACÁ VIVÍA `keyword_over_budget` (CEO, 2026-09-09) ──────────────────────
   *
   * Tiraba la reescritura si un término de la vacante ya aparecía dos veces en
   * el CV. Es OPTIMIZACIÓN DE PUNTAJE, no verdad: la línea podía ser correcta,
   * mejor escrita y aterrizar el término donde de verdad se sostiene, y se
   * descartaba igual con la cuota gastada. Mismo caso exacto que
   * `verb_collision`, y misma decisión.
   *
   * La regla sigue en el prompt: al modelo se le manda `termsWithBudgetLeft`
   * con cuánto queda de cada término y cuál es prioritario. Prevenir en la
   * fuente cuesta cero tokens.
   */

  /**
   * ── LA MITAD VIEJA DE `duplicate_claim` SE FUE (CEO, 2026-09-09) ───────────
   *
   * Comparaba el `claim` que DECLARA el modelo contra los logros del ledger con
   * 60% de solape. Sobre frases de tres palabras, dos compartidas ya son 66%: se
   * disparaba solo. Y desde que la propuesta se compara contra el TEXTO de las
   * otras viñetas —lo que el CEO pidió— preguntaba lo mismo por un camino más
   * frágil y sobre un dato que el propio modelo se inventa.
   *
   * Queda la comparación de texto contra texto, más abajo.
   */

  // Lo perdido ya no rechaza: lo cuenta `lostContent` y el motor lo pide una vez más.

  // «¿Esto ya está dicho?» no rechaza: lo contesta `similarTo` y se avisa.


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
 * Términos que el original demostraba y la reescritura soltó.
 *
 * ── POR QUÉ NO SE MIRAN TODAS LAS PALABRAS ─────────────────────────────────
 * Un primer intento exigía que sobreviviera cada palabra de cuatro letras o
 * más. Medido contra un caso real, eso RECHAZA la reescritura buena: "Realicé
 * el arqueo de caja" → "Cuadré efectivo, comprobantes y diferencias del turno"
 * pierde la palabra "arqueo" y conserva —explica— todo su contenido. Prohibir
 * eso es prohibir parafrasear, que es exactamente el valor que el producto
 * cobra.
 *
 * La pérdida que sí duele es la de un TÉRMINO DEL ÍNDICE: lo que la vacante
 * busca y el CV demostraba. Este proyecto ya midió esa fuga —un CV entró con 23
 * términos y salió con 16 aplicando lo que el panel ofrecía— y ningún guard la
 * veía, porque los cinco miraban el texto y ninguno miraba la vacante.
 */
export function droppedTerms(original: string, rewritten: string, index: TermIndex): string[] {
  const before = termsIn(index, original)
  const after = termsIn(index, rewritten)
  return [...before].filter((t) => !after.has(t))
}

/**
 * ¿La reescritura aporta algo, o dice lo mismo con otras palabras?
 *
 * La regla del CEO, textual: "si lo que sugerís como mejora es idéntico en un 90
 * a 100% no es mejora. De 89 para abajo sí". Se mide sobre el conjunto de
 * palabras, así que reordenar una oración no pasa por mejora.
 */
export function addsNothing(original: string, rewritten: string): boolean {
  const a = new Set(normalize(original).split(" ").filter(Boolean))
  const b = new Set(normalize(rewritten).split(" ").filter(Boolean))
  if (a.size === 0 || b.size === 0) return false

  let shared = 0
  for (const w of a) if (b.has(w)) shared++
  const union = new Set([...a, ...b]).size
  if (shared / union >= 0.9) return true

  /**
   * La otra cara, que el solapamiento solo no ve: la reescritura conserva TODO
   * el original y le cuelga una palabra. "Gestioné la agenda del consultorio" →
   * "…del consultorio médico" da 0,83 de solapamiento —pasaría— y no es una
   * mejora: es un adjetivo. Se mide la NOVEDAD real, en palabras con contenido.
   */
  const keepsEverything = shared === a.size
  if (!keepsEverything) return false
  let novel = 0
  for (const w of b) if (!a.has(w) && w.length >= 3) novel++
  return novel <= 1
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

export function loyalty(findings: Finding[], log: Resolution[]): LoyaltyResult {
  const byFinding = new Map(log.map((r) => [r.findingId, r]))
  const out: LoyaltyResult = { shown: [], suppressed: [], regressed: [] }

  for (const f of findings) {
    const closed = byFinding.get(f.id)
    if (!closed) {
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
  }
  const en: Record<GuardReason, string> = {
    stale: `The line changed since you read it.`,
    empty: `You returned an empty rewrite.`,
  }
  return (language === "en" ? en : es)[v.reason]
}

/**
 * ¿ESTO YA ESTÁ DICHO? La línea del CV a la que la propuesta se parece, o null.
 *
 * Contra la que reemplaza —cambiar tres palabras no es una mejora— y contra las
 * vecinas —dos viñetas que cuentan lo mismo gastan dos renglones en un dato—.
 * Una sola vara: el 90% del CEO (`addsNothing`).
 *
 * ── SON DOS PREGUNTAS Y SE RESPONDEN DISTINTO (medido contra la API, 2026-09-11)
 * Parecerse a OTRA viñeta es una decisión del usuario: la propuesta llega con
 * esa línea nombrada en un aviso y él elige. Parecerse a LA LÍNEA QUE REEMPLAZA
 * no es una decisión: es que no hay mejora, y eso ya tiene su respuesta honesta
 * —«ya está bien»—, que el panel pinta en verde. Medido sobre 15 líneas reales:
 * 3 volvían con el MISMO texto del usuario y un cartel de aviso encima, una de
 * ellas tras gastar cuatro llamadas.
 *
 * `contraElOriginal` es false donde no hay línea que reemplazar: al AGREGAR, el
 * «original» es el tema que el usuario confirmó, y que la redacción se le
 * parezca es exactamente lo que se le pidió.
 */
export function similarTo(s: Suggestion, ctx: GuardContext, contraElOriginal = true): string | null {
  const text = s.text.trim()
  if (!s.changed || !text) return null
  if (contraElOriginal && addsNothing(ctx.original, text)) return ctx.original
  return (ctx.siblings ?? []).find((otra) => otra.trim() && addsNothing(otra, text)) ?? null
}

/** Lo que se le dice al modelo cuando su propuesta se parece a una línea del CV. */
export function similarNudge(line: string, language: "es" | "en"): string {
  return language === "en"
    ? `This line of the CV already says it: "${line}". Your rewrite must add something different.`
    : `Eso ya lo dice esta línea del CV: "${line}". Tu reescritura tiene que aportar algo distinto.`
}

/** Lo que se le dice al modelo cuando su propuesta perdió algo de la línea. */
export function lossNudge(lost: string[], language: "es" | "en"): string {
  return language === "en"
    ? `You dropped information the original had: ${lost.join(", ")}. Keep it — a figure the original states is copied exactly, never turned into a slot.`
    : `Perdiste información que el original tenía: ${lost.join(", ")}. Conservala — una cifra que el original ya dice se copia tal cual, nunca se vuelve un hueco.`
}

// ─────────────────────────────────────────────────────────────────────────────
// LO QUE SE ARREGLA EN VEZ DE RECHAZARSE (CEO, 2026-09-11)
//
// «Si vas a solicitar métricas, está bien que las des en [%] y el usuario llene
// esa información — pero que la des. Lo que me das es un bloqueo, no una
// solución.» Estas tres funciones son lo que reemplazó a los rechazos por huecos
// y por contenido perdido: la propuesta llega siempre, arreglada donde el código
// puede probar cómo, y lo que no, a la vista en el antes/después.
// ─────────────────────────────────────────────────────────────────────────────

const HUECO = /\[[^\]]+\]/g

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
 * LO QUE LA PROPUESTA DEJÓ DE DECIR. No rechaza: el motor lo pide una vez más.
 *
 * Es la pregunta que `drops_content` contestaba con un rechazo, con la misma
 * vara: los términos de la vacante que la línea demostraba, las cifras del
 * candidato, y —en una fusión o una línea nueva— toda palabra con contenido de
 * lo que se borra o del tema confirmado. Una cifra que quedó precargada en su
 * hueco (`figureSlots`) NO cuenta como perdida: el usuario la ve escrita.
 */
export function lostContent(s: Suggestion, ctx: GuardContext): string[] {
  if (!s.changed || !s.text.trim()) return []
  const lost = droppedTerms(ctx.original, s.text, ctx.index)
  const precargadas = new Set(Object.values(figureSlots(ctx.original, s)).map((c) => c.replace(/^\$/, "")))
  lost.push(...droppedFigures(ctx.original, s.text.replace(HUECO, " ")).filter((c) => !precargadas.has(c)))
  if (ctx.mustKeep?.length) {
    // Por raíz de cuatro: «turnos» sobrevive como «turno», «confirmé» como «confirmando».
    const dicho = normalize(s.text).split(" ").filter(Boolean)
    lost.push(
      ...ctx.mustKeep
        .flatMap((linea) => normalize(linea).split(" ").filter((w) => w.length >= 4))
        .filter((w) => !dicho.some((d) => d === w || (d.length >= 4 && d.slice(0, 4) === w.slice(0, 4)))),
    )
  }
  return [...new Set(lost)]
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
