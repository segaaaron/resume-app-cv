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
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"
import { useAICall } from "@/hooks/useAICall"
import { handleApiError } from "@/lib/upgrade-modal-handler"
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
  // ── 27 premium templates (cover-letter v2) ───────────────────────────────
  echo:      dynamic(() => import("./templates/EchoTemplate"),          { ssr: false }),
  lumen:     dynamic(() => import("./templates/LumenTemplate"),         { ssr: false }),
  atlas:     dynamic(() => import("./templates/AtlasTemplate"),         { ssr: false }),
  consul:    dynamic(() => import("./templates/ConsulTemplate"),        { ssr: false }),
  sterling:  dynamic(() => import("./templates/SterlingTemplate"),      { ssr: false }),
  fortis:    dynamic(() => import("./templates/FortisTemplate"),        { ssr: false }),
  prism:     dynamic(() => import("./templates/PrismTemplate"),         { ssr: false }),
  ember:     dynamic(() => import("./templates/EmberTemplate"),         { ssr: false }),
  vantage:   dynamic(() => import("./templates/VantageTemplate"),       { ssr: false }),
  mosaic:    dynamic(() => import("./templates/MosaicTemplate"),        { ssr: false }),
  vertex:    dynamic(() => import("./templates/VertexTemplate"),        { ssr: false }),
  folio:     dynamic(() => import("./templates/FolioTemplate"),         { ssr: false }),
  gazette:   dynamic(() => import("./templates/GazetteTemplate"),       { ssr: false }),
  verso:     dynamic(() => import("./templates/VersoTemplate"),         { ssr: false }),
  aurum:     dynamic(() => import("./templates/AurumTemplate"),         { ssr: false }),
  onyx:      dynamic(() => import("./templates/OnyxTemplate"),          { ssr: false }),
  velvet:    dynamic(() => import("./templates/VelvetTemplate"),        { ssr: false }),
  signal:    dynamic(() => import("./templates/SignalTemplate"),        { ssr: false }),
  meridian:  dynamic(() => import("./templates/MeridianTemplate"),      { ssr: false }),
  nova:      dynamic(() => import("./templates/NovaTemplate"),          { ssr: false }),
  obsidian:  dynamic(() => import("./templates/ObsidianTemplate"),      { ssr: false }),
  codex:     dynamic(() => import("./templates/CodexTemplate"),         { ssr: false }),
  axiom:     dynamic(() => import("./templates/AxiomTemplate"),         { ssr: false }),
  terra:     dynamic(() => import("./templates/TerraTemplate"),         { ssr: false }),
  flare:     dynamic(() => import("./templates/FlareTemplate"),         { ssr: false }),
  herald:    dynamic(() => import("./templates/HeraldTemplate"),        { ssr: false }),
  bloom:     dynamic(() => import("./templates/BloomTemplate"),         { ssr: false }),
}

type TemplateId =
  | "classic" | "sidebar" | "elegant" | "split" | "executive" | "material"
  | "gradient" | "minimal" | "twotone" | "timeline" | "monogram"
  | "architect" | "diagonal" | "newspaper"
  | "echo" | "lumen"
  | "atlas" | "consul" | "sterling" | "fortis"
  | "prism" | "ember" | "vantage" | "mosaic"
  | "vertex"
  | "folio" | "gazette" | "verso"
  | "aurum" | "onyx" | "velvet"
  | "signal" | "meridian" | "nova" | "obsidian" | "codex" | "axiom" | "terra"
  | "flare" | "herald" | "bloom"

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

// Alphabetical by `id`. `elegant` (free) kept at top for prominence; the rest
// of the PRO templates follow in strict alpha order for predictable browsing.
const TEMPLATES: { id: TemplateId; labelKey: string; pro?: boolean }[] = [
  { id: "elegant",   labelKey: "template_elegant" },
  { id: "architect", labelKey: "template_architect", pro: true },
  { id: "atlas",     labelKey: "template_atlas",     pro: true },
  { id: "aurum",     labelKey: "template_aurum",     pro: true },
  { id: "axiom",     labelKey: "template_axiom",     pro: true },
  { id: "bloom",     labelKey: "template_bloom",     pro: true },
  { id: "codex",     labelKey: "template_codex",     pro: true },
  { id: "consul",    labelKey: "template_consul",    pro: true },
  { id: "diagonal",  labelKey: "template_diagonal",  pro: true },
  { id: "echo",      labelKey: "template_echo",      pro: true },
  { id: "ember",     labelKey: "template_ember",     pro: true },
  { id: "executive", labelKey: "template_executive", pro: true },
  { id: "flare",     labelKey: "template_flare",     pro: true },
  { id: "folio",     labelKey: "template_folio",     pro: true },
  { id: "fortis",    labelKey: "template_fortis",    pro: true },
  { id: "gazette",   labelKey: "template_gazette",   pro: true },
  { id: "gradient",  labelKey: "template_gradient",  pro: true },
  { id: "herald",    labelKey: "template_herald",    pro: true },
  { id: "lumen",     labelKey: "template_lumen",     pro: true },
  { id: "material",  labelKey: "template_material",  pro: true },
  { id: "meridian",  labelKey: "template_meridian",  pro: true },
  { id: "minimal",   labelKey: "template_minimal",   pro: true },
  { id: "monogram",  labelKey: "template_monogram",  pro: true },
  { id: "mosaic",    labelKey: "template_mosaic",    pro: true },
  { id: "newspaper", labelKey: "template_newspaper", pro: true },
  { id: "nova",      labelKey: "template_nova",      pro: true },
  { id: "obsidian",  labelKey: "template_obsidian",  pro: true },
  { id: "onyx",      labelKey: "template_onyx",      pro: true },
  { id: "prism",     labelKey: "template_prism",     pro: true },
  { id: "sidebar",   labelKey: "template_sidebar",   pro: true },
  { id: "signal",    labelKey: "template_signal",    pro: true },
  { id: "split",     labelKey: "template_split",     pro: true },
  { id: "sterling",  labelKey: "template_sterling",  pro: true },
  { id: "terra",     labelKey: "template_terra",    pro: true },
  { id: "timeline",  labelKey: "template_timeline",  pro: true },
  { id: "twotone",   labelKey: "template_twotone",   pro: true },
  { id: "vantage",   labelKey: "template_vantage",   pro: true },
  { id: "velvet",    labelKey: "template_velvet",    pro: true },
  { id: "verso",     labelKey: "template_verso",     pro: true },
  { id: "vertex",    labelKey: "template_vertex",    pro: true },
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
  const aiT = useTranslations("editor.ai")
  const locale = useLocale()
  const router = useRouter()
  const { open: openUpgradeModal } = useUpgradeModal()
  const { preCheck, onSuccess: aiOnSuccess } = useAICall()
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
    preCheck("generate-cover-letter")
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
      if (res.status === 429 || res.status === 403) {
        const handled = await handleApiError(res, {
          openUpgradeModal,
          redirect: (p) => router.push(p),
          locale,
          fallbackToast: () => toast.error(res.status === 429 ? t("ai_rate_limit") : t("ai_pro_only")),
          dailyCapToast: () => toast.warning(aiT("daily_cap_reached"), { duration: 6000 }),
        })
        if (handled || res.status === 429 || res.status === 403) return
      }
      if (res.status === 422) { toast.error(t("ai_off_topic")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateContent("body", data.body)
      setAiGenerated(true)
      toast.success(t("ai_success"))
      await aiOnSuccess()
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
    if (!isPro) {
      toast.error(t("pdf_pro_required"), {
        action: { label: t("see_plans"), onClick: () => { window.location.href = `/${locale}/pricing` } },
      })
      return
    }
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
    // ── 27 premium templates ──
    echo: t("template_echo"),
    lumen: t("template_lumen"),
    atlas: t("template_atlas"),
    consul: t("template_consul"),
    sterling: t("template_sterling"),
    fortis: t("template_fortis"),
    prism: t("template_prism"),
    ember: t("template_ember"),
    vantage: t("template_vantage"),
    mosaic: t("template_mosaic"),
    vertex: t("template_vertex"),
    folio: t("template_folio"),
    gazette: t("template_gazette"),
    verso: t("template_verso"),
    aurum: t("template_aurum"),
    onyx: t("template_onyx"),
    velvet: t("template_velvet"),
    signal: t("template_signal"),
    meridian: t("template_meridian"),
    nova: t("template_nova"),
    obsidian: t("template_obsidian"),
    codex: t("template_codex"),
    axiom: t("template_axiom"),
    terra: t("template_terra"),
    flare: t("template_flare"),
    herald: t("template_herald"),
    bloom: t("template_bloom"),
  }

  // Palette constants used in conditional inline styles (tab bar, template grid)
  const NAVY_DEEP = "#0B1B3D", NAVY_MID = "#1a2e4a", CYAN = "#00D4FF"
  const BORDER_LIGHT = "#C8DCF0", MUTED_LABEL = "#7A9BB5"

  const candidateFieldIcons: Partial<Record<keyof CandidateData, React.ReactNode>> = {
    name: <User className="h-3 w-3 text-[#5B8FBD]" />,
    jobTitle: <Briefcase className="h-3 w-3 text-[#5B8FBD]" />,
    email: <Mail className="h-3 w-3 text-[#5B8FBD]" />,
    phone: <Phone className="h-3 w-3 text-[#5B8FBD]" />,
    address: <MapPin className="h-3 w-3 text-[#5B8FBD]" />,
    linkedin: <Link2 className="h-3 w-3 text-[#5B8FBD]" />,
    website: <Globe className="h-3 w-3 text-[#5B8FBD]" />,
  }

  return (
    <div className="h-screen flex flex-col bg-[#F4F8FD]">
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
        <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none opacity-[0.35]"
          style={{ background: "linear-gradient(90deg, transparent 0%, #00D4FF 30%, #00E5FF 50%, #00D4FF 70%, transparent 100%)" }} />
        {/* Ambient right glow */}
        <div className="absolute top-0 right-0 w-64 h-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 100% 50%, rgba(0,212,255,0.12) 0%, rgba(0,168,204,0.05) 50%, transparent 70%)" }} />

        {/* Left: back + icon + title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-3 relative z-10">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 transition-all duration-200 text-dash-navy border border-dash-cyan/20 bg-white/70 hover:bg-dash-cyan/[0.12] hover:border-dash-cyan/40 hover:text-[#00A8CC]"
            onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = "rgba(0,212,255,0.12)"; el.style.borderColor = "rgba(0,212,255,0.4)"; el.style.color = "#00A8CC" }}
            onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = "rgba(255,255,255,0.7)"; el.style.borderColor = "rgba(0,212,255,0.2)"; el.style.color = "#1a2e4a" }}
          >
            <ArrowLeft size={16} />
          </button>

          {/* Icon badge */}
          <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg shrink-0 border border-dash-cyan/25"
            style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(0,168,204,0.1) 100%)" }}>
            <FileText size={13} className="text-dash-cyan" />
          </div>

          {/* Title */}
          {editingTitle ? (
            <input autoFocus value={title}
              onChange={(e) => { setTitle(e.target.value); setDirty(true) }}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
              className="max-w-[120px] sm:max-w-[240px] border-0 border-b border-b-[#00D4FF] rounded-none bg-transparent text-[14px] font-semibold text-dash-navy outline-none py-1 px-0 h-auto shadow-none focus-visible:ring-0"
              style={{ caretColor: "#00D4FF" }} />
          ) : (
            <button onClick={() => setEditingTitle(true)}
              className="group flex items-center gap-1.5 truncate max-w-[110px] sm:max-w-[240px] cursor-pointer bg-transparent border-none">
              <span className="truncate text-[14px] font-semibold tracking-[-0.01em] text-dash-navy">{title}</span>
              <Pencil size={12} className="shrink-0 transition-all duration-200 opacity-0 group-hover:opacity-100 text-dash-cyan" />
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
            className="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 disabled:opacity-50 text-white border border-dash-cyan/30"
            style={{ background: "linear-gradient(135deg, #1a2e4a 0%, #0B1B3D 100%)" }}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          </button>

          {/* Download menu (PDF only) — freemium paywall when not PRO */}
          <DownloadMenu
            filename={`${(title.replace(/[^a-z0-9]/gi, "_") || "carta")}`}
            triggerLabel={t("download")}
            generatingPdfLabel={t("download_generating_pdf")}
            successLabel={(f) => t("download_success", { filename: f })}
            phaseLabels={{
              preparing: t("download_preparing"),
              applyingStyles: t("download_applying_styles"),
              almostDone: t("download_almost_done"),
            }}
            options={[
              { format: "pdf", label: "PDF", sublabel: t("export_with_design"), isLoading: downloadingPdf, onDownload: downloadPDF },
            ]}
            locked={!isPro}
            onLocked={() => openUpgradeModal("download")}
          />
        </div>
      </header>

      {/* Two panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: sidebar with tab bar */}
        <div
          className={`${mobileView === "preview" ? "hidden" : "flex"} md:flex flex-col w-full md:w-[400px] shrink-0 overflow-hidden pb-14 md:pb-0 print:hidden bg-[#F4F8FD] border-r border-[#E2E8F0]`}
          style={{ boxShadow: "2px 0 12px rgba(0,0,0,0.02)" }}
        >

          {/* ── Tab bar ── */}
          <div className="shrink-0 flex p-2 gap-1 border-b border-[#E2E8F0] bg-[#F4F8FD]">
            {([
              { key: "content",   icon: <FileText className="w-3 h-3" />,   label: t("tab_content"),   activeStyle: { background: `linear-gradient(135deg, ${NAVY_DEEP} 0%, ${NAVY_MID} 100%)`, color: "#ffffff", border: "none", boxShadow: "0 4px 12px rgba(11,27,61,0.2)" }, inactiveStyle: { background: "rgba(11,27,61,0.05)", color: MUTED_LABEL, border: `1px solid ${BORDER_LIGHT}` } },
              { key: "templates", icon: <LayoutGrid className="w-3 h-3" />,  label: t("tab_templates"), activeStyle: { background: "linear-gradient(135deg, #3B4F7A 0%, #2A3D6B 100%)", color: "#ffffff", border: "none", boxShadow: "0 4px 12px rgba(42,61,107,0.25)" }, inactiveStyle: { background: "rgba(11,27,61,0.05)", color: MUTED_LABEL, border: `1px solid ${BORDER_LIGHT}` } },
              { key: "ai",        icon: <Sparkles className="w-3 h-3" />,    label: t("tab_ai"),        activeStyle: { background: `linear-gradient(135deg, ${CYAN} 0%, #00A8CC 100%)`, color: NAVY_DEEP, border: "none", boxShadow: "0 4px 14px rgba(0,212,255,0.35)" }, inactiveStyle: { background: "rgba(0,212,255,0.08)", color: "#00A8CC", border: "1px solid rgba(0,212,255,0.25)" } },
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
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F4F8FD]" style={{ scrollbarWidth: "thin", scrollbarColor: "#E2E8F0 transparent" }}>

          {/* ── Planillas tab ── */}
          {sidebarTab === "templates" && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-dash-muted pb-[2px]">
                {TEMPLATES.length} {t("tab_templates").toLowerCase()}
              </p>
              <div className="grid grid-cols-2 gap-[10px]">
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
                      <div className="relative overflow-hidden rounded-md shrink-0" style={{ width: 72, height: 96, opacity: locked ? 0.55 : 1 }}>
                        <CoverLetterThumbnail id={id} color={locked ? "#9ca3af" : colorScheme} />
                        {locked && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/50">
                            <Lock className="w-[14px] h-[14px] text-[#7C3AED]" />
                            <span className="text-[8px] font-extrabold tracking-[0.06em] text-[#7C3AED] bg-[rgba(124,58,237,0.12)] px-[5px] py-[2px] rounded">PRO</span>
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-dash-cyan flex items-center justify-center">
                            <Check className="w-[9px] h-[9px] text-[#0B1B3D]" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      {/* Name */}
                      <span className={`text-[10px] font-semibold text-center leading-[1.2] w-full overflow-hidden text-ellipsis whitespace-nowrap ${isSelected ? "text-[#00A8CC]" : "text-[#4A6785]"}`}>
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

            const dot = <span className="w-[7px] h-[7px] rounded-full bg-green-500 inline-block shrink-0" />

            return (
              <div className="flex flex-col gap-[10px]">

                {/* ── Tus datos card ── */}
                <div className="rounded-[14px] overflow-hidden border border-[#cffafe] shadow-[0_1px_4px_rgba(0,0,0,0.04)]" style={{ background: "linear-gradient(135deg, rgba(236,254,255,0.7) 0%, rgba(239,246,255,0.5) 100%)" }}>
                  <button type="button" onClick={() => toggleSection("candidate")} className="flex items-center gap-3 px-[14px] py-[13px] w-full cursor-pointer bg-transparent">
                    <div className="w-11 h-11 rounded-[10px] bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shrink-0"><User className="w-[18px] h-[18px] text-[#0B1B3D]" /></div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-bold text-[13.5px] text-[#0B1B3D] leading-[1.2]">{t("candidate_section")}</div>
                      <div className="flex items-center gap-[5px] mt-1">
                        {dot}
                        <span className="text-[11px] text-[#6B8FAB] overflow-hidden text-ellipsis whitespace-nowrap">{candidateSubtitle}</span>
                      </div>
                    </div>
                    {openSection === "candidate"
                      ? <ChevronDown className="w-[17px] h-[17px] text-[#9BB5CC] shrink-0" />
                      : <ChevronRight className="w-[17px] h-[17px] text-[#9BB5CC] shrink-0" />
                    }
                  </button>

                  {openSection === "candidate" && (
                    <div className="px-[14px] pt-1 pb-4 border-t border-[#E2E8F0] bg-white flex flex-col gap-3">
                      {/* Photo — resume editor style */}
                      <div className="flex flex-col items-center gap-3 pt-[14px]">
                        {/* Section label */}
                        <div className="dp-section-label w-full">
                          <Camera className="w-[13px] h-[13px] text-dash-cyan" />
                          {t("candidate_photo")}
                        </div>
                        {/* Avatar ring */}
                        <div
                          className="dp-avatar w-[108px] h-[108px] rounded-full overflow-hidden cursor-pointer relative flex items-center justify-center"
                          onClick={() => photoInputRef.current?.click()}
                          style={{
                            background: "linear-gradient(135deg, #e8f0fe 0%, #dbeafe 100%)",
                            boxShadow: "0 0 0 3px #00D4FF, 0 0 0 5px #fff, 0 8px 24px rgba(0,212,255,0.2)",
                          }}
                        >
                          {candidate.photo
                            ? <img src={candidate.photo} alt="" className="w-full h-full object-cover" style={{ objectPosition: `center ${photoPosition}%` }} />
                            : candidate.name
                              ? <span className="text-[28px] font-bold text-[#0B1B3D] select-none">{candidate.name.trim().split(/\s+/).slice(0, 2).map((w: string) => w[0].toUpperCase()).join("")}</span>
                              : <Camera className="w-7 h-7 text-[#7AAAD4]" />
                          }
                          <div className="dp-avatar-overlay">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        {/* Action buttons */}
                        <div className="flex gap-2 flex-wrap justify-center">
                          <button type="button" className="dp-btn-primary" onClick={() => photoInputRef.current?.click()}>
                            <Camera className="w-[14px] h-[14px]" />
                            {candidate.photo ? t("candidate_photo_change") : t("candidate_photo_add")}
                          </button>
                          {candidate.photo && (
                            <button type="button" className="dp-btn-danger" onClick={() => { updateCandidate("photo", ""); if (photoInputRef.current) photoInputRef.current.value = "" }}>
                              <X className="w-[14px] h-[14px]" /> {t("candidate_photo_remove")}
                            </button>
                          )}
                        </div>
                        {/* Position slider */}
                        {candidate.photo && (
                          <div className="w-full mt-1">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[11px] text-[#7AAAD4] font-medium">
                                {t("candidate_photo_top")} ↕ {t("candidate_photo_bottom")}
                              </span>
                              <span className="text-[11px] font-extrabold text-dash-cyan bg-dash-cyan/10 px-2 py-[2px] rounded-full border border-dash-cyan/25">
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
                          <div className="text-[11px] font-semibold text-[#7A9BB5] tracking-[0.01em] capitalize mb-[6px] flex items-center gap-[6px]">{candidateFieldIcons[field]}{t(lk as Parameters<typeof t>[0])}</div>
                          <input type={inputType} value={candidate[field]} onChange={(e) => updateCandidate(field, e.target.value)} className="h-9 pl-3 pr-3 bg-white border border-[#C8DCF0] rounded-md text-[13px] text-dash-navy w-full outline-none" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Contenido card ── */}
                <div className="rounded-[14px] overflow-hidden border border-[#cffafe] shadow-[0_1px_4px_rgba(0,0,0,0.04)]" style={{ background: "linear-gradient(135deg, rgba(236,254,255,0.7) 0%, rgba(239,246,255,0.5) 100%)" }}>
                  <button type="button" onClick={() => toggleSection("content")} className="flex items-center gap-3 px-[14px] py-[13px] w-full cursor-pointer bg-transparent">
                    <div className="w-11 h-11 rounded-[10px] bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shrink-0"><FileText className="w-[18px] h-[18px] text-[#0B1B3D]" /></div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-bold text-[13.5px] text-[#0B1B3D] leading-[1.2]">{t("content_section")}</div>
                      <div className="flex items-center gap-[5px] mt-1">
                        {dot}
                        <span className="text-[11px] text-[#6B8FAB] overflow-hidden text-ellipsis whitespace-nowrap">{contentSubtitle}</span>
                      </div>
                    </div>
                    {openSection === "content"
                      ? <ChevronDown className="w-[17px] h-[17px] text-[#9BB5CC] shrink-0" />
                      : <ChevronRight className="w-[17px] h-[17px] text-[#9BB5CC] shrink-0" />
                    }
                  </button>

                  {openSection === "content" && (
                    <div className="px-[14px] pt-3 pb-4 border-t border-[#E2E8F0] bg-white flex flex-col gap-3">
                      <div>
                        <div className="text-[11px] font-semibold text-[#7A9BB5] tracking-[0.01em] capitalize mb-[6px] flex items-center gap-[6px]"><User className="h-3 w-3 text-[#5B8FBD]" />{t("recipient_label")}</div>
                        <input placeholder={t("recipient_placeholder")} value={content.recipientName} onChange={(e) => updateContent("recipientName", e.target.value)} className="h-9 pl-3 pr-3 bg-white border border-[#C8DCF0] rounded-md text-[13px] text-dash-navy w-full outline-none" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-[#7A9BB5] tracking-[0.01em] capitalize mb-[6px] flex items-center gap-[6px]"><Briefcase className="h-3 w-3 text-[#5B8FBD]" />{t("recipient_title_label")}</div>
                        <input placeholder={t("recipient_title_placeholder")} value={content.recipientTitle} onChange={(e) => updateContent("recipientTitle", e.target.value)} className="h-9 pl-3 pr-3 bg-white border border-[#C8DCF0] rounded-md text-[13px] text-dash-navy w-full outline-none" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-[#7A9BB5] tracking-[0.01em] capitalize mb-[6px] flex items-center gap-[6px]"><Building2 className="h-3 w-3 text-[#5B8FBD]" />{t("company_label")}</div>
                        <input placeholder={t("company_placeholder")} value={content.company} onChange={(e) => updateContent("company", e.target.value)} className="h-9 pl-3 pr-3 bg-white border border-[#C8DCF0] rounded-md text-[13px] text-dash-navy w-full outline-none" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-[#7A9BB5] tracking-[0.01em] capitalize mb-[6px] flex items-center gap-[6px]"><Type className="h-3 w-3 text-[#5B8FBD]" />{t("subject_label")}</div>
                        <input placeholder={t("subject_placeholder")} value={content.subject ?? ""} onChange={(e) => updateContent("subject", e.target.value)} className="h-9 pl-3 pr-3 bg-white border border-[#C8DCF0] rounded-md text-[13px] text-dash-navy w-full outline-none" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-[#7A9BB5] tracking-[0.01em] capitalize mb-[6px] flex items-center gap-[6px]"><Type className="h-3 w-3 text-[#5B8FBD]" />{t("closing_label")}</div>
                        <input placeholder={t("closing_placeholder")} value={content.closing} onChange={(e) => updateContent("closing", e.target.value)} className="h-9 pl-3 pr-3 bg-white border border-[#C8DCF0] rounded-md text-[13px] text-dash-navy w-full outline-none" />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Cuerpo card (conditional) ── */}
                {hasBody && (
                  <div className="rounded-[14px] overflow-hidden border border-[#cffafe] shadow-[0_1px_4px_rgba(0,0,0,0.04)]" style={{ background: "linear-gradient(135deg, rgba(236,254,255,0.7) 0%, rgba(239,246,255,0.5) 100%)" }}>
                    <button type="button" onClick={() => toggleSection("body")} className="flex items-center gap-3 px-[14px] py-[13px] w-full cursor-pointer bg-transparent">
                      <div className="w-11 h-11 rounded-[10px] bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shrink-0"><FileText className="w-[18px] h-[18px] text-[#0B1B3D]" /></div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-bold text-[13.5px] text-[#0B1B3D] leading-[1.2]">{t("body_label")}</div>
                        <div className="flex items-center gap-[5px] mt-1">
                          {dot}
                          <span className="text-[11px] text-[#6B8FAB] overflow-hidden text-ellipsis whitespace-nowrap">{bodySubtitle}</span>
                        </div>
                      </div>
                      {openSection === "body"
                        ? <ChevronDown className="w-[17px] h-[17px] text-[#9BB5CC] shrink-0" />
                        : <ChevronRight className="w-[17px] h-[17px] text-[#9BB5CC] shrink-0" />
                      }
                    </button>

                    {openSection === "body" && (
                      <div className="px-[14px] pt-3 pb-[14px] border-t border-[#E2E8F0] bg-white flex flex-col gap-[10px]">
                        <div className="bg-white border border-[#C8DCF0] rounded-[10px] p-1">
                          <RichTextEditor value={content.body} onChange={(html) => updateContent("body", html)} placeholder={t("body_placeholder")} />
                        </div>
                        <button type="button" onClick={() => { updateContent("body", ""); setAiUserPrompt(""); setAiGenerated(false); setSidebarTab("ai") }} disabled={generating}
                          className={`text-[11px] text-dash-muted flex items-center gap-[5px] ${generating ? "opacity-40" : ""}`}>
                          <X className="w-[11px] h-[11px]" />{t("ai_regenerate")}
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
                <div className="flex flex-col items-center gap-3 text-center rounded-2xl p-6 border border-dash-cyan/20" style={{ background: "linear-gradient(135deg, #0B1B3D 0%, #1a2e4a 100%)" }}>
                  <div className="w-12 h-12 rounded-xl bg-dash-cyan/[0.12] border border-dash-cyan/25 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-dash-cyan" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-white mb-[6px]">{t("pro_upgrade_title")}</p>
                    <p className="text-[11px] text-white/65 leading-[1.6]">{t("pro_upgrade_desc")}</p>
                  </div>
                  <button onClick={() => setUpgradeOpen(true)} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0B1B3D] px-[18px] py-[10px] rounded-[10px]"
                    style={{ background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)", boxShadow: "0 4px 14px rgba(0,212,255,0.35)" }}>
                    <Sparkles className="h-3.5 w-3.5" /> {t("pro_upgrade_cta")}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 rounded-2xl p-4 border border-dash-cyan/20" style={{ background: "linear-gradient(135deg, #0B1B3D 0%, #1a2e4a 100%)" }}>
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-[9px] bg-dash-cyan/15 border border-dash-cyan/30 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-dash-cyan" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-white leading-none">{t("ai_generate")}</p>
                      <p className="text-[10px] text-white/45 mt-[2px]">{t("ai_subtitle")}</p>
                    </div>
                  </div>

                  {/* Body already has content — show banner and disable form */}
                  {bodyHasContent && (
                    <div className="bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.35)] rounded-[10px] px-[14px] pt-[14px] pb-3">
                      <div className="flex items-center gap-2 mb-[6px]">
                        <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                        <span className="text-[12px] font-bold text-white">{t("body_complete_title")}</span>
                      </div>
                      <p className="text-[11px] text-white/60 leading-[1.5] mb-[10px]">{t("body_complete_desc")}</p>
                      <button
                        type="button"
                        onClick={() => { updateContent("body", ""); setAiUserPrompt(""); setAiGenerated(false) }}
                        className="w-full inline-flex items-center justify-center gap-1.5 transition-all text-[11px] font-semibold text-white/70 bg-white/[0.08] border border-white/15 rounded-lg px-3 py-2">
                        <X className="w-3 h-3" />
                        {t("body_complete_clear")}
                      </button>
                    </div>
                  )}

                  {/* Form — disabled when body has content */}
                  <div className={`transition-opacity duration-200 ${bodyHasContent ? "opacity-40 pointer-events-none" : ""}`}>
                    {/* Resume picker */}
                    {resumes.length > 0 && (
                      <div className="mb-3">
                        <div className="text-[11px] font-semibold text-white/60 tracking-[0.01em] capitalize mb-[6px] flex items-center gap-[6px]">{t("ai_resume_label")}</div>
                        <select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)}
                          className="w-full h-9 bg-white/[0.06] border border-white/[0.12] rounded-lg text-white text-[12px] px-[10px] outline-none">
                          <option value="" className="text-[#0B1B3D]">{t("ai_resume_none")}</option>
                          {resumes.map((r) => <option key={r.id} value={r.id} className="text-[#0B1B3D]">{r.title}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Tone */}
                    <div className="mb-3">
                      <div className="text-[11px] font-semibold text-white/60 tracking-[0.01em] capitalize mb-[6px] flex items-center gap-[6px]">{t("ai_tone_label")}</div>
                      <div className="flex gap-1.5">
                        {toneOptions.map(([v, l]) => {
                          const sel = aiTone === v
                          return (
                            <button key={v} type="button" onClick={() => setAiTone(v)} className="flex-1 transition-all text-[10px] font-semibold py-2 px-1 rounded-[7px]"
                              style={{
                                background: sel ? "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)" : "rgba(255,255,255,0.06)",
                                color: sel ? "#0B1B3D" : "rgba(255,255,255,0.55)",
                                border: sel ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
                                boxShadow: sel ? "0 4px 12px rgba(0,212,255,0.25)" : "none" }}>
                              {l}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Prompt */}
                    <div className="mb-3">
                      <div className="text-[11px] font-semibold text-white/60 tracking-[0.01em] capitalize mb-[6px] flex items-center gap-[6px]">{t("ai_prompt_label")}</div>
                      <div className="relative">
                        <textarea value={aiUserPrompt} onChange={(e) => setAiUserPrompt(e.target.value)}
                          placeholder={t("ai_prompt_placeholder")} rows={4} maxLength={500}
                          className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg pt-[10px] px-3 pb-6 text-[12px] text-white outline-none resize-none"
                          onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,212,255,0.3)" }}
                          onBlur={(e) => { e.currentTarget.style.boxShadow = "none" }} />
                        <span className={`absolute tabular-nums bottom-[6px] right-[10px] text-[10px] ${aiUserPrompt.length >= 450 ? "text-[#fbbf24]" : "text-white/40"}`}>
                          {aiUserPrompt.length}/500
                        </span>
                      </div>
                    </div>

                    {/* Success state after generation */}
                    {aiGenerated && (
                      <div className="bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] rounded-[10px] px-[14px] py-3 flex flex-col gap-[10px] mb-3">
                        <div className="flex items-start gap-[10px]">
                          <div className="w-7 h-7 rounded-lg bg-[rgba(16,185,129,0.2)] border border-[rgba(16,185,129,0.35)] flex items-center justify-center shrink-0">
                            <Check className="w-[14px] h-[14px] text-[#10B981]" />
                          </div>
                          <div>
                            <p className="text-[12px] font-bold text-white leading-[1.2]">{t("ai_generated_title")}</p>
                            <p className="text-[11px] text-white/60 mt-1 leading-[1.5]">{t("ai_generated_desc")}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { updateContent("body", ""); setAiUserPrompt(""); setAiGenerated(false) }}
                          className="w-full inline-flex items-center justify-center gap-1.5 transition-all text-[11px] font-semibold text-white/70 bg-white/[0.08] border border-white/15 rounded-lg px-3 py-2">
                          <X className="w-3 h-3" />
                          {t("ai_regenerate_clear")}
                        </button>
                      </div>
                    )}

                    {/* Generate */}
                    {!aiGenerated && (
                      <button onClick={handleGenerateAI} disabled={generating || aiUserPrompt.trim().length < 10}
                        className="w-full inline-flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-[13px] font-bold text-[#0B1B3D] py-[11px] px-[14px] rounded-[10px]"
                        style={{ background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)", boxShadow: "0 6px 18px rgba(0,212,255,0.3)" }}>
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
              <div className="print:hidden absolute left-0 right-0 h-0 pointer-events-none z-10" style={{ top: "297mm" }}>
                <div className="relative w-full">
                  <div className="absolute left-0 right-0 top-0 border-t-[1.5px] border-dashed border-[rgba(220,38,38,0.45)]" />
                  <span className="absolute right-[6px] top-[3px] text-[9px] font-semibold text-[rgba(220,38,38,0.6)] tracking-[0.05em] whitespace-nowrap" style={{ fontFamily: "var(--font-mono, monospace)" }}>
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
      <div className="md:hidden print:hidden fixed bottom-0 left-0 right-0 flex h-14 z-50 bg-[#0B1B3D] border-t border-dash-cyan/15"
        style={{ boxShadow: "0 -4px 24px rgba(11,27,61,0.35)" }}>
        {([
          { view: "form" as const, icon: <FileText className="w-[18px] h-[18px]" />, label: t("mobile_edit") },
          { view: "preview" as const, icon: <Eye className="w-[18px] h-[18px]" />, label: t("mobile_preview") },
        ]).map(({ view, icon, label }) => {
          const active = mobileView === view
          return (
            <button
              key={view}
              type="button"
              onClick={() => setMobileView(view)}
              className={`flex-1 h-full flex items-center justify-center gap-2 touch-manipulation transition-colors ${active ? "text-dash-cyan border-b-2 border-dash-cyan" : "text-white/45 border-b-2 border-transparent"}`}
              style={{ WebkitTapHighlightColor: "rgba(0,212,255,0.1)" }}
            >
              {icon}
              <span className="text-[13px] font-bold tracking-[0.06em] uppercase">{label}</span>
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
