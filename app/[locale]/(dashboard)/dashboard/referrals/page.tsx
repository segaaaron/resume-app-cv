import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { auth } from "@/lib/auth"
import { referralService } from "@/lib/controllers/referral-deps"
import ReferralsPageClient from "@/components/dashboard/referrals/ReferralsPageClient"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "dashboard.referrals.meta" })
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  }
}

export default async function ReferralsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user?.id) redirect(`/${locale}/login`)

  // Managed users (plan=LIMITED) cannot access referrals — feature unavailable.
  if (session.user.isManaged) redirect(`/${locale}/dashboard`)

  // Fetch server-side so the page paints instantly without flicker
  const status = await referralService.getStatus(session.user.id)

  // Resolve origin from request headers (works behind proxies / Dokploy)
  const h = await headers()
  const proto = h.get("x-forwarded-proto") ?? "https"
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "readycvv.com"
  const origin = `${proto}://${host}`

  return <ReferralsPageClient locale={locale} origin={origin} initialStatus={status} />
}
