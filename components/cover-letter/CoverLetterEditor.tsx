"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ArrowLeft, Save, Printer, Loader2, Check, Sparkles, Lock, ChevronDown, ChevronUp, Camera, X } from "lucide-react"
import { useTranslations } from "next-intl"
import UpgradeModal from "@/components/editor/UpgradeModal"
import SidebarTemplate from "./templates/SidebarTemplate"
import ElegantTemplate from "./templates/ElegantTemplate"
import SplitTemplate from "./templates/SplitTemplate"
import dynamic from "next/dynamic"
const RichTextEditor = dynamic(() => import("./RichTextEditor"), { ssr: false })
import type { CandidateData, CoverLetterContent } from "./templates/types"

type TemplateId = "classic" | "sidebar" | "elegant" | "split"

interface Props {
  id: string
  title: string
  colorScheme: string
  fontFamily: string
  templateId: string
  content: CoverLetterContent
  initialCandidate: CandidateData
  isPro?: boolean
  language?: string
}

const TEMPLATES: { id: TemplateId; labelKey: "template_sidebar" | "template_elegant" | "template_split" | "template_label" }[] = [
  { id: "sidebar", labelKey: "template_sidebar" },
  { id: "elegant", labelKey: "template_elegant" },
  { id: "split", labelKey: "template_split" },
]

// SVG thumbnails schematically representing each template
function SidebarThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <rect x="0" y="0" width="22" height="110" fill={color} opacity="0.85" />
      <circle cx="11" cy="18" r="6" fill="white" opacity="0.4" />
      <rect x="3" y="28" width="16" height="2" rx="1" fill="white" opacity="0.5" />
      <rect x="5" y="32" width="12" height="1.5" rx="0.75" fill="white" opacity="0.3" />
      <rect x="3" y="38" width="10" height="1.5" rx="0.75" fill="white" opacity="0.3" />
      <rect x="3" y="42" width="14" height="1.5" rx="0.75" fill="white" opacity="0.3" />
      <rect x="28" y="12" width="24" height="2" rx="1" fill={color} opacity="0.7" />
      <rect x="28" y="20" width="44" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="28" y="24" width="40" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="28" y="28" width="44" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="28" y="35" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="28" y="39" width="38" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="28" y="43" width="42" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="28" y="47" width="44" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="28" y="90" width="18" height="1.5" rx="0.75" fill={color} opacity="0.7" />
    </svg>
  )
}

function ElegantThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <rect x="10" y="10" width="60" height="3" rx="1.5" fill={color} opacity="0.25" />
      <rect x="20" y="16" width="40" height="2.5" rx="1.25" fill={color} opacity="0.7" />
      <rect x="28" y="21" width="24" height="1.5" rx="0.75" fill="#9ca3af" />
      <rect x="10" y="28" width="28" height="1" fill={color} opacity="0.5" />
      <rect x="37" y="27" width="3" height="3" rx="0" transform="rotate(45 38.5 28.5)" fill={color} opacity="0.5" />
      <rect x="42" y="28" width="28" height="1" fill={color} opacity="0.5" />
      <rect x="10" y="35" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="39" width="55" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="43" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="47" width="50" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="54" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="58" width="58" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="62" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="90" width="18" height="1" fill={color} opacity="0.7" />
    </svg>
  )
}

function SplitThumb({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 110" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="110" fill="#f9fafb" />
      <rect x="0" y="0" width="80" height="28" fill={color} opacity="0.85" />
      <circle cx="14" cy="14" r="7" fill="white" opacity="0.3" />
      <rect x="25" y="8" width="22" height="2.5" rx="1.25" fill="white" opacity="0.7" />
      <rect x="25" y="13" width="16" height="1.5" rx="0.75" fill="white" opacity="0.4" />
      <rect x="56" y="8" width="18" height="1.5" rx="0.75" fill="white" opacity="0.4" />
      <rect x="58" y="12" width="16" height="1.5" rx="0.75" fill="white" opacity="0.4" />
      <rect x="60" y="16" width="14" height="1.5" rx="0.75" fill="white" opacity="0.4" />
      <rect x="10" y="35" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="39" width="55" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="43" width="60" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="47" width="50" height="1.5" rx="0.75" fill="#d1d5db" />
      <rect x="10" y="54" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="58" width="56" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="62" width="60" height="1.5" rx="0.75" fill="#e5e7eb" />
      <rect x="10" y="90" width="18" height="1" fill={color} opacity="0.7" />
    </svg>
  )
}

function TemplateThumbnail({ id, color }: { id: TemplateId; color: string }) {
  if (id === "sidebar") return <SidebarThumb color={color} />
  if (id === "elegant") return <ElegantThumb color={color} />
  if (id === "split") return <SplitThumb color={color} />
  return <ElegantThumb color={color} />
}

export default function CoverLetterEditor({
  id,
  title: initialTitle,
  colorScheme,
  templateId: initialTemplateId,
  content: initialContent,
  initialCandidate,
  isPro = false,
  language = "es",
}: Props) {
  const t = useTranslations("cover_letter_editor")
  const [title, setTitle] = useState(initialTitle)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [content, setContent] = useState<CoverLetterContent>(initialContent)
  const [candidate, setCandidate] = useState<CandidateData>(initialCandidate)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>(
    (initialTemplateId as TemplateId) === "classic" ? "elegant" : (initialTemplateId as TemplateId) ?? "elegant"
  )
  const [candidateOpen, setCandidateOpen] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      updateCandidate("photo", result)
    }
    reader.readAsDataURL(file)
  }

  // AI generation state
  const [generating, setGenerating] = useState(false)
  const [resumes, setResumes] = useState<{ id: string; title: string }[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState("")
  const [aiTone, setAiTone] = useState<"formal" | "balanced" | "creative">("balanced")

  // AI improve state
  const [improving, setImproving] = useState(false)
  const [improveVersions, setImproveVersions] = useState<string[]>([])

  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setResumes(data.map((r: { id: string; title: string }) => ({ id: r.id, title: r.title })))
      })
      .catch(() => {})
  }, [])

  async function handleGenerateAI() {
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: selectedResumeId || undefined,
          recipientName: content.recipientName,
          recipientTitle: content.recipientTitle,
          company: content.company,
          jobTitle: title,
          tone: aiTone,
          language,
        }),
      })
      if (res.status === 403) { toast.error(t("ai_pro_only")); return }
      if (res.status === 422) { toast.error(t("ai_off_topic")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateContent("body", data.body)
      toast.success(t("ai_success"))
    } catch {
      toast.error(t("ai_error"))
    } finally {
      setGenerating(false)
    }
  }

  async function handleImproveAI() {
    if (content.body.trim().length < 20) {
      toast.error(t("improve_short"))
      return
    }
    setImproving(true)
    setImproveVersions([])
    try {
      const res = await fetch("/api/ai/improve-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: content.body,
          company: content.company,
          jobTitle: title,
          recipientTitle: content.recipientTitle,
          language,
        }),
      })
      if (res.status === 403) { toast.error(t("ai_pro_only")); return }
      if (res.status === 422) { toast.error(t("improve_off_topic")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImproveVersions(data.versions)
    } catch {
      toast.error(t("improve_error"))
    } finally {
      setImproving(false)
    }
  }

  function applyImprovedVersion(v: string) {
    updateContent("body", v)
    setImproveVersions([])
    toast.success(t("improve_success"))
  }

  function updateContent(field: keyof CoverLetterContent, value: string) {
    setContent((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
    setSaved(false)
  }

  function updateCandidate(field: keyof CandidateData, value: string) {
    setCandidate((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
    setSaved(false)
  }

  function selectTemplate(tpl: TemplateId) {
    setActiveTemplate(tpl)
    setDirty(true)
    setSaved(false)
  }

  // Build full content payload including candidate fields
  function buildContentPayload(): Record<string, unknown> {
    return {
      ...content,
      candidateName: candidate.name,
      candidateJobTitle: candidate.jobTitle,
      candidateEmail: candidate.email,
      candidatePhone: candidate.phone,
      candidateAddress: candidate.address,
      candidatePhoto: candidate.photo,
      candidateLinkedin: candidate.linkedin,
      candidateWebsite: candidate.website,
    }
  }

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/cover-letters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: buildContentPayload(), templateId: activeTemplate }),
      })
      if (res.ok) {
        setSaved(true)
        setDirty(false)
        toast.success(t("save_success"))
      } else if (res.status === 404 || res.status === 403) {
        // Cover letter deleted or no longer accessible — stop silently
        setDirty(false)
      } else {
        toast.error(t("save_error"))
      }
    } catch {
      toast.error(t("save_error"))
    } finally {
      setSaving(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, title, content, candidate, activeTemplate])

  const toneOptions = [
    ["formal", t("ai_tone_formal")],
    ["balanced", t("ai_tone_balanced")],
    ["creative", t("ai_tone_creative")],
  ] as const

  const templateLabels: Record<TemplateId, string> = {
    classic: t("template_elegant"),
    sidebar: t("template_sidebar"),
    elegant: t("template_elegant"),
    split: t("template_split"),
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-12 bg-white border-b border-border flex items-center justify-between px-4 gap-4 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link href="/dashboard/cover-letters">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          {editingTitle ? (
            <Input
              autoFocus
              value={title}
              onChange={(e) => { setTitle(e.target.value); setDirty(true) }}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
              className="h-7 text-sm font-medium max-w-[200px]"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-sm font-medium truncate hover:text-primary transition-colors max-w-[200px]"
            >
              {title}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {saving ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> {t("saving")}</span>
            ) : saved ? (
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> {t("saved")}</span>
            ) : dirty ? t("unsaved") : null}
          </span>
          <Button variant="outline" size="sm" onClick={save} disabled={saving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> {t("save")}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> {t("print")}
          </Button>
        </div>
      </header>

      {/* Two panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: form */}
        <div className="w-80 shrink-0 border-r border-border overflow-y-auto p-5 space-y-4">

          {/* Template selector */}
          <div className="space-y-2">
            <p className="text-xs font-semibold">{t("template_label")}</p>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => selectTemplate(tpl.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-1.5 transition-all ${
                    activeTemplate === tpl.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="w-full aspect-[0.73] rounded overflow-hidden bg-gray-50">
                    <TemplateThumbnail id={tpl.id} color={colorScheme} />
                  </div>
                  <span className="text-[10px] text-center leading-tight text-muted-foreground font-medium">
                    {templateLabels[tpl.id]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Candidate data section */}
          <div className="space-y-2">
            <button
              type="button"
              className="flex items-center justify-between w-full"
              onClick={() => setCandidateOpen((v) => !v)}
            >
              <span className="text-xs font-semibold">{t("candidate_section")}</span>
              {candidateOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>

            {candidateOpen && (
              <div className="space-y-2.5 pt-1">
                {/* Photo upload */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{t("candidate_photo")}</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted/30 shrink-0 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      {candidate.photo ? (
                        <img src={candidate.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => photoInputRef.current?.click()}
                      >
                        {candidate.photo ? t("candidate_photo_change") : t("candidate_photo_add")}
                      </Button>
                      {candidate.photo && (
                        <button
                          type="button"
                          onClick={() => { updateCandidate("photo", ""); if (photoInputRef.current) photoInputRef.current.value = "" }}
                          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" /> {t("candidate_photo_remove")}
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                {(
                  [
                    ["name", "candidate_name", "text"],
                    ["jobTitle", "candidate_job_title", "text"],
                    ["email", "candidate_email", "email"],
                    ["phone", "candidate_phone", "tel"],
                    ["address", "candidate_address", "text"],
                    ["linkedin", "candidate_linkedin", "url"],
                    ["website", "candidate_website", "url"],
                  ] as [keyof CandidateData, keyof typeof t extends string ? string : string, string][]
                ).map(([field, labelKey, inputType]) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{t(labelKey as Parameters<typeof t>[0])}</Label>
                    <Input
                      type={inputType}
                      value={candidate[field]}
                      onChange={(e) => updateCandidate(field, e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <h2 className="font-semibold text-sm">{t("content_section")}</h2>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("recipient_label")}</Label>
            <Input
              placeholder={t("recipient_placeholder")}
              value={content.recipientName}
              onChange={(e) => updateContent("recipientName", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("recipient_title_label")}</Label>
            <Input
              placeholder={t("recipient_title_placeholder")}
              value={content.recipientTitle}
              onChange={(e) => updateContent("recipientTitle", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("company_label")}</Label>
            <Input
              placeholder={t("company_placeholder")}
              value={content.company}
              onChange={(e) => updateContent("company", e.target.value)}
            />
          </div>

          <Separator />

          {/* AI generation */}
          {!isPro ? (
            <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-5 flex flex-col items-center gap-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">{t("pro_upgrade_title")}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{t("pro_upgrade_desc")}</p>
              </div>
              <Button size="sm" className="gap-1.5 mt-1" onClick={() => setUpgradeOpen(true)}>
                <Sparkles className="h-3.5 w-3.5" /> {t("pro_upgrade_cta")}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 space-y-2.5">
              <p className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> {t("ai_title")}
                <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium">{t("ai_pro_badge")}</span>
              </p>

              {resumes.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{t("ai_resume_label")}</Label>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full text-xs rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  >
                    <option value="">{t("ai_resume_none")}</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t("ai_tone_label")}</Label>
                <div className="flex gap-1.5">
                  {toneOptions.map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAiTone(v)}
                      className={`flex-1 text-[10px] py-1 rounded border transition-colors ${
                        aiTone === v
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-muted-foreground border-input hover:border-indigo-400"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                size="sm"
                className="w-full gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleGenerateAI}
                disabled={generating}
              >
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {generating ? t("ai_generating") : t("ai_generate")}
              </Button>
            </div>
          )}

          <Separator />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t("body_label")}</Label>
              {isPro && (
                <button
                  type="button"
                  onClick={handleImproveAI}
                  disabled={improving}
                  className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
                >
                  {improving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {improving ? t("improve_loading") : t("improve_button")}
                </button>
              )}
            </div>
            <RichTextEditor
              value={content.body}
              onChange={(html) => { updateContent("body", html); setImproveVersions([]) }}
              placeholder={t("body_placeholder")}
            />

            {/* AI improve versions panel */}
            {improveVersions.length > 0 && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 space-y-2">
                <p className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> {t("improve_choose")}
                </p>
                {improveVersions.map((v, i) => (
                  <div key={i} className="rounded-md bg-white border border-indigo-100 p-2.5 space-y-1.5">
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{v}</p>
                    <button
                      type="button"
                      onClick={() => applyImprovedVersion(v)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {t("improve_use")}
                    </button>
                  </div>
                ))}
                <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 leading-relaxed">
                  ⚠ {t("improve_metrics_disclaimer")}
                </p>
                <button
                  type="button"
                  onClick={() => setImproveVersions([])}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("improve_cancel")}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("closing_label")}</Label>
            <Input
              placeholder={t("closing_placeholder")}
              value={content.closing}
              onChange={(e) => updateContent("closing", e.target.value)}
            />
          </div>
        </div>

        {/* Right: preview */}
        <div className="flex-1 overflow-auto bg-gray-100 flex justify-center py-8 print:py-0 print:bg-white">
          <div
            className="bg-white shadow-2xl print:shadow-none overflow-hidden print:min-h-[297mm]"
            style={{ width: "210mm" }}
          >
            {activeTemplate === "sidebar" && (
              <SidebarTemplate content={content} candidate={candidate} colorScheme={colorScheme} />
            )}
            {activeTemplate === "split" && (
              <SplitTemplate content={content} candidate={candidate} colorScheme={colorScheme} />
            )}
            {(activeTemplate === "elegant" || activeTemplate === "classic") && (
              <ElegantTemplate content={content} candidate={candidate} colorScheme={colorScheme} />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          header, .w-80 { display: none !important; }
          @page { size: A4; margin: 0; }
          body { margin: 0; }
        }
      `}</style>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  )
}
