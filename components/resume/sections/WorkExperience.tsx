"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import type { WorkExperienceItem } from "@/types/resume"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { nanoid } from "nanoid"

export default function WorkExperienceSection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore()
  const jobs = sectionData.workExperience
  const [openId, setOpenId] = useState<string | null>(jobs[0]?.id ?? null)

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
          <button
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"
            onClick={() => setOpenId(openId === job.id ? null : job.id)}
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
          </button>

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
                <Label className="text-xs mb-1 block text-muted-foreground">{t("description")}</Label>
                <Textarea
                  value={job.description}
                  onChange={(e) => updateJob(job.id, "description", e.target.value)}
                  placeholder={t("description_placeholder")}
                  className="text-xs min-h-[80px] resize-none"
                />
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
