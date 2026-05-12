"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, Zap, AlertTriangle, Lock } from "lucide-react"
import { toast } from "sonner"
import { useTranslations, useLocale } from "next-intl"

type FormState = "login" | "challenge" | "blocked"

export default function LoginForm() {
  const t = useTranslations("auth.login")
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const planParam = searchParams.get("plan")
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formState, setFormState] = useState<FormState>("login")
  const [pendingEmail, setPendingEmail] = useState("")
  const [pendingPassword, setPendingPassword] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [otp, setOtp] = useState("")
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null)

  const schema = z.object({
    email: z.string().email(t("email_invalid")),
    password: z.string().min(1, t("password_required")),
  })
  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.code === "user_not_found") {
      toast.error(t("error_user_not_found"), {
        action: {
          label: t("register_link"),
          onClick: () => router.push(planParam ? `/${locale}/register?plan=${planParam}` : `/${locale}/register`),
        },
        duration: 6000,
      })
    } else if (result?.code === "invalid_password") {
      toast.error(t("error_invalid_password"))
    } else if (result?.code === "active_session") {
      setPendingEmail(data.email)
      setPendingPassword(data.password)
      setFormState("challenge")
    } else if (result?.code === "session_challenge_blocked") {
      setFormState("blocked")
    } else if (result?.error) {
      toast.error(t("error"))
    } else {
      router.push(planParam ? `/${locale}/checkout?plan=${planParam}` : `/${locale}/dashboard/resumes`)
      router.refresh()
    }
  }

  async function sendCode() {
    setSendingCode(true)
    try {
      const res = await fetch("/api/auth/session-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      })
      const data = await res.json()
      if (data.blocked) {
        setBlockedUntil(new Date(data.blockedUntil))
        setFormState("blocked")
        return
      }
      setCodeSent(true)
      toast.success(t("code_sent"))
    } finally {
      setSendingCode(false)
    }
  }

  async function verifyCode() {
    if (otp.length !== 6) return
    setVerifyingCode(true)
    try {
      const res = await fetch("/api/auth/session-challenge/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code: otp }),
      })
      const data = await res.json()

      if (data.blocked) {
        setBlockedUntil(new Date(data.blockedUntil))
        setFormState("blocked")
        return
      }
      if (data.error === "expired") {
        toast.error(t("code_expired"))
        setCodeSent(false)
        setOtp("")
        return
      }
      if (data.error === "invalid") {
        toast.error(t("code_invalid").replace("{attemptsLeft}", String(data.attemptsLeft)))
        setOtp("")
        return
      }
      if (data.success) {
        const result = await signIn("credentials", {
          email: pendingEmail,
          password: pendingPassword,
          redirect: false,
        })
        if (result?.ok && !result.error) {
          router.push(planParam ? `/${locale}/checkout?plan=${planParam}` : `/${locale}/dashboard/resumes`)
          router.refresh()
        } else {
          toast.error(t("error"))
          setFormState("login")
        }
      }
    } finally {
      setVerifyingCode(false)
    }
  }

  async function loginWithGoogle() {
    setGoogleLoading(true)
    const callbackUrl = planParam
      ? `/${locale}/checkout?plan=${planParam}`
      : `/${locale}/dashboard/resumes`
    await signIn("google", { callbackUrl })
  }

  if (formState === "blocked") {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white border border-border rounded-2xl p-5 sm:p-8 shadow-sm">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center">
              <Lock className="h-7 w-7 text-red-600" />
            </div>
            <h2 className="text-xl font-bold">{t("account_blocked_title")}</h2>
            <p className="text-sm text-muted-foreground">
              {blockedUntil
                ? t("account_blocked_until").replace("{time}", blockedUntil.toLocaleTimeString(locale === "es" ? "es-ES" : "en-US", { hour: "2-digit", minute: "2-digit" }))
                : t("error_session_blocked")}
            </p>
            <button
              onClick={() => { setFormState("login"); setOtp(""); setCodeSent(false) }}
              className="text-sm text-primary hover:underline mt-2"
            >
              {t("back_to_login")}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (formState === "challenge") {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white border border-border rounded-2xl p-5 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">{t("active_session_title")}</p>
              <p className="text-xs text-amber-700 mt-0.5">{t("active_session_subtitle")}</p>
            </div>
          </div>

          <div className="space-y-4">
            {!codeSent ? (
              <Button onClick={sendCode} disabled={sendingCode} className="w-full">
                {sendingCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {sendingCode ? t("sending_code") : t("send_code")}
              </Button>
            ) : (
              <>
                <div>
                  <Label htmlFor="otp">{t("code_label")}</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder={t("code_placeholder")}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="mt-1 text-center text-lg tracking-widest font-mono"
                    autoFocus
                  />
                </div>
                <Button
                  onClick={verifyCode}
                  disabled={verifyingCode || otp.length !== 6}
                  className="w-full"
                >
                  {verifyingCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {verifyingCode ? t("verifying") : t("verify_and_enter")}
                </Button>
                <button
                  type="button"
                  onClick={() => { setCodeSent(false); setOtp("") }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("send_code")}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => { setFormState("login"); setCodeSent(false); setOtp("") }}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              {t("back_to_login")}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-border rounded-2xl p-5 sm:p-8 shadow-sm">
        {planParam && (
          <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-xl px-4 py-3 mb-5 text-sm font-medium">
            <Zap className="h-4 w-4 shrink-0" />
            {t("plan_pro_banner")}
          </div>
        )}
        <h1 className="text-2xl font-bold text-center mb-6">{t("title")}</h1>

        <Button
          variant="outline"
          className="w-full mb-4 gap-2"
          onClick={loginWithGoogle}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {t("google")}
        </Button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs text-muted-foreground">
            <span className="bg-white px-2">{t("or")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("email_placeholder")}
              className="mt-1"
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">{t("password")}</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t("password_placeholder")}
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("submit")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {t("no_account")}{" "}
          <Link
            href={planParam ? `/register?plan=${planParam}` : "/register"}
            className="text-primary font-medium hover:underline"
          >
            {t("register_link")}
          </Link>
        </p>
      </div>
    </div>
  )
}
