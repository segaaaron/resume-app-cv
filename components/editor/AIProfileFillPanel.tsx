"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import type {
  PersonalDetails, SkillItem, WorkExperienceItem,
  EducationItem, ProjectItem, VolunteerItem, LanguageItem,
} from "@/types/resume"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Sparkles, Loader2, ChevronDown, ChevronUp, Check,
  ArrowRight, Briefcase, GraduationCap, FolderOpen, Heart, Globe, Info,
} from "lucide-react"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import { useAIProfileFill } from "./hooks/useAIProfileFill"
import type { ResumeSections } from "@/types/resume"

type SectionIntent =
  | "summary" | "jobTitle" | "workExperience" | "education"
  | "skills" | "languages" | "projects" | "volunteer" | "hobbies"
  | null

function detectSectionIntent(prompt: string): SectionIntent {
  const p = prompt.toLowerCase()
  if (/resumen|summary|perfil profesional|professional summary/.test(p)) return "summary"
  if (/título|titulo|cargo|job title|puesto|posici[oó]n/.test(p)) return "jobTitle"
  if (/experiencia|trabajo|laboral|work experience|empleo|empresa/.test(p)) return "workExperience"
  if (/educaci[oó]n|estudio|universidad|carrera|grado|degree|school/.test(p)) return "education"
  if (/habilidad|skill|competencia|conocimiento/.test(p)) return "skills"
  if (/idioma|language|lengua/.test(p)) return "languages"
  if (/proyecto|project/.test(p)) return "projects"
  if (/voluntari|volunteer/.test(p)) return "volunteer"
  if (/hobby|hobbie|inter[eé]s|pasatiempo/.test(p)) return "hobbies"
  return null
}

function isCVEmpty(sectionData: ResumeSections): boolean {
  const summary = (sectionData.summary as string) ?? ""
  const workExp = (sectionData.workExperience as unknown[]) ?? []
  const education = (sectionData.education as unknown[]) ?? []
  const skills = (sectionData.skills as unknown[]) ?? []
  return !summary.trim() && workExp.length === 0 && education.length === 0 && skills.length === 0
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

export default function AIProfileFillPanel() {
  const t = useTranslations("editor.ai_profile_fill")
  const { sectionData, updateSectionData, save } = useResumeStore()
  const { prompt, setPrompt, loading, result, generate } = useAIProfileFill()
  const [expanded, setExpanded] = useState(false)

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

  // Detect which section the user is asking about (set on generate, not on every keystroke)
  const [sectionIntent, setSectionIntent] = useState<SectionIntent>(null)

  async function handleGenerate() {
    // Detect section intent from current prompt before clearing state
    setSectionIntent(detectSectionIntent(prompt))
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

  // Show all sections when CV is empty or user didn't mention a specific section
  const cvIsEmpty = isCVEmpty(sectionData as ResumeSections)
  const showAll = cvIsEmpty || !sectionIntent
  function show(section: SectionIntent) { return showAll || sectionIntent === section }

  // ── Apply handlers ─────────────────────────────────────────────────────────
  function applySkills() {
    const existing = (sectionData.skills ?? []) as SkillItem[]
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
    <div className="border border-border rounded-xl overflow-hidden">
      <button type="button" onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-semibold">{t("title")}</span>
          <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-medium">Pro</span>
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-white border-t border-border">
          <p className="text-[11px] text-muted-foreground pt-3 leading-relaxed">
            {t("description")}
          </p>

          <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
            <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-blue-700 leading-relaxed">
              {t("review_hint")} <span className="font-semibold">{t("review_hint_tab")}</span> {t("review_hint_suffix")}
            </p>
          </div>

          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={t("placeholder")}
            className="text-xs min-h-[90px] resize-none"
            maxLength={500}
          />
          <p className="text-[10px] text-muted-foreground">{prompt.length}/500</p>

          <Button size="sm" className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={handleGenerate} disabled={loading || prompt.trim().length < 10}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? t("btn_generating") : t("btn_generate")}
          </Button>

          {hasAnyResult && (
            <div className="space-y-4 pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground pt-1">
                {t("review_hint")}
              </p>

              {/* Work experience */}
              {show("workExperience") && result!.workExperienceUpdates?.map(u => {
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
              {show("workExperience") && result!.workExperienceNew?.map((entry, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3 text-violet-600" />
                      {entry.jobTitle} — {entry.employer}
                      <span className="text-[9px] bg-violet-100 text-violet-600 px-1 py-0.5 rounded ml-1">Nueva</span>
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
              {show("education") && result!.educationUpdates?.map(u => {
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
              {show("projects") && result!.projectUpdates?.map(u => {
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
              {show("volunteer") && result!.volunteerUpdates?.map(u => {
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
              {show("summary") && result!.summary && (
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
              {show("jobTitle") && result!.jobTitle && (
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
              {show("hobbies") && result!.hobbies && (
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

              {/* Skills */}
              {show("skills") && (result!.suggestedSkills?.length ?? 0) > 0 && (
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
                          onClick={() => setSelectedSkills(prev => { const n = new Set(prev); n.has(skill) ? n.delete(skill) : n.add(skill); return n })}
                          className={`text-[10px] border rounded-full px-2 py-0.5 transition-colors ${inCV ? "bg-gray-50 text-gray-400 border-gray-200 cursor-default" : appliedSkills ? "bg-green-50 text-green-700 border-green-300 cursor-default" : selected ? "bg-indigo-100 text-indigo-700 border-indigo-300" : "bg-white text-muted-foreground border-border hover:border-indigo-300"}`}>
                          {inCV ? "✓ " : selected && !appliedSkills ? "● " : ""}{skill}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Languages */}
              {show("languages") && (result!.suggestedLanguages?.length ?? 0) > 0 && (
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
                          onClick={() => setSelectedLanguages(prev => { const n = new Set(prev); n.has(lang.name) ? n.delete(lang.name) : n.add(lang.name); return n })}
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
        </div>
      )}
    </div>
  )
}
