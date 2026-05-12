import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import SettingsForm from "@/components/dashboard/SettingsForm"
import ReferralCard from "@/components/dashboard/ReferralCard"

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user?.id) redirect(`/${locale}/login`)

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, plan: true, subscriptionStatus: true, subscriptionEndsAt: true, planInterval: true, createdAt: true },
  })

  if (!user) redirect(`/${locale}/login`)

  return (
    <div className="max-w-2xl space-y-6">
      <SettingsForm user={user} />
      <ReferralCard />
    </div>
  )
}
