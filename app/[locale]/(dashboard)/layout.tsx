import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isActive } from "@/lib/plans"
import DashboardShell from "@/components/dashboard/DashboardShell"
import PastDueBanner from "@/components/dashboard/PastDueBanner"
import AnalyticsIdentity from "@/components/analytics/AnalyticsIdentity"
import { deriveUserType, tenureBucket } from "@/lib/analytics/user-type"
import type { IdentityTraits } from "@/lib/analytics/events"

export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) {
    redirect(`/${locale}/login`)
  }

  const isPro = isActive(
    session.user.plan ?? "UNSUBSCRIBED",
    session.user.subscriptionEndsAt ? new Date(session.user.subscriptionEndsAt) : null,
    session.user.subscriptionStatus ?? null,
    session.user.role,
    session.user.isManaged,
    session.user.managedBlocked,
    session.user.managedExpiresAt ? new Date(session.user.managedExpiresAt) : null,
  )

  const pastDueBanner = session.user.subscriptionStatus === "PAST_DUE" ? <PastDueBanner /> : undefined

  const [resumeCount, letterCount, applicationCount, dbUser] = await Promise.all([
    db.resume.count({ where: { userId: session.user.id } }),
    db.coverLetter.count({ where: { userId: session.user.id } }),
    db.application.count({ where: { userId: session.user.id } }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true, referredBy: true, paymentProvider: true },
    }),
  ])

  // Non-PII session traits for Umami identify(). Segments only — never email/id.
  const subStatus = session.user.subscriptionStatus ?? "NONE"
  const provider: IdentityTraits["provider"] = !isPro
    ? "none"
    : dbUser?.paymentProvider === "PAYPAL"
      ? "paypal"
      : "stripe"
  const identityTraits: IdentityTraits = {
    user_type: deriveUserType({
      isAuthenticated: true,
      isManaged: !!session.user.isManaged,
      hasActiveAccess: isPro,
      wasPaying: !isPro && subStatus !== "NONE",
      resumeCount,
      coverLetterCount: letterCount,
      applicationCount,
    }),
    plan: session.user.plan ?? "UNSUBSCRIBED",
    provider,
    locale: locale === "en" ? "en" : "es",
    tenure: dbUser ? tenureBucket(dbUser.createdAt) : "new",
    referred: !!dbUser?.referredBy,
    is_authenticated: true,
  }

  return (
    <DashboardShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      }}
      isPro={isPro}
      isManaged={!!session.user.isManaged}
      pastDueBanner={pastDueBanner}
      resumeCount={resumeCount}
      letterCount={letterCount}
    >
      <AnalyticsIdentity traits={identityTraits} />
      {children}
    </DashboardShell>
  )
}
