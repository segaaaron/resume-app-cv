import { getTranslations } from "next-intl/server"

export default async function GuideStats({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "guide.stats" })

  const stats = [
    { number: t("templates_number"), label: t("templates_label") },
    { number: t("ai_number"),        label: t("ai_label") },
    { number: t("time_number"),      label: t("time_label") },
  ]

  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: "linear-gradient(160deg, #071525 0%, #0a1e35 100%)",
      padding: "72px 16px",
    }}>
      {/* Tech grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <div style={{ position: "relative", maxWidth: 800, margin: "0 auto" }}>
        {/* Label */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 52 }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.3))" }} />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(0,212,255,0.7)", whiteSpace: "nowrap" }}>
            {t("title")}
          </span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(0,212,255,0.3), transparent)" }} />
        </div>

        {/* Stats */}
        <div className="animate-on-scroll" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
          {stats.map(({ number, label }, i) => (
            <div key={label} style={{
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
              padding: "32px 24px",
              borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              position: "relative",
            }}>
              {/* Glow behind number */}
              <div style={{
                position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
                width: 100, height: 60, borderRadius: "50%",
                background: "radial-gradient(ellipse, rgba(0,212,255,0.15) 0%, transparent 70%)",
                filter: "blur(12px)", pointerEvents: "none",
              }} />

              <span style={{
                fontSize: "clamp(40px, 7vw, 60px)", fontWeight: 900, lineHeight: 1,
                background: "linear-gradient(135deg, #ffffff 30%, #00D4FF 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.03em", marginBottom: 10, position: "relative",
              }}>
                {number}
              </span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", letterSpacing: "0.02em" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
