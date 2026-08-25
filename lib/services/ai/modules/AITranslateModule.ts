// lib/services/ai/modules/AITranslateModule.ts
//
// Translates a resume between Spanish and English WITHOUT ever rebuilding its
// structure. The model only receives a flat array of prose strings and returns
// their translations, addressed by index; this module swaps each string back in
// place over a schema-validated clone. Ids, dates, emails, urls, enums and
// proper nouns are never sent, so the shape is mathematically preserved:
// a dropped or malformed entry falls back to the original text, never corrupts.

import {
  AI_MODEL,
  AI_TEMPERATURE_PRECISE,
  logAIUsage,
} from "@/lib/ai-client"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { ResumeSectionsSchema, type ResumeSections } from "@/types/resume"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { parseAIJson } from "../shared/ai-helpers"
import { computeCostUsd } from "../shared/cost-tracker"
import { collectResumeSegments } from "../shared/translate-fields"
import type { TranslateCVInput, TranslateCVResult } from "../shared/ai-types"
import { readChat } from "@/lib/services/ai/shared/chat-result"
import { strictJsonFormat } from "@/lib/services/ai/shared/strict-schema"
import { TranslateBatchShape } from "@/lib/services/ai/shared/ai-types"

// A single prose field longer than this is left in its ORIGINAL language rather
// than translated — never truncated. Real bullets/summaries sit far under it.
// Batches are bounded by BOTH item count and total chars so a CV full of long
// descriptions still fits each request comfortably.
const MAX_SEGMENT_CHARS = 6000
const BATCH_MAX_ITEMS = 40
const BATCH_MAX_CHARS = 6000
// Hard ceiling for a batch's completion, safely under the output limit of every
// model we run (kept model-agnostic so a model swap can't silently invalidate it).
// Replaces the old fixed 4000 clamp, which could truncate a legitimately large
// batch mid-JSON → parse error → the batch "failed". Right-sizing the request +
// this generous ceiling is the FIRST line of defense against truncation; the
// split-and-retry below is the second.
const AI_MAX_OUTPUT_TOKENS = 8000
// If a batch still fails as a whole (transient API error / unparseable reply), it
// is split in half and each half retried. A batch this size or smaller is NOT
// split further — a single stubborn segment is left in its original language
// (logged) rather than failing the whole CV. Total failure is caught upstream.
const MIN_SPLIT_ITEMS = 1

type TokenTotals = { prompt: number; completion: number }

export class AITranslateModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async translateCV(userId: string, input: TranslateCVInput, plan: string): Promise<TranslateCVResult> {
    await enforceAIQuota(userId, "translate-cv", plan)

    const targetLang: "es" | "en" = input.targetLang === "en" ? "en" : "es"

    // Parse through the schema → a fully-defaulted clone we own. The caller's
    // object is never mutated.
    const data: ResumeSections = ResumeSectionsSchema.parse(input.sectionData ?? {})
    const labels = (input.sectionLabels ?? []).map((l) => (typeof l === "string" ? l : ""))

    const segments = collectResumeSegments(data)

    // Only fields within the cap are translated; an oversized field is left in
    // its original language, NEVER truncated — no user content is ever lost.
    const contentSegs = segments.filter((s) => s.text.length <= MAX_SEGMENT_CHARS)
    const contentTexts = contentSegs.map((s) => s.text)
    const labelTexts = labels.filter((l) => l.length <= MAX_SEGMENT_CHARS)

    // Flat list = translatable prose, then translatable labels. The boundary
    // (contentTexts.length) lets us split the translated output back apart.
    const allTexts = [...contentTexts, ...labelTexts]

    if (allTexts.length === 0) {
      return { sectionData: data as unknown as Record<string, unknown>, sectionLabels: labels, targetLang, translatedCount: 0 }
    }

    const { translated, totals } = await this.translateBatched(userId, allTexts, targetLang, plan)

    // Apply content translations via setters (mutates `data`). Only the segments
    // we actually sent are touched; oversized ones keep their original text.
    contentSegs.forEach((seg, i) => {
      const t = translated[i]
      if (typeof t === "string" && t.trim().length > 0) seg.set(t)
    })

    // Apply label translations, consuming translated slots in order and leaving
    // oversized labels untouched.
    let li = contentTexts.length
    const outLabels = labels.map((orig) => {
      if (orig.length > MAX_SEGMENT_CHARS) return orig
      const t = translated[li++]
      return typeof t === "string" && t.trim().length > 0 ? t : orig
    })

    // One cost row per user action — sum across all batches.
    logAIUsage(userId, "translate-cv", {
      model: AI_MODEL,
      plan,
      promptTokens: totals.prompt,
      completionTokens: totals.completion,
      costUsd: computeCostUsd(AI_MODEL, totals.prompt, totals.completion),
    })

    return {
      sectionData: data as unknown as Record<string, unknown>,
      sectionLabels: outLabels,
      targetLang,
      translatedCount: allTexts.length,
    }
  }

  /** Splits `texts` into char/count-bounded batches and translates each. */
  private async translateBatched(
    userId: string,
    texts: string[],
    targetLang: "es" | "en",
    plan: string,
  ): Promise<{ translated: string[]; totals: TokenTotals }> {
    const out = new Array<string | undefined>(texts.length)
    const totals: TokenTotals = { prompt: 0, completion: 0 }

    let i = 0
    while (i < texts.length) {
      const batchIdx: number[] = []
      let chars = 0
      while (
        i < texts.length &&
        batchIdx.length < BATCH_MAX_ITEMS &&
        (batchIdx.length === 0 || chars + texts[i].length <= BATCH_MAX_CHARS)
      ) {
        batchIdx.push(i)
        chars += texts[i].length
        i++
      }
      await this.translateOneBatch(userId, texts, batchIdx, targetLang, plan, out, totals)
    }

    // Failure guard: if NOTHING translated (every batch failed even after the
    // split-and-retry above), that is a genuine service outage — throw so the
    // route never persists an all-original copy that looks "done" and then blocks
    // retry forever via the dedup. A PARTIAL result (some segments kept original,
    // e.g. the model dropped an index or an oversized field) is by design returned
    // intact — no user content is ever lost.
    const done = out.reduce<number>((n, v) => (typeof v === "string" ? n + 1 : n), 0)
    if (texts.length > 0 && done === 0) {
      throw new Error("translate_service_error")
    }

    // Any single index the model omitted from an otherwise-successful batch keeps
    // its original text — no content is lost.
    const translated = texts.map((orig, idx) => (typeof out[idx] === "string" ? (out[idx] as string) : orig))
    return { translated, totals }
  }

  private async translateOneBatch(
    userId: string,
    texts: string[],
    batchIdx: number[],
    targetLang: "es" | "en",
    plan: string,
    out: Array<string | undefined>,
    totals: TokenTotals,
  ): Promise<void> {
    const targetName = targetLang === "en" ? "English" : "Spanish (español)"
    // Local (0..n) → global index keeps the prompt compact and the mapping exact.
    const items = batchIdx.map((g, local) => ({ i: local, s: texts[g] }))

    const system = `You are a professional resume translator. Translate every string in the input "items" array into ${targetName}, preserving meaning, register and professional tone. RULES: (1) Do NOT translate proper nouns — company names, product / technology / programming-language / framework names (React, Python, AWS, XCTest, Kubernetes, SQL…), brand names, or acronyms; leave them exactly as written. (2) Keep numbers, dates, percentages, URLs and emails unchanged. (3) Preserve bullet markers (•, -), line breaks and overall formatting. (4) Do NOT add, remove, summarize or embellish — translate only, one-to-one. Return ONLY a JSON object of the form {"t":[{"i":<index>,"v":"<translated string>"}]}, with exactly one entry per input index and nothing else.`

    // Size the completion to THIS batch instead of a fixed clamp. Translation can
    // expand ~1.8× vs source (ES↔EN) and the JSON wrapper adds ~12 chars/item;
    // undersizing truncates the reply mid-JSON → parse error. Capped by the model
    // ceiling. (~3 chars per token.)
    const approxChars = items.reduce((a, it) => a + it.s.length, 0)
    const maxTokens = Math.min(
      AI_MAX_OUTPUT_TOKENS,
      Math.ceil((approxChars * 1.8) / 3) + items.length * 12 + 300,
    )

    try {
      const response = await this.aiClient.chat({
        model: AI_MODEL,
        max_tokens: maxTokens,
        temperature: AI_TEMPERATURE_PRECISE,
        response_format: strictJsonFormat("translate_cv", TranslateBatchShape),
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify({ items }) },
        ],
      })

      const leido = readChat(response)
      // Un lote truncado deja items sin traducir y el JSON a medio cerrar. Antes
      // caía al catch de abajo rotulado «batch failed», que es lo mismo que se
      // dice cuando se cae la red: dos causas distintas con un solo nombre.
      if (leido.truncated) {
        this.logger.warn("[AIService.translateCV] batch truncated by token ceiling", { size: batchIdx.length })
      }
      if (leido.refusal) {
        this.logger.warn("[AIService.translateCV] model refused", { refusal: leido.refusal.slice(0, 120) })
      }
      const raw = parseAIJson<{ t?: Array<{ i?: number; v?: string }> }>(leido.text || "{}")
      for (const entry of raw.t ?? []) {
        if (typeof entry?.i !== "number" || typeof entry?.v !== "string") continue
        const global = batchIdx[entry.i]
        if (global === undefined) continue // out-of-range → ignore
        out[global] = entry.v
      }

      const usage = response.usage
      totals.prompt += usage?.prompt_tokens ?? 0
      totals.completion += usage?.completion_tokens ?? 0
    } catch (err) {
      this.logger.warn("[AIService.translateCV] batch failed", {
        size: batchIdx.length,
        error: err instanceof Error ? err.message : String(err),
      })

      // Self-healing: a whole-batch failure is usually a truncated / unparseable
      // reply (too much output at once) or a transient API blip. Splitting in half
      // and retrying each side shrinks the output so it fits AND spaces out the
      // calls — most failures recover here. The SDK already retried the network
      // layer 3×, so this targets the response-shape failures it can't fix.
      if (batchIdx.length > MIN_SPLIT_ITEMS) {
        const mid = Math.ceil(batchIdx.length / 2)
        await this.translateOneBatch(userId, texts, batchIdx.slice(0, mid), targetLang, plan, out, totals)
        await this.translateOneBatch(userId, texts, batchIdx.slice(mid), targetLang, plan, out, totals)
        return
      }

      // A single segment still failing after all retries is left in its original
      // language (never lost). The upstream ratio guard decides whether enough of
      // the CV translated to be worth persisting — a widespread outage throws there
      // so no half-baked copy is ever saved.
      this.logger.warn("[AIService.translateCV] segment untranslatable, keeping original", {
        globalIndex: batchIdx[0],
      })
    }
  }
}
