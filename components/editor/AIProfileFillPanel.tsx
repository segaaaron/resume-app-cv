"use client"

import { useState } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import type {
  PersonalDetails, SkillItem, WorkExperienceItem,
  EducationItem, ProjectItem, VolunteerItem, LanguageItem,
} from "@/types/resume"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Sparkles, Loader2, ChevronDown, ChevronUp, Check,
  ArrowRight, Briefcase, GraduationCap, FolderOpen, Heart, Globe,
} from "lucide-react"
import { toast } from "sonner"
import { nanoid } from "nanoid"

interface ItemUpdate { id: string; description: string }
interface SuggestedLanguage { name: string; level: string }

interface FillProfileResult {
  summary?: string | null
  jobTitle?: string | null
  hobbies?: string | null
  suggestedSkills?: string[]
  suggestedLanguages?: SuggestedLanguage[]
  workExperienceUpdates?: ItemUpdate[]
  educationUpdates?: ItemUpdate[]
  projectUpdates?: ItemUpdate[]
  volunteerUpdates?: ItemUpdate[]
}

// ── Reusable diff block ────────────────────────────────────────────────────────
function DiffBlock({
  icon, label, currentValue, suggestedValue, applied, accentClass, onApply,
}: {
  icon: React.ReactNode
  label: string
  currentValue: string
  suggestedValue: string
  applied: boolean
  accentClass: string
  onApply: () => void
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
            {currentValue ? "Reemplazar" : "Aplicar"}
          </Button>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-green-700">
            <Check className="h-3 w-3" /> Aplicado
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
  icon, label, currentDescription, suggestedDescription, applied, accentClass, onApply,
}: {
  icon: React.ReactNode
  label: string
  currentDescription: string
  suggestedDescription: string
  applied: boolean
  accentClass: string
  onApply: () => void
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
    />
  )
}

export default function AIProfileFillPanel() {
  const { sectionData, updateSectionData } = useResumeStore()
  const [expanded, setExpanded] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FillProfileResult | null>(null)

  // Applied state per section
  const [appliedSummary, setAppliedSummary] = useState(false)
  const [appliedJobTitle, setAppliedJobTitle] = useState(false)
  const [appliedHobbies, setAppliedHobbies] = useState(false)
  const [appliedSkills, setAppliedSkills] = useState(false)
  const [appliedLanguages, setAppliedLanguages] = useState(false)
  const [appliedWork, setAppliedWork] = useState<Set<string>>(new Set())
  const [appliedEdu, setAppliedEdu] = useState<Set<string>>(new Set())
  const [appliedProj, setAppliedProj] = useState<Set<string>>(new Set())
  const [appliedVol, setAppliedVol] = useState<Set<string>>(new Set())
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set())

  async function handleGenerate() {
    if (prompt.trim().length < 10) { toast.error("Describe tu perfil (mínimo 10 caracteres)"); return }
    setLoading(true)
    setResult(null)
    setAppliedSummary(false); setAppliedJobTitle(false); setAppliedHobbies(false)
    setAppliedSkills(false); setAppliedLanguages(false)
    setAppliedWork(new Set()); setAppliedEdu(new Set())
    setAppliedProj(new Set()); setAppliedVol(new Set())
    setSelectedSkills(new Set()); setSelectedLanguages(new Set())
    try {
      const res = await fetch("/api/ai/fill-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), sectionData }),
      })
      if (res.status === 403) { toast.error("Esta función es exclusiva del plan Pro"); return }
      if (res.status === 400) { toast.error("Describe tu perfil con más detalle"); return }
      if (res.status === 422) { toast.error("Solo puedo generar contenido a partir de descripciones profesionales reales"); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setSelectedSkills(new Set(data.suggestedSkills ?? []))
      setSelectedLanguages(new Set((data.suggestedLanguages ?? []).map((l: SuggestedLanguage) => l.name)))
    } catch {
      toast.error("Error al generar el perfil")
    } finally {
      setLoading(false)
    }
  }

  // ── Apply handlers ─────────────────────────────────────────────────────────
  function applySkills() {
    const existing = (sectionData.skills ?? []) as SkillItem[]
    const toAdd = [...selectedSkills].filter(n => !existing.some(e => e.name.toLowerCase() === n.toLowerCase()))
    if (!toAdd.length) { toast.info("Las habilidades seleccionadas ya están en tu CV"); return }
    updateSectionData("skills", [...existing, ...toAdd.map((n): SkillItem => ({ id: nanoid(), name: n, level: "intermediate" }))])
    setAppliedSkills(true)
    toast.success(`${toAdd.length} habilidad${toAdd.length > 1 ? "es" : ""} agregada${toAdd.length > 1 ? "s" : ""}`)
  }

  function applyLanguages() {
    const existing = (sectionData.languages ?? []) as LanguageItem[]
    const suggestions = (result?.suggestedLanguages ?? []).filter(l => selectedLanguages.has(l.name))
    const toAdd = suggestions.filter(l => !existing.some(e => e.name.toLowerCase() === l.name.toLowerCase()))
    if (!toAdd.length) { toast.info("Los idiomas seleccionados ya están en tu CV"); return }
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
    toast.success(`${toAdd.length} idioma${toAdd.length > 1 ? "s" : ""} agregado${toAdd.length > 1 ? "s" : ""}`)
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
    toast.success(`"${label}" actualizado`)
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
    result.workExperienceUpdates?.length || result.educationUpdates?.length ||
    result.projectUpdates?.length || result.volunteerUpdates?.length
  )

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button type="button" onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-semibold">Ayúdate con la IA</span>
          <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-medium">Pro</span>
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-white border-t border-border">
          <p className="text-[11px] text-muted-foreground pt-3 leading-relaxed">
            Cuéntale a la IA qué quieres mejorar: un trabajo específico, tus estudios, proyectos, habilidades, idiomas o tu perfil general. Aplica cada cambio de forma independiente.
          </p>

          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={`Ej: "En IA Interactive usé SwiftUI y TCA, rediseñé UIKit. Agrégalo."\n\nO: "Soy dev React con 5 años, especializado en performance y a11y."`}
            className="text-xs min-h-[90px] resize-none"
            maxLength={500}
          />
          <p className="text-[10px] text-muted-foreground">{prompt.length}/500</p>

          <Button size="sm" className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? "Generando..." : "Generar con IA"}
          </Button>

          {hasAnyResult && (
            <div className="space-y-4 pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground pt-1">
                Revisa cada sugerencia y aplícala de forma independiente.
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
                    onApply={() => applyItemUpdate(u.id, "workExperience", u.description, appliedWork, setAppliedWork,
                      i => i.employer ?? i.jobTitle ?? "Experiencia")}
                  />
                )
              })}

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
                    onApply={() => applyItemUpdate(u.id, "education", u.description, appliedEdu, setAppliedEdu,
                      i => i.degree ?? i.institution ?? "Educación")}
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
                    onApply={() => applyItemUpdate(u.id, "projects", u.description, appliedProj, setAppliedProj,
                      i => i.name ?? "Proyecto")}
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
                    onApply={() => applyItemUpdate(u.id, "volunteer", u.description, appliedVol, setAppliedVol,
                      i => i.organization ?? i.role ?? "Voluntariado")}
                  />
                )
              })}

              {/* Summary */}
              {result!.summary && (
                <DiffBlock
                  icon={<span className="text-[10px]">📝</span>}
                  label="Resumen profesional"
                  currentValue={currentSummary}
                  suggestedValue={result!.summary}
                  applied={appliedSummary}
                  accentClass="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  onApply={() => {
                    updateSectionData("summary", result!.summary!)
                    setAppliedSummary(true)
                    toast.success("Resumen profesional actualizado")
                  }}
                />
              )}

              {/* Job title */}
              {result!.jobTitle && (
                <DiffBlock
                  icon={<span className="text-[10px]">🏷️</span>}
                  label="Título del puesto"
                  currentValue={currentJobTitle}
                  suggestedValue={result!.jobTitle}
                  applied={appliedJobTitle}
                  accentClass="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  onApply={() => {
                    const pd = (sectionData.personalDetails ?? {}) as PersonalDetails
                    updateSectionData("personalDetails", { ...pd, jobTitle: result!.jobTitle! })
                    setAppliedJobTitle(true)
                    toast.success("Título del puesto actualizado")
                  }}
                />
              )}

              {/* Hobbies */}
              {result!.hobbies && (
                <DiffBlock
                  icon={<span className="text-[10px]">🎯</span>}
                  label="Intereses"
                  currentValue={currentHobbies}
                  suggestedValue={result!.hobbies}
                  applied={appliedHobbies}
                  accentClass="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onApply={() => {
                    updateSectionData("hobbies", result!.hobbies!)
                    setAppliedHobbies(true)
                    toast.success("Intereses actualizados")
                  }}
                />
              )}

              {/* Skills */}
              {(result!.suggestedSkills?.length ?? 0) > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-foreground">Habilidades sugeridas</p>
                    {!appliedSkills ? (
                      <Button size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 gap-1 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                        onClick={applySkills} disabled={selectedSkills.size === 0}>
                        <Sparkles className="h-2.5 w-2.5" /> Agregar ({selectedSkills.size})
                      </Button>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-green-700"><Check className="h-3 w-3" /> Aplicado</span>
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
              {(result!.suggestedLanguages?.length ?? 0) > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3 text-emerald-600" /> Idiomas sugeridos
                    </p>
                    {!appliedLanguages ? (
                      <Button size="sm" variant="outline"
                        className="h-6 text-[10px] px-2 gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={applyLanguages} disabled={selectedLanguages.size === 0}>
                        <Sparkles className="h-2.5 w-2.5" /> Agregar ({selectedLanguages.size})
                      </Button>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-green-700"><Check className="h-3 w-3" /> Aplicado</span>
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
