"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function CivilEngTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present

  const cream = "#f3eddc"
  const ink = "#1a1f17"
  const orange = config.colorScheme || "#d97928"
  const green = "#3f5d3a"

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const location = [pd.city, pd.country].filter(Boolean).join(", ")

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h2 style={{
        fontFamily: "'Inter Tight', sans-serif", fontWeight: 800, fontSize: 14,
        margin: "16px 0 8px", textTransform: "uppercase", letterSpacing: "0.06em", color: orange,
      }}>{children}</h2>
    )
  }

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: cream, color: ink,
      fontFamily: "'Inter Tight', 'Inter', sans-serif", fontSize: 10.5,
      padding: 36, display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Header */}
      <header style={{ borderBottom: `3px solid ${ink}`, paddingBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.25em", color: orange }}>
            ★ {config.language === "en" ? "GENERAL CONTRACTOR CV" : "CV PROFESIONAL"} · {new Date().getFullYear()}
          </div>
          <h1 style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 800, fontSize: 42, margin: "8px 0 2px", letterSpacing: "-0.02em" }}>
            {fullName}
          </h1>
          {pd.jobTitle && (
            <div style={{ fontSize: 13 }}>{pd.jobTitle}</div>
          )}
        </div>
        {certifications.length > 0 && (
          <div style={{
            background: orange, color: cream, padding: "6px 12px",
            fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.18em",
            WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
          }}>
            {certifications[0].name.toUpperCase().slice(0, 20)}
          </div>
        )}
      </header>

      {/* Stats strip — use first 4 work experiences as metrics or show contact info */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0,
        margin: "16px 0", border: `1.5px solid ${ink}`,
      }}>
        {[
          [pd.email || "—", config.language === "en" ? "email" : "correo"],
          [pd.phone || "—", config.language === "en" ? "phone" : "teléfono"],
          [location || "—", config.language === "en" ? "location" : "ubicación"],
          [pd.linkedin || pd.website || "—", "linkedin / web"],
        ].map((m, i) => (
          <div key={i} style={{
            padding: 10, borderRight: i < 3 ? `1.5px solid ${ink}` : "none",
            textAlign: "center",
            background: i % 2 ? cream : "rgba(217,121,40,0.1)",
            WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
          }}>
            <div style={{ fontWeight: 800, fontSize: 11, letterSpacing: "-0.01em", wordBreak: "break-all" }}>{m[0]}</div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: green, letterSpacing: "0.15em" }}>{m[1]}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, flex: 1 }}>
        {/* Left column */}
        <section>
          {/* Timeline SVG */}
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H>{config.language === "en" ? "Career Timeline" : "Trayectoria"}</H>
              <svg width="100%" height="160" viewBox="0 0 400 160" style={{
                background: "rgba(63,93,58,0.08)", border: `1px solid ${ink}`,
              }}>
                <line x1="40" y1="140" x2="380" y2="140" stroke={ink} strokeWidth="1" />
                {workExperience.slice(0, 5).map((job, i) => {
                  const total = Math.min(workExperience.length, 5)
                  const x = 60 + i * ((320) / Math.max(total - 1, 1))
                  const year = job.startDate?.match(/\d{4}/)?.[0] ?? ""
                  return (
                    <g key={job.id}>
                      <circle cx={x} cy={140} r="5" fill={orange} style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties} />
                      <line x1={x} y1={140} x2={x} y2={110 - i * 6} stroke={ink} strokeWidth="0.6" />
                      <text x={x} y={103 - i * 6} fontFamily="ui-monospace" fontSize="9" textAnchor="middle">{year}</text>
                      <text x={x} y={152} fontFamily="'Inter Tight', 'Inter'" fontSize="10" fontWeight="700" textAnchor="middle">
                        {(job.employer || "").slice(0, 8)}
                      </text>
                    </g>
                  )
                })}
                <text x="200" y="20" fontFamily="ui-monospace" fontSize="10" textAnchor="middle" fill={orange}>
                  FIG. 1 — TIMELINE
                </text>
              </svg>

              <H>{L.experience}</H>
              {workExperience.map((job) => {
                const start = job.startDate?.match(/\d{4}/)?.[0] ?? ""
                const end = job.currentlyWorking ? present : (job.endDate?.match(/\d{4}/)?.[0] ?? "")
                return (
                  <div key={job.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr", padding: "7px 0", borderBottom: "1px dashed #aaa", gap: 10 }}>
                    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: orange }}>{start}{end ? `–${end}` : ""}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{job.employer}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>{job.jobTitle}{job.city ? ` · ${job.city}` : ""}</div>
                      {job.description && (
                        <div className="resume-desc" style={{ fontSize: 10, color: "#555", marginTop: 3 }}
                          dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {visible("summary") && summary && (
            <>
              <H>{label("summary")}</H>
              <p style={{ margin: 0, fontSize: 11, lineHeight: 1.65 }}>{summary}</p>
            </>
          )}
        </section>

        {/* Right column */}
        <section>
          {visible("skills") && skills.length > 0 && (
            <>
              <H>{label("skills")}</H>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {skills.map((sk) => (
                  <span key={sk.id} style={{
                    background: ink, color: cream, padding: "3px 8px",
                    fontSize: 10, fontFamily: "ui-monospace, monospace",
                    WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                  }}>{sk.name}</span>
                ))}
              </div>
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <H>{label("education")}</H>
              {education.map((edu) => {
                const year = edu.endDate?.match(/\d{4}/)?.[0] ?? edu.startDate?.match(/\d{4}/)?.[0] ?? ""
                return (
                  <p key={edu.id} style={{ margin: "0 0 8px", fontSize: 11.5, lineHeight: 1.7 }}>
                    {year && <><b>{year}</b> · </>}
                    {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(" ")}
                    {edu.institution ? ` · ${edu.institution}` : ""}
                  </p>
                )
              })}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H>{label("certifications")}</H>
              <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.85 }}>
                {certifications.map((cert) => (
                  <li key={cert.id}>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}</li>
                ))}
              </ul>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H>{label("languages")}</H>
              <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.85 }}>
                {languages.map((lang) => (
                  <li key={lang.id}>{lang.name}{lang.level ? ` · ${lang.level.toUpperCase()}` : ""}</li>
                ))}
              </ul>
            </>
          )}

          {visible("projects") && projects && projects.length > 0 && (
            <>
              <H>{label("projects")}</H>
              {projects.map((proj) => (
                <p key={proj.id} style={{ margin: "0 0 6px", fontSize: 11, lineHeight: 1.6 }}>
                  <b>{proj.name}</b>{proj.description ? ` — ${proj.description}` : ""}
                </p>
              ))}
            </>
          )}

          <H>{L.contact}</H>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, lineHeight: 1.85 }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && <div>{pd.phone}</div>}
            {location && <div>{location}</div>}
            {pd.linkedin && <div>{pd.linkedin}</div>}
            {pd.website && <div>{pd.website}</div>}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: 14, borderTop: `1.5px solid ${ink}`, padding: "8px 0",
        display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
        fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.2em",
      }}>
        <div>DRAWING · CV-{(pd.lastName || "CV").toUpperCase().replace(/\s/g, "")}-{new Date().getFullYear()}</div>
        <div>SCALE · 1:1</div>
        <div>REV · A</div>
        <div>SHEET · 01/01</div>
      </footer>
    </div>
  )
}
