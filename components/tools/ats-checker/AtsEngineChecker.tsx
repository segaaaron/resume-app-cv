"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"
import { ScanSearch, Sparkles, ArrowRight } from "lucide-react"
import { simulateAtsEngines, type EngineSimulation } from "@/lib/ats/engines"
import type { Locale } from "@/lib/ats/signals"
import AtsEngineMatrix from "@/components/editor/AtsEngineMatrix"

const MIN_CHARS = 120

/**
 * Free, public per-engine parseability check. Runs the SAME deterministic engine the
 * PRO panel uses (simulateAtsEngines) entirely in the browser — no upload, no account,
 * no cost, no data leaves the page. Paste-text catches the parse-killers visible in
 * plain text (mixed dates, decorative bullets, non-standard labels, repeated contact);
 * the column/layout check needs the real exported PDF, which is the PRO upsell below.
 */
export default function AtsEngineChecker() {
  const t = useTranslations("tools.atsChecker.checker")
  const rawLocale = useLocale()
  const locale: Locale = rawLocale === "es" ? "es" : "en"

  const [text, setText] = useState("")
  const [result, setResult] = useState<EngineSimulation | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyze = () => {
    const trimmed = text.trim()
    if (trimmed.length < MIN_CHARS) {
      setError(t("minChars", { count: MIN_CHARS }))
      setResult(null)
      return
    }
    setError(null)
    // Deterministic, synchronous, client-side. Same signals → same verdicts as PRO.
    setResult(simulateAtsEngines(trimmed, locale))
  }

  return (
    <section className="relative mx-auto max-w-3xl px-6 pb-4">
      <div className="rounded-3xl border border-[#1a2e4a]/10 bg-white/85 p-6 shadow-[0_20px_60px_-25px_rgba(15,26,46,0.35)] backdrop-blur md:p-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] text-[#00D4FF] shadow-lg shadow-[#1a2e4a]/30">
            <ScanSearch className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-[#1a2e4a] md:text-xl">{t("heading")}</h2>
            <p className="text-[13px] text-[#1a2e4a]/60">{t("subtitle")}</p>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("heading")}
          rows={7}
          className="mt-5 w-full resize-y rounded-2xl border border-[#1a2e4a]/15 bg-[#f7fafc] px-4 py-3 text-sm text-[#1a2e4a] shadow-inner outline-none transition-all placeholder:text-[#1a2e4a]/35 focus:border-[#00D4FF]/50 focus:ring-2 focus:ring-[#00D4FF]/20"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[11px] text-[#1a2e4a]/45">{t("help")}</span>
          <button
            type="button"
            onClick={analyze}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#4F8BFF] px-5 py-2.5 text-sm font-bold text-[#0f1a2e] shadow-[0_12px_30px_-10px_rgba(0,212,255,0.6)] transition-all hover:scale-[1.02]"
          >
            <ScanSearch className="h-4 w-4" />
            {t("analyze")}
          </button>
        </div>

        {error && <p className="mt-3 text-[12px] font-semibold text-amber-600">{error}</p>}

        {result && (
          <div className="mt-5 space-y-4">
            <AtsEngineMatrix simulation={result} />
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-[#00D4FF]/25 bg-[#00D4FF]/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12.5px] leading-relaxed text-[#1a2e4a]/75">{t("resultNote")}</p>
              <Link
                href={`/${rawLocale}/register`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#1a2e4a] px-4 py-2 text-[12px] font-bold text-white transition-all hover:bg-[#0f1a2e]"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#00D4FF]" />
                {t("ctaText")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
