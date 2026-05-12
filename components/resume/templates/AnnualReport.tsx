"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function AnnualReportTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const ink = "#0a1f44"
  const red = config.colorScheme || "#c72e1f"
  const paper = "#fafafa"

  function H({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
      <h2 style={{
        fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.22em",
        color: red, margin: "0 0 10px", textTransform: "uppercase" as const, ...style,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        {children}
      </h2>
    )
  }

  function Item({ y, h, s }: { y: string; h: string; s?: string }) {
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, color: red, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{y}</div>
        <div style={{ fontWeight: 700, fontSize: 12 }}>{h}</div>
        {s && <div style={{ fontSize: 10.5, color: "#555" }}>{s}</div>}
      </div>
    )
  }

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: paper, color: ink,
      fontFamily: "'Inter', sans-serif", fontSize: 10.5, padding: 48,
      display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Header */}
      <header style={{ borderBottom: `3px double ${ink}`, paddingBottom: 18, marginBottom: 24 }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.25em", color: red,
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          <span>ANNUAL REPORT</span>
          <span>FY {new Date().getFullYear()}</span>
          <span>CURRICULUM VITÆ</span>
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 56, fontWeight: 900,
          letterSpacing: "-0.02em", margin: "12px 0 4px",
        }}>
          {pd.firstName || "First"} {pd.lastName || "Last"}
        </h1>
        {pd.jobTitle && (
          <div style={{ fontStyle: "italic", fontSize: 16, color: ink }}>{pd.jobTitle}</div>
        )}
      </header>

      {/* Summary as "Letter from the candidate" */}
      {visible("summary") && summary && (
        <section style={{ marginBottom: 22 }}>
          <H>{config.language === "en" ? "Letter from the candidate" : "Carta del candidato"}</H>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65, columnCount: 2, columnGap: 24 }}>
            {summary}
          </p>
        </section>
      )}

      {/* Two-column main */}
      <section style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 28 }}>
        {/* Left: Work Experience as Operating History table */}
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H>{label("workExperience")}</H>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${ink}` }}>
                    <th style={{ textAlign: "left", padding: "6px 4px", fontSize: 9, letterSpacing: "0.15em", color: red, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>FY</th>
                    <th style={{ textAlign: "left", padding: "6px 4px", fontSize: 9, letterSpacing: "0.15em", color: red, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{config.language === "en" ? "POSITION" : "CARGO"}</th>
                    <th style={{ textAlign: "left", padding: "6px 4px", fontSize: 9, letterSpacing: "0.15em", color: red, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{config.language === "en" ? "COMPANY" : "EMPRESA"}</th>
                    <th style={{ textAlign: "right", padding: "6px 4px", fontSize: 9, letterSpacing: "0.15em", color: red, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{config.language === "en" ? "SCOPE" : "LUGAR"}</th>
                  </tr>
                </thead>
                <tbody>
                  {workExperience.map((job) => {
                    const startY = job.startDate?.match(/\d{4}/)?.[0]?.slice(2) ?? ""
                    const endY = job.currentlyWorking
                      ? (config.language === "en" ? "Now" : "Hoy")
                      : job.endDate?.match(/\d{4}/)?.[0]?.slice(2) ?? ""
                    const fyRange = startY && endY ? `${startY}—${endY}` : startY || ""
                    return (
                      <>
                        <tr key={job.id} style={{ borderBottom: job.description ? "none" : "1px solid #ddd" }}>
                          <td style={{ padding: "6px 4px", fontFamily: "ui-monospace, monospace", fontSize: 10 }}>{fyRange}</td>
                          <td style={{ padding: "6px 4px", fontWeight: 700 }}>{job.jobTitle}</td>
                          <td style={{ padding: "6px 4px" }}>{job.employer}</td>
                          <td style={{ padding: "6px 4px", textAlign: "right", color: "#666" }}>{job.city || ""}</td>
                        </tr>
                        {job.description && (
                          <tr key={`${job.id}-d`} style={{ borderBottom: "1px solid #ddd" }}>
                            <td />
                            <td colSpan={3} style={{ padding: "2px 4px 8px" }}>
                              <div className="resume-desc" style={{ fontSize: 10.5, color: "#444", lineHeight: 1.55 }}
                                dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>

              {/* Sparkline — career progression visual */}
              <H style={{ marginTop: 22 }}>{config.language === "en" ? "Career trajectory" : "Trayectoria"}</H>
              <svg width="100%" height="60" viewBox="0 0 400 60">
                <polyline points="0,50 50,46 100,38 150,30 200,24 250,18 300,12 400,6" fill="none" stroke={red} strokeWidth="2" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties} />
                {[0, 50, 100, 150, 200, 250, 300, 400].map((x, i) => (
                  <circle key={i} cx={x} cy={[50, 46, 38, 30, 24, 18, 12, 6][i]} r="2.5" fill={ink} />
                ))}
              </svg>
            </>
          )}

          {/* Skills */}
          {visible("skills") && skills.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <H>{label("skills")}</H>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skills.map((sk) => (
                  <span key={sk.id} style={{ fontSize: 10.5, marginRight: 8, lineHeight: 1.7 }}>
                    {sk.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Education, Certifications, Languages, Contact */}
        <div>
          {visible("education") && education.length > 0 && (
            <>
              <H>{label("education")}</H>
              {education.map((edu) => (
                <Item
                  key={edu.id}
                  y={edu.endDate?.match(/\d{4}/)?.[0] ?? edu.startDate?.match(/\d{4}/)?.[0] ?? ""}
                  h={[edu.degree, edu.fieldOfStudy].filter(Boolean).join(" · ")}
                  s={edu.institution}
                />
              ))}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H style={{ marginTop: 16 }}>{label("certifications")}</H>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, lineHeight: 1.7 }}>
                {certifications.map((cert) => (
                  <li key={cert.id}>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}</li>
                ))}
              </ul>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H style={{ marginTop: 16 }}>{label("languages")}</H>
              <p style={{ margin: 0, fontSize: 11 }}>
                {languages.map((l) => `${l.name} · ${l.level.toUpperCase()}`).join(" · ")}
              </p>
            </>
          )}

          <H style={{ marginTop: 16 }}>{config.language === "en" ? "Contact" : "Contacto"}</H>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, lineHeight: 1.85 }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && <div>{pd.phone}</div>}
            {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(" · ")}</div>}
            {pd.linkedin && <div>{pd.linkedin}</div>}
            {pd.website && <div>{pd.website}</div>}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: "auto", paddingTop: 10,
        borderTop: `1px solid ${ink}`,
        display: "flex", justifyContent: "space-between",
        fontFamily: "ui-monospace, monospace", fontSize: 9, color: "#666",
      }}>
        <span>ISIN · CV-{(pd.lastName || "XX").slice(0, 2).toUpperCase()}-{new Date().getFullYear()}</span>
        <span>Page 1 of 1</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}
