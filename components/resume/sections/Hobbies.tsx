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
  // Latest-ref for the commit handler: the blur must call the CURRENT onChange, and the
  // component holds local text state so the handler cannot be a dependency.
  // eslint-disable-next-line react-hooks/refs
  const commitRef = useRef(updateSectionData)
  // eslint-disable-next-line react-hooks/refs
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
