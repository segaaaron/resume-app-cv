"use client"

import Link from "next/link"
import { useResumeStore } from "@/stores/resumeStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Download, Loader2, Lock, History, RotateCcw, Trash2, Share2, Copy } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Version { id: string; label: string | null; createdAt: string }

interface Props {
  hasAccess: boolean
}

export default function EditorTopBar({ hasAccess }: Props) {
  const { title, setTitle, save, isSaving, lastSaved, isDirty, resumeId, sectionData, sections, config } = useResumeStore()
  const [editing, setEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [versions, setVersions] = useState<Version[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [savingVersion, setSavingVersion] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [publicSlug, setPublicSlug] = useState<string | null>(null)
  const [togglingShare, setTogglingShare] = useState(false)
  const locale = useLocale()
  const t = useTranslations("editor")

  const fetchVersions = useCallback(async () => {
    if (!resumeId) return
    setLoadingVersions(true)
    try {
      const res = await fetch(`/api/resumes/versions?resumeId=${resumeId}`)
      const data = await res.json()
      setVersions(data.versions ?? [])
    } finally {
      setLoadingVersions(false)
    }
  }, [resumeId])

  useEffect(() => {
    if (showHistory) fetchVersions()
  }, [showHistory, fetchVersions])

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

  async function handleSaveVersion() {
    if (!resumeId) return
    setSavingVersion(true)
    try {
      const label = new Date().toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
      const snapshot = { title, sections, sectionData, config }
      const res = await fetch("/api/resumes/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, label, snapshot }),
      })
      if (res.status === 403) { toast.error(t("history.pro_only")); return }
      if (!res.ok) throw new Error()
      toast.success(t("history.saved"))
      fetchVersions()
    } catch {
      toast.error(t("history.error"))
    } finally {
      setSavingVersion(false)
    }
  }

  async function handleRestore(versionId: string) {
    const res = await fetch("/api/resumes/versions/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    })
    if (!res.ok) { toast.error(t("history.restore_error")); return }
    toast.success(t("history.restore_success"))
    setTimeout(() => window.location.reload(), 800)
  }

  async function handleDeleteVersion(id: string) {
    await fetch(`/api/resumes/versions?id=${id}`, { method: "DELETE" })
    setVersions((prev) => prev.filter((v) => v.id !== id))
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

  return (
    <header className="h-12 bg-white border-b border-border flex items-center justify-between px-4 gap-4 shrink-0 relative">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href={`/${locale}/dashboard/resumes`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
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
        {/* Save status — only show while actively saving */}
        {isSaving && (
          <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> {t("saving")}
          </span>
        )}

        {/* History button — Pro only */}
        {hasAccess && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setShowHistory((v) => !v)}
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">{t("history.button")}</span>
          </Button>
        )}

        {/* Share button */}
        {hasAccess && (
          <div className="flex items-center gap-1">
            <Button
              variant={isPublic ? "default" : "outline"}
              size="sm"
              className={`gap-1.5 ${isPublic ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""}`}
              onClick={handleToggleShare}
              disabled={togglingShare || !resumeId}
            >
              {togglingShare ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline text-xs">{isPublic ? t("share.public") : t("share.button")}</span>
            </Button>
            {isPublic && publicSlug && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyLink} title={t("share.copy_link")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        {hasAccess ? (
          <Button variant="outline" size="sm" onClick={() => save()} disabled={isSaving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {t("save")}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={handleLockedClick} className="gap-1.5 opacity-50">
            <Lock className="h-3.5 w-3.5" />
            {t("save")}
          </Button>
        )}

        {hasAccess ? (
          <Button size="sm" className="gap-1.5" disabled={!resumeId} asChild>
            <a href={resumeId ? `/${locale}/resume/${resumeId}/print` : "#"} target="_blank">
              <Download className="h-3.5 w-3.5" />
              PDF
            </a>
          </Button>
        ) : (
          <Button size="sm" onClick={handleLockedClick} className="gap-1.5 opacity-50">
            <Lock className="h-3.5 w-3.5" />
            PDF
          </Button>
        )}
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="absolute top-12 right-4 z-50 w-80 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">{t("history.title")}</p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={handleSaveVersion}
              disabled={savingVersion}
            >
              {savingVersion ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              {t("history.save_version")}
            </Button>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-border">
            {loadingVersions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : versions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground px-4">
                <History className="h-6 w-6 mx-auto mb-2 opacity-40" />
                {t("history.empty")}<br />
                <span className="text-xs">{t("history.empty_hint")}</span>
              </div>
            ) : (
              versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors">
                  <div>
                    <p className="text-xs font-medium">{v.label ?? "—"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(v.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRestore(v.id)}
                      className="p-1.5 rounded hover:bg-indigo-50 text-indigo-600 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteVersion(v.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-border">
            <p className="text-[11px] text-muted-foreground text-center">{t("history.max_note")}</p>
          </div>
        </div>
      )}
    </header>
  )
}
