import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTranslations } from "next-intl/server"
import SettingsForm from "@/components/dashboard/SettingsForm"

export const dynamic = "force-dynamic"

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user?.id) redirect(`/${locale}/login`)
  const t = await getTranslations("dashboard.settings")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, image: true,
      plan: true, subscriptionStatus: true, subscriptionEndsAt: true, planInterval: true, paymentProvider: true, createdAt: true,
      isManaged: true, managedExpiresAt: true, managedBlocked: true, stripeCustomerId: true,
    },
  })

  if (!user) redirect(`/${locale}/login`)

  return (
    <div className="flex flex-col gap-0">
      {/* Page head */}
      <div className="dash-card-in px-4 py-4 sm:px-8 w-full mb-3" style={{ animationDelay: "0ms" }}>
        <div className="flex items-center gap-[7px] text-[10px] font-bold tracking-[0.1em] uppercase text-[#00D4FF] mb-[6px]">
          {/* decorative rule — width/height are design values that map to no standard utility, keep inline */}
          <span className="inline-block opacity-50 bg-[#00D4FF]" style={{ width: 14, height: 1.5 }} />
          {t("eyebrow_account")}
        </div>
        <h1
          className="text-[32px] font-bold text-[#1a2e4a] tracking-[-0.035em] leading-[1.1] m-0"
          style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
        >
          {t("page_title")}
        </h1>
        <p className="text-[13.5px] text-[#6B7A8C] mt-[6px]">
          {t("page_subtitle")}
        </p>
      </div>
      <div className="dash-card-in px-4 sm:px-8 w-full" style={{ animationDelay: "80ms" }}>
        <SettingsForm user={user} />
      </div>
    </div>
  )
}
