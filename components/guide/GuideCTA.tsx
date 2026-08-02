import { getTranslations } from "next-intl/server"
import Link from "next/link"

export default async function GuideCTA({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "guide.cta" })

  return (
    <section className="px-4 pb-20 pt-4 bg-[#f8fafc]">
      <div className="relative overflow-hidden max-w-[720px] mx-auto rounded-[28px] px-10 py-16 text-center"
        style={{
          background: "linear-gradient(160deg, #071525 0%, #0a1e35 60%, #071525 100%)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,212,255,0.12)",
        }}
      >
        {/* Tech grid */}
        <div className="absolute inset-0 pointer-events-none rounded-[28px]"
          style={{
            backgroundImage: "linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Top glow */}
        <div className="absolute pointer-events-none rounded-full"
          style={{
            top: -60, left: "50%", transform: "translateX(-50%)",
            width: 280, height: 160,
            background: "radial-gradient(ellipse, rgba(0,212,255,0.2) 0%, transparent 70%)",
            filter: "blur(24px)",
          }}
        />

        {/* Animated border on top edge */}
        <div className="absolute top-0 h-px"
          style={{
            left: "20%", right: "20%",
            background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.6), transparent)",
          }}
        />

        <div className="relative">
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="w-4 h-px bg-dash-cyan rounded-sm" />
            <span className="text-[10px] font-extrabold tracking-[0.14em] uppercase text-dash-cyan">
              Valhalla Resume
            </span>
            <div className="w-4 h-px bg-dash-cyan rounded-sm" />
          </div>

          <h2 className="text-[clamp(24px,4vw,38px)] font-extrabold text-white tracking-[-0.025em] leading-[1.2] mb-3.5">
            {t("h2")}
          </h2>

          <p className="text-[15px] mb-9 leading-[1.7]" style={{ color: "rgba(255,255,255,0.55)" }}>
            {t("subtitle")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href={`/${locale}/pricing`}
              className="inline-flex items-center gap-2 font-extrabold text-[15px] px-9 py-3.5 rounded-[14px] no-underline transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)",
                color: "#071525",
                boxShadow: "0 0 28px rgba(0,212,255,0.35), 0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {t("button")} →
            </Link>
            <Link href={`/${locale}/login`}
              className="inline-flex items-center gap-2 font-bold text-[14px] px-7 py-3.5 rounded-[14px] no-underline text-white transition-colors duration-200"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(0,212,255,0.28)",
              }}
            >
              {t("button_secondary")}
            </Link>
          </div>

          <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>
            {t("note")}
          </p>
        </div>
      </div>
    </section>
  )
}
