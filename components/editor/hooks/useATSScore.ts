"use client"

import type { ScoreBreakdown } from "@/lib/ats/score-breakdown"
import type { SemanticPair } from "@/lib/services/ai/shared/semantic-match"
import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { normalizeTerm } from "@/lib/ats/vocabulary"
import { postingTermsForPrompt } from "@/lib/ats/rewrite-keeps-match"
import { useAtsPostingStore } from "@/stores/atsPostingStore"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { useTranslations, useLocale } from "next-intl"
import type { Suggestion } from "../SuggestionDiffModal"
import { useAICooldown } from "./useAICooldown"
import { useAICall } from "@/hooks/useAICall"
import { useCvLanguage } from "./useCvLanguage"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"
import { handleApiError } from "@/lib/upgrade-modal-handler"
import { useRouter } from "next/navigation"
import { track } from "@/lib/analytics/track"
import { scoreBucket } from "@/lib/analytics/user-type"
import { useEditorPro } from "../EditorContext"
import { reportUxFailure } from "@/lib/client-error-reporter"

/** The engine that repairs a finding — mirrors CvFixAction on the server. */
export interface FixAction {
  kind: "rewrite_bullet" | "rewrite_summary" | "add_skill" | "fix_dates" | "remove_duplicates" | "manual"
  targetId?: string
  index?: number
  value?: string
}

export interface ATSSubScores {
  hardSkills: number | null
  softSkills: number | null
  title: number | null
  sections: number | null
  format?: number | null
}

/** One lever in the "path to your target score" (mirrors the server GapLever). */
export interface GapLever {
  key: "hardSkills" | "mustHaves" | "title" | "softSkills" | "sections" | "template"
  points: number
  currentPct: number | null
  missingCount?: number
}

export interface ATSResult {
  score: number
  label: string
  summary: string
  strengths: string[]
  gaps: string[]
  matchedKeywords?: string[]
  missingKeywords: string[]
  /** Matched, but with nothing in the work experience behind them. */
  listedOnlyKeywords?: string[]
  /** Requirements the CV states in other words — carried into every re-score. */
  semanticMatches?: string[]
  /** Bullet pairs of one role that talk about the same work, ranked by the
   *  analysis. Carried for the same reason: finding them costs an embedding
   *  call, and the live recompute runs on every keystroke. */
  mergePairs?: SemanticPair[]
  /** Points the chosen template cost this score. Published by the scorer so the
   *  panel cannot state a different figure than the one actually applied. */
  templatePenaltyPoints?: number
  /** Soft skills the bullets were judged to demonstrate — carried the same way,
   *  because judging a bullet needs a model call and a keystroke cannot pay for one. */
  demonstratedSoftSkills?: string[]
  /** The synonym pass could not run, so the score is understated. Belongs to the
   *  analysis, so it survives a re-score rather than vanishing on a keystroke. */
  semanticRecallFailed?: boolean
  /** Soft skills the posting wants that the CV does not demonstrate yet. */
  missingSoftSkills?: string[]
  /** Each suggestion with the one-click action that performs it (may be manual). */
  suggestions: { text: string; action?: FixAction }[]
  subScores?: ATSSubScores
  /** True when the target came from a role TITLE (standard requirements inferred), not a pasted posting. Result is approximate. */
  inferredFromRole?: boolean
  /** Template parseability tier — "caution" = multi-column, a strict ATS may reorder it. */
  templateSafety?: "safe" | "caution"
  /** JD keywords echoed by the server so we can re-score deterministically after a fix. */
  extractedKeywords?: {
    hardSkills: string[]
    softSkills: string[]
    jobTitle: string
    mustHaves: string[]
  }
  /** Reported content-quality signals (metrics, weak openers). Not part of the score. */
  contentQuality?: {
    totalBullets: number
    quantifiedBullets: number
    quantificationPct: number
    weakOpenerBullets: number
    metriclessBullets: Array<{ text: string; targetId: string; jobTitle: string; index: number; weakOpener: boolean }>
  }
  /** Ranked "path to your target score": each lever + the points it recovers. */
  gapPlan?: GapLever[]
  /**
   * How the score was reached, per category.
   *
   * Shown on demand so the number stops being an assertion: the weights behind it
   * are ours — chosen, not measured against any ATS — and the honest response to
   * that is to publish the sum rather than to dress it up.
   */
  scoreBreakdown?: ScoreBreakdown
  /** Probable typos breaking exact ATS match: {keyword wanted, typed in CV}. */
  typoWarnings?: { keyword: string; typed: string }[]
  /** Senior-recruiter analysis: verdict, pass risk, ranked critical fixes, strengths. */
  analysis?: {
    verdict: string
    passRisk: "low" | "medium" | "high"
    criticalFixes: {
      issue: string
      why: string
      /** Only what may be pasted into the CV — the instruction half is split off
       *  server-side into needsFromYou, because applying it wrote an order to the
       *  candidate into their own resume. */
      fix: string
      /** What only the candidate knows. Shown, never applied. */
      needsFromYou?: string
      severity: "high" | "medium"
      /** The engine that repairs this finding — rendered as a real button. */
      action?: FixAction
    }[]
    strengths: string[]
  } | null
  /** True when the recruiter pass failed — the report is missing that section. */
  analysisUnavailable?: boolean
  /** Deterministic writing checks: clichés, date inconsistency, bullet balance. */
  writingChecks?: {
    clicheBullets: { targetId: string; jobTitle: string; index: number; text: string; cliches: string[] }[]
    weakVerbBullets: { targetId: string; jobTitle: string; index: number; text: string }[]
    duplicateBullets: { targetId: string; jobTitle: string; index: number; text: string; duplicateOfJobTitle: string }[]
    dateInconsistency: { formats: string[] } | null
    bulletBalance: { targetId: string; jobTitle: string; count: number; kind: "too_many" | "none" }[]
  }
}

/**
 * A cheap, stable fingerprint of the parts of the CV the recruiter analysis reads.
 *
 * Deliberately not the whole object: template, colours and ordering of unrelated
 * sections must not make an analysis look stale. What the analyst reads is the
 * summary, the work history, the skills and the education — change any of those
 * and its findings are about a document that no longer exists.
 */
function cvFingerprint(data: Record<string, unknown> | undefined): string {
  if (!data) return ""
  const pick = ["summary", "workExperience", "skills", "education", "certifications", "projects"]
  return pick.map((k) => JSON.stringify(data[k] ?? null)).join("|")
}

export interface VerifyResult {
  realScore: number
  breakdown: {
    keywords: { score: number }
    format: { score: number; issues: string[] }
    sections: { score: number; missing: string[] }
    length: { score: number; recommendation: string }
    contact: { score: number; hasEmail: boolean; hasPhone: boolean; hasLinkedIn: boolean }
  }
  extractedText: string
  wordCount: number
}

export interface ReviewItem {
  text: string
  suggestion?: Suggestion
}

export interface ResumeScoreDimension {
  key: "impact" | "actionVerbs" | "completeness" | "brevity" | "recruiterScan"
  score: number | null
  detail: Record<string, number>
}

export interface ResumeScore {
  overall: number
  dimensions: ResumeScoreDimension[]
}

export interface ReviewResult {
  summary: string
  strengths: ReviewItem[]
  improvements: ReviewItem[]
  answer: string
  /** Deterministic, JD-independent resume score (computed server-side in code). */
  resumeScore?: ResumeScore
}

/** Heuristic: short text or ends with ? → treat as question */
export function isQuestion(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.endsWith("?")) return true
  if (trimmed.length < 50) return true
  return false
}

/**
 * The single point where a server ATS result becomes the shape the UI relies on.
 *
 * `suggestions` gained a per-item action, so a result produced by an older
 * deploy (or held in a tab across one) carries plain strings. Normalizing HERE —
 * where the result enters the client — is what keeps every consumer working
 * against one shape; the alternative is a defensive check in each place that
 * renders a suggestion, which is how a component ends up knowing about the
 * history of an API.
 */
function normalizeAtsResult(data: ATSResult): ATSResult {
  const raw = (data.suggestions ?? []) as unknown[]
  return {
    ...data,
    suggestions: raw
      .map((s) => (typeof s === "string"
        ? { text: s, action: { kind: "manual" as const } }
        : (s as { text?: string; action?: FixAction })))
      .filter((s): s is { text: string; action?: FixAction } => !!s?.text?.trim()),
  }
}

export function useATSScore() {
  const t = useTranslations("editor.ats")
  const aiT = useTranslations("editor.ai")
  const locale = useLocale()
  const router = useRouter()
  const { open: openUpgradeModal } = useUpgradeModal()
  const { preCheck, onSuccess } = useAICall()
  const { plan } = useEditorPro()
  const { sectionData, templateId } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, templateId: s.config?.templateId }))
  )
  // The AI writes in the CV's language, not the app's. `locale` stays in use for
  // UI-side concerns (upgrade-modal redirects, toasts).
  const cvLanguage = useCvLanguage()

  const [input, setInput] = useState("")
  // "jd" = paste full posting (precise). "role" = just a job title → the engine
  // infers the STANDARD requirements for that role (low-friction, approximate).
  const [mode, setMode] = useState<"jd" | "role">("jd")
  const [loading, setLoading] = useState(false)
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [offTopic, setOffTopic] = useState(false)
  /** Last score movement (+/-). Owned here so both rescore paths keep it truthful. */
  const [scoreDelta, setScoreDelta] = useState<number | null>(null)
  // Identity of the job input (`mode:text`) that produced the current result.
  // Keyed on the JOB posting only, NOT the CV: CV edits are picked up live by the
  // debounced rescore() below, so re-running the LLM on the same posting adds
  // nothing. This lets the UI say "up to date" instead of inviting a dead click.
  const [analyzedInputKey, setAnalyzedInputKey] = useState<string | null>(null)
  /**
   * The CV as it was when the recruiter analysis ran.
   *
   * "Up to date" used to mean only "the posting has not changed", on the reasoning
   * that a CV edit is already covered by the live re-score. Half of that is true:
   * the NUMBER updates on every keystroke, but the FINDINGS do not — they were
   * written about the CV as it stood, and after fixing ten bullets the user is
   * reading a list of defects they already repaired, with the button telling them
   * the analysis is current. Reported exactly that way: "arreglé varias cosas y el
   * score no se actualizó, debería dejarme re-analizar".
   *
   * The old objection was cost — a re-analysis meant a fresh LLM call. It does not
   * any more: the posting's keywords are pinned and the analysis is cached by
   * content, so re-running an UNCHANGED CV returns the same answer for free, and
   * re-running a changed one is exactly what the user is asking for.
   */
  const [analyzedCvKey, setAnalyzedCvKey] = useState<string | null>(null)
  /**
   * Keywords extracted from the posting currently in the box, kept so a re-run
   * over the SAME posting reuses them instead of re-sampling the model.
   *
   * This is what makes two runs comparable. The scoring engine is deterministic,
   * but the model that reads the posting is not (temperature is dropped for
   * reasoning models), so the same CV could score differently twice and the
   * number could not answer "did my edit help?". Pinned to the posting text, so
   * changing the posting correctly throws it away.
   */
  const keywordCacheRef = useRef<{ postingKey: string; keywords: unknown } | null>(null)
  const { cooldownUntil, setCooldownUntil } = useAICooldown("cooldown_ats")
  const lastKeyRef = useRef<string | null>(null)

  const analyze = useCallback(async () => {
    if (loading) return
    const text = input.trim()
    const roleMode = mode === "role"
    if (text.length < (roleMode ? 3 : 5)) {
      toast.error(t("toast_empty_input"))
      return
    }
    // Token-saver: skip the LLM entirely when neither the job/question text NOR
    // ANY part of the CV changed since the last successful analyze. The key now
    // hashes the WHOLE sectionData (the review reads every section), so editing
    // education / languages / certifications correctly triggers a fresh review —
    // and re-clicking with nothing changed spends zero tokens.
    const key = `${mode}:${text}:${JSON.stringify(sectionData)}`
    if (key === lastKeyRef.current) { toast.info(t("no_changes")); return }
    if (Date.now() < cooldownUntil) {
      const secs = Math.ceil((cooldownUntil - Date.now()) / 1000)
      const label = secs >= 60 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : `${secs}s`
      toast.info(t("cooldown_wait", { seconds: label }))
      return
    }
    setLoading(true)
    setAtsResult(null)
    setReviewResult(null)
    setOffTopic(false)
    setScoreDelta(null)

    try {
      if (!roleMode && isQuestion(text)) {
        preCheck("review-cv")
        const res = await apiFetch("/api/ai/review-cv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // review-cv returns suggestions that get APPLIED to CV fields, so its
          // language is the CV's, not the app's.
          body: JSON.stringify({ sectionData, question: text, language: cvLanguage }),
        })
        if (res.status === 429 || res.status === 403) {
          const handled = await handleApiError(res, {
            openUpgradeModal,
            redirect: (p) => router.push(p),
            locale,
            fallbackToast: () => toast.error(res.status === 429 ? t("rate_limit_exceeded") : t("pro_only")),
            dailyCapToast: () => toast.warning(aiT("daily_cap_reached"), { duration: 6000 }),
          })
          if (handled || res.status === 429 || res.status === 403) return
        }
        if (res.status === 400) { toast.error(t("not_enough_data")); return }
        if (res.status === 422) { setOffTopic(true); return }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setReviewResult(data)
        await onSuccess()
      } else {
        preCheck("ats-score")
        const res = await apiFetch("/api/ai/ats-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(roleMode ? { roleTitle: text } : { jobDescription: text }),
            sectionData,
            language: cvLanguage,
            templateId,
            // Which CV this answer belongs to, so deleting the CV deletes what we
            // cached from it. The cache is addressed by content and could never be
            // found by owner afterwards.
            resumeId: useResumeStore.getState().resumeId,
            // Same posting as last time → reuse its keywords so the score moves
            // only because the CV moved.
            ...(keywordCacheRef.current?.postingKey === `${mode}:${text}`
              ? { cachedKeywords: keywordCacheRef.current.keywords }
              : {}),
          }),
        })
        if (res.status === 429 || res.status === 403) {
          const handled = await handleApiError(res, {
            openUpgradeModal,
            redirect: (p) => router.push(p),
            locale,
            fallbackToast: () => toast.error(res.status === 429 ? t("rate_limit_exceeded") : t("pro_only")),
            dailyCapToast: () => toast.warning(aiT("daily_cap_reached"), { duration: 6000 }),
          })
          if (handled || res.status === 429 || res.status === 403) return
        }
        if (res.status === 400) { toast.error(t("not_enough_data")); return }
        if (res.status === 422) { track("ai_error_shown", { endpoint: "ats-score", error_type: "offtopic" }); setOffTopic(true); return }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setAtsResult(normalizeAtsResult(data))
        // Pin this posting's keywords so the next run scores against the SAME
        // requirements — any movement then comes from the CV, not from the model
        // reading the posting slightly differently.
        if (data?.extractedKeywords) {
          keywordCacheRef.current = { postingKey: `${mode}:${text}`, keywords: data.extractedKeywords }
          /**
           * Y LA VACANTE SE PUBLICA PARA EL RESTO DEL EDITOR.
           *
           * El asistente escribe viñetas y el resumen que terminan en el MISMO
           * CV, y no tenía forma de saber contra qué puesto se está postulando:
           * escribía bien, pero al aire. Este hook lo monta un solo componente,
           * así que su estado no llegaba a ningún otro lado.
           *
           * Va con el `resumeId` del análisis: un CV distinto no hereda la
           * oferta del anterior.
           */
          useAtsPostingStore.getState().setPosting({
            terms: postingTermsForPrompt(data.extractedKeywords.hardSkills, data.extractedKeywords.softSkills),
            jobTitle: typeof data.extractedKeywords.jobTitle === "string" ? data.extractedKeywords.jobTitle : "",
            resumeId: useResumeStore.getState().resumeId ?? null,
          })
        }
        await onSuccess()
        track("ai_ats_scored", { plan, score_bucket: scoreBucket(typeof data?.score === "number" ? data.score : 0) })
        // Then show what an ATS literally extracts from the exported PDF. It is
        // EL RENDER AUTOMÁTICO DEL PDF SE FUE. Cada análisis disparaba un
        // Chrome headless en el servidor para medir el archivo — y el usuario no
        // lo pedía ni veía el resultado sin abrir un desplegable. Lo que ese
        // render detectaba (texto que el parser no puede leer) ahora lo previene
        // un guard sobre las plantillas, gratis y en cada build.
      }
      lastKeyRef.current = key
      setAnalyzedInputKey(`${mode}:${text}`)
      setAnalyzedCvKey(cvFingerprint(sectionData))
      setCooldownUntil(Date.now() + 120_000)
    } catch {
      toast.error(t("error"))
    } finally {
      setLoading(false)
    }
  }, [input, mode, sectionData, locale, cvLanguage, t, aiT, loading, cooldownUntil])

  // Keep the latest result reachable from rescore() without stale-closure risk.
  const atsResultRef = useRef<ATSResult | null>(null)
  atsResultRef.current = atsResult
  /**
   * Soft skills demonstrated by a bullet this session wrote, credited without a
   * model call. A ref rather than state: it must be readable by the debounced
   * rescore without re-creating it, and it never renders anything on its own.
   */
  const locallyProvenRef = useRef<string[]>([])
  /**
   * SE ACREDITA NORMALIZADO, PORQUE ASÍ SE PREGUNTA DEL OTRO LADO.
   *
   * ── EL DEFECTO (encontrado en el pase de QA, 2026-08-22) ──────────────────
   *
   * «Si arreglo algo no sube mi soft skill.» El crédito local se guardaba TAL
   * CUAL venía —«Clear communication»— y del otro lado el matcher pregunta
   * `demonstratedByEvidence.has(normalizeTerm(k))`, con el conjunto que la
   * pasada de evidencia llena con `normalizeTerm(...)` (`soft-skill-evidence`,
   * ~184). Un término sin normalizar no puede acertar nunca: el crédito viajaba
   * hasta el servidor, entraba al conjunto y no coincidía con nada.
   *
   * Silencioso en las dos direcciones: nadie ve un `has()` que devuelve false, y
   * el usuario sólo ve que el porcentaje no se mueve después de aceptar la
   * frase que la aplicación misma le escribió para demostrar esa habilidad.
   *
   * Se normaliza ACÁ, en el único punto por donde entra, y no en cada llamador:
   * un segundo llamador que se olvide reintroduce el defecto entero.
   */
  const creditSoftSkill = useCallback((skill: string) => {
    const s = normalizeTerm(skill)
    if (s && !locallyProvenRef.current.includes(s)) locallyProvenRef.current.push(s)
  }, [])

  /** sectionData already sent for scoring — dedupes manual vs debounced rescore. */
  const lastScoredRef = useRef<unknown>(null)

  /**
   * Deterministic re-score after the user applies a fix. Reuses the keywords the
   * first analyze already extracted → no LLM call, no quota, no cooldown. Updates
   * the score/sub-scores/keyword sets, but PRESERVES the LLM-authored summary and
   * suggestions so applying a fix never wipes the guidance.
   */
  const rescore = useCallback(async (): Promise<number | null> => {
    const prev = atsResultRef.current
    const keywords = prev?.extractedKeywords
    if (!keywords) return null
    const state = useResumeStore.getState()
    // Claim this exact sectionData BEFORE the request so the debounced effect
    // below skips the edit that a manual rescore() is already handling (every
    // apply-a-fix path writes the store and then calls rescore() directly).
    lastScoredRef.current = state.sectionData
    try {
      const res = await apiFetch("/api/ai/ats-rescore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords,
          sectionData: state.sectionData,
          language: cvLanguage,
          templateId: state.config?.templateId,
          // The synonym matches the full analysis found. Without them this
          // re-score ran exact-match only while the analysis had run WITH
          // synonyms, so the number collapsed the moment the CV was edited.
          semanticMatches: prev?.semanticMatches ?? [],
          // Same carry, same reason: an embedding call cannot run per keystroke,
          // and without these the merge card disappears on the first character
          // typed and comes back only after another full analysis.
          mergePairs: prev?.mergePairs ?? [],
          // Soft-skill credit is decided by a model reading the bullets, and this
          // re-score is deterministic — it cannot re-run that pass on every
          // keystroke, so it carries the last verdict forward.
          //
          // That left a real hole: a bullet the panel ITSELF just wrote to
          // demonstrate a skill was not credited until the next full analysis.
          // The candidate pressed our button, accepted our sentence, and the
          // number stayed where it was. We do not need a model to know what that
          // bullet demonstrates — we asked for it by name.
          // Deduped and capped to the schema's limit. The server rejects an array
          // over 40 entries, and a rejected re-score returns null in silence —
          // the number would simply stop responding to edits with nothing on
          // screen to explain it. The two sources overlap by design (a full
          // analysis re-reports what this session already credited), so without
          // the dedupe the cap arrives much sooner than 40 real skills.
          demonstratedSoftSkills: [
            ...new Set([...(prev?.demonstratedSoftSkills ?? []), ...locallyProvenRef.current]),
          ].slice(0, 40),
        }),
      })
      if (!res.ok) {
        // Silent to the user ON PURPOSE — a live re-score that fails must not
        // interrupt typing. Silent to US was the mistake: this runs on every
        // edit pause, so if it breaks, every PRO user watches their score sit
        // still while they improve their CV, and nobody would ever report it as
        // an error because no error is shown. A 4xx/5xx has a server row; what
        // this adds is the count of users actually affected.
        reportUxFailure("ats_rescore_failed", { status: res.status })
        return null
      }
      const data: ATSResult = await res.json()
      // Preserve the LLM-only fields the deterministic rescore doesn't produce:
      // summary/suggestions (from the analyze) and analysis (the recruiter pass).
      // gapPlan and typoWarnings ARE recomputed here, so they update live.
      // analysisUnavailable travels with `analysis`: the deterministic rescore
      // does not produce either, so carrying one without the other would make the
      // "analysis is missing" notice vanish on the next keystroke while it is
      // still missing.
      setAtsResult((cur) => (cur
        ? { ...normalizeAtsResult(data), summary: cur.summary, suggestions: cur.suggestions, analysis: cur.analysis, analysisUnavailable: cur.analysisUnavailable, semanticRecallFailed: cur.semanticRecallFailed }
        : normalizeAtsResult(data)))
      const d = data.score - (prev?.score ?? data.score)
      // Single owner of the delta badge: EVERY score movement updates it, whether
      // it came from applying a fix or from a plain edit picked up by the debounce.
      // Previously the panel owned this and only the manual path wrote it, so an
      // edit that LOWERED the score left a stale "+N" badge under the new number.
      setScoreDelta(d)
      return d
    } catch (err) {
      // Silent — keep the prior score rather than surfacing a re-score failure.
      // Recorded all the same: a thrown re-score is a broken response body or a
      // dead network, and this is the only place either can be seen.
      reportUxFailure("ats_rescore_threw", { name: err instanceof Error ? err.name.slice(0, 40) : "unknown" })
      return null
    }
  }, [cvLanguage])

  // Real-time score: once an initial analyze() has landed a result, debounce
  // further CV edits into an automatic rescore(). rescore() is deterministic/
  // no-LLM (reuses keywords already extracted), so this is free to run on every
  // edit pause. Deliberately depends on `sectionData` only — rescore() writes
  // atsResult, so including it here would refire this effect on its own output
  // and loop forever (the exact "useEffect calling AI endpoint without a
  // dependency guard" pattern the QA checklist flags). Read via atsResultRef
  // instead so the gate sees the latest value without becoming a dependency.
  useEffect(() => {
    if (!atsResultRef.current) return
    // Skip edits a manual rescore() already claimed (apply-a-fix paths call it
    // directly) — otherwise every applied fix fired a second, redundant request.
    if (lastScoredRef.current === sectionData) return
    const timer = setTimeout(() => { rescore() }, 800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionData])


  
  const hasResult = atsResult !== null || reviewResult !== null
  // True when a result is on screen AND the job input is unchanged since it was
  // produced. The Analyze button reflects this: "up to date" vs "Re-analyze".
  // Current means BOTH sides are unchanged: the posting it was scored against and
  // the CV it was written about.
  const upToDate =
    hasResult &&
    analyzedInputKey !== null &&
    `${mode}:${input.trim()}` === analyzedInputKey &&
    analyzedCvKey !== null &&
    cvFingerprint(sectionData) === analyzedCvKey

  return {
    input, setInput,
    mode, setMode,
    loading,
    atsResult, reviewResult,
    offTopic,
    hasResult,
    upToDate,
    analyze,
    rescore,
    creditSoftSkill,
    scoreDelta,
    cooldownUntil,
  }
}
