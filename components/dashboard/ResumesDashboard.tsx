"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { logoutAction } from "@/lib/actions/logout"
import { useTranslations, useLocale } from "next-intl"
import { es, enUS } from "date-fns/locale"
import { useUserTimezone } from "@/hooks/useUserTimezone"
import { Plus, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import ImportResumeButton from "./ImportResumeButton"
import UpgradeCTACard from "./UpgradeCTACard"
import LocaleSwitcher from "@/components/marketing/LocaleSwitcher"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { isActive } from "@/lib/plans"
import CVCard, { type ResumeCard } from "./CVCard"
import SectionHeader from "./SectionHeader"

export default function ResumesDashboard({ initialResumes }: { initialResumes: ResumeCard[] }) {
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
  )
  const [resumes, setResumes] = useState(initialResumes)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState("")
  const [renaming, setRenaming] = useState(false)
  const [creating, setCreating] = useState(false)
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())

  // Generate thumbnails for CVs that don't have one yet (staggered, fire-and-forget)
  useEffect(() => {
    const missing = initialResumes.filter((r) => !r.thumbnailUrl)
    if (missing.length === 0) return
    let cancelled = false
    const run = async () => {
      for (const resume of missing) {
        if (cancelled) break
        try {
          const res = await fetch(`/api/resumes/${resume.id}/thumbnail?locale=${locale}`, { method: "POST" })
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

    let logoutTimeout: ReturnType<typeof setTimeout> | null = null

    const poll = async () => {
      if (!upgradeActiveRef.current) return
      if (Date.now() - started > MAX_MS) {
        setUpgradeState("timeout")
        return
      }
      try {
        const res = await fetch("/api/billing/post-purchase-status")
        if (res.ok) {
          const data = await res.json() as { plan: string; subscriptionStatus: string }
          if (data.plan === "PRO" && (data.subscriptionStatus === "ACTIVE" || data.subscriptionStatus === "PAST_DUE")) {
            upgradeActiveRef.current = false
            setUpgradeState("confirmed")
            logoutTimeout = setTimeout(() => logoutAction(`/${locale}/login`), 3_000)
            return
          }
        }
      } catch { /* transient error — keep polling */ }
      intervalMs = Math.min(intervalMs * 1.5, 8_000)
      setTimeout(poll, intervalMs)
    }

    poll()
    return () => {
      upgradeActiveRef.current = false
      if (logoutTimeout) clearTimeout(logoutTimeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  if (upgradeState === "waiting" || upgradeState === "confirmed" || upgradeState === "timeout") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm px-6">
          {upgradeState === "waiting" && (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div>
                <p className="text-lg font-semibold">{t("syncing_title")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("syncing_subtitle")}</p>
              </div>
            </>
          )}
          {upgradeState === "confirmed" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div>
                <p className="text-lg font-semibold">{t("welcome_pro_title")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("upgrade_relogin_subtitle")}</p>
              </div>
            </>
          )}
          {upgradeState === "timeout" && (
            <>
              <AlertCircle className="h-12 w-12 text-amber-500" />
              <div>
                <p className="text-lg font-semibold">{t("timeout_title")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("timeout_subtitle")}</p>
              </div>
              <Button onClick={() => logoutAction(`/${locale}/login`)}>
                {t("timeout_reload")}
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <UpgradeCTACard />
      <SectionHeader
        title={t("title")}
        count={resumes.length}
        onNew={createResume}
        newLabel={t("new")}
        creating={creating}
      >
        <LocaleSwitcher />
        <ImportResumeButton disabled={!isPro} />
      </SectionHeader>

      {resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-[var(--brand-50)] flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t("empty_title")}</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">{t("empty_subtitle")}</p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button onClick={createResume} disabled={creating} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              {t("create_from_scratch")}
            </Button>
            <span className="text-xs text-muted-foreground">{t("or")}</span>
            <ImportResumeButton disabled={!isPro} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <button
            onClick={createResume}
            disabled={creating}
            className="aspect-[3/4] border-2 border-dashed border-[#7B2D42]/30 rounded-2xl flex flex-col items-center justify-center gap-3 text-[#7B2D42]/60 hover:border-[#7B2D42]/60 hover:text-[#7B2D42] hover:bg-[#7B2D42]/5 transition-all group cursor-pointer"
          >
            <div className="h-12 w-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">{t("new")}</span>
          </button>

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
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("delete_description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteResume(deleteId)}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!renameId} onOpenChange={(o) => !o && setRenameId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("rename_title")}</AlertDialogTitle>
          </AlertDialogHeader>
          <input
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmRename()}
            maxLength={200}
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRename} disabled={renaming || !renameDraft.trim()}>
              {renaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("rename_confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
