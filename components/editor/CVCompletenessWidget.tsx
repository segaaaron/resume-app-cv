"use client"

import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { useTranslations } from "next-intl"
import { scoreBand } from "@/lib/ats/report"

interface SectionScore {
  labelKey: string
  weight: number
  score: number
}

function computeSections(sectionData: Record<string, unknown>): SectionScore[] {
  const pd = sectionData.personalDetails as Record<string, string> | undefined
  const hasContact = !!(pd?.firstName && pd?.lastName && pd?.email)
  const contactScore = hasContact ? 100 : (pd?.firstName || pd?.email ? 50 : 0)

  const summary = sectionData.summary as string | undefined
  const summaryScore = !summary ? 0 : summary.length >= 120 ? 100 : summary.length >= 60 ? 60 : 30

  const work = (sectionData.workExperience ?? []) as { jobTitle?: string; employer?: string; description?: string }[]
  let workScore = 0
  if (work.length === 0) workScore = 0
  else if (work.length >= 2) workScore = 100
  else workScore = 60
  const workWithDesc = work.filter((j) => j.description && j.description.trim().length > 30).length
  if (work.length > 0 && workWithDesc / work.length >= 0.5) workScore = Math.min(100, workScore + 20)

  const edu = (sectionData.education ?? []) as { degree?: string }[]
  const educationScore = edu.length >= 1 ? 100 : 0

  const skills = (sectionData.skills ?? []) as { name?: string }[]
  const validSkills = skills.filter((s) => s.name?.trim())
  const skillsScore = validSkills.length >= 8 ? 100 : validSkills.length >= 5 ? 70 : validSkills.length >= 3 ? 40 : validSkills.length > 0 ? 20 : 0

  const certs = (sectionData.certifications ?? []) as unknown[]
  const projects = (sectionData.projects ?? []) as unknown[]
  const langs = (sectionData.languages ?? []) as unknown[]
  const othersScore = (certs.length > 0 ? 40 : 0) + (projects.length > 0 ? 40 : 0) + (langs.length > 0 ? 20 : 0)

  return [
    { labelKey: "completeness.work", weight: 35, score: workScore },
    { labelKey: "completeness.summary", weight: 20, score: summaryScore },
    { labelKey: "completeness.skills", weight: 15, score: skillsScore },
    { labelKey: "completeness.contact", weight: 10, score: contactScore },
    { labelKey: "completeness.education", weight: 10, score: educationScore },
    { labelKey: "completeness.others", weight: 10, score: Math.min(100, othersScore) },
  ]
}

/**
 * El semáforo lo decide `scoreBand`, el único dueño de la regla del CEO.
 *
 * Acá vivía una tercera copia de los umbrales, y encima con hex crudos en vez de
 * los tokens del panel: el mismo 60% se pintaba con un amarillo distinto según
 * qué pantalla lo mostrara.
 */
const BAND_COLOR = { ok: "#10B981", warn: "#F59E0B", bad: "#EF4444" } as const

function getColor(pct: number): string {
  return BAND_COLOR[scoreBand(pct)]
}

export default function CVCompletenessWidget() {
  const t = useTranslations("editor")
  const sectionData = useResumeStore(useShallow((s) => s.sectionData))
  const sections = computeSections(sectionData)
  const overall = Math.round(sections.reduce((acc, s) => acc + s.score * s.weight, 0) / 100)
  const color = getColor(overall)
  const circumference = 2 * Math.PI * 22
  const offset = circumference * (1 - overall / 100)

  return (
    <div
      className="mb-4 rounded-xl p-3.5 border"
      style={{
        background: "linear-gradient(135deg, rgba(240,248,255,0.9) 0%, rgba(232,244,251,0.7) 100%)",
        borderColor: "rgba(0,212,255,0.18)",
        boxShadow: "0 2px 12px rgba(0,212,255,0.08)",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        {/* Ring */}
        <div className="relative shrink-0 w-12 h-12">
          <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
            <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(0,212,255,0.12)" strokeWidth="4" />
            <circle
              cx="24" cy="24" r="22" fill="none"
              stroke={color} strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black" style={{ color }}>
            {overall}%
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-bold text-[#1a2e4a] leading-tight">{t("completeness.title")}</p>
          <p className="text-[10.5px] text-[#7A9BB5] mt-0.5">{t("completeness.subtitle")}</p>
        </div>
      </div>

      {/* Section bars */}
      <div className="space-y-1.5">
        {sections.map((s) => (
          <div key={s.labelKey} className="flex items-center gap-2">
            <span className="text-[10px] text-[#7A9BB5] w-[80px] shrink-0 truncate">{t(s.labelKey)}</span>
            <div className="flex-1 h-1.5 rounded-full bg-[rgba(0,212,255,0.1)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${s.score}%`, background: getColor(s.score) }}
              />
            </div>
            <span className="text-[9.5px] font-semibold w-7 text-right shrink-0" style={{ color: getColor(s.score) }}>
              {s.score}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
