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
import { isActive } from "@/lib/plans"
import CVCard, { NewCVCard, type ResumeCard } from "./CVCard"
import { ProBanner, UpgradeStatusOverlay, StatsRow, ResumesToolbar, ActivityFeed } from "./_resume-sub"

export default function ResumesDashboard({ initialResumes }: { initialResumes: ResumeCard[] }) {
  const t = useTranslations("dashboard.resumes")
  const locale = useLocale()
  const dateLocale = locale === "es" ? es : enUS
  const userTimezone = useUserTimezone()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const isPro = isActive(
    session?.user?.plan ?? "UNSUBSCRIBED",
    session?.user?.subscriptionEndsAt ? new Date(session.user.subscriptionEndsAt) : null,
    session?.user?.subscriptionStatus,
    session?.user?.role,
  )
  const [resumes, setResumes] = useState(initialResumes)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState("")
  const [renaming, setRenaming] = useState(false)
  const [creating, setCreating] = useState(false)
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())
  const [portalLoading, setPortalLoading] = useState(false)

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
          const data = await res.json() as { plan: string; subscriptionStatus: string }
          if (data.plan === "PRO" && (data.subscriptionStatus === "ACTIVE" || data.subscriptionStatus === "PAST_DUE")) {
            upgradeActiveRef.current = false
            setUpgradeState("confirmed")
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

  function requirePro() {
    router.push(`/${locale}/pricing`)
    toast.info(t("require_pro_toast"))
  }

  async function createResume() {
    if (!isPro) { requirePro(); return }
    setCreating(true)
    try {
      const res = await apiFetch("/api/resumes", { method: "POST" })
      if (!res.ok) { toast.error(t("create_error")); return }
      const data = await res.json()
      router.push(`/${locale}/editor/${data.id}?new=1`)
    } catch {
      toast.error(t("create_error"))
      setCreating(false)
    }
  }

  async function deleteResume(id: string) {
    try {
      const res = await apiFetch(`/api/resumes/${id}`, { method: "DELETE" })
      if (!res.ok) { toast.error(t("delete_error")); return }
      setResumes((prev) => prev.filter((r) => r.id !== id))
      setDeleteId(null)
      toast.success(t("delete_success"))
    } catch {
      toast.error(t("delete_error"))
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

  async function duplicateResume(id: string) {
    try {
      const res = await apiFetch(`/api/resumes/${id}/duplicate`, { method: "POST" })
      if (!res.ok) { toast.error(t("duplicate_error")); return }
      const copy = await res.json()
      setResumes((prev) => [copy, ...prev])
      toast.success(t("duplicate_success"))
    } catch {
      toast.error(t("duplicate_error"))
    }
  }

  async function downloadPdf(resume: ResumeCard) {
    if (downloadingIds.has(resume.id)) return
    setDownloadingIds((prev) => new Set(prev).add(resume.id))

    const download = async () => {
      const res = await apiFetch(`/api/resumes/${resume.id}/pdf?locale=${locale}`)
      if (!res.ok) throw new Error(t("pdf_error"))
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${resume.title || "resume"}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1_000)
      return `${resume.title || "resume"}.pdf`
    }

    toast.promise(download(), {
      loading: t("pdf_loading"),
      success: (filename) => filename,
      error: (err) => err instanceof Error ? err.message : t("pdf_error"),
      finally: () => {
        setDownloadingIds((prev) => {
          const next = new Set(prev)
          next.delete(resume.id)
          return next
        })
      },
    })
  }

  // ── Upgrade flow overlay ────────────────────────────────────────────────────

  if (upgradeState !== "idle") {
    return <UpgradeStatusOverlay upgradeState={upgradeState} />
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  const hasRecentEdit = resumes.length > 0 &&
    new Date(resumes[0].updatedAt).getTime() !== new Date(resumes[0].createdAt).getTime()

  return (
    <div>
      <UpgradeCTACard />

      {/* ── Page head ── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#00D4FF] mb-[6px] flex items-center gap-[7px]">
            <span className="inline-block flex-shrink-0 bg-[#00D4FF] opacity-50" style={{ width: "14px", height: "1.5px" }} />
            {t("eyebrow")}
          </div>
          <h1
            className="font-bold text-[#1a2e4a] leading-[1.1]"
            style={{
              fontFamily: "var(--dash-serif)",
              fontSize: "clamp(28px, 4vw, 32px)",
              letterSpacing: "-0.035em",
            }}
          >
            {t("page_title")}
          </h1>
          <p className="text-[13.5px] text-[#6B7A8C] mt-[6px]">
            {resumes.length} {resumes.length === 1 ? t("active_document_one") : t("active_documents_other")}
            {isPro ? ` · ${t("plan_pro_suffix")}` : ""}
          </p>
        </div>
      </div>

      {/* ── Pro upsell / manage plan ── */}
      {!isPro && <ProBanner onManagePlan={handleBillingPortal} portalLoading={portalLoading} />}

      {/* ── Stats row ── */}
      <StatsRow resumes={resumes} isPro={isPro} />

      {/* ── Toolbar ── */}
      <ResumesToolbar count={resumes.length} />

      {/* ── CV grid ── */}
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
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
            onDownload={() => downloadPdf(resume)}
            onDelete={() => setDeleteId(resume.id)}
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
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent
          className="p-0 overflow-hidden"
          style={{ borderRadius: "16px", maxWidth: "400px", border: "1px solid #D9E1ED", boxShadow: "0 40px 100px rgba(0,212,255,0.08)" }}
        >
          <div
            className="text-center relative border-b border-[#E8EDF6]"
            style={{
              padding: "30px 28px 16px",
              background: "linear-gradient(180deg, #F5F7FB 0%, white 100%)",
            }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 opacity-60"
              style={{
                width: "60%",
                height: "1px",
                background: "linear-gradient(90deg, transparent, #00D4FF, transparent)",
              }}
            />
            <div
              className="flex items-center justify-center text-[#EF4444] mx-auto mb-[14px]"
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.08)",
                border: "1.5px solid rgba(239,68,68,0.2)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              </svg>
            </div>
            <AlertDialogTitle className="sr-only">{t("delete_title")}</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">{t("delete_description")}</AlertDialogDescription>
            <div
              className="font-bold text-[#1a2e4a] mb-[6px]"
              style={{ fontFamily: "var(--dash-serif)", fontSize: "22px", letterSpacing: "-0.03em" }}
              aria-hidden="true"
            >
              {t("delete_title")}
            </div>
            <div
              className="text-sm text-[#6B7A8C] leading-[1.5] mx-auto"
              style={{ maxWidth: "280px" }}
              aria-hidden="true"
            >
              {t("delete_description")}
            </div>
          </div>
          <div className="flex gap-[10px]" style={{ padding: "18px 24px 22px" }}>
            <AlertDialogCancel
              style={{ flex: 1, padding: "11px 16px", fontSize: "13px", fontWeight: 500, fontFamily: "inherit", justifyContent: "center" }}
            >
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteResume(deleteId)}
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                color: "white",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(220,38,38,0.25)",
                border: "none",
                padding: "11px 16px",
                fontSize: "13px",
                fontFamily: "inherit",
                cursor: "pointer",
                justifyContent: "center",
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Rename dialog ── */}
      <AlertDialog open={!!renameId} onOpenChange={(o) => !o && setRenameId(null)}>
        <AlertDialogContent
          className="p-0 overflow-hidden"
          style={{ borderRadius: "16px", maxWidth: "400px", border: "1px solid #D9E1ED", boxShadow: "0 40px 100px rgba(0,212,255,0.08)" }}
        >
          <div
            className="text-center relative border-b border-[#E8EDF6]"
            style={{
              padding: "30px 28px 16px",
              background: "linear-gradient(180deg, #F5F7FB 0%, white 100%)",
            }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 opacity-60"
              style={{
                width: "60%",
                height: "1px",
                background: "linear-gradient(90deg, transparent, #00D4FF, transparent)",
              }}
            />
            <div
              className="flex items-center justify-center text-[#00D4FF] mx-auto mb-[14px]"
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,168,204,0.04))",
                border: "1.5px solid rgba(0,212,255,0.25)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <AlertDialogTitle className="sr-only">{t("rename_title")}</AlertDialogTitle>
            <div
              className="font-bold text-[#1a2e4a]"
              style={{ fontFamily: "var(--dash-serif)", fontSize: "22px", letterSpacing: "-0.03em" }}
              aria-hidden="true"
            >
              {t("rename_title")}
            </div>
          </div>
          <div style={{ padding: "18px 24px 22px" }}>
            <input
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4"
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmRename()}
              maxLength={200}
              autoFocus
            />
            <div className="flex gap-[10px]">
              <AlertDialogCancel
                style={{ flex: 1, padding: "11px 16px", fontSize: "13px", fontWeight: 500, fontFamily: "inherit", justifyContent: "center" }}
              >
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRename}
                disabled={renaming || !renameDraft.trim()}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
                  color: "white",
                  fontWeight: 600,
                  boxShadow: "0 2px 8px rgba(0,212,255,0.25)",
                  border: "none",
                  padding: "11px 16px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  cursor: renaming || !renameDraft.trim() ? "not-allowed" : "pointer",
                  justifyContent: "center",
                }}
              >
                {renaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("rename_confirm")}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
