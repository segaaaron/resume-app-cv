"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { compressImage } from "@/lib/compressImage"
import { ArrowLeft, Save, Loader2, Check, Sparkles, Lock, ChevronDown, ChevronUp, Camera, X, Download, FileText, FileDown } from "lucide-react"
import DownloadMenu from "@/components/shared/DownloadMenu"
import { useTranslations } from "next-intl"
import UpgradeModal from "@/components/editor/UpgradeModal"
import dynamic from "next/dynamic"
const RichTextEditor = dynamic(() => import("./RichTextEditor"), { ssr: false })
import { CoverLetterThumbnail } from "./thumbnails"
import type { CandidateData, CoverLetterContent, TemplateProps } from "./templates/types"

const TEMPLATE_COMPONENTS: Record<string, React.ComponentType<TemplateProps>> = {
  elegant:   dynamic(() => import("./templates/ElegantTemplate"),       { ssr: false }),
  classic:   dynamic(() => import("./templates/ElegantTemplate"),       { ssr: false }),
  sidebar:   dynamic(() => import("./templates/SidebarTemplate"),       { ssr: false }),
  split:     dynamic(() => import("./templates/SplitTemplate"),         { ssr: false }),
  executive: dynamic(() => import("./templates/ExecutiveBoldTemplate"), { ssr: false }),
  material:  dynamic(() => import("./templates/MaterialCardTemplate"),  { ssr: false }),
  gradient:  dynamic(() => import("./templates/GradientHorizonTemplate"), { ssr: false }),
  minimal:   dynamic(() => import("./templates/MinimalLineTemplate"),   { ssr: false }),
  twotone:   dynamic(() => import("./templates/TwoToneTemplate"),       { ssr: false }),
  timeline:  dynamic(() => import("./templates/TimelineTemplate"),      { ssr: false }),
  monogram:  dynamic(() => import("./templates/MonogramTemplate"),      { ssr: false }),
  architect: dynamic(() => import("./templates/ArchitectTemplate"),     { ssr: false }),
  diagonal:  dynamic(() => import("./templates/DiagonalTemplate"),      { ssr: false }),
  newspaper: dynamic(() => import("./templates/NewspaperTemplate"),     { ssr: false }),
}

type TemplateId = "classic" | "sidebar" | "elegant" | "split" | "executive" | "material" | "gradient" | "minimal" | "twotone" | "timeline" | "monogram" | "architect" | "diagonal" | "newspaper"

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
  isNew?: boolean
}

const TEMPLATES: { id: TemplateId; labelKey: string; pro?: boolean }[] = [
  { id: "elegant", labelKey: "template_elegant" },
  { id: "sidebar", labelKey: "template_sidebar", pro: true },
  { id: "split", labelKey: "template_split", pro: true },
  { id: "executive", labelKey: "template_executive", pro: true },
  { id: "material", labelKey: "template_material", pro: true },
  { id: "gradient", labelKey: "template_gradient", pro: true },
  { id: "twotone", labelKey: "template_twotone", pro: true },
  { id: "timeline", labelKey: "template_timeline", pro: true },
  { id: "minimal", labelKey: "template_minimal", pro: true },
  { id: "monogram", labelKey: "template_monogram", pro: true },
  { id: "architect", labelKey: "template_architect", pro: true },
  { id: "diagonal", labelKey: "template_diagonal", pro: true },
  { id: "newspaper", labelKey: "template_newspaper", pro: true },
]


export default function CoverLetterEditor({
  id,
  title: initialTitle,
  colorScheme,
  templateId: initialTemplateId,
  content: initialContent,
  initialCandidate,
  isPro = false,
  language = "es",
  isNew = false,
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
  const [downloadingWord, setDownloadingWord] = useState(false)
  const [photoPosition, setPhotoPosition] = useState<number>(
    typeof initialCandidate.photoPosition === "number" ? initialCandidate.photoPosition : 50
  )
  const photoInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      updateCandidate("photo", compressed)
    } catch {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result as string
        updateCandidate("photo", result)
      }
      reader.readAsDataURL(file)
    }
  }

  // AI generation state
  const [generating, setGenerating] = useState(false)
  const [resumes, setResumes] = useState<{ id: string; title: string }[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState("")
  const [aiTone, setAiTone] = useState<"formal" | "balanced" | "creative">("balanced")
  const [aiUserPrompt, setAiUserPrompt] = useState("")


  useEffect(() => {
    apiFetch("/api/resumes")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setResumes(data.map((r: { id: string; title: string }) => ({ id: r.id, title: r.title })))
      })
      .catch(() => {})
  }, [])

  const dirtyRef = useRef(dirty)
  useEffect(() => { dirtyRef.current = dirty }, [dirty])

  async function handleGenerateAI() {
    setGenerating(true)
    try {
      const res = await apiFetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: selectedResumeId || undefined,
          recipientName: content.recipientName,
          recipientTitle: content.recipientTitle,
          company: content.company,
          tone: aiTone,
          language,
          userPrompt: aiUserPrompt.trim() || undefined,
        }),
      })
      if (res.status === 429) { toast.error(t("ai_rate_limit")); return }
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
      candidatePhotoPosition: photoPosition,
      candidateLinkedin: candidate.linkedin,
      candidateWebsite: candidate.website,
    }
  }

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const res = await apiFetch(`/api/cover-letters/${id}`, {
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
  }, [id, title, content, candidate, activeTemplate, photoPosition])

  const templateRef = useRef<HTMLDivElement>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const downloadPDF = useCallback(async () => {
    setDownloadingPdf(true)
    try {
      if (dirty) await save()
      const res = await apiFetch(`/api/cover-letters/${id}/pdf?locale=${language}`)
      if (!res.ok) { toast.error(t("pdf_error")); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, "_") || "carta"}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t("pdf_error"))
    } finally {
      setDownloadingPdf(false)
    }
  }, [id, title, language, dirty, save])

  const downloadWord = useCallback(async () => {
    setDownloadingWord(true)
    try {
      const res = await apiFetch(`/api/export/cover-letter-docx?id=${id}`)
      if (!res.ok) { toast.error(t("word_error")); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, "_") || "carta"}.docx`
      a.click()
    } catch {
      toast.error(t("word_download_error"))
    } finally {
      setDownloadingWord(false)
    }
  }, [id, title])

  const toneOptions = [
    ["formal", t("ai_tone_formal")],
    ["balanced", t("ai_tone_balanced")],
    ["creative", t("ai_tone_creative")],
  ] as const

  const templateLabels: Record<TemplateId, string> = {
    classic: t("template_elegant"),
    elegant: t("template_elegant"),
    sidebar: t("template_sidebar"),
    split: t("template_split"),
    executive: t("template_executive"),
    material: t("template_material"),
    gradient: t("template_gradient"),
    twotone: t("template_twotone"),
    timeline: t("template_timeline"),
    minimal: t("template_minimal"),
    monogram: t("template_monogram"),
    architect: t("template_architect"),
    diagonal: t("template_diagonal"),
    newspaper: t("template_newspaper"),
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
          <DownloadMenu
            filename={`${(title.replace(/[^a-z0-9]/gi, "_") || "carta")}`}
            triggerLabel={t("download")}
            generatingPdfLabel={t("download_generating_pdf")}
            generatingWordLabel={t("download_generating_word")}
            successLabel={(f) => t("download_success", { filename: f })}
            phaseLabels={{
              preparing: t("download_preparing"),
              applyingStyles: t("download_applying_styles"),
              almostDone: t("download_almost_done"),
            }}
            options={[
              {
                format: "pdf",
                label: "PDF",
                sublabel: t("export_with_design"),
                isLoading: downloadingPdf,
                onDownload: downloadPDF,
              },
              {
                format: "docx",
                label: t("word_label"),
                sublabel: t("export_plain"),
                isLoading: downloadingWord,
                onDownload: downloadWord,
              },
            ]}
          />

        </div>
      </header>

      {/* Two panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: form */}
        <div className="w-80 shrink-0 border-r border-border overflow-y-auto p-5 space-y-4">

          {/* Template selector */}
          <div className="space-y-2">
            <p className="text-xs font-semibold">{t("template_label")}</p>
            <div className="grid grid-cols-4 gap-1.5">
              {TEMPLATES.map((tpl) => {
                const locked = tpl.pro && !isPro
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => locked ? setUpgradeOpen(true) : selectTemplate(tpl.id)}
                    className={`relative flex flex-col items-center gap-1 rounded-lg border-2 p-1 transition-all ${
                      activeTemplate === tpl.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="w-full aspect-[0.73] rounded overflow-hidden bg-gray-50 relative">
                      <CoverLetterThumbnail id={tpl.id} color={colorScheme} />
                      {locked && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Lock className="h-3.5 w-3.5 text-primary" />
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-center leading-tight text-muted-foreground font-medium truncate w-full">
                      {templateLabels[tpl.id]}
                    </span>
                  </button>
                )
              })}
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
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground">{t("candidate_photo")}</Label>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted/30 shrink-0 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      {candidate.photo ? (
                        <img
                          src={candidate.photo}
                          alt=""
                          className="w-full h-full object-cover"
                          style={{ objectPosition: `center ${photoPosition}%` }}
                        />
                      ) : candidate.name ? (
                        <span className="text-lg font-bold text-muted-foreground select-none">
                          {candidate.name.trim().split(/\s+/).slice(0, 2).map((w: string) => w[0].toUpperCase()).join("")}
                        </span>
                      ) : (
                        <Camera className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        {candidate.photo ? t("candidate_photo_change") : t("candidate_photo_add")}
                      </button>
                      {candidate.photo && (
                        <button
                          type="button"
                          onClick={() => { updateCandidate("photo", ""); if (photoInputRef.current) photoInputRef.current.value = "" }}
                          className="flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" /> {t("candidate_photo_remove")}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Position slider — only when photo is loaded */}
                  {candidate.photo && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {t("candidate_photo_position")}
                        </Label>
                        <span className="text-[10px] font-semibold tabular-nums bg-muted px-2 py-0.5 rounded-md">
                          {photoPosition}%
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={photoPosition}
                        onValueChange={(v) => {
                          const val = Array.isArray(v) ? v[0] : v
                          setPhotoPosition(val)
                          setDirty(true)
                          setSaved(false)
                        }}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground/60">
                        <span>{t("candidate_photo_top")}</span>
                        <span>{t("candidate_photo_bottom")}</span>
                      </div>
                    </div>
                  )}

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

          <div className="space-y-1.5">
            <Label className="text-xs">{t("subject_label")}</Label>
            <Input
              placeholder={t("subject_placeholder")}
              value={content.subject ?? ""}
              onChange={(e) => updateContent("subject", e.target.value)}
            />
          </div>

          <Separator />

          {/* Body + AI unified */}
          <div className="space-y-3">
            <Label className="text-xs">{t("body_label")}</Label>

            {!isPro ? (
              <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-4 flex flex-col items-center gap-2 text-center">
                <Lock className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold text-foreground">{t("pro_upgrade_title")}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{t("pro_upgrade_desc")}</p>
                <Button size="sm" className="gap-1.5 mt-1" onClick={() => setUpgradeOpen(true)}>
                  <Sparkles className="h-3.5 w-3.5" /> {t("pro_upgrade_cta")}
                </Button>
              </div>
            ) : !content.body || content.body.replace(/<[^>]+>/g, "").trim().length === 0 ? (
              /* ── State A: no body → prompt + generate ── */
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-3">
                {/* AI panel header */}
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{t("ai_generate")}</p>
                </div>

                {resumes.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{t("ai_resume_label")}</Label>
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full text-xs rounded-md border border-input bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                        className={`flex-1 text-[10px] py-1.5 rounded-md border font-medium transition-all ${
                          aiTone === v
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-muted-foreground border-input hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">{t("ai_prompt_label")}</Label>
                  <div className="relative">
                    <textarea
                      value={aiUserPrompt}
                      onChange={(e) => setAiUserPrompt(e.target.value)}
                      placeholder={t("ai_prompt_placeholder")}
                      rows={4}
                      maxLength={500}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none pb-6"
                    />
                    <span className={`absolute bottom-2 right-2.5 text-[10px] tabular-nums ${aiUserPrompt.length >= 450 ? "text-amber-500" : "text-muted-foreground/50"}`}>
                      {aiUserPrompt.length}/500
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={handleGenerateAI}
                  disabled={generating}
                >
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {generating ? t("ai_generating") : t("ai_generate")}
                </Button>
              </div>
            ) : (
              /* ── State B: body exists → rich editor + start over ── */
              <div className="space-y-2">
                <RichTextEditor
                  value={content.body}
                  onChange={(html) => updateContent("body", html)}
                  placeholder={t("body_placeholder")}
                />
                <button
                  type="button"
                  onClick={() => { updateContent("body", ""); setAiUserPrompt("") }}
                  disabled={generating}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                >
                  <X className="h-3 w-3" />
                  {t("ai_regenerate")}
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
        <div className="flex-1 overflow-auto bg-[#d0d0d0] flex justify-center items-start py-8 px-4 print:py-0 print:bg-white print:px-0">
          <div className="relative inline-block">
          <div
            ref={templateRef}
            className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.18)] print:shadow-none overflow-hidden print:min-h-[297mm] shrink-0"
            style={{ width: "210mm", minHeight: "297mm" }}
          >
            {(() => {
              const candidateWithPosition = { ...candidate, photoPosition }
              const ActiveTemplate = TEMPLATE_COMPONENTS[activeTemplate] ?? TEMPLATE_COMPONENTS.elegant
              return <ActiveTemplate content={content} candidate={candidateWithPosition} colorScheme={colorScheme} />
            })()}
            {/* Page break indicator at 297mm */}
            <div className="print:hidden" style={{
              position: "absolute", top: "297mm", left: 0, right: 0,
              height: 0, pointerEvents: "none", zIndex: 10,
            }}>
              <div style={{ position: "relative", width: "100%" }}>
                <div style={{
                  position: "absolute", left: 0, right: 0, top: 0,
                  borderTop: "1.5px dashed rgba(220,38,38,0.45)",
                }} />
                <span style={{
                  position: "absolute", right: 6, top: 3,
                  fontSize: 9, fontWeight: 600, color: "rgba(220,38,38,0.6)",
                  letterSpacing: "0.05em", whiteSpace: "nowrap",
                  fontFamily: "var(--font-mono, monospace)",
                }}>
                  — pág. 1
                </span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          header, .w-80 { display: none !important; }
          @page { size: A4; margin: 0; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          svg { overflow: visible !important; }
        }
      `}</style>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  )
}
