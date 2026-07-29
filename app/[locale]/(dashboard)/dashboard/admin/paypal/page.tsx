import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { auth } from "@/lib/auth"
import { getTranslations } from "next-intl/server"
import { getPaypalOverview } from "@/lib/services/paypal/paypalAdminReport"
import { paypalEnabled } from "@/lib/paypal"
import PaypalHealthPanel from "@/components/admin/PaypalHealthPanel"

export const dynamic = "force-dynamic"

export const metadata = { title: "Admin — PayPal Health", robots: { index: false, follow: false } }

export default async function AdminPaypalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "dashboard_admin.paypal" })
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    redirect(`/${locale}/dashboard/resumes`)
  }

  const overview = await getPaypalOverview(paypalEnabled())

  return (
    <div className="flex flex-col gap-0">
      {/* Page head */}
      <div className="dash-card-in" style={{ animationDelay: "0ms" }}>
        <div className="mb-7 flex flex-col">
          <Link
            href={`/${locale}/dashboard/admin`}
            className="inline-flex items-center gap-1.5 text-[12px] text-[#6B7A8C] hover:text-[#00D4FF] transition-colors duration-150 mb-3 w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("back_to_admin")}
          </Link>
          <div className="flex items-center gap-[7px] text-[10px] font-bold tracking-[0.1em] uppercase text-[#00D4FF] mb-[6px]">
            <span className="inline-block w-[14px] h-[1.5px] bg-[#00D4FF] opacity-50" />
            {t("eyebrow")}
          </div>
          <h1
            className="text-[32px] font-bold text-[#1a2e4a] tracking-[-0.035em] leading-[1.1] m-0"
            style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
          >
            {t("page_title")}
          </h1>
          <p className="text-[13.5px] text-[#6B7A8C] mt-[6px]">{t("page_subtitle")}</p>
        </div>
      </div>

      {/* Health KPIs */}
      <div className="dash-card-in mb-9" style={{ animationDelay: "60ms" }}>
        <PaypalHealthPanel overview={overview} />
      </div>
    </div>
  )
}
