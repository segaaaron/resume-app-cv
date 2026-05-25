"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Textarea } from "@/components/ui/textarea"

export default function HobbiesSection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )

  const [local, setLocal] = useState(sectionData.hobbies)
  const commitRef = useRef(updateSectionData)
  commitRef.current = updateSectionData

  useEffect(() => { setLocal(sectionData.hobbies) }, [sectionData.hobbies])

  return (
    <Textarea
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => commitRef.current("hobbies", local)}
      placeholder={t("hobbies_placeholder")}
      className="text-sm min-h-[80px] resize-none"
    />
  )
}
