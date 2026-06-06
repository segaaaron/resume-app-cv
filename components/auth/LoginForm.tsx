"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Eye, EyeOff, Zap, AlertTriangle, Lock, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { useTranslations, useLocale } from "next-intl"

type FormState = "login" | "challenge" | "blocked"

export default function LoginForm({ serverError }: { serverError?: boolean } = {}) {
  const t = useTranslations("auth.login")
  const searchParams = useSearchParams()

  useEffect(() => {
    if (serverError) toast.error(t("session_check_error"))
  }, [serverError, t])

  useEffect(() => {
    if (searchParams.get("cleared") === "1") toast.warning(t("session_cleared"))
  }, [searchParams, t])
  const router = useRouter()
  const locale = useLocale()
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

    if (result?.code === "invalid_credentials") {
      toast.error(t("error_invalid_credentials"))
    } else if (result?.code === "rate_limited") {
      toast.error(t("error_rate_limited"))
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
      const res = await apiFetch("/api/auth/session-challenge", {
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
      const res = await apiFetch("/api/auth/session-challenge/verify", {
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

  // ── Blocked state ─────────────────────────────────────────────────────────
  if (formState === "blocked") {
    return (
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center text-center gap-4 py-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,rgba(239,68,68,0.1),rgba(220,38,38,0.07))", border: "1px solid rgba(239,68,68,0.18)" }}>
            <Lock className="h-7 w-7 text-red-500" />
          </div>
          <div>
            <h2 className="text-[22px] font-extrabold text-[#1a2e4a] tracking-[-0.02em] mb-2">
              {t("account_blocked_title")}
            </h2>
            <p className="text-[13px] text-[#6B7A8C] leading-[1.6]">
              {blockedUntil
                ? t("account_blocked_until").replace("{time}", blockedUntil.toLocaleTimeString(locale === "es" ? "es-ES" : "en-US", { hour: "2-digit", minute: "2-digit" }))
                : t("error_session_blocked")}
            </p>
          </div>
          <button
            onClick={() => { setFormState("login"); setOtp(""); setCodeSent(false) }}
            className="text-[13px] font-semibold text-[#1a2e4a] hover:text-[#00D4FF] transition-colors mt-1"
          >
            {t("back_to_login")}
          </button>
        </div>
      </div>
    )
  }

  // ── Challenge state ───────────────────────────────────────────────────────
  if (formState === "challenge") {
    return (
      <div className="w-full max-w-[420px]">
        <div className="mb-6 p-4 rounded-[10px] flex items-start gap-3"
          style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-amber-900">{t("active_session_title")}</p>
            <p className="text-[12px] text-amber-700 mt-0.5">{t("active_session_subtitle")}</p>
          </div>
        </div>

        <div className="space-y-3">
          {!codeSent ? (
            <button
              onClick={sendCode}
              disabled={sendingCode}
              className="w-full h-12 rounded-[10px] text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#1a2e4a 0%,#0f1e33 100%)", boxShadow: "0 4px 14px rgba(26,46,74,0.3)" }}
            >
              {sendingCode && <Loader2 className="h-4 w-4 animate-spin" />}
              {sendingCode ? t("sending_code") : t("send_code")}
            </button>
          ) : (
            <>
              <div>
                <label htmlFor="otp" className="block text-[13px] font-semibold text-[#1a2e4a] mb-1.5">
                  {t("code_label")}
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t("code_placeholder")}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoFocus
                  className="w-full h-11 px-3.5 rounded-[10px] border border-[#D9E1ED] bg-white text-[18px] text-[#1a2e4a] text-center tracking-[0.3em] font-mono outline-none transition-all duration-150 focus:border-[#00D4FF] focus:ring-2 focus:ring-[rgba(0,212,255,0.16)]"
                />
              </div>
              <button
                onClick={verifyCode}
                disabled={verifyingCode || otp.length !== 6}
                className="w-full h-12 rounded-[10px] text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#1a2e4a 0%,#0f1e33 100%)", boxShadow: "0 4px 14px rgba(26,46,74,0.3)" }}
              >
                {verifyingCode && <Loader2 className="h-4 w-4 animate-spin" />}
                {verifyingCode ? t("verifying") : t("verify_and_enter")}
              </button>
              <button
                type="button"
                onClick={() => { setCodeSent(false); setOtp("") }}
                className="w-full text-[13px] text-[#6B7A8C] hover:text-[#1a2e4a] transition-colors text-center py-1"
              >
                {t("send_code")}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => { setFormState("login"); setCodeSent(false); setOtp("") }}
            className="w-full text-[13px] text-[#6B7A8C] hover:text-[#1a2e4a] transition-colors text-center py-1"
          >
            {t("back_to_login")}
          </button>
        </div>
      </div>
    )
  }

  // ── Login Form ────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[440px]">
      {/* Card */}
      <div className="bg-white rounded-2xl px-8 py-8"
        style={{ boxShadow: "0 4px 32px rgba(26,46,74,0.10), 0 1px 4px rgba(26,46,74,0.06)", border: "1px solid rgba(217,225,237,0.8)" }}>

      {/* Eyebrow + header */}
      <div className="mb-7">
        <h1 className="text-[28px] font-extrabold text-[#1a2e4a] tracking-[-0.025em] mb-1">
          {t("title")}
        </h1>
        <p className="text-[13px] text-[#A0AABE]">{t("subtitle")}</p>
      </div>

      {/* Pro plan banner */}
      {planParam && (
        <div className="flex items-center gap-2.5 rounded-[10px] px-4 py-3 mb-5 text-[13px] font-semibold"
          style={{ background: "linear-gradient(135deg,rgba(0,212,255,0.1),rgba(0,153,204,0.07))", border: "1px solid rgba(0,212,255,0.22)", color: "#0099AA" }}>
          <Zap className="h-4 w-4 shrink-0" />
          {t("plan_pro_banner")}
        </div>
      )}

      {/* Google button */}
      <button
        onClick={loginWithGoogle}
        disabled={googleLoading}
        className="w-full h-12 rounded-[10px] border flex items-center justify-center gap-3 text-[14px] font-medium text-[#1a2e4a] bg-white transition-all duration-200 hover:border-[#1a2e4a]/30 hover:bg-[#F5F7FB] hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mb-5"
        style={{ borderColor: "#D9E1ED" }}
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#6B7A8C]" />
        ) : (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        {t("google")}
      </button>

      {/* Divider */}
      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E8EDF6]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#F8FAFC] px-3 text-[11px] font-medium text-[#A0AABE] uppercase tracking-[0.08em]">
            {t("or")}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-[13px] font-semibold text-[#1a2e4a] mb-1.5">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            placeholder={t("email_placeholder")}
            autoComplete="email"
            {...register("email")}
            className="w-full h-11 px-3.5 rounded-[10px] border bg-white text-[14px] text-[#1a2e4a] placeholder:text-[#A0AABE] outline-none transition-all duration-150 focus:border-[#00D4FF] focus:ring-2 focus:ring-[rgba(0,212,255,0.16)]"
            style={{ borderColor: errors.email ? "#EF4444" : "#D9E1ED" }}
          />
          {errors.email && <p className="text-[12px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-[13px] font-semibold text-[#1a2e4a] mb-1.5">
            {t("password")}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("password_placeholder")}
              {...register("password")}
              className="w-full h-11 pl-3.5 pr-11 rounded-[10px] border bg-white text-[14px] text-[#1a2e4a] placeholder:text-[#A0AABE] outline-none transition-all duration-150 focus:border-[#00D4FF] focus:ring-2 focus:ring-[rgba(0,212,255,0.16)]"
              style={{ borderColor: errors.password ? "#EF4444" : "#D9E1ED" }}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? t("hide_password") : t("show_password")}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#A0AABE] hover:text-[#1a2e4a] transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-[12px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.password.message}</p>}
          <div className="flex justify-end mt-1.5">
            <Link
              href={`/${locale}/forgot-password`}
              className="text-[12px] font-medium text-[#00D4FF]"
            >
              {t("forgot_password")}
            </Link>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-[10px] text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          style={{
            background: "linear-gradient(135deg,#1a2e4a 0%,#0f1e33 100%)",
            boxShadow: "0 4px 14px rgba(26,46,74,0.3)",
          }}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("submit")}
        </button>
      </form>

      <p className="text-center text-[13px] text-[#6B7A8C] mt-5">
        {t("no_account")}{" "}
        <Link
          href={planParam ? `/${locale}/register?plan=${planParam}` : `/${locale}/register`}
          className="font-semibold text-[#1a2e4a] hover:text-[#00D4FF] transition-colors"
        >
          {t("register_link")}
        </Link>
      </p>

      </div>{/* /card */}

      {/* Trust signal */}
      <p className="text-center text-[11px] text-[#A0AABE] mt-4 flex items-center justify-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        {t("secure_connection")}
      </p>
    </div>
  )
}
