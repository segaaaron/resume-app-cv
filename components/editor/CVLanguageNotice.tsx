"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { useLocale, useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { detectCvLanguageOrNull } from "@/lib/resume/cv-language"
import { Languages, X } from "lucide-react"
import { Z_SCREEN_DIALOG } from "@/lib/ui/z-layers"

/** The mark never changes underneath us — it is written by this component only. */
function subscribeNever() { return () => {} }

/**
 * Tells the user, on a CV written in the other language, that the AI follows the
 * CV and not the app: an English CV edited in the Spanish UI gets ENGLISH
 * rewrites (see `useCvLanguage`). Deterministic detection (no LLM), and only on
 * a real mismatch.
 *
 * TWO SURFACES, ON PURPOSE. The sidebar strip alone was missed — it sits below
 * the fold of a panel the user scrolls past, and this changes what every AI
 * button in the editor returns. So the first time a mismatch is detected for a
 * CV, it is announced as a centred dialog; after that the strip stays as a quiet
 * reminder. The "seen" mark is per resume AND per detected language, so a CV
 * later rewritten in the other language announces itself again.
 */
export default function CVLanguageNotice() {
  const t = useTranslations("editor")
  const uiLocale = useLocale() === "en" ? "en" : "es"
  const { sectionData, resumeId } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, resumeId: s.resumeId }))
  )
  const [dismissed, setDismissed] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const okRef = useRef<HTMLButtonElement>(null)

  // Same detector the AI calls route through, so the notice can never disagree
  // with the language the suggestions actually come back in.
  const cvLang = useMemo(() => detectCvLanguageOrNull(sectionData), [sectionData])
  const mismatch = !!cvLang && cvLang !== uiLocale
  const seenKey = resumeId && cvLang ? `cv-lang-notice:${resumeId}:${cvLang}` : null

  // Announced once per CV+language. Read through useSyncExternalStore so the
  // server snapshot is "already seen" — the dialog can only ever appear on the
  // client, which keeps the first client render identical to the server's.
  const alreadySeen = useSyncExternalStore(
    subscribeNever,
    () => {
      if (!seenKey) return true
      try { return localStorage.getItem(seenKey) === "1" } catch { return true }
    },
    () => true,
  )
  const showDialog = mismatch && !alreadySeen && !acknowledged

  function acknowledge() {
    // Marked on close, not on open: a dialog the user never got to read should
    // not count as read.
    if (seenKey) { try { localStorage.setItem(seenKey, "1") } catch { /* private mode */ } }
    setAcknowledged(true)
  }

  useEffect(() => { if (showDialog) okRef.current?.focus() }, [showDialog])

  if (!mismatch || !cvLang) return null

  const cvLangLabel = t(cvLang === "en" ? "lang_english" : "lang_spanish")
  const uiLangLabel = t(uiLocale === "en" ? "lang_english" : "lang_spanish")

  // Escape closes; Tab is trapped inside the dialog.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") { acknowledge(); return }
    if (e.key !== "Tab" || !cardRef.current) return
    const f = cardRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (f.length === 0) return
    const first = f[0]
    const last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  // Portalled to <body>: the notice lives inside the scrolling sidebar, and a
  // `fixed` overlay rendered there is clipped by it.
  const dialog = showDialog && typeof document !== "undefined"
    ? createPortal(
        <div
          style={{ zIndex: Z_SCREEN_DIALOG }}
          className="fixed inset-0 flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="cv-lang-title"
          aria-describedby="cv-lang-desc"
          onKeyDown={onKeyDown}
        >
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => acknowledge()} aria-hidden />
          <div
            ref={cardRef}
            className="relative w-full max-w-md rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-[0_40px_100px_-20px_rgba(26,46,74,0.45)] animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
              <Languages className="h-6 w-6 text-white" />
            </div>
            <h2 id="cv-lang-title" className="text-lg font-black text-[#1a2e4a]">
              {t("cv_language_title", { cvLang: cvLangLabel })}
            </h2>
            <p id="cv-lang-desc" className="mt-1.5 text-[12.5px] text-slate-600 leading-relaxed">
              {t("cv_language_desc", { cvLang: cvLangLabel, uiLang: uiLangLabel })}
            </p>
            <button
              ref={okRef}
              type="button"
              onClick={() => acknowledge()}
              className="mt-5 w-full rounded-2xl bg-gradient-to-br from-[#0077B6] to-[#00D4FF] px-4 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
            >
              {t("cv_language_ack")}
            </button>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      {dialog}

      {!dismissed && (
        <div className="mb-3 flex items-start gap-2.5 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 to-orange-50/60 px-3.5 py-3 shadow-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shrink-0">
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
            className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-amber-600/80 transition-colors hover:bg-amber-100 hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  )
}
