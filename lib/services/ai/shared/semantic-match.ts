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
 * Returns the normalized set of `missingKeywords` that a `cvTerm` is semantically
 * equivalent to (cosine ≥ threshold). One batched embed call. Fails CLOSED — any
 * error yields an empty set, leaving the exact-match result untouched.
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
