// lib/ats/bullet-strength.ts
//
// Which lines in an overloaded role are carrying it, and which are diluting it.
//
// The structure check already said the useful half — "past six on one role your
// strongest lines compete with your weakest" — and then left the candidate to work
// out WHICH ones. That is the hard part, and it is the part a person is worst at
// on their own writing. Naming a problem without naming its instances is a
// diagnosis with no prescription.
//
// Everything here is deterministic and additive: a bullet earns points for the
// things a recruiter reads for. No model, no threshold tuned to one résumé, and
// the ordering is what matters — the exact numbers only have to rank consistently.
//
// It never deletes. It sorts, and the candidate decides: the weakest lines get a
// Remove and, where two of them tell one story, a Merge — so cutting the role down
// does not have to mean throwing information away.

import { isEmptyPhrasing } from "@/lib/services/ai/shared/empty-phrasing"
import { opensWeakly, opensInThirdPersonEs } from "@/lib/services/ai/shared/bullet-quality"
import { hasCliche } from "@/lib/services/ai/shared/cliches"

export interface RankedBullet {
  index: number
  text: string
  score: number
  /** Why it scored what it scored, for the UI to show instead of a bare number. */
  reasons: string[]
}

/** Reasons that argue for cutting a line. The rest are reasons to keep it. */
const NEGATIVE = new Set(["duty_opener", "empty_phrasing", "too_short", "too_long"])

/**
 * What to tell someone about a line we are asking them to cut.
 *
 * Never a compliment: showing "starts with an action" as the reason to delete
 * something is worse than showing nothing, and picking the first reason in the
 * list did exactly that — a well-formed line with no defects at all fell through
 * to "too short to make a claim", which was simply untrue.
 *
 * A line can be perfectly written and still be the seventh best. That is not a
 * defect and must not be dressed as one: it gets its own honest answer.
 */
export function cutReason(b: RankedBullet): string {
  return b.reasons.find((r) => NEGATIVE.has(r)) ?? "outranked"
}

export interface RoleBulletRanking {
  targetId: string
  jobTitle: string
  /** The ones worth keeping, strongest first. */
  strongest: RankedBullet[]
  /** The ones diluting the role, weakest first. Capped at MAX_WEAK_SHOWN. */
  weakest: RankedBullet[]
  /** Weak lines beyond the cap. Shown as a count, never dropped in silence. */
  weakestHidden: number
}

/** A result the reader can place: a before→after, a unit, money, or a real count. */
const ANCHORED = [
  /\bfrom\s+[\d.,]+\s*%?\s+to\s+[\d.,]+/i,
  /\bde\s+[\d.,]+\s*%?\s+a\s+[\d.,]+/i,
  /[\d.,]+\s*(?:ms|s|seg|segundos|min|minutos|h|horas|hrs|kb|mb|gb|tb)\b/i,
  /[$€£]\s?[\d.,]+/,
  /\b\d[\d.,]*\s*(?:k|m|mil|millones|million)\b/i,
  /\b\d[\d.,]*\s+[a-záéíóúñ]{3,}/i,
]

/**
 * Openers that describe a duty rather than an achievement. A closed, short list of
 * VERB FORMS — not of topics — so it carries across industries: a nurse's
 * "responsible for medication rounds" fails for the same reason an engineer's
 * "responsible for the build" does.
 */
/**
 * ── LA SÉPTIMA COPIA, Y LA MÁS CARA (pase de QA, 2026-08-27) ─────────────────
 *
 * Esto era un regex propio con SU PROPIA lista: dieciséis frases contra las
 * veintitrés de `WEAK_OPENERS`, más las aperturas nominales que el dueño ya
 * juzga. Y no es un detector cualquiera: de acá sale `duty_opener`, que alimenta
 * `scoreBullet` —el ranking de qué línea es la más débil— y el PISO DE SALIDA
 * que acepta o rechaza las reescrituras del modelo.
 *
 * Medido sobre ocho líneas, DISCREPABAN CINCO. Este detector daba por sanas
 * «Contributed to the redesign…», «Mis funciones incluían…», «Ayudé con…»,
 * «Trabajé en…» y «Active use of…» — todas marcadas mal por el resto del
 * producto. O sea: el panel señalaba la línea y el piso aceptaba una reescritura
 * que no la arreglaba, porque para él nunca había estado rota.
 *
 * Una pregunta, un dueño.
 */
const DUTY_OPENER = { test: (t: string) => opensWeakly(t) }

/** Something specific enough that only this candidate could have written it. */
function namesSomethingConcrete(text: string): boolean {
  // A capitalised word mid-sentence (a tool, a product, a place) or a digit.
  const words = text.trim().split(/\s+/)
  for (let i = 1; i < words.length; i++) {
    const w = words[i].replace(/^[^\p{L}]+/u, "")
    if (/^\p{Lu}/u.test(w) && !/^I$/.test(w)) return true
  }
  return /\d/.test(text)
}

/** Bullets a recruiter reads before attention drops. Mirrors the structure check. */
export const KEEP_PER_ROLE = 6

/**
 * Most weak lines shown at once. A role carrying sixty bullets — an import from a
 * badly parsed PDF usually — produced fifty-four rows of "consider cutting this",
 * which nobody reads and which buries the six that matter. The count of what is
 * hidden travels with the result, because silently showing part of someone's CV
 * as if it were all of it is the failure this project keeps paying for.
 */
export const MAX_WEAK_SHOWN = 8

/**
 * Scores one line the way a recruiter skims it.
 *
 * The weights encode an ordering, not a measurement: a defensible result outranks
 * a bare percentage, which outranks naming a real tool, which outranks simply
 * being well-formed. Nothing here is tuned against a particular CV.
 */
export function scoreBullet(text: string): { score: number; reasons: string[] } {
  const t = text.trim()
  const reasons: string[] = []
  let score = 0

  if (ANCHORED.some((re) => re.test(t))) {
    score += 5
    reasons.push("anchored_result")
  } else if (/\d/.test(t)) {
    score += 3
    reasons.push("has_figure")
  }

  if (DUTY_OPENER.test(t)) {
    score -= 3
    reasons.push("duty_opener")
  } else if (/^[\p{Lu}]?[\p{L}]+(ed|ó|ió|é|aron|ieron)\b/u.test(t)) {
    // Past-tense opener: something happened, rather than something was assigned.
    score += 2
    reasons.push("action_verb")
  }

  if (isEmptyPhrasing(t)) {
    score -= 4
    reasons.push("empty_phrasing")
  }

  if (namesSomethingConcrete(t)) {
    score += 2
    reasons.push("specific")
  }

  // Very short lines say too little; very long ones are not skimmed at all.
  const words = t.split(/\s+/).length
  if (words < 6) {
    score -= 2
    reasons.push("too_short")
  } else if (words > 34) {
    score -= 1
    reasons.push("too_long")
  }

  return { score, reasons }
}

/**
 * Las razones que señalan un DEFECTO de redacción — las únicas que una
 * reescritura puede arreglar.
 *
 * Las otras (`anchored_result`, `has_figure`, `action_verb`, `specific`) son
 * méritos: su ausencia baja el puntaje relativo, pero no describe nada que se le
 * pueda pedir al modelo que corrija.
 */
const DEFECTOS = new Set(["duty_opener", "empty_phrasing", "too_short", "too_long"])

/**
 * ¿Esta línea tiene algo que una reescritura pueda arreglar?
 *
 * ── EL BUCLE QUE ESTO CIERRA (pregunta del CEO, 2026-08-21) ────────────────
 *
 *   «¿O es un bucle infinito donde resolvés uno y te manda más y más, así por
 *    cada revisión del ATS?»
 *
 * Era un bucle infinito, y medido: `rankRoleBullets` ordena y devuelve las que
 * caen del puesto `KEEP_PER_ROLE` hacia abajo. Es un RANKING, no una vara. En un
 * puesto de nueve líneas siempre sobran tres — y cuando el usuario reescribe la
 * peor y ésta sube al tope, **otra ocupa su lugar**. Simulado sobre el propio
 * algoritmo, seis rondas seguidas:
 *
 *   ronda 1: señala 3 → [2, 1, 0]      ronda 4: señala 3 → [5, 4, 3]
 *   ronda 2: señala 3 → [3, 2, 1]      ronda 5: señala 3 → [6, 5, 4]
 *   ronda 3: señala 3 → [4, 3, 2]      ronda 6: señala 3 → [7, 6, 5]
 *
 * Tres, siempre tres, escribas lo que escribas. Y el panel las ofrecía con
 * botón de REESCRIBIR, que es la única acción que no las puede cerrar.
 *
 * ── LA SALIDA, QUE YA EXISTÍA ──────────────────────────────────────────────
 *
 * Un puesto con nueve líneas diluye aunque las nueve sean excelentes: el
 * problema es el VOLUMEN, y se arregla CORTANDO. Eso ya tiene dueño —
 * `tips.balance`, con `owner: "user"` y sin botón, porque cuál cortar lo decide
 * quien hizo el trabajo.
 *
 * Así que la reescritura se ofrece sólo sobre lo que la reescritura arregla, y
 * el recorte queda con quien ya lo tenía. Un dueño por objetivo.
 */
export function isImprovableLine(text: string): boolean {
  if (scoreBullet(text).reasons.some((r) => DEFECTOS.has(r))) return true
  /**
   * Y LOS DEFECTOS QUE EL PROYECTO YA SABE VER, que `scoreBullet` no cubre.
   *
   * ── EL HUECO, CAZADO POR UN TEST QUE YA EXISTÍA ──────────────────────────
   *
   * La primera versión sólo miraba las razones de `scoreBullet`. Con eso,
   * «Implementar estrategias comerciales de rotación» daba `reasons=[]`: seis
   * palabras, sin frase vacía, sin apertura de tarea reconocida. Y es un
   * INFINITIVO — el defecto de redacción de CV más clásico que hay, y uno que
   * este mismo proyecto señala en otras tres partes.
   *
   * Silenciarlo habría sido el error simétrico del bucle: en vez de trabajo
   * infinito, un defecto real sin nadie que lo arregle. Lo cazó
   * `report-follows-the-cv.test.ts` antes de que llegara a pantalla.
   *
   * Se apoya en los detectores QUE YA EXISTEN, no en regex nuevas: la lista de
   * aperturas débiles, el cliché, la tercera persona. Una vara que se
   * reimplementa a sí misma es la forma de que dos pantallas opinen distinto
   * sobre la misma línea.
   */
  const limpio = text.replace(/^[\s•·▪‣*\-–—]+/, "").trim()
  if (hasCliche(limpio)) return true
  if (opensInThirdPersonEs(limpio)) return true
  if (opensWithInfinitive(limpio)) return true
  /**
   * Y ACÁ SE PREGUNTA AL DUEÑO, que es lo que el comentario de arriba prometía.
   *
   * Esta línea reimplementaba el chequeo —`WEAK_OPENERS.some(startsWith)`— por
   * cuarta vez en el repo, justo debajo del párrafo que dice que una vara
   * reimplementada es cómo dos pantallas terminan opinando distinto sobre la
   * misma línea. Y pasó: `opensWeakly` aprendió a ver las aperturas NOMINALES
   * («Active use of…», el CV reportado el 2026-08-27) y esta copia siguió ciega,
   * así que el informe marcaba la línea y el ejecutor no la recibía.
   */
  return opensWeakly(limpio)
}

/**
 * Una línea que arranca en infinitivo describe el PUESTO, no lo que la persona
 * hizo — es la descripción del aviso copiada dentro del CV.
 *
 * Sólo la primera palabra, y sólo las tres terminaciones regulares del español
 * más el «to X» del inglés. Angosto a propósito: un sustantivo que termina en
 * -ar o -er existe («lugar», «taller»), así que se exige además que la palabra
 * siguiente no lo convierta en otra cosa… lo que no se puede saber sin análisis
 * morfológico. Lo que sí se puede: exigir que la línea NO tenga ya un verbo
 * conjugado al frente, que es lo que `scoreBullet` llama `action_verb`.
 */
function opensWithInfinitive(text: string): boolean {
  const first = text.split(/\s+/)[0] ?? ""
  if (/^[\p{Lu}]?[\p{L}]+(ed|ó|ió|é|aron|ieron)$/u.test(first)) return false
  return /^[\p{L}]+(ar|er|ir)$/iu.test(first) || /^to$/i.test(first)
}

/**
 * Splits an overloaded role into the lines worth keeping and the ones diluting it.
 *
 * Returns nothing for a role a recruiter can already read: a four-bullet role has
 * no weakest line worth cutting, and saying otherwise would push people to delete
 * work they should keep.
 *
 * Ties keep the résumé's own order, so the ranking never reshuffles two lines the
 * candidate deliberately placed one after the other.
 */
export function rankRoleBullets(
  roles: { id?: string; jobTitle?: string; bullets: string[] }[],
  keep = KEEP_PER_ROLE,
): RoleBulletRanking[] {
  const out: RoleBulletRanking[] = []
  for (const role of roles) {
    if (!role.id || role.bullets.length <= keep) continue
    const ranked: RankedBullet[] = role.bullets
      .map((text, index) => ({ index, text: text.trim(), ...scoreBullet(text) }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
    const weak = ranked.slice(keep).reverse()
    out.push({
      targetId: role.id,
      jobTitle: role.jobTitle?.trim() ?? "",
      strongest: ranked.slice(0, keep),
      weakest: weak.slice(0, MAX_WEAK_SHOWN),
      weakestHidden: Math.max(0, weak.length - MAX_WEAK_SHOWN),
    })
  }
  return out
}
