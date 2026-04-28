"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Target, Loader2, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Lightbulb, Tag } from "lucide-react"
import { toast } from "sonner"

interface ATSResult {
  score: number
  label: string
  summary: string
  strengths: string[]
  gaps: string[]
  missingKeywords: string[]
  suggestions: string[]
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "#16a34a" :
    score >= 60 ? "#2563eb" :
    score >= 40 ? "#d97706" : "#dc2626"

  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle
        cx="48" cy="48" r={radius} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text x="48" y="44" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill={color}>{score}</text>
      <text x="48" y="60" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#6b7280">/100</text>
    </svg>
  )
}

interface ATSErrorBlockProps {
  title: string
  description: string
}

function ATSErrorBlock({ title, description }: ATSErrorBlockProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-5 w-5 text-red-600" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-red-800">{title}</p>
        <p className="text-xs text-red-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export default function ATSScorePanel() {
  const t = useTranslations("editor.ats")
  const { sectionData } = useResumeStore()
  const [jobDescription, setJobDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ATSResult | null>(null)
  const [offTopic, setOffTopic] = useState(false)
  const [expanded, setExpanded] = useState(true)

  async function handleAnalyze() {
    if (jobDescription.trim().length < 20) {
      toast.error(t("short_description"))
      return
    }
    setLoading(true)
    setResult(null)
    setOffTopic(false)
    try {
      const res = await fetch("/api/ai/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, sectionData }),
      })
      if (res.status === 403) { toast.error(t("pro_only")); return }
      if (res.status === 400) { toast.error(t("not_enough_data")); return }
      if (res.status === 422) { setOffTopic(true); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch {
      toast.error(t("error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-semibold">{t("title")}</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">{t("pro_badge")}</span>
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-white border-t border-border">
          <p className="text-[11px] text-muted-foreground pt-3 leading-relaxed">{t("description")}</p>

          <Textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder={t("placeholder")}
            className="text-xs min-h-[100px] resize-none"
          />

          <Button size="sm" className="w-full gap-2" onClick={handleAnalyze} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
            {loading ? t("analyzing") : t("analyze")}
          </Button>

          {/* Off-topic error */}
          {offTopic && (
            <ATSErrorBlock
              title={t("off_topic_title")}
              description={t("off_topic_description")}
            />
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3 pt-1">
              {/* Score */}
              <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-3">
                <div className="flex flex-col items-center gap-1">
                  <ScoreRing score={result.score} />
                  <span className="text-xs font-semibold" style={{
                    color: result.score >= 80 ? "#16a34a" : result.score >= 60 ? "#2563eb" : result.score >= 40 ? "#d97706" : "#dc2626"
                  }}>{result.label}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{result.summary}</p>
              </div>

              {/* Strengths */}
              {result.strengths?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-green-700 flex items-center gap-1 mb-1.5">
                    <CheckCircle2 className="h-3 w-3" /> {t("strengths")}
                  </p>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gaps */}
              {result.gaps?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-amber-700 flex items-center gap-1 mb-1.5">
                    <AlertCircle className="h-3 w-3" /> {t("gaps")}
                  </p>
                  <ul className="space-y-1">
                    {result.gaps.map((g, i) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5 shrink-0">!</span> {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing keywords */}
              {result.missingKeywords?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-red-700 flex items-center gap-1 mb-1.5">
                    <Tag className="h-3 w-3" /> {t("missing_keywords")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.missingKeywords.map((kw, i) => (
                      <span key={i} className="text-[10px] bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1 mb-1.5">
                    <Lightbulb className="h-3 w-3" /> {t("suggestions")}
                  </p>
                  <ul className="space-y-1">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                        <span className="text-indigo-500 mt-0.5 shrink-0">→</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("clear")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
