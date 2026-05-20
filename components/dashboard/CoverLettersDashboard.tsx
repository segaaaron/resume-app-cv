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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import UpgradeCTACard from "./UpgradeCTACard"
import { isActive } from "@/lib/plans"
import { type LetterCard, LetterCardItem, LetterActivityItem } from "./_letter-sub"

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
  )
  const [letters, setLetters] = useState(initialLetters)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  function requirePro() {
    router.push(`/${locale}/pricing`)
    toast.info(t("require_pro_toast"))
  }

  async function createLetter() {
    if (!isPro) { requirePro(); return }
    setCreating(true)
    try {
      const res = await apiFetch("/api/cover-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t("new_letter_title") }),
      })
      if (!res.ok) { toast.error(t("create_error")); setCreating(false); return }
      const data = await res.json()
      if (!data?.id) { toast.error(t("create_error")); setCreating(false); return }
      router.push(`/${locale}/cover-letter/${data.id}?new=1`)
    } catch {
      toast.error(t("create_error"))
      setCreating(false)
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
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cl-card-anim { animation: cardIn 0.45s cubic-bezier(0.34,1.1,0.64,1) both; }
        .cl-thumb-hover { transition: transform 0.22s cubic-bezier(0.34,1.2,0.64,1); }
        .cl-card-wrap:hover .cl-thumb-hover { transform: translateY(-6px) scale(1.03); }
        .cl-overlay { opacity: 0; transition: opacity 0.2s ease; }
        .cl-card-wrap:hover .cl-overlay { opacity: 1; }
        .cl-ov-label { opacity: 0; transition: opacity 0.2s ease 0.05s; }
        .cl-card-wrap:hover .cl-ov-label { opacity: 1; }
        .cl-card-wrap::after {
          content: ''; position: absolute; bottom: 0; left: 20%; right: 20%;
          height: 1px; background: #00D4FF; opacity: 0;
          transition: opacity 0.25s ease; filter: blur(2px);
        }
        .cl-card-wrap:hover::after { opacity: 0.4; }
        .cl-new-ico { transition: all 0.2s ease; }
        .cl-new-card:hover .cl-new-ico { border-color: #00D4FF !important; color: #00D4FF !important; background: rgba(0,212,255,0.08) !important; }
        .cl-new-lbl { transition: color 0.2s ease; }
        .cl-new-card:hover .cl-new-lbl { color: #00D4FF !important; }
        .cl-new-hint { transition: color 0.2s ease; }
        .cl-new-card:hover .cl-new-hint { color: #6B7A8C !important; }
      `}</style>

      <div>
        <UpgradeCTACard />

        {/* Page head */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#00D4FF", marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 14, height: 1.5, background: "#00D4FF", opacity: 0.5, display: "inline-block" }} />
              Documentos
            </div>
            <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 32, fontWeight: 700, color: "#1a2e4a", letterSpacing: "-0.035em", lineHeight: 1.1, margin: 0 }}>
              Cartas de Presentación
            </h1>
            <p style={{ fontSize: 13.5, color: "#6B7A8C", marginTop: 6, marginBottom: 0 }}>
              {letters.length} {letters.length === 1 ? "carta activa" : "cartas activas"} · Generadas con IA
              {isPro ? " · Plan PRO" : ""}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 16, fontWeight: 600, color: "#1a2e4a", letterSpacing: "-0.025em", flex: 1 }}>
            Mis cartas
          </span>
          <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "#6B7A8C", background: "#EEF2F9", border: "1px solid #E8EDF6", borderRadius: 8, padding: "2px 8px" }}>
            {letters.length} de {letters.length}
          </span>
        </div>

        {/* cv-grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
          {letters.map((letter, i) => (
            <LetterCardItem
              key={letter.id}
              letter={letter}
              index={i}
              locale={locale}
              userTimezone={userTimezone}
              dateLocale={dateLocale}
              onEdit={() => router.push(`/${locale}/cover-letter/${letter.id}`)}
              onDelete={() => setDeleteId(letter.id)}
            />
          ))}

          {/* new-cv card */}
          <button
            type="button"
            onClick={createLetter}
            disabled={creating || !isPro}
            className="cl-new-card cl-card-anim"
            style={{
              border: "1px dashed #A0AABE", borderRadius: 10, background: "transparent",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              minHeight: 286, gap: 12,
              cursor: creating || !isPro ? "not-allowed" : "pointer",
              opacity: creating || !isPro ? 0.5 : 1,
              transition: "border-color 0.22s ease, background 0.22s ease, transform 0.22s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.22s ease",
              animationDelay: `${(letters.length) * 0.08 + 0.05}s`,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              if (creating || !isPro) return
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
            <div className="cl-new-ico" style={{ width: 46, height: 46, borderRadius: "50%", border: "1.5px solid #A0AABE", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7A8C" }}>
              {creating ? (
                <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <span className="cl-new-lbl" style={{ fontSize: 13, fontWeight: 500, color: "#6B7A8C" }}>Nueva carta</span>
            <span className="cl-new-hint" style={{ fontSize: 11, color: "#A0AABE", textAlign: "center" }}>Genera con IA o escribe desde cero</span>
          </button>
        </div>

        {/* gold-rule */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "32px 0 24px" }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #D9E1ED)" }} />
          <span style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 13, color: "#00D4FF", opacity: 0.3, letterSpacing: "0.2em", whiteSpace: "nowrap" }}>· · ·</span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #D9E1ED, transparent)" }} />
        </div>

        {/* Activity section */}
        <div>
          <div style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 15, fontWeight: 600, color: "#1a2e4a", letterSpacing: "-0.02em", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
            Cartas recientes
            <div style={{ flex: 1, height: 1, background: "#E8EDF6" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {letters.length === 0 ? (
              <p style={{ fontSize: 12.5, color: "#6B7A8C", padding: "8px 14px" }}>Sin actividad reciente</p>
            ) : (
              letters.slice(0, 3).map((l, i) => {
                const isEdit = i === 0 && new Date(l.updatedAt).getTime() !== new Date(l.createdAt).getTime()
                const name = l.title || "Sin título"
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

        {/* Delete dialog */}
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
                onClick={() => deleteId && deleteLetter(deleteId)}
              >
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}
