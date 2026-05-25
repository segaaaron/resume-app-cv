"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function ChalkboardTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present

  const board = config.colorScheme || "#1f3a2c"
  const chalk = "#f3f1e8"
  const yellow = "#f5d76e"
  const pink = "#f4a3b6"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: board,
      color: chalk,
      fontFamily: "'Caveat', cursive",
      fontSize: 18,
      padding: 0,
      position: "relative",
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Wooden frame border */}
      <div style={{ position: "absolute", inset: 12, border: "10px solid #6e4a2a", borderRadius: 4, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />

      {/* Header */}
      <div style={{ padding: "44px 48px 0", position: "relative", zIndex: 1 }}>
        {pd.jobTitle && (
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 24, color: yellow, transform: "rotate(-1deg)" }}>
            ~ {pd.jobTitle} ~
          </div>
        )}
        <h1 style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 72, lineHeight: 0.95, margin: "10px 0", letterSpacing: "0.01em" }}>
          {pd.firstName || "Nombre"}<br />{pd.lastName || "Apellido"}
        </h1>
        {summary && visible("summary") && (
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 22, color: pink, transform: "rotate(0.4deg)", maxWidth: 480 }}>
            {summary}
          </div>
        )}
      </div>

      {/* Main grid */}
      <main style={{ padding: "24px 48px 40px", display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 32, flex: 1, position: "relative", zIndex: 1 }}>
        {/* Left column */}
        <section>
          {/* Work Experience */}
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H yellow={yellow}>{label("workExperience")}</H>
              {workExperience.map((job) => (
                <div key={job.id} style={{ fontFamily: "'Caveat', cursive", fontSize: 21, lineHeight: 1.35, marginBottom: 12 }}>
                  <span style={{ color: yellow }}>
                    {job.startDate?.match(/\d{4}/)?.[0]}{job.currentlyWorking ? ` → ${present}` : job.endDate?.match(/\d{4}/)?.[0] ? `—${job.endDate.match(/\d{4}/)?.[0]}` : ""}
                  </span>
                  {" — "}
                  <b style={{ color: pink }}>{job.employer}</b>
                  <br />
                  <span style={{ paddingLeft: 16 }}>↳ {job.jobTitle}{job.city ? ` · ${job.city}` : ""}</span>
                  {job.description && (
                    <div className="resume-desc" style={{ fontSize: 18, paddingLeft: 16, lineHeight: 1.4 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              ))}
            </>
          )}

          {/* Skills */}
          {visible("skills") && skills.length > 0 && (
            <>
              <H yellow={yellow}>{label("skills")}</H>
              <ul style={{ margin: 0, paddingLeft: 20, fontFamily: "'Caveat', cursive", fontSize: 22, lineHeight: 1.4 }}>
                {skills.map((sk) => (
                  <li key={sk.id}>{sk.name}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Right column */}
        <section>
          {/* Education — sticky note style */}
          {visible("education") && education.length > 0 && (
            <div style={{
              background: chalk,
              color: board,
              padding: 16,
              transform: "rotate(-1.5deg)",
              boxShadow: "4px 4px 0 rgba(0,0,0,0.3)",
              fontFamily: "'Caveat', cursive",
              marginBottom: 24,
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}>
              <div style={{ fontSize: 22, color: "#a13a3a" }}>{label("education")} ✿</div>
              <div style={{ fontSize: 19, lineHeight: 1.45, marginTop: 4 }}>
                {education.map((edu, i) => (
                  <span key={edu.id}>
                    {i > 0 && <br />}
                    · {edu.endDate?.match(/\d{4}/)?.[0] || edu.startDate?.match(/\d{4}/)?.[0]}
                    {" · "}
                    {edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}
                    {edu.institution ? ` · ${edu.institution}` : ""}
                  </span>
                ))}
                {visible("certifications") && certifications.length > 0 && certifications.map((cert) => (
                  <span key={cert.id}><br />· {cert.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {visible("languages") && languages.length > 0 && (
            <>
              <H yellow={yellow}>{label("languages")}</H>
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: 21, lineHeight: 1.5 }}>
                {languages.map((lang) => (
                  <div key={lang.id}>{lang.name}{lang.level ? ` · ${lang.level.toUpperCase()}` : ""}</div>
                ))}
              </div>
            </>
          )}

          {/* Contact */}
          <H yellow={yellow}>{L.contact}</H>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 21, lineHeight: 1.5 }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && <div>{pd.phone}</div>}
            {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(" · ")}</div>}
            {pd.linkedin && <div>{pd.linkedin}</div>}
          </div>
        </section>
      </main>

      {/* Eraser decoration */}
      <div style={{ position: "absolute", right: 60, bottom: 30, width: 70, height: 32, background: "#d2b48c", borderRadius: 4, boxShadow: "2px 2px 0 rgba(0,0,0,0.3)", zIndex: 2, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <div style={{ height: 12, background: "#8b6f47", margin: "10px 5px 0", borderRadius: 2, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      </div>
    </div>
  )
}

function H({ yellow, children }: { yellow: string; children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "'Permanent Marker', cursive",
      fontSize: 30,
      color: yellow,
      margin: "20px 0 8px",
      textDecoration: "underline",
    }}>
      {children}
    </h2>
  )
}
