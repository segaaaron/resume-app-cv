import { getTranslations } from "next-intl/server"

export default async function GuideStats({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "guide.stats" })

  const stats = [
    { number: t("templates_number"), label: t("templates_label") },
    { number: t("ai_number"),        label: t("ai_label") },
    { number: t("time_number"),      label: t("time_label") },
  ]

  return (
    <section className="relative overflow-hidden py-[72px] px-4"
      style={{ background: "linear-gradient(160deg, #071525 0%, #0a1e35 100%)" }}
    >
      {/* Tech grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-[800px] mx-auto">
        {/* Label */}
        <div className="flex items-center justify-center gap-2.5 mb-[52px]">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.3))" }} />
          <span className="text-[10px] font-extrabold tracking-[0.14em] uppercase whitespace-nowrap"
            style={{ color: "rgba(0,212,255,0.7)" }}
          >
            {t("title")}
          </span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(0,212,255,0.3), transparent)" }} />
        </div>

        {/* Stats */}
        <div className="animate-on-scroll grid gap-0.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {stats.map(({ number, label }, i) => (
            <div key={label} className="relative flex flex-col items-center text-center px-6 py-8"
              style={{ borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
            >
              {/* Glow behind number */}
              <div className="absolute pointer-events-none rounded-full"
                style={{
                  top: "30%", left: "50%", transform: "translate(-50%, -50%)",
                  width: 100, height: 60,
                  background: "radial-gradient(ellipse, rgba(0,212,255,0.15) 0%, transparent 70%)",
                  filter: "blur(12px)",
                }}
              />

              <span className="relative text-[clamp(40px,7vw,60px)] font-black leading-none tracking-[-0.03em] mb-2.5"
                style={{
                  background: "linear-gradient(135deg, #ffffff 30%, #00D4FF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {number}
              </span>
              <span className="text-[13px] tracking-[0.02em]" style={{ color: "rgba(255,255,255,0.45)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
