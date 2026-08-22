// lib/services/ai/shared/text-similarity.ts
// Safety net against no-op AI suggestions.
//
// The real fix for echoed suggestions is the response contract (return only the
// items you actually changed, and be allowed to return none). This is the belt
// to that pair of braces: if a model still hands back a near-copy of the input,
// drop it here rather than show the user a diff with nothing in it.
import { distance } from "fastest-levenshtein"
import { isKnownSkill } from "@/lib/ats/skills-dictionary"
import { WEAK_OPENERS } from "./bullet-quality"

/** Collapses whitespace/case/markers so only real edits register. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/^[\s•·]+|^[-*]+\s+/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.;,]+$/, "")
    .trim()
}

/**
 * Normalized Levenshtein similarity in [0, 1]. 1 = identical after normalization.
 */
export function normalizedSimilarity(a: string, b: string): number {
  const A = normalize(a)
  const B = normalize(b)
  if (!A && !B) return 1
  const longest = Math.max(A.length, B.length)
  if (longest === 0) return 1
  return 1 - distance(A, B) / longest
}

/**
 * Similarity at or above which an edit reads as an echo rather than a rewrite.
 *
 * No published threshold exists for "this edit is too trivial to show" — the
 * near-duplicate literature targets document-scale dedup, which does not
 * transfer to single sentences. 0.90 is a deliberate first guess, not a number
 * borrowed from a paper: calibrate it against real (original, suggested) pairs
 * from AIUsageLog before trusting it, and expect it to differ per endpoint.
 */
export const TRIVIAL_EDIT_SIMILARITY = 0.9

/**
 * True when `suggested` is not a real improvement over `original`: identical,
 * empty, or a near-copy. Callers drop these instead of surfacing a diff whose
 * two sides read the same.
 */
export function isTrivialEdit(original: string, suggested: string): boolean {
  if (!suggested.trim()) return true
  return normalizedSimilarity(original, suggested) >= TRIVIAL_EDIT_SIMILARITY
}

/** Significant words of a normalized string (drops leading markers, empties). */
function wordsOf(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean)
}

/**
 * Piso de similitud a partir del cual se ANALIZA si una casi-copia es un cambio
 * cosmético. NO es un umbral de descarte: por sí solo no tira nada.
 *
 * La regla del CEO —"90% de similitud para arriba, descartado como mejora"— la
 * aplica `TRIVIAL_EDIT_SIMILARITY = 0.9`, que sí descarta por parecido. Este
 * número más bajo sólo habilita una pregunta distinta: ¿se cambiaron palabras
 * reales por otras palabras reales sin agregar nada? Y esa pregunta tiene tres
 * salidas que PROTEGEN la mejora:
 *   · agregar sin quitar (enriquecer con vocabulario del oficio) → no es cosmético
 *   · corregir una palabra mal escrita → no es cosmético
 *   · sólo cuando entró una palabra Y salió otra sobre una frase casi idéntica
 *
 * Se probó subirlo a 0.9 y cayeron 4 tests que codifican justamente esa
 * diferencia: a 0.85 un cambio de sinónimos puro volvía a mostrarse como
 * "mejora", que es la otra cosa que el CEO no quiere ver.
 */
export const COSMETIC_REWORD_SIMILARITY = 0.82

/**
 * True when `suggested` merely rewords `original` with synonyms while carrying no
 * new information — a near-copy where real words were SUBSTITUTED for other real
 * words (e.g. "improve"→"strengthen", "helped reduce"→"reduced").
 *
 * Deliberately distinguished from two things that also read as near-copies but ARE
 * worth keeping:
 *   • a spelling/grammar fix — the changed word is a small in-word correction of an
 *     original token (levenshtein small), so it is NOT counted as a substitution;
 *   • an enrichment that ADDS a real keyword/metric — words are added but none are
 *     removed, so there is no substitution pair.
 * Only when BOTH a real word left and a real word came in (a swap) on an otherwise
 * near-identical sentence is it cosmetic.
 */
/** Abría con una apertura de tarea y ya no. La lista se LEE, no se repite. */
function fixesWeakOpener(original: string, suggested: string): boolean {
  const opens = (t: string) =>
    WEAK_OPENERS.some((w) => normalize(t).replace(/^[^a-z0-9]+/, "").startsWith(w))
  return opens(original) && !opens(suggested)
}

/**
 * ¿Las dos frases son «casi la misma», medido en palabras y no en caracteres?
 *
 * EL GATE DE CARACTERES SE QUEDA CORTO EN LÍNEAS CORTAS, y es aritmética: en
 * «Realicé arqueo de caja diario» cambiar una palabra de cinco mueve la
 * similitud a 0.79 —bajo el umbral, así que el análisis ni corría—; la MISMA
 * sustitución en una viñeta de once palabras da 0.895 y sí se cazaba. El defecto
 * no estaba en el umbral sino en la unidad: un cambio de sinónimo es igual de
 * cosmético en una frase corta que en una larga, y contar caracteres hace que el
 * largo decida.
 *
 * Contar palabras de CONTENIDO escala solo. El umbral de caracteres se queda
 * como el otro camino —cubre frases largas con mucha puntuación compartida— y
 * basta con que uno de los dos diga que son casi la misma.
 */
/**
 * 0.7, Y EL VALOR LO DECIDIÓ LA SUITE, NO EL CRITERIO.
 *
 * Medido: las reescrituras cosméticas caen en 0.50–0.75 y las buenas en
 * 0.00–0.50. Se solapan en 0.50, así que se probó bajar el umbral hasta ahí para
 * cazar también las líneas de dos o tres palabras. **Cayeron 7 tests**, y entre
 * ellos «keeps a weak-verb upgrade» y «keeps a bullet that adds a real, grounded
 * detail»: el guard había empezado a tirar mejoras reales, que es exactamente lo
 * que no puede pasar.
 *
 * En 0.7 se caza el caso reportado —«Realicé arqueo de caja diario» → «Efectué
 * arqueo de caja diario», que el gate de caracteres dejaba pasar por corta— y
 * ninguna reescritura buena se pierde.
 *
 * LO QUE QUEDA FUERA, dicho: una línea de dos o tres palabras de contenido
 * («Atendí clientes» → «Asistí clientes») todavía se escapa. Cazarla exige bajar
 * a 0.5 y ahí se lleva puestas las buenas. Además `proseRules` pide 16 palabras
 * mínimo, así que una viñeta así no debería existir — y si existe, el problema
 * es que es demasiado corta, no que la reformularon.
 */
const SAME_LINE_CONTENT_RATIO = 0.7

function nearlySameLine(original: string, suggested: string): boolean {
  if (normalizedSimilarity(original, suggested) >= COSMETIC_REWORD_SIMILARITY) return true
  const o = contentWords(original)
  const s = new Set(contentWords(suggested))
  if (o.length === 0) return false
  const kept = o.filter((w) => s.has(w) || [...s].some((x) => sameStem(w, x))).length
  // Sobre el lado MÁS LARGO: si la reescritura agregó información real, el
  // denominador crece y esto deja de ser «casi la misma frase» — que es
  // exactamente lo que queremos, porque agregar no es reformular.
  return kept / Math.max(o.length, contentWords(suggested).length) >= SAME_LINE_CONTENT_RATIO
}

export function isCosmeticReword(original: string, suggested: string): boolean {
  if (!suggested.trim()) return false
  /**
   * ARREGLAR UNA APERTURA DÉBIL NUNCA ES COSMÉTICO — es el trabajo pedido.
   *
   * «Worked on the payment module» → «Developed the payment module» cambia UNA
   * palabra sobre una frase idéntica, así que por forma parece un cambio de
   * sinónimos. No lo es: «Worked on» está en `WEAK_OPENERS` y es exactamente lo
   * que el propio panel señala como defecto. Descartarlo deja al usuario con el
   * aviso puesto y sin la corrección — el bucle «me lo marca y no me lo arregla».
   *
   * ESTE DEFECTO YA SE PAGÓ UNA VEZ, con el mismo guard: de seis viñetas
   * cambiaba una —la que arreglaba el «Participé en» que el panel acababa de
   * marcar— y el 90% idéntico tiraba el arreglo. Volvió a aparecer al medir la
   * similitud en palabras en vez de caracteres, y lo cazó la suite.
   */
  if (fixesWeakOpener(original, suggested)) return false
  if (!nearlySameLine(original, suggested)) return false

  const o = wordsOf(original)
  const s = wordsOf(suggested)
  const oSet = new Set(o)
  const sSet = new Set(s)
  const removed = o.filter((w) => !sSet.has(w))
  const added = s.filter((w) => !oSet.has(w))
  if (added.length === 0 || removed.length === 0) return false // pure add or pure delete — not a swap

  // A changed pair is a typo fix (keep) when the new word is a small in-word edit of
  // a removed word; a synonym swap (drop) when it is not close to anything removed.
  const isTypoFix = (a: string, r: string) => {
    const d = distance(a, r)
    return d > 0 && d <= Math.max(1, Math.floor(Math.min(a.length, r.length) * 0.34))
  }
  const addedReal = added.filter((a) => !removed.some((r) => isTypoFix(a, r)))
  const removedReal = removed.filter((r) => !added.some((a) => isTypoFix(a, r)))
  return addedReal.length > 0 && removedReal.length > 0
}

// Connective words that carry no content — dropping or adding one is not a
// meaningful change. EN + ES, so a bilingual bullet is judged the same way.
const CONTENT_STOPWORDS = new Set([
  // en
  "the", "and", "for", "with", "into", "while", "that", "this", "was", "were",
  "are", "been", "being", "its", "their", "our", "from", "than", "then", "your",
  // es
  "los", "las", "una", "uno", "del", "por", "con", "para", "que", "como", "sus",
  "sobre", "entre", "fue", "era", "son", "ser", "mas",
])

/** Content words (≥3 chars, not a stopword) with hyphens/slashes split out. */
function contentWords(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9áéíóúñ]+/i)
    .filter((w) => w.length >= 3 && !CONTENT_STOPWORDS.has(w))
}

/** Two words share a stem (mentoring ≈ mentored) — a long common prefix. Keeps a
 *  tense/morphology change from counting as a brand-new word. */
function sameStem(a: string, b: string): boolean {
  const min = Math.min(a.length, b.length)
  if (min < 4) return a === b
  let i = 0
  while (i < min && a[i] === b[i]) i++
  return i >= Math.ceil(min * 0.7)
}

/**
 * True when a token looks like a named technology / proper noun worth keeping —
 * internal capitals (RXSwift, GraphQL, iOS, PostgreSQL), camelCase, or a digit/tech
 * char (C++, C#, S3). `lowerWord` is the normalized token; `raw` is the original
 * text, scanned for the token's real casing since normalize() lowercased it away.
 * ATS parsers match these keywords exactly, so dropping one loses a real match.
 */
function isNamedToken(lowerWord: string, raw: string): boolean {
  if (isKnownSkill(lowerWord)) return true
  const token = raw
    .split(/[^A-Za-z0-9+#.]+/)
    .find((t) => t.toLowerCase().replace(/\.$/, "") === lowerWord)
  if (!token) return false
  if (/[0-9+#]/.test(token)) return true            // c++, c#, s3, 30
  if (/[A-Z].*[A-Z]/.test(token)) return true       // RXSwift, iOS, GraphQL, ALLCAPS
  if (/[a-z][A-Z]/.test(token)) return true         // camelCase (typeScript)
  return false
}

/**
 * True when `suggested` STRIPS meaningful content the original stated and puts
 * nothing concrete back — a lateral, lossy reword that reads as "different" but
 * says less. Two firing shapes:
 *   1. it drops a NAMED technology/keyword (RXSwift, GraphQL, iOS…) and adds no
 *      concrete replacement — "…patterns using RXSwift" → "…patterns" (a real ATS
 *      keyword thrown away); OR
 *   2. it drops ≥2 content words and adds nothing new — "…to enhance iOS app
 *      functionality" → "…into the iOS app".
 *
 * Distinct from the other guards: not a near-copy (isTrivialEdit), not a synonym
 * swap (isCosmeticReword), not a fabrication (hasHardCodedFact). Stem-aware so a
 * tense change (mentoring → mentored) is not a "new" word. Apply ONLY to an
 * already-strong bullet — a weak bullet legitimately loses filler when fixed.
 */
export function dropsContentWithoutGain(original: string, suggested: string): boolean {
  if (!suggested.trim()) return true
  const o = contentWords(original)
  const s = contentWords(suggested)
  const oSet = new Set(o)
  const sSet = new Set(s)
  const removed = o.filter((w) => !sSet.has(w))
  const added = s.filter((w) => !oSet.has(w))
  const addedReal = added.filter((a) => !removed.some((r) => sameStem(a, r)))
  const removedReal = removed.filter((r) => !added.some((a) => sameStem(a, r)))

  // A concrete gain: the rewrite brought in a NEW number (a metric — checked on the
  // raw text so short figures like "30" survive contentWords' length filter) or a
  // new named technology.
  const origNums = new Set(original.match(/\d+/g) ?? [])
  const addedNumber = (suggested.match(/\d+/g) ?? []).some((n) => !origNums.has(n))
  const addedConcrete = addedNumber || addedReal.some((a) => isNamedToken(a, suggested))
  // 1. Dropped a named keyword, replaced it with nothing concrete.
  const droppedNamed = removedReal.some((r) => isNamedToken(r, original))
  if (droppedNamed && !addedConcrete) return true
  // 2. Lateral lossy: the rewrite drops materially MORE content than it brings back
  //    (net loss of two-plus real words) and adds nothing concrete — a new number or
  //    named technology. A single swapped-in filler word ("ensuring"→"to maintain")
  //    used to let a 4-words-lost rewrite through; the NET test closes that.
  return removedReal.length - addedReal.length >= 2 && !addedConcrete
}

/**
 * Words that carry no information on their own — the mortar of a sentence, and
 * the raw material of padding. Only used to decide whether ADDED words said
 * anything; never to compare meaning.
 */
const FILLER_WORDS = new Set([
  // es
  "para", "por", "con", "de", "del", "la", "el", "los", "las", "un", "una", "y", "o", "que", "su", "sus",
  "mejorar", "mejorando", "asegurando", "garantizando", "optimizar", "optimizando", "manteniendo",
  "logrando", "permitiendo", "facilitando", "calidad", "eficiencia", "proceso", "procesos",
  "funcionamiento", "resultados", "correcto", "adecuado", "óptimo", "optimo", "general", "diario", "diaria",
  // en
  "to", "for", "with", "of", "the", "a", "an", "and", "or", "that", "its", "their",
  "improve", "improving", "ensure", "ensuring", "optimize", "optimizing", "maintaining",
  "achieving", "allowing", "enabling", "quality", "efficiency", "process", "processes",
  "operation", "results", "proper", "adequate", "optimal", "overall", "daily",
  // Measured live against the API: these are the words the model reaches for
  // when asked to improve a line that needs no improvement.
  "mantener", "su", "sus", "correcto", "correcta", "continuo", "continua",
  "keep", "keeping", "working", "order", "smooth", "effective", "successful",
])

/**
 * True when `suggested` says exactly what `original` said, only arranged
 * differently or with empty words bolted on.
 *
 * MEASURED GAP THIS CLOSES. `isTrivialEdit` catches near-copies and
 * `isCosmeticReword` catches synonym swaps, but two shapes walked straight past
 * both and reached the user labelled as improvements:
 *
 *   original  "Led the migration to SwiftUI across 4 apps, cutting crash rate 30%."
 *   reorder   "Led the SwiftUI migration across 4 apps, cutting crash rate 30%."
 *   padding   "…cutting crash rate 30% to improve quality."
 *
 * Both are the same sentence. The reorder moves words; the padding adds a clause
 * that states nothing — and padding is precisely what a model produces when it
 * is asked to improve a line that is already fine, which is now allowed to
 * happen because the model, not a rule, decides whether it can be improved.
 *
 * The guard exists to raise what the user is shown, so this is where the loop is
 * closed: the model may always answer, and an answer that adds nothing never
 * reaches the CV.
 */
/**
 * Content words present in `source` that `merged` no longer carries.
 *
 * FOR THE MERGE, whose whole promise is that nothing is lost. Every other guard
 * in this file answers "is the rewrite worth it?"; this answers "did the fusion
 * quietly drop half of what it was fusing?", and nothing answered that before.
 *
 * MEASURED, 2026-08-19: "Confirmé los turnos por teléfono el día anterior" fused
 * into "…confirmando por teléfono el día anterior" — the OBJECT of the sentence,
 * the appointments themselves, simply gone. No figure was lost so
 * `losesStatedFigure` was quiet; nothing was hard-coded so `hasHardCodedFact`
 * was quiet; and `dropsContentWithoutGain` can never fire on a merge, because a
 * merge always adds the other line's words and so always shows a "gain".
 *
 * Stem-tolerant on purpose: a fusion re-conjugates ("packed" → "packing",
 * "gestioné" → "gestionando"), and calling that a loss would reject every
 * correct merge.
 */
export function contentDroppedFrom(source: string, merged: string): string[] {
  const have = contentWords(merged)
  return contentWords(source).filter((w) => !have.some((h) => h === w || sameStem(w, h)))
}

export function addsNoInformation(original: string, suggested: string): boolean {
  if (!suggested.trim()) return true

  const o = wordsOf(original)
  const s = wordsOf(suggested)
  const oSet = new Set(o)
  const sSet = new Set(s)

  const added = s.filter((w) => !oSet.has(w))
  const removed = o.filter((w) => !sSet.has(w))

  // Same bag of words, different order: nothing was said that was not said.
  if (added.length === 0 && removed.length === 0) return true

  // Judged on CONTENT words only. A reorder usually drops or adds a preposition
  // on the way ("the migration to SwiftUI" → "the SwiftUI migration"), and
  // counting that as new information is how the reorder slipped through.
  const contentAdded = added.filter((w) => !FILLER_WORDS.has(w))
  const contentRemoved = removed.filter((w) => !FILLER_WORDS.has(w))

  // Every content word survived and none arrived: the sentence was rearranged
  // or padded. A single new content word — a tool, a scope, an object — makes it
  // a real addition; the bar is "said nothing", not "said little".
  if (contentAdded.length === 0 && contentRemoved.length === 0) return true

  return false
}

/**
 * ¿La reescritura habla de la viñeta que dice, o de otra del mismo puesto?
 *
 * MEDIDO CONTRA LA API REAL (2026-08-20, set STRONG, 33 propuestas): el modelo
 * devolvió para el índice 0 —"Managed post-operative care for 15 beds"— una línea
 * que reescribía la 1, "Reduced readmissions from 9% to 4% over two years".
 * Aplicarla habría borrado la de las 15 camas y dejado la de reingresos DOS veces.
 *
 * Nadie lo estaba cazando. Lo frenaba de rebote el guard de la cifra, porque el
 * "15" desaparecía — un accidente, no una defensa: la misma línea con las dos
 * viñetas sin números habría entrado igual. Y en cuanto ese guard dejó de
 * aplicarse de más, el hueco quedó a la vista.
 *
 * "El índice es pista, el texto es identidad" (`lib/ats/bullet-locate.ts`). Ahí la
 * identidad se resuelve por texto exacto porque se conoce la línea original; acá
 * lo que llega es una REESCRITURA, así que se pregunta de quién conserva el
 * asunto: qué proporción de las palabras con contenido de cada viñeta sobrevive.
 * Una reescritura de la viñeta j conserva el asunto de j.
 *
 * Margen exigente a propósito. Las viñetas de un mismo puesto hablan del mismo
 * trabajo y se parecen; mover una por diferencias de ruido sería peor que el
 * defecto. Sólo se reasigna cuando otra viñeta gana por un tercio y además el
 * ganador conserva la mitad de su asunto.
 *
 * @returns el índice al que la reescritura pertenece de verdad.
 */
export function rewriteBelongsTo(rewrite: string, bullets: string[], claimed: number): number {
  const words = contentWords(rewrite)
  if (words.length === 0 || bullets.length === 0) return claimed
  const kept = (bullet: string): number => {
    const own = contentWords(bullet)
    if (own.length === 0) return 0
    const hit = own.filter((w) => words.some((r) => r === w || sameStem(r, w))).length
    return hit / own.length
  }
  const claimedScore = claimed >= 0 && claimed < bullets.length ? kept(bullets[claimed]) : 0
  let bestIdx = claimed
  let bestScore = claimedScore
  bullets.forEach((b, i) => {
    if (i === claimed) return
    const s = kept(b)
    if (s > bestScore) { bestScore = s; bestIdx = i }
  })
  if (bestIdx === claimed) return claimed
  return bestScore >= 0.5 && bestScore - claimedScore >= 0.34 ? bestIdx : claimed
}
