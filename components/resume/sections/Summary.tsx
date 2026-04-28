"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useEditorPro } from "@/components/editor/EditorContext"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Loader2, Lock } from "lucide-react"
import { toast } from "sonner"

export default function SummarySection() {
  const t = useTranslations("editor.sections_form")
  const ai = useTranslations("editor.ai")
  const { isPro, openUpgrade } = useEditorPro()
  const { sectionData, updateSectionData, config } = useResumeStore()
  const [generating, setGenerating] = useState(false)
  const [versions, setVersions] = useState<string[]>([])

  async function handleGenerate() {
    const { personalDetails, workExperience, education, skills } = sectionData
    const jobTitle = workExperience?.[0]?.jobTitle ?? ""

    setGenerating(true)
    setVersions([])
    try {
      const res = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personalDetails, jobTitle, workExperience, education, skills, language: config.language }),
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

  function applyVersion(version: string) {
    updateSectionData("summary", version)
    setVersions([])
    toast.success(ai("summary_applied"))
  }

  return (
    <div className="space-y-3">
      {/* Header con botón IA */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{t("summary_placeholder")}</p>
        <button
          type="button"
          onClick={isPro ? handleGenerate : openUpgrade}
          disabled={generating}
          className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors"
        >
          {!isPro
            ? <><Lock className="h-3 w-3" /> {ai("generate_summary")}</>
            : generating
              ? <><Loader2 className="h-3 w-3 animate-spin" /> {ai("generating")}</>
              : <><Sparkles className="h-3 w-3" /> {ai("generate_summary")}</>
          }
        </button>
      </div>

      <Textarea
        value={sectionData.summary}
        onChange={(e) => updateSectionData("summary", e.target.value)}
        placeholder={t("summary_placeholder")}
        className="text-sm min-h-[120px] resize-none"
      />
      <p className="text-xs text-muted-foreground text-right">
        {sectionData.summary.length} {/* character count — no translation needed */}
      </p>

      {/* Versiones generadas por IA */}
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
