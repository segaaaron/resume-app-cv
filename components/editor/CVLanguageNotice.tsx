"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { detectCvLanguageOrNull } from "@/lib/resume/cv-language"
import { Languages, X } from "lucide-react"

/**
 * Tells the user, on a CV written in the other language, that the AI follows the
 * CV and not the app: an English CV edited in the Spanish UI gets ENGLISH
 * rewrites (see `useCvLanguage`). Informational, not a warning — there is
 * nothing to fix. Deterministic detection (no LLM), dismissible, and only shown
 * on a real mismatch.
 */
export default function CVLanguageNotice() {
  const t = useTranslations("editor")
  const uiLocale = useLocale() === "en" ? "en" : "es"
  const { sectionData } = useResumeStore(useShallow((s) => ({ sectionData: s.sectionData })))
  const [dismissed, setDismissed] = useState(false)

  // Same detector the AI calls route through, so the notice can never disagree
  // with the language the suggestions actually come back in.
  const cvLang = useMemo(() => detectCvLanguageOrNull(sectionData), [sectionData])

  if (dismissed || !cvLang || cvLang === uiLocale) return null

  const cvLangLabel = t(cvLang === "en" ? "lang_english" : "lang_spanish")
  const uiLangLabel = t(uiLocale === "en" ? "lang_english" : "lang_spanish")

  return (
    <div className="mb-3 flex items-start gap-2.5 rounded-2xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50/90 to-sky-50/60 px-3.5 py-3 shadow-sm">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#0077B6] to-[#00D4FF] shadow-sm shrink-0">
        <Languages className="h-3.5 w-3.5 text-white" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[11.5px] font-bold text-slate-800 leading-tight">
          {t("cv_language_title", { cvLang: cvLangLabel })}
        </p>
        <p className="mt-0.5 text-[10.5px] text-slate-600 leading-relaxed">
          {t("cv_language_desc", { cvLang: cvLangLabel, uiLang: uiLangLabel })}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("cv_language_dismiss")}
        className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-cyan-600/70 transition-colors hover:bg-cyan-100 hover:text-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-300"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
