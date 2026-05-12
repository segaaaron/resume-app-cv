"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function AcademicCVTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const paper = "#fff"
  const ink = "#111"
  const red = config.colorScheme || "#7a0010"
  const grey = "#666"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: paper,
      color: ink,
      fontFamily: "'EB Garamond', serif",
      fontSize: 11,
      padding: 56,
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Header */}
      <div style={{ borderBottom: `2px solid ${ink}`, paddingBottom: 14, marginBottom: 18 }}>
        <h1 style={{ fontFamily: "'EB Garamond', serif", fontWeight: 700, fontSize: 30, margin: 0 }}>
          {pd.firstName || "Nombre"} {pd.lastName || "Apellido"}
        </h1>
        {pd.jobTitle && (
          <div style={{ fontStyle: "italic", fontSize: 13.5, marginTop: 4 }}>{pd.jobTitle}</div>
        )}
        <div style={{ display: "flex", gap: 18, marginTop: 8, fontSize: 10.5, color: grey, fontFamily: "ui-monospace, monospace", flexWrap: "wrap" }}>
          {pd.email && <span>{pd.email}</span>}
          {pd.phone && <span>{pd.phone}</span>}
          {pd.linkedin && <span>{pd.linkedin}</span>}
          {pd.website && <span>{pd.website}</span>}
          {(pd.city || pd.country) && <span>{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
        </div>
      </div>

      {/* Summary */}
      {visible("summary") && summary && (
        <>
          <H ink={ink}>{label("summary")}</H>
          <p style={{ margin: "0 0 12px", lineHeight: 1.7, fontSize: 11 }}>{summary}</p>
        </>
      )}

      {/* Work Experience / Academic Appointments */}
      {visible("workExperience") && workExperience.length > 0 && (
        <>
          <H ink={ink}>{label("workExperience")}</H>
          {workExperience.map((job) => (
            <Row key={job.id} red={red}
              l={`${job.startDate?.match(/\d{4}/)?.[0] || ""}${job.currentlyWorking ? ` — ${present}` : job.endDate?.match(/\d{4}/)?.[0] ? ` — ${job.endDate.match(/\d{4}/)?.[0]}` : ""}`}
            >
              <><b>{job.jobTitle}</b>{job.employer ? <> · {job.employer}</> : ""}{job.city ? <> · {job.city}</> : ""}</>
              {job.description && (
                <div className="resume-desc" style={{ fontSize: 10.5, marginTop: 4, lineHeight: 1.55 }}
                  dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
              )}
            </Row>
          ))}
        </>
      )}

      {/* Education */}
      {visible("education") && education.length > 0 && (
        <>
          <H ink={ink}>{label("education")}</H>
          {education.map((edu) => (
            <Row key={edu.id} red={red}
              l={edu.endDate?.match(/\d{4}/)?.[0] || edu.startDate?.match(/\d{4}/)?.[0] || ""}
            >
              <><b>{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}</b>{edu.institution ? <> · {edu.institution}</> : ""}</>
            </Row>
          ))}
        </>
      )}

      {/* Certifications / Publications */}
      {visible("certifications") && certifications.length > 0 && (
        <>
          <H ink={ink}>{label("certifications")}</H>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 11, lineHeight: 1.7 }}>
            {certifications.map((cert) => (
              <li key={cert.id}>
                {cert.name}
                {cert.issuer ? <> · <i>{cert.issuer}</i></> : ""}
                {cert.date ? ` · ${cert.date}` : ""}
              </li>
            ))}
          </ol>
        </>
      )}

      {/* Projects */}
      {visible("projects") && projects && projects.length > 0 && (
        <>
          <H ink={ink}>{label("projects")}</H>
          {projects.map((proj) => (
            <Row key={proj.id} red={red}
              l={proj.startDate?.match(/\d{4}/)?.[0] || ""}
            >
              <><b>{proj.name}</b>{proj.description ? <> — {proj.description}</> : ""}</>
            </Row>
          ))}
        </>
      )}

      {/* Skills */}
      {visible("skills") && skills.length > 0 && (
        <>
          <H ink={ink}>{label("skills")}</H>
          <p style={{ margin: "0 0 12px", lineHeight: 1.7, fontSize: 11 }}>
            {skills.map((sk, i) => (
              <span key={sk.id}>{i > 0 ? " · " : ""}{sk.name}</span>
            ))}
          </p>
        </>
      )}

      {/* Languages */}
      {visible("languages") && languages.length > 0 && (
        <>
          <H ink={ink}>{label("languages")}</H>
          <p style={{ margin: "0 0 12px" }}>
            {languages.map((lang, i) => (
              <span key={lang.id}>{i > 0 ? " · " : ""}{lang.name}{lang.level ? ` (${lang.level.toUpperCase()})` : ""}</span>
            ))}
          </p>
        </>
      )}

      {/* Footer */}
      <footer style={{ marginTop: "auto", borderTop: `1px solid ${ink}`, paddingTop: 8, fontSize: 9, color: grey, fontFamily: "ui-monospace, monospace", letterSpacing: "0.18em", textAlign: "center" }}>
        {config.language === "en" ? `UPDATED · ${new Date().getFullYear()} · PAGE 1 OF 1` : `ACTUALIZADO · ${new Date().getFullYear()} · PÁGINA 1 DE 1`}
      </footer>
    </div>
  )
}

function H({ ink, children }: { ink: string; children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "'EB Garamond', serif",
      fontSize: 14,
      fontWeight: 700,
      margin: "16px 0 8px",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      borderBottom: `1px solid ${ink}`,
      paddingBottom: 2,
    }}>
      {children}
    </h2>
  )
}

function Row({ l, red, children }: { l: string; red: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12, padding: "5px 0", fontSize: 11, lineHeight: 1.55 }}>
      <div style={{ fontStyle: "italic", color: red }}>{l}</div>
      <div>{children}</div>
    </div>
  )
}
