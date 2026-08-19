"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { useEditorPro } from "@/components/editor/EditorContext"
import { Loader2, Lock, Wand2, Check } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { track } from "@/lib/analytics/track"
import SummaryVersionModal, { type SummaryVersion } from "./SummaryVersionModal"
import { useAICooldown } from "@/components/editor/hooks/useAICooldown"
import { useOptimizedGuard } from "@/components/editor/hooks/useOptimizedGuard"
import { useAICall } from "@/hooks/useAICall"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"
import { handleApiError } from "@/lib/upgrade-modal-handler"
import { useRouter } from "next/navigation"

export default function SummarySection() {
  const t = useTranslations("editor.sections_form")
  const ai = useTranslations("editor.ai")
  const { isPro, plan, openUpgrade } = useEditorPro()
  const locale = useLocale()
  const router = useRouter()
  const { open: openUpgradeModal } = useUpgradeModal()
  const { preCheck, onSuccess } = useAICall()
  const { sectionData, updateSectionData, resumeId } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData, resumeId: s.resumeId }))
  )
  // Persistent "already optimized" guard, anchored to summary+description (the
  // exact inputs improve-summary keys on). Survives reload; self-clears on edit.
  const { markOptimized: markSummaryOptimized, isUpToDate: summaryUpToDateFn } =
    useOptimizedGuard(`opt_summary_${resumeId ?? "x"}`)
  const [local, setLocal] = useState(sectionData.summary as string ?? "")
  const commitRef = useRef(updateSectionData)
  commitRef.current = updateSectionData
  useEffect(() => {
    setLocal((sectionData.summary as string) ?? "")
  }, [sectionData.summary])

  const [improving, setImproving] = useState(false)
  const [versions, setVersions] = useState<SummaryVersion[]>([])
  // "Already optimized" now uses the same modal as the version picker instead of
  // a fleeting toast — the "nothing to improve" answer gets a real surface.
  const [emptyNotice, setEmptyNotice] = useState<{ title: string; description: string } | null>(null)
  const [improved, setImproved] = useState(false)
  // Persistent "already optimized" state so the user sees the summary is up to
  // date and stops re-pressing Improve. Anchored to the current text — cleared
  // the moment they edit the summary or their description (either can improve).
  const [upToDate, setUpToDate] = useState(false)
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


  async function handleImprove() {
    if (improving) return
    const currentSummary = local
    // Improving is the only summary action left here. Writing one from nothing
    // moved to the AI assistant, which asks for the material first instead of
    // guessing at an empty CV — so this needs a summary to work on.
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
        body: JSON.stringify({
          summary: currentSummary,
          sectionData,
          language: locale,
        }),
      })
      if (res.status === 429 || res.status === 403) {
        const handled = await handleApiError(res, {
          openUpgradeModal,
          redirect: (p) => router.push(p),
          locale,
          fallbackToast: () => toast.error(res.status === 429 ? ai("rate_limit_exceeded") : ai("pro_only")),
          dailyCapToast: () => toast.warning(ai("daily_cap_reached"), { duration: 6000 }),
        })
        if (handled || res.status === 429 || res.status === 403) return
      }
      if (res.status === 400) { await res.text().catch(() => {}); toast.error(ai("improve_summary_empty")); return }
      if (res.status === 422) { await res.text().catch(() => {}); toast.error(ai("off_topic_summary")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await onSuccess()

      // Check already_optimized status
      if (data.status === "already_optimized") {
        lastKeyRef.current = key
        setCooldownUntil(Date.now() + 120_000)
        setUpToDate(true)
        markSummaryOptimized(guardContent)
        setEmptyNotice({ title: ai("already_optimized_title"), description: ai("summary_already_optimized") })
        return
      }

      track("ai_summary_generated", { plan, mode: "improve" })
      showVersions(data.versions as string[], data.types as string[] | undefined)
      lastKeyRef.current = key
      setCooldownUntil(Date.now() + 120_000)
    } catch {
      toast.error(ai("error_summary"))
    } finally {
      setImproving(false)
    }
  }

  // One owner of "the API answered — show the cards". The label comes from the
  // server now: the quality gate ranks the versions so the cleanest is read
  // first, which means position no longer says which positioning a version was
  // written as. `types` falls back to the old index rule for any path that
  // returns the user's own text and has no positioning to report.
  function showVersions(list: string[], types?: string[]) {
    setEmptyNotice(null)
    setUpToDate(false)
    const byIndex: SummaryVersion["type"][] = ["executive", "specialist", "value_prop"]
    setVersions(list.map((text, i) => ({
      type: (types?.[i] as SummaryVersion["type"]) ?? byIndex[i] ?? "executive",
      text,
    })))
  }

  function applyVersion(version: string) {
    updateSectionData("summary", version)
    setVersions([])
    setImproved(true)
    // The applied version is the optimized content — lock it (persisted) so a
    // reload + re-press doesn't spend a call on what the AI just produced.
    markSummaryOptimized(version.trim())
    toast.success(ai("summary_applied"))
  }

  const charCount = local.length
  const hasContent = local.trim().length >= 10
  // Same content improve-summary keys on. `upToDate` covers the in-session run;
  // the persistent guard covers reload / remount so a re-press can't waste a call.
  const guardContent = local.trim()
  const summaryUpToDate = upToDate || (isPro && summaryUpToDateFn(guardContent))

  return (
    <div className="space-y-3">
      {/* AI action buttons — premium pill style */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Mejorar con IA */}
        <button
          type="button"
          onClick={isPro ? handleImprove : openUpgrade}
          disabled={improving || inCooldown || (isPro && (!hasContent || improved || summaryUpToDate))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: improved || summaryUpToDate
              ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
              : "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
            color: "#fff",
            boxShadow: improved || summaryUpToDate
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
                  : summaryUpToDate
                    ? <><Check className="h-3 w-3" />{ai("summary_up_to_date")}</>
                    : <><Wand2 className="h-3 w-3" />{ai("improve_summary")}</>
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
            if (upToDate) setUpToDate(false)
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
        open={versions.length > 0 || !!emptyNotice}
        versions={versions}
        emptyState={emptyNotice}
        onClose={() => { setVersions([]); setEmptyNotice(null) }}
        onSelect={applyVersion}
      />
    </div>
  )
}
