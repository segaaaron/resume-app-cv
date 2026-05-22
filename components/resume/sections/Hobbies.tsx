"use client"

import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Textarea } from "@/components/ui/textarea"

export default function HobbiesSection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )

  return (
    <Textarea
      value={sectionData.hobbies}
      onChange={(e) => updateSectionData("hobbies", e.target.value)}
      placeholder={t("hobbies_placeholder")}
      className="text-sm min-h-[80px] resize-none"
    />
  )
}
