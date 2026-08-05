"use client"

import { useMemo } from "react"
import { useLocale } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { detectCvLanguage } from "@/lib/resume/cv-language"

/**
 * The language every AI call in the editor must WRITE IN: the CV's own language,
 * detected from its prose, falling back to the app locale while the CV is still
 * too short to judge.
 *
 * Single owner of that decision — before this, each call site sent `locale`, so
 * an English CV edited in the Spanish UI got Spanish rewrites welded into it.
 * Detection is deterministic and pure (no LLM, no request), so recomputing it on
 * every edit is free.
 */
export function useCvLanguage(): "es" | "en" {
  const appLocale = useLocale() === "en" ? "en" : "es"
  const { sectionData } = useResumeStore(useShallow((s) => ({ sectionData: s.sectionData })))
  return useMemo(() => detectCvLanguage(sectionData, appLocale), [sectionData, appLocale])
}
