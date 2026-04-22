"use client"

import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { Textarea } from "@/components/ui/textarea"

export default function SummarySection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore()

  return (
    <div>
      <Textarea
        value={sectionData.summary}
        onChange={(e) => updateSectionData("summary", e.target.value)}
        placeholder={t("summary_placeholder")}
        className="text-sm min-h-[120px] resize-none"
      />
      <p className="text-xs text-muted-foreground mt-1 text-right">
        {sectionData.summary.length} caracteres
      </p>
    </div>
  )
}
