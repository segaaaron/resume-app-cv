"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Check, Sparkles, Plus } from "lucide-react"

export interface SuggestedSkill {
  name: string
  level: string
}

interface Props {
  open: boolean
  onClose: () => void
  suggestions: SuggestedSkill[]
  onAddSkill: (skill: SuggestedSkill) => void
  onAddAll: () => void
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  beginner:     { bg: "rgba(148,163,184,0.15)", text: "#64748B", border: "rgba(148,163,184,0.3)" },
  intermediate: { bg: "rgba(0,212,255,0.1)",   text: "#0891B2", border: "rgba(0,212,255,0.3)" },
  advanced:     { bg: "rgba(124,58,237,0.1)",  text: "#7C3AED", border: "rgba(124,58,237,0.3)" },
  expert:       { bg: "rgba(245,158,11,0.1)",  text: "#D97706", border: "rgba(245,158,11,0.3)" },
}

export default function SkillsSuggestionModal({
  open,
  onClose,
  suggestions,
  onAddSkill,
  onAddAll,
}: Props) {
  const t = useTranslations("editor.sections_form")
  const ai = useTranslations("editor.ai")
  const [added, setAdded] = useState<Set<number>>(new Set())

  function handleAddOne(i: number) {
    onAddSkill(suggestions[i])
    setAdded((prev) => new Set(prev).add(i))
  }

  function handleAddAll() {
    onAddAll()
    setAdded(new Set(suggestions.map((_, i) => i)))
  }

  const allAdded = suggestions.length > 0 && added.size === suggestions.length

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setAdded(new Set()); onClose() } }}>
      <DialogContent className="p-0 overflow-hidden rounded-2xl max-w-[520px] w-[calc(100vw-2rem)] sm:w-[95vw] border border-[#D9E1ED] shadow-[0_40px_100px_rgba(0,212,255,0.08)] gap-0">

        {/* Header */}
        <div className="relative px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-[#E8EDF6] bg-gradient-to-b from-[#F5F7FB] to-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-60" />
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 mt-0.5"
              style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(0,168,204,0.04) 100%)", border: "1px solid rgba(0,212,255,0.25)", color: "#00D4FF" }}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-[#1a2e4a] tracking-tight leading-tight">
                {ai("skills_suggested_title")}
              </h2>
              <p className="text-[11px] text-[#6B7A8C] mt-0.5 leading-snug">
                {ai("skills_suggested_subtitle", { count: suggestions.length })}
              </p>
            </div>
          </div>
        </div>

        {/* Skills list */}
        <div className="overflow-y-auto max-h-[52vh] sm:max-h-[56vh] px-5 sm:px-7 py-4 space-y-2.5 bg-white">
          {suggestions.map((skill, i) => {
            const KNOWN_LEVELS = ["beginner", "intermediate", "advanced", "expert"]
            const safeLevel = KNOWN_LEVELS.includes(skill.level) ? skill.level : "intermediate"
            const colors = LEVEL_COLORS[safeLevel]
            const isAdded = added.has(i)
            return (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl transition-all duration-200"
                style={{
                  border: isAdded ? "1px solid rgba(16,185,129,0.35)" : "1px solid #E2E8F0",
                  background: isAdded ? "rgba(16,185,129,0.04)" : "#FAFBFC",
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-black shrink-0"
                    style={{
                      background: isAdded
                        ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                        : "linear-gradient(135deg, #1a2e4a 0%, #243d5c 100%)",
                      color: "#fff",
                    }}
                  >
                    {isAdded ? <Check className="w-2.5 h-2.5" /> : i + 1}
                  </span>
                  <span className="text-[13px] font-semibold text-[#1a2e4a] truncate">{skill.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Level badge */}
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                  >
                    {t(`skills.${safeLevel}`)}
                  </span>

                  {/* Add button */}
                  {isAdded ? (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {ai("skill_added")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddOne(i)}
                      className="flex items-center gap-1 px-3 py-2.5 rounded-full text-[11px] font-bold cursor-pointer transition-all duration-150 border-none min-h-[44px] sm:min-h-[36px]"
                      style={{
                        background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                        color: "#fff",
                        boxShadow: "0 2px 6px rgba(16,185,129,0.25)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(16,185,129,0.4)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 6px rgba(16,185,129,0.25)" }}
                    >
                      <Plus className="w-3 h-3" />
                      {ai("skill_add_this")}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex gap-2 sm:gap-2.5 px-5 sm:px-7 pt-3 pb-5 border-t border-[#E8EDF6] bg-white">
          <button
            type="button"
            onClick={() => { setAdded(new Set()); onClose() }}
            className="flex-1 flex justify-center items-center px-3 py-3 text-[13px] font-medium rounded-xl border border-[#E2E8F0] bg-white text-[#6B7A8C] cursor-pointer transition-all duration-150 hover:border-[#CBD5E1] hover:text-[#1a2e4a] min-h-[44px]"
          >
            {ai("cancel")}
          </button>
          <button
            type="button"
            onClick={handleAddAll}
            disabled={allAdded}
            className="flex-1 flex justify-center items-center gap-1.5 px-3 py-3 text-[13px] font-semibold rounded-xl border-none cursor-pointer transition-all duration-150 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: allAdded
                ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                : "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
              color: allAdded ? "#fff" : "#0a1a35",
              boxShadow: allAdded ? "0 2px 8px rgba(16,185,129,0.3)" : "0 2px 8px rgba(0,212,255,0.25)",
            }}
          >
            {allAdded
              ? <><Check className="w-3.5 h-3.5" />{ai("skills_all_added")}</>
              : ai("skills_add_all")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
