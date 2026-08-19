// lib/services/ai/shared/ai-types.ts
// Shared result and input types used across AI modules.
import type { ScoreBreakdown } from "@/lib/ats/score-breakdown"
import { z } from "zod"
import type { WritingChecks } from "@/lib/ats/writing-checks"

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
  /**
   * Why this reads better than what the candidate wrote.
   *
   * The rewrite used to arrive bare, so the only way to judge it was to trust it
   * — on their own resume. The proofreader already learned this: a correction you
   * cannot evaluate is one you should not be asked to apply. Optional, because a
   * response without it is still usable.
   */
  why: z.string().max(160).optional().catch(undefined),
  /**
   * The same bullet argued from a different angle — the technical work, the
   * business outcome, or the leadership in it.
   *
   * One rewrite leaves the user a single yes/no: dislike it and the only way
   * forward is to ask again, which is the loop this panel kept producing. Two or
   * three angles turn that into a choice that ends. Only ever populated for a
   * single-bullet request; improving a whole role stays one line each, because
   * three variants per bullet across ten bullets is a wall and a bill.
   */
  alternatives: z
    .array(z.object({
      text: z.string().min(1),
      angle: z.enum(["technical", "business", "leadership"]).catch("technical"),
      why: z.string().max(160).catch(""),
    }))
    .max(2)
    .optional()
    .catch(undefined),
})

export type BulletImprovement = z.infer<typeof BulletImprovementSchema>

/**
 * improve-bullet outcome.
 *  - improved         → at least one bullet has a real rewrite
 *  - already_optimized → nothing to improve; the UI shows the green pill
 *
 * There is no "ask the user for a number" path: a bullet without a figure is
 * improved by wording, never by interrogating the user for a metric.
 */
export interface BulletResult {
  improvements: BulletImprovement[]
  /**
   * `needs_your_input`: the bullet is well formed but never states what it
   * achieved. A rewrite cannot supply that — only the candidate knows the
   * result, and inventing one is the line this product does not cross. Distinct
   * from `already_optimized`, which means there is genuinely nothing to fix.
   */
  status: "improved" | "already_optimized" | "needs_your_input"
}

// Shared API↔UI contract for /api/ai/improve-bullet — the client must parse
// the response with this schema instead of trusting the shape blindly.
export const ImproveBulletResponseSchema = z.object({
  improvements: z.array(BulletImprovementSchema),
  // `needs_your_input`: well formed, but it never states a result. Only the
  // candidate can supply that, so the UI asks instead of inventing or lying.
  status: z.enum(["improved", "already_optimized", "needs_your_input"]),
})

// Per-category coverage sub-scores (0-100), computed deterministically in code.
// `null` = the category was not applicable (the JD listed no keywords of that
// kind), so the UI hides that bar instead of showing a misleading 0%.
export interface ATSSubScores {
  hardSkills: number | null
  softSkills: number | null
  title: number | null
  sections: number | null
  /** Template layout parseability (0-100). Optional: only the ATS-score path sets it. */
  format?: number | null
}

/** One actionable lever in the "path to your target score". Each answers the
 *  user's real question — "what do I do to reach 90/100?" — with a concrete
 *  action AND the score points it can recover, derived from the SAME weights the
 *  score uses (not invented). Structured, not localized: the UI writes the copy. */
export interface GapLever {
  /** Which score lever this is. `template` is the layout penalty, not a matcher category. */
  key: "hardSkills" | "mustHaves" | "title" | "softSkills" | "sections" | "template"
  /** Estimated score points recoverable by maxing this lever out (0-100). */
  points: number
  /** Current coverage of this lever (0-100); null when not applicable (e.g. template). */
  currentPct: number | null
  /** For keyword levers: how many concrete items are still missing (drives "add N…"). */
  missingCount?: number
}

/** Deterministic content-quality signals over the work experience. REPORTED, not
 *  scored — a bullet without a figure is not automatically bad (see bullet-quality.ts).
 *  Surfaced so the user can act (add a metric, fix a weak opener), never to penalize. */
export interface ATSContentQuality {
  totalBullets: number
  quantifiedBullets: number
  quantificationPct: number // 0-100
  weakOpenerBullets: number
  /** A few weak bullets (no figure and/or a duty opener), each LOCATED by job so
   *  the UI can offer an inline "improve this bullet" that rewrites it honestly
   *  (stronger verb, tighter phrasing) — never inventing a number. */
  metriclessBullets: MetriclessBullet[]
}

/** A weak bullet, located so it can be improved in place. */
export interface MetriclessBullet {
  /** The bullet text (as it appears in the description). */
  text: string
  /** id of the work-experience entry this bullet belongs to. */
  targetId: string
  /** Job title of that entry, for display. */
  jobTitle: string
  /** 0-based position of the bullet within its description. */
  index: number
  /** Opens with a duty phrase ("responsible for…") — the most improvable case. */
  weakOpener: boolean
}

/** The requirement keywords the LLM extracted from the job description. Returned so
 *  the client can re-score deterministically (no LLM) after applying a fix. */
export interface ATSExtractedKeywords {
  hardSkills: string[]
  softSkills: string[]
  jobTitle: string
  mustHaves: string[]
  /**
   * The model's one-line read on the fit. Carried with the keywords so a cached
   * re-run shows the SAME sentence — without it the first run showed the
   * model's summary and every re-run silently fell back to the generic one.
   */
  summary?: string
}

/** A suggestion plus the one-click action that carries it out. */
export interface ATSSuggestion {
  text: string
  action: CvFixAction
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
  /** Soft skills this posting asks for that the CV does not demonstrate yet. */
  missingSoftSkills: string[]
  /**
   * True when the synonym pass could not run (embedding call failed).
   *
   * Without it, a requirement the CV phrases differently ("APIs REST" vs "REST
   * APIs") counts as missing, so the score is understated — by a lot on a CV
   * written in the other language. Surfaced so the panel can say so instead of
   * showing a number the user cannot reconcile with the one they saw before.
   */
  semanticRecallFailed?: boolean
  suggestions: ATSSuggestion[]
  subScores: ATSSubScores
  /** Parseability tier of the chosen template. "caution" = multi-column, a strict ATS may reorder it. */
  templateSafety: "safe" | "caution"
  /** JD keywords, echoed so the client can re-score deterministically after a fix (no LLM call). */
  extractedKeywords: ATSExtractedKeywords
  /** Requirements the CV states in other words, echoed so the instant re-score
   *  scores the same way this analysis did. */
  semanticMatches: string[]
  /**
   * Points the template's layout cost this score, already applied.
   *
   * Published rather than recomputed in the UI so the panel can never state a
   * different number than the one in the score. It is small on purpose — a
   * multi-column layout MAY be reordered by a strict parser, not always — and
   * naming the exact figure is what stops the user blaming the template for a gap
   * that is really missing keywords, which is where 45% of the score lives.
   */
  templatePenaltyPoints: number
  /** Soft skills the work-history bullets were judged to DEMONSTRATE. Echoed for
   *  the same reason as semanticMatches: the live re-score has no model call, and
   *  without carrying this the soft lever would fall back to 0% on every keystroke. */
  demonstratedSoftSkills: string[]
  /** Reported content-quality signals (metrics, weak openers). Not part of the score. */
  contentQuality: ATSContentQuality
  /** Ranked "path to your target": the levers that move THIS score, each with the
   *  points it can recover. Empty when the score is already maxed. */
  gapPlan: GapLever[]
  /**
   * The arithmetic behind the score, published so the panel can show it.
   *
   * A score whose weights nobody can question reads as invented — and the weights
   * ARE ours, chosen not measured. The honest answer is not a better-sounding
   * number, it is showing the sum: what each category covered, what it was worth,
   * and what backs that weight. Optional so a cached result from before this
   * still renders.
   */
  scoreBreakdown?: ScoreBreakdown
  /** Probable typos: a required keyword the CV spells wrong ("React Navite" for
   *  "React Native"), so a real ATS misses it. `keyword` = what the job wants,
   *  `typed` = what the CV says. Empty when nothing looks misspelled. */
  typoWarnings: { keyword: string; typed: string }[]
  /** The senior-recruiter analysis (verdict, pass risk, ranked critical fixes,
   *  strengths) — the voice of the unified report. null when the call failed or
   *  was skipped (e.g. the deterministic live re-score, which makes no LLM call). */
  analysis: CvAnalysis | null
  /**
   * True when the recruiter pass was attempted and produced nothing usable, so
   * the UI can say the report is incomplete instead of silently rendering a
   * shorter one. `analysis: null` alone could not carry that meaning.
   */
  analysisUnavailable?: boolean
  /** Deterministic writing checks (clichés, date-format inconsistency, bullet
   *  balance) — each maps to an actionable fix. Recomputed on the live re-score. */
  writingChecks: WritingChecks
  /** True when the requirements were INFERRED from a role title (no real posting)
   *  → the UI must label the score as approximate. Absent/false = scored against a
   *  real job description. */
  inferredFromRole?: boolean
}

/** Input for the deterministic re-score (no LLM): reuses keywords from a prior ats-score. */
export interface ATSRescoreInput {
  keywords: ATSExtractedKeywords
  sectionData?: Record<string, unknown>
  language?: string
  templateId?: string
  /** The résumé this analysis is about. Only used to scope the cached answers. */
  resumeId?: string
  /**
   * Requirements the embedding pass proved the CV states differently, echoed
   * back from the full analysis.
   *
   * Without them the instant re-score runs exact-match only while the full
   * analysis ran with synonyms — so editing anything made a 70 drop to the
   * 30s with the CV barely changed. Re-embedding on every keystroke is not an
   * option, so the full analysis publishes what it found and the re-score
   * credits the same set.
   */
  semanticMatches?: string[]
  /** Soft skills the full analysis judged demonstrated, carried in for the same
   *  reason — judging bullets needs a model call and cannot run per keystroke. */
  demonstratedSoftSkills?: string[]
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

/**
 * The button a finding earns.
 *
 * Every ATS tool on the market tells the candidate what is wrong and leaves the
 * fixing to them — that is the single loudest complaint about the category, and
 * it was true here too: the recruiter analysis produced eight paragraphs of
 * diagnosis with nothing to press. So the model must say WHICH of our existing
 * engines fixes each finding, and the panel renders that engine's button.
 *
 * `kind: "manual"` is a first-class answer. A finding nothing can fix in one
 * click (add a LinkedIn URL, explain a gap) shows the advice with no button —
 * which is honest, and better than a button that does something adjacent.
 *
 * The server VALIDATES every reference before it ships: a targetId that names no
 * job, or an index past the end of that job's bullets, is downgraded to manual
 * rather than handed to the UI, where it would either do nothing or edit the
 * wrong line.
 */
export const CvFixActionSchema = z
  .object({
    kind: z
      .enum(["rewrite_bullet", "rewrite_summary", "replace_text", "add_skill", "fix_dates", "remove_duplicates", "manual"])
      .catch("manual"),
    /** rewrite_bullet: the job the bullet belongs to. */
    targetId: z.string().max(64).optional(),
    /** rewrite_bullet: 0-based bullet index inside that job. */
    index: z.number().int().min(0).max(60).optional(),
    /** add_skill: the exact skill to add. replace_text: the wrong wording. */
    value: z.string().max(200).optional(),
    /**
     * replace_text: what `value` should say instead.
     *
     * A one-word slip ("more then") used to arrive as rewrite_summary, which
     * rewrote the entire paragraph — changing sentences that were fine and
     * making the user re-read everything to accept a three-letter correction.
     * The repair should be the size of the defect.
     */
    replacement: z.string().max(200).optional(),
  })
  .catch({ kind: "manual" as const })
export type CvFixAction = z.infer<typeof CvFixActionSchema>

export const ATSExtractionSchema = z.object({
  hardSkills: cappedStringArray(30),
  softSkills: cappedStringArray(20),
  jobTitle: z.string().catch(""),
  mustHaves: cappedStringArray(20),
  summary: z.string().catch(""),
  /**
   * The extractor no longer writes suggestions.
   *
   * It produced exactly 3 ("ADD X to your Skills", "REWRITE the summary…") next
   * to the recruiter analysis, which already reports the same problems against
   * the real CV text — two lists, in one report, telling the user to do the same
   * work twice. The recruiter pass is the one that reads the CV, so it keeps the
   * findings; this call is now pure extraction, which also makes its output
   * small enough to stop truncating and cheap enough to cache per posting.
   */
  label: z.string().optional(), // only used to detect the off_topic guard
})

export type ATSExtraction = z.infer<typeof ATSExtractionSchema>

/** The senior-recruiter analysis — the voice of the unified report. Judges the CV
 *  against the job the way a recruiter would (a 7-second screen, then a deep read),
 *  quoting real text. The deterministic layer (typos, missing keywords, layout)
 *  handles the mechanical checks; this handles judgment a keyword matcher can't:
 *  layout risk, weak metrics, language mix, structure, credibility, narrative. */

export const CvAnalysisSchema = z.object({
  /** Two sentences: would this pass the recruiter's screen for THIS job + the biggest risk. */
  verdict: z.string().catch(""),
  /** How likely this CV is to be filtered out for this job. */
  passRisk: z.enum(["low", "medium", "high"]).catch("medium"),
  /** Ranked, most-damaging first. Each names the real problem, why it costs the
   *  candidate, and the exact fix. Spelling typos and missing keywords are excluded
   *  (handled deterministically) so the report never says the same thing twice. */
  criticalFixes: z
    .array(
      z.object({
        issue: z.string().catch(""),
        why: z.string().catch(""),
        fix: z.string().catch(""),
        /**
         * The part of `fix` that is an order to the candidate rather than CV text
         * ("add the release volume you can defend"), split off server-side.
         *
         * It exists because `fix` was doing two jobs at once: it was printed as
         * the explanation AND pasted into the resume when the user pressed
         * "Apply this text" — so the instruction went out to recruiters as part
         * of the bullet. Now the appliable half is `fix` and the half that must
         * only ever be read is here.
         */
        needsFromYou: z.string().catch("").optional(),
        severity: z.enum(["high", "medium"]).catch("medium"),
        action: CvFixActionSchema,
      }),
    )
    .catch([]),
  /** A few real, specific strengths for THIS job. */
  strengths: cappedStringArray(4),
})
export type CvAnalysis = z.infer<typeof CvAnalysisSchema>

export interface CoverLetterResult {
  body: string
}

export interface SkillItem {
  name: string
  level: string
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

/**
 * How long a preview may be, and it has to fit the field it REPLACES.
 *
 * It was 1000 while the prompt asked for up to 1200 — the schema and the
 * instruction disagreed, and the schema won by rejecting. Worse, a preview for a
 * work-experience description is a whole bullet list: the reported CV has six
 * bullets of ~140 characters, so a faithful rewrite passes 1000 by simply
 * existing. Measured over six live rounds on that CV, three came back with every
 * suggestion destroyed by this cap.
 *
 * 2400 is not a new opinion: `buildResumeContext` already renders a role's
 * bullets up to 2200 characters, so that is this codebase's own idea of how long
 * a full description runs, plus room for a rewrite that says more than the
 * original. The prompt quotes this constant so the two cannot drift again.
 */
export const MAX_PREVIEW_CHARS = 2400

export const SuggestionSchema = z.object({
  field: z.enum(SUGGESTION_FIELDS),
  type: z.enum(["replace", "append"]),
  preview: z.string().min(1).max(MAX_PREVIEW_CHARS),
  reason: z.string().max(120),
  targetId: z.string().optional(),
})

export const ReviewItemSchema = z.object({
  text: z.string().min(1),
  suggestion: SuggestionSchema.optional(),
  // WHERE an advice-only improvement applies. Actionable items carry the location
  // inside `suggestion`; advice items (no concrete fix) had nowhere to point, so
  // the model now also sets this so the UI can tell the user which section it
  // refers to. Optional + backward-safe: absent on old responses and on strengths.
  // .catch(undefined): a malformed location from the model must never fail the
  // whole item (and cascade into the no-suggestions fallback) — it just drops.
  location: z.object({ field: z.enum(SUGGESTION_FIELDS), targetId: z.string().optional() }).optional().catch(undefined),
})

/**
 * No `.max(5)` here, on purpose.
 *
 * A model that returned six improvements failed the WHOLE parse, and the caller's
 * fallback then returned the review with every suggestion stripped — six good
 * fixes thrown away for being one too many. A count is not a validity question;
 * it is a display question, and the caller slices. Same lesson the fill-profile
 * schema records a few lines below: a strict rule in the wrong place does not
 * reject the bad part, it rejects everything.
 */
export const ReviewResponseSchema = z.object({
  summary: z.string(),
  strengths: z.array(ReviewItemSchema),
  improvements: z.array(ReviewItemSchema),
  answer: z.string(),
})

export type ReviewResult = z.infer<typeof ReviewResponseSchema>

/** review-cv return: the LLM review PLUS a deterministic, JD-independent resume
 *  score computed in code (see resume-score.ts). The score never depends on the
 *  LLM, so it is reproducible and cannot be hallucinated. */
export type ReviewCVResult = ReviewResult & {
  resumeScore: import("./resume-score").ResumeScore
}

// ─── fill-profile Zod schemas ─────────────────────────────────────────────────

export const ItemUpdateSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
})

export const NewWorkExperienceSchema = z.object({
  // Empty is legal on purpose: when the candidate describes a job without naming
  // the company, the model is told to send "" rather than invent one. Requiring
  // min(1) here failed the safeParse for the WHOLE response, which silently fell
  // back to the unvalidated object — validation off for every other field too.
  jobTitle: z.string(),
  employer: z.string(),
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
  /**
   * Skills the candidate did NOT write but that the role normally carries.
   * Kept apart from suggestedSkills on purpose: these arrive UNCHECKED and
   * labelled as a proposal, because we are proposing rather than reporting.
   * The grounding filter must never touch this list — filtering it would make
   * it identical to suggestedSkills, which is exactly the bug it replaces.
   */
  inferredSkills: z.array(z.string()).max(10).optional(),
  /**
   * Certifications that are STANDARD for the role — CCNA for a network
   * engineer, ITIL for support, food-safety for a kitchen. Examples to
   * recognise, never claims: the CV section existed with no way for the
   * assistant to fill it, so nobody was ever prompted about the one credential
   * that most changes how a technical CV reads.
   */
  suggestedCertifications: z.array(z.string()).max(8).optional(),
  /**
   * Bullets for ONE role, filled only by the "bullets" mode.
   *
   * Not workExperienceUpdates: that shape carries an id, and the mode prompts
   * never see the résumé, so they cannot know one. The panel asked about a
   * specific role and writes the answer back into it.
   */
  bullets: z.array(z.string()).max(8).optional(),
  /**
   * The three positionings of the same summary, filled only by the "seed" mode.
   *
   * The Content tab offered this choice and the assistant did not; moving the
   * summary into the assistant without it would have removed a choice the user
   * already had. Same three readings the improve-summary engine returns.
   */
  summaries: z.array(z.string()).max(3).optional(),
  /**
   * A study the candidate described that is not yet on the CV. Same rule as a
   * new job: whatever they did not state stays an empty string rather than an
   * invented university or year.
   */
  educationNew: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    fieldOfStudy: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })).max(3).optional(),
  suggestedLanguages: z.array(z.object({ name: z.string(), level: z.string() })).max(5).optional(),
  workExperienceUpdates: z.array(ItemUpdateSchema).max(5).optional(),
  workExperienceNew: z.array(NewWorkExperienceSchema).max(3).optional(),
  educationUpdates: z.array(ItemUpdateSchema).max(5).optional(),
  projectUpdates: z.array(ItemUpdateSchema).max(5).optional(),
  volunteerUpdates: z.array(ItemUpdateSchema).max(5).optional(),
})

export type FillProfileResult = z.infer<typeof FillProfileResponseSchema>

// ─── Input types ──────────────────────────────────────────────────────────────

/** Defects the panel already detected on this bullet — see BULLET_FOCUS. */
/**
 * What the request is about. `polish` is the one that is not a defect: the
 * bullet has no formal fault, and the user asked anyway — which is a legitimate
 * request, because "no rule fires on it" and "a professional writer could not
 * sharpen it" are not the same statement.
 */
export type BulletFocus = "metric" | "weak_verb" | "cliche" | "polish"

export interface ImproveBulletInput {
  text: string
  jobTitle?: string
  employer?: string
  industry?: string
  language?: string
  /**
   * What the caller wants fixed. When present the model is told the bullet was
   * already judged defective and MUST return a rewrite addressing it — without
   * this, the generic "leave strong bullets alone" rule made the model answer
   * "already optimized" to a bullet the panel had just labelled weak.
   */
  focus?: BulletFocus[]
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
  jobDescription?: string
  /** Low-friction mode: the target role only (e.g. "Senior iOS Developer"). The
   *  AI infers the STANDARD requirements for that role and the same deterministic
   *  engine scores against them. Less precise than a real posting — flagged as
   *  `inferredFromRole` in the result so the UI can say so. */
  roleTitle?: string
  sectionData?: Record<string, unknown>
  language?: string
  /** The template the CV will export as — its layout affects ATS parseability. */
  templateId?: string
  /** The résumé this analysis is about. Only used to scope the cached answers. */
  resumeId?: string
  /**
   * Keywords extracted from THIS posting on a previous run, echoed back by the
   * client so the extraction is not re-sampled.
   *
   * The scoring engine is deterministic, but its input was not: the model that
   * reads the posting is, and `temperature` is dropped for reasoning models
   * (see model-params), so two runs over an unchanged CV and posting returned
   * different keyword sets and therefore different scores. That made the number
   * useless for the one question it exists to answer — "did my edit help?".
   * Reusing the keywords pins the posting side, so any movement in the score is
   * attributable to the CV. Also saves one LLM call per re-run.
   */
  cachedKeywords?: ATSExtractedKeywords
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
  /**
   * The candidate's own words, asked as three focused questions instead of one
   * blank textarea. Each answer maps to a paragraph of the letter (motivation →
   * hook, achievement + fit → the middle), which is what a blank box never gets:
   * people fill it with a job-description paraphrase, not with the two things a
   * letter actually needs. Every field optional — the generator degrades to
   * `userPrompt` (and then to the résumé alone) when they are empty.
   */
  highlights?: {
    /** Why THIS company / role. */
    motivation?: string
    /** The single most relevant accomplishment, with the candidate's own figures. */
    achievement?: string
    /** What they bring that fits the role. */
    fit?: string
  }
  /** The vacancy text. Fed to the deterministic planner (buildCoverLetterBrief)
   *  so the letter is tailored to the role and grounded in the résumé. */
  jobDescription?: string
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

/**
 * Which job fill-profile is doing.
 *
 * One endpoint, four tasks — and for three of them the big extraction prompt is
 * the wrong tool. Measured against the real API before this existed: asked to
 * start a CV from a job title alone, it answered with an empty object 3 times
 * in 10 (secretaria, cajero de banco and abogado laboralista among the
 * failures), and asked for the standard credentials of a trade it failed 7
 * times in 8. Nothing was wrong with the trades: the prompt says "extract what
 * the candidate stated from the resume below", the resume is empty, and the
 * model concludes there is nothing to extract. The user then reads "I could not
 * build your CV with that" for having typed their profession correctly.
 *
 * Each mode carries its own short prompt, and each one measured 30/30, 10/10
 * and 20/20 respectively — while still refusing junk 5 times out of 5.
 */
export type FillProfileMode = "seed" | "certifications" | "bullets"

export interface FillProfileInput {
  prompt: string
  sectionData?: Record<string, unknown>
  language?: string
  /** Absent = the original extraction path, unchanged. */
  mode?: FillProfileMode
}

export interface TailorCVInput {
  sectionData: Record<string, unknown>
  jobDescription: string
  language?: string
  /**
   * Missing keywords the ATS score already listed for this same posting. Tailor
   * drops any missingSkill semantically equivalent to one of these (embeddings),
   * so the user never sees the same gap twice across the two panels — including
   * under a different spelling/word-order/language the exact vocabulary misses.
   */
  atsMissingKeywords?: string[]
}

// Weave a skill the candidate already has into ONE bullet of the best-fit job.
export interface SkillBulletInput {
  /** Atomic skill/keyword to weave in (e.g. "async/await", "GraphQL"). */
  skill: string
  sectionData: Record<string, unknown>
  language?: string
  /**
   * Soft-skill mode. A hard skill ("GraphQL") is woven by NAMING it in the
   * bullet; a soft skill ("teamwork", "communication") is proven by DEMONSTRATING
   * the behavior — the bullet need not contain the word. When true, the prompt
   * asks for evidence of the behavior and the "bullet must contain the skill"
   * output guard is skipped. All anti-invention guards stay on. Defaults to hard.
   */
  soft?: boolean
  /**
   * Role the USER picked. Set only after the model reported no natural home for
   * the skill: instead of a dead end ("I couldn't find a role that fits"), the
   * editor lists the candidate's roles and lets them decide. When present, this
   * role is the only one considered.
   */
  targetId?: string
}

export type SkillBulletResult =
  | { status: "written"; targetId: string; jobTitle: string; employer: string; text: string }
  // No job in the CV is a reasonable home for the skill, or the draft failed the
  // anti-invention guards — either way there is nothing safe to insert.
  | { status: "no_fit" }
  // The work experience ALREADY shows this skill. Distinct from no_fit: nothing
  // is wrong, the job is simply done, and writing another bullet about it would
  // duplicate what the CV already says.
  | { status: "already_demonstrated" }

export interface TranslateCVInput {
  /** Full ResumeSections object (the resume's `personalDetails` JSON column). */
  sectionData: Record<string, unknown>
  /** Visible section header labels (from the `sections` layout array). */
  sectionLabels?: string[]
  /** Language to translate INTO. */
  targetLang: "es" | "en"
}

export interface TranslateCVResult {
  sectionData: Record<string, unknown>
  sectionLabels: string[]
  targetLang: "es" | "en"
  /** How many prose segments were actually sent to the translator. */
  translatedCount: number
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
  /** Soft skills the job asks for that the CV doesn't yet evidence, each with a
   *  grounded, one-line suggestion on HOW/WHERE to show it. Actionable advice the
   *  user applies by hand — soft skills are proven inside bullets, not listed as
   *  chips — and never invented. Max ~4. */
  softSkillSuggestions?: { skill: string; suggestion: string }[]
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
  /** Per answer of the structured cover-letter input (3 of them). */
  coverLetterHighlight: 400,
  userDescription: 500,
  company: 200,
  jobTitle: 200,
  recipientName: 100,
  recipientTitle: 100,
  industry: 100,
  question: 300,
  bulletText: 4000,
  prompt: 500,
  skillName: 100,
} as const

