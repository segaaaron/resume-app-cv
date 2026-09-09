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

export type GuardReason =
  /**
   * REPITE ALGO QUE EL CV YA DICE — el único guard que JUZGA (CEO, 2026-09-09).
   *
   * «Los guards que tengas tienen que cumplir sólo que no se cree viñetas
   * similares.» Eran dos razones para la misma pregunta: `adds_nothing`
   * comparaba contra la línea original y `duplicate_claim` contra las otras
   * viñetas. Es una sola cosa —¿esto ya está dicho?— y ahora se contesta una
   * sola vez, con una sola vara: el 90% del CEO.
   */
  | "repeats"
  | "drops_content" // se perdió información que el original tenía
  | "too_many_placeholders" // más de dos huecos, o más de uno obligatorio
  | "placeholder_in_summary" // el resumen se exporta con un corchete a la vista
  | "stale" // se pensó sobre una versión que ya no existe
  | "empty" // no hay texto que entregar

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
   * LAS DOS LÍNEAS DE UNA FUSIÓN, cuando la hay.
   *
   * ── POR QUÉ LA FUSIÓN NECESITA UNA VARA MÁS DURA ─────────────────────────
   * `drops_content` mira los términos de la VACANTE y las cifras: es la vara
   * correcta para una reescritura, donde lo demás sigue escrito en el CV aunque
   * la línea cambie. En una fusión no: la segunda línea SE BORRA, así que
   * cualquier cosa suya que no entre en el resultado no vuelve de ningún lado.
   *
   * Medido con el par que el CEO puso de ejemplo —«Gestioné la agenda» /
   * «Confirmé los turnos por teléfono»—: no hay ni un término del aviso ni una
   * cifra, así que el guard general las daba por buenas aunque el resultado se
   * comiera la mitad. El motor viejo tenía esta comprobación con el nombre
   * `contentDroppedFrom` y se perdió al construir v3 de cero.
   *
   * Sólo corre en una fusión: aplicarla a toda reescritura prohibiría acortar,
   * que es la mitad del valor del producto.
   */
  mergeOf?: [string, string]
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
  /** El resumen no admite huecos: es la primera línea que se lee. */
  isSummary?: boolean
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

  if (ctx.isSummary && (s.placeholders.length > 0 || /\[[^\]]+\]/.test(text))) {
    return fail("placeholder_in_summary", "el resumen no puede exportarse con un hueco sin llenar")
  }

  /**
   * LA VARIANTE SE JUZGA IGUAL QUE EL TEXTO PRINCIPAL.
   *
   * Es lo que se escribe cuando el usuario dice "no tengo ese dato", así que
   * entra al CV con exactamente el mismo peso — y durante un rato no la miraba
   * nadie: una cifra ahí, o un corchete olvidado, pasaba de largo. El botón que
   * existe para NO poner un número inventado era la puerta por la que entraba.
   */
  const variante = s.variantWithoutMetric?.trim()
  if (variante) {
    if (/\[[^\]]+\]/.test(variante)) {
      return fail("too_many_placeholders", "la variante sin cifra conserva un hueco sin llenar")
    }
    // «Igual que el texto principal» era una promesa a medias: se le miraban los
    // huecos, la cifra y las herramientas, y NO la persona ni el contenido. Una
    // variante en tercera persona —o que se come el dato que la línea traía—
    // entra al CV por la puerta que existe para no poner un número inventado.
    const perdidoEnVariante = droppedTerms(ctx.original, variante, ctx.index)
    if (perdidoEnVariante.length) return fail("drops_content", perdidoEnVariante.join(", "))
    /**
     * Y LA VARIANTE ES JUSTO LA QUE MÁS TIENTA A BORRARLA.
     *
     * Se escribe para el candidato que NO tiene el dato, así que el modelo la
     * redacta sin números — y si el original ya traía uno, se lo lleva puesto.
     * El botón que existe para no poner una cifra que nadie dio no puede ser el
     * que borra la que el candidato sí dio.
     */
    const cifrasEnVariante = droppedFigures(ctx.original, variante)
    if (cifrasEnVariante.length) return fail("drops_content", cifrasEnVariante.join(", "))
  }

  /**
   * EL HUECO ES UN HUECO, NO LA FICHA DEL HUECO.
   *
   * ── MEDIDO CONTRA LA API (2026-08-29) ──────────────────────────────────────
   * El motor entregó esta línea, y es lo que se habría escrito en el CV:
   *
   *   "…brindando atención al público durante el cobro y pago en caja
   *    [n personas; escala de flujo de caja; evidencia: cantidad aproximada de
   *    clientes atendidos por turno o por día]."
   *
   * El modelo volcó DENTRO del texto la etiqueta, la pista y la evidencia, que
   * son campos del hueco y viven en la pantalla de confirmación. El candidato
   * habría visto ese bloque en su currículum. El texto lleva el token y nada
   * más; lo demás se muestra al lado.
   *
   * Se rechaza en vez de recortarse porque recortar un corchete a la mitad
   * escribe una frase partida en el CV de alguien, y el reintento le dice al
   * modelo exactamente qué hizo mal.
   */
  /**
   * La vara: el punto y coma —que es como el modelo encadena los campos— o un
   * corchete larguísimo. NO un tope corto: medido, con 25 caracteres rechazaba
   * "[n camiones descargados por semana]", que es un hueco perfectamente bueno.
   * El derrame real que se midió tenía ciento diez caracteres y dos puntos y
   * coma; un hueco honesto no llega a sesenta.
   */
  const huecoSucio = text.match(/\[[^\]]{60,}\]|\[[^\]]*;[^\]]*\]/)
  if (huecoSucio) {
    return fail("too_many_placeholders", `el hueco lleva su ficha adentro del texto: ${huecoSucio[0].slice(0, 60)}`)
  }
  /**
   * NI LA FICHA AL LADO DEL HUECO.
   *
   * Medido en la corrida siguiente: el modelo sacó los campos del corchete y los
   * pegó afuera —"[n] (SCALE; label: pallet volume; hint: …)"—, así que el
   * chequeo de arriba, que mira DENTRO del corchete, ya no los veía.
   *
   * Lo que se busca son NUESTROS propios nombres de campo y de tipo: no es una
   * lista de vocabulario del oficio, es el contrato de este motor apareciendo
   * donde no va. Si el texto lo nombra, el modelo volcó la ficha en el CV.
   */
  /**
   * ── Y POR QUÉ ESTA VARA ES EXACTA, MEDIDO ──────────────────────────────────
   * La primera versión buscaba los tipos SIN distinguir mayúsculas, y con eso
   * rechazaba trabajo legítimo: "Weighed products on the floor scale",
   * "deployment frequency", "handled money transfers" — tres oficios distintos,
   * tres líneas buenas tiradas. Un guard demasiado estricto no es seguro: borra
   * el producto.
   *
   * El derrame se reconoce por la FORMA de nuestro contrato, no por la palabra:
   * los tipos viajan en MAYÚSCULAS (son el enum) y los campos siempre con sus
   * dos puntos. Una persona que escribe "scale" en su currículum no escribe
   * "SCALE".
   */
  const fichaAfuera = new RegExp(`\\b(${METRIC_TYPES.join("|")})\\b|\\b(label|hint|evidenceNeeded)\\s*:`)
  const derrame = text.match(fichaAfuera)
  if (derrame) {
    return fail("too_many_placeholders", `la ficha del hueco se derramó al texto: ${derrame[0]}`)
  }

  /**
   * DOS HUECOS, Y LOS DOS PUEDEN SER OBLIGATORIOS (CEO, 2026-09-09).
   *
   * Acá vivía un segundo techo —"máximo UN hueco obligatorio"— que yo escribí y
   * nadie pidió. Rechazaba exactamente la forma que el CEO especificó:
   *
   *   "…mejor experiencia de usuario de [x usuarios] mejorando también los
   *    servicios en un [x%]"
   *
   * Dos cifras, las dos del candidato, las dos necesarias para que la línea
   * diga algo. Con el techo viejo una de las dos tenía que declararse opcional
   * — y un hueco opcional sin llenar se ESCRIBÍA EN EL CV con el corchete a la
   * vista, porque la hoja de confirmación sólo frenaba por los obligatorios.
   * El techo no protegía nada: empujaba el defecto de una puerta a la otra.
   *
   * El tope de dos huecos por línea se queda: tres cifras en una viñeta es un
   * formulario, no una línea de currículum. La salida para quien no tiene el
   * dato sigue siendo la versión sin cifra, que es una decisión suya y no un
   * corchete olvidado.
   */
  if (s.placeholders.length > 2) return fail("too_many_placeholders", `${s.placeholders.length} huecos`)

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

  const lost = droppedTerms(ctx.original, text, ctx.index)
  if (lost.length) return fail("drops_content", lost.join(", "))

  // El texto de los huecos no cuenta: "[n%]" no conserva la cifra, la pide.
  const cifras = droppedFigures(ctx.original, text.replace(/\[[^\]]*\]/g, " "))
  if (cifras.length) return fail("drops_content", cifras.join(", "))

  /**
   * ¿ESTO YA ESTÁ DICHO? Contra la línea que reemplaza y contra las demás.
   *
   * Las dos superficies, una sola vara —el 90% del CEO, `TRIVIAL_EDIT_SIMILARITY`—
   * y una sola razón. Contra el original: cambiar tres palabras no es una mejora
   * y no vale gastarte una consulta. Contra las vecinas: dos viñetas que cuentan
   * el mismo trabajo gastan dos renglones en un solo dato.
   */
  if (addsNothing(ctx.original, text)) return fail("repeats", ctx.original)

  /**
   * UNA VIÑETA NO PUEDE SALIR IGUAL A OTRA DEL CV (CEO, 2026-09-09).
   *
   * `duplicate_claim` preguntaba por el `claim` que el modelo DECLARA, y
   * `addsNothing` compara la reescritura contra SU PROPIO original. Entre las
   * dos quedaba el hueco: nada miraba el TEXTO de las líneas vecinas, así que
   * una reescritura podía volver prácticamente calcada a otra viñeta del mismo
   * CV y pasar los doce chequeos.
   *
   * Se mide con la misma función y la misma vara que ya usa este archivo —el
   * 90% del CEO, `TRIVIAL_EDIT_SIMILARITY`—: dos varas para «¿esto es lo
   * mismo?» terminan discrepando, y este proyecto ya pagó esa clase de defecto.
   */
  const gemela = (ctx.siblings ?? []).find((otra) => otra.trim() && addsNothing(otra, text))
  if (gemela) return fail("repeats", gemela)

  /**
   * UNA FUSIÓN CONSERVA LO QUE DECÍAN LAS DOS. Sin excepción.
   *
   * Se mide por palabra con contenido —cuatro letras o más— y por raíz de
   * cuatro, la misma vara que el resto del archivo: «turnos» sobrevive como
   * «turno», y «confirmé» como «confirmando». Una fusión no tiene por qué
   * repetir las palabras exactas; tiene que no perder de qué hablaban.
   */
  if (ctx.mergeOf) {
    const dicho = normalize(text).split(" ").filter(Boolean)
    const perdidas = ctx.mergeOf
      .flatMap((linea) => normalize(linea).split(" ").filter((w) => w.length >= 4))
      .filter((w) => !dicho.some((d) => d === w || (d.length >= 4 && d.slice(0, 4) === w.slice(0, 4))))
    if (perdidas.length) return fail("drops_content", [...new Set(perdidas)].join(", "))
  }

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
    drops_content: `Perdiste información que el original tenía: ${v.detail}. Conservala.`,
    repeats: `Eso ya lo dice esta línea del CV: "${v.detail}". Tu reescritura tiene que aportar algo distinto, o devolvé changed: false.`,
    too_many_placeholders: `Demasiados huecos (${v.detail}). Máximo dos, y sólo uno obligatorio.`,
    placeholder_in_summary: `El resumen no lleva huecos: se exporta tal cual.`,
    stale: `La línea cambió desde que la leíste.`,
    empty: `Devolviste una reescritura vacía.`,
  }
  const en: Record<GuardReason, string> = {
    drops_content: `You dropped information the original had: ${v.detail}. Keep it.`,
    repeats: `This line of the CV already says it: "${v.detail}". Your rewrite must add something different, or return changed: false.`,
    too_many_placeholders: `Too many slots (${v.detail}). At most two, and only one required.`,
    placeholder_in_summary: `The summary carries no slots: it is exported as-is.`,
    stale: `The line changed since you read it.`,
    empty: `You returned an empty rewrite.`,
  }
  return (language === "en" ? en : es)[v.reason]
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
