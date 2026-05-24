"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { apiFetch } from "@/lib/apiFetch"
import { toast } from "sonner"

export default function AcceptTermsPage() {
  const t = useTranslations("accept_terms")
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? "es"
  const { data: session, status, update } = useSession()
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (status === "authenticated" && session?.user?.termsAcceptedAt) {
      router.replace(`/${locale}/dashboard/resumes`)
    }
  }, [status, session, locale, router])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/${locale}/login`)
    }
  }, [status, locale, router])

  async function handleAccept() {
    setAccepting(true)
    try {
      const res = await apiFetch("/api/auth/accept-terms", { method: "POST" })
      if (!res.ok) { toast.error(t("error")); setAccepting(false); return }
      // Pass termsAcceptedAt so the JWT callback skips the DB roundtrip (fast path).
      // Hard navigation ensures the browser sends the updated cookie to middleware.
      await update({ termsAcceptedAt: new Date().toISOString() })
      window.location.href = `/${locale}/dashboard/resumes`
    } catch {
      toast.error(t("error"))
      setAccepting(false)
    }
  }

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F9FC" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #E8EDF6", borderTopColor: "#00D4FF", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#F7F9FC", padding: "24px",
    }}>
      <div style={{
        background: "white", borderRadius: 16, boxShadow: "0 8px 40px rgba(26,46,74,0.10)",
        padding: "40px 36px", maxWidth: 480, width: "100%",
      }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(0,212,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>

        <h1 style={{ fontFamily: "var(--dash-serif)", fontSize: 22, fontWeight: 700, color: "#1a2e4a", textAlign: "center", marginBottom: 8 }}>
          {t("title")}
        </h1>
        <p style={{ fontSize: 14, color: "#6B7A8C", textAlign: "center", marginBottom: 28, lineHeight: 1.6 }}>
          {t("subtitle")}
        </p>

        <div style={{ background: "#F7F9FC", borderRadius: 10, padding: "16px 18px", marginBottom: 28, fontSize: 13, color: "#4A5568", lineHeight: 1.7 }}>
          <p style={{ margin: 0 }}>{t("summary")}</p>
        </div>

        <div style={{ display: "flex", gap: 8, fontSize: 13, color: "#6B7A8C", marginBottom: 28, alignItems: "flex-start" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>
            {t("read_prefix")}{" "}
            <a href={`/${locale}/terms`} target="_blank" rel="noreferrer" style={{ color: "#00A8CC", textDecoration: "underline" }}>
              {t("terms_link")}
            </a>
            {" "}{t("and")}{" "}
            <a href={`/${locale}/privacy`} target="_blank" rel="noreferrer" style={{ color: "#00A8CC", textDecoration: "underline" }}>
              {t("privacy_link")}
            </a>
          </span>
        </div>

        <button
          onClick={handleAccept}
          disabled={accepting}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
            background: accepting ? "#A0AEC0" : "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
            color: "white", fontSize: 14, fontWeight: 600, cursor: accepting ? "not-allowed" : "pointer",
            transition: "all 0.18s ease",
          }}
        >
          {accepting ? t("accepting") : t("accept_button")}
        </button>
      </div>
    </div>
  )
}
