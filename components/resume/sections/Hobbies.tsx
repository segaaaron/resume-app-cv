"use client"

import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { Textarea } from "@/components/ui/textarea"

export default function HobbiesSection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore()

  return (
    <Textarea
      value={sectionData.hobbies}
      onChange={(e) => updateSectionData("hobbies", e.target.value)}
      placeholder={t("hobbies_placeholder")}
      className="text-sm min-h-[80px] resize-none"
    />
  )
}
