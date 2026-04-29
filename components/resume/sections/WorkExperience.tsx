"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import type { WorkExperienceItem } from "@/types/resume"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, ChevronDown, ChevronRight, Sparkles, Loader2, Lock } from "lucide-react"
import { nanoid } from "nanoid"
import { toast } from "sonner"
import { useEditorPro } from "@/components/editor/EditorContext"

export default function WorkExperienceSection() {
  const t = useTranslations("editor.sections_form")
  const ai = useTranslations("editor.ai")
  const { isPro, openUpgrade } = useEditorPro()
  const { sectionData, updateSectionData, config } = useResumeStore()
  const jobs = sectionData.workExperience
  const [openId, setOpenId] = useState<string | null>(null)
  useEffect(() => { if (jobs[0]?.id) setOpenId(jobs[0].id) }, [])
  const [improvingId, setImprovingId] = useState<string | null>(null)
  const [aiVersions, setAiVersions] = useState<{ jobId: string; versions: string[] } | null>(null)

  async function handleImprove(job: WorkExperienceItem) {
    if (!job.description.trim()) {
      toast.error(ai("off_topic_bullet"))
      return
    }
    setImprovingId(job.id)
    setAiVersions(null)
    try {
      const res = await fetch("/api/ai/improve-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: job.description, jobTitle: job.jobTitle, language: config.language }),
      })
      if (res.status === 403) { toast.error(ai("pro_only")); return }
      if (res.status === 422) { toast.error(ai("off_topic_bullet")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAiVersions({ jobId: job.id, versions: data.versions })
    } catch {
      toast.error(ai("error_bullet"))
    } finally {
      setImprovingId(null)
    }
  }

  function applyVersion(jobId: string, version: string) {
    updateSectionData(
      "workExperience",
      jobs.map((j) => (j.id === jobId ? { ...j, description: version } : j))
    )
    setAiVersions(null)
    toast.success(ai("summary_applied"))
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
              <Field label={t("work.job_title")} value={job.jobTitle} onChange={(v) => updateJob(job.id, "jobTitle", v)} />
              <Field label={t("work.employer")} value={job.employer} onChange={(v) => updateJob(job.id, "employer", v)} />
              <Field label={t("work.city")} value={job.city} onChange={(v) => updateJob(job.id, "city", v)} />
              <div />
              <Field label={t("work.start_date")} value={job.startDate} onChange={(v) => updateJob(job.id, "startDate", v)} placeholder={t("work.start_placeholder")} />
              {!job.currentlyWorking && (
                <Field label={t("work.end_date")} value={job.endDate} onChange={(v) => updateJob(job.id, "endDate", v)} placeholder={t("work.end_placeholder")} />
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
                  <Label className="text-xs text-muted-foreground">{t("description")}</Label>
                  <button
                    type="button"
                    onClick={isPro ? () => handleImprove(job) : openUpgrade}
                    disabled={improvingId === job.id}
                    className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {!isPro
                      ? <><Lock className="h-3 w-3" /> {ai("improve_bullet")}</>
                      : improvingId === job.id
                        ? <><Loader2 className="h-3 w-3 animate-spin" /> {ai("generating")}</>
                        : <><Sparkles className="h-3 w-3" /> {ai("improve_bullet")}</>
                    }
                  </button>
                </div>
                <Textarea
                  value={job.description}
                  onChange={(e) => updateJob(job.id, "description", e.target.value)}
                  placeholder={t("description_placeholder")}
                  className="text-xs min-h-[80px] resize-none"
                />

                {/* AI versions panel */}
                {aiVersions?.jobId === job.id && (
                  <div className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> {ai("choose_version")}
                    </p>
                    {aiVersions.versions.map((v, i) => (
                      <div key={i} className="rounded-md bg-white border border-indigo-100 p-2.5 space-y-1.5">
                        <p className="text-xs text-foreground leading-relaxed">{v}</p>
                        <button
                          type="button"
                          onClick={() => applyVersion(job.id, v)}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          {ai("use_version")}
                        </button>
                      </div>
                    ))}
                    <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 leading-relaxed">
                      ⚠ {ai("metrics_disclaimer")}
                    </p>
                    <button
                      type="button"
                      onClick={() => setAiVersions(null)}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {ai("cancel")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={addJob}>
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
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <Label className="text-xs mb-1 block text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-xs"
      />
    </div>
  )
}
