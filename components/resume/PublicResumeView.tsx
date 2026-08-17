"use client"

import Link from "next/link"
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
  // "Latest ref": the mount-only effect below needs the CURRENT props without listing
  // them as dependencies (that would re-init the store on every keystroke upstream).
  // Assigning inside an effect instead would give the effect the PREVIOUS render's props.
  const propsRef = useRef({ title, sections, sectionData, config })
  // eslint-disable-next-line react-hooks/refs
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
          <span className="font-semibold text-primary">Valhalla Resume</span>
        </p>
        <Link
          href="/"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          {t("create_cta")}
        </Link>
      </div>

      {/* Resume */}
      <div className="shadow-2xl">
        <ResumePreview />
      </div>
    </div>
  )
}
