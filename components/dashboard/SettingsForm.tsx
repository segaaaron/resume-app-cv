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
import { User, Mail, Calendar, Crown, AlertCircle, BadgeCheck, Zap, Clock } from "lucide-react"
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
  const [portalLoading, setPortalLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState(user.subscriptionStatus)

  async function handleManageSubscription() {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error ?? t("portal_error"))
      }
    } catch {
      toast.error(t("connection_error"))
    } finally {
      setPortalLoading(false)
    }
  }

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
  const hasSubscription = user.plan !== "FREE" && subscriptionStatus !== "NONE"

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
      <div className={`rounded-xl p-6 space-y-4 border-2 ${isActive ? "border-primary/30 bg-primary/5" : "border-border"}`}>
        <h2 className="font-semibold flex items-center gap-2">
          <Crown className="h-4 w-4" />
          {t("plan_section")}
        </h2>

        {/* Plan status hero */}
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
            {isActive ? <BadgeCheck className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-base">{planLabel}</p>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${planColor}`}>
                {isActive ? "Activo" : isCanceled ? "Cancelado" : "Gratuito"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {user.plan === "FREE"
                ? t("plan_free_desc")
                : user.plan === "TRIAL"
                  ? t("plan_trial_desc")
                  : t("plan_pro_desc")}
            </p>
          </div>
        </div>

        {/* Renewal / expiry date */}
        {isActive && user.subscriptionEndsAt && (
          <div className="flex items-center gap-2 bg-white border border-primary/20 rounded-lg px-4 py-3">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t("renewal_notice")}</p>
              <p className="text-sm font-semibold text-foreground">
                {format(new Date(user.subscriptionEndsAt), "d 'de' MMMM yyyy", { locale: dateLocale })}
              </p>
            </div>
          </div>
        )}

        {isCanceled && user.subscriptionEndsAt && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-amber-700 font-medium">Suscripción cancelada</p>
              <p className="text-sm text-amber-800">
                {t("canceled_notice")}{" "}
                <span className="font-semibold">
                  {format(new Date(user.subscriptionEndsAt), "d 'de' MMMM yyyy", { locale: dateLocale })}
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {user.plan !== "PRO" && (
            <Button size="sm" onClick={() => window.location.href = `/${locale}/pricing`} className="gap-2">
              <Crown className="h-3.5 w-3.5" />
              {t("upgrade_button")}
            </Button>
          )}

          {hasSubscription && (
            <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
              {portalLoading ? t("loading") : t("manage_subscription")}
            </Button>
          )}

          {isActive && (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/40 text-destructive hover:bg-destructive/5"
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
                    {user.subscriptionEndsAt && (
                      <> <strong>{format(new Date(user.subscriptionEndsAt), "d 'de' MMMM yyyy", { locale: dateLocale })}</strong>.</>
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
          )}
        </div>

        <Separator />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {t("member_since")} {format(new Date(user.createdAt), "MMMM yyyy", { locale: dateLocale })}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-destructive/30 rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-destructive">{t("danger_zone")}</h2>
        <p className="text-sm text-muted-foreground">{t("danger_desc")}</p>
        <Button
          variant="outline"
          size="sm"
          className="border-destructive/50 text-destructive hover:bg-destructive/5"
          onClick={() => toast.error(t("contact_support"))}
        >
          {t("delete_account")}
        </Button>
      </div>
    </div>
  )
}
