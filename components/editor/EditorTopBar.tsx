"use client"

import { useRouter } from "next/navigation"
import { useResumeStore } from "@/stores/resumeStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Download, Loader2, Lock, Share2, Copy, Eye, CheckCircle2, AlertCircle, Pencil } from "lucide-react"
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
    if (isDirty) {
      setShowExitModal(true)
      return
    }
    router.push(`/${locale}/dashboard/resumes`)
  }

  async function handleModalSave() {
    setShowExitModal(false)
    if (hasAccess) {
      await save().catch(() => {})
      if (useResumeStore.getState().isDirty) {
        toast.error(t("save_error"))
        return
      }
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
    if (isDirty && hasAccess) {
      await save({ skipThumbnail: true }).catch(() => {})
    }
    setDownloadingPdf(true)
    try {
      const res = await apiFetch(`/api/resumes/${resumeId}/pdf?locale=${locale}`)
      if (!res.ok) {
        const key = res.status === 403 ? "print.error_pdf_403"
          : res.status === 429 ? "print.error_pdf_429"
          : res.status === 404 ? "print.error_pdf_404"
          : res.status >= 500 ? "print.error_pdf_500"
          : "print.error_pdf"
        toast.error(t(key))
        return
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

  const iconBtnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E2E8F0',
    background: '#FFFFFF',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  }

  const ghostBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    background: 'transparent',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E2E8F0',
    color: '#0B1B3D',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }

  const primaryBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    background: '#0B1B3D',
    color: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#0B1B3D',
    boxShadow: '0 4px 12px rgba(11,27,61,0.15)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }

  return (
    <header
      className="flex items-center justify-between border-b shrink-0 z-[100] relative px-3 sm:px-6"
      style={{
        height: 64,
        borderBottom: '1px solid #E2E8F0',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
        <button
          onClick={handleBack}
          aria-label="Back"
          style={iconBtnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F8FAFC'
            e.currentTarget.style.color = '#00E5FF'
            e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFFFF'
            e.currentTarget.style.color = '#475569'
            e.currentTarget.style.borderColor = '#E2E8F0'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <ArrowLeft size={18} />
        </button>

        {editing ? (
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
            className="max-w-[120px] sm:max-w-[260px]"
            style={{
              border: 'none',
              borderBottom: '2px solid #00E5FF',
              borderRadius: 0,
              background: 'transparent',
              fontSize: 15,
              fontWeight: 600,
              color: '#0B1B3D',
              outline: 'none',
              padding: '4px 0',
              height: 'auto',
              boxShadow: 'none',
            }}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="group truncate max-w-[110px] sm:max-w-[260px]"
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#0B1B3D',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
            }}
          >
            <span className="truncate">{title}</span>
            <Pencil
              size={14}
              style={{ color: '#00E5FF', opacity: 0.6, transition: 'opacity 0.2s ease' }}
              className="group-hover:!opacity-100"
            />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        {/* Share button */}
        {hasAccess && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleShare}
              disabled={togglingShare || !resumeId}
              aria-label={isPublic ? t("share.public") : t("share.button")}
              style={{
                ...ghostBtnStyle,
                ...(isPublic
                  ? { background: '#0B1B3D', color: '#FFFFFF', borderColor: '#0B1B3D' }
                  : {}),
                opacity: togglingShare || !resumeId ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (togglingShare || !resumeId) return
                if (!isPublic) {
                  e.currentTarget.style.borderColor = '#00E5FF'
                  e.currentTarget.style.color = '#00E5FF'
                  e.currentTarget.style.background = '#F8FAFC'
                }
              }}
              onMouseLeave={(e) => {
                if (!isPublic) {
                  e.currentTarget.style.borderColor = '#E2E8F0'
                  e.currentTarget.style.color = '#0B1B3D'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {togglingShare ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
              <span className="hidden sm:inline">{isPublic ? t("share.public") : t("share.button")}</span>
            </button>
            {isPublic && publicSlug && (
              <button
                onClick={handleCopyLink}
                title={t("share.copy_link")}
                aria-label={t("share.copy_link")}
                style={iconBtnStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F8FAFC'
                  e.currentTarget.style.color = '#00E5FF'
                  e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFFFFF'
                  e.currentTarget.style.color = '#475569'
                  e.currentTarget.style.borderColor = '#E2E8F0'
                }}
              >
                <Copy size={14} />
              </button>
            )}
            {isPublic && viewStats !== null && (
              <span
                className="hidden sm:flex items-center gap-1 px-2"
                style={{ fontSize: 12, color: '#475569' }}
                title={t("share.views_tooltip", { total: viewStats.total })}
              >
                <Eye size={12} />
                {viewStats.last7d}
              </span>
            )}
          </div>
        )}

        {/* Save status indicator */}
        {hasAccess ? (
          <button
            onClick={() => { if (isDirty && !isSaving) save().catch(() => {}) }}
            disabled={isSaving || !isDirty}
            className="flex items-center gap-1.5 disabled:cursor-default cursor-pointer"
            style={{
              fontSize: 12,
              padding: '6px 10px',
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              color: '#475569',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => { if (isDirty && !isSaving) e.currentTarget.style.background = '#F8FAFC' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            title={isDirty ? t("unsaved") : lastSaved ? t("saved") : ""}
          >
            {isSaving ? (
              <>
                <Loader2 size={12} className="animate-spin" style={{ color: '#475569' }} />
                <span className="hidden sm:inline">{t("saving")}</span>
              </>
            ) : isDirty ? (
              <>
                <AlertCircle size={12} style={{ color: '#f59e0b' }} />
                <span className="hidden sm:inline" style={{ color: '#d97706' }}>{t("unsaved")}</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle2 size={12} style={{ color: '#22c55e' }} />
                <span className="hidden sm:inline">
                  {t("saved_at", { time: lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })}
                </span>
              </>
            ) : null}
          </button>
        ) : (
          <button
            onClick={handleLockedClick}
            className="flex items-center gap-1.5 cursor-pointer"
            style={{
              fontSize: 12,
              padding: '6px 10px',
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              color: '#475569',
              opacity: 0.5,
            }}
          >
            <Lock size={12} />
            <span className="hidden sm:inline">{t("save")}</span>
          </button>
        )}

        {hasAccess ? (
          <button
            disabled={!resumeId || downloadingPdf}
            onClick={handleDownloadPdf}
            style={{
              ...primaryBtnStyle,
              opacity: !resumeId || downloadingPdf ? 0.7 : 1,
              cursor: !resumeId || downloadingPdf ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!resumeId || downloadingPdf) return
              e.currentTarget.style.background = '#1A365D'
              e.currentTarget.style.borderColor = '#1A365D'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0B1B3D'
              e.currentTarget.style.borderColor = '#0B1B3D'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {downloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span className="hidden sm:inline">
              {downloadingPdf ? t("download_generating_pdf") : t("print.print_pdf")}
            </span>
          </button>
        ) : (
          <button
            onClick={handleLockedClick}
            style={{ ...primaryBtnStyle, opacity: 0.5 }}
          >
            <Lock size={14} />
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
