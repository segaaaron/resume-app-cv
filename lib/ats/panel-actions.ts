import type { ReportCheck } from "./report"
import type { SkillItem, WorkExperienceItem } from "@/types/resume"
import { displaySkill } from "@/lib/skills/skill-catalog"
import { findDuplicateSkill } from "@/lib/skills/skill-dedup"
import { isPlausibleSkill } from "@/lib/skills/skill-validation"
import { roleRecency } from "@/lib/ats/resume-integrity"

// lib/ats/panel-actions.ts
//
// LO QUE PASA CUANDO EL USUARIO APRIETA UN BOTÓN DEL PANEL.
//
// ── POR QUÉ SE FUSIONARON (CEO, 2026-08-28) ─────────────────────────────────
//
// Cinco archivos con UN SOLO consumidor cada uno: el panel. Sacarlos del
// componente de 1.700 líneas fue correcto —adentro no se podían probar—, pero
// hacer cinco archivos en vez de uno fue el exceso.
//
// La responsabilidad es una: decidir, fuera del componente, qué le pasa al CV
// cuando se acepta un arreglo. Cada decisión sigue siendo una función pura.


// ─────────────────────────────────────────────────────────────────────────
// role-order
// ─────────────────────────────────────────────────────────────────────────
/**
 * REORDENAR LA EXPERIENCIA, DEL PUESTO MÁS RECIENTE AL MÁS ANTIGUO.
 *
 * ── POR QUÉ VIVE ACÁ Y NO DENTRO DEL PANEL ─────────────────────────────────
 *
 * Reordena el historial laboral del usuario: si se equivoca, le mueve los
 * puestos de sitio en su propio CV. Vivía dentro de un componente de 1.700
 * líneas, donde lo único que un test podía hacer era comprobar que la línea
 * existiera. Acá se ejecuta con historiales de verdad y se lee qué sale.
 *
 * ── LA REGLA SUTIL, QUE ES TODA LA FUNCIÓN ─────────────────────────────────
 *
 * UN PUESTO SIN FECHA LEGIBLE CONSERVA SU POSICIÓN. No se manda al final ni se
 * adivina dónde va: los puestos con fecha se ordenan entre sí ocupando las
 * posiciones que los puestos con fecha YA ocupaban, y los demás se quedan donde
 * estaban. Así un historial a medio fechar se mejora, nunca se revuelve.
 *
 * Inventar un orden es el mismo tipo de daño que inventar una fecha: el CV
 * termina afirmando algo que el candidato no dijo.
 *
 * `null` = ya está en orden y no hay nada que aplicar. Que no es lo mismo que
 * «no se pudo»: el panel necesita distinguirlos para no ofrecer un botón que
 * responda «ya estaba bien» al hallazgo que acaba de señalar el desorden.
 */
export function planRoleReorder(work: readonly WorkExperienceItem[]): WorkExperienceItem[] | null {
  if (work.length < 2) return null

  // La MISMA lectura que usa el chequeo. Antes esto parseaba sólo MM/AAAA y
  // trataba un año pelado como ilegible, así que en un CV escrito «2015 – 2016»
  // todas las filas puntuaban `null`, no se ordenaba nada, y el botón respondía
  // «ya está en orden» justo al hallazgo que acababa de decir lo contrario.
  const rank = (j: WorkExperienceItem): number | null =>
    roleRecency({
      jobTitle: j.jobTitle,
      startDate: j.startDate,
      endDate: j.endDate,
      currentlyWorking: j.currentlyWorking,
    })

  const dated = work.map((j, i) => ({ j, i, r: rank(j) })).filter((x) => x.r !== null)
  if (dated.length < 2) return null

  const slots = dated.map((x) => x.i)
  // Empate por fecha: gana el que ya venía primero. Sin este desempate el orden
  // de dos puestos del mismo año dependería del algoritmo de sort.
  const sorted = [...dated].sort((a, b) => (b.r as number) - (a.r as number) || a.i - b.i)
  if (sorted.every((x, k) => x.i === slots[k])) return null

  const next = [...work]
  slots.forEach((slot, k) => { next[slot] = sorted[k].j })
  return next
}


// ─────────────────────────────────────────────────────────────────────────
// summary-splice
// ─────────────────────────────────────────────────────────────────────────
// lib/ats/summary-splice.ts
//
// A fix that rewrites ONE sentence must not overwrite the whole paragraph.
//
// Reported, and it is the worst thing this panel has done: the analyst quoted a
// single sentence of a summary, criticised it, and offered a better version of
// THAT sentence. Applying it replaced the entire summary with the one sentence.
// Measured on the real case: 56 words down to 24, and gone with them were "7
// years", "UIKit", "SwiftUI", "unit and UI testing" and a 15% figure — the four
// things a recruiter actually reads. The tool made the résumé worse and called it
// a fix.
//
// The rule here is the same one the bullet guards already enforce: never accept a
// rewrite that DROPS content without adding any. Applied to a paragraph, that
// means finding the sentence the rewrite is about and swapping only that one.
//
// Pure and deterministic — no model decides where the text goes.

/** Splits prose into sentences, keeping their terminator. */
/**
 * LAS PALABRAS DEL EMPALME — y por qué NO usa `contentWords` compartida.
 *
 * ── SE INTENTÓ UNIFICARLA Y LA MEDICIÓN LO TUMBÓ (2026-08-28) ──────────────
 *
 * Parecía la misma pregunta que `contentWords`, pero no lo es: aquélla descarta
 * las palabras vacías, y acá el solapamiento se mide sobre TODAS las palabras
 * porque lo que se compara son dos trozos del MISMO párrafo, donde los artículos
 * y las preposiciones son parte de la frase que se quiere reconocer.
 *
 * Medido sobre la huella de 1.671 comparaciones: al cambiarla, `spliceSummary`
 * pasó a devolver un FRAGMENTO donde antes devolvía el resumen entero — que es
 * exactamente lo que este módulo existe para impedir. El caso del banco de CVs
 * no lo cazó porque su umbral acepta las dos respuestas.
 */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9+#.]+/)
    .filter((w) => w.length > 2)
}

function sentencesOf(text: string): string[] {
  return text.match(/[^.!?]+[.!?]*\s*/g)?.map((s) => s.trim()).filter(Boolean) ?? []
}


/** Share of the shorter side's words that both texts share. */
function overlap(a: string, b: string): number {
  const A = new Set(words(a))
  const B = new Set(words(b))
  if (A.size === 0 || B.size === 0) return 0
  let shared = 0
  for (const w of A) if (B.has(w)) shared++
  return shared / Math.min(A.size, B.size)
}

/**
 * Enough of the rewrite's vocabulary must come from a sentence for us to believe
 * the rewrite is ABOUT that sentence. Below this it is a new paragraph, not a
 * repair, and splicing it in would be guessing.
 */
const SAME_SUBJECT = 0.5

/**
 * How much shorter a replacement may be before we treat it as a fragment rather
 * than a new summary. A genuine full rewrite lands near the original's length; a
 * single sentence offered for a three-sentence paragraph does not.
 */
const FRAGMENT_RATIO = 0.7

/**
 * The summary as it should be written after applying `replacement`.
 *
 * - Replacement roughly as long as the original → a real full rewrite, used as is.
 * - Clearly shorter AND clearly about one sentence → that sentence is swapped and
 *   everything else survives untouched.
 * - Clearly shorter and about nothing in particular → null. Refusing is correct:
 *   we cannot place it, and overwriting the paragraph is how the content was lost
 *   in the first place.
 */
export function spliceSummary(current: string, replacement: string): string | null {
  const cur = current.trim()
  const next = replacement.trim()
  if (!next) return null
  if (!cur) return next

  const curWords = words(cur).length
  const nextWords = words(next).length
  if (curWords === 0 || nextWords / curWords >= FRAGMENT_RATIO) return next

  const parts = sentencesOf(cur)
  if (parts.length < 2) return next

  let bestIndex = -1
  let best = 0
  parts.forEach((sentence, i) => {
    const score = overlap(sentence, next)
    if (score > best) { best = score; bestIndex = i }
  })
  if (bestIndex < 0 || best < SAME_SUBJECT) return null

  const spliced = [...parts]
  spliced[bestIndex] = next
  return spliced.join(" ").replace(/\s+/g, " ").trim()
}


// ─────────────────────────────────────────────────────────────────────────
// skill-add
// ─────────────────────────────────────────────────────────────────────────
/**
 * QUÉ PASA CUANDO SE AGREGA UNA HABILIDAD AL CV, decidido fuera del componente.
 *
 * ── POR QUÉ VIVE ACÁ Y NO DENTRO DEL PANEL ─────────────────────────────────
 *
 * Esta decisión escribe en el CV del usuario, y vivía dentro de un componente de
 * 1.744 líneas mezclada con toasts, estado local y un re-scoring. Ahí el único
 * test posible era leer que la línea existiera — y un test que lee el código da
 * verde con la función desconectada. El proyecto ya pagó exactamente eso con
 * `applyAllPlan`: el bucle vivía dentro del componente y el test que lo "cubría"
 * pasaba con la función sin conectar.
 *
 * Acá se ejecuta y se lee lo que devuelve. El componente se queda con lo suyo:
 * avisar y escribir.
 *
 * ── LAS TRES RESPUESTAS, Y POR QUÉ SON TRES Y NO UN BOOLEANO ───────────────
 *
 * «No se pudo» y «ya estaba» le piden cosas distintas al usuario: la primera
 * dice que ese término no es una habilidad suya, la segunda que ya la tiene
 * escrita de otra forma. Un booleano las juntaba y el panel tenía que adivinar
 * cuál mensaje mostrar.
 */

export type SkillAddPlan =
  /** No parece una habilidad: es su empleador, su ciudad o su propio cargo. */
  | { kind: "not_a_skill"; term: string }
  /** Ya está, tal cual o bajo otra grafía. Se marca como puesta igual. */
  | { kind: "already_there"; name: string }
  /** Entra, con el nombre normalizado y la fila lista. */
  | { kind: "add"; name: string; skills: SkillItem[] }

/**
 * Las comillas y la puntuación con que el modelo devuelve un término.
 *
 * El modelo entrecomilla («"Salesforce"») y cierra con punto o coma según dónde
 * caiga en su frase. Sin esta limpieza el CV terminaba con una habilidad llamada
 * literalmente `"Salesforce".`
 */
const WRAPPING = /^["'“”]+|["'“”.,;:]+$/g

export function planSkillAdd(
  keyword: string,
  sectionData: Record<string, unknown>,
  newId: () => string,
): SkillAddPlan {
  const cleaned = keyword.trim().replace(WRAPPING, "").trim()

  // Validado contra el motor de habilidades, no sólo por largo: una conocida se
  // acepta de una, y cualquier otra tiene que PARECER una habilidad y no ser el
  // empleador, la ciudad o el cargo del propio candidato.
  if (!isPlausibleSkill(cleaned, sectionData)) return { kind: "not_a_skill", term: cleaned }

  const name = displaySkill(cleaned)
  const existing = (sectionData.skills ?? []) as SkillItem[]

  // Misma grafía, o la misma habilidad escrita distinto / en el otro idioma. La
  // lista no puede ganar un gemelo de algo que ya está: «objective-c» al lado de
  // «Objective-C» es el defecto que la normalización viene a evitar.
  const already =
    existing.some((s) => s.name.toLowerCase() === name.toLowerCase()) ||
    !!findDuplicateSkill(name, existing.map((s) => s.name))
  if (already) return { kind: "already_there", name }

  return {
    kind: "add",
    name,
    skills: [...existing, { id: newId(), name, level: "intermediate" as const }],
  }
}


// ─────────────────────────────────────────────────────────────────────────
// applied-checks
// ─────────────────────────────────────────────────────────────────────────
// lib/ats/applied-checks.ts
//
// QUÉ HALLAZGOS SIGUEN CERRADOS. La pregunta, fuera del componente.
//
// ── EL DEFECTO (barrido de cierre, 2026-08-25) ───────────────────────────────
//
// «Aplicado» era un `Set<string>` de ids dentro del panel que sólo SUMABA: nueve
// lugares hacían `add` y el único `delete` era la vuelta atrás. No había reset en
// ninguna parte, ni al re-analizar.
//
// Y los ids son estables (`format.decorative_glyphs`, `search.title`,
// `tips.metric.job-1.2`), así que un defecto que VUELVE —pegar otra vez una
// viñeta con flecha, sacarle la cifra a una línea a mano— reaparecía en el
// informe con el mismo id, la tarjeta lo pintaba en verde y no ofrecía botón.
// Callejón sin salida hasta recargar el editor.
//
// ── LA REGLA ─────────────────────────────────────────────────────────────────
//
// Un hallazgo no es su id: es su id MÁS lo que señala. Se guarda la huella del
// hallazgo en el momento en que se aplicó, y cuenta como cerrado sólo mientras el
// informe siga describiéndolo igual. Si vuelve señalando otra cosa —otra línea,
// otro conteo, otro texto—, es un hallazgo nuevo y recupera su botón.
//
// ── Y POR QUÉ VIVE ACÁ Y NO EN EL PANEL ──────────────────────────────────────
//
// Porque dentro de un componente de dos mil líneas el único test posible es leer
// que la línea existe, y este proyecto ya midió que eso da verde con la función
// desconectada. Acá se ejecuta.


/** Lo que el hallazgo dice y a qué apunta. Su estado entra: pasar de aviso a crítico es otro hallazgo. */
export function fingerprintOfCheck(c: ReportCheck): string {
  return JSON.stringify([c.state, c.params ?? null, c.evidence ?? null])
}

/**
 * Los que siguen cerrados, de todo lo que el usuario cerró alguna vez.
 *
 * Un hallazgo que YA NO ESTÁ en el informe se conserva marcado: no hay tarjeta
 * que pintar, y olvidarlo sólo agregaría trabajo al conjunto sin cambiar nada en
 * pantalla. Lo que se descarta es el que volvió DISTINTO.
 */
export function appliedIdsFrom(
  marks: ReadonlyMap<string, string>,
  checks: readonly ReportCheck[],
): Set<string> {
  const vivos = new Map(checks.map((c) => [c.id, c]))
  const out = new Set<string>()
  for (const [id, huella] of marks) {
    const c = vivos.get(id)
    if (!c || fingerprintOfCheck(c) === huella) out.add(id)
  }
  return out
}


// ─────────────────────────────────────────────────────────────────────────
// applied-memory
// ─────────────────────────────────────────────────────────────────────────
// lib/ats/applied-memory.ts
//
// Qué arreglos ya aceptó el usuario en ESTE CV. Sobrevive al análisis siguiente.
//
// POR QUÉ EXISTE. Al aplicar un arreglo el CV cambia, y como la clave de caché
// del análisis incluye el texto del CV, la corrida siguiente le pregunta al
// modelo DE CERO. El modelo entonces vuelve a opinar sobre el párrafo que él
// mismo acababa de escribir y propone una variante — el usuario lo lee como
// "me está sugiriendo lo que ya tengo", y tiene razón.
//
// El panel ya recordaba lo aplicado, pero sólo hasta la siguiente corrida
// (`setAppliedItems(new Set())` al re-analizar). Esa memoria tenía que durar más
// que el análisis, porque el problema aparece justamente DESPUÉS.
//
// EN `localStorage` Y NO EN LA BASE, a propósito: guardar esto en el servidor
// pide una migración, y una migración es infraestructura que se pregunta antes.
// Lo que se guarda no es contenido del CV sino la FIRMA de un texto ya aceptado
// —palabras sueltas y ordenadas alfabéticamente, sin frases— y sólo sirve para
// no repetir una sugerencia. Si el usuario cambia de navegador, lo peor que pasa
// es que el panel vuelva a ofrecer algo: exactamente como se comportaba antes.

const KEY_PREFIX = "cvv:ats:applied:"
/** Tope por CV: la memoria es una ayuda, no un archivo histórico. */
const MAX_SIGNATURES = 60

const keyFor = (resumeId: string) => `${KEY_PREFIX}${resumeId}`

function read(resumeId: string): string[] {
  if (typeof window === "undefined" || !resumeId) return []
  try {
    const raw = window.localStorage.getItem(keyFor(resumeId))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : []
  } catch {
    // Cuota llena, modo privado, JSON corrupto: la memoria es opcional y su
    // fallo NUNCA puede romper el panel. Sin memoria se ve como se veía antes.
    return []
  }
}

export function appliedSignatures(resumeId: string): string[] {
  return read(resumeId)
}

export function rememberApplied(resumeId: string, signature: string): void {
  if (typeof window === "undefined" || !resumeId || !signature) return
  try {
    const next = [signature, ...read(resumeId).filter((s) => s !== signature)].slice(0, MAX_SIGNATURES)
    window.localStorage.setItem(keyFor(resumeId), JSON.stringify(next))
  } catch { /* ver arriba: opcional por diseño */ }
}

/**
 * DESHACER TIENE QUE BORRAR LA MEMORIA DE ESE ARREGLO, o esconde el defecto.
 *
 * ── POR QUÉ (2026-08-25) ────────────────────────────────────────────────────
 *
 * Esta memoria existe para que el panel no vuelva a proponer lo que el usuario
 * ya aceptó. Si al revertir dejáramos la firma puesta, el texto original vuelve
 * al CV **y el hallazgo que lo señalaba queda filtrado para siempre**: el
 * defecto sigue ahí y el panel deja de verlo. Un deshacer que esconde el
 * problema es peor que no deshacer.
 *
 * Borra UNA firma, no la memoria entera: lo demás que el usuario aceptó sigue
 * valiendo.
 */
export function forgetOneApplied(resumeId: string, signature: string): void {
  if (typeof window === "undefined" || !resumeId || !signature) return
  try {
    const next = read(resumeId).filter((s) => s !== signature)
    if (next.length > 0) window.localStorage.setItem(keyFor(resumeId), JSON.stringify(next))
    else window.localStorage.removeItem(keyFor(resumeId))
  } catch { /* opcional por diseño */ }
}

/** Al borrar o reemplazar el CV entero, lo aceptado antes ya no describe nada. */
export function forgetApplied(resumeId: string): void {
  if (typeof window === "undefined" || !resumeId) return
  try { window.localStorage.removeItem(keyFor(resumeId)) } catch { /* opcional */ }
}
