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
    <section style={{ position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #071525 0%, #0a1e35 60%, #071525 100%)", padding: "80px 16px 100px" }}>
      {/* Tech grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Glow orbs */}
      <div style={{ position: "absolute", top: -80, right: -60, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: "20%", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,102,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <div style={{ width: 20, height: 1.5, background: "#00D4FF", borderRadius: 2 }} />
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase",
            color: "#00D4FF", padding: "4px 14px", borderRadius: 999,
            background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.25)",
          }}>
            {t("badge")}
          </span>
          <div style={{ width: 20, height: 1.5, background: "#00D4FF", borderRadius: 2 }} />
        </div>

        {/* H1 */}
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, lineHeight: 1.15,
          letterSpacing: "-0.025em", marginBottom: 20, color: "white",
        }}>
          {t("h1")}
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: "clamp(15px, 2.5vw, 18px)", color: "rgba(255,255,255,0.65)", maxWidth: 580, margin: "0 auto 36px", lineHeight: 1.7 }}>
          {t("subtitle")}
        </p>

        {/* Stat pills */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 44 }}>
          {stats.map((s) => (
            <span key={s} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600,
              padding: "6px 14px", borderRadius: 999, backdropFilter: "blur(8px)",
            }}>
              <span style={{ color: "#00D4FF", fontSize: 10 }}>✦</span>
              {s}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <Link href={`/${locale}/register`} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)",
            color: "#071525", fontWeight: 800, fontSize: 14,
            padding: "13px 28px", borderRadius: 12, textDecoration: "none",
            boxShadow: "0 0 24px rgba(0,212,255,0.3), 0 4px 12px rgba(0,0,0,0.2)",
          }}>
            {t("cta_primary")} →
          </Link>
          <Link href={`/${locale}/pricing`} style={{
            display: "inline-flex", alignItems: "center",
            background: "transparent", border: "1.5px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 14,
            padding: "13px 28px", borderRadius: 12, textDecoration: "none",
          }}>
            {t("cta_secondary")}
          </Link>
        </div>
      </div>
    </section>
  )
}
