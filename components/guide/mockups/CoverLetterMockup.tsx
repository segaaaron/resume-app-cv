interface Props { locale?: string }

export default function CoverLetterMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const greeting    = isEs ? "Estimado/a Equipo de Brightwell Inc.," : "Dear Brightwell Inc. Team,"
  const closing     = isEs ? "Atentamente, Sarah Johnson" : "Sincerely, Sarah Johnson"
  const regenerate  = isEs ? "✦ Regenerar" : "✦ Regenerate"
  const download    = isEs ? "Descargar PDF" : "Download PDF"
  const titleLabel  = isEs ? "ReadyCVV · Carta IA" : "ReadyCVV · AI Letter"
  const toLabel     = isEs ? "Para:" : "To:"
  const roleLabel   = isEs ? "Posición:" : "Role:"
  const hint        = isEs ? "Genera variantes hasta encontrar la perfecta · Editable con formato rico" : "Generate variants until perfect · Editable with rich text"

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
        <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 8, fontFamily: "monospace" }}>{titleLabel}</span>
      </div>

      {/* Meta row */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10,
      }}>
        {[
          { lbl: toLabel, val: "Brightwell Inc." },
          { lbl: roleLabel, val: isEs ? "Analista de Marketing" : "Marketing Analyst" },
        ].map(({ lbl, val }) => (
          <div key={lbl} style={{
            borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC",
            padding: "5px 8px",
          }}>
            <p style={{ fontSize: 8, color: "#94A3B8", marginBottom: 1 }}>{lbl}</p>
            <p style={{ fontSize: 10, color: "#1a2e4a", fontWeight: 600 }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Letter preview */}
      <div style={{
        borderRadius: 12, border: "1.5px solid rgba(26,46,74,0.08)",
        background: "#FAFBFC", padding: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7,
              background: "linear-gradient(135deg, #1a2e4a 0%, #0f1e33 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "white", fontSize: 8, fontWeight: 800 }}>RC</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#1a2e4a" }}>Sarah Johnson</span>
          </div>
          <span style={{ fontSize: 9, color: "#94A3B8" }}>9 May 2026</span>
        </div>

        <div style={{ height: 1, background: "#F1F5F9", marginBottom: 8 }} />

        <p style={{ fontSize: 10, color: "#475569", fontWeight: 600, marginBottom: 8 }}>{greeting}</p>

        {/* Simulated letter lines */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
          {[88, 100, 72, 92, 64].map((w, i) => (
            <div key={i} style={{ height: 5, background: "#E9EEF6", borderRadius: 3, width: `${w}%` }} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
          {[96, 82, 68, 90].map((w, i) => (
            <div key={i} style={{ height: 5, background: "#E9EEF6", borderRadius: 3, width: `${w}%` }} />
          ))}
        </div>

        <p style={{ fontSize: 9, color: "#94A3B8", fontStyle: "italic" }}>{closing}</p>
      </div>

      {/* Hint */}
      <div style={{
        marginTop: 8, borderRadius: 8, background: "rgba(0,212,255,0.05)",
        border: "1px solid rgba(0,212,255,0.15)", padding: "5px 9px",
        display: "flex", alignItems: "center", gap: 5,
      }}>
        <span style={{ fontSize: 9, color: "#00D4FF" }}>✦</span>
        <p style={{ fontSize: 9, color: "#64748B" }}>{hint}</p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button style={{
          flex: 1, fontSize: 10, fontWeight: 700,
          color: "#1a2e4a", background: "transparent",
          border: "1.5px solid rgba(26,46,74,0.15)", borderRadius: 9,
          padding: "7px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
        }}>
          <span style={{ color: "#00D4FF" }}>✦</span> {regenerate}
        </button>
        <button style={{
          flex: 1, fontSize: 10, fontWeight: 700, color: "white",
          background: "linear-gradient(135deg, #1a2e4a 0%, #0f1e33 100%)",
          border: "none", borderRadius: 9, padding: "7px", cursor: "pointer",
          boxShadow: "0 2px 10px rgba(26,46,74,0.2)",
        }}>
          {download}
        </button>
      </div>
    </div>
  )
}
