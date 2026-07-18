"use client"

// components/editor/ProvenSkillsCard.tsx
// Additive, deterministic. Reads the candidate's experience + skills from the
// store, runs findProvenUnlistedSkills (pure, vocabulary-backed, no model), and
// surfaces skills they already demonstrated but never listed — one tap to add.
// Positive framing: this is a win the candidate earned, not a warning. Every
// suggestion is proven by their own writing, so it can never stuff or invent.

import { useMemo } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { useTranslations } from "next-intl"
import { BadgeCheck, Plus } from "lucide-react"
import { nanoid } from "nanoid"
import { findProvenUnlistedSkills } from "@/lib/services/ai/shared/proven-skills"
import type { SkillItem } from "@/types/resume"

interface WorkItem {
  description?: string
}

export default function ProvenSkillsCard() {
  const t = useTranslations("editor.proven_skills")
  const { workExperience, skills, updateSectionData } = useResumeStore(
    useShallow((s) => ({
      workExperience: s.sectionData.workExperience as WorkItem[] | undefined,
      skills: s.sectionData.skills as { name?: string }[] | undefined,
      updateSectionData: s.updateSectionData,
    }))
  )
  // Pure derived state from the store — the resume store is client-populated, so
  // SSR sees an empty store and this renders nothing until real data arrives.
  const suggestions = useMemo(() => {
    const expText = (workExperience ?? []).map((w) => w.description ?? "").join("  \n")
    const listed = (skills ?? []).map((s) => s.name ?? "").filter(Boolean)
    return findProvenUnlistedSkills(expText, listed)
  }, [workExperience, skills])

  if (suggestions.length === 0) return null

  // Adding writes into Skills; the store update re-runs the effect, which drops
  // the now-listed skill — so the chip disappears on its own, no local bookkeeping.
  function add(name: string) {
    const existing = (skills ?? []) as SkillItem[]
    updateSectionData("skills", [
      ...existing,
      { id: nanoid(), name, level: "intermediate" as const },
    ])
  }

  return (
    <div
      className="mb-4 rounded-xl p-3.5 border"
      style={{
        background: "linear-gradient(135deg, rgba(236,253,245,0.92) 0%, rgba(240,253,250,0.72) 100%)",
        borderColor: "rgba(16,185,129,0.22)",
        boxShadow: "0 2px 12px rgba(16,185,129,0.08)",
      }}
    >
      <div className="flex items-center gap-3 mb-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
            boxShadow: "0 2px 8px rgba(16,185,129,0.28)",
          }}
        >
          <BadgeCheck className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-bold text-[#1a2e4a] leading-tight">{t("title")}</p>
          <p className="text-[10.5px] text-[#2F8768] mt-0.5">{t("subtitle")}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => add(name)}
            className="flex items-center gap-1 text-[10.5px] font-semibold rounded-full px-2.5 py-1 bg-white/70 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 hover:ring-emerald-300 transition-all cursor-pointer"
          >
            <Plus className="h-2.5 w-2.5" />
            {name}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-[#2F8768]/80 mt-2 leading-relaxed">{t("hint")}</p>
    </div>
  )
}
