"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Eye, EyeOff, Zap, Mail, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { track } from "@/lib/analytics/track"
import { useTranslations, useLocale } from "next-intl"
import OtpInput from "@/components/auth/OtpInput"

type RegisterStep = "form" | "otp"

export default function RegisterForm({ serverError }: { serverError?: boolean } = {}) {
  const t = useTranslations("auth.register")

  useEffect(() => {
    if (serverError) toast.error(t("session_check_error"))
  }, [serverError, t])
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const planParam = searchParams.get("plan")
  const refParam = searchParams.get("ref")
  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailConflict, setEmailConflict] = useState<"exists" | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<RegisterStep>("form")
  const [submittedEmail, setSubmittedEmail] = useState("")
  const [submittedPassword, setSubmittedPassword] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [formSnapshot, setFormSnapshot] = useState<FormData | null>(null)

  const schema = z.object({
    name: z.string().min(2, t("name_short")),
    email: z.string().email(t("email_invalid")),
    password: z.string()
      .min(8, t("password_min"))
      .regex(/[A-Z]/, t("password_uppercase"))
      .regex(/[a-z]/, t("password_lowercase"))
      .regex(/[0-9]/, t("password_number")),
    consent: z.boolean().refine((v) => v === true, { message: t("consent_required") }),
    ageConsent: z.boolean().refine((v) => v === true, { message: t("age_required") }),
    marketingConsent: z.boolean().optional(),
  })

  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { consent: false, ageConsent: false, marketingConsent: false } })

  async function onSubmit(data: FormData) {
    setEmailConflict(null)
    track("signup_started", { locale: locale === "en" ? "en" : "es", source: refParam ? "referral" : undefined })
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, referralCode: refParam ?? undefined }),
    })

    const body = await res.json().catch(() => ({}))

    if (res.status === 409 && body.error === "email_exists") {
      setEmailConflict("exists")
      return
    }

    if (!res.ok) {
      toast.error(body.error ?? t("error"))
      return
    }
    if (body.pending) {
      setSubmittedEmail(data.email)
      setSubmittedPassword(data.password)
      setFormSnapshot(data)
      setOtpCode("")
      setStep("otp")
    }
  }

  async function verifyOtp() {
    if (otpCode.length !== 6) return
    setOtpLoading(true)
    try {
      const res = await apiFetch("/api/auth/register/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submittedEmail, code: otpCode }),
      })

      const body = await res.json().catch(() => ({}))

      if (res.ok && body.success) {
        track("signup_completed", { locale: locale === "en" ? "en" : "es" })
        await signIn("credentials", {
          email: submittedEmail,
          password: submittedPassword,
          redirect: false,
        })
        if (planParam) {
          router.push(`/${locale}/checkout?plan=${planParam}`)
        } else {
          router.push(`/${locale}/dashboard/resumes`)
        }
        router.refresh()
        return
      }

      if (body.error === "expired") {
        toast.error(t("otp_expired"))
        setStep("form")
      } else if (body.error === "max_attempts") {
        toast.error(t("otp_max_attempts"))
        setStep("form")
      } else if (body.error === "email_taken") {
        toast.error(t("otp_email_taken"))
        setStep("form")
      } else if (body.error === "invalid") {
        toast.error(t("otp_invalid", { attemptsLeft: body.attemptsLeft ?? 0 }))
      } else {
        toast.error(t("error"))
        setStep("form")
      }
    } finally {
      setOtpLoading(false)
    }
  }

  async function resendCode() {
    if (!formSnapshot) return
    setResending(true)
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formSnapshot, referralCode: refParam ?? undefined }),
      })
      if (res.ok) {
        setOtpCode("")
        toast.success(t("otp_resent"))
      } else {
        const body = await res.json().catch(() => ({}))
        // Was printing the raw error code at the user ("rate_limited"). Now that the
        // register limit actually counts, this toast is reachable, so it has to read
        // like a sentence.
        toast.error(body.error === "rate_limited" ? t("rate_limit") : (body.error ?? t("error")))
      }
    } finally {
      setResending(false)
    }
  }

  async function loginWithGoogle() {
    setGoogleLoading(true)
    const callbackUrl = planParam
      ? `/${locale}/checkout?plan=${planParam}`
      : `/${locale}/dashboard/resumes`
    await signIn("google", { callbackUrl })
  }

  // ── OTP Step ──────────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: "linear-gradient(135deg,rgba(0,212,255,0.12),rgba(0,153,204,0.08))", border: "1px solid rgba(0,212,255,0.2)" }}>
            <Mail className="h-6 w-6" style={{ color: "#00D4FF" }} />
          </div>
          <h1 className="text-[26px] font-extrabold text-[#1a2e4a] tracking-[-0.02em] mb-2">
            {t("otp_title")}
          </h1>
          <p className="text-[14px] text-[#6B7A8C] leading-[1.6]">
            {t("otp_subtitle", { email: submittedEmail })}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-center text-[13px] font-medium text-[#1a2e4a] mb-3">
              {t("otp_label")}
            </label>
            <OtpInput value={otpCode} onChange={setOtpCode} autoFocus disabled={otpLoading} />
          </div>

          <button
            onClick={verifyOtp}
            disabled={otpLoading || otpCode.length !== 6}
            className="w-full h-12 rounded-[10px] text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg,#1a2e4a 0%,#0f1e33 100%)",
              boxShadow: "0 4px 14px rgba(26,46,74,0.35)",
            }}
          >
            {otpLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {otpLoading ? t("otp_verifying") : t("otp_submit")}
          </button>

          <button
            type="button"
            onClick={resendCode}
            disabled={resending}
            className="w-full text-[13px] text-[#6B7A8C] hover:text-[#1a2e4a] transition-colors text-center py-1 flex items-center justify-center gap-1.5"
          >
            {resending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t("otp_resend")}
          </button>

          <button
            type="button"
            onClick={() => setStep("form")}
            className="w-full text-[13px] text-[#6B7A8C] hover:text-[#1a2e4a] transition-colors text-center py-1"
          >
            {t("otp_back")}
          </button>
        </div>
      </div>
    )
  }

  // ── Register Form ─────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[420px]">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[28px] font-extrabold text-[#1a2e4a] tracking-[-0.025em] mb-1.5">
          {t("title")}
        </h1>
        <p className="text-[14px] text-[#6B7A8C] leading-[1.55]">{t("subtitle")}</p>
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

      {/* Email form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-[13px] font-semibold text-[#1a2e4a] mb-1.5">
            {t("name")}
          </label>
          <input
            id="name"
            placeholder={t("name_placeholder")}
            autoComplete="name"
            {...register("name")}
            className="w-full h-11 px-3.5 rounded-[10px] border bg-white text-[14px] text-[#1a2e4a] placeholder:text-[#A0AABE] outline-none transition-all duration-150 focus:border-[#00D4FF] focus:ring-2 focus:ring-[rgba(0,212,255,0.16)]"
            style={{ borderColor: errors.name ? "#EF4444" : "#D9E1ED" }}
          />
          {errors.name && <p className="text-[12px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name.message}</p>}
        </div>

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
              autoComplete="new-password"
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
        </div>

        {/* Checkboxes */}
        <div className="space-y-2.5 pt-1">
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                {...register("consent")}
                className="mt-0.5 h-4 w-4 rounded-[4px] border-[#D9E1ED] accent-[#1a2e4a] shrink-0 cursor-pointer"
              />
              <span className="text-[12px] text-[#6B7A8C] leading-relaxed group-hover:text-[#1a2e4a] transition-colors">
                {t("consent_text")}{" "}
                <Link href={`/${locale}/terms`} className="underline text-[#1a2e4a] font-medium" target="_blank">{t("terms")}</Link>
                {" "}{t("and")}{" "}
                <Link href={`/${locale}/privacy`} className="underline text-[#1a2e4a] font-medium" target="_blank">{t("privacy")}</Link>
                {". "}{t("consent_ai")}
              </span>
            </label>
            {errors.consent && <p className="text-[12px] text-red-500 ml-[26px] mt-1">{errors.consent.message}</p>}
          </div>

          <div>
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                {...register("ageConsent")}
                className="mt-0.5 h-4 w-4 rounded-[4px] border-[#D9E1ED] accent-[#1a2e4a] shrink-0 cursor-pointer"
              />
              <span className="text-[12px] text-[#6B7A8C] leading-relaxed group-hover:text-[#1a2e4a] transition-colors">
                {t("age_consent")}
              </span>
            </label>
            {errors.ageConsent && <p className="text-[12px] text-red-500 ml-[26px] mt-1">{errors.ageConsent.message}</p>}
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              {...register("marketingConsent")}
              className="mt-0.5 h-4 w-4 rounded-[4px] border-[#D9E1ED] accent-[#1a2e4a] shrink-0 cursor-pointer"
            />
            <span className="text-[12px] text-[#6B7A8C] leading-relaxed group-hover:text-[#1a2e4a] transition-colors">
              {t("marketing_consent")}
            </span>
          </label>
        </div>

        {/* Email conflict banner */}
        {emailConflict === "exists" && (
          <div className="p-3.5 rounded-[10px] flex items-start gap-2.5"
            style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] text-blue-800">{t("email_already_registered")}</p>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/login`)}
                className="mt-1.5 text-[12px] font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2 transition-colors"
              >
                {t("fp_banner_credentials_cta")}
              </button>
            </div>
          </div>
        )}

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
        {t("have_account")}{" "}
        <Link
          href={planParam ? `/${locale}/login?plan=${planParam}` : `/${locale}/login`}
          className="font-semibold text-[#1a2e4a] hover:text-[#00D4FF] transition-colors"
        >
          {t("login_link")}
        </Link>
      </p>
    </div>
  )
}
