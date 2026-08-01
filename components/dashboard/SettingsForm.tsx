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
import { track } from "@/lib/analytics/track"
import { hasStripeBillingPortal } from "@/lib/plans"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"
import { FieldInput, BtnGold, BtnGhost, DataCard } from "./_settings-sub"

interface UserData {
  id: string
  name: string | null
  email: string
  image: string | null
  plan: string
  subscriptionStatus: string
  subscriptionEndsAt: Date | null
  planInterval: string | null
  /** Gateway that provisioned the active plan — decides which cancel API to call. */
  paymentProvider?: string | null
  /**
   * Stripe customer behind this row. The hosted portal opens against it, so without one
   * `/api/stripe/portal` returns 400 and the button can only show an error. A PRO row
   * can lack it when the plan was granted outside checkout (admin grant, manual fix).
   */
  stripeCustomerId?: string | null
  createdAt: Date
  isManaged?: boolean
  managedExpiresAt?: Date | null
  managedBlocked?: boolean
}

// ── Shared card header sub-components ────────────────────────────────────────

function CardHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pt-4 pb-3 border-b border-dash-border-s flex items-center gap-[10px]">
      {children}
    </div>
  )
}

function CardIco({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[30px] h-[30px] rounded-lg bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center text-dash-cyan shrink-0">
      {children}
    </div>
  )
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <div className="[font-family:var(--dash-serif)] text-sm font-semibold text-dash-navy tracking-[-0.02em]">{children}</div>
}

function CardSub({ children }: { children: React.ReactNode }) {
  return <div className="text-[11.5px] text-dash-muted mt-px">{children}</div>
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-dash-muted mb-[5px]">
      {children}
    </div>
  )
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-dash-subtle mt-1">{children}</div>
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
  const isOneTime = user.plan === "BASIC" || user.plan === "SPRINT"
  const isActive = subscriptionStatus === "ACTIVE"
  const isPayPalPayer = user.paymentProvider === "PAYPAL"
  // Same rule the pricing page uses (lib/plans.ts) — never re-derived here.
  const hasStripePortal = hasStripeBillingPortal(subscriptionStatus, user.stripeCustomerId)
  const endsAt   = user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null
  const isManaged = !!user.isManaged

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
      track("billing_portal_opened", { provider: "stripe" })
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
      // PayPal subscriptions must be canceled through PayPal's API — calling the
      // Stripe route for a PayPal payer would fail with no_active_subscription.
      const cancelUrl = user.paymentProvider === "PAYPAL" ? "/api/paypal/cancel" : "/api/stripe/cancel"
      const res = await apiFetch(cancelUrl, { method: "POST" })
      const data = await res.json()
      if (res.ok && data.success) {
        track("subscription_canceled", { plan: user.plan, provider: user.paymentProvider === "PAYPAL" ? "paypal" : "stripe" })
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      {/* ── Card 1: Perfil (full width) ── */}
      <div className="col-span-1 sm:col-span-2 bg-white border border-dash-border rounded-[10px] overflow-hidden">
        <CardHead>
          <CardIco>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </CardIco>
          <div>
            <CardTitle>{t("profile_section")}</CardTitle>
            <CardSub>{t("profile_subtitle")}</CardSub>
          </div>
        </CardHead>
        <div className="px-5 py-[18px]">
          {/* Profile row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-[14px] mb-[18px] pb-[18px] border-b border-dash-border-s">
            <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 border-2 [font-family:var(--dash-serif)] bg-gradient-to-br from-[#00D4FF] to-[#00A8CC] border-[rgba(0,212,255,0.3)]">
              {initials}
            </div>
            <div>
              <div className="text-sm font-semibold text-dash-navy">
                {user.name ?? t("no_name")}
              </div>
              <div className="text-xs text-dash-muted [font-family:var(--dash-mono)]">
                {user.email}
              </div>
            </div>
          </div>

          {/* 2-column field grid */}
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
              <div>
                <FieldLabel>{t("name_label")}</FieldLabel>
                <FieldInput
                  value={name}
                  onChange={setName}
                  placeholder={t("name_placeholder")}
                />
              </div>
              <div>
                <FieldLabel>{t("email_label")}</FieldLabel>
                <FieldInput value={user.email} disabled />
                <FieldHint>{t("email_note")}</FieldHint>
              </div>
            </div>
            <div className="mt-4">
              <BtnGold type="submit" disabled={saving}>
                {saving ? t("saving") : t("save_button")}
              </BtnGold>
            </div>
          </form>
        </div>
      </div>

      {/* ── Card 2: Plan y cuenta — hidden for LIMITED (managed) and one-time (BASIC/SPRINT) users ── */}
      {!isManaged && !isOneTime && (
      <div className="bg-white border border-dash-border rounded-[10px] overflow-hidden">
        <CardHead>
          <CardIco>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1l1.8 4.5H14l-3.7 2.7 1.4 4.3L7.5 10l-4.2 2.5 1.4-4.3L1 5.5h4.7L7.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
          </CardIco>
          <div>
            <CardTitle>{t("plan_section_label")}</CardTitle>
            <CardSub>{t("plan_subtitle")}</CardSub>
          </div>
        </CardHead>
        <div className="px-5 py-[18px]">
          {/* Plan row */}
          <div className="flex items-center gap-[14px] px-4 py-[14px] rounded-md mb-4 relative overflow-hidden border bg-gradient-to-br from-[rgba(0,212,255,0.05)] to-[rgba(0,212,255,0.02)] border-[rgba(0,212,255,0.15)]">
            {/* top shimmer line */}
            <div className="absolute top-0 left-0 right-0 h-px opacity-40 bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent" />
            <div className="w-9 h-9 rounded-[9px] flex items-center justify-center text-dash-cyan flex-shrink-0 border bg-[rgba(0,212,255,0.1)] border-[rgba(0,212,255,0.2)]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5l1.8 4.2H14l-3.6 2.6 1.4 4.2L8 10.2l-3.8 2.3 1.4-4.2L2 5.7h4.2L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-dash-navy tracking-[-0.02em] [font-family:var(--dash-serif)]">
                {isPro ? t("plan_pro") : t("plan_free_label")}
              </div>
              <div className="text-[11.5px] text-dash-muted mt-[2px] flex gap-[10px] flex-wrap">
                {isPro && (
                  <>
                    <span className="inline-flex items-center rounded border px-[7px] py-[1px] text-[10px] font-semibold text-dash-cyan tracking-[0.04em] bg-[rgba(0,212,255,0.08)] border-[rgba(0,212,255,0.15)]">
                      {user.planInterval === "annual" ? t("interval_annual") : t("interval_monthly")}
                    </span>
                    <span className="inline-flex items-center rounded border px-[7px] py-[1px] text-[10px] font-semibold text-dash-cyan tracking-[0.04em] bg-[rgba(0,212,255,0.08)] border-[rgba(0,212,255,0.15)]">
                      {user.planInterval === "annual" ? t("price_annual") : t("price_monthly")}
                    </span>
                    {isActive && (
                      <span className="inline-flex items-center rounded border px-[7px] py-[1px] text-[10px] font-semibold text-[#7AAE8A] tracking-[0.04em] bg-[rgba(90,140,106,0.12)] border-[rgba(90,140,106,0.2)]">
                        {t("status_active_badge")}
                      </span>
                    )}
                    {subscriptionStatus === "CANCELED" && (
                      <span className="inline-flex items-center rounded border px-[7px] py-[1px] text-[10px] font-semibold text-[#D97706] tracking-[0.04em] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]">
                        {t("status_canceled_badge")}
                      </span>
                    )}
                  </>
                )}
                {!isPro && (
                  <span className="inline-flex items-center rounded border border-dash-border-s px-[7px] py-[1px] text-[10px] font-semibold text-dash-subtle tracking-[0.04em] bg-dash-surface">
                    {t("status_no_subscription")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-[7px] mb-4">
            {[
              t("pro_benefit_1"),
              t("pro_benefit_2"),
              t("pro_benefit_3"),
              t("pro_benefit_4"),
            ].map(benefit => (
              <div key={benefit} className="flex items-center gap-[9px] text-[12.5px] text-dash-navy">
                {/* background URL is a static data URI — keep inline */}
                <span
                  className="w-[14px] h-[14px] rounded-full flex-shrink-0 border"
                  style={{
                    background: "rgba(16,185,129,0.2) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath d='M1.5 4l2 2 3-3' stroke='%2310B981' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E\") no-repeat center",
                    borderColor: "rgba(16,185,129,0.3)",
                  }}
                />
                {benefit}
              </div>
            ))}
          </div>

          {isPro ? (
            <>
              {/* Stripe's hosted Billing Portal has no PayPal equivalent — showing
                  this button to a PayPal payer would just 400. They manage the
                  subscription through the cancel action below instead. */}
              {/* Also hidden for a PRO row with no Stripe customer: the portal has
                  nothing to open, so the button could only produce an error toast.
                  The cancel action below still applies to them. */}
              {!isPayPalPayer && hasStripePortal && (
                <BtnGhost onClick={handleBillingPortal} disabled={portalLoading} fullWidth>
                  {portalLoading ? t("opening_portal") : t("manage_billing")}
                </BtnGhost>
              )}
              <div className="text-[11px] text-dash-subtle mt-[10px] text-center">
                  {t("member_since")} {format(new Date(user.createdAt), "MMMM yyyy", { locale: dateLocale })}
                  {endsAt && isActive && (
                    <span className="ml-1">
                      {" · "}{t("renews_on")} <strong>{format(endsAt, locale === "es" ? "d 'de' MMMM yyyy" : "MMMM d, yyyy", { locale: dateLocale })}</strong>
                    </span>
                  )}
                  {isActive && (
                    <>
                      {" · "}
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <span className="text-[#C08080] cursor-pointer" />
                          }
                        >
                          {cancelLoading ? t("canceling") : t("cancel_subscription")}
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("cancel_dialog_title")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("cancel_dialog_desc")}
                              {endsAt && <> <strong>{format(endsAt, locale === "es" ? "d 'de' MMMM yyyy" : "MMMM d, yyyy", { locale: dateLocale })}</strong>.</>}
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
            </>
          ) : (
            <BtnGold onClick={() => { window.location.href = `/${locale}/pricing` }} fullWidth>
              {t("activate_pro")}
            </BtnGold>
          )}
        </div>
      </div>
      )}

      {/* ── One-time plan info (BASIC/SPRINT): no billing management, just expiry ── */}
      {isOneTime && (
        <div className="bg-white border border-dash-border rounded-[10px] overflow-hidden mb-4">
          <CardHead>
            <CardIco>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M7.5 1l1.8 4.5H14l-3.7 2.7 1.4 4.3L7.5 10l-4.2 2.5 1.4-4.3L1 5.5h4.7L7.5 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </CardIco>
            <div>
              <CardTitle>{locale === "es" ? "Tu plan" : "Your plan"}</CardTitle>
              <CardSub>{locale === "es" ? "Acceso de pago único" : "One-time access"}</CardSub>
            </div>
          </CardHead>
          <div className="px-5 py-[18px] flex items-center gap-[14px]">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-dash-cyan bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)]">
              {user.plan === "SPRINT" ? "Job Sprint" : "Basic"}
            </span>
            {user.subscriptionEndsAt && (
              <span className="text-[12.5px] text-dash-muted">
                {locale === "es" ? "Vence el " : "Expires "}
                <strong className="text-dash-navy">
                  {format(new Date(user.subscriptionEndsAt), "d MMM yyyy", { locale: locale === "es" ? es : enUS })}
                </strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Card 3: Mis datos — hidden for LIMITED (managed) and UNSUBSCRIBED users ── */}
      {!isManaged && isPro && (
      <DataCard
        exportLoading={exportLoading}
        deleteLoading={deleteLoading}
        handleDataExport={handleDataExport}
        handleDeleteAccount={handleDeleteAccount}
      />
      )}

      {/* ── Card 4: Programa de referidos (full width) — hidden for managed users ── */}
      {!isManaged && (
      <div className="col-span-1 sm:col-span-2 bg-white border border-dash-border rounded-[10px] overflow-hidden">
        <CardHead>
          <CardIco>
            {/* share/link icon */}
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="12" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="12" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="3" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M10.5 3.75L4.5 7M10.5 11.25L4.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </CardIco>
          <div>
            <CardTitle>{tRef("title")}</CardTitle>
            <CardSub>{tRef("description")}</CardSub>
          </div>
        </CardHead>
        <div className="px-5 py-[18px]">
          <ReferralCard embeddedMode />
        </div>
      </div>
      )}

    </div>
  )
}

