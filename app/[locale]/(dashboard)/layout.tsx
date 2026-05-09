import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import DashboardNav from "@/components/dashboard/DashboardNav"
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

  return (
    <div className="h-screen flex overflow-hidden">
      <DashboardNav user={{ name: session.user.name, email: session.user.email, image: session.user.image, role: session.user.role }} />
      <main className="flex-1 overflow-y-auto bg-neutral-50">
        {session.user.subscriptionStatus === "PAST_DUE" && <PastDueBanner />}
        {children}
      </main>
    </div>
  )
}
