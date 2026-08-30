// lib/ats3/guards.ts
//
// LO QUE DECIDE SI UNA SALIDA DEL MODELO LLEGA A LA PANTALLA.
//
// Un prompt es una petición, no un contrato. En volumen, el modelo va a nombrar
// una herramienta que no estaba y va a salir a producción. Estas comprobaciones
// son deterministas, corren sobre TODA salida, y son las que mandan: si el
// validador del modelo (P6) y este archivo discrepan, gana este archivo.
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
  buildTermIndex,
  type TermIndex,
  type Suggestion,
  type ResumeTree,
  type Finding,
  type Resolution,
  type NodeId,
} from "@/lib/ats3/contracts"
import { verbCollides, keywordsOverBudget, claimAlreadyMade, type Ledger } from "@/lib/ats3/ledger"

export type GuardReason =
  | "invented_term" // nombra algo que no está en el original ni en lo declarado
  | "invented_figure" // una cifra que el candidato nunca dio
  | "verb_collision" // ese verbo ya abre otra línea del CV
  | "keyword_over_budget" // el término ya aparece dos veces
  | "duplicate_claim" // ese logro ya tiene dueño
  | "drops_content" // se perdió información que el original tenía
  | "adds_nothing" // dice lo mismo con otras palabras
  | "too_many_placeholders" // más de dos huecos, o más de uno obligatorio
  | "placeholder_in_summary" // el resumen se exporta con un corchete a la vista
  | "wrong_person" // habla de la persona en tercera, o no la hace sujeto
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
  /** Habilidades declaradas por el usuario: autorizan a nombrar una herramienta. */
  declared: string[]
  ledger: Ledger
  /** El resumen no admite huecos: es la primera línea que se lee. */
  isSummary?: boolean
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
    const inventadaEnVariante = inventedFigure(variante, ctx.original, s)
    if (inventadaEnVariante) return fail("invented_figure", inventadaEnVariante)
    const inventadosEnVariante = inventedTerms(variante, ctx)
    if (inventadosEnVariante.length) return fail("invented_term", inventadosEnVariante.join(", "))
    // «Igual que el texto principal» era una promesa a medias: se le miraban los
    // huecos, la cifra y las herramientas, y NO la persona ni el contenido. Una
    // variante en tercera persona —o que se come el dato que la línea traía—
    // entra al CV por la puerta que existe para no poner un número inventado.
    const personaEnVariante = wrongPerson(variante)
    if (personaEnVariante) return fail("wrong_person", personaEnVariante)
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

  if (s.placeholders.length > 2) return fail("too_many_placeholders", `${s.placeholders.length} huecos`)
  if (s.placeholders.filter((p) => p.required).length > 1) {
    return fail("too_many_placeholders", "más de un hueco obligatorio")
  }

  const persona = wrongPerson(text)
  if (persona) return fail("wrong_person", persona)

  const invented = inventedTerms(text, ctx)
  if (invented.length) return fail("invented_term", invented.join(", "))

  const figure = inventedFigure(text, ctx.original, s)
  if (figure) return fail("invented_figure", figure)

  if (verbCollides(ctx.ledger, s.actionVerb)) {
    return fail("verb_collision", s.actionVerb)
  }

  const over = keywordsOverBudget(ctx.ledger, s.keywordsUsed)
  if (over.length) return fail("keyword_over_budget", over.join(", "))

  const dup = claimAlreadyMade(ctx.ledger, s.claim)
  if (dup) return fail("duplicate_claim", dup)

  const lost = droppedTerms(ctx.original, text, ctx.index)
  if (lost.length) return fail("drops_content", lost.join(", "))

  // El texto de los huecos no cuenta: "[n%]" no conserva la cifra, la pide.
  const cifras = droppedFigures(ctx.original, text.replace(/\[[^\]]*\]/g, " "))
  if (cifras.length) return fail("drops_content", cifras.join(", "))

  if (addsNothing(ctx.original, text)) {
    return fail("adds_nothing", "la reescritura dice lo mismo con otras palabras")
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
 * fuertes del idioma. Ese lado lo cubren el prompt y P6 — decirlo es mejor que
 * fingir que el código lo cubre.
 */
export function wrongPerson(text: string): string | null {
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
  if (/[^aeiouáéíóú]o$/.test(limpia)) {
    return `"${primera}" no es un pasado en primera persona: habla de otro, está en presente, o es un sustantivo`
  }
  if (/(ar|er|ir)$/i.test(limpia)) return `"${primera}" es un infinitivo, no lo que la persona hizo`
  return null
}

/**
 * Términos que la reescritura nombra y el candidato nunca declaró.
 *
 * ── LA LÍNEA, QUE ES LO ÚNICO SUTIL DE TODO EL MOTOR ───────────────────────
 * Está prohibido afirmar un HECHO NUEVO sobre la persona: una herramienta que no
 * usó, un empleador, una certificación. NO está prohibido —es el valor que el
 * producto cobra— nombrar en qué CONSISTE el trabajo que ella dijo hacer: un
 * arqueo ES cuadrar efectivo, comprobantes y diferencias.
 *
 * Por eso la vara NO es "palabras que no estaban antes". Eso se midió en este
 * proyecto y rechaza por igual el caso malo y los dos enriquecimientos que se
 * cobran. La vara es más angosta: sólo se miran los TÉRMINOS DEL ÍNDICE —los que
 * la vacante nombra y los que el CV declara—, porque ésos son los que se
 * atribuyen como capacidad. Una palabra común nueva describe el oficio; un
 * término del índice que aparece de la nada es una capacidad inventada.
 */
export function inventedTerms(text: string, ctx: GuardContext): string[] {
  const declaredIndex = buildTermIndex(ctx.declared.map((d) => ({ canonical: d, variants: [] })))
  const inNew = termsIn(ctx.index, text)
  const inOld = termsIn(ctx.index, ctx.original)
  const inDeclared = termsIn(declaredIndex, ctx.declared.join(" . "))

  const out: string[] = []
  for (const term of inNew) {
    if (inOld.has(term)) continue
    // Declarado por el usuario en sus habilidades: puede nombrarse.
    if (inDeclared.has(term) || ctx.declared.some((d) => normalize(d) === normalize(term))) continue
    // La línea original YA HABLA de eso, sólo que con otras palabras.
    if (supportedByOriginal(term, ctx.original)) continue
    out.push(term)
  }
  return out
}

/**
 * ¿La línea original respalda este término, aunque no lo nombre igual?
 *
 * ── EL FALSO POSITIVO QUE ESTO CIERRA, MEDIDO CONTRA LA API ────────────────
 * "Atendí a los clientes en la línea de cajas" → "Realicé atención al público
 * en línea de cajas…". La vacante pide "atención al público" y la línea original
 * ES atención al público: el guard lo marcaba como una capacidad afirmada de la
 * nada y RECHAZABA la reescritura. Medido: 3 de 3 rechazadas, dos por esto.
 *
 * Un guard así no protege nada — deja el producto sin producto, porque tejer el
 * término que la vacante busca es literalmente para lo que sirve.
 *
 * La vara: el término comparte una RAÍZ con lo que la línea ya dice. "atención"
 * y "atendí" comparten "aten"; "SAP" y "stock del depósito" no comparten nada, y
 * ése sigue rechazado. La raíz corta funciona igual en los dos idiomas y no
 * necesita diccionario.
 */
function supportedByOriginal(term: string, original: string): boolean {
  const source = normalize(original).split(" ").filter((w) => w.length >= 4)
  const words = normalize(term).split(" ").filter((w) => w.length >= 4)
  if (words.length === 0 || source.length === 0) return false

  /**
   * ── DÓNDE TERMINA LO QUE EL CÓDIGO PUEDE PROBAR ────────────────────────────
   *
   * Basta con que UNA palabra con contenido del término ya viva en la línea.
   * Las dos varas más estrictas se midieron contra la API y las dos rechazan
   * trabajo legítimo:
   *
   *   - "todas las palabras": "atención al público" contra "Atendí a los
   *     clientes" exige que diga "público", y rechaza una reescritura correcta.
   *   - "la palabra más específica": rechazó 3 de 15 líneas en cinco oficios —
   *     "control de calidad de cordón" sobre "Revisé que las piezas salieran
   *     bien", "manejo de grupo" sobre "Di clases a los chicos". Las dos son
   *     exactamente lo que el producto tiene que hacer: tejer el término que la
   *     vacante busca en el trabajo que la persona ya describió.
   *
   * Lo que esta vara deja pasar —"Gestión de Salesforce" apoyada sólo en la
   * palabra "gestión"— NO queda sin dueño: es el caso que P6 juzga, y en la
   * misma medición lo hizo bien (cazó "sistema clínico" como entidad que el
   * original no sostiene). El código decide lo que puede PROBAR; lo semántico
   * tiene un verificador, y el veredicto final sigue siendo del código.
   */
  return words.some((w) => source.some((s) => shareRoot(w, s)))
}

/**
 * Dos palabras que comparten una raíz de cuatro letras son la misma idea.
 *
 * Cuatro y no cinco, medido: "atención" y "atendí" comparten "aten" y son lo
 * mismo; con cinco ("atenc" contra "atend") el guard las daba por distintas y
 * rechazaba la reescritura buena.
 */
function shareRoot(a: string, b: string): boolean {
  if (a.length < 4 || b.length < 4) return false
  return a.slice(0, 4) === b.slice(0, 4)
}

/**
 * Una cifra que el candidato nunca dio.
 *
 * Un hueco tipado NO es una violación: es exactamente lo que el producto pide —
 * el modelo propone el tamaño, el candidato pone el número. Lo prohibido es el
 * número presentado como hecho.
 */
export function inventedFigure(text: string, original: string, s: Suggestion): string | null {
  const before = digitsOf(original)
  // El texto de los huecos no cuenta como cifra: "[x%]" no afirma nada.
  const withoutSlots = text.replace(/\[[^\]]*\]/g, " ")
  for (const d of digitsOf(withoutSlots)) {
    if (!before.has(d)) return d
  }
  void s
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
    invented_term: `Nombraste algo que no está en la línea original ni en las habilidades declaradas: ${v.detail}. Sacalo.`,
    invented_figure: `Escribiste la cifra ${v.detail}, que el candidato nunca dio. Usá un hueco tipado o dejá la línea sin número.`,
    verb_collision: `El verbo "${v.detail}" ya abre otra línea de este CV. Elegí otro.`,
    keyword_over_budget: `Estos términos ya aparecen dos veces en el CV: ${v.detail}. No los repitas.`,
    duplicate_claim: `Ese logro ya está contado en otra viñeta ("${v.detail}"). Escribí sobre otra cosa de esta línea.`,
    drops_content: `Perdiste información que el original tenía: ${v.detail}. Conservala.`,
    adds_nothing: `Tu reescritura dice lo mismo con otras palabras. O aporta algo, o devolvé changed: false.`,
    too_many_placeholders: `Demasiados huecos (${v.detail}). Máximo dos, y sólo uno obligatorio.`,
    placeholder_in_summary: `El resumen no lleva huecos: se exporta tal cual.`,
    wrong_person: `${v.detail}. Escribí lo que la persona HIZO, en pasado y en primera persona implícita: "Controlé", no "Controló" ni "Controlar".`,
    stale: `La línea cambió desde que la leíste.`,
    empty: `Devolviste una reescritura vacía.`,
  }
  const en: Record<GuardReason, string> = {
    invented_term: `You named something absent from the original line and from the declared skills: ${v.detail}. Remove it.`,
    invented_figure: `You wrote the figure ${v.detail}, which the candidate never provided. Use a typed slot or leave the line without a number.`,
    verb_collision: `The verb "${v.detail}" already opens another line in this CV. Pick a different one.`,
    keyword_over_budget: `These terms already appear twice in the CV: ${v.detail}. Do not repeat them.`,
    duplicate_claim: `That achievement is already told in another bullet ("${v.detail}"). Write about something else in this line.`,
    drops_content: `You dropped information the original had: ${v.detail}. Keep it.`,
    adds_nothing: `Your rewrite says the same thing in different words. Either add something, or return changed: false.`,
    too_many_placeholders: `Too many slots (${v.detail}). At most two, and only one required.`,
    placeholder_in_summary: `The summary carries no slots: it is exported as-is.`,
    wrong_person: `${v.detail}. Write what the person DID, in the past tense and implicit first person.`,
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
