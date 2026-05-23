"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { compressImage } from "@/lib/compressImage"
import { ArrowLeft, Save, Loader2, Check, AlertCircle, Sparkles, Lock, ChevronDown, ChevronUp, ChevronRight, Camera, X, FileText, Eye, User, Mail, Phone, MapPin, Link2, Globe, Building2, Briefcase, Type, LayoutGrid, Pencil } from "lucide-react"
import DownloadMenu from "@/components/shared/DownloadMenu"
import { useTranslations, useLocale } from "next-intl"
import UpgradeModal from "@/components/editor/UpgradeModal"
import UnsavedChangesModal from "@/components/editor/UnsavedChangesModal"
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
  const locale = useLocale()
  const router = useRouter()
  const [showExitModal, setShowExitModal] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [content, setContent] = useState<CoverLetterContent>(() => ({
    ...initialContent,
    closing: initialContent.closing || (language === "es" ? "Atentamente" : "Sincerely"),
  }))
  const [candidate, setCandidate] = useState<CandidateData>(initialCandidate)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>(
    (initialTemplateId as TemplateId) === "classic" ? "elegant" : (initialTemplateId as TemplateId) ?? "elegant"
  )
  const [openSection, setOpenSection] = useState<"candidate" | "content" | "body" | null>(null)
  const toggleSection = (id: "candidate" | "content" | "body") => setOpenSection(prev => prev === id ? null : id)
  const [sidebarTab, setSidebarTab] = useState<"content" | "templates" | "ai">("content")
  const [mobileView, setMobileView] = useState<"form" | "preview">("form")
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
  const [aiGenerated, setAiGenerated] = useState(false)
  const bodyHasContent = (content.body?.replace(/<[^>]+>/g, "").trim() ?? "").length > 0


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

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  function handleBack() {
    if (dirty) { setShowExitModal(true); return }
    router.push("/dashboard/cover-letters")
  }

  async function handleModalSave() {
    await save()
    router.push("/dashboard/cover-letters")
  }

  function handleModalDiscard() {
    router.push("/dashboard/cover-letters")
  }

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
          language: locale,
          userPrompt: aiUserPrompt.trim() || undefined,
        }),
      })
      if (res.status === 429) { toast.error(t("ai_rate_limit")); return }
      if (res.status === 403) { toast.error(t("ai_pro_only")); return }
      if (res.status === 422) { toast.error(t("ai_off_topic")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateContent("body", data.body)
      setAiGenerated(true)
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
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    const A4_PX = 794
    const el = previewContainerRef.current
    if (!el) return
    const update = () => {
      const available = el.clientWidth - 32 // 16px padding each side
      setPreviewScale(Math.min(1, available / A4_PX))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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

  // ── Premium Navy Studio palette tokens ──
  const NAVY_DEEP = "#0B1B3D", NAVY_MID = "#1a2e4a", CYAN = "#00D4FF"
  const BORDER_LIGHT = "#C8DCF0", SURFACE = "#F4F8FD", MUTED_LABEL = "#7A9BB5", ICON_COLOR = "#5B8FBD"
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: MUTED_LABEL, letterSpacing: "0.01em", textTransform: "capitalize", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }
  const inputStyle: React.CSSProperties = { height: 36, paddingLeft: 12, paddingRight: 12, background: "#ffffff", border: `1px solid ${BORDER_LIGHT}`, borderRadius: 6, fontSize: 13, color: NAVY_MID, width: "100%", outline: "none" }
  const darkLabelStyle: React.CSSProperties = { ...labelStyle, color: "rgba(255,255,255,0.6)" }
  // Card-style section (matches resume editor sidebar)
  const cardStyle: React.CSSProperties = { background: "linear-gradient(135deg, rgba(236,254,255,0.7) 0%, rgba(239,246,255,0.5) 100%)", border: "1px solid #cffafe", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }
  const cardHeaderStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", width: "100%", cursor: "pointer", background: "transparent" }
  const cardIconStyle: React.CSSProperties = { width: 44, height: 44, borderRadius: 10, background: "#F1F5F9", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }

  const IconStyle = { color: ICON_COLOR } as const
  const candidateFieldIcons: Partial<Record<keyof CandidateData, React.ReactNode>> = {
    name: <User className="h-3 w-3" style={IconStyle} />,
    jobTitle: <Briefcase className="h-3 w-3" style={IconStyle} />,
    email: <Mail className="h-3 w-3" style={IconStyle} />,
    phone: <Phone className="h-3 w-3" style={IconStyle} />,
    address: <MapPin className="h-3 w-3" style={IconStyle} />,
    linkedin: <Link2 className="h-3 w-3" style={IconStyle} />,
    website: <Globe className="h-3 w-3" style={IconStyle} />,
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: SURFACE }}>
      {/* Top bar — matches resume EditorTopBar */}
      <header
        className="h-[58px] flex items-center justify-between shrink-0 sticky top-0 z-10 relative px-3 sm:px-5"
        style={{
          background: "linear-gradient(135deg, #f0f8ff 0%, #e8f4fb 40%, #f5faff 70%, #edf6fb 100%)",
          borderBottom: "1px solid rgba(0,212,255,0.2)",
          boxShadow: "0 1px 0 rgba(0,212,255,0.12), 0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        {/* Cyan glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent 0%, #00D4FF 30%, #00E5FF 50%, #00D4FF 70%, transparent 100%)", opacity: 0.35 }} />
        {/* Ambient right glow */}
        <div className="absolute top-0 right-0 w-64 h-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 100% 50%, rgba(0,212,255,0.12) 0%, rgba(0,168,204,0.05) 50%, transparent 70%)" }} />

        {/* Left: back + icon + title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-3 relative z-10">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,212,255,0.2)", color: "#1a2e4a" }}
            onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = "rgba(0,212,255,0.12)"; el.style.borderColor = "rgba(0,212,255,0.4)"; el.style.color = "#00A8CC" }}
            onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = "rgba(255,255,255,0.7)"; el.style.borderColor = "rgba(0,212,255,0.2)"; el.style.color = "#1a2e4a" }}
          >
            <ArrowLeft size={16} />
          </button>

          {/* Icon badge */}
          <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(0,168,204,0.1) 100%)", border: "1px solid rgba(0,212,255,0.25)" }}>
            <FileText size={13} style={{ color: "#00D4FF" }} />
          </div>

          {/* Title */}
          {editingTitle ? (
            <input autoFocus value={title}
              onChange={(e) => { setTitle(e.target.value); setDirty(true) }}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
              className="max-w-[120px] sm:max-w-[240px] border-0 border-b border-b-[#00D4FF] rounded-none bg-transparent text-[14px] font-semibold outline-none py-1 px-0 h-auto shadow-none focus-visible:ring-0"
              style={{ color: "#1a2e4a", caretColor: "#00D4FF" }} />
          ) : (
            <button onClick={() => setEditingTitle(true)}
              className="group flex items-center gap-1.5 truncate max-w-[110px] sm:max-w-[240px] cursor-pointer bg-transparent border-none">
              <span className="truncate text-[14px] font-semibold tracking-[-0.01em]" style={{ color: "#1a2e4a" }}>{title}</span>
              <Pencil size={12} className="shrink-0 transition-all duration-200 opacity-0 group-hover:opacity-100" style={{ color: "#00D4FF" }} />
            </button>
          )}
        </div>

        {/* Right: save status + save + download */}
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          {/* Save button — always visible, shows state */}
          <button onClick={save} disabled={saving}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-full transition-all duration-200 disabled:cursor-default"
            style={{
              fontSize: 11.5, fontWeight: 600,
              background: saving ? "rgba(148,163,184,0.1)" : dirty ? "rgba(245,158,11,0.1)" : saved ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.7)",
              border: saving ? "1px solid rgba(148,163,184,0.2)" : dirty ? "1px solid rgba(245,158,11,0.25)" : saved ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(0,212,255,0.2)",
              color: saving ? "#94A3B8" : dirty ? "#F59E0B" : saved ? "#10B981" : "#1a2e4a",
              boxShadow: (!saving && !dirty && !saved) ? "none" : "none",
            }}>
            {saving ? <Loader2 size={11} className="animate-spin" /> : dirty ? <AlertCircle size={11} /> : saved ? <Check size={11} /> : <Save size={11} />}
            <span>{saving ? t("saving") : dirty ? t("unsaved") : saved ? t("saved") : t("save")}</span>
          </button>

          {/* Save button (mobile icon only) */}
          <button onClick={save} disabled={saving}
            className="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #1a2e4a 0%, #0B1B3D 100%)", border: "1px solid rgba(0,212,255,0.3)", color: "#ffffff" }}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          </button>

          {/* Download menu (PDF + Word) */}
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
              { format: "pdf", label: "PDF", sublabel: t("export_with_design"), isLoading: downloadingPdf, onDownload: downloadPDF },
              { format: "docx", label: t("word_label"), sublabel: t("export_plain"), isLoading: downloadingWord, onDownload: downloadWord },
            ]}
          />
        </div>
      </header>

      {/* Two panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: sidebar with tab bar */}
        <div
          className={`${mobileView === "preview" ? "hidden" : "flex"} md:flex flex-col w-full md:w-[400px] shrink-0 overflow-hidden pb-14 md:pb-0 print:hidden`}
          style={{ background: "#F4F8FD", borderRight: "1px solid #E2E8F0", boxShadow: "2px 0 12px rgba(0,0,0,0.02)" }}
        >

          {/* ── Tab bar ── */}
          <div className="shrink-0 flex p-2 gap-1" style={{ borderBottom: "1px solid #E2E8F0", background: "#F4F8FD" }}>
            {([
              { key: "content",   icon: <FileText style={{ width: 12, height: 12 }} />,   label: t("tab_content"),   activeStyle: { background: `linear-gradient(135deg, ${NAVY_DEEP} 0%, ${NAVY_MID} 100%)`, color: "#ffffff", border: "none", boxShadow: "0 4px 12px rgba(11,27,61,0.2)" }, inactiveStyle: { background: "rgba(11,27,61,0.05)", color: MUTED_LABEL, border: `1px solid ${BORDER_LIGHT}` } },
              { key: "templates", icon: <LayoutGrid style={{ width: 12, height: 12 }} />,  label: t("tab_templates"), activeStyle: { background: "linear-gradient(135deg, #3B4F7A 0%, #2A3D6B 100%)", color: "#ffffff", border: "none", boxShadow: "0 4px 12px rgba(42,61,107,0.25)" }, inactiveStyle: { background: "rgba(11,27,61,0.05)", color: MUTED_LABEL, border: `1px solid ${BORDER_LIGHT}` } },
              { key: "ai",        icon: <Sparkles style={{ width: 12, height: 12 }} />,    label: t("tab_ai"),        activeStyle: { background: `linear-gradient(135deg, ${CYAN} 0%, #00A8CC 100%)`, color: NAVY_DEEP, border: "none", boxShadow: "0 4px 14px rgba(0,212,255,0.35)" }, inactiveStyle: { background: "rgba(0,212,255,0.08)", color: "#00A8CC", border: "1px solid rgba(0,212,255,0.25)" } },
            ] as const).map(({ key, icon, label, activeStyle, inactiveStyle }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSidebarTab(key)}
                className="flex-1 flex items-center justify-center gap-1 transition-all"
                style={{ height: 33, borderRadius: 7, fontSize: 10.5, fontWeight: 700, ...(sidebarTab === key ? activeStyle : inactiveStyle) }}
              >
                {icon}
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          {/* ── Tab content (scrollable) ── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "#E2E8F0 transparent", background: "#F4F8FD" }}>

          {/* ── Planillas tab ── */}
          {sidebarTab === "templates" && (
            <div className="space-y-2">
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED_LABEL, paddingBottom: 2 }}>
                {TEMPLATES.length} {t("tab_templates").toLowerCase()}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {TEMPLATES.map(({ id, labelKey, pro }) => {
                  const isSelected = activeTemplate === id
                  const locked = !!pro && !isPro
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => locked ? setUpgradeOpen(true) : selectTemplate(id)}
                      className="flex flex-col items-center gap-2 transition-all"
                      style={{
                        padding: "10px 8px 8px",
                        borderRadius: 12,
                        background: isSelected ? "rgba(0,212,255,0.07)" : "#ffffff",
                        border: isSelected ? `2px solid ${CYAN}` : `1.5px solid ${BORDER_LIGHT}`,
                        boxShadow: isSelected
                          ? "0 0 0 3px rgba(0,212,255,0.12), 0 4px 16px rgba(0,212,255,0.12)"
                          : "0 1px 4px rgba(0,0,0,0.06)",
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{ width: 72, height: 96, borderRadius: 6, overflow: "hidden", position: "relative", opacity: locked ? 0.55 : 1, flexShrink: 0 }}>
                        <CoverLetterThumbnail id={id} color={locked ? "#9ca3af" : colorScheme} />
                        {locked && (
                          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: "rgba(255,255,255,0.5)" }}>
                            <Lock style={{ width: 14, height: 14, color: "#7C3AED" }} />
                            <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.06em", color: "#7C3AED", background: "rgba(124,58,237,0.12)", padding: "2px 5px", borderRadius: 4 }}>PRO</span>
                          </div>
                        )}
                        {isSelected && (
                          <div style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: 999, background: CYAN, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Check style={{ width: 9, height: 9, color: NAVY_DEEP, strokeWidth: 3 }} />
                          </div>
                        )}
                      </div>
                      {/* Name */}
                      <span style={{ fontSize: 10, fontWeight: 600, color: isSelected ? "#00A8CC" : "#4A6785", textAlign: "center", lineHeight: 1.2, width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t(labelKey as Parameters<typeof t>[0])}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {sidebarTab === "content" && (() => {
            const candidateSubtitle = candidate.name || t("candidate_section")
            const contentSubtitle = content.company || content.recipientName || t("content_section")
            const bodyPlain = content.body?.replace(/<[^>]+>/g, "").trim() ?? ""
            const hasBody = bodyPlain.length > 0
            const bodySubtitle = hasBody ? (bodyPlain.slice(0, 34) + (bodyPlain.length > 34 ? "…" : "")) : t("body_label")

            const dot = <span style={{ width: 7, height: 7, borderRadius: 999, background: "#22c55e", display: "inline-block", flexShrink: 0 }} />

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                {/* ── Tus datos card ── */}
                <div style={cardStyle}>
                  <button type="button" onClick={() => toggleSection("candidate")} style={cardHeaderStyle}>
                    <div style={cardIconStyle}><User style={{ width: 18, height: 18, color: NAVY_DEEP }} /></div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: NAVY_DEEP, lineHeight: 1.2 }}>{t("candidate_section")}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                        {dot}
                        <span style={{ fontSize: 11, color: "#6B8FAB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{candidateSubtitle}</span>
                      </div>
                    </div>
                    {openSection === "candidate"
                      ? <ChevronDown style={{ width: 17, height: 17, color: "#9BB5CC", flexShrink: 0 }} />
                      : <ChevronRight style={{ width: 17, height: 17, color: "#9BB5CC", flexShrink: 0 }} />
                    }
                  </button>

                  {openSection === "candidate" && (
                    <div style={{ padding: "4px 14px 16px", borderTop: "1px solid #E2E8F0", background: "#ffffff", display: "flex", flexDirection: "column", gap: 12 }}>
                      {/* Photo — resume editor style */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 14 }}>
                        {/* Section label */}
                        <div className="dp-section-label" style={{ width: "100%" }}>
                          <Camera style={{ width: 13, height: 13, color: CYAN }} />
                          {t("candidate_photo")}
                        </div>
                        {/* Avatar ring */}
                        <div
                          className="dp-avatar"
                          onClick={() => photoInputRef.current?.click()}
                          style={{
                            width: 108, height: 108, borderRadius: "50%", overflow: "hidden",
                            cursor: "pointer", position: "relative",
                            background: "linear-gradient(135deg, #e8f0fe 0%, #dbeafe 100%)",
                            boxShadow: "0 0 0 3px #00D4FF, 0 0 0 5px #fff, 0 8px 24px rgba(0,212,255,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          {candidate.photo
                            ? <img src={candidate.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${photoPosition}%` }} />
                            : candidate.name
                              ? <span style={{ fontSize: 28, fontWeight: 700, color: NAVY_DEEP, userSelect: "none" }}>{candidate.name.trim().split(/\s+/).slice(0, 2).map((w: string) => w[0].toUpperCase()).join("")}</span>
                              : <Camera style={{ width: 28, height: 28, color: "#7AAAD4" }} />
                          }
                          <div className="dp-avatar-overlay">
                            <Camera style={{ width: 24, height: 24, color: "#fff" }} />
                          </div>
                        </div>
                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                          <button type="button" className="dp-btn-primary" onClick={() => photoInputRef.current?.click()}>
                            <Camera style={{ width: 14, height: 14 }} />
                            {candidate.photo ? t("candidate_photo_change") : t("candidate_photo_add")}
                          </button>
                          {candidate.photo && (
                            <button type="button" className="dp-btn-danger" onClick={() => { updateCandidate("photo", ""); if (photoInputRef.current) photoInputRef.current.value = "" }}>
                              <X style={{ width: 14, height: 14 }} /> {t("candidate_photo_remove")}
                            </button>
                          )}
                        </div>
                        {/* Position slider */}
                        {candidate.photo && (
                          <div style={{ width: "100%", marginTop: 4 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <span style={{ fontSize: 11, color: "#7AAAD4", fontWeight: 500 }}>
                                {t("candidate_photo_top")} ↕ {t("candidate_photo_bottom")}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 800, color: CYAN, background: "rgba(0,212,255,0.1)", padding: "2px 8px", borderRadius: 100, border: "1px solid rgba(0,212,255,0.25)" }}>
                                {photoPosition}%
                              </span>
                            </div>
                            <input
                              type="range"
                              className="dp-slider"
                              style={{ ["--val" as string]: `${photoPosition}%` }}
                              min={0} max={100} step={5}
                              value={photoPosition}
                              onChange={(e) => { setPhotoPosition(Number(e.target.value)); setDirty(true); setSaved(false) }}
                            />
                          </div>
                        )}
                        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                      </div>
                      {/* Fields */}
                      {([
                        ["name", "candidate_name", "text"],
                        ["jobTitle", "candidate_job_title", "text"],
                        ["email", "candidate_email", "email"],
                        ["phone", "candidate_phone", "tel"],
                        ["address", "candidate_address", "text"],
                        ["linkedin", "candidate_linkedin", "url"],
                        ["website", "candidate_website", "url"],
                      ] as [keyof CandidateData, string, string][]).map(([field, lk, inputType]) => (
                        <div key={field}>
                          <div style={labelStyle}>{candidateFieldIcons[field]}{t(lk as Parameters<typeof t>[0])}</div>
                          <input type={inputType} value={candidate[field]} onChange={(e) => updateCandidate(field, e.target.value)} style={inputStyle} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Contenido card ── */}
                <div style={cardStyle}>
                  <button type="button" onClick={() => toggleSection("content")} style={cardHeaderStyle}>
                    <div style={cardIconStyle}><FileText style={{ width: 18, height: 18, color: NAVY_DEEP }} /></div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: NAVY_DEEP, lineHeight: 1.2 }}>{t("content_section")}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                        {dot}
                        <span style={{ fontSize: 11, color: "#6B8FAB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contentSubtitle}</span>
                      </div>
                    </div>
                    {openSection === "content"
                      ? <ChevronDown style={{ width: 17, height: 17, color: "#9BB5CC", flexShrink: 0 }} />
                      : <ChevronRight style={{ width: 17, height: 17, color: "#9BB5CC", flexShrink: 0 }} />
                    }
                  </button>

                  {openSection === "content" && (
                    <div style={{ padding: "4px 14px 16px", borderTop: "1px solid #E2E8F0", background: "#ffffff", display: "flex", flexDirection: "column", gap: 12, paddingTop: 12 }}>
                      <div>
                        <div style={labelStyle}><User className="h-3 w-3" style={IconStyle} />{t("recipient_label")}</div>
                        <input placeholder={t("recipient_placeholder")} value={content.recipientName} onChange={(e) => updateContent("recipientName", e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <div style={labelStyle}><Briefcase className="h-3 w-3" style={IconStyle} />{t("recipient_title_label")}</div>
                        <input placeholder={t("recipient_title_placeholder")} value={content.recipientTitle} onChange={(e) => updateContent("recipientTitle", e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <div style={labelStyle}><Building2 className="h-3 w-3" style={IconStyle} />{t("company_label")}</div>
                        <input placeholder={t("company_placeholder")} value={content.company} onChange={(e) => updateContent("company", e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <div style={labelStyle}><Type className="h-3 w-3" style={IconStyle} />{t("subject_label")}</div>
                        <input placeholder={t("subject_placeholder")} value={content.subject ?? ""} onChange={(e) => updateContent("subject", e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <div style={labelStyle}><Type className="h-3 w-3" style={IconStyle} />{t("closing_label")}</div>
                        <input placeholder={t("closing_placeholder")} value={content.closing} onChange={(e) => updateContent("closing", e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Cuerpo card (conditional) ── */}
                {hasBody && (
                  <div style={cardStyle}>
                    <button type="button" onClick={() => toggleSection("body")} style={cardHeaderStyle}>
                      <div style={cardIconStyle}><FileText style={{ width: 18, height: 18, color: NAVY_DEEP }} /></div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: NAVY_DEEP, lineHeight: 1.2 }}>{t("body_label")}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                          {dot}
                          <span style={{ fontSize: 11, color: "#6B8FAB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bodySubtitle}</span>
                        </div>
                      </div>
                      {openSection === "body"
                        ? <ChevronDown style={{ width: 17, height: 17, color: "#9BB5CC", flexShrink: 0 }} />
                        : <ChevronRight style={{ width: 17, height: 17, color: "#9BB5CC", flexShrink: 0 }} />
                      }
                    </button>

                    {openSection === "body" && (
                      <div style={{ padding: "12px 14px 14px", borderTop: "1px solid #E2E8F0", background: "#ffffff", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ background: "#ffffff", border: `1px solid ${BORDER_LIGHT}`, borderRadius: 10, padding: 4 }}>
                          <RichTextEditor value={content.body} onChange={(html) => updateContent("body", html)} placeholder={t("body_placeholder")} />
                        </div>
                        <button type="button" onClick={() => { updateContent("body", ""); setAiUserPrompt(""); setAiGenerated(false); setSidebarTab("ai") }} disabled={generating}
                          style={{ fontSize: 11, color: MUTED_LABEL, display: "flex", alignItems: "center", gap: 5, opacity: generating ? 0.4 : 1 }}>
                          <X style={{ width: 11, height: 11 }} />{t("ai_regenerate")}
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )
          })()}

          {/* ── AI Tab ── */}
          {sidebarTab === "ai" && (
            <div className="space-y-3">
              {!isPro ? (
                <div className="flex flex-col items-center gap-3 text-center" style={{ background: `linear-gradient(135deg, ${NAVY_DEEP} 0%, ${NAVY_MID} 100%)`, border: "1px solid rgba(0,212,255,0.2)", borderRadius: 16, padding: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Lock className="h-5 w-5" style={{ color: CYAN }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", marginBottom: 6 }}>{t("pro_upgrade_title")}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{t("pro_upgrade_desc")}</p>
                  </div>
                  <button onClick={() => setUpgradeOpen(true)} className="inline-flex items-center gap-1.5"
                    style={{ background: `linear-gradient(135deg, ${CYAN} 0%, #00A8CC 100%)`, color: NAVY_DEEP, padding: "10px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, boxShadow: "0 4px 14px rgba(0,212,255,0.35)" }}>
                    <Sparkles className="h-3.5 w-3.5" /> {t("pro_upgrade_cta")}
                  </button>
                </div>
              ) : (
                <div className="space-y-4" style={{ background: `linear-gradient(135deg, ${NAVY_DEEP} 0%, ${NAVY_MID} 100%)`, border: "1px solid rgba(0,212,255,0.2)", borderRadius: 16, padding: 16 }}>
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Sparkles className="h-4 w-4" style={{ color: CYAN }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", lineHeight: 1 }}>{t("ai_generate")}</p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{t("ai_subtitle")}</p>
                    </div>
                  </div>

                  {/* Body already has content — show banner and disable form */}
                  {bodyHasContent && (
                    <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 10, padding: "14px 14px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <Check style={{ width: 16, height: 16, color: "#10B981", flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff" }}>{t("body_complete_title")}</span>
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: 10 }}>{t("body_complete_desc")}</p>
                      <button
                        type="button"
                        onClick={() => { updateContent("body", ""); setAiUserPrompt(""); setAiGenerated(false) }}
                        className="w-full inline-flex items-center justify-center gap-1.5 transition-all"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                        <X style={{ width: 12, height: 12 }} />
                        {t("body_complete_clear")}
                      </button>
                    </div>
                  )}

                  {/* Form — disabled when body has content */}
                  <div style={{ opacity: bodyHasContent ? 0.4 : 1, pointerEvents: bodyHasContent ? "none" : undefined, transition: "opacity 0.2s" }}>
                    {/* Resume picker */}
                    {resumes.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={darkLabelStyle}>{t("ai_resume_label")}</div>
                        <select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)}
                          style={{ width: "100%", height: 36, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#ffffff", fontSize: 12, padding: "0 10px", outline: "none" }}>
                          <option value="" style={{ color: NAVY_DEEP }}>{t("ai_resume_none")}</option>
                          {resumes.map((r) => <option key={r.id} value={r.id} style={{ color: NAVY_DEEP }}>{r.title}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Tone */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={darkLabelStyle}>{t("ai_tone_label")}</div>
                      <div className="flex gap-1.5">
                        {toneOptions.map(([v, l]) => {
                          const sel = aiTone === v
                          return (
                            <button key={v} type="button" onClick={() => setAiTone(v)} className="flex-1 transition-all"
                              style={{ fontSize: 10, fontWeight: 600, padding: "8px 4px", borderRadius: 7,
                                background: sel ? `linear-gradient(135deg, ${CYAN} 0%, #00A8CC 100%)` : "rgba(255,255,255,0.06)",
                                color: sel ? NAVY_DEEP : "rgba(255,255,255,0.55)",
                                border: sel ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
                                boxShadow: sel ? "0 4px 12px rgba(0,212,255,0.25)" : "none" }}>
                              {l}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Prompt */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={darkLabelStyle}>{t("ai_prompt_label")}</div>
                      <div className="relative">
                        <textarea value={aiUserPrompt} onChange={(e) => setAiUserPrompt(e.target.value)}
                          placeholder={t("ai_prompt_placeholder")} rows={4} maxLength={500}
                          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 12px 24px", fontSize: 12, color: "#ffffff", outline: "none", resize: "none" }}
                          onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.3)" }}
                          onBlur={(e) => { e.currentTarget.style.boxShadow = "none" }} />
                        <span className="absolute tabular-nums" style={{ bottom: 6, right: 10, fontSize: 10, color: aiUserPrompt.length >= 450 ? "#fbbf24" : "rgba(255,255,255,0.4)" }}>
                          {aiUserPrompt.length}/500
                        </span>
                      </div>
                    </div>

                    {/* Success state after generation */}
                    {aiGenerated && (
                      <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Check style={{ width: 14, height: 14, color: "#10B981" }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>{t("ai_generated_title")}</p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4, lineHeight: 1.5 }}>{t("ai_generated_desc")}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { updateContent("body", ""); setAiUserPrompt(""); setAiGenerated(false) }}
                          className="w-full inline-flex items-center justify-center gap-1.5 transition-all"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                          <X style={{ width: 12, height: 12 }} />
                          {t("ai_regenerate_clear")}
                        </button>
                      </div>
                    )}

                    {/* Generate */}
                    {!aiGenerated && (
                      <button onClick={handleGenerateAI} disabled={generating || aiUserPrompt.trim().length < 10}
                        className="w-full inline-flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                        style={{ background: `linear-gradient(135deg, ${CYAN} 0%, #00A8CC 100%)`, color: NAVY_DEEP, padding: "11px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: "0 6px 18px rgba(0,212,255,0.3)" }}>
                        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {generating ? t("ai_generating") : t("ai_generate")}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

</div>{/* end scrollable tab content */}
        </div>

        {/* Right: pure preview */}
        <div className={`${mobileView === "form" ? "hidden" : "flex"} md:flex flex-1 flex-col overflow-hidden pb-14 md:pb-0`}>
          {/* Preview */}
          <div
            ref={previewContainerRef}
            className="flex-1 overflow-auto flex justify-center items-start py-8 px-4 print:py-0 print:bg-white print:px-0"
            style={{ background: "linear-gradient(135deg, #E0F2F7 0%, #D4EBF5 100%)" }}
          >
            {/* Outer wrapper sized to scaled dimensions so container doesn't overflow */}
            <div
              className="relative shrink-0"
              style={{
                width: previewScale < 1 ? `${794 * previewScale}px` : "210mm",
                minHeight: previewScale < 1 ? `${1123 * previewScale}px` : "297mm",
              }}
            >
            <div
              ref={templateRef}
              className="bg-white shadow-[0_8px_40px_rgba(0,0,0,0.22)] print:shadow-none overflow-hidden print:min-h-[297mm] shrink-0"
              style={{
                width: "210mm",
                minHeight: "297mm",
                transformOrigin: "top left",
                transform: previewScale < 1 ? `scale(${previewScale})` : undefined,
              }}
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
      </div>

      {/* Mobile bottom toggle bar */}
      <div className="md:hidden print:hidden fixed bottom-0 left-0 right-0 flex h-14 z-50"
        style={{ background: "#0B1B3D", borderTop: "1px solid rgba(0,212,255,0.15)", boxShadow: "0 -4px 24px rgba(11,27,61,0.35)" }}>
        {([
          { view: "form" as const, icon: <FileText style={{ width: 18, height: 18 }} />, label: "Editar" },
          { view: "preview" as const, icon: <Eye style={{ width: 18, height: 18 }} />, label: "Vista previa" },
        ]).map(({ view, icon, label }) => {
          const active = mobileView === view
          return (
            <button
              key={view}
              type="button"
              onClick={() => setMobileView(view)}
              className="flex-1 h-full flex items-center justify-center gap-2 touch-manipulation"
              style={{
                background: "transparent",
                color: active ? CYAN : "rgba(255,255,255,0.45)",
                borderBottom: active ? `2px solid ${CYAN}` : "2px solid transparent",
                WebkitTapHighlightColor: "rgba(0,212,255,0.1)",
              }}
            >
              <span style={{ color: "inherit" }}>{icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "inherit" }}>{label}</span>
            </button>
          )
        })}
      </div>

      <style>{`
        @media print {
          header { display: none !important; }
          @page { size: A4; margin: 0; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          svg { overflow: visible !important; }
        }
      `}</style>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <UnsavedChangesModal
        open={showExitModal}
        onSave={handleModalSave}
        onDiscard={handleModalDiscard}
        onClose={() => setShowExitModal(false)}
      />
    </div>
  )
}
