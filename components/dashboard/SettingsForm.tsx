"use client"

import { useState, useEffect } from "react"
import { logoutAction } from "@/lib/actions/logout"
import { useTranslations, useLocale } from "next-intl"
import ReferralCard from "@/components/dashboard/ReferralCard"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"
import {
  cardHeadStyle, cardIcoStyle, cardTitleStyle, cardSubStyle,
  fieldLabelStyle, fieldHintStyle,
  FieldInput, BtnGold, BtnGhost, DataCard,
} from "./_settings-sub"

interface UserData {
  id: string
  name: string | null
  email: string
  image: string | null
  plan: string
  subscriptionStatus: string
  subscriptionEndsAt: Date | null
  planInterval: string | null
  createdAt: Date
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SettingsForm({ user }: { user: UserData }) {
  const t = useTranslations("dashboard.settings")
  const tRef = useTranslations("referral")
  const locale = useLocale()
  const dateLocale = locale === "es" ? es : enUS

  const [name, setName]                 = useState(user.name ?? "")
  const [saving, setSaving]             = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState(user.subscriptionStatus)

  const initials = (user.name ?? user.email)
    .split(" ")
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("") || "U"

  const isPro    = user.plan === "PRO"
  const isActive = subscriptionStatus === "ACTIVE"
  const endsAt   = user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null

  async function saveProfile() {
    if (saving) return
    setSaving(true)
    try {
      const res = await apiFetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) toast.success(t("save_success"))
      else toast.error(t("save_error"))
    } catch {
      toast.error(t("save_error"))
    } finally {
      setSaving(false)
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    saveProfile()
  }

  useEffect(() => {
    const handler = () => saveProfile()
    document.addEventListener("settings-save", handler)
    return () => document.removeEventListener("settings-save", handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  async function handleBillingPortal() {
    setPortalLoading(true)
    try {
      const res = await apiFetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      })
      const { url } = await res.json()
      if (!res.ok || !url) { toast.error(t("portal_error")); return }
      window.location.href = url
    } catch {
      toast.error(t("portal_error"))
    } finally {
      setPortalLoading(false)
    }
  }

  async function handleCancelSubscription() {
    setCancelLoading(true)
    try {
      const res = await apiFetch("/api/stripe/cancel", { method: "POST" })
      const data = await res.json()
      if (res.ok && data.success) {
        setSubscriptionStatus("CANCELED")
        toast.success(t("cancel_success"))
      } else {
        toast.error(data.error ?? t("cancel_error"))
      }
    } catch {
      toast.error(t("connection_error"))
    } finally {
      setCancelLoading(false)
    }
  }

  async function handleDataExport() {
    setExportLoading(true)
    try {
      const res = await apiFetch("/api/user/data-export")
      if (!res.ok) { toast.error(t("export_error")); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "readycv-data-export.json"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t("export_error"))
    } finally {
      setExportLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    try {
      const res = await apiFetch("/api/user/delete", { method: "DELETE" })
      if (res.ok) await logoutAction(`/${locale}/`)
      else toast.error(t("delete_error"))
    } catch {
      toast.error(t("delete_error"))
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
      maxWidth: 820,
    }}>

      {/* ── Card 1: Perfil (full width) ── */}
      <div style={{
        gridColumn: "1 / -1",
        background: "white", border: "1px solid #D9E1ED",
        borderRadius: 10, overflow: "hidden",
      }}>
        <div style={cardHeadStyle}>
          <div style={cardIcoStyle}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={cardTitleStyle}>{t("profile_section")}</div>
            <div style={cardSubStyle}>{t("profile_subtitle")}</div>
          </div>
        </div>
        <div style={{ padding: "18px 20px" }}>
          {/* Profile row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            marginBottom: 18, paddingBottom: 18,
            borderBottom: "1px solid #E8EDF6",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--dash-serif,Georgia,serif)",
              fontSize: 18, fontWeight: 700, color: "white",
              flexShrink: 0, border: "2px solid rgba(0,212,255,0.3)",
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2e4a" }}>
                {user.name ?? t("no_name")}
              </div>
              <div style={{ fontSize: 12, color: "#6B7A8C", fontFamily: "var(--mono,monospace)" }}>
                {user.email}
              </div>
            </div>
          </div>

          {/* 2-column field grid */}
          <form onSubmit={handleSave}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ marginBottom: 0 }}>
                <div style={fieldLabelStyle}>{t("name_label")}</div>
                <FieldInput
                  value={name}
                  onChange={setName}
                  placeholder={t("name_placeholder")}
                />
              </div>
              <div style={{ marginBottom: 0 }}>
                <div style={fieldLabelStyle}>{t("email_label")}</div>
                <FieldInput value={user.email} disabled />
                <div style={fieldHintStyle}>{t("email_note")}</div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <BtnGold type="submit" disabled={saving}>
                {saving ? t("saving") : t("save_button")}
              </BtnGold>
            </div>
          </form>
        </div>
      </div>

      {/* ── Card 2: Plan y cuenta ── */}
      <div style={{
        background: "white", border: "1px solid #D9E1ED",
        borderRadius: 10, overflow: "hidden",
      }}>
        <div style={cardHeadStyle}>
          <div style={cardIcoStyle}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1l1.8 4.5H14l-3.7 2.7 1.4 4.3L7.5 10l-4.2 2.5 1.4-4.3L1 5.5h4.7L7.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={cardTitleStyle}>{t("plan_section_label")}</div>
            <div style={cardSubStyle}>{t("plan_subtitle")}</div>
          </div>
        </div>
        <div style={{ padding: "18px 20px" }}>
          {/* Plan row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 16px",
            background: "linear-gradient(135deg, rgba(0,212,255,0.05), rgba(0,212,255,0.02))",
            border: "1px solid rgba(0,212,255,0.15)",
            borderRadius: 6, marginBottom: 16,
            position: "relative", overflow: "hidden",
          }}>
            {/* top shimmer line */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg, transparent, #00D4FF, transparent)",
              opacity: 0.4,
            }} />
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#00D4FF", flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5l1.8 4.2H14l-3.6 2.6 1.4 4.2L8 10.2l-3.8 2.3 1.4-4.2L2 5.7h4.2L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "var(--dash-serif,Georgia,serif)",
                fontSize: 14, fontWeight: 700, color: "#1a2e4a", letterSpacing: "-0.02em",
              }}>
                {isPro ? t("plan_pro") : t("plan_free_label")}
              </div>
              <div style={{ fontSize: 11.5, color: "#6B7A8C", marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                {isPro && (
                  <>
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)",
                      borderRadius: 4, padding: "1px 7px",
                      fontSize: 10, fontWeight: 600, color: "#00D4FF", letterSpacing: "0.04em",
                    }}>
                      {user.planInterval === "annual" ? t("interval_annual") : t("interval_monthly")}
                    </span>
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)",
                      borderRadius: 4, padding: "1px 7px",
                      fontSize: 10, fontWeight: 600, color: "#00D4FF", letterSpacing: "0.04em",
                    }}>
                      {user.planInterval === "annual" ? t("price_annual") : t("price_monthly")}
                    </span>
                    {isActive && (
                      <span style={{
                        display: "inline-flex", alignItems: "center",
                        background: "rgba(90,140,106,0.12)", border: "1px solid rgba(90,140,106,0.2)",
                        borderRadius: 4, padding: "1px 7px",
                        fontSize: 10, fontWeight: 600, color: "#7AAE8A", letterSpacing: "0.04em",
                      }}>
                        {t("status_active_badge")}
                      </span>
                    )}
                    {subscriptionStatus === "CANCELED" && (
                      <span style={{
                        display: "inline-flex", alignItems: "center",
                        background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                        borderRadius: 4, padding: "1px 7px",
                        fontSize: 10, fontWeight: 600, color: "#D97706", letterSpacing: "0.04em",
                      }}>
                        {t("status_canceled_badge")}
                      </span>
                    )}
                  </>
                )}
                {!isPro && (
                  <span style={{
                    display: "inline-flex", alignItems: "center",
                    background: "#F5F7FB", border: "1px solid #E8EDF6",
                    borderRadius: 4, padding: "1px 7px",
                    fontSize: 10, fontWeight: 600, color: "#A0AABE", letterSpacing: "0.04em",
                  }}>
                    {t("status_no_subscription")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
            {[
              t("pro_benefit_1"),
              t("pro_benefit_2"),
              t("pro_benefit_3"),
              t("pro_benefit_4"),
            ].map(benefit => (
              <div key={benefit} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "#1a2e4a" }}>
                <span style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: "rgba(16,185,129,0.2) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath d='M1.5 4l2 2 3-3' stroke='%2310B981' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E\") no-repeat center",
                  border: "1px solid rgba(16,185,129,0.3)",
                  flexShrink: 0,
                }} />
                {benefit}
              </div>
            ))}
          </div>

          {isPro ? (
            <>
              <BtnGhost onClick={handleBillingPortal} disabled={portalLoading} fullWidth>
                {portalLoading ? t("opening_portal") : t("manage_billing")}
              </BtnGhost>
              {endsAt && (
                <div style={{ fontSize: 11, color: "#A0AABE", marginTop: 10, textAlign: "center" }}>
                  {t("member_since")} {format(new Date(user.createdAt), "MMMM yyyy", { locale: dateLocale })}
                  {isActive && (
                    <>
                      {" · "}
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <span style={{ color: "#C08080", cursor: "pointer" }} />
                          }
                        >
                          {cancelLoading ? t("canceling") : t("cancel_subscription")}
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("cancel_dialog_title")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("cancel_dialog_desc")}
                              {endsAt && <> <strong>{format(endsAt, "d 'de' MMMM yyyy", { locale: dateLocale })}</strong>.</>}
                              {" "}{t("cancel_dialog_after")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("keep_subscription")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleCancelSubscription}
                              className="bg-destructive text-white hover:bg-destructive/90"
                            >
                              {t("confirm_cancel")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <BtnGold onClick={() => { window.location.href = `/${locale}/pricing` }} fullWidth>
              Activar PRO
            </BtnGold>
          )}
        </div>
      </div>

      {/* ── Card 3: Mis datos ── */}
      <DataCard
        exportLoading={exportLoading}
        deleteLoading={deleteLoading}
        handleDataExport={handleDataExport}
        handleDeleteAccount={handleDeleteAccount}
      />

      {/* ── Card 4: Programa de referidos (full width) ── */}
      <div style={{
        gridColumn: "1 / -1",
        background: "white", border: "1px solid #D9E1ED",
        borderRadius: 10, overflow: "hidden",
      }}>
        <div style={cardHeadStyle}>
          <div style={cardIcoStyle}>
            {/* share/link icon */}
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="12" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="12" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="3" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M10.5 3.75L4.5 7M10.5 11.25L4.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={cardTitleStyle}>{tRef("title")}</div>
            <div style={cardSubStyle}>{tRef("description")}</div>
          </div>
        </div>
        <div style={{ padding: "18px 20px" }}>
          <ReferralCard embeddedMode />
        </div>
      </div>

    </div>
  )
}
