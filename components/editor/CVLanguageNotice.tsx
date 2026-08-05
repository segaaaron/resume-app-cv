"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { detectLanguage } from "@/lib/services/ai/shared/translate-fields"
import { Languages, X } from "lucide-react"

// Enough prose to judge the language from — below this a near-empty CV would be
// classified on almost no signal (and the detector defaults to Spanish on a tie).
const MIN_CHARS = 60

/**
 * Warns when the CV is written in one language but the app UI is in the other,
 * so the user knows the AI suggestions/rewrites come in the APP's language — an
 * English CV edited in the Spanish UI would otherwise get Spanish bullets welded
 * in. Deterministic detection (no LLM), dismissible, and only shown on a real
 * mismatch. The fix it points to is simple: switch the app language to match.
 */
export default function CVLanguageNotice() {
  const t = useTranslations("editor")
  const uiLocale = useLocale() === "en" ? "en" : "es"
  const { sectionData } = useResumeStore(useShallow((s) => ({ sectionData: s.sectionData })))
  const [dismissed, setDismissed] = useState(false)

  const cvLang = useMemo(() => {
    const parts: string[] = [(sectionData.summary as string) ?? ""]
    for (const w of (sectionData.workExperience ?? []) as { description?: string; jobTitle?: string }[]) {
      parts.push(w.description ?? "", w.jobTitle ?? "")
    }
    const blob = parts.join(" ").trim()
    if (blob.length < MIN_CHARS) return null
    return detectLanguage(parts)
  }, [sectionData])

  if (dismissed || !cvLang || cvLang === uiLocale) return null

  const cvLangLabel = t(cvLang === "en" ? "lang_english" : "lang_spanish")
  const uiLangLabel = t(uiLocale === "en" ? "lang_english" : "lang_spanish")

  return (
    <div className="mb-3 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/90 to-orange-50/60 px-3.5 py-3 shadow-sm">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 shadow-sm shrink-0">
        <Languages className="h-3.5 w-3.5 text-white" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[11.5px] font-bold text-amber-900 leading-tight">
          {t("cv_language_title", { cvLang: cvLangLabel })}
        </p>
        <p className="mt-0.5 text-[10.5px] text-amber-800/90 leading-relaxed">
          {t("cv_language_desc", { uiLang: uiLangLabel })}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("cv_language_dismiss")}
        className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-amber-500 transition-colors hover:bg-amber-100 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
