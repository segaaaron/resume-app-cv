import RegisterForm from "@/components/auth/RegisterForm"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.register" })

  return {
    title: t("title"),
    description: t("description"),
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `https://readycvv.com/${locale}/register`,
    },
  }
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  let serverError = false
  try {
    const session = await auth()
    if (session?.user?.id) redirect(`/${locale}/dashboard/resumes`)
  } catch (e) {
    // redirect() throws internally — re-throw so Next.js handles it
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e
    const err = e as { digest?: string }
    if (typeof err?.digest === "string" && err.digest.startsWith("NEXT_REDIRECT")) throw e
    serverError = true
  }
  return <RegisterForm serverError={serverError} />
}
