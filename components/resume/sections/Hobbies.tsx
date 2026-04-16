"use client"

import { useResumeStore } from "@/stores/resumeStore"
import { Textarea } from "@/components/ui/textarea"

export default function HobbiesSection() {
  const { sectionData, updateSectionData } = useResumeStore()

  return (
    <Textarea
      value={sectionData.hobbies}
      onChange={(e) => updateSectionData("hobbies", e.target.value)}
      placeholder="ej: Fotografía, senderismo, lectura de ciencia ficción, programación de proyectos personales..."
      className="text-sm min-h-[80px] resize-none"
    />
  )
}
