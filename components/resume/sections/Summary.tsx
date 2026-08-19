"use client"

// The professional summary: a text box, and nothing else.
//
// This section used to carry three AI buttons — generate, improve, and a
// "describe your profile" box that fed the same endpoint. All three are gone,
// in that order, and the reason is the same each time: the CV now has two
// places that write a summary, and a third door is a third thing to keep in
// step rather than a third capability.
//
//   · writing one from nothing → the AI assistant, which asks for the material
//     first instead of guessing at an empty CV
//   · rewriting one that exists → the ATS report, which calls the very same
//     improve-summary engine and shows the rewrite as a diff against what is
//     already there, next to the score it moves
//
// What stays here is the thing only this tab does: let someone type.

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"

export default function SummarySection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )
  // Typed text is local until blur, so the store is not written on every
  // keystroke. What the store holds still wins whenever it changes underneath —
  // the AI assistant and the ATS report both write this field.
  //
  // Adjust-during-render rather than an effect: syncing state from props inside
  // an effect renders the stale text first and then replaces it, and the
  // project's lint rules reject it for exactly that reason.
  const stored = (sectionData.summary as string) ?? ""
  const [local, setLocal] = useState(stored)
  const [mirror, setMirror] = useState(stored)
  if (stored !== mirror) {
    setMirror(stored)
    setLocal(stored)
  }

  const charCount = local.length

  return (
    <div className="space-y-3">
      <div>
        <textarea
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={(e) => {
            updateSectionData("summary", local)
            e.currentTarget.style.borderColor = "rgba(0,212,255,0.2)"
            e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.03)"
          }}
          placeholder={t("summary_placeholder")}
          rows={6}
          className="w-full resize-none text-[13px] leading-relaxed text-[#1a2e4a] placeholder:text-slate-400 outline-none transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, rgba(240,248,255,0.8) 0%, rgba(232,244,251,0.6) 100%)",
            border: "1.5px solid rgba(0,212,255,0.2)",
            borderRadius: 12,
            padding: "12px 14px",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.03)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,212,255,0.5)"
            e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.03), 0 0 0 3px rgba(0,212,255,0.08)"
          }}
        />
        <div className="flex justify-end mt-1 pr-1">
          {/* Over ~1000 characters a summary stops being a summary; the counter
              turns amber rather than blocking, because it is a guideline. */}
          <span
            className="text-[10px] font-medium tabular-nums"
            style={{ color: charCount > 1000 ? "#F59E0B" : "#94A3B8" }}
          >
            {charCount}
          </span>
        </div>
      </div>
    </div>
  )
}
