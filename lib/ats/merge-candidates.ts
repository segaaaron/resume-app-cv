// lib/ats/merge-candidates.ts
//
// Finds the two bullets in one role that should be one bullet.
//
// A role with six thin lines reads worse than the same role with four solid ones:
// the recruiter skims, and every line that says half a thing spends a slot without
// buying a claim. The panel already knew how to REMOVE a weak line, which throws
// the content away, and how to REWRITE one, which cannot merge. Neither covers the
// common case — two lines about the same work, split because they were written on
// different days.
//
// WHICH two is decided in code, never by the model. A model asked "which of these
// should be merged" always finds a pair, the same way a model asked to improve a
// bullet always finds another variant — the stopping problem this codebase has
// already paid for twice. The algorithm decides IF; the model only decides HOW it
// reads.
//
// The first version of this file answered "are these about the same work?" with
// its own private heuristics — a shared-word count, a character-length cut-off, a
// crowding number — all chosen by looking at ONE résumé. Two features were
// answering one question in two ways, so they could disagree, and neither had been
// checked outside the CV that produced them.
//
// They are one question, and it lives in resume-integrity.ts:
//
//     same subject + one line adds nothing  →  a DUPLICATE (delete one)
//     same subject + each adds something    →  a MERGE     (fuse them)
//
// so this file no longer decides similarity at all. What remains here is the part
// that is genuinely about merging: only on a role a recruiter would find crowded,
// and only between lines that have not already earned their place.

import { sharesSubject, addsNothingNew } from "./resume-integrity"
import { BULLETS_PER_ROLE_MAX } from "./scoring-config"
import { roleBand } from "./role-budget"
import type { SemanticPair } from "@/lib/services/ai/shared/semantic-match"
import { parseBullets } from "@/lib/services/ai/shared/bullets"
import { resolveBulletIndex } from "./bullet-locate"

export interface MergeCandidate {
  targetId: string
  jobTitle: string
  /** Indices into the role's bullet list, ascending. */
  indexes: [number, number]
  texts: [string, string]
}

/**
 * Crowded is not a new opinion: writing-checks already owns the recruiter norm and
 * calls a role "too many" above BULLET_MAX. Merging is offered one line BELOW that
 * line, because a role sitting exactly at the limit is the one where fusing two
 * thin bullets brings it back into range. One owner of the norm, no second number
 * drifting away from it.
 */
const CROWDED_ROLE = BULLETS_PER_ROLE_MAX.value - 2

/**
 * Y FUSIONAR NO PUEDE DEJAR AL PUESTO POR DEBAJO DE SU PISO.
 *
 * Reportado como parte del mismo defecto (CEO, 2026-08-25): el producto ofrecía
 * unir dos líneas de un puesto que después otra tarjeta declaraba corto. Unir
 * baja el conteo en uno, así que la oferta sólo tiene sentido si el puesto
 * aguanta ese uno menos. El rango por antigüedad lo decide `role-budget`, y acá
 * llega ya medido: este archivo no vuelve a opinar sobre cuántas entran.
 */
function isCrowded(count: number, band?: { min: number; max: number }): boolean {
  if (!band) return count >= CROWDED_ROLE
  return count >= band.max - 2 && count - 1 >= band.min
}
/** Below this a line is barely a sentence, and fusing it fixes nothing. */
const TOO_SHORT_TO_KEEP = 25

/** A line that reports a result has earned its slot — never offer to fold it away. */
function carriesFigure(text: string): boolean {
  return /\d/.test(text)
}

export interface MergeInput {
  targetId: string
  jobTitle: string
  bullets: string[]
  /**
   * El rango que su antigüedad admite (`roleBudget`). Opcional: sin él se usa el
   * tope global, que es lo que este archivo hacía antes de que el rango tuviera
   * dueño. Falla abierto — nunca deja de ofrecer por no haber recibido la banda.
   */
  band?: { min: number; max: number }
}

/**
 * The pairs worth offering to merge, best first.
 *
 * Conservative by construction, because merging is destructive: only inside ONE
 * role (two roles saying similar things is a different problem, and merging
 * across them would rewrite history), only on roles a recruiter would already
 * find crowded, and only between lines that are thin — a line carrying a figure
 * has earned its slot and is never folded away. A pair where one line adds
 * NOTHING is not a merge, it is a duplicate, and it goes to the delete flow:
 * fusing them would dress a deletion up as a model call. Each bullet appears in
 * at most one pair, so applying every suggestion cannot cascade a role down to a
 * single line.
 *
 * `semanticPairs` — the ranked proposals from the embedding pass, when there are
 * any. Optional on purpose, and the fallback matters:
 *
 *   · The panel recomputes these checks on every keystroke, with no network. It
 *     passes the pairs published by the last analysis; between analyses, or when
 *     the embedding call failed, there are none and the deterministic path runs.
 *   · That path is what shipped before, so nothing regresses when this is absent
 *     — it simply offers what it always offered.
 *
 * WHY THE DETERMINISTIC PATH IS NOT ENOUGH ON ITS OWN, measured on 20 labelled
 * pairs across ten trades in both languages: `sharesSubject` asks whether two
 * lines share vocabulary and offered 0 of 10 real merges, because half of them
 * share no content word — "Gestioné la agenda" and "Confirmé los turnos" are one
 * job written twice. That predicate answers the DUPLICATE question, which is a
 * different question, and no threshold on it separates the two (real merges
 * 0.00–0.29 overlap, non-merges 0.00–0.17).
 *
 * And this PROPOSES. Ranking inside a role put the labelled pair first in four
 * roles out of six, with margins as thin as 0.004, so several survive and the
 * card shows both lines of each: the person who did the work is the one who can
 * tell "prep before service" from "cleandown after it".
 */
export function findMergeCandidates(
  roles: MergeInput[],
  max = 4,
  semanticPairs: SemanticPair[] = [],
): MergeCandidate[] {
  const out: (MergeCandidate & { score: number })[] = []

  for (const role of roles) {
    const { targetId, jobTitle, bullets, band } = role
    if (!targetId || !isCrowded(bullets.length, band)) continue

    const thin = bullets
      .map((text, index) => ({ text: text.trim(), index }))
      .filter(({ text }) => text.length >= TOO_SHORT_TO_KEEP && !carriesFigure(text))
    const eligible = new Set(thin.map((t) => t.index))

    const taken = new Set<number>()
    const proposed = semanticPairs.filter((p) => p.targetId === targetId)
    const pairs: { a: number; b: number }[] = []
    if (proposed.length > 0) {
      // Every filter below still applies to a proposed pair: the embedding says
      // the two lines are about one thing, not that folding them is a good idea.
      // A line carrying a figure has earned its slot, a line under 25 characters
      // is not a sentence, and a pair where one adds nothing is a duplicate and
      // belongs to the delete flow.
      for (const p of proposed) {
        // EL ÍNDICE ES PISTA, EL TEXTO ES IDENTIDAD. El par se calculó en el
        // análisis y el usuario pudo aplicar cosas desde entonces: fusionar borra
        // una línea y corre todas las de abajo. Sin esto, el par [0,1] de un
        // puesto ya fusionado señalaba la línea nueva contra una vecina que nadie
        // emparejó — medido, y es lo que el CEO reportó como «hago el merge y me
        // vuelve a pedir lo mismo». Un par cuya línea ya no está se descarta.
        const [a, b] = p.texts
          ? [resolveBulletIndex(bullets, p.indexes[0], p.texts[0]), resolveBulletIndex(bullets, p.indexes[1], p.texts[1])]
          : p.indexes
        if (a < 0 || b < 0 || a === b) continue
        if (!eligible.has(a) || !eligible.has(b)) continue
        const ta = bullets[a]?.trim() ?? ""
        const tb = bullets[b]?.trim() ?? ""
        if (!ta || !tb || addsNothingNew(ta, tb)) continue
        pairs.push({ a, b })
      }
    } else {
      for (let i = 0; i < thin.length; i++) {
        for (let j = i + 1; j < thin.length; j++) {
          if (!sharesSubject(thin[i].text, thin[j].text)) continue
          // One of them contributes nothing → that is a duplicate, not a merge.
          if (addsNothingNew(thin[i].text, thin[j].text)) continue
          pairs.push({ a: thin[i].index, b: thin[j].index })
        }
      }
    }

    for (const p of pairs) {
      if (taken.has(p.a) || taken.has(p.b)) continue
      taken.add(p.a)
      taken.add(p.b)
      out.push({
        targetId,
        jobTitle,
        indexes: [p.a, p.b],
        texts: [bullets[p.a], bullets[p.b]],
        score: bullets.length,
      })
    }
  }

  return out
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ score: _score, ...c }) => c)
}

/**
 * The bullets of each crowded role that are ELIGIBLE to be merged, for the
 * embedding pass.
 *
 * Lives here, next to the filters it mirrors, so the pass never pays to embed a
 * line this file would refuse anyway: a role under the crowding line, a fragment
 * under 25 characters, or a line carrying a figure — that one has earned its
 * slot and is never folded away.
 */
/**
 * TODAS las viñetas del CV, con cuáles de ellas pueden además proponerse para
 * fusión.
 *
 * Los filtros de fusión —puesto de cuatro líneas o más, sin cifra, 25 caracteres
 * mínimo— existen porque fusionar es destructivo. Aplicados a la pregunta «¿esto
 * está repetido?» dejaban ciega media app: un CV de tres puestos con tres
 * líneas cada uno no se comparaba nunca, y copiar un logro del trabajo anterior
 * al siguiente era invisible por construcción. Acá van las dos cosas juntas: la
 * lista completa para detectar repetición, y la marca de elegible para fusión.
 */
export function buildBulletSimilarityInput(
  sectionData: Record<string, unknown>,
): { targetId: string; bullets: { index: number; text: string }[]; mergeEligible: number[] }[] {
  const work = (sectionData.workExperience ?? []) as { id?: string; description?: string; endDate?: string; currentlyWorking?: boolean }[]
  const out: { targetId: string; bullets: { index: number; text: string }[]; mergeEligible: number[] }[] = []
  for (const job of work) {
    if (!job.id) continue
    const bullets = parseBullets(job.description ?? "")
      .map((text, index) => ({ index, text: text.trim() }))
      // Una línea de tres palabras no es una repetición ni una fusión: es un
      // encabezado. El mismo piso que ya usaba la fusión.
      .filter(({ text }) => text.length >= TOO_SHORT_TO_KEEP)
    if (bullets.length === 0) continue
    /**
     * Y ACÁ TAMBIÉN MANDA LA BANDA. Cazado por QA: `findMergeCandidates` pasó a
     * medir por antigüedad y esta función —la que decide qué se manda a los
     * embeddings, o sea la vía de fusión que de verdad acierta— se quedó con el
     * tope plano. Un puesto viejo con tres líneas quedaba fuera del embebido y
     * caía al camino determinista, que mide 0 de 10 fusiones reales.
     */
    const crowded = isCrowded(parseBullets(job.description ?? "").length, roleBand(job))
    const mergeEligible = crowded
      ? bullets.filter(({ text }) => !carriesFigure(text)).map(({ index }) => index)
      : []
    out.push({ targetId: job.id, bullets, mergeEligible })
  }
  return out
}

export function buildMergeRoleInput(
  sectionData: Record<string, unknown>,
): { targetId: string; candidates: { index: number; text: string }[] }[] {
  const work = (sectionData.workExperience ?? []) as { id?: string; description?: string }[]
  const out: { targetId: string; candidates: { index: number; text: string }[] }[] = []
  for (const job of work) {
    if (!job.id) continue
    const bullets = parseBullets(job.description ?? "")
    if (bullets.length < CROWDED_ROLE) continue
    const candidates = bullets
      .map((text, index) => ({ index, text: text.trim() }))
      .filter(({ text }) => text.length >= TOO_SHORT_TO_KEEP && !carriesFigure(text))
    if (candidates.length >= 2) out.push({ targetId: job.id, candidates })
  }
  return out
}
