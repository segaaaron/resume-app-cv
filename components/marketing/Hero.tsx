import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { getTranslations, getLocale } from "next-intl/server"
import { db } from "@/lib/db"
import HeroMockupCard from "./HeroMockupCard"

export default async function Hero() {
  const t = await getTranslations("hero")
  const locale = await getLocale()

  let userCount = 1200
  try {
    userCount = await db.user.count({ where: { deletedAt: null } })
  } catch { /* use fallback */ }

  return (
    <section className="relative overflow-hidden bg-white">
      {/* radial-gradient with specific position kept as inline — not expressible in Tailwind */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 70% -10%, #EFF6FF 0%, transparent 60%)" }}
      />

      <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-[55%_45%] items-center gap-12">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 text-sm text-blue-700 font-medium mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            {userCount.toLocaleString()}+ {t("users_trust")}
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
            {t("title")}{" "}
            <span className="text-primary">{t("title_highlight")}</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
            {t("subtitle")}
          </p>

          <ul className="space-y-2 mb-10">
            {[t("proof_ats"), t("proof_pdf"), t("proof_ai")].map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                {point}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="gap-2 shadow-brand-md" asChild>
              <Link href={`/${locale}/login`}>
                {t("cta_primary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={`/${locale}/templates`}>{t("cta_secondary")}</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">{t("cancel_anytime")}</p>
        </div>

        <HeroMockupCard />
      </div>
    </section>
  )
}
