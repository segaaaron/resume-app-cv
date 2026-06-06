"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, AlertCircle, ArrowLeft, KeyRound } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { apiFetch } from "@/lib/apiFetch"
import { toast } from "sonner"

const schema = z.object({
  email: z.string().email(),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot_password")
  const router = useRouter()
  const locale = useLocale()

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

    router.push(`/${locale}/forgot-password/verify?email=${encodeURIComponent(data.email)}`)
  }

  return (
    <div className="w-full max-w-[420px]">
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
