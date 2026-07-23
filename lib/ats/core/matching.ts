// lib/ats/core/matching.ts
//
// The single keyword-matching core shared by BOTH ATS scoring surfaces:
//   · the PRO/LIMITED ATS score  → lib/services/ai/shared/ats-matcher.ts
//   · the public free tool        → lib/ats/analyzer.ts
//
// Before this module each surface hand-rolled the same "for every keyword, is it
// present in the CV?" loop. They already delegated the actual presence test to
// the shared vocabulary (`termPresent`), so the primitives never diverged — but
// the loop and the de-duplication were copied. This is that copy, written once.
//
// Behavior is intentionally identical to what each caller did inline, so the
// deterministic ATS score (the product's trust moat) does not move by a single
// point. No weights, no thresholds, no scoring live here — only presence + dedup.

import { normalizeTerm, termPresent } from "@/lib/ats/vocabulary"

/**
 * Collapse a keyword list to its unique members, keyed by the canonical
 * (normalized) form so plurals/aliases/casing do not produce duplicates. The
 * first real spelling seen wins as the label — never a stemmed stub.
 */
export function dedupe(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of items) {
    const item = raw.trim()
    if (!item) continue
    const key = normalizeTerm(item)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

/**
 * Split keywords into those present in the normalized CV text and those absent.
 *
 * A keyword counts as present when the CV spells it (via the shared vocabulary,
 * so "k8s" matches "Kubernetes") OR — when `semanticMatches` is supplied — an
 * embedding pass proved a CV term semantically equivalent to it. Callers that do
 * not run the semantic pass omit the set and get exact-only matching, unchanged.
 *
 * `haystackNorm` MUST already be normalized by the caller (both surfaces
 * normalize the whole CV once and reuse it), so this stays allocation-free per
 * keyword beyond the presence test itself.
 */
export function partitionByPresence(
  keywords: string[],
  haystackNorm: string,
  semanticMatches?: Set<string>,
): { matched: string[]; missing: string[] } {
  const matched: string[] = []
  const missing: string[] = []
  for (const k of keywords) {
    if (termPresent(k, haystackNorm) || semanticMatches?.has(normalizeTerm(k))) {
      matched.push(k)
    } else {
      missing.push(k)
    }
  }
  return { matched, missing }
}
