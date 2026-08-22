// lib/services/ai/shared/soft-skill-evidence.ts
//
// Decides which of a posting's soft skills the candidate's bullets actually
// DEMONSTRATE.
//
// This exists because the soft-skills sub-score could not be moved. It was
// computed by the same primitive as hard skills — does the CV contain this
// keyword — and a posting's soft requirements are written as sentences:
// "Comfortable working with ambiguity", "Fast execution without lowering the
// bar", "Collaboration with cross-functional teams". Those strings never appear
// in a bullet, so the sub-score was pinned at 0% no matter what the user wrote,
// and every one of them stayed on the "missing" list forever. The panel said, in
// its own words, that they "only count if a bullet demonstrates them" — while the
// code counted only the literal phrase. The instruction and the measurement
// contradicted each other, and the user was the one who paid for it: writing the
// bullet we asked for changed nothing on screen.
//
// A behaviour cannot be matched as a string, and it cannot be pattern-matched
// either without hard-coding a rule per behaviour — the list problem again, one
// rule short forever. What CAN be done is read the bullet and answer whether it
// shows the behaviour, which is exactly what a recruiter does.
//
// The verdict is stored, keyed by the CONTENT it was given. Same bullets, same
// requirements, same answer — including across deploys and instances, which an
// in-memory cache cannot promise. Editing a bullet changes the key and buys a
// fresh read; leaving the CV alone costs nothing and cannot drift. That is the
// same contract the score already owes the user: the same CV scores the same.

import { AI_MODEL_PROSE } from "@/lib/ai-client"
import { normalizeTerm } from "@/lib/ats/vocabulary"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import { answerHash, readAnswer, writeAnswer } from "./answer-cache"

/** Bullets past this add tokens without adding evidence — a behaviour shown in
 *  bullet 40 is shown in one of the first 30 too. */
const MAX_BULLETS = 30
/** Soft requirements past this are not what the posting is really asking for. */
const MAX_SKILLS = 15
/** Bullets are trimmed so one pasted essay cannot dominate the call. */
const MAX_BULLET_CHARS = 300

export interface SoftSkillEvidenceDeps {
  aiClient: Pick<IAIClient, "chat">
  onFailure?: (err: Error) => void
  model?: string
  /**
   * Tokens que gastó ESTA llamada, para que el llamador los sume a los suyos. Corre dentro
   * de cada análisis ATS con techo de 3.000 tokens y no se estaba contando en ningún lado.
   */
  onUsage?: (usage: { promptTokens: number; completionTokens: number }) => void
}

/**
 * The cache key is the QUESTION, not the user: two CVs that happen to state the
 * same bullets against the same requirements deserve the same answer, and the
 * table stays small because the key is a hash.
 */
function inputHashOf(skills: string[], bullets: string[], model: string): string {
  return answerHash(model, skills.join(""), bullets.join(""))
}

function buildPrompt(skills: string[], bullets: string[]): string {
  return `You are screening a CV against a posting's soft requirements.

For each SOFT SKILL, name the ONE bullet that proves it, or null.

A bullet proves a soft skill only when the words in it describe the behaviour happening. Not when the behaviour would plausibly have been needed, not when the role usually involves it, not when the bullet is merely in the same area.

Test each candidate this way: quote the words from the bullet that show it. If you cannot quote words that show the behaviour itself, the answer is null.

Most soft requirements will be null, because most CVs describe WHAT was built rather than HOW the person worked. A bullet proves at most one soft skill; if you find yourself using one bullet for several, you are stretching and all but the strongest are null.

Return ONLY a JSON array: [{"s": <skill index>, "b": <bullet index or null>, "q": "<quoted words, or empty when null>"}]

SOFT SKILLS:
${skills.map((s, i) => `${i}. ${s}`).join("\n")}

BULLETS:
${bullets.map((b, i) => `${i}. ${b}`).join("\n")}`
}

/** Loose comparison for the quote guard: the model re-spaces and re-cases freely. */
function foldForQuote(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim()
}

/**
 * Reads the reply defensively, and makes the quote do real work.
 *
 * The model is asked to quote the words that prove the behaviour, and the quote is
 * then checked against the bullet it cites. That is not politeness — it is the
 * difference between evidence and a plausible sentence. Measured against the real
 * API, an unguarded judge credited SEVEN of seven soft requirements for one CV,
 * which is the 0% failure inverted: a lever that always reads full tells the user
 * nothing. Requiring words that actually exist in the cited line removes the
 * credits the model could not point at.
 */
function parseEvidence(raw: string, skills: string[], bullets: string[]): Set<number> {
  const demonstrated = new Set<number>()
  const json = raw.match(/\[[\s\S]*\]/)?.[0]
  if (!json) return demonstrated
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return demonstrated
  }
  if (!Array.isArray(parsed)) return demonstrated
  const folded = bullets.map(foldForQuote)
  for (const row of parsed) {
    if (typeof row !== "object" || row === null) continue
    const { s, b, q } = row as { s?: unknown; b?: unknown; q?: unknown }
    if (typeof s !== "number" || !Number.isInteger(s) || s < 0 || s >= skills.length) continue
    // A bullet index outside the range is the model pointing at evidence that was
    // never sent — the one failure mode that would credit a skill on nothing.
    if (typeof b !== "number" || !Number.isInteger(b) || b < 0 || b >= bullets.length) continue
    // The quote has to be real words from that line. Three words minimum: one or
    // two can be coincidence in any sentence.
    if (typeof q !== "string") continue
    const quote = foldForQuote(q)
    if (quote.split(" ").filter(Boolean).length < 3) continue
    if (!folded[b].includes(quote)) continue
    demonstrated.add(s)
  }
  return demonstrated
}

/**
 * Returns the normalized soft skills the bullets demonstrate.
 *
 * Fails CLOSED everywhere: no evidence found is the same answer as no call made,
 * which is the behaviour the score has today. It can only ever raise the
 * soft-skills sub-score, never lower it.
 */
export async function findDemonstratedSoftSkills(
  softSkills: string[],
  bullets: string[],
  deps: SoftSkillEvidenceDeps,
  /**
   * The résumé these bullets belong to.
   *
   * Every cached answer has to be findable by the CV it came from, or deleting
   * the CV leaves behind a payload quoting the candidate's own lines that nothing
   * can ever locate again — the row is addressed by content.
   */
  resumeId?: string,
): Promise<Set<string>> {
  const out = new Set<string>()

  const skills = [...new Set(softSkills.map((s) => s.trim()).filter(Boolean))].slice(0, MAX_SKILLS)
  const lines = [...new Set(bullets.map((b) => b.trim().slice(0, MAX_BULLET_CHARS)).filter(Boolean))].slice(0, MAX_BULLETS)
  if (skills.length === 0 || lines.length === 0) return out

  const model = deps.model ?? AI_MODEL_PROSE
  const inputHash = inputHashOf(skills, lines, model)

  // ── Answered before?
  const stored = await readAnswer("soft-evidence", inputHash)
  if (Array.isArray(stored)) {
    for (const s of stored) if (typeof s === "string") out.add(s)
    return out
  }

  let indices = new Set<number>()
  try {
    const completion = await deps.aiClient.chat({
      model,
      messages: [{ role: "user", content: buildPrompt(skills, lines) }],
      // Reasoning models bill their thinking against this cap; the verdicts
      // themselves are ~12 tokens each. The adapter renames it per model family.
      max_tokens: 3000,
    })
    // Antes de parsear: los tokens ya se gastaron aunque la respuesta venga mal.
    deps.onUsage?.({
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
    })
    indices = parseEvidence(completion.choices[0]?.message?.content ?? "", skills, lines)
  } catch (err) {
    deps.onFailure?.(err instanceof Error ? err : new Error(String(err)))
    return out
  }

  const demonstrated = [...indices].map((i) => normalizeTerm(skills[i])).filter(Boolean)
  for (const d of demonstrated) out.add(d)

  // ── Remember, so the same CV keeps scoring the same. An empty result is stored
  // too: "nothing demonstrated" is an answer, and re-asking it every analysis is
  // how a stable score turns into a drifting one.
  await writeAnswer("soft-evidence", inputHash, demonstrated, model, resumeId)

  return out
}
