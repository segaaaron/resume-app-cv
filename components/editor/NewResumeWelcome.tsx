"use client"

import { useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Sparkles, PencilLine, X } from "lucide-react"

interface Props {
  onPickAI: () => void
  onPickBlank: () => void
}

/**
 * First-run start screen for a brand-new, empty CV (the previously-dead `?new=1`
 * flag). Offers the fastest path — paste your info / LinkedIn and let AI structure
 * it — next to starting blank. Import-from-file lives on the dashboard (it creates
 * a resume from a file, before entering the editor), so it is not repeated here.
 */
export default function NewResumeWelcome({ onPickAI, onPickBlank }: Props) {
  const t = useTranslations("editor.new_welcome")
  const cardRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)

  // WAI-ARIA modal dialog: move focus INTO the dialog on open (primary action).
  useEffect(() => { primaryRef.current?.focus() }, [])

  // Escape closes; Tab is trapped inside the dialog (never escapes to the page).
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") { onPickBlank(); return }
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

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="new-welcome-title" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onPickBlank} aria-hidden />
      <div ref={cardRef} className="relative w-full max-w-lg rounded-3xl border border-cyan-100 bg-white p-6 shadow-[0_40px_100px_-20px_rgba(26,46,74,0.45)] animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onPickBlank}
          aria-label={t("close")}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center mb-5">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-dash-cyan to-[#0077B6] shadow-lg shadow-dash-cyan/30">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 id="new-welcome-title" className="text-lg font-black text-[#1a2e4a]">{t("title")}</h2>
          <p className="mt-1 text-[12.5px] text-slate-500 leading-relaxed">{t("subtitle")}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Fastest path — AI fill from pasted info / LinkedIn */}
          <button
            ref={primaryRef}
            type="button"
            onClick={onPickAI}
            className="group flex flex-col items-start gap-2 rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50/80 to-white p-4 text-left transition-all hover:border-dash-cyan hover:shadow-lg hover:shadow-dash-cyan/15 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-dash-cyan focus:ring-offset-1"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-dash-cyan to-[#00A8CC] text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#1a2e4a]">{t("ai_title")}</p>
              <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">{t("ai_desc")}</p>
            </div>
            <span className="mt-1 text-[10.5px] font-bold text-dash-cyan">{t("ai_cta")} →</span>
          </button>

          {/* Manual — start blank */}
          <button
            type="button"
            onClick={onPickBlank}
            className="group flex flex-col items-start gap-2 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left transition-all hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <PencilLine className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#1a2e4a]">{t("blank_title")}</p>
              <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">{t("blank_desc")}</p>
            </div>
            <span className="mt-1 text-[10.5px] font-bold text-slate-400">{t("blank_cta")} →</span>
          </button>
        </div>

        <p className="mt-4 text-center text-[10.5px] text-slate-400 leading-relaxed">{t("import_hint")}</p>
      </div>
    </div>
  )
}
