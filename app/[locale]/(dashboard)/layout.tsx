import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { isActive } from "@/lib/plans"
import DashboardNav from "@/components/dashboard/DashboardNav"
import BottomTabBar from "@/components/dashboard/BottomTabBar"
import PastDueBanner from "@/components/dashboard/PastDueBanner"

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
  )

  return (
    <div className="h-screen flex overflow-hidden dashboard-vintage">
      <DashboardNav
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.role,
        }}
        isPro={isPro}
      />
      <main className="flex-1 overflow-y-auto bg-background pb-16 md:pb-0">
        {session.user.subscriptionStatus === "PAST_DUE" && <PastDueBanner />}
        <div className="p-6 sm:p-8">
          {children}
        </div>
      </main>
      <BottomTabBar isPro={isPro} />
    </div>
  )
}
