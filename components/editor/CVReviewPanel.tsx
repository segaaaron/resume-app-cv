"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { MessageSquare, Loader2, ChevronDown, ChevronUp, CheckCircle2, TrendingUp, Lightbulb } from "lucide-react"
import { toast } from "sonner"

interface ReviewResult {
  summary: string
  strengths: string[]
  improvements: string[]
  answer: string
}

export default function CVReviewPanel() {
  const t = useTranslations("editor.cv_review")
  const { sectionData } = useResumeStore()
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [expanded, setExpanded] = useState(true)

  async function handleReview() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/ai/review-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionData, question: question.trim() || undefined }),
      })
      if (res.status === 403) { toast.error(t("pro_only")); return }
      if (res.status === 400) { toast.error(t("not_enough_data")); return }
      if (res.status === 422) { toast.error(t("off_topic")); return }
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
    <div className="border border-border rounded-xl overflow-hidden mt-4">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold">{t("title")}</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">{t("pro_badge")}</span>
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-white border-t border-border">
          <p className="text-[11px] text-muted-foreground pt-3 leading-relaxed">{t("description")}</p>

          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("placeholder")}
            className="text-xs min-h-[72px] resize-none"
            maxLength={300}
          />

          <div className="flex items-center justify-between">
            <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleReview} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
              {loading ? t("analyzing") : t("analyze")}
            </Button>
            {result && (
              <button
                type="button"
                onClick={() => { setResult(null); setQuestion("") }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("clear")}
              </button>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-3 pt-1">

              {/* Answer to specific question */}
              {result.answer && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                  <p className="text-[11px] font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> {t("answer_label")}
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">{result.answer}</p>
                </div>
              )}

              {/* Summary */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] font-semibold text-foreground mb-1.5">{t("summary_label")}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{result.summary}</p>
              </div>

              {/* Strengths */}
              {result.strengths.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-foreground mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> {t("strengths_label")}
                  </p>
                  <div className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <div key={i} className="flex gap-2 text-xs text-foreground leading-relaxed">
                        <span className="text-green-600 shrink-0 mt-0.5">✓</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements */}
              {result.improvements.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-foreground mb-1.5 flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-600" /> {t("improvements_label")}
                  </p>
                  <div className="space-y-1">
                    {result.improvements.map((imp, i) => (
                      <div key={i} className="flex gap-2 text-xs text-foreground leading-relaxed">
                        <Lightbulb className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                        <span>{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  )
}
