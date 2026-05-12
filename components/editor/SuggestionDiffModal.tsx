"use client"

import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export type SuggestionField =
  | "summary"
  | "personalDetails.jobTitle"
  | "skills"
  | "workExperience.description"
  | "workExperience.jobTitle"
  | "languages"
  | "certifications"

export interface Suggestion {
  field: SuggestionField
  type: "replace" | "append"
  preview: string
  reason: string
  targetId?: string
}

interface SuggestionDiffModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  suggestion: Suggestion
  currentValue: string
}

const FIELD_KEYS: Record<SuggestionField, string> = {
  "summary": "field_summary",
  "personalDetails.jobTitle": "field_job_title",
  "skills": "field_skills",
  "workExperience.description": "field_work_description",
  "workExperience.jobTitle": "field_work_job_title",
  "languages": "field_languages",
  "certifications": "field_certifications",
}

export default function SuggestionDiffModal({
  open,
  onClose,
  onConfirm,
  suggestion,
  currentValue,
}: SuggestionDiffModalProps) {
  const t = useTranslations("editor.cv_review")

  const afterValue = suggestion.type === "append"
    ? [currentValue, suggestion.preview].filter(Boolean).join(" ")
    : suggestion.preview

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {t("diff_title")} — {t(FIELD_KEYS[suggestion.field])}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* Before */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t("diff_before")}</p>
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed min-h-[48px]">
              {currentValue || <span className="italic">{t("diff_empty")}</span>}
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* After */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{t("diff_after")}</p>
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/60 px-3 py-2.5 text-xs text-foreground leading-relaxed min-h-[48px]">
              {afterValue}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>{t("diff_cancel")}</Button>
          <Button size="sm" onClick={onConfirm} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {t("diff_confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
