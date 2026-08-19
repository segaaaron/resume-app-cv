"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import type { WorkExperienceItem } from "@/types/resume"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import DateField from "@/components/editor/MonthYearField"
import {
  Plus, Trash2, ChevronDown, ChevronRight,
  Briefcase, Building2, MapPin, CalendarDays,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { nanoid } from "nanoid"
import BulletFields from "./BulletFields"
import { BULLETS_PER_ROLE_MAX } from "@/lib/ats/scoring-config"

export default function WorkExperienceSection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )
  const jobs = sectionData.workExperience
  const [openId, setOpenId] = useState<string | null>(null)
  // Adjust-during-render (React docs pattern): open the first job when the
  // list's head changes, without an effect that would cascade a re-render.
  const firstJobId = jobs[0]?.id
  const [prevFirstJobId, setPrevFirstJobId] = useState<string | undefined>(undefined)
  if (firstJobId !== prevFirstJobId) {
    setPrevFirstJobId(firstJobId)
    if (firstJobId) setOpenId(firstJobId)
  }

  function addJob() {
    const newJob: WorkExperienceItem = { id: nanoid(), employer: "", jobTitle: "", city: "", startDate: "", endDate: "", currentlyWorking: false, description: "" }
    updateSectionData("workExperience", [...jobs, newJob])
    setOpenId(newJob.id)
  }

  function updateJob(id: string, field: keyof WorkExperienceItem, value: unknown) {
    updateSectionData("workExperience", jobs.map((j) => (j.id === id ? { ...j, [field]: value } : j)))
  }

  function removeJob(id: string) {
    updateSectionData("workExperience", jobs.filter((j) => j.id !== id))
    if (openId === id) setOpenId(null)
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <WorkExperienceJobItem
          key={job.id}
          job={job}
          isOpen={openId === job.id}
          onToggle={() => setOpenId(openId === job.id ? null : job.id)}
          onUpdate={(field, value) => updateJob(job.id, field, value)}
          onRemove={() => removeJob(job.id)}
        />
      ))}
      <button onClick={addJob} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg" style={{ border: "1.5px dashed #7A9BB5", background: "rgba(26,46,74,0.08)", color: "#1a2e4a", fontSize: 12, fontWeight: 600 }}>
        <Plus className="h-3.5 w-3.5" /> {t("add_experience")}
      </button>
    </div>
  )
}

function WorkExperienceJobItem({ job, isOpen, onToggle, onUpdate, onRemove }: {
  job: WorkExperienceItem
  isOpen: boolean
  onToggle: () => void
  onUpdate: (field: keyof WorkExperienceItem, value: unknown) => void
  onRemove: () => void
}) {
  const t = useTranslations("editor.sections_form")

  return (
    <div className="border border-border rounded-lg bg-white">
      <div
        role="button" tabIndex={0}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onToggle() }}
      >
        <span className="font-medium truncate text-left">
          {job.jobTitle || job.employer || t("new_experience")}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onRemove() }} className="p-1 hover:text-destructive transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-border px-3 py-3 grid grid-cols-2 gap-3">
          <Field label={t("work.job_title")} value={job.jobTitle} onChange={(v) => onUpdate("jobTitle", v)} icon={Briefcase} />
          <Field label={t("work.employer")} value={job.employer} onChange={(v) => onUpdate("employer", v)} icon={Building2} />
          <Field label={t("work.city")} value={job.city} onChange={(v) => onUpdate("city", v)} icon={MapPin} />
          <div />
          <DateField variant="form" icon={CalendarDays} label={t("work.start_date")} value={job.startDate} onChange={(v) => onUpdate("startDate", v)} />
          {!job.currentlyWorking && (
            <DateField variant="form" icon={CalendarDays} label={t("work.end_date")} value={job.endDate} onChange={(v) => onUpdate("endDate", v)} />
          )}

          <div className="col-span-2 flex items-center gap-2">
            <Switch id={`current-${job.id}`} checked={job.currentlyWorking} onCheckedChange={(v) => onUpdate("currentlyWorking", v)} />
            <Label htmlFor={`current-${job.id}`} className="text-xs">{t("currently_working")}</Label>
          </div>

          <div className="col-span-2">
            <BulletFields
              label={t("work.bullets")}
              value={job.description}
              onChange={(v) => onUpdate("description", v)}
              addLabel={t("work.add_bullet")}
              placeholder={t("work.bullet_placeholder")}
              removeLabel={t("work.remove_bullet")}
              max={BULLETS_PER_ROLE_MAX.value}
              maxHint={t("work.bullets_max", { max: BULLETS_PER_ROLE_MAX.value })}
            />
          </div>
        </div>
      )}

    </div>
  )
}

function Field({ label, value, onChange, placeholder, icon: Icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: LucideIcon
}) {
  const [local, setLocal] = useState(value)
  const commitRef = useRef(onChange)
  useEffect(() => { commitRef.current = onChange })

  useEffect(() => { setLocal(value) }, [value])

  return (
    <div>
      <label style={{
        display: "flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 600, color: "#7A9BB5",
        letterSpacing: "0.01em", textTransform: "capitalize", marginBottom: 6,
      }}>
        {Icon && <Icon size={12} strokeWidth={2} style={{ color: "#5B8FBD", flexShrink: 0 }} />}
        {label}
      </label>
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => commitRef.current(local)}
        placeholder={placeholder}
        className="h-9 text-sm w-full"
        style={{ paddingLeft: 12, paddingRight: 12, color: "#1a2e4a" }}
      />
    </div>
  )
}
