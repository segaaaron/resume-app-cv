// lib/services/ai/shared/summary-gate.ts
//
// One owner of "the model answered — what does the user actually get?".
//
// This logic was written inline inside generateSummary, so improveSummary never
// had it: the same model, the same clichés, the same dropped figures, and only
// one of the two paths checked. A user who typed their own summary and pressed
// Improve — or who had no CV at all and described themselves — got whatever came
// back, unranked and unretried. Quality cannot depend on which button was
// pressed, so the gate stops being part of one endpoint and becomes a thing both
// call.
import { AI_MODEL } from "@/lib/ai-client"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { parseAIJson, stripVersionLabel, detectHallucination, ANY_METRIC_REGEX } from "./ai-helpers"
import { assessSummary } from "./summary-quality"
import { isTrivialEdit } from "./text-similarity"

export interface SummaryGateUsage {
  promptTokens: number
  completionTokens: number
}

export interface SummaryGateInput {
  /** Whatever came back in `versions` — unvalidated, straight from the model. */
  rawVersions: unknown
  /** Everything the candidate stated. Anything outside it is a hallucination. */
  source: string
  /** The candidate's real figures. Empty is a valid, common profile. */
  metrics: string[]
  /** The prompt of the first attempt — the retry re-sends it with the verdict. */
  basePrompt: string
  langInstruction: string
  language: "es" | "en"
  /** Mirrors the caller's own call so a retry cannot drift from its endpoint. */
  temperature: number
  maxTokens: number
  endpoint: "generate-summary" | "improve-summary"
}

/**
 * A version and where the model put it.
 *
 * The prompt asks for version 1 EXECUTIVE, 2 SPECIALIST, 3 VALUE PROPOSITION,
 * and the modal labels each card from its position in the array. Ranking
 * reorders that array, so position stopped meaning what the label said and a
 * user could read the specialist text under the "Executive" heading. The label
 * belongs to the text, not to the slot it lands in.
 */
export interface GatedVersion {
  text: string
  /** Position in the model's answer — 0 EXECUTIVE, 1 SPECIALIST, 2 VALUE PROP. */
  sourceIndex: number
}

export interface SummaryGateResult {
  /** Best first — index 0 is what the user reads. */
  versions: GatedVersion[]
  /**
   * The retry's tokens, or null when none ran.
   *
   * Returned rather than logged here: the caller owns its AIUsageLog entry, and
   * one endpoint must produce one row. It exists because the first version of
   * this gate logged `response.usage` — the FIRST call's — on the retry path,
   * so every retry's tokens went unrecorded and the cost per user read low.
   * Making the function that spends the tokens also return them is what stops
   * that from being possible.
   */
  retryUsage: SummaryGateUsage | null
}

/**
 * How the first attempt is told about the candidate's figures.
 *
 * Lives next to the gate that enforces it: stating the rule and checking it are
 * two halves of one contract, and they drifted apart once already.
 * generate-summary handed the model the extracted figures; improve-summary
 * handed it nothing and left it to find them in prose. It didn't — measured
 * live, the first attempt dropped the figures and the retry had to rescue it in
 * 5 of 6 runs, so the safety net was paying for a gap in the prompt. Handing
 * the list over is the same move that fixed this for generate-summary: the
 * regex finds them, the model only writes.
 *
 * The rule goes LAST in the prompt, because that is the one the model follows
 * when instructions conflict.
 */
export function buildMetricGuidance(
  metrics: string[],
  language: "es" | "en",
): { block: string; rule: string } {
  if (language === "en") {
    return {
      block: metrics.length ? `\n=== THE CANDIDATE'S REAL NUMBERS ===\n${metrics.map((m) => `• ${m}`).join("\n")}` : "",
      rule: metrics.length
        ? `ON NUMBERS — read this last and follow it exactly:\nThe candidate's real figures are listed above. At least one of them MUST appear, as a figure, in EVERY version. "Cut crash rate 20%" is worth more to a recruiter than "significantly improved stability" — the number IS the point, and vaguing it out throws away the strongest thing this candidate has. Never round it, never invent one that is not on that list, and never leave a bracket.`
        : `ON NUMBERS — read this last and follow it exactly:\nThis profile states no figures at all. That is FINE and very common. A summary with zero numbers, built on concrete specifics the candidate actually has (sector, stack, scope, real achievement), is a CORRECT and expected answer — not a weak one. Do NOT reach for a number to sound impressive: any figure not in the profile will be rejected and the candidate will get nothing back.`,
    }
  }
  return {
    block: metrics.length ? `\n=== LAS CIFRAS REALES DEL CANDIDATO ===\n${metrics.map((m) => `• ${m}`).join("\n")}` : "",
    rule: metrics.length
      ? `SOBRE LAS CIFRAS — lee esto al final y cúmplelo exactamente:\nLas cifras reales del candidato están listadas arriba. Al menos una DEBE aparecer, como cifra, en CADA versión. "Redujo los crashes un 20%" vale más para un recruiter que "mejoró significativamente la estabilidad" — el número ES el punto, y difuminarlo tira lo más fuerte que tiene este candidato. Nunca la redondees, nunca inventes una que no esté en esa lista, y nunca dejes un corchete.`
      : `SOBRE LAS CIFRAS — lee esto al final y cúmplelo exactamente:\nEste perfil no declara ninguna cifra. Eso está BIEN y es muy común. Un resumen con cero números, construido sobre datos concretos que el candidato sí tiene (sector, stack, alcance, logro real), es una respuesta CORRECTA y esperada — no una respuesta débil. NO busques un número para sonar impresionante: cualquier cifra que no esté en el perfil será rechazada y el candidato no recibirá nada.`,
  }
}

/** Model output → what the user gets. Ranked, checked, retried once if needed. */
export async function gateSummaryVersions(
  aiClient: IAIClient,
  logger: ILogger,
  input: SummaryGateInput,
): Promise<SummaryGateResult> {
  const { rawVersions, source, metrics, endpoint } = input
  const profileHasMetrics = metrics.length > 0

  // Cap AFTER filtering, not before. Slicing first spends the three slots on
  // whatever the model happened to emit — a null or an empty string in the
  // first position pushed a real version out of the window and the user lost
  // it. Three valid versions, not the first three attempts.
  const candidates: GatedVersion[] = (Array.isArray(rawVersions) ? rawVersions : [])
    .map((v, sourceIndex) => ({ v, sourceIndex }))
    .filter((e): e is { v: string; sourceIndex: number } => typeof e.v === "string" && e.v.trim().length > 0)
    .map((e) => ({ text: stripVersionLabel(e.v), sourceIndex: e.sourceIndex }))
    .filter((e) => e.text.trim().length > 0)
    .slice(0, 3)

  // Anything the candidate did not state — invented tech, invented figures, or a
  // "[X%]" placeholder — never reaches the CV. detectHallucination has no
  // opt-out: allowPlaceholders was removed in F1 once a bracket shipped into a
  // real summary.
  let dropped = 0
  const clean = candidates.filter((v) => {
    if (detectHallucination(v.text, source)) {
      dropped++
      return false
    }
    return true
  })
  if (dropped > 0) logger.warn(`[${endpoint}] dropped hallucinated versions`, { dropped, kept: clean.length })

  const ranked = dropNearDuplicates(rank(clean, profileHasMetrics))

  const flawed = ranked.filter((v) => !assessSummary(v.text, profileHasMetrics).alreadyGood)
  if (flawed.length > 0) {
    logger.warn(`[${endpoint}] versions with quality issues`, {
      flawed: flawed.length,
      total: ranked.length,
      issues: [...new Set(flawed.flatMap((v) => assessSummary(v.text, profileHasMetrics).issues))],
    })
  }

  if (ranked.length === 0) return { versions: [], retryUsage: null }

  // One gate for both failures.
  //
  // Prompt wording cannot close this. GUARD (arXiv 2410.06716) proves a
  // constraint cannot be GUARANTEED by autoregressive generation — strict
  // satisfaction needs inference-time filtering. And the TACL survey on
  // self-correction found "no prior work shows successful self-correction with
  // feedback from prompted LLMs", but that it "works well in tasks that can use
  // reliable external feedback". assessSummary and ANY_METRIC_REGEX are exactly
  // that: deterministic external verifiers. That is why naming the failure and
  // retrying took metrics from 2/5 to 5/5 while telling the model harder in the
  // prompt did nothing.
  // Both checks judge the version the user actually reads.
  //
  // They used to disagree: the cliché check looked at the best version, the
  // metric check asked whether ANY version carried a figure. So a run where the
  // best had no number but the third did counted as fine and never retried —
  // and that is not rare, because a version missing its figure scores one issue
  // (missing_metric), exactly like a version that has the figure but opens
  // weakly. The tie holds, the sort is stable, the model's own order wins, and
  // the user reads the one without the number. Measured: 3 of 10 runs.
  const best = ranked[0]
  const missingMetrics = profileHasMetrics && !ANY_METRIC_REGEX.test(best.text)
  const hasCliche = assessSummary(best.text, profileHasMetrics).issues.includes("cliche")
  if (!missingMetrics && !hasCliche) return { versions: ranked, retryUsage: null }

  logger.warn(`[${endpoint}] retrying once`, { missingMetrics, hasCliche })
  const retry = await retryForQuality(aiClient, input, { missingMetrics, hasCliche })
  if (!retry) return { versions: ranked, retryUsage: null }

  // The retry is model output too — it gets the same hallucination check the
  // first attempt got. Skipping it here would make "retry" a way in.
  const retryClean = retry.versions.filter((v) => !detectHallucination(v.text, source))
  const retryRanked = dropNearDuplicates(rank(retryClean, profileHasMetrics))
  if (retryRanked.length === 0) {
    logger.warn(`[${endpoint}] retry produced nothing usable — keeping the first result`)
    return { versions: ranked, retryUsage: retry.usage }
  }

  // Take it only if it fixed what we retried for and broke nothing else. A retry
  // that trades a cliché for dropped figures is not a fix, and gating on both
  // axes is what protects the metric rate the retry was built to raise.
  //
  // "Broke nothing" is judged per axis, and only on the axes that were sound to
  // begin with. Demanding a cliché-free retry even when the first attempt had no
  // cliché problem reads stricter but is worse: it throws away a retry that
  // recovered the figures and keeps the original, which had none — trading the
  // candidate's strongest asset for a phrasing nit. Measured, that alone took
  // V1-with-a-figure from 8/8 down to 7/8 and 4/6.
  const retryHasMetrics = !profileHasMetrics || ANY_METRIC_REGEX.test(retryRanked[0].text)
  const retryTopClean = !assessSummary(retryRanked[0].text, profileHasMetrics).issues.includes("cliche")
  const fixedWhatFailed = (!missingMetrics || retryHasMetrics) && (!hasCliche || retryTopClean)
  const brokeNothing = retryHasMetrics && (!hasCliche || retryTopClean)

  if (!fixedWhatFailed || !brokeNothing) {
    logger.warn(`[${endpoint}] retry did not improve — keeping the first result`)
    // Still billed: the tokens were spent whether or not the answer was kept.
    return { versions: ranked, retryUsage: retry.usage }
  }
  return { versions: retryRanked, retryUsage: retry.usage }
}

/** Fewest quality issues first. Ranked, never filtered: a summary with a weak
 *  phrase still beats no summary, and the clean ones surface where the user
 *  reads. */
function rank(versions: GatedVersion[], profileHasMetrics: boolean): GatedVersion[] {
  return [...versions].sort(
    (a, b) =>
      assessSummary(a.text, profileHasMetrics).issues.length - assessSummary(b.text, profileHasMetrics).issues.length,
  )
}

/**
 * Drop a version that is ≥90% identical to one already kept.
 *
 * The three versions are sold as distinct positionings (executive / specialist /
 * value-proposition); when the model returns two that differ by a word, showing
 * both is offering the same choice twice. This is the between-versions twin of
 * the isTrivialEdit(original, version) check the caller already runs — that one
 * stops a version echoing the CURRENT summary, this one stops the versions
 * echoing EACH OTHER. Runs on the already-ranked list, so the cleanest of a
 * near-identical pair is the one that survives.
 */
function dropNearDuplicates(versions: GatedVersion[]): GatedVersion[] {
  const kept: GatedVersion[] = []
  for (const v of versions) {
    if (kept.some((k) => isTrivialEdit(k.text, v.text))) continue
    kept.push(v)
  }
  return kept
}

/**
 * One more attempt, naming the exact failure.
 *
 * A generic "try again" changes nothing — the model has to be told what it did
 * wrong, and told last. And it must write a FRESH draft: paraphrasing a cliché
 * preserves its shape ("Passionate about" becomes "Enthusiastic about"), which
 * moves the problem instead of solving it.
 *
 * The rejected text is deliberately NOT quoted back. Naming a forbidden phrase
 * primes it — the one mechanistic study on this (arXiv 2601.08070) reports the
 * forbidden word appearing in 87.5% of violations when named, though it is
 * single-author and unreplicated, so treat it as a reason to be careful rather
 * than a proven law.
 */
async function retryForQuality(
  aiClient: IAIClient,
  input: SummaryGateInput,
  failure: { missingMetrics: boolean; hasCliche: boolean },
): Promise<{ versions: GatedVersion[]; usage: SummaryGateUsage } | null> {
  const { basePrompt, metrics, langInstruction, language, temperature, maxTokens } = input
  const parts: string[] = []

  if (language === "en") {
    parts.push("YOUR LAST ATTEMPT FAILED. Write all three summaries again from scratch — do NOT paraphrase what you wrote before, start fresh.")
    if (failure.missingMetrics) {
      parts.push(`Your strongest version contained no number at all, and this candidate has these:\n${metrics.map((m) => `• ${m}`).join("\n")}\n\nEvery version must quote at least one of those figures verbatim — "20%", "40 minutes to under 6", "5 engineers". Not "significantly", not "substantially": the digit itself. That figure is the strongest thing this person has and leaving it out wastes it.`)
    }
    if (failure.hasCliche) {
      parts.push("Your writing leaned on filler that says nothing about this person — the kind of phrase that fits any candidate in any role. Replace every one of them with a concrete detail from the profile: the tool, the sector, the actual result. If a sentence would still make sense on someone else's CV, it does not belong on this one.")
    }
  } else {
    parts.push("TU INTENTO ANTERIOR FALLÓ. Escribe los tres resúmenes otra vez desde cero — NO parafrasees lo anterior, empieza de nuevo.")
    if (failure.missingMetrics) {
      parts.push(`Tu mejor versión no llevaba ningún número, y este candidato tiene estos:\n${metrics.map((m) => `• ${m}`).join("\n")}\n\nCada versión debe citar al menos una de esas cifras literalmente — "20%", "40 minutos a 6", "5 ingenieros". No "significativamente", no "notablemente": el dígito. Esa cifra es lo más fuerte que tiene esta persona y omitirla la desperdicia.`)
    }
    if (failure.hasCliche) {
      parts.push("Tu redacción se apoyó en relleno que no dice nada de esta persona — de esas frases que le encajan a cualquier candidato en cualquier puesto. Sustituye cada una por un dato concreto del perfil: la herramienta, el sector, el resultado real. Si una frase seguiría teniendo sentido en el CV de otro, no pertenece a este.")
    }
  }

  try {
    const res = await aiClient.chat({
      model: AI_MODEL,
      max_tokens: maxTokens,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `Eres un Consultor de Carrera de Élite. NUNCA inventas cifras ni escribes placeholders. ${langInstruction}` },
        { role: "user", content: `${basePrompt}\n\n${parts.join("\n\n")}` },
      ],
    })
    const parsed = parseAIJson<{ versions?: unknown }>(res.choices[0]?.message?.content ?? "")
    const versions: GatedVersion[] = (Array.isArray(parsed.versions) ? parsed.versions : [])
      .map((v, sourceIndex) => ({ v, sourceIndex }))
      .filter((e): e is { v: string; sourceIndex: number } => typeof e.v === "string" && e.v.trim().length > 0)
      .map((e) => ({ text: stripVersionLabel(e.v), sourceIndex: e.sourceIndex }))
      .filter((e) => e.text.trim().length > 0)
      .slice(0, 3)
    return {
      versions,
      usage: {
        promptTokens: res.usage?.prompt_tokens ?? 0,
        completionTokens: res.usage?.completion_tokens ?? 0,
      },
    }
  } catch {
    // A failed retry is not a failed request — the first result still stands.
    return null
  }
}
