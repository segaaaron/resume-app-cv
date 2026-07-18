"use client"

// components/editor/EmploymentGapAdvisory.tsx
// Additive, deterministic coaching card. Reads work experience from the store,
// runs the pure findEmploymentGaps() over the dates already there, and — only
// when a gap ≥6 months exists — surfaces it as a recruiter-context nudge.
// No model, no API call, no score impact. Framed as "here's how to address it",
// never as a penalty (evidence: Kroft QJE 2013 + HBS Hidden Workers 2021).

import { useMemo } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { useTranslations } from "next-intl"
import { Lightbulb } from "lucide-react"
import { findEmploymentGaps, type EmploymentGap } from "@/lib/services/ai/shared/employment-gaps"

interface WorkItem {
  employer?: string
  startDate?: string
  endDate?: string
  currentlyWorking?: boolean
}

export default function EmploymentGapAdvisory() {
  const t = useTranslations("editor.employment_gap")
  const workExperience = useResumeStore(
    useShallow((s) => s.sectionData.workExperience as WorkItem[] | undefined)
  )
  // Pure derived state from the store. The resume store is client-populated, so
  // SSR sees an empty store and this renders nothing until real data arrives —
  // the "now"-dependent trailing gap is therefore only computed client-side.
  const gaps = useMemo(() => {
    const jobs = (workExperience ?? []).map((j) => ({
      employer: j.employer,
      startDate: j.startDate,
      endDate: j.endDate,
      currentlyWorking: j.currentlyWorking,
    }))
    return findEmploymentGaps(jobs, new Date())
  }, [workExperience])

  if (gaps.length === 0) return null

  function describe(g: EmploymentGap): string {
    const after = g.afterEmployer?.trim()
    const before = g.beforeEmployer?.trim()
    if (after && before) return t("between", { months: g.months, after, before })
    if (after) return t("since", { months: g.months, after })
    if (before) return t("before", { months: g.months, before })
    return t("generic", { months: g.months })
  }

  return (
    <div
      className="mb-4 rounded-xl p-3.5 border"
      style={{
        background: "linear-gradient(135deg, rgba(255,251,235,0.92) 0%, rgba(255,247,237,0.72) 100%)",
        borderColor: "rgba(245,158,11,0.22)",
        boxShadow: "0 2px 12px rgba(245,158,11,0.08)",
      }}
    >
      <div className="flex items-center gap-3 mb-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
            boxShadow: "0 2px 8px rgba(245,158,11,0.28)",
          }}
        >
          <Lightbulb className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-bold text-[#1a2e4a] leading-tight">{t("title")}</p>
          <p className="text-[10.5px] text-[#B78A2E] mt-0.5">{t("subtitle")}</p>
        </div>
      </div>

      <ul className="space-y-1.5 mb-2.5">
        {gaps.map((g, i) => (
          <li key={i} className="flex items-start gap-2 text-[11px] text-[#7A5B1E] leading-relaxed">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: "#F59E0B" }}
            />
            <span className="font-semibold text-[#5C4310]">{describe(g)}</span>
          </li>
        ))}
      </ul>

      <div className="rounded-lg bg-white/55 px-3 py-2 border border-amber-100/70">
        <p className="text-[10.5px] text-[#7A5B1E] leading-relaxed">{t("advice")}</p>
      </div>
    </div>
  )
}
