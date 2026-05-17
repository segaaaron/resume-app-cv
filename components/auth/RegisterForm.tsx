"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, Zap, Mail, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
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
  const [emailConflict, setEmailConflict] = useState<"credentials" | "google" | null>(null)
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
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, referralCode: refParam ?? undefined }),
    })

    const body = await res.json().catch(() => ({}))

    if (res.status === 409 && body.error === "email_exists_credentials") {
      setEmailConflict("credentials")
      return
    }
    if (res.status === 409 && body.error === "email_exists_google") {
      setEmailConflict("google")
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
        toast.error(body.error ?? t("error"))
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

  if (step === "otp") {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white border border-border rounded-2xl p-5 sm:p-8 shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1">{t("otp_title")}</h1>
          <p className="text-muted-foreground text-sm mb-6">
            {t("otp_subtitle", { email: submittedEmail })}
          </p>

          <div className="space-y-4">
            <div>
              <Label className="block text-center mb-3">{t("otp_label")}</Label>
              <OtpInput
                value={otpCode}
                onChange={setOtpCode}
                autoFocus
                disabled={otpLoading}
              />
            </div>

            <Button
              className="w-full"
              onClick={verifyOtp}
              disabled={otpLoading || otpCode.length !== 6}
            >
              {otpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {otpLoading ? t("otp_verifying") : t("otp_submit")}
            </Button>

            <button
              type="button"
              onClick={resendCode}
              disabled={resending}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              {resending ? <Loader2 className="inline h-3 w-3 animate-spin mr-1" /> : null}
              {t("otp_resend")}
            </button>

            <button
              type="button"
              onClick={() => setStep("form")}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              {t("otp_back")}
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
        <h1 className="text-2xl font-bold mb-1">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mb-6">{t("subtitle")}</p>

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
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" placeholder={t("name_placeholder")} className="mt-1" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" placeholder={t("email_placeholder")} className="mt-1" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">{t("password")}</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary shrink-0"
                  {...register("consent")}
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {t("consent_text")}{" "}
                  <Link href={`/${locale}/terms`} className="underline text-foreground font-medium" target="_blank">
                    {t("terms")}
                  </Link>{" "}
                  {t("and")}{" "}
                  <Link href={`/${locale}/privacy`} className="underline text-foreground font-medium" target="_blank">
                    {t("privacy")}
                  </Link>
                  {". "}{t("consent_ai")}
                </span>
              </label>
              {errors.consent && (
                <p className="text-xs text-destructive ml-6">{errors.consent.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary shrink-0"
                  {...register("ageConsent")}
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {t("age_consent")}
                </span>
              </label>
              {errors.ageConsent && (
                <p className="text-xs text-destructive ml-6">{errors.ageConsent.message}</p>
              )}
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary shrink-0"
                {...register("marketingConsent")}
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                {t("marketing_consent")}
              </span>
            </label>
          </div>

          {emailConflict === "credentials" && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-blue-800">{t("fp_banner_credentials")}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => router.push(`/${locale}/login`)}
                >
                  {t("fp_banner_credentials_cta")}
                </Button>
              </div>
            </div>
          )}
          {emailConflict === "google" && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-amber-800">{t("fp_banner_google")}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={googleLoading}
                  onClick={async () => {
                    setGoogleLoading(true)
                    await signIn("google", { callbackUrl: `/${locale}/dashboard/resumes` })
                  }}
                >
                  {googleLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t("fp_banner_google_cta")}
                </Button>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("submit")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {t("have_account")}{" "}
          <Link
            href={planParam ? `/${locale}/login?plan=${planParam}` : `/${locale}/login`}
            className="text-primary font-medium hover:underline"
          >
            {t("login_link")}
          </Link>
        </p>
      </div>
    </div>
  )
}
