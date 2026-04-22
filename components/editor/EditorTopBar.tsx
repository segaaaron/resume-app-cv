"use client"

import Link from "next/link"
import { useResumeStore } from "@/stores/resumeStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Download, Loader2, Check, Lock } from "lucide-react"
import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

interface Props {
  hasAccess: boolean
}

export default function EditorTopBar({ hasAccess }: Props) {
  const { title, setTitle, save, isSaving, lastSaved, isDirty, resumeId } = useResumeStore()
  const [editing, setEditing] = useState(false)
  const locale = useLocale()
  const t = useTranslations("editor")

  function handleLockedClick() {
    toast.error(t("pro_required"), {
      action: {
        label: t("see_plans"),
        onClick: () => { window.location.href = `/${locale}/pricing` },
      },
    })
  }

  return (
    <header className="h-12 bg-white border-b border-border flex items-center justify-between px-4 gap-4 shrink-0">
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
        {/* Save status */}
        <span className="text-xs text-muted-foreground hidden sm:block">
          {isSaving ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> {t("saving")}
            </span>
          ) : isDirty ? (
            t("unsaved")
          ) : lastSaved ? (
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" /> {t("saved")}
            </span>
          ) : null}
        </span>

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
    </header>
  )
}
