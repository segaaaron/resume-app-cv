// lib/ats/keyword-safety.ts
//
// A rewrite must never cost you the match.
//
// Reported with the number on screen: applied a few suggested rewrites and the
// score went 80 → 79. Nothing was broken — each rewrite was a better SENTENCE,
// and one of them quietly dropped a word this posting searches for. The panel had
// no idea, because the writing guards ask "is this prose better?" and the matcher
// asks "are the words there?", and nobody was asking both at once about the same
// edit.
//
// So this is the missing question, asked before any rewrite is offered: does the
// new text still say every posting term the old one said? It is not about quality
// and it is not a model's opinion — it is set membership over two strings.
//
// Deliberately one-directional: a rewrite that ADDS terms is welcome, a rewrite
// that keeps them all is fine, and only a rewrite that LOSES one is refused. The
// candidate can still write anything they want by hand; what we will not do is
// hand them a button that lowers their own score.

// ── UN SOLO DUEÑO, Y ESTE ARCHIVO NO LO ERA (reportado con captura, 2026-08-25)
//
// La misma pregunta estaba escrita DOS VECES: acá, para el botón del panel, y
// como `droppedPostingTerms` en `rewrite-keeps-match.ts`, para el guard del
// servidor. Dos copias de un `filter` sobre `termPresent` que hoy coincidían y
// mañana no. Ahora esta función DELEGA: hay una implementación.

import { droppedPostingTerms } from "./rewrite-keeps-match"

/**
 * Posting terms present in `current` and missing from `next`.
 *
 * Empty means the rewrite is safe to offer. Non-empty names exactly what would be
 * lost, so the caller can say so instead of silently dropping the suggestion.
 */
export function postingTermsLost(current: string, next: string, postingTerms: string[]): string[] {
  return droppedPostingTerms(current, next, postingTerms)
}

/** True when the rewrite keeps every posting term the current text already had. */
export function isKeywordSafe(current: string, next: string, postingTerms: string[]): boolean {
  return postingTermsLost(current, next, postingTerms).length === 0
}
