"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useTranslations, useLocale } from "next-intl"
import { es, enUS } from "date-fns/locale"
import { useUserTimezone, formatInTimezone } from "@/hooks/useUserTimezone"
import { Loader2 } from "lucide-react"
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
import { track } from "@/lib/analytics/track"
import UpgradeCTACard from "./UpgradeCTACard"
import { isActive } from "@/lib/plans"
import { type LetterCard, LetterCardItem, LetterActivityItem } from "./_letter-sub"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"

export default function CoverLettersDashboard({ initialLetters }: { initialLetters: LetterCard[] }) {
  const t = useTranslations("dashboard.cover_letters")
  const locale = useLocale()
  const dateLocale = locale === "es" ? es : enUS
  const userTimezone = useUserTimezone()
  const router = useRouter()
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
  const [letters, setLetters] = useState(initialLetters)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState("")
  const [renaming, setRenaming] = useState(false)
  const { open: openUpgradeModal } = useUpgradeModal()

  async function createLetter() {
    // Double-click guard: lock button for 1.5s to prevent accidental dual creation.
    if (creating) return
    setCreating(true)
    setTimeout(() => setCreating(false), 1500)
    // Freemium funnel: 1 cover letter included free. Beyond that → UpgradeModal.
    if (!isPro && letters.length >= 1) {
      track("paywall_hit", { feature: "cover_cap", current_plan: session?.user?.plan ?? "UNSUBSCRIBED" })
      openUpgradeModal("second-cover-letter")
      return
    }
    if (!isPro) {
      // Free plan still allows the first letter (backend enforces). UI can pass through.
    }
    try {
      const res = await apiFetch("/api/cover-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t("new_letter_title") }),
      })
      if (!res.ok) { toast.error(t("create_error")); setCreating(false); return }
      const data = await res.json()
      if (!data?.id) { toast.error(t("create_error")); setCreating(false); return }
      track("cover_letter_created", { method: "blank" })
      router.push(`/${locale}/cover-letter/${data.id}?new=1`)
    } catch {
      toast.error(t("create_error"))
      setCreating(false)
    }
  }

  async function confirmRename() {
    if (!renameId || !renameDraft.trim()) return
    setRenaming(true)
    try {
      const res = await apiFetch(`/api/cover-letters/${renameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameDraft.trim() }),
      })
      if (res.ok) {
        setLetters((prev) => prev.map((l) => l.id === renameId ? { ...l, title: renameDraft.trim() } : l))
        toast.success(t("rename_success"))
      } else {
        toast.error(t("rename_error"))
      }
    } catch {
      toast.error(t("rename_error"))
    } finally {
      setRenaming(false)
      setRenameId(null)
    }
  }

  async function deleteLetter(id: string) {
    const res = await apiFetch(`/api/cover-letters/${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error(t("delete_error")); setDeleteId(null); return }
    setLetters((prev) => prev.filter((l) => l.id !== id))
    setDeleteId(null)
    toast.success(t("delete_success"))
  }

  return (
    <>
      <div>
        <UpgradeCTACard />

        {/* Page head */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#00D4FF] mb-[6px] flex items-center gap-[7px]">
              <span className="inline-block bg-[#00D4FF] opacity-50" style={{ width: 14, height: 1.5 }} />
              {t("eyebrow")}
            </div>
            <h1
              className="font-bold text-[#1a2e4a] leading-[1.1] m-0"
              style={{ fontFamily: "var(--dash-serif)", fontSize: 32, letterSpacing: "-0.035em" }}
            >
              {t("title")}
            </h1>
            <p className="text-[13.5px] text-[#6B7A8C] mt-[6px] mb-0 flex items-center gap-2 flex-wrap">
              <span>
                {letters.length} {letters.length === 1 ? t("count_one") : t("count_other")} · {t("ai_generated")}
                {isPro ? ` · ${t("plan_pro_suffix")}` : ""}
              </span>
              {!isPro && letters.length >= 1 && (
                <span
                  className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full border border-[rgba(0,212,255,0.35)] text-[#00A8CC]"
                  style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,168,204,0.04))" }}
                >
                  {letters.length}/1
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-[10px] mb-[18px]">
          <span
            className="font-semibold text-[#1a2e4a] flex-1"
            style={{ fontFamily: "var(--dash-serif)", fontSize: 16, letterSpacing: "-0.025em" }}
          >
            {t("section_title")}
          </span>
          <span
            className="text-[11px] text-[#6B7A8C] bg-[#EEF2F9] border border-[#E8EDF6] rounded-lg px-2 py-[2px]"
            style={{ fontFamily: "var(--dash-mono)" }}
          >
            {letters.length} {t("of")} {letters.length}
          </span>
        </div>

        {/* cv-grid */}
        <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {letters.map((letter, i) => (
            <LetterCardItem
              key={letter.id}
              letter={letter}
              index={i}
              locale={locale}
              userTimezone={userTimezone}
              dateLocale={dateLocale}
              onEdit={() => router.push(`/${locale}/cover-letter/${letter.id}`)}
              onRename={() => { setRenameId(letter.id); setRenameDraft(letter.title) }}
              onDelete={() => setDeleteId(letter.id)}
            />
          ))}

          {/* new-cv card */}
          <button
            type="button"
            onClick={createLetter}
            disabled={creating}
            className="cl-new-card cl-card-anim flex flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-[#A0AABE] bg-transparent min-h-[286px]"
            style={{
              cursor: creating ? "not-allowed" : "pointer",
              opacity: creating ? 0.5 : 1,
              transition: "border-color 0.22s ease, background 0.22s ease, transform 0.22s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.22s ease",
              animationDelay: `${(letters.length) * 0.08 + 0.05}s`,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              if (creating) return
              const el = e.currentTarget as HTMLButtonElement
              el.style.borderColor = "#00D4FF"
              el.style.background = "rgba(0,212,255,0.04)"
              el.style.transform = "translateY(-3px)"
              el.style.boxShadow = "0 10px 36px rgba(0,212,255,0.08)"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.borderColor = "#A0AABE"
              el.style.background = "transparent"
              el.style.transform = "translateY(0)"
              el.style.boxShadow = "none"
            }}
          >
            <div
              className="cl-new-ico flex items-center justify-center rounded-full border-[1.5px] border-[#A0AABE] text-[#6B7A8C]"
              style={{ width: 46, height: 46 }}
            >
              {creating ? (
                <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <span className="cl-new-lbl text-sm font-medium text-[#6B7A8C]">{t("new")}</span>
            <span className="cl-new-hint text-[11px] text-[#A0AABE] text-center">{t("new_hint")}</span>
          </button>
        </div>

        {/* Activity section */}
        <div className="mt-10">
          <div
            className="font-semibold text-[#1a2e4a] mb-[14px] flex items-center gap-[10px]"
            style={{ fontFamily: "var(--dash-serif)", fontSize: 15, letterSpacing: "-0.02em" }}
          >
            {t("recent_title")}
            <div className="flex-1 h-px bg-[#E8EDF6]" />
          </div>
          <div className="flex flex-col gap-px">
            {letters.length === 0 ? (
              <p className="text-[12.5px] text-[#6B7A8C] px-[14px] py-2">{t("activity_empty")}</p>
            ) : (
              letters.slice(0, 3).map((l, i) => {
                const isEdit = i === 0 && new Date(l.updatedAt).getTime() !== new Date(l.createdAt).getTime()
                const name = l.title || t("untitled")
                const time = formatInTimezone(isEdit ? l.updatedAt : l.createdAt, userTimezone, dateLocale)
                return (
                  <LetterActivityItem
                    key={l.id}
                    type={isEdit ? "edit" : "create"}
                    name={name}
                    time={time}
                  />
                )
              })
            )}
          </div>
        </div>

        {/* Rename dialog */}
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

        {/* Delete dialog */}
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
                onClick={() => deleteId && deleteLetter(deleteId)}
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
      </div>
    </>
  )
}
