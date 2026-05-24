interface Props { locale?: string }

export default function SummaryMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const title      = isEs ? "Resumen Profesional" : "Professional Summary"
  const aiBadge    = isEs ? "Generado con IA" : "AI Generated"
  const regenerate = isEs ? "✦ Regenerar versión" : "✦ Regenerate version"
  const hint       = isEs ? "Analiza tu perfil completo · Genera en segundos" : "Analyzes your full profile · Generates in seconds"
  const counter    = isEs ? "Versión 1 de 3" : "Version 1 of 3"

  const summary = isEs
    ? "Diseñadora UX con 5 años en productos digitales B2B. Especialista en design systems y research de usuarios, con historial de aumentar retención un 30% y reducir tiempos de onboarding un 45%."
    : "UX Designer with 5 years of experience in B2B digital products. Specialist in design systems and user research, with a track record of increasing retention by 30% and reducing onboarding time by 45%."

  return (
    <div style={{
      background: "white", borderRadius: 20, border: "1.5px solid #E8EEF8",
      boxShadow: "0 8px 40px rgba(26,46,74,0.10)", padding: "18px",
      width: "100%", maxWidth: 340, margin: "0 auto",
    }}>
      {/* Chrome bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 8, fontFamily: "monospace" }}>
          ReadyCVV · {isEs ? "Resumen IA" : "AI Summary"}
        </span>
      </div>

      {/* Hint strip */}
      <div style={{
        borderRadius: 8, background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)",
        padding: "6px 10px", marginBottom: 10,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{ fontSize: 9, color: "#00D4FF" }}>✦</span>
        <span style={{ fontSize: 9, color: "#64748B" }}>{hint}</span>
      </div>

      {/* Summary card */}
      <div style={{
        borderRadius: 12, border: "1.5px solid rgba(26,46,74,0.10)",
        background: "linear-gradient(135deg, rgba(26,46,74,0.03) 0%, rgba(0,212,255,0.03) 100%)",
        padding: "14px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: "#1a2e4a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {title}
            </span>
            <span style={{
              fontSize: 8, fontWeight: 700, color: "#00D4FF",
              background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.22)",
              borderRadius: 999, padding: "1px 6px",
            }}>
              {aiBadge}
            </span>
          </div>
          <span style={{ fontSize: 9, color: "#94A3B8" }}>{counter}</span>
        </div>
        <p style={{ fontSize: 12, color: "#1a2e4a", lineHeight: 1.65 }}>{summary}</p>

        {/* Decorative accent line */}
        <div style={{ marginTop: 12, height: 1, background: "linear-gradient(90deg, rgba(0,212,255,0.4), transparent)" }} />
      </div>

      {/* Regenerate button */}
      <button style={{
        marginTop: 10, width: "100%",
        fontSize: 11, fontWeight: 700,
        color: "#1a2e4a", background: "transparent",
        border: "1.5px solid rgba(26,46,74,0.15)", borderRadius: 10,
        padding: "8px", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
      }}>
        <span style={{ color: "#00D4FF" }}>✦</span>
        {regenerate}
      </button>
    </div>
  )
}
