"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"

const schema = z.object({
  email: z.string().email(),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot_password")
  const router = useRouter()
  const locale = useLocale()
  const [googleError, setGoogleError] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [notRegistered, setNotRegistered] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setGoogleError(false)
    setNotRegistered(false)
    const res = await fetch("/api/auth/reset-password/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    })

    const body = await res.json().catch(() => ({}))

    if (body.error === "not_registered") {
      setNotRegistered(true)
      return
    }

    if (body.error === "google_account") {
      setGoogleError(true)
      return
    }

    router.push(`/${locale}/forgot-password/verify?email=${encodeURIComponent(data.email)}`)
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    await signIn("google", { callbackUrl: `/${locale}/dashboard/resumes` })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t("title")}</h1>
        <p className="text-gray-500 text-sm mb-6">{t("subtitle")}</p>

        {notRegistered && (
          <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-blue-800">{t("not_registered")}</p>
              <Link
                href={`/${locale}/register`}
                className="inline-block mt-2 text-xs font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900"
              >
                {t("not_registered_cta")}
              </Link>
            </div>
          </div>
        )}

        {googleError && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-amber-800">{t("google_account")}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Google
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">{t("email_label")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              {...register("email")}
              className="mt-1"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t("submit")}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href={`/${locale}/login`} className="text-blue-600 hover:underline">
            {t("back_to_login")}
          </Link>
        </p>
      </div>
    </div>
  )
}
