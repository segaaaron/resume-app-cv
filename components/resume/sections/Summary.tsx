"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { useEditorPro } from "@/components/editor/EditorContext"
import { Sparkles, Loader2, Lock, Wand2, Check, PenLine } from "lucide-react"
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
  // "Already optimized" now uses the same modal as the version picker instead of
  // a fleeting toast — the "nothing to improve" answer gets a real surface.
  const [emptyNotice, setEmptyNotice] = useState<{ title: string; description: string } | null>(null)
  const [improved, setImproved] = useState(false)
  // Persistent "already optimized" state so the user sees the summary is up to
  // date and stops re-pressing Improve. Anchored to the current text — cleared
  // the moment they edit the summary or their description (either can improve).
  const [upToDate, setUpToDate] = useState(false)
  // The way in for someone with no CV yet. improve-summary has always had the
  // branch for it ("create a summary from scratch, based on the candidate's
  // description") and the copy below was written in both languages, but no
  // input ever sent userDescription — so Generate answered an empty CV with a
  // 400 and a dead-end toast, and improve_summary_empty promised "write a
  // summary OR describe your profile" with nowhere to describe it.
  const [description, setDescription] = useState("")
  const [describing, setDescribing] = useState(false)
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
          dailyCapToast: () => toast.warning(ai("daily_cap_reached"), { duration: 6000 }),
        })
        if (handled || res.status === 429 || res.status === 403) return
      }
      if (res.status === 400) {
        // An empty CV is not an error — it is a request for material. The
        // server stays the only owner of "is there enough to write from"; the
        // rule is not restated here, we just react to its verdict.
        const body = await res.json().catch(() => ({}))
        if (body.error === "not_enough_data") { setDescribing(true); return }
        toast.error(ai("not_enough_data_summary"))
        return
      }
      if (res.status === 422) { await res.text().catch(() => {}); toast.error(ai("off_topic_summary")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await onSuccess()

      // The server returns versions:[] + already_optimized when every version was
      // dropped, and its own comment says "so the frontend can show its own
      // empty-state". It never did: showVersions([]) leaves the modal closed, so
      // the click ended in nothing — no modal, no toast — while still burning a
      // use and a 2-minute cooldown.
      //
      // Not the "already optimized" copy improve uses: on Generate the user has
      // no summary, so telling them theirs is already good would be a lie. What
      // actually happened is that every version was discarded for claiming
      // things the CV does not state, and more detail is what fixes it.
      if (data.status === "already_optimized" || (data.versions as string[]).length === 0) {
        lastKeyRef.current = key
        setCooldownUntil(Date.now() + 120_000)
        toast.info(ai("generate_summary_no_result"))
        return
      }

      showVersions(data.versions as string[], data.types as string[] | undefined)
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
    const desc = description.trim()
    // Either is enough. The endpoint picks its own branch: with a summary it
    // polishes, with only a description it writes from scratch — which is the
    // whole point of the box, and what improve_summary_empty has been
    // promising ("write a summary OR describe your profile") all along.
    if ((!currentSummary || currentSummary.trim().length < 10) && desc.length < 5) {
      toast.error(ai("improve_summary_empty"))
      return
    }
    if (inCooldown) { toast.info(ai("cooldown_wait", { seconds: cooldownLabel })); return }
    const key = `imp:${currentSummary.trim()}:${desc}`
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
          userDescription: desc || undefined,
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
        setEmptyNotice({ title: ai("already_optimized_title"), description: ai("summary_already_optimized") })
        return
      }

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
    toast.success(ai("summary_applied"))
  }

  const charCount = local.length
  const hasContent = local.trim().length >= 10
  const hasDescription = description.trim().length >= 5

  return (
    <div className="space-y-3">
      {/* AI action buttons — premium pill style */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Mejorar con IA */}
        <button
          type="button"
          onClick={isPro ? handleImprove : openUpgrade}
          disabled={improving || inCooldown || (isPro && ((!hasContent && !hasDescription) || improved || upToDate))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: improved || upToDate
              ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
              : "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
            color: "#fff",
            boxShadow: improved || upToDate
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
                  : upToDate
                    ? <><Check className="h-3 w-3" />{ai("summary_up_to_date")}</>
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
        {/* Describe your profile — the way in when there is no CV to write from */}
        {isPro && (
          <button
            type="button"
            onClick={() => setDescribing((v) => !v)}
            aria-expanded={describing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-200"
            style={{
              background: describing
                ? "linear-gradient(135deg, rgba(26,46,74,0.09) 0%, rgba(0,212,255,0.10) 100%)"
                : "transparent",
              color: "#1a2e4a",
              border: `1.5px solid ${describing ? "rgba(0,212,255,0.5)" : "rgba(26,46,74,0.18)"}`,
              boxShadow: describing ? "0 2px 8px rgba(0,212,255,0.12)" : "none",
            }}
          >
            <PenLine className="h-3 w-3" style={{ opacity: 0.75 }} />
            {ai("describe_profile")}
          </button>
        )}
      </div>

      {describing && isPro && (
        <div
          className="space-y-2"
          style={{
            background: "linear-gradient(135deg, rgba(26,46,74,0.04) 0%, rgba(0,212,255,0.05) 100%)",
            border: "1.5px solid rgba(0,212,255,0.22)",
            borderRadius: 12,
            padding: "12px 14px",
            boxShadow: "0 2px 10px rgba(26,46,74,0.05)",
          }}
        >
          <p className="text-[11px] leading-snug font-medium" style={{ color: "#5A6B84" }}>
            {ai("improve_summary_hint")}
          </p>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); if (upToDate) setUpToDate(false) }}
            placeholder={ai("improve_summary_placeholder")}
            rows={3}
            maxLength={500}
            className="w-full resize-none text-[13px] leading-relaxed text-[#1a2e4a] placeholder:text-slate-400 outline-none transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.75)",
              border: "1.5px solid rgba(0,212,255,0.2)",
              borderRadius: 10,
              padding: "10px 12px",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.5)" }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.2)" }}
          />
          <div className="flex justify-end pr-0.5">
            {/* The server caps userDescription at 500; the counter warns before
                it, rather than letting the request come back rejected. */}
            <span
              className="text-[10px] font-medium tabular-nums"
              style={{ color: description.length > 450 ? "#F59E0B" : "#94A3B8" }}
            >
              {description.length}/500
            </span>
          </div>
        </div>
      )}

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
