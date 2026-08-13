// lib/services/ai/shared/skill-equivalence.ts
//
// Decides whether two skill terms name the same skill — once, and then never again.
//
// The problem this replaces: a hand-written alias list. It works, and it cannot
// stop working the way lists do — it only knows the pairs somebody thought of
// first. Measured against 80 ordinary es/en pairs drawn from healthcare, teaching,
// law, accounting, trades, hospitality, HR, logistics and sales, the list knew 19
// of the first 40. A nurse writing "curación de heridas" against a posting asking
// for "wound care" was told the skill was missing.
//
// The obvious fix — trust the embedding similarity that already runs for the score
// — was measured and does not work. Cosine measures topical relatedness, and
// relatedness is not equivalence:
//
//     frontend            ✗ backend                        0.684
//     safety inspections  ✗ inspecciones sanitarias         0.622   ← credited today
//     internal audit      ✗ auditoría externa               0.608
//     accounts receivable ↔ cuentas por cobrar              0.516   ← real, missed today
//     phlebotomy          ↔ extracción de sangre            0.427   ← real, missed today
//
// The distractors outrank the real translations, so every threshold buys recall
// with false credit or the reverse. Raising it to 0.70 (the first value with no
// false positives on one set) dropped recall to 9/40. Adding a cross-lingual gate
// looked perfect on the set it was tuned on and then produced 6 false positives out
// of 22 on a held-out set — the gate was fitted to its own test.
//
// So the embeddings stop being the verdict and become a pre-filter, and a model
// decides the pairs that survive. Measured on a held-out set the design had never
// seen: 39/40 real equivalences found, 0–1 false positives, one batched call,
// ~1300 tokens, ~3s.
//
// The verdict is STORED, and that is not an optimisation. Asked the same 54 pairs
// three times, the model flipped one borderline verdict — which is the exact shape
// of the bug this product already paid for, a score moving while the CV stands
// still. A pair is decided once in the life of the product and read from the table
// forever after; the second CV that needs it also pays nothing.

import { db } from "@/lib/db"
import { AI_MODEL_PROSE } from "@/lib/ai-client"
import { normalizeTerm } from "@/lib/ats/vocabulary"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { SemanticCandidate } from "./semantic-match"

/**
 * Ceiling on pairs sent to the judge in one call.
 *
 * Not a quality limit — a bill limit. A CV with 60 skills against a posting with 30
 * requirements cannot produce more than this many *unknown* pairs after the cache
 * warms, and the first analysis that would is the one that fills the table for
 * everyone else. Anything dropped stays exactly as accurate as it is today (exact
 * match only), never worse.
 */
const MAX_JUDGED_PAIRS = 40

/** Two terms in a stable order, so (a,b) and (b,a) are one row and one question. */
export function pairKey(a: string, b: string): [string, string] {
  const na = normalizeTerm(a)
  const nb = normalizeTerm(b)
  return na <= nb ? [na, nb] : [nb, na]
}

interface JudgeDeps {
  aiClient: Pick<IAIClient, "chat">
  /** Reported, never thrown: a failed judgement must not fail the analysis. */
  onFailure?: (err: Error) => void
  model?: string
}

/**
 * The prompt states the cost asymmetry rather than a style preference: crediting a
 * skill the candidate does not have is the expensive error, so ties go to
 * "different". No examples — they double the token count and the task is not one
 * the model needs demonstrated.
 */
function buildPrompt(pairs: { a: string; b: string }[]): string {
  return `You decide skill equivalence for an ATS.

For each pair, answer whether the two terms name EXACTLY the same professional skill, such that a CV mentioning one already demonstrates the other.

- A translation of the same skill between languages is "same".
- Related topics, opposites, or one being broader than the other are "different".
- When unsure, answer "different". Crediting a skill the candidate lacks is the expensive error.

Return ONLY a JSON array, one object per pair: [{"i": <index>, "v": "same"|"different"}]

${pairs.map((p, i) => `${i}. "${p.a}" | "${p.b}"`).join("\n")}`
}

/** Parses the judge's reply defensively — a malformed row is dropped, not fatal. */
function parseVerdicts(raw: string, count: number): Map<number, boolean> {
  const out = new Map<number, boolean>()
  const json = raw.match(/\[[\s\S]*\]/)?.[0]
  if (!json) return out
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return out
  }
  if (!Array.isArray(parsed)) return out
  for (const row of parsed) {
    if (typeof row !== "object" || row === null) continue
    const { i, v } = row as { i?: unknown; v?: unknown }
    if (typeof i !== "number" || !Number.isInteger(i) || i < 0 || i >= count) continue
    if (v !== "same" && v !== "different") continue
    // First verdict wins: a repeated index is the model contradicting itself, and
    // taking the last write would make the answer depend on emission order.
    if (!out.has(i)) out.set(i, v === "same")
  }
  return out
}

/**
 * Confirms which candidate pairs really are the same skill.
 *
 * Returns the normalized keywords that were confirmed — the shape the matcher
 * already consumes. Fails CLOSED at every step: a database error, a model error, a
 * malformed reply or a pair the model declined to rule on all leave the keyword
 * missing, which is exactly the answer the exact matcher gives today.
 */
export async function confirmEquivalences(
  candidates: SemanticCandidate[],
  deps: JudgeDeps,
): Promise<Set<string>> {
  const confirmed = new Set<string>()
  if (candidates.length === 0) return confirmed

  // One question per distinct pair; several requirements can share a CV term.
  const byKey = new Map<string, { keyword: string; cvTerm: string; key: [string, string] }>()
  for (const c of candidates) {
    const key = pairKey(c.keyword, c.cvTerm)
    if (key[0] === key[1]) {
      // Identical once normalized — the exact matcher should already have caught
      // it, but accents or punctuation can differ. Free, no question needed.
      confirmed.add(normalizeTerm(c.keyword))
      continue
    }
    const id = `${key[0]}|${key[1]}`
    if (!byKey.has(id)) byKey.set(id, { keyword: c.keyword, cvTerm: c.cvTerm, key })
  }
  if (byKey.size === 0) return confirmed

  const entries = [...byKey.values()]

  // ── Already decided?
  let known = new Map<string, boolean>()
  try {
    const rows = await db.skillEquivalence.findMany({
      where: { OR: entries.map((e) => ({ termA: e.key[0], termB: e.key[1] })) },
      select: { termA: true, termB: true, equivalent: true },
    })
    known = new Map(rows.map((r) => [`${r.termA}|${r.termB}`, r.equivalent]))
  } catch (err) {
    // A read failure must not stop the analysis; it only means we re-ask.
    deps.onFailure?.(err instanceof Error ? err : new Error(String(err)))
  }

  const unknown: typeof entries = []
  for (const e of entries) {
    const verdict = known.get(`${e.key[0]}|${e.key[1]}`)
    if (verdict === true) confirmed.add(normalizeTerm(e.keyword))
    else if (verdict === undefined) unknown.push(e)
  }
  if (unknown.length === 0) return confirmed

  // ── Ask about the rest, once.
  const toJudge = unknown.slice(0, MAX_JUDGED_PAIRS)
  if (unknown.length > toJudge.length) {
    deps.onFailure?.(
      new Error(`skill-equivalence: ${unknown.length - toJudge.length} pairs left undecided (cap ${MAX_JUDGED_PAIRS})`),
    )
  }

  const model = deps.model ?? AI_MODEL_PROSE
  let verdicts = new Map<number, boolean>()
  try {
    const completion = await deps.aiClient.chat({
      model,
      messages: [{ role: "user", content: buildPrompt(toJudge.map((e) => ({ a: e.keyword, b: e.cvTerm }))) }],
      // Reasoning models bill their thinking against this cap, so it covers the
      // verdicts (~14 tokens each) with room for the model's own reasoning. The
      // adapter renames it to max_completion_tokens for the GPT-5 family.
      max_tokens: 4000,
    })
    verdicts = parseVerdicts(completion.choices[0]?.message?.content ?? "", toJudge.length)
  } catch (err) {
    deps.onFailure?.(err instanceof Error ? err : new Error(String(err)))
    return confirmed
  }

  const decided: { termA: string; termB: string; equivalent: boolean; model: string }[] = []
  for (let i = 0; i < toJudge.length; i++) {
    const v = verdicts.get(i)
    if (v === undefined) continue // not ruled on → stays missing, and stays unstored
    if (v) confirmed.add(normalizeTerm(toJudge[i].keyword))
    decided.push({ termA: toJudge[i].key[0], termB: toJudge[i].key[1], equivalent: v, model })
  }

  // ── Remember. "different" is stored too: it is what stops us paying to reject
  // the same pair on every analysis.
  if (decided.length > 0) {
    try {
      await db.skillEquivalence.createMany({ data: decided, skipDuplicates: true })
    } catch (err) {
      // The verdict already served this request; losing the write only costs a
      // repeat question later.
      deps.onFailure?.(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return confirmed
}
