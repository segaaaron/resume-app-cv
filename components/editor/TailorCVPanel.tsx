"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Wand2, Loader2, ChevronDown, ChevronUp, Plus, Check, Copy, Clock } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { nanoid } from "nanoid"
import type { SkillItem, WorkExperienceItem } from "@/types/resume"
import SuggestionDiffModal from "./SuggestionDiffModal"

interface TailorResult {
  summaryVersion: string
  bulletSuggestions: Array<{ targetId: string; jobTitle: string; employer: string; improved: string }>
  missingSkills: string[]
  keywordsToAdd: string[]
}

export default function TailorCVPanel() {
  const t = useTranslations("editor.tailor")
  const locale = useLocale()
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )
  const [jobDescription, setJobDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TailorResult | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [appliedSummary, setAppliedSummary] = useState(false)
  const [appliedBullets, setAppliedBullets] = useState<Set<string>>(new Set())
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set())
  const [pendingBullet, setPendingBullet] = useState<{ targetId: string; improved: string; currentDescription: string } | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(Date.now())
  const lastTailorKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= cooldownUntil) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [cooldownUntil])

  const inCooldown = now < cooldownUntil
  const cooldownRemaining = inCooldown ? Math.ceil((cooldownUntil - now) / 1000) : 0
  const cooldownLabel = cooldownRemaining >= 60
    ? `${Math.floor(cooldownRemaining / 60)}:${String(cooldownRemaining % 60).padStart(2, "0")}`
    : `${cooldownRemaining}s`

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
    setAppliedBullets(new Set())
    setAddedSkills(new Set())
    try {
      const res = await apiFetch("/api/ai/tailor-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionData, jobDescription: jd, language: locale === "en" ? "en" : "es" }),
      })
      if (res.status === 429) { toast.error(t("rate_limit")); return }
      if (res.status === 403) { toast.error(t("pro_only")); return }
      if (res.status === 422) { toast.error(t("off_topic")); return }
      if (!res.ok) { toast.error(t("error")); return }
      const data = await res.json() as TailorResult
      setResult(data)
      setExpanded(true)
      lastTailorKeyRef.current = tailorKey
      setCooldownUntil(Date.now() + 120_000)
    } catch {
      toast.error(t("error"))
    } finally {
      setLoading(false)
    }
  }

  function applySummary() {
    if (!result?.summaryVersion) return
    updateSectionData("summary", result.summaryVersion)
    setAppliedSummary(true)
    toast.success(t("summary_applied"))
  }

  function openBulletDiff(b: { targetId: string; improved: string }) {
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    const item = work.find((j) => j.id === b.targetId)
    setPendingBullet({ targetId: b.targetId, improved: b.improved, currentDescription: item?.description ?? "" })
  }

  function confirmApplyBullet() {
    if (!pendingBullet) return
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    const updated = work.map((j) => j.id === pendingBullet.targetId ? { ...j, description: pendingBullet.improved } : j)
    updateSectionData("workExperience", updated)
    setAppliedBullets((prev) => new Set(prev).add(pendingBullet.targetId))
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

  return (
    <div
      className="mt-4 rounded-xl border overflow-hidden"
      style={{
        borderColor: "rgba(0,212,255,0.2)",
        background: "linear-gradient(135deg, rgba(240,248,255,0.95) 0%, rgba(232,244,251,0.8) 100%)",
        boxShadow: "0 4px 20px rgba(0,212,255,0.1)",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-[rgba(0,212,255,0.12)]">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)" }}
        >
          <Wand2 size={13} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-bold text-[#1a2e4a]">{t("title")}</p>
          <p className="text-[10.5px] text-[#7A9BB5]">{t("subtitle")}</p>
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pt-3 pb-2">
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder={t("jd_placeholder")}
          rows={4}
          className="w-full text-[11.5px] text-[#1a2e4a] rounded-lg resize-none outline-none transition-all duration-200 placeholder:text-[#94A3B8]"
          style={{
            padding: "10px 12px",
            background: "rgba(255,255,255,0.8)",
            border: "1.5px solid rgba(0,212,255,0.2)",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,212,255,0.08)" }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.2)"; e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.03)" }}
        />
        <button
          onClick={handleTailor}
          disabled={loading || jobDescription.trim().length < 20 || inCooldown}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12.5px] font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-px"
          style={{ background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)", boxShadow: "0 4px 14px rgba(0,212,255,0.35)" }}
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
            const summaryDone = !result.summaryVersion || appliedSummary
            const bulletsDone = result.bulletSuggestions.every((b) => appliedBullets.has(b.targetId))
            const skillsDone = result.missingSkills.every((s) => addedSkills.has(s))
            const hasActionable = !!(result.summaryVersion || result.bulletSuggestions.length || result.missingSkills.length)
            const allDone = hasActionable && summaryDone && bulletsDone && skillsDone
            return allDone ? (
              <div className="mx-0 mb-2 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-3 flex items-start gap-2.5">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm shrink-0 mt-0.5">
                  <Check size={13} className="text-white" />
                </div>
                <div>
                  <p className="text-[11.5px] font-bold text-emerald-800 leading-tight">{t("all_applied_title")}</p>
                  <p className="text-[10.5px] text-emerald-600 mt-0.5 leading-snug">{t("all_applied_desc")}</p>
                </div>
              </div>
            ) : null
          })()}

          {expanded && (
            <div className="space-y-4">
              {/* Tailored summary */}
              {result.summaryVersion && (
                <div className="rounded-lg p-3 border border-[rgba(0,212,255,0.15)] bg-white/60">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10.5px] font-bold text-[#1a2e4a] uppercase tracking-wider">{t("section_summary")}</p>
                    <button
                      onClick={applySummary}
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
                  <p className="text-[11px] text-[#334155] leading-relaxed">{result.summaryVersion}</p>
                </div>
              )}

              {/* Bullet suggestions */}
              {result.bulletSuggestions.length > 0 && (
                <div>
                  <p className="text-[10.5px] font-bold text-[#1a2e4a] uppercase tracking-wider mb-2">{t("section_bullets")}</p>
                  <div className="space-y-2">
                    {result.bulletSuggestions.map((b) => (
                      <div key={b.targetId} className="rounded-lg p-3 border border-[rgba(0,212,255,0.15)] bg-white/60">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] text-[#7A9BB5] truncate flex-1 mr-2">{b.jobTitle} · {b.employer}</p>
                          <button
                            onClick={() => openBulletDiff(b)}
                            disabled={appliedBullets.has(b.targetId)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold shrink-0 transition-all duration-200 disabled:opacity-60"
                            style={{
                              background: appliedBullets.has(b.targetId) ? "rgba(16,185,129,0.1)" : "rgba(0,212,255,0.12)",
                              color: appliedBullets.has(b.targetId) ? "#10B981" : "#00A8CC",
                              border: `1px solid ${appliedBullets.has(b.targetId) ? "rgba(16,185,129,0.3)" : "rgba(0,212,255,0.3)"}`,
                            }}
                          >
                            {appliedBullets.has(b.targetId) ? <Check size={10} /> : <Copy size={10} />}
                            {appliedBullets.has(b.targetId) ? t("applied") : t("apply")}
                          </button>
                        </div>
                        <p className="text-[11px] text-[#334155] leading-relaxed">{b.improved}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing skills */}
              {result.missingSkills.length > 0 && (
                <div>
                  <p className="text-[10.5px] font-bold text-[#1a2e4a] uppercase tracking-wider mb-2">{t("section_skills")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingSkills.map((skill) => {
                      const added = addedSkills.has(skill)
                      return (
                        <button
                          key={skill}
                          onClick={() => !added && addSkill(skill)}
                          disabled={added}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold transition-all duration-200 disabled:cursor-default"
                          style={{
                            background: added ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.08)",
                            color: added ? "#10B981" : "#D97706",
                            border: `1px solid ${added ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.25)"}`,
                          }}
                        >
                          {added ? <Check size={9} /> : <Plus size={9} />}
                          {skill}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Keywords to add */}
              {result.keywordsToAdd.length > 0 && (
                <div>
                  <p className="text-[10.5px] font-bold text-[#1a2e4a] uppercase tracking-wider mb-2">{t("section_keywords")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywordsToAdd.map((kw) => (
                      <span
                        key={kw}
                        className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold"
                        style={{ background: "rgba(0,212,255,0.08)", color: "#00A8CC", border: "1px solid rgba(0,212,255,0.2)" }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#94A3B8] mt-1.5">{t("keywords_hint")}</p>
                </div>
              )}
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
            preview: pendingBullet.improved,
            reason: t("diff_replace_reason"),
            targetId: pendingBullet.targetId,
          }}
          currentValue={pendingBullet.currentDescription}
        />
      )}
    </div>
  )
}
