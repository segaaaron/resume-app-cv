"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { useEditorPro } from "@/components/editor/EditorContext"
import { Sparkles, Loader2, Lock, Wand2, Check, X, Zap } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"

export default function SummarySection() {
  const t = useTranslations("editor.sections_form")
  const ai = useTranslations("editor.ai")
  const { isPro, openUpgrade } = useEditorPro()
  const locale = useLocale()
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )
  const [local, setLocal] = useState(sectionData.summary as string ?? "")
  const commitRef = useRef(updateSectionData)
  commitRef.current = updateSectionData
  useEffect(() => {
    setLocal((sectionData.summary as string) ?? "")
    setImproved(false)
  }, [sectionData.summary])

  const [generating, setGenerating] = useState(false)
  const [improving, setImproving] = useState(false)
  const [versions, setVersions] = useState<string[]>([])
  const [improved, setImproved] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    setVersions([])
    try {
      const res = await apiFetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionData, language: locale }),
      })
      if (res.status === 429) { toast.error(ai("rate_limit_exceeded")); return }
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
    const currentSummary = local
    if (!currentSummary || currentSummary.trim().length < 10) {
      toast.error(ai("improve_summary_empty"))
      return
    }
    setImproving(true)
    setVersions([])
    try {
      const res = await apiFetch("/api/ai/improve-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: currentSummary, sectionData, language: locale }),
      })
      if (res.status === 429) { toast.error(ai("rate_limit_exceeded")); return }
      if (res.status === 403) { toast.error(ai("pro_only")); return }
      if (res.status === 400) { toast.error(ai("improve_summary_empty")); return }
      if (res.status === 422) { toast.error(ai("off_topic_summary")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setVersions(data.versions)
    } catch {
      toast.error(ai("error_summary"))
    } finally {
      setImproving(false)
    }
  }

  function applyVersion(version: string) {
    updateSectionData("summary", version)
    setVersions([])
    setImproved(true)
    toast.success(ai("summary_applied"))
  }

  const charCount = local.length
  const hasContent = local.trim().length >= 10

  return (
    <div className="space-y-3">
      {/* AI action buttons — premium pill style */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Mejorar con IA */}
        <button
          type="button"
          onClick={isPro ? handleImprove : openUpgrade}
          disabled={improving || (isPro && (!hasContent || improved))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: improved
              ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
              : "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
            color: "#fff",
            boxShadow: improved
              ? "0 2px 8px rgba(16,185,129,0.3)"
              : "0 2px 8px rgba(124,58,237,0.3)",
            border: "none",
          }}
        >
          {!isPro
            ? <><Lock className="h-3 w-3" />{ai("improve_summary")}</>
            : improving
              ? <><Loader2 className="h-3 w-3 animate-spin" />{ai("generating")}</>
              : improved
                ? <><Check className="h-3 w-3" />{ai("bullet_improved")}</>
                : <><Wand2 className="h-3 w-3" />{ai("improve_summary")}</>
          }
        </button>

        {/* Generar con IA */}
        <button
          type="button"
          onClick={isPro ? handleGenerate : openUpgrade}
          disabled={generating || (isPro && local.trim().length > 0)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
            color: "#0a1a35",
            boxShadow: "0 2px 8px rgba(0,212,255,0.3)",
            border: "none",
          }}
        >
          {!isPro
            ? <><Lock className="h-3 w-3" />{ai("generate_summary")}</>
            : generating
              ? <><Loader2 className="h-3 w-3 animate-spin" />{ai("generating")}</>
              : <><Sparkles className="h-3 w-3" />{ai("generate_summary")}</>
          }
        </button>
      </div>

      {/* Textarea — premium styled */}
      <div className="relative">
        <textarea
          value={local}
          onChange={(e) => {
            setLocal(e.target.value)
            if (versions.length > 0) setVersions([])
            if (improved) setImproved(false)
          }}
          onBlur={(e) => {
            commitRef.current("summary", local)
            e.currentTarget.style.borderColor = "rgba(0,212,255,0.2)"
            e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.03)"
          }}
          placeholder={t("summary_placeholder")}
          rows={6}
          className="w-full resize-none text-[13px] leading-relaxed text-[#1a2e4a] placeholder:text-slate-400 outline-none transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, rgba(240,248,255,0.8) 0%, rgba(232,244,251,0.6) 100%)",
            border: "1.5px solid rgba(0,212,255,0.2)",
            borderRadius: 12,
            padding: "12px 14px 28px",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.03)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,212,255,0.5)"
            e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.03), 0 0 0 3px rgba(0,212,255,0.08)"
          }}
        />
        {/* Char counter inside textarea */}
        <span
          className="absolute bottom-2.5 right-3 text-[10px] font-medium tabular-nums"
          style={{ color: charCount > 1000 ? "#F59E0B" : "#94A3B8" }}
        >
          {charCount}
        </span>
      </div>

      {/* AI Versions — premium response panel */}
      {versions.length > 0 && (
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #0f1e3a 0%, #1a2e4a 100%)",
            border: "1px solid rgba(0,212,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,212,255,0.08)",
          }}
        >
          {/* Glow top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
            style={{ background: "linear-gradient(90deg, transparent, #00D4FF, transparent)", opacity: 0.6 }} />
          {/* Ambient glow */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: "rgba(0,212,255,0.06)", filter: "blur(20px)" }} />

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg"
                style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(0,168,204,0.1) 100%)", border: "1px solid rgba(0,212,255,0.3)" }}>
                <Zap className="w-3.5 h-3.5" style={{ color: "#00D4FF" }} />
              </div>
              <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#00D4FF" }}>
                {ai("choose_version")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setVersions([])}
              className="flex items-center justify-center w-6 h-6 rounded-full cursor-pointer transition-all duration-150"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Version cards */}
          <div className="px-4 pb-4 space-y-2.5">
            {versions.map((v, i) => (
              <div
                key={i}
                className="relative rounded-xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {/* Version number badge */}
                <div className="absolute top-3 left-3 flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black"
                  style={{ background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)", color: "#0a1a35" }}>
                  {i + 1}
                </div>

                <div className="pl-10 pr-3 pt-3 pb-3">
                  <p className="text-[12px] leading-[1.65] mb-3" style={{ color: "rgba(255,255,255,0.85)" }}>{v}</p>

                  <button
                    type="button"
                    onClick={() => applyVersion(v)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-bold cursor-pointer transition-all duration-150"
                    style={{
                      background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
                      color: "#0a1a35",
                      boxShadow: "0 2px 8px rgba(0,212,255,0.25)",
                      border: "none",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,212,255,0.4)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,212,255,0.25)" }}
                  >
                    <Check className="w-3 h-3" />
                    {ai("use_version")}
                  </button>
                </div>
              </div>
            ))}

            {/* Disclaimer */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <span className="text-amber-400 mt-px shrink-0 text-[11px]">⚠</span>
              <p className="text-[10.5px] leading-relaxed" style={{ color: "rgba(245,158,11,0.85)" }}>
                {ai("metrics_disclaimer")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
