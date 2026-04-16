"use client"

import { useEffect, useRef } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import type { ResumeSection, ResumeSections, ResumeConfig } from "@/types/resume"
import FormPanel from "./FormPanel"
import PreviewPanel from "./PreviewPanel"
import EditorTopBar from "./EditorTopBar"

interface Props {
  resumeId: string
  title: string
  sections: ResumeSection[]
  sectionData: ResumeSections
  config: ResumeConfig
}

export default function EditorLayout({ resumeId, title, sections, sectionData, config }: Props) {
  const init = useResumeStore((s) => s.init)
  // Use a ref so we always call init with the latest server-provided data,
  // even if the same resumeId is re-mounted after navigating away and back.
  const propsRef = useRef({ resumeId, title, sections, sectionData, config })
  propsRef.current = { resumeId, title, sections, sectionData, config }

  useEffect(() => {
    const { resumeId, title, sections, sectionData, config } = propsRef.current
    init(resumeId, title, sections, sectionData, config)
  }, [resumeId, init])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <EditorTopBar />
      <div className="flex flex-1 overflow-hidden">
        <FormPanel />
        <PreviewPanel />
      </div>
    </div>
  )
}
