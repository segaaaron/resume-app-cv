interface Props { locale?: string }

export default function CVReviewMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const titleLabel = isEs ? "ReadyCVV · Revisión IA" : "ReadyCVV · AI Review"
  const applyLabel = isEs ? "Aplicar →" : "Apply →"
  const okLabel    = isEs ? "Fortalezas" : "Strengths"
  const warnLabel  = isEs ? "Mejoras sugeridas" : "Suggested improvements"
  const hint       = isEs ? "Cada sugerencia tiene botón Aplicar — 1 clic y se actualiza" : "Each suggestion has Apply — 1 click and it updates"

  const items = isEs
    ? [
        { type: "ok",   text: "Experiencia laboral cuantificada con métricas" },
        { type: "ok",   text: "Palabras clave del sector incluidas" },
        { type: "warn", text: "Resumen demasiado genérico — específica tu especialidad" },
        { type: "warn", text: "Falta sección de proyectos personales" },
        { type: "warn", text: "Agrega logros medibles en educación" },
      ]
    : [
        { type: "ok",   text: "Work experience quantified with metrics" },
        { type: "ok",   text: "Industry keywords included" },
        { type: "warn", text: "Summary too generic — specify your specialty" },
        { type: "warn", text: "Missing personal projects section" },
        { type: "warn", text: "Add measurable achievements to education" },
      ]

  const okItems   = items.filter(i => i.type === "ok")
  const warnItems = items.filter(i => i.type === "warn")

  return (
    <div style={{
      background: "white", borderRadius: 20, border: "1.5px solid #E8EEF8",
      boxShadow: "0 8px 40px rgba(26,46,74,0.10)", padding: "18px",
      width: "100%", maxWidth: 360, margin: "0 auto",
    }}>
      {/* Chrome bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 8, fontFamily: "monospace" }}>{titleLabel}</span>
      </div>

      {/* OK items */}
      <div style={{ marginBottom: 6 }}>
        <p style={{ fontSize: 8, fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
          {okLabel}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {okItems.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              borderRadius: 9, background: "#f0fdf4", border: "1px solid #bbf7d0",
              padding: "8px 10px",
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 8, color: "white", fontWeight: 800 }}>✓</span>
              </div>
              <p style={{ fontSize: 11, color: "#15803d", lineHeight: 1.4 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#F1F5F9", margin: "10px 0" }} />

      {/* Warn items */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 8, fontWeight: 800, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
          {warnLabel}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {warnItems.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              borderRadius: 9, background: "#fffbeb", border: "1px solid #fde68a",
              padding: "8px 10px",
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 9, color: "white" }}>!</span>
              </div>
              <p style={{ fontSize: 10, color: "#92400e", lineHeight: 1.4, flex: 1 }}>{item.text}</p>
              <button style={{
                fontSize: 9, fontWeight: 800, color: "white",
                background: "linear-gradient(135deg, #1a2e4a 0%, #0f1e33 100%)",
                border: "none", borderRadius: 6, padding: "3px 8px",
                cursor: "pointer", flexShrink: 0,
                boxShadow: "0 1px 6px rgba(26,46,74,0.2)",
              }}>
                {applyLabel}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hint */}
      <div style={{
        borderRadius: 8, background: "rgba(0,212,255,0.05)",
        border: "1px solid rgba(0,212,255,0.15)", padding: "6px 10px",
        display: "flex", alignItems: "center", gap: 5,
      }}>
        <span style={{ fontSize: 9, color: "#00D4FF" }}>✦</span>
        <p style={{ fontSize: 9, color: "#64748B" }}>{hint}</p>
      </div>
    </div>
  )
}
