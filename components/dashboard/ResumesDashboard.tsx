"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { logoutAction } from "@/lib/actions/logout"
import { useTranslations, useLocale } from "next-intl"
import { es, enUS } from "date-fns/locale"
import { useUserTimezone, formatInTimezone } from "@/hooks/useUserTimezone"
import { Loader2 } from "lucide-react"
import UpgradeCTACard from "./UpgradeCTACard"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { track, trackFirstDownloadOnce } from "@/lib/analytics/track"
import { isActive, purchaseConfirmed } from "@/lib/plans"
import CVCard, { NewCVCard, type ResumeCard } from "./CVCard"
import { ProBanner, UpgradeStatusOverlay, StatsRow, ResumesToolbar, ActivityFeed, TranslatingOverlay } from "./_resume-sub"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"

export default function ResumesDashboard({
  initialResumes,
  canManageBilling = false,
}: {
  initialResumes: ResumeCard[]
  /**
   * Resolved server-side: the Stripe portal can actually be opened. The session token
   * has no customer id, so this cannot be derived here — and without it the "manage
   * plan" action 400s and only shows an error toast.
   */
  canManageBilling?: boolean
}) {
  const t = useTranslations("dashboard.resumes")
  const locale = useLocale()
  const dateLocale = locale === "es" ? es : enUS
  const userTimezone = useUserTimezone()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const isPro = isActive(
    session?.user?.plan ?? "UNSUBSCRIBED",
    session?.user?.subscriptionEndsAt ? new Date(session.user.subscriptionEndsAt) : null,
    session?.user?.subscriptionStatus,
    session?.user?.role,
    session?.user?.isManaged,
    session?.user?.managedBlocked,
    session?.user?.managedExpiresAt ? new Date(session.user.managedExpiresAt) : null,
  )
  const isManaged = !!session?.user?.isManaged
  const [resumes, setResumes] = useState(initialResumes)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState("")
  const [renaming, setRenaming] = useState(false)
  const [creating, setCreating] = useState(false)
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set())
  const [showPersonalUseWarning, setShowPersonalUseWarning] = useState(false)
  const [personalUseConsented, setPersonalUseConsented] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const { open: openUpgradeModal } = useUpgradeModal()

  // Generate thumbnails for CVs that don't have one yet (staggered, fire-and-forget)
  useEffect(() => {
    const missing = initialResumes.filter((r) => !r.thumbnailUrl)
    if (missing.length === 0) return
    let cancelled = false
    const run = async () => {
      for (const resume of missing) {
        if (cancelled) break
        try {
          const res = await apiFetch(`/api/resumes/${resume.id}/thumbnail?locale=${locale}`, { method: "POST", silent: true })
          if (res.ok) {
            const data = await res.json() as { thumbnailUrl?: string }
            if (data.thumbnailUrl) {
              setResumes((prev) => prev.map((r) => r.id === resume.id ? { ...r, thumbnailUrl: data.thumbnailUrl! } : r))
            }
          }
        } catch { /* ignore */ }
        // stagger: 1.5s between each to avoid overwhelming browser pool
        await new Promise((resolve) => setTimeout(resolve, 1_500))
      }
    }
    run()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Post-purchase flow
  type UpgradeState = "idle" | "waiting" | "confirmed" | "timeout"
  const [upgradeState, setUpgradeState] = useState<UpgradeState>("idle")
  const upgradeActiveRef = useRef(false)
  // M5: track poll timer so it can be cancelled on unmount
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // B-5: store logout timer in a ref so cleanup can always cancel it
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Names the plan in the confirmation copy — "Pro" was hardcoded for all four. */
  const [purchasedPlan, setPurchasedPlan] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get("upgraded") !== "true") return
    const url = new URL(window.location.href)
    url.searchParams.delete("upgraded")
    window.history.replaceState({}, "", url.toString())

    setUpgradeState("waiting")
    upgradeActiveRef.current = true

    const started = Date.now()
    const MAX_MS = 30_000
    let intervalMs = 2_000

    const poll = async () => {
      if (!upgradeActiveRef.current) return
      if (Date.now() - started > MAX_MS) { setUpgradeState("timeout"); return }
      try {
        const res = await apiFetch("/api/billing/post-purchase-status", { silent: true })
        if (res.ok) {
          const data = await res.json() as { plan: string; subscriptionStatus: string; subscriptionEndsAt: string | null }
          // EVERY paid plan, not just PRO. This asked for `plan === "PRO"` inline, so
          // BASIC and SPRINT buyers never matched: the spinner ran the full 30s after a
          // payment that had already succeeded, and the timeout copy then told them to
          // look for "Pro access" they never bought.
          if (purchaseConfirmed(data)) {
            upgradeActiveRef.current = false
            // One-time plans are always single-window; recurring cycle isn't known
            // here (checkout_started already captured it), so omit it for PRO.
            track("plan_purchased", {
              plan: data.plan,
              billing_cycle: data.plan === "BASIC" || data.plan === "SPRINT" ? "one_time" : undefined,
            })
            setPurchasedPlan(data.plan)
            setUpgradeState("confirmed")
            // The JWT carries the plan, so the session is refreshed by signing back in.
            logoutTimerRef.current = setTimeout(() => logoutAction(`/${locale}/login`), 3_000)
            return
          }
        }
      } catch { /* transient error — keep polling */ }
      intervalMs = Math.min(intervalMs * 1.5, 8_000)
      // M5: store timer ID so cleanup can cancel it
      pollTimerRef.current = setTimeout(poll, intervalMs)
    }

    poll()
    return () => {
      upgradeActiveRef.current = false
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleBillingPortal() {
    setPortalLoading(true)
    try {
      const res = await apiFetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) { toast.error(t("portal_error")); return }
      window.location.href = data.url
    } catch {
      toast.error(t("portal_error"))
    } finally {
      setPortalLoading(false)
    }
  }


  function requirePersonalUseConsent(action: () => Promise<void>) {
    setPersonalUseConsented(false)
    setPendingAction(() => action)
    setShowPersonalUseWarning(true)
  }

  function createResume() {
    // Double-click guard: lock button for 1.5s to prevent accidental dual creation.
    if (creating) return
    setCreating(true)
    setTimeout(() => setCreating(false), 1500)
    // Freemium funnel: 1 CV included on free plan. Beyond that → UpgradeModal.
    if (!isPro && resumes.length >= 1) {
      track("paywall_hit", { feature: "resume_cap", current_plan: session?.user?.plan ?? "UNSUBSCRIBED" })
      openUpgradeModal("second-resume")
      return
    }
    if (isPro && resumes.length >= 1) {
      requirePersonalUseConsent(doCreateResume)
      return
    }
    doCreateResume()
  }

  async function doCreateResume() {
    setCreating(true)
    try {
      const res = await apiFetch("/api/resumes", { method: "POST" })
      if (!res.ok) { toast.error(t("create_error")); return }
      const data = await res.json()
      track("resume_created", { method: "blank" })
      router.push(`/${locale}/editor/${data.id}?new=1`)
    } catch {
      toast.error(t("create_error"))
      setCreating(false)
    }
  }

  async function deleteResume(id: string) {
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/resumes/${id}`, { method: "DELETE" })
      if (!res.ok) { toast.error(t("delete_error")); return }
      setResumes((prev) => prev.filter((r) => r.id !== id))
      setDeleteId(null)
      toast.success(t("delete_success"))
    } catch {
      toast.error(t("delete_error"))
    } finally {
      setDeleting(false)
    }
  }

  async function confirmRename() {
    if (!renameId || !renameDraft.trim()) return
    setRenaming(true)
    try {
      const res = await apiFetch(`/api/resumes/${renameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameDraft.trim() }),
      })
      if (res.ok) {
        setResumes((prev) => prev.map((r) => r.id === renameId ? { ...r, title: renameDraft.trim() } : r))
        setRenameId(null)
        toast.success(t("rename_success"))
      } else {
        toast.error(t("rename_error"))
      }
    } catch {
      toast.error(t("rename_error"))
    } finally {
      setRenaming(false)
    }
  }

  function duplicateResume(id: string) {
    requirePersonalUseConsent(() => doDuplicateResume(id))
  }

  async function doDuplicateResume(id: string) {
    try {
      const res = await apiFetch(`/api/resumes/${id}/duplicate`, { method: "POST" })
      if (!res.ok) { toast.error(t("duplicate_error")); return }
      const copy = await res.json()
      setResumes((prev) => [copy, ...prev])
      track("resume_duplicated")
      toast.success(t("duplicate_success"))
    } catch {
      toast.error(t("duplicate_error"))
    }
  }

  // Translate — PRO/LIMITED only (server enforces via AI quota). Auto-detects
  // the resume's language and saves the translation as a NEW resume (copy).
  function translateResume(id: string) {
    if (!isPro) {
      track("paywall_hit", { feature: "ai", current_plan: session?.user?.plan ?? "UNSUBSCRIBED" })
      openUpgradeModal("pro-feature", { feature: t("translate"), endpoint: "translate-cv" })
      return
    }
    requirePersonalUseConsent(() => doTranslateResume(id))
  }

  async function doTranslateResume(id: string) {
    if (translatingIds.has(id)) return
    setTranslatingIds((prev) => new Set(prev).add(id))
    try {
      const res = await apiFetch(`/api/resumes/${id}/translate`, { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string }))
        const code = (body as { error?: string })?.error
        if (res.status === 429 || code === "daily_cap_reached") toast.error(t("translate_daily_cap"))
        else if (res.status === 403) toast.error(t("translate_pro_only"))
        else if (code === "nothing_to_translate") toast.info(t("translate_empty"))
        else toast.error(t("translate_error"))
        return
      }
      const copy = await res.json()
      if (copy.alreadyTranslated) {
        // Server dedup: translation already existed (stale UI / race) — inform,
        // don't add a duplicate to the list.
        toast.info(t("translate_already"))
      } else {
        setResumes((prev) => [copy, ...prev])
        track("resume_translated", { target_locale: copy?.locale === "en" ? "en" : copy?.locale === "es" ? "es" : undefined })
        toast.success(t("translate_success"))
      }
    } catch {
      toast.error(t("translate_error"))
    } finally {
      setTranslatingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  async function downloadPdf(resume: ResumeCard) {
    // The free tier (UNSUBSCRIBED) may download its basic-template CV a bounded
    // number of times/day — let it attempt; the server enforces the cap and
    // returns a paywall status we funnel to the upgrade modal. Managed-expired
    // users get a neutral message (no upsell).
    if (downloadingIds.has(resume.id)) return
    setDownloadingIds((prev) => new Set(prev).add(resume.id))

    const toastId = toast.loading(t("pdf_loading"))
    try {
      const res = await apiFetch(`/api/resumes/${resume.id}/pdf?locale=${locale}`)
      if (!res.ok) {
        if (res.status === 403 && isManaged) {
          toast.error(t("pdf_error_managed_expired"), { id: toastId })
          return
        }
        // Daily free cap reached, or a paid-only template/plan → upgrade funnel
        // (no error toast — the modal is the message).
        const body = await res.json().catch(() => ({} as { error?: string }))
        const paywall =
          (res.status === 429 && body?.error === "free_daily_download_cap") ||
          (res.status === 403 &&
            (body?.error === "premium_template_requires_upgrade" || body?.error === "subscription_required"))
        if (paywall) {
          toast.dismiss(toastId)
          track("paywall_hit", { feature: "download", current_plan: session?.user?.plan ?? "UNSUBSCRIBED" })
          openUpgradeModal("download")
          return
        }
        toast.error(t("pdf_error"), { id: toastId })
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${resume.title || "resume"}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1_000)
      track("pdf_downloaded", { type: "resume", plan: session?.user?.plan ?? "UNSUBSCRIBED" })
      trackFirstDownloadOnce({ plan: session?.user?.plan ?? "UNSUBSCRIBED" })
      toast.success(`${resume.title || "resume"}.pdf`, { id: toastId })
    } catch {
      toast.error(t("pdf_error"), { id: toastId })
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev)
        next.delete(resume.id)
        return next
      })
    }
  }

  // ── Upgrade flow overlay ────────────────────────────────────────────────────

  if (upgradeState !== "idle") {
    return <UpgradeStatusOverlay upgradeState={upgradeState} purchasedPlan={purchasedPlan} />
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  const hasRecentEdit = resumes.length > 0 &&
    new Date(resumes[0].updatedAt).getTime() !== new Date(resumes[0].createdAt).getTime()

  return (
    <div>
      {translatingIds.size > 0 && <TranslatingOverlay />}
      <UpgradeCTACard />

      {/* ── Page head ── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-dash-cyan mb-[6px] flex items-center gap-[7px]">
            <span className="inline-block flex-shrink-0 w-[14px] h-px bg-dash-cyan opacity-50" />
            {t("eyebrow")}
          </div>
          <h1
            className="font-bold text-dash-navy leading-[1.1]"
            style={{
              fontFamily: "var(--dash-serif)",
              fontSize: "clamp(28px, 4vw, 32px)",
              letterSpacing: "-0.035em",
            }}
          >
            {t("page_title")}
          </h1>
          <p className="text-[13.5px] text-dash-muted mt-[6px] flex items-center gap-2 flex-wrap">
            <span>
              {resumes.length} {resumes.length === 1 ? t("active_document_one") : t("active_documents_other")}
              {isPro ? ` · ${t("plan_pro_suffix")}` : ""}
            </span>
            {!isPro && resumes.length >= 1 && (
              <span
                className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full border border-[rgba(0,212,255,0.35)] text-[#00A8CC]"
                style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,168,204,0.04))" }}
              >
                {resumes.length}/1
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Manage plan (active PRO only) — non-PRO users get UpgradeCTACard above ── */}
      {isPro && (
        <ProBanner
          onManagePlan={canManageBilling ? handleBillingPortal : undefined}
          portalLoading={portalLoading}
        />
      )}

      {/* ── Stats row ── */}
      <StatsRow resumes={resumes} isPro={isPro} />

      {/* ── Toolbar ── */}
      <ResumesToolbar count={resumes.length} />

      {/* ── CV grid ── */}
      <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
        {resumes.map((resume, i) => (
          <CVCard
            key={resume.id}
            resume={resume}
            locale={locale}
            userTimezone={userTimezone}
            dateLocale={dateLocale}
            isDownloading={downloadingIds.has(resume.id)}
            index={i}
            onEdit={() => router.push(`/${locale}/editor/${resume.id}`)}
            onRename={() => { setRenameId(resume.id); setRenameDraft(resume.title) }}
            onDuplicate={() => duplicateResume(resume.id)}
            onTranslate={() => translateResume(resume.id)}
            onDownload={() => downloadPdf(resume)}
            onDelete={() => setDeleteId(resume.id)}
            hasTranslation={resumes.some((r) => r.translatedFromId === resume.id)}
          />
        ))}
        <NewCVCard creating={creating} index={resumes.length} onClick={createResume} />
      </div>

      {/* ── Activity feed ── */}
      <ActivityFeed
        resumes={resumes}
        hasRecentEdit={hasRecentEdit}
        userTimezone={userTimezone}
        dateLocale={dateLocale}
        formatFn={formatInTimezone}
      />


      {/* ── Delete dialog ── */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && !deleting && setDeleteId(null)}>
        <AlertDialogContent
          className="p-0 overflow-hidden rounded-2xl max-w-[400px] border border-dash-border shadow-[0_40px_100px_rgba(0,212,255,0.08)]"
        >
          <div
            className="text-center relative border-b border-dash-border-s px-7 pt-[30px] pb-4"
            style={{ background: "linear-gradient(180deg, #F5F7FB 0%, white 100%)" }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px opacity-60"
              style={{ background: "linear-gradient(90deg, transparent, #00D4FF, transparent)" }}
            />
            <div className="flex items-center justify-center text-red-500 mx-auto mb-[14px] w-[60px] h-[60px] rounded-full bg-red-500/[0.08] border border-red-500/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              </svg>
            </div>
            <AlertDialogTitle className="sr-only">{t("delete_title")}</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">{t("delete_description")}</AlertDialogDescription>
            <div
              className="font-bold text-dash-navy mb-[6px] text-[22px] tracking-[-0.03em]"
              style={{ fontFamily: "var(--dash-serif)" }}
              aria-hidden="true"
            >
              {t("delete_title")}
            </div>
            <div className="text-sm text-dash-muted leading-[1.5] mx-auto max-w-[280px]" aria-hidden="true">
              {t("delete_description")}
            </div>
          </div>
          <div className="flex gap-[10px] px-6 pt-[18px] pb-[22px]">
            <AlertDialogCancel disabled={deleting} className="flex-1 px-4 py-[11px] text-[13px] font-medium justify-center disabled:opacity-50">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (deleteId) deleteResume(deleteId) }}
              disabled={deleting}
              className="flex-1 px-4 py-[11px] text-[13px] font-semibold text-white justify-center border-none cursor-pointer shadow-[0_2px_8px_rgba(220,38,38,0.25)] disabled:opacity-80 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)" }}
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("delete")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Rename dialog ── */}
      <AlertDialog open={!!renameId} onOpenChange={(o) => !o && setRenameId(null)}>
        <AlertDialogContent
          className="p-0 overflow-hidden rounded-2xl max-w-[400px] border border-dash-border shadow-[0_40px_100px_rgba(0,212,255,0.08)]"
        >
          <div
            className="text-center relative border-b border-dash-border-s px-7 pt-[30px] pb-4"
            style={{ background: "linear-gradient(180deg, #F5F7FB 0%, white 100%)" }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px opacity-60"
              style={{ background: "linear-gradient(90deg, transparent, #00D4FF, transparent)" }}
            />
            <div
              className="flex items-center justify-center text-dash-cyan mx-auto mb-[14px] w-[60px] h-[60px] rounded-full border border-dash-cyan/25"
              style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,168,204,0.04))" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <AlertDialogTitle className="sr-only">{t("rename_title")}</AlertDialogTitle>
            <div
              className="font-bold text-dash-navy text-[22px] tracking-[-0.03em]"
              style={{ fontFamily: "var(--dash-serif)" }}
              aria-hidden="true"
            >
              {t("rename_title")}
            </div>
          </div>
          <div className="px-6 pt-[18px] pb-[22px]">
            <input
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4"
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmRename()}
              maxLength={200}
              autoFocus
            />
            <div className="flex gap-[10px]">
              <AlertDialogCancel className="flex-1 px-4 py-[11px] text-[13px] font-medium justify-center">
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRename}
                disabled={renaming || !renameDraft.trim()}
                className="flex-1 px-4 py-[11px] text-[13px] font-semibold text-white justify-center border-none shadow-[0_2px_8px_rgba(0,212,255,0.25)] disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)" }}
              >
                {renaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("rename_confirm")}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Personal use warning dialog (shown on 2nd+ CV creation) ── */}
      <AlertDialog open={showPersonalUseWarning} onOpenChange={(o) => !o && setShowPersonalUseWarning(false)}>
        <AlertDialogContent
          className="p-0 overflow-hidden rounded-2xl max-w-[420px] border border-yellow-300 shadow-[0_40px_100px_rgba(245,158,11,0.12)]"
        >
          <div
            className="text-center relative border-b border-amber-100 px-7 pt-[30px] pb-4"
            style={{ background: "linear-gradient(180deg, #FFFBEB 0%, white 100%)" }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px opacity-60"
              style={{ background: "linear-gradient(90deg, transparent, #F59E0B, transparent)" }}
            />
            <div className="flex items-center justify-center text-amber-600 mx-auto mb-[14px] w-[60px] h-[60px] rounded-full bg-amber-500/10 border border-amber-500/30">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <AlertDialogTitle className="sr-only">{t("personal_use_warning_title")}</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">{t("personal_use_warning_desc")}</AlertDialogDescription>
            <div
              className="font-bold text-dash-navy mb-[6px] text-[20px] tracking-[-0.03em]"
              style={{ fontFamily: "var(--dash-serif)" }}
              aria-hidden="true"
            >
              {t("personal_use_warning_title")}
            </div>
            <div className="text-sm text-dash-muted leading-[1.6] mx-auto max-w-[320px]" aria-hidden="true">
              {t("personal_use_warning_desc")}
            </div>
          </div>
          <div className="px-6 pt-[18px] pb-[22px]">
            <label className="flex items-start gap-3 cursor-pointer mb-5 rounded-lg p-3 bg-amber-500/[0.06] border border-amber-500/20">
              <input
                type="checkbox"
                checked={personalUseConsented}
                onChange={(e) => setPersonalUseConsented(e.target.checked)}
                className="mt-0.5 shrink-0 w-4 h-4 accent-amber-500"
              />
              <span className="text-xs text-gray-600 leading-[1.6]">
                {t("personal_use_consent_label")}
              </span>
            </label>
            <div className="flex gap-[10px]">
              <AlertDialogCancel
                onClick={() => setShowPersonalUseWarning(false)}
                className="flex-1 px-4 py-[11px] text-[13px] font-medium justify-center"
              >
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={!personalUseConsented}
                onClick={() => { setShowPersonalUseWarning(false); pendingAction?.() }}
                className="flex-1 px-4 py-[11px] text-[13px] font-semibold justify-center border-none transition-all duration-200 disabled:cursor-not-allowed"
                style={{
                  background: personalUseConsented
                    ? "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)"
                    : "#E5E7EB",
                  color: personalUseConsented ? "white" : "#9CA3AF",
                  boxShadow: personalUseConsented ? "0 2px 8px rgba(0,212,255,0.25)" : "none",
                }}
              >
                {t("personal_use_confirm")}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
