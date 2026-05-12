"use client"

import { useRouter } from "next/navigation"
import { useResumeStore } from "@/stores/resumeStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Download, Loader2, Lock, Share2, Copy, Eye, CheckCircle2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import UnsavedChangesModal from "./UnsavedChangesModal"

interface Props {
  hasAccess: boolean
}

export default function EditorTopBar({ hasAccess }: Props) {
  const router = useRouter()
  const { title, setTitle, save, isSaving, lastSaved, isDirty, resumeId } = useResumeStore()
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
    fetch(`/api/resumes/${resumeId}`)
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
    fetch(`/api/resumes/views?resumeId=${resumeId}`)
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
        toast.error(t("save_error") ?? "Error al guardar")
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
      const res = await fetch("/api/resumes/share", {
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
      await save().catch(() => {})
    }
    setDownloadingPdf(true)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/pdf?locale=${locale}`)
      if (!res.ok) { toast.error(t("print.error_pdf")); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title || "resume"}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t("print.error_pdf"))
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 gap-4 shrink-0 relative">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {editing ? (
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
            className="h-7 text-sm font-medium max-w-[200px]"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium truncate hover:text-primary transition-colors max-w-[200px]"
          >
            {title}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Share button */}
        {hasAccess && (
          <div className="flex items-center gap-1">
            <Button
              variant={isPublic ? "default" : "outline"}
              size="sm"
              className={`gap-1.5 ${isPublic ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""}`}
              onClick={handleToggleShare}
              disabled={togglingShare || !resumeId}
              aria-label={isPublic ? t("share.public") : t("share.button")}
            >
              {togglingShare ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline text-xs">{isPublic ? t("share.public") : t("share.button")}</span>
            </Button>
            {isPublic && publicSlug && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyLink} title={t("share.copy_link")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
            {isPublic && viewStats !== null && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground px-1" title={t("share.views_tooltip", { total: viewStats.total })}>
                <Eye className="h-3 w-3" />
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
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors disabled:cursor-default cursor-pointer hover:bg-neutral-100"
            title={isDirty ? t("unsaved") : lastSaved ? t("saved") : ""}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="hidden sm:inline text-muted-foreground">{t("saving")}</span>
              </>
            ) : isDirty ? (
              <>
                <AlertCircle className="h-3 w-3 text-amber-500" />
                <span className="hidden sm:inline text-amber-600 hover:text-amber-700">{t("unsaved")}</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="hidden sm:inline text-muted-foreground">
                  {t("saved_at", { time: lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })}
                </span>
              </>
            ) : null}
          </button>
        ) : (
          <button
            onClick={handleLockedClick}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md opacity-50 cursor-pointer"
          >
            <Lock className="h-3 w-3" />
            <span className="hidden sm:inline">{t("save")}</span>
          </button>
        )}

        {hasAccess ? (
          <Button size="sm" className="gap-1.5" disabled={!resumeId || downloadingPdf} onClick={handleDownloadPdf}>
            {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {downloadingPdf ? t("download_generating_pdf") : t("print.print_pdf")}
          </Button>
        ) : (
          <Button size="sm" onClick={handleLockedClick} className="gap-1.5 opacity-50">
            <Lock className="h-3.5 w-3.5" />
            {t("print.print_pdf")}
          </Button>
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
