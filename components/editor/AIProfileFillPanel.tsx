"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import type {
  PersonalDetails, SkillItem, WorkExperienceItem,
  EducationItem, ProjectItem, VolunteerItem, LanguageItem,
} from "@/types/resume"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Sparkles, Loader2, ChevronDown, Check,
  ArrowRight, Briefcase, GraduationCap, FolderOpen, Heart, Globe, Info, CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import { useAIProfileFill } from "./hooks/useAIProfileFill"
import AIProfileInterview from "./AIProfileInterview"
import { useCooldownLabel } from "./hooks/useAICooldown"
import type { ResumeSections } from "@/types/resume"

function isCVComplete(sectionData: ResumeSections): boolean {
  const summary = (sectionData.summary as string) ?? ""
  const workExp = (sectionData.workExperience as unknown[]) ?? []
  const skills = (sectionData.skills as unknown[]) ?? []
  return summary.trim().length > 0 && workExp.length > 0 && skills.length > 0
}

// ── Reusable diff block ────────────────────────────────────────────────────────
function DiffBlock({
  icon, label, currentValue, suggestedValue, applied, accentClass, onApply, applyLabel, appliedLabel,
}: {
  icon: React.ReactNode
  label: string
  currentValue: string
  suggestedValue: string
  applied: boolean
  accentClass: string
  onApply: () => void
  applyLabel: string
  appliedLabel: string
}) {
  if (!suggestedValue) return null
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
          {icon} {label}
        </p>
        {!applied ? (
          <Button size="sm" variant="outline"
            className={`h-6 text-[10px] px-2 gap-1 ${accentClass}`}
            onClick={onApply}>
            <Sparkles className="h-2.5 w-2.5" />
            {applyLabel}
          </Button>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-green-700">
            <Check className="h-3 w-3" /> {appliedLabel}
          </span>
        )}
      </div>
      {currentValue && !applied ? (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-1.5 items-start">
          <div className="rounded border border-border bg-muted/40 px-2 py-1.5 text-[10px] text-muted-foreground leading-relaxed whitespace-pre-line">{currentValue}</div>
          <ArrowRight className="h-3 w-3 text-muted-foreground mt-1.5 shrink-0" />
          <div className={`rounded border px-2 py-1.5 text-[10px] text-foreground leading-relaxed whitespace-pre-line ${accentClass.includes("violet") ? "border-violet-200 bg-violet-50/50" : accentClass.includes("indigo") ? "border-indigo-200 bg-indigo-50/50" : "border-emerald-200 bg-emerald-50/50"}`}>{suggestedValue}</div>
        </div>
      ) : (
        <div className={`rounded border px-2 py-1.5 text-[10px] leading-relaxed whitespace-pre-line ${applied ? "border-border bg-muted/20 text-muted-foreground" : accentClass.includes("violet") ? "border-violet-200 bg-violet-50/50 text-foreground" : "border-indigo-200 bg-indigo-50/50 text-foreground"}`}>
          {suggestedValue}
        </div>
      )}
    </div>
  )
}

// ── Section update blocks (workExp, education, projects, volunteer) ────────────
function SectionUpdateBlock({
  icon, label, currentDescription, suggestedDescription, applied, accentClass, onApply, applyLabel, appliedLabel,
}: {
  icon: React.ReactNode
  label: string
  currentDescription: string
  suggestedDescription: string
  applied: boolean
  accentClass: string
  onApply: () => void
  applyLabel: string
  appliedLabel: string
}) {
  return (
    <DiffBlock
      icon={icon}
      label={label}
      currentValue={currentDescription}
      suggestedValue={suggestedDescription}
      applied={applied}
      accentClass={accentClass}
      onApply={onApply}
      applyLabel={applyLabel}
      appliedLabel={appliedLabel}
    />
  )
}

export default function AIProfileFillPanel({ inTab = false }: { inTab?: boolean }) {
  const t = useTranslations("editor.ai_profile_fill")
  const { sectionData, updateSectionData, save } = useResumeStore(
    useShallow((s) => ({
      sectionData: s.sectionData,
      updateSectionData: s.updateSectionData,
      save: s.save,
    }))
  )
  const { prompt, setPrompt, loading, result, generate, cooldownUntil } = useAIProfileFill()

  // The hook has enforced a 2-minute cooldown since day one, but the panel never
  // read it: the button stayed lit, the click was swallowed and the only sign
  // was a toast. Same countdown the Summary and Work Experience buttons show.
  const { inCooldown, label: cooldownLabel } = useCooldownLabel(cooldownUntil)
  const [expanded, setExpanded] = useState(inTab)

  // Applied state per section (UI-only)
  const [appliedSummary, setAppliedSummary] = useState(false)
  const [appliedJobTitle, setAppliedJobTitle] = useState(false)
  const [appliedHobbies, setAppliedHobbies] = useState(false)
  const [appliedSkills, setAppliedSkills] = useState(false)
  const [appliedLanguages, setAppliedLanguages] = useState(false)
  const [appliedWork, setAppliedWork] = useState<Set<string>>(new Set())
  const [appliedNewWork, setAppliedNewWork] = useState<Set<number>>(new Set())
  const [appliedEdu, setAppliedEdu] = useState<Set<string>>(new Set())
  const [appliedProj, setAppliedProj] = useState<Set<string>>(new Set())
  const [appliedVol, setAppliedVol] = useState<Set<string>>(new Set())
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set())

  async function handleGenerate() {
    // Reset all applied UI state before generating
    setAppliedSummary(false); setAppliedJobTitle(false); setAppliedHobbies(false)
    setAppliedSkills(false); setAppliedLanguages(false)
    setAppliedWork(new Set()); setAppliedNewWork(new Set())
    setAppliedEdu(new Set()); setAppliedProj(new Set()); setAppliedVol(new Set())
    setSelectedSkills(new Set()); setSelectedLanguages(new Set())
    const data = await generate()
    if (data) {
      setSelectedSkills(new Set(data.suggestedSkills ?? []))
      setSelectedLanguages(new Set((data.suggestedLanguages ?? []).map((l) => l.name)))
    }
  }

  // Every suggestion the model returned is rendered. There used to be a
  // keyword-guessed "section intent" filter here that hid the rest, and it read
  // live sectionData: applying ONE suggestion changed the CV, flipped the
  // filter, and the remaining suggestions vanished mid-review — paid AI work
  // thrown away in front of the user.
  const cvComplete = isCVComplete(sectionData as ResumeSections)

  // ── Apply handlers ─────────────────────────────────────────────────────────
  function applySkills() {
    const existing = (sectionData.skills ?? []) as SkillItem[]
    // selectedSkills spans both lists, so nothing here needs to know which one
    // a chip came from — the user ticking it is what makes it theirs.
    const toAdd = [...selectedSkills].filter(n => !existing.some(e => e.name.toLowerCase() === n.toLowerCase()))
    if (!toAdd.length) { toast.info(t("toast_skills_already")); return }
    updateSectionData("skills", [...existing, ...toAdd.map((n): SkillItem => ({ id: nanoid(), name: n, level: "intermediate" }))])
    setAppliedSkills(true)
    toast.success(t("toast_skills_added", { count: toAdd.length }))
    save().catch(() => {})
  }

  function applyLanguages() {
    const existing = (sectionData.languages ?? []) as LanguageItem[]
    const suggestions = (result?.suggestedLanguages ?? []).filter(l => selectedLanguages.has(l.name))
    const toAdd = suggestions.filter(l => !existing.some(e => e.name.toLowerCase() === l.name.toLowerCase()))
    if (!toAdd.length) { toast.info(t("toast_languages_already")); return }
    const validLevels = ["elementary", "limited", "professional", "full_professional", "native"]
    updateSectionData("languages", [
      ...existing,
      ...toAdd.map((l): LanguageItem => ({
        id: nanoid(),
        name: l.name,
        level: (validLevels.includes(l.level) ? l.level : "professional") as LanguageItem["level"],
      })),
    ])
    setAppliedLanguages(true)
    toast.success(t("toast_languages_added", { count: toAdd.length }))
    save().catch(() => {})
  }

  function applyItemUpdate(
    updateId: string,
    field: "workExperience" | "education" | "projects" | "volunteer",
    newDescription: string,
    appliedSet: Set<string>,
    setApplied: (s: Set<string>) => void,
    label: string,
  ) {
    const items = (sectionData[field] ?? []) as (WorkExperienceItem | EducationItem | ProjectItem | VolunteerItem)[]
    const updated = items.map(i => i.id === updateId ? { ...i, description: newDescription } : i)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateSectionData(field, updated as any)
    setApplied(new Set(appliedSet).add(updateId))
    toast.success(t("toast_item_updated", { label }))
    save().catch(() => {})
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const currentSummary = (sectionData.summary as string) ?? ""
  const currentJobTitle = (sectionData.personalDetails as { jobTitle?: string })?.jobTitle ?? ""
  const currentHobbies = (sectionData.hobbies as string) ?? ""
  const workExps = (sectionData.workExperience ?? []) as WorkExperienceItem[]
  const educations = (sectionData.education ?? []) as EducationItem[]
  const projects = (sectionData.projects ?? []) as ProjectItem[]
  const volunteers = (sectionData.volunteer ?? []) as VolunteerItem[]

  const hasAnyResult = result && (
    result.summary || result.jobTitle || result.hobbies ||
    result.suggestedSkills?.length || result.suggestedLanguages?.length ||
    result.workExperienceUpdates?.length || result.workExperienceNew?.length || result.educationUpdates?.length ||
    result.projectUpdates?.length || result.volunteerUpdates?.length
  )

  return (
    <>
      <div
        className={inTab ? undefined : "ai-assistant-card"}
        style={inTab ? { padding: '0 0 18px' } : {
          margin: '16px 24px 20px', borderRadius: 16, overflow: 'hidden',
          border: '1.5px solid transparent',
          background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #8B5CF6, #06B6D4) border-box',
          boxShadow: '0 4px 20px rgba(139,92,246,0.08)',
        }}
      >
        {/* Header */}
        {inTab ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0 16px', borderBottom: '1px solid rgba(139,92,246,0.12)', marginBottom: 16 }}>
            <div className="ai-assistant-icon-anim" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', letterSpacing: '-0.01em' }}>{t("title")}</span>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', color: '#FFF', padding: '2px 7px', borderRadius: 20 }}>PRO</span>
              </div>
              <p style={{ fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 1.4 }}>{t("description")}</p>
            </div>
          </div>
        ) : (
          <div onClick={() => setExpanded(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', userSelect: 'none', background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(6,182,212,0.06) 100%)' }}>
            <div className="ai-assistant-icon-anim" style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', flexShrink: 0 }}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1e1b4b', letterSpacing: '-0.01em' }}>{t("title")}</span>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', color: '#FFF', padding: '2px 7px', borderRadius: 20 }}>PRO</span>
            </div>
            <ChevronDown className="h-4 w-4" style={{ color: '#8B5CF6', transition: 'transform 0.3s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </div>
        )}

        {/* Content — always shown in tab, gated by expanded in sidebar */}
        {(inTab || expanded) && (
          <div style={{ padding: inTab ? '0' : '0 16px 18px' }}>
            {!inTab && <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 14 }}>{t("description")}</p>}

            {/* CV complete banner */}
            {cvComplete && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.08) 100%)',
                border: '1.5px solid rgba(16,185,129,0.3)',
                borderRadius: 12, padding: '14px 16px', marginBottom: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <CheckCircle2 style={{ width: 20, height: 20, color: '#10B981', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>{t("cv_complete_title")}</span>
                </div>
                <p style={{ fontSize: 11, color: '#047857', lineHeight: 1.6, marginBottom: 10 }}>{t("cv_complete_desc")}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[t("cv_complete_summary"), t("cv_complete_skills"), t("cv_complete_experience")].map((label) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#059669' }}>
                      <Check style={{ width: 12, height: 12, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600 }}>{label}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: '#6B7280', marginTop: 10, lineHeight: 1.5 }}>{t("cv_complete_hint")}</p>
              </div>
            )}

            {/* The "already complete" banner INFORMS; it does not lock the tool.
                A CV with one job and one skill counted as complete, and the
                textarea was disabled from then on — the user could never ask
                the assistant for a new role again. */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={t("placeholder")}
                className="ai-main-textarea"
                maxLength={500}
              />
              <span
                style={{
                  position: 'absolute', bottom: 8, right: 10,
                  fontSize: 10, fontWeight: 600, color: '#94A3B8',
                  fontFamily: 'monospace', pointerEvents: 'none',
                }}
              >
                {prompt.length}/500
              </span>
            </div>

            <div
              style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                background: 'rgba(6,182,212,0.07)',
                border: '1px solid rgba(6,182,212,0.25)',
                borderRadius: 10, padding: '10px 12px', marginBottom: 14,
                fontSize: 11, color: '#0E7490', lineHeight: 1.5,
              }}
            >
              <Info
                style={{ width: 14, height: 14, color: '#06B6D4', flexShrink: 0, marginTop: 1 }}
              />
              <span>
                {t("review_hint")} <span style={{ fontWeight: 600 }}>{t("review_hint_tab")}</span> {t("review_hint_suffix")}
              </span>
            </div>

            <button
              type="button"
              className="ai-generate-btn"
              onClick={handleGenerate}
              disabled={loading || inCooldown || prompt.trim().length < 10}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? t("btn_generating") : inCooldown ? t("btn_cooldown", { seconds: cooldownLabel }) : t("btn_generate")}
            </button>

          {hasAnyResult && (
            <div className="space-y-4" style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(139,92,246,0.15)' }}>
              <p className="text-[10px] text-muted-foreground pt-1">
                {t("review_hint")}
              </p>

              {/* Work experience */}
              {result!.workExperienceUpdates?.map(u => {
                const job = workExps.find(j => j.id === u.id)
                if (!job) return null
                return (
                  <SectionUpdateBlock key={u.id}
                    icon={<Briefcase className="h-3 w-3 text-violet-600" />}
                    label={`${job.employer || job.jobTitle}`}
                    currentDescription={job.description}
                    suggestedDescription={u.description}
                    applied={appliedWork.has(u.id)}
                    accentClass="border-violet-300 text-violet-700 hover:bg-violet-50"
                    onApply={() => applyItemUpdate(u.id, "workExperience", u.description, appliedWork, setAppliedWork, job.employer ?? job.jobTitle ?? "Experiencia")}
                    applyLabel={job.description ? t("btn_replace") : t("btn_apply")}
                    appliedLabel={t("applied")}
                  />
                )
              })}

              {/* New work experience entries */}
              {result!.workExperienceNew?.map((entry, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3 text-violet-600" />
                      {/* Either field can be empty: the model is told to send ""
                          instead of inventing a company the user never named. */}
                      {[entry.jobTitle, entry.employer].filter(Boolean).join(" — ") || t("label_new_experience")}
                      <span className="text-[9px] bg-violet-100 text-violet-600 px-1 py-0.5 rounded ml-1">{t("badge_new")}</span>
                    </p>
                    {!appliedNewWork.has(i) ? (
                      <Button size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 gap-1 border-violet-300 text-violet-700 hover:bg-violet-50"
                        onClick={() => {
                          const existing = (sectionData.workExperience ?? []) as WorkExperienceItem[]
                          const newEntry: WorkExperienceItem = {
                            id: nanoid(),
                            jobTitle: entry.jobTitle,
                            employer: entry.employer,
                            city: entry.city ?? "",
                            startDate: entry.startDate ?? "",
                            endDate: entry.endDate ?? "",
                            currentlyWorking: entry.currentlyWorking ?? false,
                            description: entry.description,
                          }
                          updateSectionData("workExperience", [...existing, newEntry])
                          setAppliedNewWork(prev => new Set(prev).add(i))
                          toast.success(t("toast_item_updated", { label: entry.employer }))
                          save().catch(() => {})
                        }}>
                        <Sparkles className="h-2.5 w-2.5" /> {t("btn_apply")}
                      </Button>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-green-700"><Check className="h-3 w-3" /> {t("applied")}</span>
                    )}
                  </div>
                  <div className="rounded border border-violet-200 bg-violet-50/50 px-2 py-1.5 text-[10px] text-foreground leading-relaxed whitespace-pre-line">
                    {entry.description}
                  </div>
                  {(entry.city || entry.startDate) && (
                    <p className="text-[9px] text-muted-foreground">
                      {[entry.city, entry.startDate && `${entry.startDate}${entry.endDate ? ` – ${entry.endDate}` : entry.currentlyWorking ? " – Actual" : ""}`].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              ))}

              {/* Education */}
              {result!.educationUpdates?.map(u => {
                const edu = educations.find(e => e.id === u.id)
                if (!edu) return null
                return (
                  <SectionUpdateBlock key={u.id}
                    icon={<GraduationCap className="h-3 w-3 text-blue-600" />}
                    label={`${edu.degree || edu.institution}`}
                    currentDescription={edu.description}
                    suggestedDescription={u.description}
                    applied={appliedEdu.has(u.id)}
                    accentClass="border-blue-300 text-blue-700 hover:bg-blue-50"
                    onApply={() => applyItemUpdate(u.id, "education", u.description, appliedEdu, setAppliedEdu, edu.degree ?? edu.institution ?? "Educación")}
                    applyLabel={edu.description ? t("btn_replace") : t("btn_apply")}
                    appliedLabel={t("applied")}
                  />
                )
              })}

              {/* Projects */}
              {result!.projectUpdates?.map(u => {
                const proj = projects.find(p => p.id === u.id)
                if (!proj) return null
                return (
                  <SectionUpdateBlock key={u.id}
                    icon={<FolderOpen className="h-3 w-3 text-amber-600" />}
                    label={proj.name}
                    currentDescription={proj.description}
                    suggestedDescription={u.description}
                    applied={appliedProj.has(u.id)}
                    accentClass="border-amber-300 text-amber-700 hover:bg-amber-50"
                    onApply={() => applyItemUpdate(u.id, "projects", u.description, appliedProj, setAppliedProj, proj.name ?? "Proyecto")}
                    applyLabel={proj.description ? t("btn_replace") : t("btn_apply")}
                    appliedLabel={t("applied")}
                  />
                )
              })}

              {/* Volunteer */}
              {result!.volunteerUpdates?.map(u => {
                const vol = volunteers.find(v => v.id === u.id)
                if (!vol) return null
                return (
                  <SectionUpdateBlock key={u.id}
                    icon={<Heart className="h-3 w-3 text-rose-600" />}
                    label={`${vol.organization || vol.role}`}
                    currentDescription={vol.description}
                    suggestedDescription={u.description}
                    applied={appliedVol.has(u.id)}
                    accentClass="border-rose-300 text-rose-700 hover:bg-rose-50"
                    onApply={() => applyItemUpdate(u.id, "volunteer", u.description, appliedVol, setAppliedVol, vol.organization ?? vol.role ?? "Voluntariado")}
                    applyLabel={vol.description ? t("btn_replace") : t("btn_apply")}
                    appliedLabel={t("applied")}
                  />
                )
              })}

              {/* Summary */}
              {result!.summary && (
                <DiffBlock
                  icon={<span className="text-[10px]">📝</span>}
                  label={t("label_summary")}
                  currentValue={currentSummary}
                  suggestedValue={result!.summary}
                  applied={appliedSummary}
                  accentClass="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  applyLabel={currentSummary ? t("btn_replace") : t("btn_apply")}
                  appliedLabel={t("applied")}
                  onApply={() => {
                    updateSectionData("summary", result!.summary!)
                    setAppliedSummary(true)
                    toast.success(t("toast_summary_updated"))
                    save().catch(() => {})
                  }}
                />
              )}

              {/* Job title */}
              {result!.jobTitle && (
                <DiffBlock
                  icon={<span className="text-[10px]">🏷️</span>}
                  label={t("label_job_title")}
                  currentValue={currentJobTitle}
                  suggestedValue={result!.jobTitle}
                  applied={appliedJobTitle}
                  accentClass="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  applyLabel={currentJobTitle ? t("btn_replace") : t("btn_apply")}
                  appliedLabel={t("applied")}
                  onApply={() => {
                    const pd = (sectionData.personalDetails ?? {}) as PersonalDetails
                    updateSectionData("personalDetails", { ...pd, jobTitle: result!.jobTitle! })
                    setAppliedJobTitle(true)
                    toast.success(t("toast_job_title_updated"))
                    save().catch(() => {})
                  }}
                />
              )}

              {/* Hobbies */}
              {result!.hobbies && (
                <DiffBlock
                  icon={<span className="text-[10px]">🎯</span>}
                  label={t("label_hobbies")}
                  currentValue={currentHobbies}
                  suggestedValue={result!.hobbies}
                  applied={appliedHobbies}
                  accentClass="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  applyLabel={currentHobbies ? t("btn_replace") : t("btn_apply")}
                  appliedLabel={t("applied")}
                  onApply={() => {
                    updateSectionData("hobbies", result!.hobbies!)
                    setAppliedHobbies(true)
                    toast.success(t("toast_hobbies_updated"))
                    save().catch(() => {})
                  }}
                />
              )}

              {/* Skills — two lists, one selection, one Apply.
                  "From your text" comes pre-selected because the user already
                  claimed it. "Typical of your role" arrives UNSELECTED: it is a
                  proposal about them, and only they can turn it into a claim. */}
              {((result!.suggestedSkills?.length ?? 0) > 0 || (result!.inferredSkills?.length ?? 0) > 0) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-foreground">{t("label_suggested_skills")}</p>
                    {!appliedSkills ? (
                      <Button size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 gap-1 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                        onClick={applySkills} disabled={selectedSkills.size === 0}>
                        <Sparkles className="h-2.5 w-2.5" /> {t("btn_add_count", { count: selectedSkills.size })}
                      </Button>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-green-700"><Check className="h-3 w-3" /> {t("applied")}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {result!.suggestedSkills!.map(skill => {
                      const selected = selectedSkills.has(skill)
                      const inCV = (sectionData.skills as { name: string }[] ?? []).some(s => s.name.toLowerCase() === skill.toLowerCase())
                      return (
                        <button key={skill} type="button" disabled={appliedSkills || inCV}
                          onClick={() => setSelectedSkills(prev => { const n = new Set(prev); if (n.has(skill)) n.delete(skill); else n.add(skill); return n })}
                          className={`text-[10px] border rounded-full px-2 py-0.5 transition-colors ${inCV ? "bg-gray-50 text-gray-400 border-gray-200 cursor-default" : appliedSkills ? "bg-green-50 text-green-700 border-green-300 cursor-default" : selected ? "bg-indigo-100 text-indigo-700 border-indigo-300" : "bg-white text-muted-foreground border-border hover:border-indigo-300"}`}>
                          {inCV ? "✓ " : selected && !appliedSkills ? "● " : ""}{skill}
                        </button>
                      )
                    })}
                  </div>

                  {(result!.inferredSkills?.length ?? 0) > 0 && (
                    <div className="space-y-1 pt-1.5">
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        {t("inferred_skills_hint")}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result!.inferredSkills!.map(skill => {
                          const selected = selectedSkills.has(skill)
                          const inCV = (sectionData.skills as { name: string }[] ?? []).some(s => s.name.toLowerCase() === skill.toLowerCase())
                          return (
                            <button key={`inf-${skill}`} type="button" disabled={appliedSkills || inCV}
                              onClick={() => setSelectedSkills(prev => { const n = new Set(prev); if (n.has(skill)) n.delete(skill); else n.add(skill); return n })}
                              className={`text-[10px] border border-dashed rounded-full px-2 py-0.5 transition-colors ${inCV ? "bg-gray-50 text-gray-400 border-gray-200 cursor-default" : appliedSkills ? "bg-green-50 text-green-700 border-green-300 cursor-default" : selected ? "bg-indigo-100 text-indigo-700 border-indigo-400 border-solid" : "bg-white text-muted-foreground border-indigo-200 hover:border-indigo-400"}`}>
                              {inCV ? "✓ " : selected && !appliedSkills ? "● " : "+ "}{skill}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Languages */}
              {(result!.suggestedLanguages?.length ?? 0) > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3 text-emerald-600" /> {t("label_suggested_languages")}
                    </p>
                    {!appliedLanguages ? (
                      <Button size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={applyLanguages} disabled={selectedLanguages.size === 0}>
                        <Sparkles className="h-2.5 w-2.5" /> {t("btn_add_count", { count: selectedLanguages.size })}
                      </Button>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-green-700"><Check className="h-3 w-3" /> {t("applied")}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {result!.suggestedLanguages!.map(lang => {
                      const selected = selectedLanguages.has(lang.name)
                      const inCV = (sectionData.languages as { name: string }[] ?? []).some(l => l.name.toLowerCase() === lang.name.toLowerCase())
                      return (
                        <button key={lang.name} type="button" disabled={appliedLanguages || inCV}
                          onClick={() => setSelectedLanguages(prev => { const n = new Set(prev); if (n.has(lang.name)) n.delete(lang.name); else n.add(lang.name); return n })}
                          className={`text-[10px] border rounded-full px-2 py-0.5 transition-colors ${inCV ? "bg-gray-50 text-gray-400 border-gray-200 cursor-default" : appliedLanguages ? "bg-green-50 text-green-700 border-green-300 cursor-default" : selected ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-white text-muted-foreground border-border hover:border-emerald-300"}`}>
                          {inCV ? "✓ " : selected && !appliedLanguages ? "● " : ""}{lang.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
          </div>
        )}

          {/* Step 2 — the questions. The model has written what it could; this
              asks for what is still missing, in the order that improves the CV
              most. Rendered whether or not there was a result: an untouched CV
              needs the questions most, and that is exactly the user the
              one-shot text box served worst. */}
          <AIProfileInterview />
      </div>
        )}
      </div>
    </>
  )
}
