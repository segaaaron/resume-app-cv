import { getTranslations } from "next-intl/server"
import Link from "next/link"

export default async function GuideHero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "guide.hero" })

  const stats = [
    t("stat_templates"),
    t("stat_ai"),
    t("stat_ats"),
    t("stat_pdf"),
  ]

  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-24"
      style={{ background: "linear-gradient(160deg, #071525 0%, #0a1e35 60%, #071525 100%)" }}
    >
      {/* Tech grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow orbs */}
      <div className="absolute pointer-events-none rounded-full"
        style={{ top: -80, right: -60, width: 320, height: 320, background: "radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)" }}
      />
      <div className="absolute pointer-events-none rounded-full"
        style={{ bottom: -60, left: "20%", width: 240, height: 240, background: "radial-gradient(circle, rgba(0,102,255,0.08) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-[760px] mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-7">
          <div className="w-5 h-px bg-dash-cyan rounded-sm" />
          <span className="text-[10px] font-extrabold tracking-[0.16em] uppercase text-dash-cyan px-3.5 py-1 rounded-full"
            style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.25)" }}
          >
            {t("badge")}
          </span>
          <div className="w-5 h-px bg-dash-cyan rounded-sm" />
        </div>

        {/* H1 */}
        <h1 className="text-[clamp(28px,5vw,48px)] font-extrabold leading-[1.15] tracking-[-0.025em] mb-5 text-white">
          {t("h1")}
        </h1>

        {/* Subtitle */}
        <p className="text-[clamp(15px,2.5vw,18px)] max-w-[580px] mx-auto mb-9 leading-[1.7]"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          {t("subtitle")}
        </p>

        {/* Stat pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-11">
          {stats.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full backdrop-blur-sm"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              <span className="text-[10px] text-dash-cyan">✦</span>
              {s}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href={`/${locale}/login`}
            className="inline-flex items-center gap-2 font-extrabold text-sm px-7 py-3.5 rounded-xl no-underline"
            style={{
              background: "linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)",
              color: "#071525",
              boxShadow: "0 0 24px rgba(0,212,255,0.3), 0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            {t("cta_primary")} →
          </Link>
          <Link href={`/${locale}/pricing`}
            className="inline-flex items-center font-semibold text-sm px-7 py-3.5 rounded-xl no-underline"
            style={{
              background: "transparent",
              border: "1.5px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {t("cta_secondary")}
          </Link>
        </div>
      </div>
    </section>
  )
}
