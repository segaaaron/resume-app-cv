"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { FileText, UploadCloud, Loader2, Sparkles } from "lucide-react"
import AtsScoreCard from "./AtsScoreCard"
import AtsResultsBreakdown from "./AtsResultsBreakdown"

type Locale = "en" | "es"

type Breakdown = {
  keywords: { score: number; matched?: string[]; missing?: string[]; suggested?: string[] }
  format: { score: number; passes?: string[]; issues?: string[] }
  sections: { score: number; detected: string[]; missing?: string[] }
  length: { score: number; wordCount: number; recommendation: string }
  contact: { score: number; hasEmail: boolean; hasPhone: boolean; hasLinkedIn: boolean }
}

type AnalyzeResponse = {
  sessionId: string
  scoreOverall: number
  breakdown: Breakdown
  allMissingKeywords: string[]
  allQuickWins: string[]
  detailedSuggestions: string[]
  upgradePath: string
}

const MAX_PDF_BYTES = 5 * 1024 * 1024

export default function AtsCheckerForm() {
  const t = useTranslations("tools.atsChecker")
  const locale = useLocale() as Locale

  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [jd, setJd] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)

  const onPickFile = useCallback((f: File | null | undefined) => {
    setError(null)
    if (!f) return
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError(t("errors.invalidType"))
      return
    }
    if (f.size > MAX_PDF_BYTES) {
      setError(t("errors.fileTooLarge"))
      return
    }
    setFile(f)
  }, [t])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    onPickFile(e.dataTransfer.files?.[0])
  }, [onPickFile])

  const submit = useCallback(async () => {
    setError(null)
    if (!file) { setError(t("errors.noFile")); return }
    if (jd.trim().length < 50) { setError(t("errors.jdTooShort")); return }

    setLoading(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append("resume", file)
      fd.append("jobDescription", jd)
      fd.append("locale", locale)
      const res = await fetch("/api/tools/ats-check", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.message ?? t("errors.generic"))
        return
      }
      setResult(data as AnalyzeResponse)
    } catch {
      setError(t("errors.generic"))
    } finally {
      setLoading(false)
    }
  }, [file, jd, locale, t])

  return (
    <div className="space-y-10">
      {/* ----- Form card ----- */}
      <div className="relative">
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#00D4FF]/20 via-transparent to-[#1a2e4a]/20 blur-2xl" />
        <div className="relative rounded-3xl border border-white/10 bg-white/90 p-6 md:p-10 shadow-[0_30px_80px_-30px_rgba(15,26,46,0.35)] backdrop-blur">
          {/* Step 1: PDF */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#1a2e4a]/70">
              {t("form.step1")}
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`group cursor-pointer rounded-2xl border-2 border-dashed p-8 md:p-10 text-center transition-all
                ${dragOver
                  ? "border-[#00D4FF] bg-[#00D4FF]/5 scale-[1.01]"
                  : "border-[#1a2e4a]/20 hover:border-[#00D4FF] hover:bg-[#00D4FF]/[0.03]"}`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] text-[#00D4FF] shadow-lg shadow-[#1a2e4a]/30">
                {file ? <FileText className="h-7 w-7" /> : <UploadCloud className="h-7 w-7" />}
              </div>
              {file ? (
                <p className="text-sm font-semibold text-[#1a2e4a]">{file.name}</p>
              ) : (
                <>
                  <p className="text-base font-semibold text-[#1a2e4a]">{t("form.dropTitle")}</p>
                  <p className="mt-1 text-xs text-[#1a2e4a]/60">{t("form.dropSubtitle")}</p>
                </>
              )}
            </div>
          </div>

          {/* Step 2: JD */}
          <div className="mt-7 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-[#1a2e4a]/70">
              {t("form.step2")}
            </label>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder={t("form.jdPlaceholder")}
              rows={7}
              className="w-full resize-y rounded-2xl border border-[#1a2e4a]/15 bg-white p-4 text-sm text-[#1a2e4a] outline-none transition-all placeholder:text-[#1a2e4a]/40 focus:border-[#00D4FF] focus:ring-4 focus:ring-[#00D4FF]/15"
            />
            <div className="flex items-center justify-between text-[11px] text-[#1a2e4a]/50">
              <span>{t("form.jdHelp")}</span>
              <span>{jd.length} / 10000</span>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={submit}
            disabled={loading}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1a2e4a] to-[#0f1a2e] px-6 py-4 text-base font-bold text-white shadow-[0_15px_40px_-10px_rgba(0,212,255,0.5)] outline-none transition-all hover:scale-[1.01] hover:shadow-[0_20px_50px_-10px_rgba(0,212,255,0.65)] focus:ring-4 focus:ring-[#00D4FF]/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> {t("form.analyzing")}</>
            ) : (
              <><Sparkles className="h-5 w-5 text-[#00D4FF]" /> {t("form.cta")}</>
            )}
          </button>
        </div>
      </div>

      {/* ----- Results ----- */}
      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AtsScoreCard score={result.scoreOverall} />
          <AtsResultsBreakdown
            breakdown={result.breakdown}
            allMissingKeywords={result.allMissingKeywords}
            allQuickWins={result.allQuickWins}
            upgradePath={result.upgradePath}
          />
        </div>
      )}
    </div>
  )
}
