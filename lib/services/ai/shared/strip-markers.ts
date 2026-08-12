// lib/services/ai/shared/strip-markers.ts
//
// Removes OUR OWN addressing markers from anything a user reads.
//
// buildResumeContext prefixes each role with "ID:<uuid> | " so the model can name
// the job it means in an action. The model also copies that prefix into the prose
// it writes back, and the panel printed it: a recruiter-facing report opening with
// "ID:9a9f30f9-93fb-49bb-b039-2827b76f1aaf | iOS Developer at IA interactive".
//
// This is the FOURTH time a marker of ours surfaced as content — after the
// "MEASURED:" line, the truncation note, and once already in the review path,
// where the fix was applied to reviewCV while the critical fixes are built in
// analyzeResume and kept leaking. One function, applied at every exit, is the only
// version of this fix that holds: teaching the prompt not to echo it has failed
// every time, and a per-call-site cleanup only covers the call site someone
// remembered.
//
// Safe by construction: no résumé contains "ID:<hex-uuid> |". We are deleting our
// own string, never the candidate's words.

/** "ID:9a9f…-…f1aaf | " and a leading "[3]" bullet index, wherever they appear. */
const JOB_MARKER = /\bID:[0-9a-fA-F][0-9a-fA-F-]{7,}\s*(?:\|\s*)?/g
const LEADING_INDEX = /^\s*\[\d+\]\s*/

/** One string, cleaned. Returns "" unchanged for anything falsy. */
export function stripJobMarkers(text: string): string {
  if (!text) return text
  return text.replace(JOB_MARKER, "").replace(LEADING_INDEX, "").trim()
}

/**
 * Every string field of an object, cleaned, one level deep.
 *
 * Used on the analysis result so a new user-visible field cannot be forgotten:
 * whatever the model writes into `issue`, `why` or `fix` goes through the same
 * pass, and adding a field later inherits it for free.
 */
export function stripJobMarkersDeep<T>(value: T): T {
  if (typeof value === "string") return stripJobMarkers(value) as unknown as T
  if (Array.isArray(value)) return value.map((v) => stripJobMarkersDeep(v)) as unknown as T
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Action payloads carry the real targetId — that one IS the identifier and
      // the buttons depend on it. Only prose gets cleaned.
      out[k] = k === "action" ? v : stripJobMarkersDeep(v)
    }
    return out as unknown as T
  }
  return value
}
