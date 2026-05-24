import { cn } from "@/lib/utils"

interface Props {
  badge: string
  title: string
  description: string
  mockup: React.ReactNode
  reverse?: boolean
  alt?: boolean
}

export default function GuideFeatureBlock({ badge, title, description, mockup, reverse = false, alt = false }: Props) {
  return (
    <section style={{ background: alt ? "#f8fafc" : "white", padding: "64px 16px" }}>
      <div
        className="animate-on-scroll"
        style={{
          maxWidth: 960, margin: "0 auto",
          display: "flex", flexDirection: "column",
          gap: 48, alignItems: "center",
        }}
      >
        <div style={{
          display: "flex", flexDirection: reverse ? "row-reverse" : "row",
          flexWrap: "wrap", alignItems: "center", gap: 56, width: "100%",
        }}>
          {/* Mockup side */}
          <div style={{ flex: "1 1 340px", display: "flex", justifyContent: "center" }}>
            {mockup}
          </div>

          {/* Text side */}
          <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 18, height: 1.5, background: "#00D4FF", borderRadius: 2 }} />
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
                color: "#00D4FF", padding: "3px 12px", borderRadius: 999,
                background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.22)",
              }}>
                ✦ {badge}
              </span>
            </div>

            <h2 style={{
              fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: 800, color: "#1a2e4a",
              letterSpacing: "-0.025em", lineHeight: 1.2, margin: 0,
            }}>
              {title}
            </h2>

            <p style={{
              fontSize: 15, color: "#6B7A8C", lineHeight: 1.7, margin: 0, maxWidth: 440,
            }}>
              {description}
            </p>

            {/* Decorative separator */}
            <div style={{
              height: 1, width: 48,
              background: "linear-gradient(90deg, #00D4FF, transparent)",
              borderRadius: 2, marginTop: 4,
            }} />
          </div>
        </div>
      </div>
    </section>
  )
}
