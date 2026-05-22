"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"

export default function BoldBlockTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, projects } = sd
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const ink = "#0e0e0e"
  const sand = "#f0ebe2"
  const muted = "#bdb6a8"
  const darkMuted = "#5a5650"
  const textDark = "#3a3530"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: sand, color: ink,
      fontFamily: "'Archivo', 'Inter', sans-serif", fontSize: 10.5, lineHeight: 1.5,
      display: "grid", gridTemplateRows: "auto 1fr",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Header block */}
      <header style={{
        background: ink, color: sand, padding: "40px 48px",
        display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center",
        position: "relative", overflow: "hidden",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        {/* Decorative circle */}
        <div style={{
          position: "absolute", right: -60, top: -60, width: 280, height: 280,
          background: accent, borderRadius: "50%",
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.25em", color: accent, marginBottom: 10 }}>HOLA, SOY</div>
          <h1 style={{
            fontFamily: "'Archivo Black', 'Archivo', 'Inter', sans-serif", fontWeight: 900, fontSize: 72,
            lineHeight: 0.9, margin: 0, letterSpacing: "-0.04em", textTransform: "uppercase",
          }}>
            {pd.firstName || "Nombre"}<br />{pd.lastName || "Apellido"}
          </h1>
          {pd.jobTitle && (
            <div style={{ marginTop: 14, fontSize: 14, fontWeight: 600 }}>{pd.jobTitle}</div>
          )}
          <div style={{ display: "flex", gap: 16, marginTop: 16, fontFamily: "ui-monospace, monospace", fontSize: 10, color: muted, flexWrap: "wrap" }}>
            {pd.email && <span>{pd.email}</span>}
            {pd.email && (pd.github || pd.city) && <span>·</span>}
            {pd.github && <span>{pd.github}</span>}
            {pd.github && pd.city && <span>·</span>}
            {(pd.city || pd.country) && <span>{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
          </div>
        </div>

        {/* Initials block */}
        <div style={{ position: "relative", zIndex: 1, flexShrink: 0 }}>
          {(() => {
            const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
            return (
              <div style={{ width: 180, height: 180, borderRadius: 12, backgroundColor: accent, display: "flex", alignItems: "center", justifyContent: "center", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ fontWeight: 900, fontSize: 72, color: "#fff", lineHeight: 1 }}>{initials || "N"}</span>}
              </div>
            )
          })()}
        </div>
      </header>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {/* Left column */}
        <div style={{ padding: "32px 32px 32px 48px", borderRight: `2px solid ${ink}` }}>
          {/* Summary */}
          {visible("summary") && summary && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.05em", margin: "0 0 12px", color: accent, fontWeight: 700 }}>// {label("summary").toLowerCase()}</h2>
              <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.6 }}>{summary}</p>
            </div>
          )}

          {/* Skills as "stack" */}
          {visible("skills") && skills.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.05em", margin: "0 0 12px", color: accent, fontWeight: 700 }}>// {label("skills").toLowerCase()}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skills.map((sk) => (
                  <span key={sk.id} style={{
                    background: ink, color: sand, padding: "4px 10px",
                    fontFamily: "ui-monospace, monospace", fontSize: 10,
                    WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                  }}>{sk.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {visible("education") && education.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.05em", margin: "0 0 12px", color: accent, fontWeight: 700 }}>// {label("education").toLowerCase()}</h2>
              {education.map((edu) => (
                <div key={edu.id} style={{ borderLeft: `4px solid ${accent}`, paddingLeft: 12, marginBottom: 14, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  <div style={{ fontWeight: 800, fontSize: 12 }}>{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}</div>
                  <div style={{ fontSize: 10.5, color: darkMuted }}>
                    {edu.institution}{edu.city ? ` · ${edu.city}` : ""}
                    {edu.startDate && ` · ${edu.startDate}`}{edu.endDate ? `—${edu.endDate}` : edu.currentlyStudying ? `—${present}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {visible("languages") && languages.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.05em", margin: "0 0 12px", color: accent, fontWeight: 700 }}>// {label("languages").toLowerCase()}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {languages.map((lang) => (
                  <div key={lang.id} style={{
                    background: ink, color: sand, padding: "10px 12px",
                    WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                  }}>
                    <div style={{ fontFamily: "'Archivo Black', 'Archivo', sans-serif", fontSize: 22, lineHeight: 1 }}>{lang.name.slice(0, 2).toUpperCase()}</div>
                    <div style={{ fontSize: 9.5, color: muted, marginTop: 2 }}>{lang.level.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ padding: "32px 48px 32px 32px" }}>
          {/* Work Experience */}
          {visible("workExperience") && workExperience.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.05em", margin: "0 0 12px", color: accent, fontWeight: 700 }}>// {label("workExperience").toLowerCase()}</h2>
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry" style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{job.jobTitle}</div>
                    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5 }}>
                      {job.startDate}{job.currentlyWorking ? " →" : job.endDate ? ` — ${job.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: accent, marginBottom: 4 }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</div>
                  {job.description && (
                    <div className="resume-desc" style={{ fontSize: 10.5, color: textDark }} dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {visible("projects") && projects.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: "0.05em", margin: "0 0 12px", color: accent, fontWeight: 700 }}>// {label("projects").toLowerCase()}</h2>
              {projects.map((proj, i) => (
                <div key={proj.id} style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 10, marginBottom: 12, alignItems: "start" }}>
                  <div style={{ fontFamily: "'Archivo Black', 'Archivo', sans-serif", fontSize: 22, color: accent, lineHeight: 1 }}>{String(i + 1).padStart(2, "0")}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 12 }}>{proj.name}</div>
                    {proj.role && <div style={{ fontSize: 10.5, color: accent, fontWeight: 600 }}>{proj.role}</div>}
                    {proj.description && <div style={{ fontSize: 10.5, color: textDark }}>{proj.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
