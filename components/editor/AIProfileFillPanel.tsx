"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Sparkles, ChevronDown } from "lucide-react"
import AIProfileInterview from "./AIProfileInterview"

export default function AIProfileFillPanel({ inTab = false }: { inTab?: boolean }) {
  const t = useTranslations("editor.ai_profile_fill")
  // Only the résumé id, and only to key the interview: what is missing is the
  // interview's business now, so the panel has no reason to read the CV.
  const resumeId = useResumeStore(useShallow((s) => s.resumeId))
  const [expanded, setExpanded] = useState(inTab)

  // What is left to ask is computed in ONE place, inside the interview.
  //
  // It used to be computed here as well, and the two disagreed: the interview
  // subtracts what the user has waved off ("no more jobs", "no more bullets")
  // and the panel did not. So the interview finished and rendered nothing while
  // the panel still believed work remained and withheld the finished card —
  // leaving the tab completely blank.
  return (
    <>
      <div
        className={inTab ? undefined : "ai-assistant-card"}
        style={inTab ? { padding: '0 0 18px' } : {
          margin: '16px 24px 20px', borderRadius: 16, overflow: 'hidden',
          border: '1.5px solid transparent',
          background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #8B5CF6, #06B6D4) border-box',
          boxShadow: '0 4px 20px rgba(139,92,246,0.08)',
        }}
      >
        {/* Header */}
        {inTab ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0 16px', borderBottom: '1px solid rgba(139,92,246,0.12)', marginBottom: 16 }}>
            <div className="ai-assistant-icon-anim" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', letterSpacing: '-0.01em' }}>{t("title")}</span>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', color: '#FFF', padding: '2px 7px', borderRadius: 20 }}>PRO</span>
              </div>
              <p style={{ fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 1.4 }}>{t("description")}</p>
            </div>
          </div>
        ) : (
          <div onClick={() => setExpanded(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', userSelect: 'none', background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(6,182,212,0.06) 100%)' }}>
            <div className="ai-assistant-icon-anim" style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', flexShrink: 0 }}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1e1b4b', letterSpacing: '-0.01em' }}>{t("title")}</span>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', color: '#FFF', padding: '2px 7px', borderRadius: 20 }}>PRO</span>
            </div>
            <ChevronDown className="h-4 w-4" style={{ color: '#8B5CF6', transition: 'transform 0.3s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </div>
        )}

        {/* Content — always shown in tab, gated by expanded in sidebar */}
        {(inTab || expanded) && (
          <div style={{ padding: inTab ? '0' : '0 16px 18px' }}>
            {!inTab && <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, marginBottom: 14 }}>{t("description")}</p>}

          {/* The questions: what the model could not know, one at a time, in
              the order that improves the CV most. */}
          {/* Keyed on the résumé: navigating from one CV to another keeps this
              component mounted in the same tree position, so its local state —
              the answer half-typed into the first question — survived into the
              next CV and showed up prefilled on a document that never had it. */}
          <AIProfileInterview key={resumeId ?? "none"} />
      </div>
        )}
      </div>
    </>
  )
}
