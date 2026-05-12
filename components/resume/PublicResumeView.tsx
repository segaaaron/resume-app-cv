"use client"

import { useEffect, useRef } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import type { ResumeSection, ResumeSections, ResumeConfig } from "@/types/resume"
import ResumePreview from "./ResumePreview"
import { useTranslations } from "next-intl"

interface Props {
  title: string
  sections: ResumeSection[]
  sectionData: ResumeSections
  config: ResumeConfig
}

export default function PublicResumeView({ title, sections, sectionData, config }: Props) {
  const init = useResumeStore((s) => s.init)
  const t = useTranslations("public_cv")
  const propsRef = useRef({ title, sections, sectionData, config })
  propsRef.current = { title, sections, sectionData, config }

  useEffect(() => {
    const { title, sections, sectionData, config } = propsRef.current
    // Use empty string as resumeId since this is a public view (no editing)
    init("", title, sections, sectionData, config)
  }, [init])

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      {/* Branding banner */}
      <div className="w-full max-w-[210mm] mb-4 flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          {t("shared_via")}{" "}
          <span className="font-semibold text-primary">ReadyCV</span>
        </p>
        <a
          href="/"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          {t("create_cta")}
        </a>
      </div>

      {/* Resume */}
      <div className="shadow-2xl">
        <ResumePreview />
      </div>
    </div>
  )
}
