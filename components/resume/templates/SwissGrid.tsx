"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

const SKILL_PCT: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }

export default function SwissGridTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, certifications } = sd
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const ink = "#0a0a0a"
  const paper = "#ffffff"
  const gridColor = "#ececec"

  const currentYear = new Date().getFullYear()
  let yearsExp = parseInt(pd.yearsOfExperience || "0") || (() => {
    if (workExperience.length === 0) return 10
    const earliest = workExperience.reduce((min, job) => {
      const y = parseInt(job.startDate?.match(/\d{4}/)?.[0] || "9999")
      return y < min ? y : min
    }, 9999)
    return earliest < 9999 ? currentYear - earliest : 10
  })()

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const lastName = pd.lastName || "Name"

  return (
    <div style={{
      minHeight: "297mm", background: paper, color: ink,
      fontFamily: "'Inter Tight', 'Helvetica Neue', 'Inter', sans-serif", fontSize: 10, lineHeight: 1.5,
      padding: 48, display: "flex", flexDirection: "column",
      backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
      backgroundSize: "32px 32px",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Header: big number + name */}
      <header style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, padding: "28px 0 24px", borderBottom: `1px solid ${ink}` }}>
        <div>
          <div style={{ fontFamily: "'Inter Tight', 'Helvetica Neue', sans-serif", fontWeight: 900, fontSize: 180, lineHeight: 0.85, letterSpacing: "-0.07em", color: ink }}>
            {yearsExp}
          </div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.18em", color: accent, marginTop: 4 }}>
            {config.language === "en" ? "YEARS" : "AÑOS"} · {pd.jobTitle?.toUpperCase() || "PROFESIONAL"}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "'Inter Tight', 'Helvetica Neue', sans-serif", fontWeight: 800, fontSize: 36, lineHeight: 1, margin: 0, letterSpacing: "-0.03em" }}>
            {pd.firstName || "First"}<br />{pd.lastName || "Last"}
          </h1>
          {pd.jobTitle && (
            <div style={{ fontSize: 12, marginTop: 12 }}>{pd.jobTitle}</div>
          )}
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, marginTop: 12, color: "#555", lineHeight: 1.7 }}>
            {pd.email && <div>↗ {pd.email}</div>}
            {pd.phone && <div>↗ {pd.phone}</div>}
            {(pd.city || pd.country) && <div>↗ {[pd.city, pd.country].filter(Boolean).join(", ")}</div>}
            {pd.linkedin && <div>↗ {pd.linkedin}</div>}
            {pd.website && <div>↗ {pd.website}</div>}
          </div>
        </div>
      </header>

      {/* 12-col body */}
      <main style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16, paddingTop: 24, flex: 1 }}>
        {/* Profile / Summary */}
        {visible("summary") && summary && (
          <div style={{ gridColumn: "span 12", marginBottom: 8 }}>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, letterSpacing: "0.2em", color: accent, textTransform: "uppercase", marginBottom: 10 }}>01 · {label("summary")}</div>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, maxWidth: "75ch" }}>{summary}</p>
          </div>
        )}

        {/* Experience */}
        {visible("workExperience") && workExperience.length > 0 && (
          <div style={{ gridColumn: "span 7" }}>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, letterSpacing: "0.2em", color: accent, textTransform: "uppercase", marginBottom: 10 }}>02 · {label("workExperience")}</div>
            {workExperience.map((job) => (
              <div key={job.id} className="resume-entry" style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 12, paddingBottom: 10, marginBottom: 10, borderBottom: `1px dashed ${gridColor}` }}>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5 }}>
                  {job.startDate?.slice(0, 4)}{job.currentlyWorking ? " →" : job.endDate ? `—${job.endDate.slice(0, 4)}` : ""}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{job.jobTitle}</div>
                  <div style={{ fontSize: 10.5, color: "#444" }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</div>
                  {job.description && (
                    <div className="resume-desc" style={{ fontSize: 10.2, color: "#666", marginTop: 2 }} dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills + Education */}
        <div style={{ gridColumn: "span 5" }}>
          {visible("skills") && skills.length > 0 && (
            <>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, letterSpacing: "0.2em", color: accent, textTransform: "uppercase", marginBottom: 10 }}>03 · {label("skills")}</div>
              {skills.map((sk) => {
                const pct = SKILL_PCT[sk.level] ?? 50
                return (
                  <div key={sk.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                      <span>{sk.name}</span>
                      <span style={{ fontFamily: "ui-monospace, monospace", color: "#666" }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, background: gridColor, marginTop: 3, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                      <div style={{ height: 4, width: `${pct}%`, background: ink, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, letterSpacing: "0.2em", color: accent, textTransform: "uppercase", marginBottom: 10 }}>04 · {label("education")}</div>
              {education.map((edu) => (
                <div key={edu.id} style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: 10, marginBottom: 8, fontSize: 10.5 }}>
                  <span style={{ fontFamily: "ui-monospace, monospace" }}>{edu.startDate?.slice(0, 4) || ""}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}</div>
                    <div style={{ color: "#666" }}>{edu.institution}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Publications (certifications) */}
        {visible("certifications") && certifications.length > 0 && (
          <div style={{ gridColumn: "span 12", marginTop: 8, borderTop: `1px solid ${ink}`, paddingTop: 14 }}>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, letterSpacing: "0.2em", color: accent, textTransform: "uppercase", marginBottom: 10 }}>05 · {label("certifications")}</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 10.5, lineHeight: 1.7, columnCount: 2, columnGap: 24 }}>
              {certifications.map((cert) => (
                <li key={cert.id}>
                  {cert.name}{cert.issuer ? `, <em>${cert.issuer}</em>` : ""}{cert.date ? `, ${cert.date}` : ""}
                </li>
              ))}
            </ol>
          </div>
        )}
      </main>

      {/* Footer marks */}
      <footer style={{ display: "flex", justifyContent: "space-between", fontFamily: "ui-monospace, monospace", fontSize: 9, color: "#777", paddingTop: 12, borderTop: `1px solid ${ink}`, marginTop: 12 }}>
        <span>● {lastName.toUpperCase()} · {currentYear}</span>
        <span>SET IN INTER TIGHT</span>
        <span>VER. 1.0</span>
      </footer>
    </div>
  )
}
