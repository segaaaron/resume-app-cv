interface Props { locale?: string }

export default function ATSScoreMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const present = ["React", "TypeScript", "Figma", "Agile", "Git"]
  const missing = ["GraphQL", "CI/CD", "Node.js"]

  const jobSnippet = isEs
    ? '"Buscamos Frontend Developer con experiencia en React y TypeScript. Se valorará GraphQL y CI/CD para proyectos en equipo ágil..."'
    : '"Looking for a Frontend Developer with React and TypeScript experience. GraphQL and CI/CD knowledge a plus for agile team projects..."'

  const offerLabel   = isEs ? "Oferta de empleo" : "Job posting"
  const pasteHint    = isEs ? "Pega la descripción del puesto" : "Paste the job description"
  const analyzeBtn   = isEs ? "✦ Analizar compatibilidad" : "✦ Analyze compatibility"
  const highCompat   = isEs ? "Compatibilidad alta" : "High compatibility"
  const presentLabel = isEs ? "Presentes en tu CV" : "Present in your CV"
  const missingLabel = isEs ? "Faltantes — añádelos" : "Missing — add these"
  const tip          = isEs ? "Añade las keywords faltantes para mejorar tu score" : "Add missing keywords to improve your score"

  return (
    <div style={{ width: "100%", maxWidth: 360, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Input card */}
      <div style={{
        background: "white", borderRadius: 18, border: "1.5px solid #E8EEF8",
        boxShadow: "0 4px 20px rgba(26,46,74,0.07)", padding: "14px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#1a2e4a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {offerLabel}
          </span>
          <div style={{ flex: 1, height: 1, background: "#F1F5F9" }} />
          <span style={{ fontSize: 8, color: "#94A3B8" }}>{pasteHint}</span>
        </div>
        <div style={{
          borderRadius: 10, background: "#F8FAFC", border: "1px solid #E2E8F0",
          padding: "9px 11px", marginBottom: 10,
        }}>
          <p style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>{jobSnippet}</p>
        </div>
        <button style={{
          width: "100%", fontSize: 11, fontWeight: 800,
          color: "white", background: "linear-gradient(135deg, #1a2e4a 0%, #0a1e35 100%)",
          border: "none", borderRadius: 10, padding: "9px", cursor: "pointer",
          boxShadow: "0 4px 16px rgba(26,46,74,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          <span style={{ color: "#00D4FF" }}>✦</span> {analyzeBtn}
        </button>
      </div>

      {/* Arrow connector */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ width: 1, height: 10, background: "linear-gradient(180deg, rgba(0,212,255,0.4), rgba(0,212,255,0.1))" }} />
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1l5 5 5-5" stroke="rgba(0,212,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Results card */}
      <div style={{
        background: "white", borderRadius: 18, border: "1.5px solid rgba(0,212,255,0.2)",
        boxShadow: "0 6px 28px rgba(0,212,255,0.08)", padding: "16px",
      }}>
        {/* Chrome */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }} />
          <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 8, fontFamily: "monospace" }}>ReadyCVV · ATS Score</span>
        </div>

        {/* Score circle */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 14 }}>
          <div style={{ position: "relative", width: 76, height: 76 }}>
            <svg viewBox="0 0 36 36" style={{ width: 76, height: 76, transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F1F5F9" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="2.5"
                strokeDasharray="87 13" strokeLinecap="round" />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#1a2e4a", lineHeight: 1 }}>87%</span>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", marginTop: 4 }}>{highCompat}</span>
        </div>

        {/* Keywords */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
              {presentLabel}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {present.map(k => (
                <span key={k} style={{
                  fontSize: 9, fontWeight: 700, color: "#16a34a",
                  background: "#f0fdf4", border: "1px solid #bbf7d0",
                  borderRadius: 999, padding: "2px 8px",
                }}>✓ {k}</span>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
              {missingLabel}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {missing.map(k => (
                <span key={k} style={{
                  fontSize: 9, fontWeight: 700, color: "#dc2626",
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 999, padding: "2px 8px",
                }}>✗ {k}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Tip */}
        <div style={{
          marginTop: 10, borderRadius: 8,
          background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)",
          padding: "6px 10px", display: "flex", alignItems: "center", gap: 5,
        }}>
          <span style={{ fontSize: 9, color: "#00D4FF" }}>💡</span>
          <p style={{ fontSize: 9, color: "#64748B" }}>{tip}</p>
        </div>
      </div>
    </div>
  )
}
