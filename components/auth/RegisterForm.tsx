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
import { Loader2, Eye, EyeOff, Zap } from "lucide-react"
import { toast } from "sonner"
import { useTranslations, useLocale } from "next-intl"

export default function RegisterForm() {
  const t = useTranslations("auth.register")
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const planParam = searchParams.get("plan")
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const schema = z.object({
    name: z.string().min(2, t("name_short")),
    email: z.string().email(t("email_invalid")),
    password: z.string().min(8, t("password_min")),
  })

  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const { error } = await res.json()
      toast.error(error ?? t("error"))
      return
    }

    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (planParam) {
      router.push(`/${locale}/checkout?plan=${planParam}`)
    } else {
      router.push(`/${locale}/dashboard/resumes`)
    }
    router.refresh()
  }

  async function loginWithGoogle() {
    setGoogleLoading(true)
    const callbackUrl = planParam
      ? `/${locale}/checkout?plan=${planParam}`
      : `/${locale}/dashboard/resumes`
    await signIn("google", { callbackUrl })
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-border rounded-2xl p-5 sm:p-8 shadow-sm">
        {planParam && (
          <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-xl px-4 py-3 mb-5 text-sm font-medium">
            <Zap className="h-4 w-4 shrink-0" />
            Crea tu cuenta para activar tu Plan Pro — solo toma 30 segundos
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("submit")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {t("have_account")}{" "}
          <Link
            href={planParam ? `/login?plan=${planParam}` : "/login"}
            className="text-primary font-medium hover:underline"
          >
            {t("login_link")}
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground mt-3">
          {t("terms_prefix")}{" "}
          <Link href="/terms" className="underline">{t("terms")}</Link>{" "}
          {t("and")}{" "}
          <Link href="/privacy" className="underline">{t("privacy")}</Link>
        </p>
      </div>
    </div>
  )
}
