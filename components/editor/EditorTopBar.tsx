"use client"

import { useRouter } from "next/navigation"
import { useResumeStore } from "@/stores/resumeStore"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft, Download, Loader2, Lock, Share2, Copy, Eye,
  CheckCircle2, AlertCircle, Pencil, FileText,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useShallow } from "zustand/react/shallow"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import UnsavedChangesModal from "./UnsavedChangesModal"

interface Props {
  hasAccess: boolean
}

export default function EditorTopBar({ hasAccess }: Props) {
  const router = useRouter()
  const { title, setTitle, save, isSaving, lastSaved, isDirty, resumeId, triggerThumbnail } = useResumeStore(
    useShallow((s) => ({
      title: s.title,
      setTitle: s.setTitle,
      save: s.save,
      isSaving: s.isSaving,
      lastSaved: s.lastSaved,
      isDirty: s.isDirty,
      resumeId: s.resumeId,
      triggerThumbnail: s.triggerThumbnail,
    }))
  )
  const [editing, setEditing] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [publicSlug, setPublicSlug] = useState<string | null>(null)
  const [togglingShare, setTogglingShare] = useState(false)
  const [viewStats, setViewStats] = useState<{ total: number; last7d: number } | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const locale = useLocale()
  const t = useTranslations("editor")

  useEffect(() => {
    if (!resumeId) return
    apiFetch(`/api/resumes/${resumeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.isPublic !== undefined) {
          setIsPublic(data.isPublic)
          setPublicSlug(data.publicSlug ?? null)
        }
      })
      .catch(() => {})
  }, [resumeId])

  useEffect(() => {
    if (!resumeId || !isPublic) return
    apiFetch(`/api/resumes/views?resumeId=${resumeId}`)
      .then((r) => r.json())
      .then((data) => setViewStats({ total: data.total ?? 0, last7d: data.last7d ?? 0 }))
      .catch(() => {})
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
    router.push(`/${locale}/dashboard/resumes`)
  }

  async function handleModalSave() {
    setShowExitModal(false)
    if (hasAccess) {
      await save().catch(() => {})
      if (useResumeStore.getState().isDirty) { toast.error(t("save_error")); return }
    }
    router.push(`/${locale}/dashboard/resumes`)
  }

  function handleModalDiscard() {
    setShowExitModal(false)
    router.push(`/${locale}/dashboard/resumes`)
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

  async function handleDownloadPdf() {
    if (!resumeId) return
    if (isDirty && hasAccess) await save({ skipThumbnail: true }).catch(() => {})
    setDownloadingPdf(true)
    try {
      const res = await apiFetch(`/api/resumes/${resumeId}/pdf?locale=${locale}`)
      if (!res.ok) {
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
      triggerThumbnail()
    } catch {
      toast.error(t("print.error_pdf"))
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <header
      className="h-[58px] flex items-center justify-between shrink-0 z-[100] relative px-3 sm:px-5"
      style={{
        background: "linear-gradient(135deg, #f0f8ff 0%, #e8f4fb 40%, #f5faff 70%, #edf6fb 100%)",
        borderBottom: "1px solid rgba(0,212,255,0.2)",
        boxShadow: "0 1px 0 rgba(0,212,255,0.12), 0 4px 16px rgba(0,0,0,0.06)",
      }}
    >
      {/* Subtle cyan glow line at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 0%, #00D4FF 30%, #00E5FF 50%, #00D4FF 70%, transparent 100%)", opacity: 0.35 }}
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
          className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 cursor-pointer transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(0,212,255,0.2)",
            color: "#1a2e4a",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.background = "rgba(0,212,255,0.12)"
            el.style.borderColor = "rgba(0,212,255,0.4)"
            el.style.color = "#00A8CC"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.background = "rgba(255,255,255,0.7)"
            el.style.borderColor = "rgba(0,212,255,0.2)"
            el.style.color = "#1a2e4a"
          }}
        >
          <ArrowLeft size={16} />
        </button>

        {/* CV icon badge */}
        <div
          className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(0,168,204,0.1) 100%)",
            border: "1px solid rgba(0,212,255,0.25)",
          }}
        >
          <FileText size={13} style={{ color: "#00D4FF" }} />
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
            <span
              className="truncate text-[14px] font-semibold tracking-[-0.01em]"
              style={{ color: "#1a2e4a" }}
            >
              {title}
            </span>
            <Pencil
              size={12}
              className="shrink-0 transition-all duration-200 opacity-0 group-hover:opacity-100"
              style={{ color: "#00D4FF" }}
            />
          </button>
        )}
      </div>

      {/* ── Right: actions ── */}
      <div className="flex items-center gap-2 shrink-0 relative z-10">

        {/* Save status pill */}
        {hasAccess ? (
          <button
            onClick={() => { if (isDirty && !isSaving) save().catch(() => {}) }}
            disabled={isSaving || !isDirty}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium cursor-pointer border transition-all duration-200 disabled:cursor-default"
            style={{
              background: isSaving
                ? "rgba(148,163,184,0.1)"
                : isDirty
                ? "rgba(245,158,11,0.1)"
                : lastSaved
                ? "rgba(16,185,129,0.1)"
                : "transparent",
              borderColor: isSaving
                ? "rgba(148,163,184,0.2)"
                : isDirty
                ? "rgba(245,158,11,0.25)"
                : lastSaved
                ? "rgba(16,185,129,0.25)"
                : "transparent",
              color: isSaving ? "#94A3B8" : isDirty ? "#F59E0B" : lastSaved ? "#10B981" : "transparent",
            }}
          >
            {isSaving ? (
              <><Loader2 size={11} className="animate-spin" /><span className="hidden sm:inline">{t("saving")}</span></>
            ) : isDirty ? (
              <><AlertCircle size={11} /><span className="hidden sm:inline">{t("unsaved")}</span></>
            ) : lastSaved ? (
              <><CheckCircle2 size={11} /><span className="hidden sm:inline">{t("saved_at", { time: lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })}</span></>
            ) : null}
          </button>
        ) : (
          <button
            onClick={handleLockedClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] cursor-pointer border transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.5)", borderColor: "rgba(0,212,255,0.15)", color: "#94A3B8" }}
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
              className="inline-flex items-center gap-2 px-3 py-[7px] rounded-lg text-[12.5px] font-semibold cursor-pointer transition-all duration-200 disabled:opacity-50"
              style={{
                background: isPublic ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.7)",
                border: isPublic ? "1px solid rgba(0,212,255,0.35)" : "1px solid rgba(0,212,255,0.2)",
                color: isPublic ? "#00A8CC" : "#1a2e4a",
              }}
              onMouseEnter={(e) => {
                if (isPublic) return
                const el = e.currentTarget
                el.style.background = "rgba(0,212,255,0.1)"
                el.style.borderColor = "rgba(0,212,255,0.4)"
                el.style.color = "#00A8CC"
              }}
              onMouseLeave={(e) => {
                if (isPublic) return
                const el = e.currentTarget
                el.style.background = "rgba(255,255,255,0.7)"
                el.style.borderColor = "rgba(0,212,255,0.2)"
                el.style.color = "#1a2e4a"
              }}
            >
              {togglingShare ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />}
              <span className="hidden sm:inline">{isPublic ? t("share.public") : t("share.button")}</span>
            </button>

            {isPublic && publicSlug && (
              <button
                onClick={handleCopyLink}
                title={t("share.copy_link")}
                className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,212,255,0.2)", color: "#1a2e4a" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.background = "rgba(0,212,255,0.1)"
                  el.style.borderColor = "rgba(0,212,255,0.4)"
                  el.style.color = "#00A8CC"
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.background = "rgba(255,255,255,0.7)"
                  el.style.borderColor = "rgba(0,212,255,0.2)"
                  el.style.color = "#1a2e4a"
                }}
              >
                <Copy size={13} />
              </button>
            )}

            {isPublic && viewStats !== null && (
              <span
                className="hidden sm:flex items-center gap-1 px-2 text-[11px]"
                style={{ color: "#94A3B8" }}
                title={t("share.views_tooltip", { total: viewStats.total })}
              >
                <Eye size={11} /> {viewStats.last7d}
              </span>
            )}
          </div>
        )}

        {/* Download PDF */}
        {hasAccess ? (
          <button
            disabled={!resumeId || downloadingPdf}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-[7px] rounded-lg text-[12.5px] font-bold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
              border: "1px solid rgba(0,212,255,0.3)",
              color: "#0a1a35",
              boxShadow: "0 4px_16px rgba(0,212,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
            onMouseEnter={(e) => {
              if (!downloadingPdf) {
                const el = e.currentTarget
                el.style.transform = "translateY(-1px)"
                el.style.boxShadow = "0 6px 20px rgba(0,212,255,0.45), inset 0 1px 0 rgba(255,255,255,0.2)"
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.transform = "translateY(0)"
              el.style.boxShadow = "0 4px 16px rgba(0,212,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
            }}
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
            onClick={handleLockedClick}
            className="inline-flex items-center gap-2 px-4 py-[7px] rounded-lg text-[12.5px] font-bold cursor-pointer opacity-40"
            style={{
              background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
              border: "1px solid rgba(0,212,255,0.3)",
              color: "#0a1a35",
            }}
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
    </header>
  )
}
