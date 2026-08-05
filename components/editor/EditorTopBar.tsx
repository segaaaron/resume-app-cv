"use client"

import { useRouter } from "next/navigation"
import { useResumeStore } from "@/stores/resumeStore"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft, Download, Loader2, Lock, Save, Share2, Copy, Eye,
  CheckCircle2, AlertCircle, Pencil, FileText,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useShallow } from "zustand/react/shallow"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { track, trackFirstDownloadOnce } from "@/lib/analytics/track"
import UnsavedChangesModal from "./UnsavedChangesModal"
import PlaceholderWarningModal from "./PlaceholderWarningModal"
import { detectPlaceholders } from "@/lib/detectPlaceholders"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"

interface Props {
  hasAccess: boolean
  /** UNSUBSCRIBED: may download its basic-template CV a few times/day. Flips the
   *  download button from locked→upgrade to a real download; server caps it. */
  canDownloadFree?: boolean
}

export default function EditorTopBar({ hasAccess, canDownloadFree = false }: Props) {
  const router = useRouter()
  const { title, setTitle, save, isSaving, saveError, lastSaved, isDirty, resumeId, triggerThumbnail, sectionData } = useResumeStore(
    useShallow((s) => ({
      title: s.title,
      setTitle: s.setTitle,
      save: s.save,
      isSaving: s.isSaving,
      saveError: s.saveError,
      lastSaved: s.lastSaved,
      isDirty: s.isDirty,
      resumeId: s.resumeId,
      triggerThumbnail: s.triggerThumbnail,
      sectionData: s.sectionData,
    }))
  )
  const [editing, setEditing] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [publicSlug, setPublicSlug] = useState<string | null>(null)
  const [togglingShare, setTogglingShare] = useState(false)
  const [viewStats, setViewStats] = useState<{ total: number; last7d: number } | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [placeholderCount, setPlaceholderCount] = useState(0)
  const [showPlaceholderModal, setShowPlaceholderModal] = useState(false)
  const locale = useLocale()
  const t = useTranslations("editor")
  const { open: openUpgradeModal } = useUpgradeModal()
  const { data: session } = useSession()
  const isManaged = !!session?.user?.isManaged

  useEffect(() => {
    if (!resumeId) return
    const ctrl = new AbortController()
    apiFetch(`/api/resumes/${resumeId}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        if (ctrl.signal.aborted) return
        if (data?.isPublic !== undefined) {
          setIsPublic(data.isPublic)
          setPublicSlug(data.publicSlug ?? null)
        }
      })
      .catch((e) => {
        if (e?.name !== "AbortError") {/* swallow */}
      })
    return () => ctrl.abort()
  }, [resumeId])

  useEffect(() => {
    if (!resumeId || !isPublic) return
    const ctrl = new AbortController()
    apiFetch(`/api/resumes/views?resumeId=${resumeId}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        if (ctrl.signal.aborted) return
        setViewStats({ total: data.total ?? 0, last7d: data.last7d ?? 0 })
      })
      .catch((e) => {
        if (e?.name !== "AbortError") {/* swallow */}
      })
    return () => ctrl.abort()
  }, [resumeId, isPublic])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  function handleBack() {
    if (isDirty) { setShowExitModal(true); return }
    const count = detectPlaceholders(sectionData)
    if (count > 0) {
      setPlaceholderCount(count)
      setShowPlaceholderModal(true)
      return
    }
    router.push(`/${locale}/dashboard/resumes`)
  }

  function checkPlaceholdersThenNavigate() {
    const count = detectPlaceholders(sectionData)
    if (count > 0) {
      setPlaceholderCount(count)
      setShowPlaceholderModal(true)
      return
    }
    router.push(`/${locale}/dashboard/resumes`)
  }

  async function handleModalSave() {
    setShowExitModal(false)
    if (hasAccess) {
      await save().catch(() => {})
      if (useResumeStore.getState().isDirty) { toast.error(t("save_error")); return }
    }
    checkPlaceholdersThenNavigate()
  }

  function handleModalDiscard() {
    setShowExitModal(false)
    checkPlaceholdersThenNavigate()
  }

  async function handleToggleShare() {
    if (!resumeId) return
    setTogglingShare(true)
    try {
      const res = await apiFetch("/api/resumes/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      })
      const data = await res.json()
      setIsPublic(data.isPublic)
      setPublicSlug(data.publicSlug ?? null)
      if (data.isPublic) {
        const url = `${window.location.origin}/${locale}/cv/${data.publicSlug}`
        await navigator.clipboard.writeText(url)
        toast.success(t("share.enabled"))
      } else {
        toast.success(t("share.disabled"))
      }
    } catch {
      toast.error(t("share.error"))
    } finally {
      setTogglingShare(false)
    }
  }

  function handleCopyLink() {
    if (!publicSlug) return
    const url = `${window.location.origin}/${locale}/cv/${publicSlug}`
    navigator.clipboard.writeText(url)
    toast.success(t("share.copied"))
  }

  function handleLockedClick() {
    toast.error(t("pro_required"), {
      action: { label: t("see_plans"), onClick: () => { window.location.href = `/${locale}/pricing` } },
    })
  }

  function handleDownloadLockedClick() {
    // Freemium funnel: paywall on download intent → shared UpgradeModal.
    track("paywall_hit", { feature: "download", current_plan: session?.user?.plan ?? "UNSUBSCRIBED" })
    openUpgradeModal("download")
  }

  async function handleDownloadPdf() {
    if (!resumeId) return
    const count = detectPlaceholders(sectionData)
    if (count > 0) {
      toast.warning(t("print.placeholder_warning", { count }), { duration: 6000 })
    }
    if (isDirty && (hasAccess || canDownloadFree)) await save({ skipThumbnail: true }).catch(() => {})
    setDownloadingPdf(true)
    try {
      const res = await apiFetch(`/api/resumes/${resumeId}/pdf?locale=${locale}`)
      if (!res.ok) {
        if (res.status === 403 && isManaged) {
          toast.error(t("print.error_pdf_managed_expired"))
          return
        }
        // Free tier hit its daily download cap, or tried a PRO template → funnel to upgrade.
        const body = await res.json().catch(() => ({} as { error?: string }))
        if (
          (res.status === 429 && body?.error === "free_daily_download_cap") ||
          (res.status === 403 && body?.error === "premium_template_requires_upgrade")
        ) {
          track("paywall_hit", { feature: "download", current_plan: session?.user?.plan ?? "UNSUBSCRIBED" })
          openUpgradeModal("download")
          return
        }
        const key = res.status === 403 ? "print.error_pdf_403"
          : res.status === 429 ? "print.error_pdf_429"
          : res.status === 404 ? "print.error_pdf_404"
          : res.status >= 500 ? "print.error_pdf_500"
          : "print.error_pdf"
        toast.error(t(key)); return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title || "resume"}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      track("pdf_downloaded", { type: "resume", plan: session?.user?.plan ?? "UNSUBSCRIBED" })
      trackFirstDownloadOnce({ plan: session?.user?.plan ?? "UNSUBSCRIBED" })
      triggerThumbnail()
    } catch {
      toast.error(t("print.error_pdf"))
    } finally {
      setDownloadingPdf(false)
    }
  }

  function handlePlaceholderReview() {
    setShowPlaceholderModal(false)
  }

  function handlePlaceholderGoBack() {
    setShowPlaceholderModal(false)
    router.push(`/${locale}/dashboard/resumes`)
  }

  return (
    <header
      className="h-[58px] flex items-center justify-between shrink-0 z-[100] relative px-3 sm:px-5 border-b border-[rgba(0,212,255,0.2)] shadow-[0_1px_0_rgba(0,212,255,0.12),0_4px_16px_rgba(0,0,0,0.06)]"
      style={{ background: "linear-gradient(135deg, #f0f8ff 0%, #e8f4fb 40%, #f5faff 70%, #edf6fb 100%)" }}
    >
      {/* Subtle cyan glow line at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none opacity-[0.35]"
        style={{ background: "linear-gradient(90deg, transparent 0%, #00D4FF 30%, #00E5FF 50%, #00D4FF 70%, transparent 100%)" }}
      />
      {/* Ambient top-right glow */}
      <div
        className="absolute top-0 right-0 w-64 h-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 100% 50%, rgba(0,212,255,0.12) 0%, rgba(0,168,204,0.05) 50%, transparent 70%)" }}
      />

      {/* ── Left: back + title ── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-3 relative z-10">
        <button
          onClick={handleBack}
          aria-label="Back"
          className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 cursor-pointer transition-all duration-200 bg-white/70 border border-[rgba(0,212,255,0.2)] text-dash-navy hover:bg-[rgba(0,212,255,0.12)] hover:border-[rgba(0,212,255,0.4)] hover:text-[#00A8CC]"
        >
          <ArrowLeft size={16} />
        </button>

        {/* CV icon badge */}
        <div
          className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg shrink-0 border border-[rgba(0,212,255,0.25)]"
          style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(0,168,204,0.1) 100%)" }}
        >
          <FileText size={13} className="text-dash-cyan" />
        </div>

        {/* Title */}
        {editing ? (
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
            className="max-w-[120px] sm:max-w-[240px] border-0 border-b border-b-[#00D4FF] rounded-none bg-transparent text-[14px] font-semibold text-[#1a2e4a] outline-none py-1 px-0 h-auto shadow-none focus-visible:ring-0"
            style={{ caretColor: "#00D4FF" }}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="group flex items-center gap-1.5 truncate max-w-[110px] sm:max-w-[240px] cursor-pointer bg-transparent border-none"
          >
            <span className="truncate text-[14px] font-semibold tracking-[-0.01em] text-dash-navy">
              {title}
            </span>
            <Pencil
              size={12}
              className="shrink-0 transition-all duration-200 opacity-0 group-hover:opacity-100 text-dash-cyan"
            />
          </button>
        )}
      </div>

      {/* ── Right: actions ── */}
      <div className="flex items-center gap-2 shrink-0 relative z-10">

        {/* Save status pill. A failed save used to look exactly like a pending
            one — amber "unsaved" — so a server rejection was indistinguishable
            from "you typed a second ago". Failure now has its own red state with
            its own words, and the label is always visible in that state (never
            hidden behind sm:) because it is the one thing the user must not miss. */}
        {hasAccess ? (
          <button
            onClick={() => { if (!isSaving) save().catch(() => {}) }}
            disabled={isSaving}
            title={saveError ? t(`save_error_${saveError.kind}`) : undefined}
            aria-live="polite"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium cursor-pointer border transition-all duration-200 disabled:cursor-default"
            style={{
              background: saveError
                ? "rgba(225,29,72,0.1)"
                : isSaving
                ? "rgba(148,163,184,0.1)"
                : isDirty
                ? "rgba(245,158,11,0.1)"
                : lastSaved
                ? "rgba(16,185,129,0.1)"
                : "rgba(255,255,255,0.7)",
              borderColor: saveError
                ? "rgba(225,29,72,0.35)"
                : isSaving
                ? "rgba(148,163,184,0.2)"
                : isDirty
                ? "rgba(245,158,11,0.25)"
                : lastSaved
                ? "rgba(16,185,129,0.25)"
                : "rgba(0,212,255,0.2)",
              // #9F1239 on that tint clears 4.5:1 — a lighter rose would not.
              color: saveError ? "#9F1239" : isSaving ? "#94A3B8" : isDirty ? "#F59E0B" : lastSaved ? "#10B981" : "#1a2e4a",
            }}
          >
            {saveError ? (
              <><AlertCircle size={11} /><span>{saveError.fatal ? t("save_failed_fatal") : t("save_failed_retry")}</span></>
            ) : isSaving ? (
              <><Loader2 size={11} className="animate-spin" /><span className="hidden sm:inline">{t("saving")}</span></>
            ) : isDirty ? (
              <><AlertCircle size={11} /><span className="hidden sm:inline">{t("unsaved")}</span></>
            ) : lastSaved ? (
              <><CheckCircle2 size={11} /><span className="hidden sm:inline">{t("saved_at", { time: lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })}</span></>
            ) : (
              <><Save size={11} /><span className="hidden sm:inline">{t("save")}</span></>
            )}
          </button>
        ) : (
          <button
            onClick={handleLockedClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] cursor-pointer border border-[rgba(0,212,255,0.15)] bg-white/50 text-[#94A3B8] transition-all duration-200"
          >
            <Lock size={11} />
            <span className="hidden sm:inline">{t("save")}</span>
          </button>
        )}

        {/* Share */}
        {hasAccess && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleShare}
              disabled={togglingShare || !resumeId}
              aria-label={isPublic ? t("share.public") : t("share.button")}
              className={`inline-flex items-center gap-2 px-3 py-[7px] rounded-lg text-[12.5px] font-semibold cursor-pointer transition-all duration-200 disabled:opacity-50 ${
                isPublic
                  ? "bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.35)] text-[#00A8CC]"
                  : "bg-white/70 border border-[rgba(0,212,255,0.2)] text-dash-navy hover:bg-[rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.4)] hover:text-[#00A8CC]"
              }`}
            >
              {togglingShare ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />}
              <span className="hidden sm:inline">{isPublic ? t("share.public") : t("share.button")}</span>
            </button>

            {isPublic && publicSlug && (
              <button
                onClick={handleCopyLink}
                title={t("share.copy_link")}
                className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 bg-white/70 border border-[rgba(0,212,255,0.2)] text-dash-navy hover:bg-[rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.4)] hover:text-[#00A8CC]"
              >
                <Copy size={13} />
              </button>
            )}

            {isPublic && viewStats !== null && (
              <span
                className="hidden sm:flex items-center gap-1 px-2 text-[11px] text-[#94A3B8]"
                title={t("share.views_tooltip", { total: viewStats.total })}
              >
                <Eye size={11} /> {viewStats.last7d}
              </span>
            )}
          </div>
        )}

        {/* Download PDF — real button for paid plans AND the free tier (server
            caps free downloads/day + blocks PRO templates). Locked → upgrade otherwise. */}
        {hasAccess || canDownloadFree ? (
          <button
            disabled={!resumeId || downloadingPdf}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-[7px] rounded-lg text-[12.5px] font-bold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-[rgba(0,212,255,0.3)] text-[#0a1a35] shadow-[0_4px_16px_rgba(0,212,255,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(0,212,255,0.45),inset_0_1px_0_rgba(255,255,255,0.2)]"
            style={{ background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)" }}
          >
            {downloadingPdf
              ? <Loader2 size={13} className="animate-spin" />
              : <Download size={13} />}
            <span className="hidden sm:inline">
              {downloadingPdf ? t("download_generating_pdf") : t("print.print_pdf")}
            </span>
          </button>
        ) : (
          <button
            onClick={handleDownloadLockedClick}
            aria-label={t("print.print_pdf")}
            className="inline-flex items-center gap-2 px-4 py-[7px] rounded-lg text-[12.5px] font-bold cursor-pointer border border-[rgba(0,212,255,0.4)] text-[#0a1a35] shadow-[0_4px_16px_rgba(0,212,255,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(0,212,255,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)" }}
          >
            <Lock size={13} />
            <span className="hidden sm:inline">{t("print.print_pdf")}</span>
          </button>
        )}
      </div>

      <UnsavedChangesModal
        open={showExitModal}
        onSave={handleModalSave}
        onDiscard={handleModalDiscard}
        onClose={() => setShowExitModal(false)}
      />
      <PlaceholderWarningModal
        open={showPlaceholderModal}
        count={placeholderCount}
        onReview={handlePlaceholderReview}
        onProceedAnyway={handlePlaceholderGoBack}
      />
    </header>
  )
}
