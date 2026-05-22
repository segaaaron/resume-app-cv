"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function ProcessFlowTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present

  const paper = "#f5f4ee"
  const ink = "#1c1c1c"
  const blue = config.colorScheme || "#0a4d8c"
  const orange = "#e07a1c"

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const location = [pd.city, pd.country].filter(Boolean).join(", ")

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h2 style={{
        fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 800, fontSize: 14,
        margin: "16px 0 8px", textTransform: "uppercase", letterSpacing: "0.06em", color: blue,
      }}>{children}</h2>
    )
  }

  // Build DMAIC stages from work experience years
  const dmaic = ["DEFINE", "MEASURE", "ANALYZE", "IMPROVE", "CONTROL"]
  const dmaicColors = [blue, blue, orange, orange, blue]

  // Extract earliest and latest year range spread across 5 stages
  const allYears = workExperience
    .flatMap((j) => [j.startDate?.match(/\d{4}/)?.[0], j.endDate?.match(/\d{4}/)?.[0]])
    .filter(Boolean)
    .map(Number)
    .sort((a, b) => a - b)

  const minYear = allYears[0] ?? new Date().getFullYear() - 8
  const maxYear = allYears[allYears.length - 1] ?? new Date().getFullYear()
  const span = Math.max(maxYear - minYear, 4)
  const stageYears = dmaic.map((_, i) => String(minYear + Math.round((span / 4) * i)))

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: paper, color: ink,
      fontFamily: "'Inter Tight', 'Inter', sans-serif", fontSize: 11,
      padding: 36, display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Header */}
      <header style={{ borderTop: `4px solid ${blue}`, paddingTop: 14, marginBottom: 18, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.25em", color: blue }}>
          <span>PROCESS FLOW · v{new Date().getFullYear()}.{String(new Date().getMonth() + 1).padStart(2, "0")}</span>
          <span>{pd.jobTitle ? pd.jobTitle.toUpperCase() : "PROFESSIONAL CV"}</span>
        </div>
        <h1 style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 900, fontSize: 48, margin: "8px 0 2px", letterSpacing: "-0.03em" }}>
          {fullName.toUpperCase()}
        </h1>
        {pd.jobTitle && (
          <div style={{ fontSize: 13 }}>{pd.jobTitle}</div>
        )}
      </header>

      {/* DMAIC process map */}
      <div style={{ background: "#fff", border: `1.5px solid ${ink}`, padding: 18, marginBottom: 18 }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: blue, letterSpacing: "0.2em", marginBottom: 10 }}>
          FIG. 1 — CAREER PROCESS MAP (DMAIC)
        </div>
        <svg width="100%" height="120" viewBox="0 0 720 120">
          {dmaic.map((stage, i) => (
            <g key={stage}>
              <polygon
                points={`${20 + i * 140},20 ${130 + i * 140},20 ${150 + i * 140},60 ${130 + i * 140},100 ${20 + i * 140},100 ${40 + i * 140},60`}
                fill={dmaicColors[i]}
                style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}
              />
              <text x={75 + i * 140} y={56} fill="#fff" fontSize="11" fontFamily="'Inter Tight', 'Inter'" fontWeight="800" textAnchor="middle">
                {stage}
              </text>
              <text x={75 + i * 140} y={75} fill="#fff" fontSize="9" fontFamily="ui-monospace" textAnchor="middle">
                {stageYears[i]}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, flex: 1 }}>
        {/* Left column */}
        <section>
          {visible("summary") && summary && (
            <>
              <H>{label("summary")}</H>
              <p style={{ margin: "0 0 8px", fontSize: 11, lineHeight: 1.65 }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H>{L.experience}</H>
              {workExperience.map((job) => {
                const start = job.startDate?.match(/\d{4}/)?.[0] ?? ""
                const end = job.currentlyWorking ? present : (job.endDate?.match(/\d{4}/)?.[0] ?? "")
                return (
                  <div key={job.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr", padding: "8px 0", borderBottom: "1px dashed #aaa", gap: 10 }}>
                    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: orange }}>{start}{end ? `–${end}` : ""}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12.5 }}>{job.employer}</div>
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

          {/* KPIs — show first 3 certifications as highlight metrics if available, else skip */}
          {visible("projects") && projects && projects.length > 0 && (
            <>
              <H>{label("projects")}</H>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {projects.slice(0, 3).map((proj) => (
                  <div key={proj.id} style={{
                    background: blue, color: "#fff", padding: 10,
                    WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: "-0.01em" }}>{proj.name.slice(0, 14)}</div>
                    {proj.description && (
                      <div style={{ fontSize: 9, fontFamily: "ui-monospace, monospace", letterSpacing: "0.06em" }}>
                        {proj.description.slice(0, 30)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
                    background: ink, color: paper, padding: "3px 8px",
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
                  <p key={edu.id} style={{ margin: "0 0 6px", lineHeight: 1.7, fontSize: 11.5 }}>
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
              <p style={{ margin: 0 }}>
                {languages.map((l, i) => (
                  <span key={l.id}>{l.name}{l.level ? ` · ${l.level.toUpperCase()}` : ""}{i < languages.length - 1 ? " · " : ""}</span>
                ))}
              </p>
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
    </div>
  )
}
