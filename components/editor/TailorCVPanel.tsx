"use client"

import { useState, useRef } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Wand2, Loader2, ChevronDown, ChevronUp, Plus, Check, Copy, Clock, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { nanoid } from "nanoid"
import type { SkillItem, WorkExperienceItem } from "@/types/resume"
import SuggestionDiffModal from "./SuggestionDiffModal"
import { useAICooldown, useCooldownLabel } from "./hooks/useAICooldown"
import { useAICall } from "@/hooks/useAICall"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"
import { handleApiError } from "@/lib/upgrade-modal-handler"
import { useRouter } from "next/navigation"

interface TailorResult {
  summary: string | null
  experiences: Array<{
    targetId: string
    jobTitle: string
    employer: string
    changedBullets: Array<{ index: number; text: string }>
  }>
  missingSkills: string[]
}

interface Props {
  /**
   * The job description, owned by ATSScorePanel. This panel used to keep its
   * own copy behind a second textarea, so the user pasted the same posting
   * twice and paid for two LLM calls to get overlapping answers.
   */
  jobDescription: string
}

export default function TailorCVPanel({ jobDescription }: Props) {
  const t = useTranslations("editor.tailor")
  const aiT = useTranslations("editor.ai")
  const locale = useLocale()
  const router = useRouter()
  const { open: openUpgradeModal } = useUpgradeModal()
  const { preCheck, onSuccess } = useAICall()
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TailorResult | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [appliedSummary, setAppliedSummary] = useState(false)
  const [appliedBullets, setAppliedBullets] = useState<Map<string, Set<number>>>(new Map())
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set())
  const [weavingSkill, setWeavingSkill] = useState<string | null>(null)
  const [pendingBullet, setPendingBullet] = useState<{
    targetId: string
    bulletIndex: number
    text: string
    currentDescription: string
    currentBullet: string
  } | null>(null)
  const { cooldownUntil, setCooldownUntil } = useAICooldown("cooldown_tailor")
  const { inCooldown, label: cooldownLabel } = useCooldownLabel(cooldownUntil)
  const lastTailorKeyRef = useRef<string | null>(null)

  async function handleTailor() {
    if (loading) return
    const jd = jobDescription.trim()
    if (jd.length < 20) { toast.info(t("jd_too_short")); return }

    const tailorKey = JSON.stringify({
      jd,
      s: sectionData.summary,
      w: sectionData.workExperience,
      sk: sectionData.skills,
    })
    if (tailorKey === lastTailorKeyRef.current) { toast.info(t("no_changes")); return }
    if (inCooldown) { toast.info(t("cooldown", { seconds: cooldownLabel })); return }

    setLoading(true)
    setResult(null)
    setExpanded(false)
    setAppliedSummary(false)
    setAppliedBullets(new Map())
    setAddedSkills(new Set())
    preCheck("tailor-cv")
    try {
      const res = await apiFetch("/api/ai/tailor-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionData, jobDescription: jd, language: locale === "en" ? "en" : "es" }),
      })
      if (res.status === 429 || res.status === 403) {
        const handled = await handleApiError(res, {
          openUpgradeModal,
          redirect: (p) => router.push(p),
          locale,
          fallbackToast: () => toast.error(res.status === 429 ? t("rate_limit") : t("pro_only")),
          dailyCapToast: () => toast.warning(aiT("daily_cap_reached"), { duration: 6000 }),
        })
        if (handled || res.status === 429 || res.status === 403) return
      }
      if (res.status === 422) { toast.error(t("off_topic")); return }
      if (!res.ok) { toast.error(t("error")); return }
      const data = await res.json() as TailorResult
      setResult(data)
      setExpanded(true)
      lastTailorKeyRef.current = tailorKey
      setCooldownUntil(Date.now() + 120_000)
      await onSuccess()
    } catch {
      toast.error(t("error"))
    } finally {
      setLoading(false)
    }
  }

  // Open the diff modal instead of applying blind — the user asked to see the
  // current summary vs the suggested one before it overwrites their text (a
  // tailored summary can differ by only a word, and a silent overwrite hides that).
  const [pendingSummary, setPendingSummary] = useState(false)

  function confirmApplySummary() {
    if (!result?.summary) return
    updateSectionData("summary", result.summary)
    setAppliedSummary(true)
    setPendingSummary(false)
    toast.success(t("summary_applied"))
  }

  function isBulletApplied(targetId: string, index: number): boolean {
    return appliedBullets.get(targetId)?.has(index) ?? false
  }

  function confirmApplyBullet() {
    if (!pendingBullet) return
    const { targetId, bulletIndex, text, currentDescription } = pendingBullet
    const lines = currentDescription.split("\n").map(l => l.trim()).filter(Boolean)
    if (bulletIndex >= 0 && bulletIndex < lines.length) {
      lines[bulletIndex] = text
    } else {
      lines.push(text)
    }
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    const updated = work.map((j) =>
      j.id === targetId ? { ...j, description: lines.join("\n") } : j
    )
    updateSectionData("workExperience", updated)
    setAppliedBullets((prev) => {
      const next = new Map(prev)
      const current = next.get(targetId) ?? new Set<number>()
      current.add(bulletIndex)
      next.set(targetId, current)
      return next
    })
    toast.success(t("bullet_applied"))
    setPendingBullet(null)
  }

  function addSkill(name: string) {
    const skills = (sectionData.skills ?? []) as SkillItem[]
    if (skills.some((s) => s.name.trim().toLowerCase() === name.trim().toLowerCase())) {
      toast.info(t("skill_exists"))
      return
    }
    const newSkill: SkillItem = { id: nanoid(), name: name.trim(), level: "intermediate" }
    updateSectionData("skills", [...skills, newSkill])
    setAddedSkills((prev) => new Set(prev).add(name))
    toast.success(t("skill_added"))
  }

  // Ask the model to weave a skill the candidate already has into ONE bullet of
  // the best-fit job, then open the same confirm-diff modal used for tailored
  // bullets — the user is the honesty gate before anything lands in the CV.
  async function weaveBullet(skill: string) {
    if (weavingSkill) return
    setWeavingSkill(skill)
    preCheck("skill-bullet")
    try {
      const res = await apiFetch("/api/ai/skill-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill, sectionData, language: locale === "en" ? "en" : "es" }),
      })
      if (res.status === 429 || res.status === 403) {
        const handled = await handleApiError(res, {
          openUpgradeModal,
          redirect: (p) => router.push(p),
          locale,
          fallbackToast: () => toast.error(res.status === 429 ? t("rate_limit") : t("pro_only")),
          dailyCapToast: () => toast.warning(aiT("daily_cap_reached"), { duration: 6000 }),
        })
        if (handled || res.status === 429 || res.status === 403) return
      }
      if (!res.ok) { toast.error(t("error")); return }
      const data = await res.json() as
        | { status: "written"; targetId: string; jobTitle: string; employer: string; text: string }
        | { status: "no_fit" }
      if (data.status === "no_fit") { toast.info(t("skill_bullet_no_fit")); return }

      const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
      const job = work.find((j) => j.id === data.targetId)
      if (!job) { toast.info(t("skill_bullet_no_fit")); return }
      const desc = job.description ?? ""
      const lines = desc.split("\n").map((l) => l.trim()).filter(Boolean)
      // Append: bulletIndex past the end makes confirmApplyBullet push a new line.
      setPendingBullet({
        targetId: data.targetId,
        bulletIndex: lines.length,
        text: data.text,
        currentDescription: desc,
        currentBullet: "",
      })
      await onSuccess()
    } catch {
      toast.error(t("error"))
    } finally {
      setWeavingSkill(null)
    }
  }

  return (
    <div className="rounded-2xl border border-dash-cyan-border/60 bg-white/70 backdrop-blur-sm overflow-hidden shadow-[0_2px_12px_rgba(0,212,255,0.06)]">
      {/* Header + CTA. No textarea here: the job description is the one the user
          already pasted for the ATS score, above. */}
      <div className="px-4 py-3 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-dash-cyan to-[#00A8CC] shadow-sm shadow-dash-cyan/40">
          <Wand2 size={13} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-bold text-dash-navy">{t("title")}</p>
          <p className="text-[10.5px] text-dash-muted leading-snug">{t("subtitle")}</p>
        </div>
      </div>

      <div className="px-4 pb-3">
        <button
          onClick={handleTailor}
          disabled={loading || jobDescription.trim().length < 20 || inCooldown}
          className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl text-[12.5px] font-bold text-white bg-gradient-to-r from-dash-cyan to-[#00A8CC] shadow-lg shadow-dash-cyan/30 transition-all duration-200 hover:shadow-dash-cyan/50 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
        >
          {loading
            ? <><Loader2 size={13} className="animate-spin" />{t("analyzing")}</>
            : inCooldown
              ? <><Clock size={13} />{t("cooldown_btn", { seconds: cooldownLabel })}</>
              : <><Wand2 size={13} />{t("cta")}</>
          }
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between py-2 text-[11.5px] font-semibold text-[#00A8CC]"
          >
            {t("results_title")}
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* All-applied success banner */}
          {result && (() => {
            const allChangedBullets = result.experiences.flatMap(e => e.changedBullets.map(b => ({ targetId: e.targetId, index: b.index })))
            const bulletsDone = allChangedBullets.every(({ targetId, index }) => isBulletApplied(targetId, index))
            const summaryDone = !result.summary || appliedSummary
            const skillsDone = result.missingSkills.every((s) => addedSkills.has(s))
            const hasActionable = !!(result.summary || allChangedBullets.length > 0 || result.missingSkills?.length)
            const allDone = hasActionable && summaryDone && bulletsDone && skillsDone
            const nothingToImprove = !result.summary && allChangedBullets.length === 0 && !result.missingSkills?.length
            return (
              <>
                {allDone && !nothingToImprove ? (
                  <div className="mx-0 mb-2 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-3 flex items-start gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm shrink-0 mt-0.5">
                      <Check size={13} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[11.5px] font-bold text-emerald-800 leading-tight">{t("all_applied_title")}</p>
                      <p className="text-[10.5px] text-emerald-600 mt-0.5 leading-snug">{t("all_applied_desc")}</p>
                    </div>
                  </div>
                ) : null}
                {nothingToImprove ? (
                  <div className="mx-0 mb-2 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-3 flex items-start gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm shrink-0 mt-0.5">
                      <Check size={13} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[11.5px] font-bold text-emerald-800 leading-tight">{t("no_improvements")}</p>
                    </div>
                  </div>
                ) : null}
              </>
            )
          })()}

          {expanded && (
            <div className="space-y-4">
              {/* Tailored summary */}
              {result.summary && (
                <div className="rounded-lg p-3 border border-[rgba(0,212,255,0.15)] bg-white/60">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10.5px] font-bold text-[#1a2e4a] uppercase tracking-wider">{t("section_summary")}</p>
                    <button
                      onClick={() => !appliedSummary && setPendingSummary(true)}
                      disabled={appliedSummary}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold transition-all duration-200 disabled:opacity-60"
                      style={{
                        background: appliedSummary ? "rgba(16,185,129,0.1)" : "rgba(0,212,255,0.12)",
                        color: appliedSummary ? "#10B981" : "#00A8CC",
                        border: `1px solid ${appliedSummary ? "rgba(16,185,129,0.3)" : "rgba(0,212,255,0.3)"}`,
                      }}
                    >
                      {appliedSummary ? <Check size={10} /> : <Copy size={10} />}
                      {appliedSummary ? t("applied") : t("apply")}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#334155] leading-relaxed">{result.summary}</p>
                </div>
              )}

              {/* Bullet suggestions — granular by experience and index */}
              {result.experiences.filter(e => e.changedBullets.length > 0).length > 0 && (
                <div>
                  <p className="text-[10.5px] font-bold text-[#1a2e4a] uppercase tracking-wider mb-2">{t("section_bullets")}</p>
                  <div className="space-y-2">
                    {result.experiences.filter(e => e.changedBullets.length > 0).map((exp) => (
                      <div key={exp.targetId} className="rounded-lg p-3 border border-[rgba(0,212,255,0.15)] bg-white/60">
                        <p className="text-[10px] text-[#7A9BB5] truncate mb-2">{exp.jobTitle} · {exp.employer}</p>
                        <div className="space-y-2">
                          {exp.changedBullets.map((bullet) => {
                            const applied = isBulletApplied(exp.targetId, bullet.index)
                            return (
                              <div key={`${exp.targetId}-${bullet.index}`} className="flex items-start justify-between gap-2">
                                <p className="text-[11px] text-[#334155] leading-relaxed flex-1">{bullet.text}</p>
                                <button
                                  onClick={() => {
                                    if (applied) return
                                    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
                                    const job = work.find(j => j.id === exp.targetId)
                                    const desc = job?.description ?? ""
                                    // Same transform as confirmApplyBullet so the "Current" shown
                                    // is exactly the line that will be replaced (per-bullet diff).
                                    const lines = desc.split("\n").map(l => l.trim()).filter(Boolean)
                                    setPendingBullet({
                                      targetId: exp.targetId,
                                      bulletIndex: bullet.index,
                                      text: bullet.text,
                                      currentDescription: desc,
                                      currentBullet: lines[bullet.index] ?? "",
                                    })
                                  }}
                                  disabled={applied}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold shrink-0 transition-all duration-200 disabled:opacity-60"
                                  style={{
                                    background: applied ? "rgba(16,185,129,0.1)" : "rgba(0,212,255,0.12)",
                                    color: applied ? "#10B981" : "#00A8CC",
                                    border: `1px solid ${applied ? "rgba(16,185,129,0.3)" : "rgba(0,212,255,0.3)"}`,
                                  }}
                                >
                                  {applied ? <Check size={10} /> : <Copy size={10} />}
                                  {applied ? t("applied") : t("apply")}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing skills — filtered against the CURRENT skills list so a
                  skill the user already added (this session, after the tailor
                  run) drops immediately instead of lingering as "missing". */}
              {(() => {
                const owned = new Set(
                  ((sectionData.skills ?? []) as SkillItem[]).map((s) => s.name.trim().toLowerCase()),
                )
                const visibleMissing = result.missingSkills.filter((s) => !owned.has(s.trim().toLowerCase()))
                if (visibleMissing.length === 0) return null
                return (
                <div>
                  <p className="text-[10.5px] font-bold text-[#1a2e4a] uppercase tracking-wider mb-1">{t("section_skills")}</p>
                  <p className="text-[10px] text-dash-muted leading-snug mb-2">{t("skill_bullet_hint")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {visibleMissing.map((skill) => {
                      const added = addedSkills.has(skill)
                      const weaving = weavingSkill === skill
                      return (
                        <div
                          key={skill}
                          className="inline-flex items-stretch rounded-full overflow-hidden"
                          style={{
                            background: added ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.08)",
                            border: `1px solid ${added ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.25)"}`,
                          }}
                        >
                          <button
                            onClick={() => !added && addSkill(skill)}
                            disabled={added}
                            title={added ? t("applied") : t("skill_add_action")}
                            className="flex items-center gap-1 pl-2.5 pr-2 py-1 text-[10.5px] font-semibold transition-all duration-200 disabled:cursor-default"
                            style={{ color: added ? "#10B981" : "#D97706" }}
                          >
                            {added ? <Check size={9} /> : <Plus size={9} />}
                            {skill}
                          </button>
                          <button
                            onClick={() => weaveBullet(skill)}
                            disabled={!!weavingSkill}
                            title={t("skill_bullet_action")}
                            aria-label={t("skill_bullet_action")}
                            className="flex items-center justify-center px-2 border-l transition-all duration-200 hover:bg-amber-100/60 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ borderColor: added ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.25)", color: "#00A8CC" }}
                          >
                            {weaving ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
                )
              })()}

              {/* No keywords chips here: the ATS score above already renders
                  missingKeywords for this same posting, verified against the CV.
                  Two chip rows saying the same thing is noise, not information. */}
            </div>
          )}
        </div>
      )}

      {pendingBullet && (
        <SuggestionDiffModal
          open={true}
          onClose={() => setPendingBullet(null)}
          onConfirm={confirmApplyBullet}
          suggestion={{
            field: "workExperience.description",
            type: "replace",
            preview: pendingBullet.text,
            reason: pendingBullet.currentBullet ? t("diff_replace_reason") : t("diff_add_reason"),
            targetId: pendingBullet.targetId,
          }}
          currentValue={pendingBullet.currentBullet}
        />
      )}

      {pendingSummary && result?.summary && (
        <SuggestionDiffModal
          open={true}
          onClose={() => setPendingSummary(false)}
          onConfirm={confirmApplySummary}
          suggestion={{
            field: "summary",
            type: "replace",
            preview: result.summary,
            reason: t("diff_summary_reason"),
          }}
          currentValue={(sectionData.summary as string) ?? ""}
        />
      )}
    </div>
  )
}
