// lib/services/ai/shared/ai-types.ts
// Shared result and input types used across AI modules.
import { z } from "zod"

// ─── Shared Result Types ───────────────────────────────────────────────────────

/** Positioning of a summary version, as the prompt asks for them in order. */
export type SummaryVersionType = "executive" | "specialist" | "value_prop"

export interface VersionsResult {
  versions: string[]
  /**
   * The positioning of each entry in `versions`, same order.
   *
   * The client used to derive this from the index — versions[0] is the
   * executive one, and so on. That held only while the array arrived in the
   * order the prompt asked for; the quality gate ranks it, so the cleanest
   * version comes first and the index stopped carrying the label. Optional:
   * the fall-back paths return the user's own text, which has no positioning.
   */
  types?: SummaryVersionType[]
  status?: "improved" | "already_optimized"
}

// One improved bullet, addressed by its position in the ORIGINAL description.
// Presence is a decision, not a slot: a bullet the model cannot improve without
// inventing facts simply has no entry. Forcing one output per input is what made
// the model echo its input back with a placeholder bolted on — it had no way to
// decline. Mirrors TailorBulletChange, which got this right from the start.
export const BulletImprovementSchema = z.object({
  index: z.number().int().min(0),
  text: z.string().min(1),
})

export type BulletImprovement = z.infer<typeof BulletImprovementSchema>

/**
 * improve-bullet outcome.
 *  - improved         → at least one bullet has a real rewrite
 *  - already_optimized → nothing to improve; the UI shows the green pill
 *  - metric_missing   → the only thing holding the bullets back is a number the
 *                       CV does not contain. Ask the user in the UI; never write
 *                       a [X%] placeholder into their CV.
 */
export interface BulletResult {
  improvements: BulletImprovement[]
  status: "improved" | "already_optimized" | "metric_missing"
  /** Questions to surface for status "metric_missing". Empty otherwise. */
  metricQuestions?: string[]
}

// Shared API↔UI contract for /api/ai/improve-bullet — the client must parse
// the response with this schema instead of trusting the shape blindly.
export const ImproveBulletResponseSchema = z.object({
  improvements: z.array(BulletImprovementSchema),
  status: z.enum(["improved", "already_optimized", "metric_missing"]),
  metricQuestions: z.array(z.string()).max(3).optional(),
})

// Per-category coverage sub-scores (0-100), computed deterministically in code.
// `null` = the category was not applicable (the JD listed no keywords of that
// kind), so the UI hides that bar instead of showing a misleading 0%.
export interface ATSSubScores {
  hardSkills: number | null
  softSkills: number | null
  title: number | null
  sections: number | null
}

export interface ATSScoreResult {
  score: number
  label: string
  summary: string
  strengths: string[]
  gaps: string[]
  matchedKeywords: string[]
  missingKeywords: string[]
  /**
   * Matched, but the CV shows no work behind them — they only appear in a list.
   * Surfaced so the user can see which of their claims are unbacked, instead of
   * a score that rewards listing a skill exactly as much as having done it.
   */
  listedOnlyKeywords: string[]
  suggestions: string[]
  subScores: ATSSubScores
}

// LLM call #1 for ats-score: extract the requirements from the job description
// (NO scoring — the score is computed deterministically in code) plus a short
// qualitative summary and actionable suggestions. Validated before use.
// Arrays are TRUNCATED (not hard-capped) so an over-eager model that returns
// more items than requested never fails validation → no spurious 500. The
// actual output size is guided softly by the prompt ("~12 hard skills") + the
// max_tokens ceiling; this cap only bounds how many we PROCESS. `.catch([])`
// keeps a malformed array from bringing down the whole response.
const cappedStringArray = (limit: number) =>
  z.array(z.string()).catch([]).transform((a) => a.slice(0, limit))

export const ATSExtractionSchema = z.object({
  hardSkills: cappedStringArray(30),
  softSkills: cappedStringArray(20),
  jobTitle: z.string().catch(""),
  mustHaves: cappedStringArray(20),
  summary: z.string().catch(""),
  suggestions: cappedStringArray(3),
  label: z.string().optional(), // only used to detect the off_topic guard
})

export type ATSExtraction = z.infer<typeof ATSExtractionSchema>

export interface CoverLetterResult {
  body: string
}

export interface SkillItem {
  name: string
  level: string
}

export interface SuggestSkillsResult {
  skills: SkillItem[]
}

// ─── review-cv Zod schemas ────────────────────────────────────────────────────

export const SUGGESTION_FIELDS = [
  "summary",
  "personalDetails.jobTitle",
  "skills",
  "workExperience.description",
  "workExperience.jobTitle",
  "languages",
  "certifications",
] as const

export const SuggestionSchema = z.object({
  field: z.enum(SUGGESTION_FIELDS),
  type: z.enum(["replace", "append"]),
  preview: z.string().min(1).max(1000),
  reason: z.string().max(120),
  targetId: z.string().optional(),
})

export const ReviewItemSchema = z.object({
  text: z.string().min(1),
  suggestion: SuggestionSchema.optional(),
})

export const ReviewResponseSchema = z.object({
  summary: z.string(),
  strengths: z.array(ReviewItemSchema).max(5),
  improvements: z.array(ReviewItemSchema).max(5),
  answer: z.string(),
})

export type ReviewResult = z.infer<typeof ReviewResponseSchema>

// ─── fill-profile Zod schemas ─────────────────────────────────────────────────

export const ItemUpdateSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
})

export const NewWorkExperienceSchema = z.object({
  jobTitle: z.string().min(1),
  employer: z.string().min(1),
  city: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  currentlyWorking: z.boolean().optional(),
  description: z.string().min(1),
})

export const FillProfileResponseSchema = z.object({
  summary: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  hobbies: z.string().nullable().optional(),
  suggestedSkills: z.array(z.string()).max(10).optional(),
  suggestedLanguages: z.array(z.object({ name: z.string(), level: z.string() })).max(5).optional(),
  workExperienceUpdates: z.array(ItemUpdateSchema).max(5).optional(),
  workExperienceNew: z.array(NewWorkExperienceSchema).max(3).optional(),
  educationUpdates: z.array(ItemUpdateSchema).max(5).optional(),
  projectUpdates: z.array(ItemUpdateSchema).max(5).optional(),
  volunteerUpdates: z.array(ItemUpdateSchema).max(5).optional(),
})

export type FillProfileResult = z.infer<typeof FillProfileResponseSchema>

// ─── Input types ──────────────────────────────────────────────────────────────

export interface ImproveBulletInput {
  text: string
  jobTitle?: string
  employer?: string
  industry?: string
  language?: string
}

export interface GenerateSummaryInput {
  sectionData?: Record<string, unknown>
  language?: string
}

export interface ImproveSummaryInput {
  summary?: string
  userDescription?: string
  sectionData?: Record<string, unknown>
  language?: string
}

export interface ATSScoreInput {
  jobDescription: string
  sectionData?: Record<string, unknown>
  language?: string
}

export interface GenerateCoverLetterInput {
  resumeId?: string
  recipientName?: string
  recipientTitle?: string
  company?: string
  jobTitle?: string
  tone?: string
  language?: string
  userPrompt?: string
}

export interface ImproveCoverLetterInput {
  body: string
  company?: string
  jobTitle?: string
  recipientTitle?: string
  language?: string
}

export interface ReviewCVInput {
  sectionData: Record<string, unknown>
  question?: string
  language?: string
}

export interface FillProfileInput {
  prompt: string
  sectionData?: Record<string, unknown>
  language?: string
}

export interface SuggestSkillsInput {
  jobTitle: string
  industry?: string
  existingSkills?: string[]
  language?: string
}

export interface TailorCVInput {
  sectionData: Record<string, unknown>
  jobDescription: string
  language?: string
}

// V2 — bullet-level granular suggestions
export interface TailorBulletChange {
  index: number   // posición 0-based del bullet en la descripción original
  text: string    // texto mejorado del bullet
}

export interface TailorExperienceResult {
  targetId: string
  jobTitle: string
  employer: string
  changedBullets: TailorBulletChange[]  // vacío = todos los bullets ya están bien
}

export interface TailorCVResultV2 {
  summary: string | null            // null = resumen ya está bien
  experiences: TailorExperienceResult[]
  missingSkills: string[]
  // No keywordsToAdd: it duplicated ats-score's missingKeywords, which is
  // computed deterministically and verified against the CV (ats-matcher.ts),
  // where this one was a raw substring match on the JD. With both panels now
  // sharing one job description they rendered as two near-identical chip rows.
}

// ─── Central input character limits ────────────────────────────────────────────
// Single source of truth for max input lengths across Zod route schemas and
// downstream validateAIInput() calls in modules. Tightening any value here is
// a real behavioural change at the validation boundary.
export const AI_INPUT_LIMITS = {
  jobDescription: 6000,
  resumeContext: 12000,
  resumeText: 5000,
  summary: 3000,
  body: 3000,
  userText: 3000,
  userPrompt: 500,
  userDescription: 500,
  company: 200,
  jobTitle: 200,
  recipientName: 100,
  recipientTitle: 100,
  industry: 100,
  question: 300,
  skill: 100,
  bulletText: 4000,
  prompt: 500,
} as const
