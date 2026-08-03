"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ShieldCheck, Lock, Loader2, CheckCircle2, AlertTriangle, XCircle, Sparkles } from "lucide-react"
import { analyzeCoverLetterAts, type CoverLetterAtsResult, type CoverLetterAtsVerdict } from "@/lib/ats/cover-letter-ats"

/** Strip TipTap HTML to the plain text the ATS engine reads. Client-safe. */
function htmlToPlain(html: string): string {
  return (html ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

const VERDICT_COLOR: Record<CoverLetterAtsVerdict, string> = {
  pass: "#10B981",
  caution: "#F59E0B",
  risk: "#EF4444",
}

function VerdictIcon({ v, size = 16 }: { v: CoverLetterAtsVerdict; size?: number }) {
  const c = VERDICT_COLOR[v]
  if (v === "pass") return <CheckCircle2 style={{ color: c }} width={size} height={size} />
  if (v === "caution") return <AlertTriangle style={{ color: c }} width={size} height={size} />
  return <XCircle style={{ color: c }} width={size} height={size} />
}

interface Props {
  body: string
  company: string
  jobTitle: string
  /** The single job description shared with the AI generator (lifted to the editor)
   *  so tailoring and ATS scoring run against the exact same vacancy text. */
  jobDescription: string
  onJobDescriptionChange: (v: string) => void
  isPro: boolean
  onUpgrade: () => void
  /** Jump to the AI tab so the buyer can regenerate the body against this exact JD —
   *  turns the "missing keywords" diagnosis into a one-click action. */
  onImproveWithJob?: () => void
}

export default function CoverLetterAtsPanel({ body, jobDescription, onJobDescriptionChange, isPro, onUpgrade, onImproveWithJob }: Props) {
  const t = useTranslations("cover_letter_editor")
  const jd = jobDescription
  const [result, setResult] = useState<CoverLetterAtsResult | null>(null)
  const [running, setRunning] = useState(false)

  const plain = htmlToPlain(body)
  const hasBody = plain.length > 20

  function run() {
    if (!hasBody) return
    setRunning(true)
    // Deterministic + synchronous — the spinner is a beat of feedback, not a wait.
    const r = analyzeCoverLetterAts(plain, jd)
    setResult(r)
    setRunning(false)
  }

  if (!isPro) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-5 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
          <Lock className="h-5 w-5 text-white" />
        </div>
        <p className="text-[13px] font-bold text-emerald-900">{t("ats_pro_title")}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-emerald-700">{t("ats_pro_desc")}</p>
        <button
          type="button"
          onClick={onUpgrade}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-[11px] font-bold text-white shadow-sm transition-transform hover:scale-[1.02]"
        >
          {t("ats_pro_cta")}
        </button>
      </div>
    )
  }

  const DIMS = result
    ? ([
        { key: "keywords", verdict: result.keywords.verdict, label: t("ats_dim_keywords"), detail: result.keywords.checked ? `${result.keywords.matched.length}/${result.keywords.matched.length + result.keywords.missing.length}` : t("ats_add_jd_hint") },
        { key: "length", verdict: result.length.verdict, label: t("ats_dim_length"), detail: t("ats_words", { count: result.length.wordCount }) },
        { key: "format", verdict: result.format.verdict, label: t("ats_dim_format"), detail: result.format.issues.length === 0 ? t("ats_format_clean") : result.format.issues.map((i) => t(i === "placeholder" ? "ats_format_placeholder" : "ats_format_bracket")).join(" · ") },
        { key: "readability", verdict: result.readability.verdict, label: t("ats_dim_readability"), detail: t("ats_readability_detail", { avg: result.readability.avgSentenceWords, paras: result.readability.paragraphs }) },
      ] as const)
    : []

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-dash-navy">{t("ats_title")}</p>
          <p className="text-[11px] leading-snug text-dash-muted">{t("ats_subtitle")}</p>
        </div>
      </div>

      {/* Job description */}
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.06em] text-dash-muted">{t("ats_jd_label")}</label>
        <textarea
          value={jd}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          placeholder={t("ats_jd_placeholder")}
          rows={4}
          maxLength={6000}
          className="w-full resize-none rounded-xl border border-[#C8DCF0] bg-white px-3 py-2 text-[12px] text-dash-navy outline-none focus:border-emerald-400"
        />
      </div>

      <button
        type="button"
        onClick={run}
        disabled={!hasBody || running}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-[12px] font-bold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
        {result ? t("ats_rerun") : t("ats_run")}
      </button>
      {!hasBody && <p className="text-center text-[10.5px] text-amber-600">{t("ats_no_body")}</p>}

      {result && (
        <div className="space-y-3">
          {/* Overall score */}
          <div className="rounded-2xl border p-4 text-center" style={{ borderColor: `${VERDICT_COLOR[result.verdict]}55`, background: `${VERDICT_COLOR[result.verdict]}0F` }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-dash-muted">{t("ats_overall")}</p>
            <p className="mt-1 text-[32px] font-black leading-none" style={{ color: VERDICT_COLOR[result.verdict] }}>{result.score}</p>
            <div className="mt-1.5 inline-flex items-center gap-1.5">
              <VerdictIcon v={result.verdict} size={13} />
              <span className="text-[11px] font-bold" style={{ color: VERDICT_COLOR[result.verdict] }}>{t(`ats_verdict_${result.verdict}`)}</span>
            </div>
          </div>

          {/* Dimensions */}
          <div className="space-y-2">
            {DIMS.map((d) => (
              <div key={d.key} className="flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5">
                <VerdictIcon v={d.verdict} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-dash-navy">{d.label}</p>
                  <p className="truncate text-[10.5px] text-dash-muted">{d.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Missing keywords */}
          {result.keywords.checked && result.keywords.missing.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-dash-muted">{t("ats_missing_label")}</p>
              <div className="flex flex-wrap gap-1.5">
                {result.keywords.missing.slice(0, 12).map((kw) => (
                  <span key={kw} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10.5px] font-semibold text-amber-700">{kw}</span>
                ))}
              </div>
              {isPro && onImproveWithJob && (
                <button
                  type="button"
                  onClick={onImproveWithJob}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#00A8CC] px-3 py-2 text-[11px] font-bold text-white transition-all hover:bg-[#0090b0] hover:shadow-md"
                >
                  <Sparkles width={13} height={13} />
                  {t("ats_improve_with_job")}
                </button>
              )}
            </div>
          )}

          <p className="text-[10px] leading-relaxed text-dash-muted">{t("ats_disclaimer")}</p>
        </div>
      )}
    </div>
  )
}
