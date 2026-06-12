// lib/services/ai/shared/ai-types.ts
// Shared result and input types used across AI modules.
import { z } from "zod"

// ─── Shared Result Types ───────────────────────────────────────────────────────

export interface VersionsResult {
  versions: string[]
  status?: "improved" | "already_optimized"
}

export interface BulletResult {
  bullets: string[]
  status?: "improved" | "already_optimized"
}

// Shared API↔UI contract for /api/ai/improve-bullet — the client must parse
// the response with this schema instead of trusting the shape blindly.
export const ImproveBulletResponseSchema = z.object({
  bullets: z.array(z.string()),
  status: z.enum(["improved", "already_optimized"]).optional(),
})

export interface ATSScoreResult {
  score: number
  label: string
  summary: string
  strengths: string[]
  gaps: string[]
  missingKeywords: string[]
  suggestions: string[]
}

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

export interface TailorCVResult {
  summaryVersion: string
  bulletSuggestions: Array<{ targetId: string; jobTitle: string; employer: string; improved: string }>
  missingSkills: string[]
  keywordsToAdd: string[]
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
  keywordsToAdd: string[]
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
