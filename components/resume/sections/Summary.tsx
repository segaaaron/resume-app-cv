"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { useEditorPro } from "@/components/editor/EditorContext"
import { Sparkles, Loader2, Lock, Wand2, Check } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import SummaryVersionModal, { type SummaryVersion } from "./SummaryVersionModal"
import { useAICooldown } from "@/components/editor/hooks/useAICooldown"
import { useAICall } from "@/hooks/useAICall"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"
import { handleApiError } from "@/lib/upgrade-modal-handler"
import { useRouter } from "next/navigation"

export default function SummarySection() {
  const t = useTranslations("editor.sections_form")
  const ai = useTranslations("editor.ai")
  const { isPro, openUpgrade } = useEditorPro()
  const locale = useLocale()
  const router = useRouter()
  const { open: openUpgradeModal } = useUpgradeModal()
  const { preCheck, onSuccess } = useAICall()
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )
  const [local, setLocal] = useState(sectionData.summary as string ?? "")
  const commitRef = useRef(updateSectionData)
  commitRef.current = updateSectionData
  useEffect(() => {
    setLocal((sectionData.summary as string) ?? "")
  }, [sectionData.summary])

  const [generating, setGenerating] = useState(false)
  const [improving, setImproving] = useState(false)
  const [versions, setVersions] = useState<SummaryVersion[]>([])
  const [improved, setImproved] = useState(false)
  const { cooldownUntil, setCooldownUntil } = useAICooldown("cooldown_summary")
  const [nowTs, setNowTs] = useState(Date.now())
  const lastKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return
    const id = setInterval(() => {
      const ts = Date.now()
      setNowTs(ts)
      if (ts >= cooldownUntil) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [cooldownUntil])

  const inCooldown = nowTs < cooldownUntil
  const cooldownSecs = inCooldown ? Math.ceil((cooldownUntil - nowTs) / 1000) : 0
  const cooldownLabel = cooldownSecs >= 60
    ? `${Math.floor(cooldownSecs / 60)}:${String(cooldownSecs % 60).padStart(2, "0")}`
    : `${cooldownSecs}s`

  async function handleGenerate() {
    if (generating || improving) return
    if (inCooldown) { toast.info(ai("cooldown_wait", { seconds: cooldownLabel })); return }
    const key = `gen:${sectionData.personalDetails?.jobTitle ?? ""}:${JSON.stringify(sectionData.workExperience ?? []).slice(0, 80)}`
    if (key === lastKeyRef.current) { toast.info(ai("no_changes")); return }
    setGenerating(true)
    setVersions([])
    preCheck("generate-summary")
    try {
      const res = await apiFetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionData, language: locale }),
      })
      if (res.status === 429 || res.status === 403) {
        const handled = await handleApiError(res, {
          openUpgradeModal,
          redirect: (p) => router.push(p),
          locale,
          fallbackToast: () => toast.error(res.status === 429 ? ai("rate_limit_exceeded") : ai("pro_only")),
        })
        if (handled || res.status === 429 || res.status === 403) return
      }
      if (res.status === 400) { await res.text().catch(() => {}); toast.error(ai("not_enough_data_summary")); return }
      if (res.status === 422) { await res.text().catch(() => {}); toast.error(ai("off_topic_summary")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await onSuccess()
      const types: SummaryVersion["type"][] = ["executive", "specialist", "value_prop"]
      setVersions((data.versions as string[]).map((text, i) => ({ type: types[i] ?? "executive", text })))
      lastKeyRef.current = key
      setCooldownUntil(Date.now() + 120_000)
    } catch {
      toast.error(ai("error_summary"))
    } finally {
      setGenerating(false)
    }
  }

  async function handleImprove() {
    if (generating || improving) return
    const currentSummary = local
    if (!currentSummary || currentSummary.trim().length < 10) {
      toast.error(ai("improve_summary_empty"))
      return
    }
    if (inCooldown) { toast.info(ai("cooldown_wait", { seconds: cooldownLabel })); return }
    const key = `imp:${currentSummary.trim()}`
    if (key === lastKeyRef.current) { toast.info(ai("no_changes")); return }
    setImproving(true)
    setVersions([])
    preCheck("improve-summary")
    try {
      const res = await apiFetch("/api/ai/improve-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: currentSummary, sectionData, language: locale }),
      })
      if (res.status === 429 || res.status === 403) {
        const handled = await handleApiError(res, {
          openUpgradeModal,
          redirect: (p) => router.push(p),
          locale,
          fallbackToast: () => toast.error(res.status === 429 ? ai("rate_limit_exceeded") : ai("pro_only")),
        })
        if (handled || res.status === 429 || res.status === 403) return
      }
      if (res.status === 400) { await res.text().catch(() => {}); toast.error(ai("improve_summary_empty")); return }
      if (res.status === 422) { await res.text().catch(() => {}); toast.error(ai("off_topic_summary")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await onSuccess()
      const types: SummaryVersion["type"][] = ["executive", "specialist", "value_prop"]
      setVersions((data.versions as string[]).map((text, i) => ({ type: types[i] ?? "executive", text })))
      lastKeyRef.current = key
      setCooldownUntil(Date.now() + 120_000)
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
          disabled={improving || inCooldown || (isPro && (!hasContent || improved))}
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
              : inCooldown
                ? <><Loader2 className="h-3 w-3" />{cooldownLabel}</>
                : improved
                  ? <><Check className="h-3 w-3" />{ai("bullet_improved")}</>
                  : <><Wand2 className="h-3 w-3" />{ai("improve_summary")}</>
          }
        </button>

        {/* Generar con IA */}
        <button
          type="button"
          onClick={isPro ? handleGenerate : openUpgrade}
          disabled={generating || inCooldown || (isPro && local.trim().length > 0)}
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
      <div>
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
            padding: "12px 14px",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.03)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,212,255,0.5)"
            e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.03), 0 0 0 3px rgba(0,212,255,0.08)"
          }}
        />
        <div className="flex justify-end mt-1 pr-1">
          <span
            className="text-[10px] font-medium tabular-nums"
            style={{ color: charCount > 1000 ? "#F59E0B" : "#94A3B8" }}
          >
            {charCount}
          </span>
        </div>
      </div>

      <SummaryVersionModal
        open={versions.length > 0}
        versions={versions}
        onClose={() => setVersions([])}
        onSelect={applyVersion}
      />
    </div>
  )
}
