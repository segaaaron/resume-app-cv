"use client"

import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import type { WorkExperienceItem } from "@/types/resume"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Plus, Trash2, ChevronDown, ChevronRight, Sparkles, Loader2,
  Lock, Check, Briefcase, Building2, MapPin, CalendarDays, FileText, Wand2, X, ChevronLeft,
} from "lucide-react"
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
    if (!job.description.trim()) { toast.error(ai("off_topic_bullet")); return }
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
      if (normalize(bullets.join("\n")) === normalize(job.description)) { toast.info(ai("already_optimized")); return }
      setAiVersions({ jobId: job.id, bullets })
    } catch {
      toast.error(ai("error_bullet"))
    } finally {
      setImprovingId(null)
    }
  }

  function applyBullets(jobId: string, bullets: string[]) {
    updateSectionData("workExperience", jobs.map((j) => (j.id === jobId ? { ...j, description: bullets.join("\n") } : j)))
    setAiVersions(null)
    setImprovedId(jobId)
    toast.success(ai("apply_bullets"))
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
        <div key={job.id} className="border border-border rounded-lg bg-white">
          <div
            role="button" tabIndex={0}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => {
              setOpenId(openId === job.id ? null : job.id)
              setImprovedId(null)
              setAiVersions(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setOpenId(openId === job.id ? null : job.id)
                setImprovedId(null)
                setAiVersions(null)
              }
            }}
          >
            <span className="font-medium truncate text-left">
              {job.jobTitle || job.employer || t("new_experience")}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={(e) => { e.stopPropagation(); removeJob(job.id) }} className="p-1 hover:text-destructive transition-colors">
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
              <DateField label={t("work.start_date")} value={job.startDate} onChange={(v) => updateJob(job.id, "startDate", v)} />
              {!job.currentlyWorking && (
                <DateField label={t("work.end_date")} value={job.endDate} onChange={(v) => updateJob(job.id, "endDate", v)} />
              )}

              <div className="col-span-2 flex items-center gap-2">
                <Switch id={`current-${job.id}`} checked={job.currentlyWorking} onCheckedChange={(v) => updateJob(job.id, "currentlyWorking", v)} />
                <Label htmlFor={`current-${job.id}`} className="text-xs">{t("currently_working")}</Label>
              </div>

              {/* Description + AI */}
              <div className="col-span-2 space-y-2">
                {/* Description label + AI button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText size={12} strokeWidth={2} style={{ color: "#5B8FBD" }} />
                    {t("description")}
                  </div>
                  <button
                    type="button"
                    onClick={isPro ? () => handleImprove(job) : openUpgrade}
                    disabled={improvingId === job.id || improvedId === job.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed border-none"
                    style={{
                      background: improvedId === job.id
                        ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                        : "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                      color: "#fff",
                      boxShadow: improvedId === job.id ? "0 2px 6px rgba(16,185,129,0.3)" : "0 2px 6px rgba(124,58,237,0.25)",
                    }}
                  >
                    {!isPro
                      ? <><Lock className="h-2.5 w-2.5" />{ai("improve_bullet")}</>
                      : improvingId === job.id
                        ? <><Loader2 className="h-2.5 w-2.5 animate-spin" />{ai("generating")}</>
                        : improvedId === job.id
                          ? <><Check className="h-2.5 w-2.5" />{ai("bullet_improved")}</>
                          : <><Wand2 className="h-2.5 w-2.5" />{ai("improve_bullet")}</>
                    }
                  </button>
                </div>

                {/* Textarea premium */}
                <div className="relative">
                  <textarea
                    value={job.description}
                    onChange={(e) => {
                      updateJob(job.id, "description", e.target.value)
                      if (improvedId === job.id) setImprovedId(null)
                    }}
                    placeholder={t("description_placeholder")}
                    rows={5}
                    className="w-full resize-none text-[12.5px] leading-relaxed text-[#1a2e4a] placeholder:text-slate-400 outline-none transition-all duration-200"
                    style={{
                      background: "linear-gradient(135deg, rgba(240,248,255,0.8) 0%, rgba(232,244,251,0.6) 100%)",
                      border: "1.5px solid rgba(0,212,255,0.2)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.03)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(0,212,255,0.5)"
                      e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.03), 0 0 0 3px rgba(0,212,255,0.08)"
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(0,212,255,0.2)"
                      e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.03)"
                    }}
                  />
                </div>

                {/* AI bullets panel — dark premium */}
                {aiVersions?.jobId === job.id && (
                  <div className="relative overflow-hidden rounded-2xl"
                    style={{
                      background: "linear-gradient(135deg, #0f1e3a 0%, #1a2e4a 100%)",
                      border: "1px solid rgba(0,212,255,0.2)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,212,255,0.08)",
                    }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
                      style={{ background: "linear-gradient(90deg, transparent, #00D4FF, transparent)", opacity: 0.5 }} />

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-lg"
                          style={{ background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)" }}>
                          <Sparkles className="w-3 h-3" style={{ color: "#00D4FF" }} />
                        </div>
                        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#00D4FF" }}>
                          {ai("bullets_improved")} ({aiVersions.bullets.length})
                        </span>
                      </div>
                      <button type="button" onClick={() => setAiVersions(null)}
                        className="flex items-center justify-center w-5 h-5 rounded-full cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Bullets */}
                    <div className="px-4 pb-4 space-y-2">
                      <div className="rounded-xl p-3 space-y-1.5"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        {aiVersions.bullets.map((bullet, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="flex items-center justify-center w-4 h-4 rounded-full shrink-0 mt-0.5 text-[8px] font-black"
                              style={{ background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)", color: "#0a1a35" }}>
                              {i + 1}
                            </span>
                            <p className="text-[11.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.82)" }}>{bullet}</p>
                          </div>
                        ))}
                      </div>

                      {/* Disclaimer */}
                      <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg"
                        style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)" }}>
                        <span className="text-amber-400 text-[10px] shrink-0">⚠</span>
                        <p className="text-[10px] leading-relaxed" style={{ color: "rgba(245,158,11,0.85)" }}>
                          {ai("metrics_disclaimer")}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <button type="button" onClick={(e) => { e.stopPropagation(); applyBullets(job.id, aiVersions.bullets) }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-bold cursor-pointer transition-all duration-150 border-none"
                          style={{ background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)", color: "#0a1a35", boxShadow: "0 2px 8px rgba(0,212,255,0.25)" }}>
                          <Check className="w-2.5 h-2.5" />{ai("apply_bullets")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={addJob} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg" style={{ border: "1.5px dashed #7A9BB5", background: "rgba(26,46,74,0.08)", color: "#1a2e4a", fontSize: 12, fontWeight: 600 }}>
        <Plus className="h-3.5 w-3.5" /> {t("add_experience")}
      </button>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, icon: Icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: LucideIcon
}) {
  const [local, setLocal] = useState(value)
  const commitRef = useRef(onChange)
  commitRef.current = onChange

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

const MONTHS_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const t = useTranslations("editor.sections_form")
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 240 })

  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      const popW = 240
      const left = r.left + popW > window.innerWidth ? r.right - popW : r.left
      setPopoverPos({ top: r.bottom + 6, left, width: popW })
    }
  }, [open])

  const parsed = (() => {
    const m = value.match(/^(\d{4})-(\d{2})$/)
    if (m) return { year: parseInt(m[1]), month: parseInt(m[2]) - 1 }
    const y = value.match(/^(\d{4})$/)
    if (y) return { year: parseInt(y[1]), month: -1 }
    return { year: new Date().getFullYear(), month: -1 }
  })()

  const [viewYear, setViewYear] = useState(parsed.year)

  const displayValue = (() => {
    if (!value) return ""
    if (parsed.month >= 0) return `${MONTHS_ES[parsed.month]} ${parsed.year}`
    return `${parsed.year}`
  })()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  function selectMonth(monthIdx: number) {
    const mm = String(monthIdx + 1).padStart(2, "0")
    onChange(`${viewYear}-${mm}`)
    setOpen(false)
  }

  const popover = open ? (
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        zIndex: 9999,
        top: popoverPos.top,
        left: popoverPos.left,
        width: popoverPos.width,
        borderRadius: 16,
        overflow: "hidden",
        background: "linear-gradient(135deg, #0f1e3a 0%, #1a2e4a 100%)",
        border: "1px solid rgba(0,212,255,0.25)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,212,255,0.1)",
      }}
    >
      {/* Glow top line */}
      <div style={{
        position: "absolute", top: 0, left: "12.5%", width: "75%", height: 1,
        background: "linear-gradient(90deg, transparent, #00D4FF, transparent)", opacity: 0.55,
      }} />

      {/* Year nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 10px" }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setViewYear((y) => y - 1) }}
          style={{
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8, cursor: "pointer",
            background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)", color: "#00D4FF",
          }}
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", color: "#fff" }}>{viewYear}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setViewYear((y) => y + 1) }}
          style={{
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8, cursor: "pointer",
            background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)", color: "#00D4FF",
          }}
        >
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Month grid — inline grid, no Tailwind classes */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 6,
        padding: "0 12px 12px",
      }}>
        {MONTHS_ES.map((m, i) => {
          const isSelected = parsed.month === i && parsed.year === viewYear
          return (
            <button
              key={m}
              type="button"
              onClick={(e) => { e.stopPropagation(); selectMonth(i) }}
              style={{
                padding: "8px 0",
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
                transition: "all 0.15s ease",
                background: isSelected
                  ? "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)"
                  : "rgba(255,255,255,0.06)",
                color: isSelected ? "#0a1a35" : "rgba(255,255,255,0.78)",
                boxShadow: isSelected ? "0 2px 10px rgba(0,212,255,0.4)" : "none",
              }}
            >
              {m}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "10px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false) }}
          style={{ fontSize: 10.5, fontWeight: 500, cursor: "pointer", border: "none", background: "transparent", color: "rgba(255,255,255,0.38)" }}
        >
          {t("date.clear")}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); selectMonth(new Date().getMonth()) }}
          style={{ fontSize: 10.5, fontWeight: 700, cursor: "pointer", border: "none", background: "transparent", color: "#00D4FF" }}
        >
          {t("date.this_month")}
        </button>
      </div>
    </div>
  ) : null

  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#7A9BB5", letterSpacing: "0.01em", textTransform: "capitalize", marginBottom: 6 }}>
        <CalendarDays size={12} strokeWidth={2} style={{ color: "#5B8FBD", flexShrink: 0 }} />
        {label}
      </label>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setViewYear(parsed.year || new Date().getFullYear()); setOpen((o) => !o) }}
        className="w-full text-left flex items-center justify-between"
        style={{
          height: 36,
          paddingLeft: 12,
          paddingRight: 12,
          background: "#ffffff",
          border: "1px solid #C8DCF0",
          borderRadius: 6,
          color: displayValue ? "#1a2e4a" : "#94A3B8",
          fontSize: 13.5,
          fontWeight: 500,
        }}
      >
        <span>{displayValue || t("date.select")}</span>
        <CalendarDays size={11} style={{ color: "#5B8FBD", flexShrink: 0 }} />
      </button>

      {typeof document !== "undefined" && createPortal(popover, document.body)}
    </div>
  )
}
