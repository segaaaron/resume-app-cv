"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useTranslations, useLocale } from "next-intl"

export default function ForgotPasswordVerifyForm() {
  const t = useTranslations("auth.forgot_password.verify")
  const tRoot = useTranslations("auth.forgot_password")
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const [showPassword, setShowPassword] = useState(false)
  const [resending, setResending] = useState(false)

  const schema = z.object({
    code: z.string().length(6, "6 dígitos").regex(/^\d{6}$/, "Solo números"),
    password: z.string()
      .min(8, t("password_min"))
      .regex(/[A-Z]/, t("password_uppercase"))
      .regex(/[a-z]/, t("password_lowercase"))
      .regex(/[0-9]/, t("password_number")),
    confirm: z.string(),
  }).refine((d) => d.password === d.confirm, {
    message: t("passwords_mismatch"),
    path: ["confirm"],
  })

  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/auth/reset-password/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: data.code, password: data.password }),
    })

    const body = await res.json().catch(() => ({}))

    if (res.ok && body.ok) {
      toast.success(t("success"))
      router.push(`/${locale}/login?reset=true`)
      return
    }

    if (body.error === "expired") toast.error(t("expired"))
    else if (body.error === "invalid_code") toast.error(t("invalid_code", { attemptsLeft: body.attemptsLeft ?? 0 }))
    else if (body.error === "too_many_attempts") toast.error(t("too_many_attempts"))
    else if (body.error === "already_used") toast.error(t("already_used"))
    else toast.error("Error inesperado")
  }

  async function resendCode() {
    if (!email) return
    setResending(true)
    try {
      await fetch("/api/auth/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      toast.success(tRoot("sent_message"))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t("title")}</h1>
        <p className="text-gray-500 text-sm mb-6">{t("subtitle", { email })}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="code">{t("otp_label")}</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder={t("otp_placeholder")}
              autoFocus
              {...register("code")}
              className="mt-1 text-center text-xl tracking-widest font-mono"
            />
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">{t("password_label")}</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("password_placeholder")}
                {...register("password")}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <Label htmlFor="confirm">{t("confirm_label")}</Label>
            <Input
              id="confirm"
              type="password"
              placeholder={t("confirm_placeholder")}
              {...register("confirm")}
              className="mt-1"
            />
            {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t("submit")}
          </Button>
        </form>

        <div className="flex items-center justify-between mt-4 text-sm">
          <button
            type="button"
            onClick={resendCode}
            disabled={resending}
            className="text-blue-600 hover:underline disabled:opacity-50"
          >
            {resending ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
            {t("resend")}
          </button>
          <Link href={`/${locale}/login`} className="text-gray-500 hover:underline">
            {tRoot("back_to_login")}
          </Link>
        </div>
      </div>
    </div>
  )
}
