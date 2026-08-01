"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { Upload, Loader2, FileText, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { track } from "@/lib/analytics/track"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"

interface Props {
  /**
   * Plan does not include import. The button stays VISIBLE and CLICKABLE and opens
   * the upgrade modal — it used to render `disabled`, which is a dead end: the user
   * sees a feature they cannot reach and is told nothing about how to get it. A
   * locked control that explains itself is the funnel; a greyed one is a wall.
   */
  locked?: boolean
}

export default function ImportResumeButton({ locked }: Props) {
  const t = useTranslations("dashboard.resumes")
  const locale = useLocale()
  const router = useRouter()
  const { open: openUpgradeModal } = useUpgradeModal()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  /** Locked plans never reach the file picker — asking for a file we will refuse
   *  wastes the user's upload and delivers the paywall as an error. Sell first. */
  function handleClick() {
    if (uploading) return
    if (locked) {
      openUpgradeModal("pro-feature", { feature: t("import_button") })
      return
    }
    inputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (locked) return
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    handleUpload(f)
  }

  async function handleUpload(f: File) {
    setUploading(true)
    const formData = new FormData()
    formData.append("file", f)

    try {
      const res = await apiFetch("/api/resumes/import", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        // Plan can't import (UNSUBSCRIBED) → funnel to upgrade, not a raw error.
        if (res.status === 403 && data?.error === "import_requires_upgrade") {
          openUpgradeModal("pro-feature", { feature: t("import_button") })
          setFile(null)
          return
        }
        // Never surface the raw error code — prefer the server message, else a friendly string.
        toast.error(typeof data?.message === "string" ? data.message : t("import_error"))
        setFile(null)
        return
      }

      track("resume_imported", { format: /\.docx?$/i.test(f.name) ? "docx" : "pdf" })
      toast.success(t("import_success"))
      if (data.truncated) {
        toast.warning(t("import_truncated"), { duration: 12_000 })
      }
      router.push(`/${locale}/editor/${data.id}`)
    } catch {
      toast.error(t("import_error"))
      setFile(null)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        className="hidden"
        onChange={handleFileChange}
      />

      <Button
        variant="outline"
        onClick={handleClick}
        disabled={uploading}
        className="gap-2"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {file ? t("import_analyzing_file", { name: file.name }) : t("import_processing")}
          </>
        ) : (
          <>
            {/* Lock instead of Upload when gated — the control must LOOK gated, or
                the upgrade modal reads as a bait-and-switch. */}
            {locked ? <Lock className="h-4 w-4 text-primary/70" /> : <Upload className="h-4 w-4" />}
            {t("import_button")}
          </>
        )}
      </Button>

      {uploading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full mx-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 mb-1">{t("import_overlay_title")}</p>
              <p className="text-sm text-muted-foreground">
                {t("import_overlay_desc")}
              </p>
              {file && (
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px] mx-auto">
                  {file.name}
                </p>
              )}
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
      )}
    </>
  )
}
