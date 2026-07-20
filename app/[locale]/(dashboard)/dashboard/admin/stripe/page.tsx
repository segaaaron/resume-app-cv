import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { auth } from "@/lib/auth"
import { getTranslations } from "next-intl/server"
import { getStripeOverview } from "@/lib/services/stripe/stripeAdminReport"
import StripeHealthPanel from "@/components/admin/StripeHealthPanel"
import StripeWebhookFeed from "@/components/admin/StripeWebhookFeed"
import StripeBillingTimeline from "@/components/admin/StripeBillingTimeline"
import StripeLivePanel from "@/components/admin/StripeLivePanel"

export const dynamic = "force-dynamic"

export const metadata = { title: "Admin — Stripe Health", robots: { index: false, follow: false } }

export default async function AdminStripePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "dashboard_admin.stripe" })
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    redirect(`/${locale}/dashboard/resumes`)
  }

  const overview = await getStripeOverview()

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
        <StripeHealthPanel overview={overview} />
      </div>

      {/* Webhook feed */}
      <Section delay="90ms" title={t("section_webhooks")}>
        <StripeWebhookFeed />
      </Section>

      {/* Billing timeline */}
      <Section delay="110ms" title={t("section_timeline")}>
        <StripeBillingTimeline />
      </Section>

      {/* Live Stripe */}
      <Section delay="130ms" title={t("section_live")}>
        <StripeLivePanel />
      </Section>
    </div>
  )
}

function Section({ title, delay, children }: { title: string; delay: string; children: React.ReactNode }) {
  return (
    <div className="dash-card-in mb-9" style={{ animationDelay: delay }}>
      <h2 className="text-[16px] font-bold text-[#1a2e4a] tracking-[-0.01em] mb-4 flex items-center gap-2">
        <span className="inline-block w-[10px] h-[10px] rounded-[3px] bg-gradient-to-br from-[#00D4FF] to-[#00A8CC]" />
        {title}
      </h2>
      {children}
    </div>
  )
}
