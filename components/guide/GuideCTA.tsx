import { getTranslations } from "next-intl/server"
import Link from "next/link"

export default async function GuideCTA({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "guide.cta" })

  return (
    <section style={{ padding: "16px 16px 80px", background: "#f8fafc" }}>
      <div style={{
        maxWidth: 720, margin: "0 auto",
        position: "relative", overflow: "hidden",
        background: "linear-gradient(160deg, #071525 0%, #0a1e35 60%, #071525 100%)",
        borderRadius: 28, padding: "64px 40px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,212,255,0.12)",
        textAlign: "center",
      }}>
        {/* Tech grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 28,
          backgroundImage: "linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />

        {/* Top glow */}
        <div style={{
          position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
          width: 280, height: 160, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(0,212,255,0.2) 0%, transparent 70%)",
          filter: "blur(24px)", pointerEvents: "none",
        }} />

        {/* Animated border on top edge */}
        <div style={{
          position: "absolute", top: 0, left: "20%", right: "20%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.6), transparent)",
        }} />

        <div style={{ position: "relative" }}>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 16, height: 1.5, background: "#00D4FF", borderRadius: 2 }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#00D4FF" }}>
              ReadyCVV
            </span>
            <div style={{ width: 16, height: 1.5, background: "#00D4FF", borderRadius: 2 }} />
          </div>

          <h2 style={{
            fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "white",
            letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: 14,
          }}>
            {t("h2")}
          </h2>

          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 36, lineHeight: 1.7 }}>
            {t("subtitle")}
          </p>

          <Link href={`/${locale}/register`} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)",
            color: "#071525", fontWeight: 800, fontSize: 15,
            padding: "14px 36px", borderRadius: 14, textDecoration: "none",
            boxShadow: "0 0 28px rgba(0,212,255,0.35), 0 4px 12px rgba(0,0,0,0.3)",
          }}>
            {t("button")} →
          </Link>

          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 16 }}>
            {t("note")}
          </p>
        </div>
      </div>
    </section>
  )
}
