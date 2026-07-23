import { cn } from "@/lib/utils"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

interface Props {
  badge: string
  title: string
  description: string
  mockup: React.ReactNode
  reverse?: boolean
  alt?: boolean
  /** PRO/LIMITED-only feature (ats-score, cv-review). Shows a PRO pill + honest note. */
  pro?: boolean
  locale: string
}

export default async function GuideFeatureBlock({ badge, title, description, mockup, reverse = false, alt = false, pro = false, locale }: Props) {
  const t = await getTranslations({ locale, namespace: "guide.upsell" })

  return (
    <section className={cn("py-16 px-4", alt ? "bg-[#f8fafc]" : "bg-white")}>
      <div className="animate-on-scroll max-w-[960px] mx-auto flex flex-col gap-12 items-center">
        <div className={cn(
          "flex flex-wrap items-center gap-14 w-full",
          reverse ? "flex-row-reverse" : "flex-row"
        )}>
          {/* Mockup side */}
          <div className="flex-[1_1_340px] flex justify-center">
            {mockup}
          </div>

          {/* Text side */}
          <div className="flex-[1_1_300px] flex flex-col gap-4">
            {/* Badge row */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-[18px] h-px bg-dash-cyan rounded-sm" />
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold tracking-[0.12em] uppercase text-dash-cyan px-3 py-[3px] rounded-full"
                style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.22)" }}
              >
                ✦ {badge}
              </span>
              {pro && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-[0.12em] uppercase px-2.5 py-[3px] rounded-full text-[#5a3d0a]"
                  style={{ background: "linear-gradient(135deg, #F5D77E 0%, #C9A96E 100%)", boxShadow: "0 2px 8px rgba(201,169,110,0.4)" }}
                >
                  ★ {t("pro_badge")}
                </span>
              )}
            </div>

            <h2 className="text-[clamp(22px,3.5vw,30px)] font-extrabold text-dash-navy tracking-[-0.025em] leading-[1.2] m-0">
              {title}
            </h2>

            <p className="text-[15px] text-dash-muted leading-[1.7] m-0 max-w-[440px]">
              {description}
            </p>

            {/* Decorative separator */}
            <div className="mt-1 h-px w-12 rounded-sm"
              style={{ background: "linear-gradient(90deg, #00D4FF, transparent)" }}
            />

            {/* Honest availability + upsell to plans */}
            <p className="text-[12.5px] leading-[1.5] m-0 text-dash-muted/90">
              {pro ? t("pro_note") : t("free_note")}
            </p>
            <Link
              href={`/${locale}/pricing`}
              className="group inline-flex w-fit items-center gap-1.5 text-[13px] font-bold rounded-[12px] px-5 py-2.5 no-underline text-[#071525] transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)",
                boxShadow: "0 4px 16px rgba(0,212,255,0.3)",
              }}
            >
              {t("cta")}
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
