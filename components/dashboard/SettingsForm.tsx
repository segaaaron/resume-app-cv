"use client"

import { useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { User, Mail, Calendar, Crown, AlertCircle, BadgeCheck, Zap, Clock, CheckCircle2, Star, Sparkles, RefreshCcw, Download, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"

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

export default function SettingsForm({ user }: { user: UserData }) {
  const t = useTranslations("dashboard.settings")
  const locale = useLocale()
  const dateLocale = locale === "es" ? es : enUS
  const [name, setName] = useState(user.name ?? "")
  const [saving, setSaving] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState(user.subscriptionStatus)
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleCancelSubscription() {
    setCancelLoading(true)
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" })
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
      const res = await fetch("/api/user/data-export")
      if (!res.ok) {
        toast.error("Error al exportar los datos")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "readycv-data-export.json"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Error al exportar los datos")
    } finally {
      setExportLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" })
      if (res.ok) {
        // Sign out and redirect to home
        const { signOut } = await import("next-auth/react")
        await signOut({ callbackUrl: `/${locale}/` })
      } else {
        toast.error("Error al eliminar la cuenta")
      }
    } catch {
      toast.error("Error al eliminar la cuenta")
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        toast.success(t("save_success"))
      } else {
        toast.error(t("save_error"))
      }
    } catch {
      toast.error(t("save_error"))
    } finally {
      setSaving(false)
    }
  }

  const intervalLabel = user.planInterval === "annual" ? "Anual" : user.planInterval === "monthly" ? "Mensual" : null
  const planLabel = user.plan === "PRO"
    ? `Pro ${intervalLabel ? `· ${intervalLabel}` : ""}`
    : user.plan === "TRIAL" ? "Trial" : t("plan_free")
  const planColor = user.plan === "PRO" ? "bg-amber-100 text-amber-700" : user.plan === "TRIAL" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"

  const isCanceled = subscriptionStatus === "CANCELED"
  const isActive = subscriptionStatus === "ACTIVE"

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("subtitle")}</p>
      </div>

      {/* Profile Card */}
      <div className="border border-border rounded-xl p-6 space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          {t("profile_section")}
        </h2>

        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="text-lg">
              {user.name?.charAt(0)?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name ?? t("no_name")}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Separator />

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("name_label")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("name_placeholder")}
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("email_label")}</Label>
            <div className="flex items-center gap-2">
              <Input value={user.email} disabled className="bg-muted" />
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground">{t("email_note")}</p>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? t("saving") : t("save_button")}
          </Button>
        </form>
      </div>

      {/* Plan Card */}
      {(() => {
        const endsAt = user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null
        const today = new Date()

        // Billing progress calculation
        const periodDays = user.planInterval === "annual" ? 365 : 30
        const periodStart = endsAt
          ? new Date(endsAt.getTime() - periodDays * 24 * 60 * 60 * 1000)
          : null
        const daysElapsed = periodStart
          ? Math.max(0, Math.min(periodDays, Math.floor((today.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000))))
          : 0
        const progressPercent = periodDays > 0 ? Math.round((daysElapsed / periodDays) * 100) : 0

        // Countdown for canceled state
        const daysLeft = endsAt
          ? Math.max(0, Math.ceil((endsAt.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)))
          : 0

        // ── PRO ACTIVO ────────────────────────────────────────────────────
        if (user.plan === "PRO" && isActive) {
          return (
            <div className="rounded-2xl overflow-hidden border border-indigo-200/60 shadow-sm">
              {/* Header gradient */}
              <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white/70 text-xs font-medium tracking-wide uppercase">Plan y cuenta</p>
                      <p className="text-white font-bold text-lg leading-tight">Pro</p>
                    </div>
                  </div>
                  {/* Chips */}
                  <div className="flex flex-wrap justify-end gap-2">
                    <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      <Sparkles className="h-3 w-3" />
                      {user.planInterval === "annual" ? "Anual" : "Mensual"}
                    </span>
                    <span className="inline-flex items-center bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      {user.planInterval === "annual" ? "$144/yr" : "$15/mo"}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-emerald-400/30 text-emerald-100 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <BadgeCheck className="h-3 w-3" />
                      Activo
                    </span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="bg-gradient-to-b from-indigo-50/60 to-white px-6 py-5 space-y-5">

                {/* Renewal date box */}
                {endsAt && (
                  <div className="rounded-xl bg-white border border-indigo-100 shadow-sm px-4 py-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">{t("renewal_notice")}</p>
                      <p className="text-base font-bold text-indigo-700 mt-0.5">
                        {format(endsAt, "d 'de' MMMM yyyy", { locale: dateLocale })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Billing progress */}
                {endsAt && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Ciclo de facturación actual</span>
                      <span className="font-semibold text-indigo-600">{daysElapsed} / {periodDays} días</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-indigo-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">{progressPercent}% del período transcurrido</p>
                  </div>
                )}

                {/* Benefits */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Incluido en tu plan</p>
                  <ul className="space-y-1.5">
                    {[
                      "Plantillas premium ilimitadas",
                      "Exportación PDF de alta calidad",
                      "CVs, cartas y candidaturas sin límite",
                      "Soporte prioritario",
                    ].map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Footer row */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {t("member_since")} {format(new Date(user.createdAt), "MMMM yyyy", { locale: dateLocale })}
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-500/80 hover:text-rose-600 hover:bg-rose-50 text-xs h-7 px-3"
                          disabled={cancelLoading}
                          type="button"
                        />
                      }
                    >
                      {cancelLoading ? t("canceling") : t("cancel_subscription")}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("cancel_dialog_title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("cancel_dialog_desc")}
                          {endsAt && (
                            <> <strong>{format(endsAt, "d 'de' MMMM yyyy", { locale: dateLocale })}</strong>.</>
                          )}
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
                </div>
              </div>
            </div>
          )
        }

        // ── PRO CANCELADO ─────────────────────────────────────────────────
        if (user.plan === "PRO" && isCanceled) {
          return (
            <div className="rounded-2xl overflow-hidden border border-amber-200 shadow-sm">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white/80 text-xs font-medium tracking-wide uppercase">Plan y cuenta</p>
                      <p className="text-white font-bold text-lg leading-tight">Pro · Cancelado</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-white/25 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    <Clock className="h-3 w-3" />
                    Acceso activo hasta expiración
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="bg-gradient-to-b from-amber-50/70 to-white px-6 py-5 space-y-5">

                {/* Countdown + expiry */}
                {endsAt && (
                  <div className="rounded-xl bg-white border border-amber-200 shadow-sm px-4 py-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-amber-100 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xl font-extrabold text-amber-700 leading-none">{daysLeft}</span>
                      <span className="text-[10px] text-amber-600 font-medium leading-none mt-0.5">{t("days")}</span>
                    </div>
                    <div>
                      <p className="text-xs text-amber-700 font-semibold">{t("subscription_ends")}</p>
                      <p className="text-base font-bold text-amber-800 mt-0.5">
                        {format(endsAt, "d 'de' MMMM yyyy", { locale: dateLocale })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("subscription_ends_note")}
                      </p>
                    </div>
                  </div>
                )}

                {/* CTA reactivar */}
                <Button
                  className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm"
                  onClick={() => window.location.href = `/${locale}/pricing`}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reactivar plan Pro
                </Button>

                <Separator />

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {t("member_since")} {format(new Date(user.createdAt), "MMMM yyyy", { locale: dateLocale })}
                </div>
              </div>
            </div>
          )
        }

        // ── FREE ──────────────────────────────────────────────────────────
        return (
          <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-medium tracking-wide uppercase">Plan y cuenta</p>
                    <p className="text-white font-bold text-lg leading-tight">Gratuito</p>
                  </div>
                </div>
                <span className="inline-flex items-center bg-slate-600/60 text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                  Plan Free
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="bg-gradient-to-b from-slate-50/50 to-white px-6 py-5 space-y-5">

              {/* Upgrade pitch */}
              <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 px-4 py-4">
                <p className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
                  <Star className="h-4 w-4 fill-indigo-400 text-indigo-400" />
                  Desbloquea todo con Pro
                </p>
                <ul className="mt-3 space-y-2">
                  {[
                    "Plantillas premium exclusivas",
                    "Exportación PDF sin marca de agua",
                    "CVs, cartas y candidaturas ilimitadas",
                    "Soporte prioritario",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-indigo-700">$15</span>
                  <span className="text-sm text-indigo-500 font-medium">/mes</span>
                  <span className="ml-2 text-xs text-muted-foreground">· o $144/año (ahorra 20%)</span>
                </div>
              </div>

              {/* CTA */}
              <Button
                className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-md"
                onClick={() => window.location.href = `/${locale}/pricing`}
              >
                <Crown className="h-4 w-4" />
                {t("upgrade_button")}
              </Button>

              <Separator />

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {t("member_since")} {format(new Date(user.createdAt), "MMMM yyyy", { locale: dateLocale })}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Data Export */}
      <div className="border border-border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Download className="h-4 w-4" />
          Descargar mis datos / Export my data
        </h2>
        <p className="text-sm text-muted-foreground">
          Descarga una copia de toda tu información personal almacenada en READY CV (cuenta, CVs y cartas de presentación).
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDataExport}
          disabled={exportLoading}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {exportLoading ? "Exportando..." : "Descargar mis datos / Export my data"}
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="border border-destructive/30 rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-destructive">{t("danger_zone")}</h2>
        <p className="text-sm text-muted-foreground">{t("danger_desc")}</p>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/50 text-destructive hover:bg-destructive/5 gap-2"
                disabled={deleteLoading}
                type="button"
              />
            }
          >
            <Trash2 className="h-4 w-4" />
            {deleteLoading ? "Eliminando..." : t("delete_account")}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar tu cuenta permanentemente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es <strong>irreversible</strong>. Se eliminarán tu cuenta, todos tus CVs, cartas de presentación y candidaturas. No podrás recuperar estos datos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Sí, eliminar mi cuenta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
