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

// A single prose field longer than this is left in its ORIGINAL language rather
// than translated — never truncated. Real bullets/summaries sit far under it.
// Batches are bounded by BOTH item count and total chars so a CV full of long
// descriptions still fits each request comfortably.
const MAX_SEGMENT_CHARS = 6000
const BATCH_MAX_ITEMS = 40
const BATCH_MAX_CHARS = 6000

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

    // Any index the model dropped or that failed keeps its original text —
    // a partially-translated CV never loses content.
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

    // Translations can expand ~1.6× vs source (ES↔EN) plus JSON overhead.
    const approxChars = items.reduce((a, it) => a + it.s.length, 0)
    const maxTokens = Math.min(4000, Math.ceil((approxChars / 3) * 1.6) + 200)

    try {
      const response = await this.aiClient.chat({
        model: AI_MODEL,
        max_tokens: maxTokens,
        temperature: AI_TEMPERATURE_PRECISE,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify({ items }) },
        ],
      })

      const content = response.choices[0]?.message?.content ?? "{}"
      const raw = parseAIJson<{ t?: Array<{ i?: number; v?: string }> }>(content)
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
      // A failed batch leaves its segments untranslated (fallback to original)
      // rather than failing the whole request.
      this.logger.warn("[AIService.translateCV] batch failed, keeping originals", {
        size: batchIdx.length,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }
}
