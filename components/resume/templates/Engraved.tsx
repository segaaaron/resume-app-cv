"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function EngravedTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const paper = "#f6efde"
  const ink = "#0a0a0a"
  const gold = config.colorScheme || "#8a6d2c"

  // Get first letter of last name or first name for the monogram
  const monogram = (pd.lastName || pd.firstName || "C").charAt(0).toUpperCase()

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: paper,
      color: ink,
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 13,
      padding: 0,
      position: "relative",
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Double border frame */}
      <div style={{ position: "absolute", inset: 24, border: `2px solid ${gold}`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      <div style={{ position: "absolute", inset: 30, border: `1px solid ${gold}`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />

      <div style={{ padding: "60px 64px", flex: 1, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ margin: "0 auto", display: "block" }}>
            <circle cx="30" cy="30" r="26" fill="none" stroke={gold} strokeWidth="1.5" />
            <circle cx="30" cy="30" r="20" fill="none" stroke={gold} strokeWidth="0.6" />
            <text x="30" y="36" fontSize="20" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontWeight="700" fill={gold}>{monogram}</text>
          </svg>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.4em", marginTop: 8, color: gold }}>
            ★&nbsp; CURRICULUM VITAE &nbsp;★
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 56, fontWeight: 500, margin: "16px 0 4px", letterSpacing: "0.02em" }}>
            {pd.firstName || "Nombre"} {pd.lastName || "Apellido"}
          </h1>
          <div style={{ width: 200, height: 1, background: gold, margin: "0 auto", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
          {pd.jobTitle && (
            <div style={{ fontStyle: "italic", fontSize: 16, marginTop: 8 }}>{pd.jobTitle}</div>
          )}
        </div>

        {/* Summary */}
        {visible("summary") && summary && (
          <>
            <H gold={gold}>{label("summary")}</H>
            <p style={{ margin: "0 0 12px", lineHeight: 1.7 }}>{summary}</p>
          </>
        )}

        {/* Work Experience */}
        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <H gold={gold}>{label("workExperience")}</H>
            {workExperience.map((job) => (
              <div key={job.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr", gap: 14, padding: "8px 0", borderBottom: `1px dotted ${gold}` }}>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: gold, letterSpacing: "0.15em" }}>
                  {job.startDate?.match(/\d{4}/)?.[0]}{job.currentlyWorking ? `–${present}` : job.endDate?.match(/\d{4}/)?.[0] ? `–${job.endDate.match(/\d{4}/)?.[0]}` : ""}
                </div>
                <div style={{ fontWeight: 600 }}>{job.jobTitle}</div>
                <div style={{ fontStyle: "italic" }}>{job.employer}{job.city ? ` · ${job.city}` : ""}</div>
                {job.description && (
                  <div style={{ gridColumn: "2 / -1" }}>
                    <div className="resume-desc" style={{ fontSize: 12, lineHeight: 1.55 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Education */}
        {visible("education") && education.length > 0 && (
          <>
            <H gold={gold}>{label("education")}</H>
            <p style={{ margin: 0, lineHeight: 1.7 }}>
              {education.map((edu, i) => (
                <span key={edu.id}>
                  {i > 0 && <br />}
                  <i>{edu.endDate?.match(/\d{4}/)?.[0] || edu.startDate?.match(/\d{4}/)?.[0]}</i>
                  {" · "}
                  {edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}
                  {edu.institution ? <> · <b>{edu.institution}</b></> : ""}
                </span>
              ))}
            </p>
          </>
        )}

        {/* Skills */}
        {visible("skills") && skills.length > 0 && (
          <>
            <H gold={gold}>{label("skills")}</H>
            <p style={{ margin: 0, lineHeight: 1.7 }}>
              {skills.map((sk, i) => (
                <span key={sk.id}>{i > 0 ? " · " : ""}{sk.name}</span>
              ))}
            </p>
          </>
        )}

        {/* Certifications */}
        {visible("certifications") && certifications.length > 0 && (
          <>
            <H gold={gold}>{label("certifications")}</H>
            <p style={{ margin: 0, lineHeight: 1.7 }}>
              {certifications.map((cert, i) => (
                <span key={cert.id}>
                  {i > 0 && <br />}
                  {cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}{cert.date ? ` · ${cert.date}` : ""}
                </span>
              ))}
            </p>
          </>
        )}

        {/* Languages & Contact */}
        {(visible("languages") && languages.length > 0 || pd.email || pd.phone) && (
          <>
            <H gold={gold}>{config.language === "en" ? "Languages & Contact" : "Idiomas y Contacto"}</H>
            <p style={{ margin: 0, lineHeight: 1.7 }}>
              {visible("languages") && languages.length > 0 && (
                <>{languages.map(l => `${l.name}${l.level ? ` ${l.level.toUpperCase()}` : ""}`).join(" · ")}<br /></>
              )}
              {pd.email && <>{pd.email}{pd.phone ? ` · ${pd.phone}` : ""}<br /></>}
              {(pd.city || pd.country) && <>{[pd.city, pd.country].filter(Boolean).join(", ")}</>}
            </p>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "0 64px 50px", position: "relative", zIndex: 1 }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.4em", color: gold }}>
          —&nbsp; IN FIDEM SCRIPSI &nbsp;—
        </div>
      </div>
    </div>
  )
}

function H({ gold, children }: { gold: string; children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 22,
      fontWeight: 600,
      margin: "20px 0 8px",
      color: gold,
      fontStyle: "italic",
    }}>
      {children}
    </h2>
  )
}
