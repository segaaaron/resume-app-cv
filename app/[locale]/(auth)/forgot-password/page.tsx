import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm"
import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Restablecer contraseña — READY CV",
  robots: { index: false, follow: false },
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ForgotPasswordForm />
}
