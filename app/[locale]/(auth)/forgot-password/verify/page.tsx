import { Suspense } from "react"
import ForgotPasswordVerifyForm from "@/components/auth/ForgotPasswordVerifyForm"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verificar código — Valhalla Resume",
  robots: { index: false, follow: false },
}

export default async function ForgotPasswordVerifyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <Suspense>
      <ForgotPasswordVerifyForm />
    </Suspense>
  )
}
