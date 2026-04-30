"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useEditorPro } from "@/components/editor/EditorContext"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Loader2, Lock, Wand2 } from "lucide-react"
import { toast } from "sonner"

export default function SummarySection() {
  const t = useTranslations("editor.sections_form")
  const ai = useTranslations("editor.ai")
  const { isPro, openUpgrade } = useEditorPro()
  const { sectionData, updateSectionData, config } = useResumeStore()
  const [generating, setGenerating] = useState(false)
  const [improving, setImproving] = useState(false)
  const [versions, setVersions] = useState<string[]>([])
  const [showImproveInput, setShowImproveInput] = useState(false)
  const [improveDescription, setImproveDescription] = useState("")

  async function handleGenerate() {
    setGenerating(true)
    setVersions([])
    try {
      const res = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionData, language: config.language }),
      })
      if (res.status === 403) { toast.error(ai("pro_only")); return }
      if (res.status === 400) { toast.error(ai("not_enough_data_summary")); return }
      if (res.status === 422) { toast.error(ai("off_topic_summary")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setVersions(data.versions)
    } catch {
      toast.error(ai("error_summary"))
    } finally {
      setGenerating(false)
    }
  }

  async function handleImprove() {
    const currentSummary = sectionData.summary as string
    const hasContent = currentSummary && currentSummary.trim().length > 10
    const hasDescription = improveDescription.trim().length >= 5

    if (!hasContent && !hasDescription) {
      toast.error(ai("improve_summary_empty"))
      return
    }

    setImproving(true)
    setVersions([])
    try {
      const res = await fetch("/api/ai/improve-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: hasContent ? currentSummary : undefined,
          userDescription: hasDescription ? improveDescription.trim() : undefined,
          sectionData,
          language: config.language,
        }),
      })
      if (res.status === 403) { toast.error(ai("pro_only")); return }
      if (res.status === 400) { toast.error(ai("improve_summary_empty")); return }
      if (res.status === 422) { toast.error(ai("off_topic_summary")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setVersions(data.versions)
      setShowImproveInput(false)
    } catch {
      toast.error(ai("error_summary"))
    } finally {
      setImproving(false)
    }
  }

  function applyVersion(version: string) {
    updateSectionData("summary", version)
    setVersions([])
    toast.success(ai("summary_applied"))
  }

  return (
    <div className="space-y-3">
      {/* Header con botones IA */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t("summary_placeholder")}</p>
        <div className="flex items-center gap-3 shrink-0">
          {/* Mejorar con IA — solo si hay contenido */}
          <button
            type="button"
            onClick={isPro ? () => { setShowImproveInput(v => !v); setVersions([]) } : openUpgrade}
            disabled={improving || (isPro && !sectionData.summary?.toString().trim())}
            className="flex items-center gap-1 text-[11px] font-medium text-violet-600 hover:text-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {!isPro
              ? <><Lock className="h-3 w-3" /> {ai("improve_summary")}</>
              : improving
                ? <><Loader2 className="h-3 w-3 animate-spin" /> {ai("generating")}</>
                : <><Wand2 className="h-3 w-3" /> {ai("improve_summary")}</>
            }
          </button>
          {/* Generar desde CV — solo si NO hay contenido */}
          <button
            type="button"
            onClick={isPro ? handleGenerate : openUpgrade}
            disabled={generating || (isPro && !!sectionData.summary?.toString().trim())}
            className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {!isPro
              ? <><Lock className="h-3 w-3" /> {ai("generate_summary")}</>
              : generating
                ? <><Loader2 className="h-3 w-3 animate-spin" /> {ai("generating")}</>
                : <><Sparkles className="h-3 w-3" /> {ai("generate_summary")}</>
            }
          </button>
        </div>
      </div>

      {/* Improve context input */}
      {showImproveInput && isPro && (
        <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-3 space-y-2">
          <p className="text-[11px] text-violet-700 font-medium">{ai("improve_summary_hint")}</p>
          <Textarea
            value={improveDescription}
            onChange={e => setImproveDescription(e.target.value)}
            placeholder={ai("improve_summary_placeholder")}
            className="text-xs min-h-[60px] resize-none bg-white"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">{improveDescription.length}/500</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowImproveInput(false); setImproveDescription("") }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {ai("cancel")}
              </button>
              <button
                type="button"
                onClick={handleImprove}
                disabled={improving}
                className="flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:text-violet-900 disabled:opacity-50 transition-colors"
              >
                {improving
                  ? <><Loader2 className="h-3 w-3 animate-spin" /> {ai("generating")}</>
                  : <><Wand2 className="h-3 w-3" /> {ai("improve_summary")}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <Textarea
        value={sectionData.summary}
        onChange={(e) => {
          updateSectionData("summary", e.target.value)
          if (versions.length > 0) setVersions([])
        }}
        placeholder={t("summary_placeholder")}
        className="text-sm min-h-[120px] resize-none"
      />
      <p className="text-xs text-muted-foreground text-right">
        {sectionData.summary.length}
      </p>

      {/* Versiones generadas/mejoradas por IA */}
      {versions.length > 0 && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 space-y-2">
          <p className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> {ai("choose_version")}
          </p>
          {versions.map((v, i) => (
            <div key={i} className="rounded-md bg-white border border-indigo-100 p-2.5 space-y-1.5">
              <p className="text-xs text-foreground leading-relaxed">{v}</p>
              <button
                type="button"
                onClick={() => applyVersion(v)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {ai("use_version")}
              </button>
            </div>
          ))}
          <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 leading-relaxed">
            ⚠ {ai("metrics_disclaimer")}
          </p>
          <button
            type="button"
            onClick={() => setVersions([])}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {ai("cancel")}
          </button>
        </div>
      )}
    </div>
  )
}
