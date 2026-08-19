// lib/services/ai/shared/semantic-match.ts
//
// Semantic keyword matching via embeddings. The exact matcher (ats-matcher.ts)
// only sees a keyword when the CV spells it the same way; a JD asking for "REST
// APIs" misses a CV that says "APIs REST", and no hand-maintained alias table
// scales to every synonym / word-order / language variant. This layer catches
// those by cosine similarity between embedding vectors — the same technique
// enterprise ATS (S-BERT) use — and ONLY ever ADDS recall: it can turn a missing
// keyword into a matched one, never the reverse, so the exact score is a floor.

import { normalizeTerm } from "@/lib/ats/vocabulary"

/** Cosine similarity of two equal-length vectors. 0 when either is a zero vector. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

// text-embedding-3-small scores genuinely-equivalent skill terms ("REST APIs" ↔
// "APIs REST", "team leadership" ↔ "liderazgo de equipos") comfortably above this
// and unrelated terms below. Conservative on purpose: a false positive would
// credit a skill the candidate lacks, which this product refuses to do.
//
// Tunable in prod WITHOUT a deploy via SEMANTIC_MATCH_THRESHOLD env (0..1): raise
// it if false positives appear, lower it if real equivalents are missed. Invalid
// / out-of-range values fall back to the safe default.
function resolveThreshold(): number {
  const raw = Number(process.env.SEMANTIC_MATCH_THRESHOLD)
  return Number.isFinite(raw) && raw > 0 && raw < 1 ? raw : 0.62
}
export const SEMANTIC_MATCH_THRESHOLD = resolveThreshold()

/**
 * The cheap threshold used when the pass is a PRE-FILTER rather than the verdict.
 *
 * Measured against 80 real es/en pairs plus 42 near-miss distractors: no single
 * threshold separates them. At 0.62 the score credits "backend" to a CV that only
 * says "frontend" (0.684) and "inspecciones sanitarias" to one that says "safety
 * inspections" (0.622), while still missing more than half of genuine translations
 * ("cuentas por cobrar" ↔ "accounts receivable", 0.516). Cosine measures topical
 * relatedness, and equivalence is not relatedness — no number fixes that.
 *
 * So when a judge runs behind it, the threshold stops being the decision and
 * becomes a cost control: keep recall high (0.40 kept 40/40 of the first set and
 * 39/40 of a held-out one) and let the judge reject. Only pairs above this cost a
 * token, and only the first time in the product's life.
 */
export const SEMANTIC_PREFILTER_THRESHOLD = 0.4

/** A pair worth asking about: a required keyword and the candidate's closest term. */
export interface SemanticCandidate {
  /** The requirement, as the job description worded it. */
  keyword: string
  /** The candidate's own term that came closest. */
  cvTerm: string
  similarity: number
}

/**
 * Same embedding pass as findSemanticMatches, but returns the PAIRS instead of a
 * verdict, so a judge can decide them. Fails CLOSED — an empty list leaves the
 * exact-match result untouched.
 */
export async function findSemanticCandidates(
  missingKeywords: string[],
  cvTerms: string[],
  embed: (texts: string[]) => Promise<number[][]>,
  threshold = SEMANTIC_PREFILTER_THRESHOLD,
  onFailure?: (err: Error) => void,
): Promise<SemanticCandidate[]> {
  const missing = [...new Set(missingKeywords.map((k) => k.trim()).filter(Boolean))]
  const terms = [...new Set(cvTerms.map((t) => t.trim()).filter(Boolean))]
  if (missing.length === 0 || terms.length === 0) return []

  try {
    const vectors = await embed([...missing, ...terms])
    if (vectors.length !== missing.length + terms.length) {
      onFailure?.(new Error(`embed returned ${vectors.length} vectors, expected ${missing.length + terms.length}`))
      return []
    }
    const missVecs = vectors.slice(0, missing.length)
    const termVecs = vectors.slice(missing.length)

    const out: SemanticCandidate[] = []
    for (let i = 0; i < missing.length; i++) {
      // Only the closest term is worth judging: if the best one is not the same
      // skill, no weaker one is, and asking about all of them multiplies the bill.
      let best = 0
      let bestIdx = -1
      for (let j = 0; j < termVecs.length; j++) {
        const sim = cosineSimilarity(missVecs[i], termVecs[j])
        if (sim > best) { best = sim; bestIdx = j }
      }
      if (bestIdx >= 0 && best >= threshold) {
        out.push({ keyword: missing[i], cvTerm: terms[bestIdx], similarity: best })
      }
    }
    return out
  } catch (err) {
    onFailure?.(err instanceof Error ? err : new Error(String(err)))
    return []
  }
}

/**
 * Returns the normalized set of `missingKeywords` that a `cvTerm` is semantically
 * equivalent to (cosine ≥ threshold). One batched embed call. Fails CLOSED — any
 * error yields an empty set, leaving the exact-match result untouched.
 *
 * Kept for the callers where a false positive only hides a suggestion instead of
 * crediting a skill (tailor's dedupe). The ATS score no longer decides on cosine
 * alone — see findSemanticCandidates and skill-equivalence.ts.
 */
export async function findSemanticMatches(
  missingKeywords: string[],
  cvTerms: string[],
  embed: (texts: string[]) => Promise<number[][]>,
  threshold = SEMANTIC_MATCH_THRESHOLD,
  /** Called when the embedding pass could not run. Optional so existing callers
   *  keep working; the ATS score passes one so the failure reaches the panel. */
  onFailure?: (err: Error) => void,
): Promise<Set<string>> {
  const matched = new Set<string>()
  // Dedupe + drop blanks to keep the embed call small.
  const missing = [...new Set(missingKeywords.map((k) => k.trim()).filter(Boolean))]
  const terms = [...new Set(cvTerms.map((t) => t.trim()).filter(Boolean))]
  if (missing.length === 0 || terms.length === 0) return matched

  try {
    const vectors = await embed([...missing, ...terms])
    if (vectors.length !== missing.length + terms.length) {
      onFailure?.(new Error(`embed returned ${vectors.length} vectors, expected ${missing.length + terms.length}`))
      return matched
    }
    const missVecs = vectors.slice(0, missing.length)
    const termVecs = vectors.slice(missing.length)

    for (let i = 0; i < missing.length; i++) {
      let best = 0
      for (const tv of termVecs) {
        const sim = cosineSimilarity(missVecs[i], tv)
        if (sim > best) best = sim
      }
      if (best >= threshold) matched.add(normalizeTerm(missing[i]))
    }
  } catch (err) {
    // Fail closed — the exact-match score stands. But NOT silently: without the
    // synonym pass ("REST APIs" ≡ "APIs REST") those requirements count as
    // missing, so a transient embedding failure drops the score hard and used to
    // leave no trace anywhere. The caller reports it, and the panel can say the
    // number is understated instead of the user seeing 70 become 33.
    onFailure?.(err instanceof Error ? err : new Error(String(err)))
    return new Set()
  }
  return matched
}

// ─── Bullets of one role that talk about the same work ────────────────────────

/**
 * The floor under a pair worth OFFERING to merge.
 *
 * MEASURED on 20 hand-labelled pairs across ten trades in both languages, held
 * out — labelled before any number was seen. Real merges scored 0.498 to 0.632;
 * genuinely different work from the same role scored 0.325 to 0.551. The bands
 * touch, so this is not a verdict and must never be used as one: at 0.50 it
 * offers 9 of 10 real merges and 1 of 10 wrong ones, and at 0.60 it offers 1 of
 * 10 real ones — a cut that kills the feature to buy precision it does not need.
 *
 * It does not need it because NOTHING IS APPLIED FROM THIS. The card shows both
 * lines in full and the user clicks; the model then writes the fusion and may
 * decline; and the result goes through a confirm before it touches the CV. Same
 * shape as SEMANTIC_PREFILTER_THRESHOLD above: keep recall high and let the
 * reader decide.
 *
 * WHY EMBEDDINGS AT ALL. The deterministic predicate this replaces asks whether
 * two lines share vocabulary, which answers "is this the same sentence?" — the
 * DUPLICATE question. Measured on the same set, it offered 0 of 10, because five
 * of the ten real merges share no content word at all: "Gestioné la agenda" and
 * "Confirmé los turnos" are one job written twice with no word in common. Cosine
 * measures topical relatedness, and "same work?" is a topical question.
 */
export const MERGE_PAIR_THRESHOLD = 0.5

/** How many pairs one role may propose. The user picks among them. */
export const MERGE_PAIRS_PER_ROLE = 3

export interface RoleBullets {
  targetId: string
  /** Only the bullets eligible to be merged, with their real index in the role. */
  candidates: { index: number; text: string }[]
}

export interface SemanticPair {
  targetId: string
  indexes: [number, number]
  score: number
}

/**
 * Ranks, per role, the bullet pairs most likely to be one piece of work.
 *
 * PROPOSES, never decides. Measured, no automatic selector is accurate enough to
 * pick THE pair: ranking inside a role put the labelled pair first in four roles
 * out of six, with margins as thin as 0.004. So it returns several, the card
 * shows both lines of each, and the person who did the work chooses. That is the
 * same reasoning `merge-candidates.ts` already applies to the model — a chooser
 * that is always confident is not a chooser — extended to our own code once the
 * numbers said our code is not confident either.
 *
 * Fails closed: any embedding error yields an empty list, and the caller keeps
 * its deterministic behaviour.
 */
export async function findMergePairs(
  roles: RoleBullets[],
  embed: (texts: string[]) => Promise<number[][]>,
): Promise<SemanticPair[]> {
  const work = roles.filter((r) => r.targetId && r.candidates.length >= 2)
  if (work.length === 0) return []

  // One call for every role's bullets: the cost of this feature is a single
  // embedding request per analysis, and the vectors are useless separately.
  const flat = work.flatMap((r) => r.candidates.map((c) => c.text))
  let vectors: number[][]
  try {
    vectors = await embed(flat)
  } catch {
    return []
  }
  if (vectors.length !== flat.length) return []

  const out: SemanticPair[] = []
  let offset = 0
  for (const role of work) {
    const vecs = vectors.slice(offset, offset + role.candidates.length)
    offset += role.candidates.length
    const pairs: SemanticPair[] = []
    for (let i = 0; i < role.candidates.length; i++) {
      for (let j = i + 1; j < role.candidates.length; j++) {
        const score = cosineSimilarity(vecs[i], vecs[j])
        if (score < MERGE_PAIR_THRESHOLD) continue
        pairs.push({
          targetId: role.targetId,
          indexes: [role.candidates[i].index, role.candidates[j].index],
          score,
        })
      }
    }
    // Best first, and no bullet in two proposals: two cards offering to fold the
    // same line in different directions is a choice nobody can make.
    pairs.sort((a, b) => b.score - a.score)
    const taken = new Set<number>()
    for (const p of pairs) {
      if (taken.has(p.indexes[0]) || taken.has(p.indexes[1])) continue
      taken.add(p.indexes[0]); taken.add(p.indexes[1])
      out.push(p)
      if (taken.size >= MERGE_PAIRS_PER_ROLE * 2) break
    }
  }
  return out
}
