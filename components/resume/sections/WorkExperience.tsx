"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import type { WorkExperienceItem } from "@/types/resume"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, ChevronDown, ChevronRight, Sparkles, Loader2, Lock, Check, Briefcase, Building2, MapPin, CalendarDays, FileText } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { nanoid } from "nanoid"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { useEditorPro } from "@/components/editor/EditorContext"

export default function WorkExperienceSection() {
  const t = useTranslations("editor.sections_form")
  const ai = useTranslations("editor.ai")
  const { isPro, openUpgrade } = useEditorPro()
  const { sectionData, updateSectionData, config } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData, config: s.config }))
  )
  const jobs = sectionData.workExperience
  const [openId, setOpenId] = useState<string | null>(null)
  useEffect(() => { if (jobs[0]?.id) setOpenId(jobs[0].id) }, [jobs[0]?.id])
  const [improvingId, setImprovingId] = useState<string | null>(null)
  const [aiVersions, setAiVersions] = useState<{ jobId: string; bullets: string[] } | null>(null)
  const [improvedId, setImprovedId] = useState<string | null>(null)

  async function handleImprove(job: WorkExperienceItem) {
    if (!job.description.trim()) {
      toast.error(ai("off_topic_bullet"))
      return
    }
    setImprovingId(job.id)
    setAiVersions(null)
    try {
      const res = await apiFetch("/api/ai/improve-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: job.description, jobTitle: job.jobTitle, language: config.language }),
      })
      if (res.status === 429) { toast.error(ai("rate_limit_exceeded")); return }
      if (res.status === 403) { toast.error(ai("pro_only")); return }
      if (res.status === 422) { toast.error(ai("off_topic_bullet")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const bullets = Array.isArray(data.bullets) ? (data.bullets as string[]) : []
      if (bullets.length === 0) { toast.error(ai("error_bullet")); return }
      const normalize = (s: string) => s.trim().replace(/\s+/g, " ")
      const newContent = bullets.join("\n")
      if (normalize(newContent) === normalize(job.description)) {
        toast.info(ai("already_optimized"))
        return
      }
      setAiVersions({ jobId: job.id, bullets })
    } catch {
      toast.error(ai("error_bullet"))
    } finally {
      setImprovingId(null)
    }
  }

  function applyBullets(jobId: string, bullets: string[]) {
    updateSectionData(
      "workExperience",
      jobs.map((j) => (j.id === jobId ? { ...j, description: bullets.join("\n") } : j))
    )
    setAiVersions(null)
    setImprovedId(jobId)
    toast.success(ai("apply_bullets"))
  }

  function addJob() {
    const newJob: WorkExperienceItem = {
      id: nanoid(),
      employer: "",
      jobTitle: "",
      city: "",
      startDate: "",
      endDate: "",
      currentlyWorking: false,
      description: "",
    }
    const updated = [...jobs, newJob]
    updateSectionData("workExperience", updated)
    setOpenId(newJob.id)
  }

  function updateJob(id: string, field: keyof WorkExperienceItem, value: unknown) {
    updateSectionData(
      "workExperience",
      jobs.map((j) => (j.id === id ? { ...j, [field]: value } : j))
    )
  }

  function removeJob(id: string) {
    updateSectionData("workExperience", jobs.filter((j) => j.id !== id))
    if (openId === id) setOpenId(null)
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <div key={job.id} className="border border-border rounded-lg overflow-hidden">
          <div
            role="button"
            tabIndex={0}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => setOpenId(openId === job.id ? null : job.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpenId(openId === job.id ? null : job.id) }}
          >
            <span className="font-medium truncate text-left">
              {job.jobTitle || job.employer || t("new_experience")}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); removeJob(job.id) }}
                className="p-1 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {openId === job.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </div>
          </div>

          {openId === job.id && (
            <div className="border-t border-border px-3 py-3 grid grid-cols-2 gap-3">
              <Field label={t("work.job_title")} value={job.jobTitle} onChange={(v) => updateJob(job.id, "jobTitle", v)} icon={Briefcase} />
              <Field label={t("work.employer")} value={job.employer} onChange={(v) => updateJob(job.id, "employer", v)} icon={Building2} />
              <Field label={t("work.city")} value={job.city} onChange={(v) => updateJob(job.id, "city", v)} icon={MapPin} />
              <div />
              <Field label={t("work.start_date")} value={job.startDate} onChange={(v) => updateJob(job.id, "startDate", v)} placeholder={t("work.start_placeholder")} icon={CalendarDays} />
              {!job.currentlyWorking && (
                <Field label={t("work.end_date")} value={job.endDate} onChange={(v) => updateJob(job.id, "endDate", v)} placeholder={t("work.end_placeholder")} icon={CalendarDays} />
              )}
              <div className="col-span-2 flex items-center gap-2">
                <Switch
                  id={`current-${job.id}`}
                  checked={job.currentlyWorking}
                  onCheckedChange={(v) => updateJob(job.id, "currentlyWorking", v)}
                />
                <Label htmlFor={`current-${job.id}`} className="text-xs">{t("currently_working")}</Label>
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-muted-foreground"><FileText size={12} strokeWidth={2} style={{ color: "#5B8FBD", flexShrink: 0 }} />{t("description")}</Label>
                  <button
                    type="button"
                    onClick={isPro ? () => handleImprove(job) : openUpgrade}
                    disabled={improvingId === job.id || improvedId === job.id}
                    className={`flex items-center gap-1 text-[11px] font-medium disabled:opacity-50 transition-colors ${
                      improvedId === job.id
                        ? "text-emerald-600 cursor-default"
                        : "text-indigo-600 hover:text-indigo-700"
                    }`}
                  >
                    {!isPro
                      ? <><Lock className="h-3 w-3" /> {ai("improve_bullet")}</>
                      : improvingId === job.id
                        ? <><Loader2 className="h-3 w-3 animate-spin" /> {ai("generating")}</>
                        : improvedId === job.id
                          ? <><Check className="h-3 w-3" /> {ai("bullet_improved")}</>
                          : <><Sparkles className="h-3 w-3" /> {ai("improve_bullet")}</>
                    }
                  </button>
                </div>
                <Textarea
                  value={job.description}
                  onChange={(e) => {
                    updateJob(job.id, "description", e.target.value)
                    if (improvedId === job.id) setImprovedId(null)
                  }}
                  placeholder={t("description_placeholder")}
                  className="text-xs min-h-[80px] resize-none"
                />

                {/* AI bullets panel */}
                {aiVersions?.jobId === job.id && (
                  <div className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> {ai("bullets_improved")} ({aiVersions.bullets.length})
                    </p>
                    <div className="rounded-md bg-white border border-indigo-100 p-2.5 space-y-1">
                      {aiVersions.bullets.map((bullet, i) => (
                        <p key={i} className="text-xs text-foreground leading-relaxed">{bullet}</p>
                      ))}
                    </div>
                    <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 leading-relaxed">
                      ⚠ {ai("metrics_disclaimer")}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => applyBullets(job.id, aiVersions.bullets)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        {ai("apply_bullets")}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAiVersions(null); handleImprove(job) }}
                        disabled={improvingId === job.id}
                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        {ai("regenerate")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiVersions(null)}
                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {ai("cancel")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" className="w-full gap-1.5" style={{ background: "#0B1B3D", color: "#FFFFFF", borderColor: "#0B1B3D" }} onClick={addJob}>
        <Plus className="h-3.5 w-3.5" /> {t("add_experience")}
      </Button>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  icon?: LucideIcon
}) {
  return (
    <div>
      <Label className="text-xs mb-1 block text-muted-foreground">
        {Icon && <Icon size={12} strokeWidth={2} style={{ color: "#5B8FBD", flexShrink: 0 }} />}
        {label}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-xs"
      />
    </div>
  )
}
