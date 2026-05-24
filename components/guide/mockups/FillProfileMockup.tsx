interface Props { locale?: string }

export default function FillProfileMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const prompt = isEs
    ? '"Soy desarrolladora React con 4 años en startups, especializada en performance y accesibilidad."'
    : '"I\'m a React developer with 4 years in startups, specialized in performance and accessibility."'

  const aiGenerated  = isEs ? "✦ IA generó 3 sugerencias" : "✦ AI generated 3 suggestions"
  const applyLabel   = isEs ? "Aplicar" : "Apply"
  const inputHint    = isEs ? "Describe tu trayectoria (máx. 500 caracteres)" : "Describe your background (max 500 chars)"

  const results = isEs
    ? [
        {
          icon: "📝",
          label: "Resumen profesional",
          badge: "Generado por IA",
          suggested: "Desarrolladora frontend con 4 años en startups SaaS. Especializada en React, rendimiento web y accesibilidad, reduciendo tiempos de carga un 35%.",
        },
        {
          icon: "🏷️",
          label: "Título del puesto",
          badge: "Sugerido",
          suggested: "Frontend Developer · React & Accesibilidad",
        },
        {
          icon: "🛠️",
          label: "Habilidades sugeridas",
          badge: "Extraídas",
          suggested: "React, TypeScript, Tailwind CSS, Figma, Jest, Accesibilidad WCAG",
        },
      ]
    : [
        {
          icon: "📝",
          label: "Professional summary",
          badge: "AI generated",
          suggested: "Frontend developer with 4 years at SaaS startups. Specialized in React, web performance and accessibility, reducing load times by 35%.",
        },
        {
          icon: "🏷️",
          label: "Job title",
          badge: "Suggested",
          suggested: "Frontend Developer · React & Accessibility",
        },
        {
          icon: "🛠️",
          label: "Suggested skills",
          badge: "Extracted",
          suggested: "React, TypeScript, Tailwind CSS, Figma, Jest, WCAG Accessibility",
        },
      ]

  return (
    <div style={{
      background: "white", borderRadius: 20,
      border: "1.5px solid #E8EEF8",
      boxShadow: "0 8px 40px rgba(26,46,74,0.10)",
      padding: "18px 18px 16px", width: "100%", maxWidth: 340, margin: "0 auto",
    }}>
      {/* Chrome bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 8, fontFamily: "monospace" }}>
          ReadyCVV · {isEs ? "Completar con IA" : "AI Assistant"}
        </span>
      </div>

      {/* Input box */}
      <div style={{
        borderRadius: 10, border: "1.5px solid #E2E8F0",
        background: "#F8FAFC", padding: "10px 12px", marginBottom: 10,
      }}>
        <p style={{ fontSize: 10, color: "#64748B", lineHeight: 1.5, marginBottom: 4 }}>{inputHint}</p>
        <p style={{ fontSize: 11, color: "#1a2e4a", fontStyle: "italic", lineHeight: 1.5 }}>{prompt}</p>
      </div>

      {/* AI badge */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
          color: "#00D4FF", background: "rgba(0,212,255,0.08)",
          border: "1px solid rgba(0,212,255,0.25)", borderRadius: 999,
          padding: "3px 10px",
        }}>
          {aiGenerated}
        </span>
      </div>

      {/* Result cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {results.map((r) => (
          <div key={r.label} style={{
            borderRadius: 10, border: "1.5px solid rgba(26,46,74,0.08)",
            background: "rgba(26,46,74,0.02)", padding: "10px 12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10 }}>{r.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#1a2e4a" }}>{r.label}</span>
              </div>
              <span style={{
                fontSize: 8, fontWeight: 700, color: "#00D4FF",
                background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)",
                borderRadius: 999, padding: "1px 6px",
              }}>
                {r.badge}
              </span>
            </div>
            <p style={{ fontSize: 11, color: "#475569", lineHeight: 1.55, marginBottom: 8 }}>{r.suggested}</p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button style={{
                fontSize: 10, fontWeight: 700, color: "white",
                background: "linear-gradient(135deg, #1a2e4a 0%, #0f1e33 100%)",
                border: "none", borderRadius: 7, padding: "4px 12px", cursor: "pointer",
                boxShadow: "0 2px 8px rgba(26,46,74,0.2)",
              }}>
                {applyLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
