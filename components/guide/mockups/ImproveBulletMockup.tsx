interface Props { locale?: string }

export default function ImproveBulletMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const company      = "Brightwell Media"
  const role         = isEs ? "Analista de Marketing" : "Marketing Analyst"
  const descLabel    = isEs ? "Descripción" : "Description"
  const improvedLabel = isEs ? "Descripción mejorada" : "Improved description"
  const applyLabel   = isEs ? "Aplicar" : "Apply"
  const improvedByAI = isEs ? "✦ Mejorado por IA · 3 versiones" : "✦ Improved by AI · 3 versions"
  const improveBtn   = isEs ? "✦ Mejorar con IA" : "✦ Improve with AI"
  const beforeNote   = isEs ? "Antes — genérico" : "Before — generic"
  const afterNote    = isEs ? "Después — con métricas" : "After — with metrics"

  const bullets = isEs
    ? [
        "Ayudé al equipo de marketing con las campañas.",
        "Creé reportes y presentaciones para dirección.",
        "Apoyé en tareas de comunicación con clientes.",
      ]
    : [
        "Helped the marketing team with campaigns.",
        "Created reports and presentations for management.",
        "Assisted with customer communication tasks.",
      ]

  const improved = isEs
    ? [
        "Coordiné 8 campañas digitales generando 320k+ impresiones y +22% en conversiones.",
        "Diseñé 15+ dashboards ejecutivos adoptados en toda la empresa, ahorrando 3 hrs/semana.",
        "Resolví 200+ consultas/mes con índice de satisfacción del 97% en 2 trimestres.",
      ]
    : [
        "Coordinated 8 digital campaigns generating 320k+ impressions and a 22% increase in conversions.",
        "Designed 15+ executive dashboards adopted company-wide, reducing reporting time by 3 hrs/week.",
        "Resolved 200+ customer inquiries/month with a 97% satisfaction score for 2 consecutive quarters.",
      ]

  return (
    <div style={{ width: "100%", maxWidth: 360, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Before card */}
      <div style={{
        background: "white", borderRadius: 18, border: "1.5px solid #E8EEF8",
        boxShadow: "0 4px 20px rgba(26,46,74,0.07)", padding: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }} />
          <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 8, fontFamily: "monospace" }}>
            {role} · {company}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
          {[role, company].map((val) => (
            <div key={val} style={{
              borderRadius: 7, border: "1px solid #E2E8F0",
              background: "#F8FAFC", padding: "5px 8px",
              fontSize: 10, color: "#64748B",
            }}>{val}</div>
          ))}
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {descLabel}
              </span>
              <span style={{
                fontSize: 8, color: "#94A3B8", background: "#F1F5F9",
                border: "1px solid #E2E8F0", borderRadius: 4, padding: "1px 5px",
              }}>
                {beforeNote}
              </span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, color: "#00D4FF", cursor: "pointer" }}>{improveBtn}</span>
          </div>
          <div style={{ borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", padding: "8px 10px" }}>
            {bullets.map((b, i) => (
              <p key={i} style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.55, marginBottom: i < bullets.length - 1 ? 3 : 0 }}>
                • {b}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* AI badge connector */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{ width: 1, height: 8, background: "rgba(0,212,255,0.3)" }} />
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: "0.06em",
          color: "white", background: "linear-gradient(135deg, #1a2e4a 0%, #0a1e35 100%)",
          borderRadius: 999, padding: "4px 12px",
          boxShadow: "0 2px 12px rgba(0,212,255,0.25)", border: "1px solid rgba(0,212,255,0.3)",
        }}>
          {improvedByAI}
        </span>
        <div style={{ width: 1, height: 8, background: "rgba(0,212,255,0.3)" }} />
      </div>

      {/* After card */}
      <div style={{
        background: "white", borderRadius: 18,
        border: "1.5px solid rgba(0,212,255,0.25)",
        boxShadow: "0 4px 24px rgba(0,212,255,0.1)",
        padding: "14px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#1a2e4a" }}>{improvedLabel}</span>
            <span style={{
              fontSize: 8, color: "#00D4FF", background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)", borderRadius: 4, padding: "1px 5px",
            }}>
              {afterNote}
            </span>
          </div>
          <button style={{
            fontSize: 9, fontWeight: 700, color: "white",
            background: "linear-gradient(135deg, #1a2e4a 0%, #0f1e33 100%)",
            border: "none", borderRadius: 6, padding: "3px 10px", cursor: "pointer",
          }}>
            {applyLabel}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {improved.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <div style={{
                width: 14, height: 14, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                background: "rgba(0,212,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 7, color: "#00D4FF", fontWeight: 800 }}>✓</span>
              </div>
              <p style={{ fontSize: 10, color: "#1a2e4a", lineHeight: 1.55, fontWeight: 500 }}>{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
