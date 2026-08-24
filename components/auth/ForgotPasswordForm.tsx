"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, AlertCircle, ArrowLeft, KeyRound } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { apiFetch } from "@/lib/apiFetch"
import { toast } from "sonner"
import PendingScreen from "@/components/shared/PendingScreen"

const schema = z.object({
  email: z.string().email(),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot_password")
  const router = useRouter()
  const locale = useLocale()
  const [oauthProvider, setOauthProvider] = useState<string | null>(null)
  const [managed, setManaged] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  /** Se enciende al empezar a irse y no se apaga: la navegación desmonta esto. */
  const [leaving, setLeaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    let res: Response
    try {
      res = await apiFetch("/api/auth/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      })
    } catch {
      return
    }

    const body = await res.json().catch(() => ({}))

    if (body.error === "rate_limited") {
      toast.error(t("rate_limit"))
      return
    }

    // OAuth-only account: no password to reset — steer to the provider.
    if (body.oauth) {
      setOauthProvider(body.oauth)
      return
    }

    // Managed account: the administrator holds the reset. Sending this user to the code
    // screen would park them in front of a field no code will ever arrive for.
    if (body.managed) {
      setManaged(true)
      return
    }

    setLeaving(true)
    router.push(`/${locale}/forgot-password/verify?email=${encodeURIComponent(data.email)}`)
  }

  async function loginWithProvider(provider: string) {
    setGoogleLoading(true)
    await signIn(provider, { callbackUrl: `/${locale}/dashboard/resumes` })
  }

  // ── Managed account: nothing for THIS user to do, so no button ───────────────
  if (managed) {
    return (
      <div className="w-full max-w-[420px]">
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-[12px] shrink-0"
              style={{ background: "linear-gradient(135deg,rgba(0,212,255,0.12),rgba(0,153,204,0.08))", border: "1px solid rgba(0,212,255,0.2)" }}>
              <KeyRound className="h-5 w-5" style={{ color: "#00D4FF" }} />
            </div>
            <h1 className="text-[22px] font-extrabold text-[#1a2e4a] tracking-[-0.025em] leading-tight">
              {t("managed_title")}
            </h1>
          </div>
          <p className="text-[14px] text-[#6B7A8C] leading-[1.55]">{t("managed_account")}</p>
        </div>
      </div>
    )
  }

  // ── OAuth-only account: friendly steer, not an error ─────────────────────────
  if (oauthProvider) {
    return (
      <div className="w-full max-w-[420px]">
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-[12px] shrink-0"
              style={{ background: "linear-gradient(135deg,rgba(0,212,255,0.12),rgba(0,153,204,0.08))", border: "1px solid rgba(0,212,255,0.2)" }}>
              <KeyRound className="h-5 w-5" style={{ color: "#00D4FF" }} />
            </div>
            <h1 className="text-[22px] font-extrabold text-[#1a2e4a] tracking-[-0.025em] leading-tight">
              {t("google_title")}
            </h1>
          </div>
          <p className="text-[14px] text-[#6B7A8C] leading-[1.55]">{t("google_account")}</p>
        </div>

        <button
          type="button"
          onClick={() => loginWithProvider(oauthProvider)}
          disabled={googleLoading}
          className="w-full h-12 rounded-[10px] text-[14px] font-semibold text-[#1a2e4a] flex items-center justify-center gap-2.5 border bg-white transition-all duration-200 hover:shadow-md hover:border-[#00D4FF] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderColor: "#D9E1ED" }}
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z" />
              <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75Z" />
            </svg>
          )}
          {t("google_cta")}
        </button>

        <Link
          href={`/${locale}/login`}
          className="mt-5 flex items-center justify-center gap-1.5 text-[13px] font-medium text-[#6B7A8C] hover:text-[#1a2e4a] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("back_to_login")}
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[420px]">
      <PendingScreen show={isSubmitting || googleLoading || leaving} />
      {/* Icon + header */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-[12px] shrink-0"
            style={{ background: "linear-gradient(135deg,rgba(0,212,255,0.12),rgba(0,153,204,0.08))", border: "1px solid rgba(0,212,255,0.2)" }}>
            <KeyRound className="h-5 w-5" style={{ color: "#00D4FF" }} />
          </div>
          <h1 className="text-[26px] font-extrabold text-[#1a2e4a] tracking-[-0.025em] leading-tight">
            {t("title")}
          </h1>
        </div>
        <p className="text-[14px] text-[#6B7A8C] leading-[1.55]">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-[13px] font-semibold text-[#1a2e4a] mb-1.5">
            {t("email_label")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            {...register("email")}
            className="w-full h-11 px-3.5 rounded-[10px] border bg-white text-[14px] text-[#1a2e4a] placeholder:text-[#A0AABE] outline-none transition-all duration-150 focus:border-[#00D4FF] focus:ring-2 focus:ring-[rgba(0,212,255,0.16)]"
            style={{ borderColor: errors.email ? "#EF4444" : "#D9E1ED" }}
          />
          {errors.email && (
            <p className="text-[12px] text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />{errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-[10px] text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg,#1a2e4a 0%,#0f1e33 100%)",
            boxShadow: "0 4px 14px rgba(26,46,74,0.3)",
          }}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("submit")}
        </button>
      </form>

      <Link
        href={`/${locale}/login`}
        className="mt-5 flex items-center justify-center gap-1.5 text-[13px] font-medium text-[#6B7A8C] hover:text-[#1a2e4a] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("back_to_login")}
      </Link>
    </div>
  )
}
