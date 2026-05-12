"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function LegalBriefTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const paper = "#fbfaf6"
  const ink = "#0d0d0d"
  const red = config.colorScheme || "#7a1f1f"
  const gold = "#a07a2c"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: paper,
      color: ink,
      fontFamily: "'EB Garamond', serif",
      fontSize: 12,
      padding: 64,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Left margin lines */}
      <div style={{ position: "absolute", left: 64, top: 64, bottom: 64, width: 1, background: red, opacity: 0.5, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      <div style={{ position: "absolute", left: 70, top: 64, bottom: 64, width: 1, background: red, opacity: 0.5, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />

      <div style={{ paddingLeft: 24 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.3em", color: red, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            ★ ★ ★ MEMORIAL CURRICULAR ★ ★ ★
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700, margin: "10px 0 4px", letterSpacing: "0.02em", textTransform: "uppercase" }}>
            {pd.firstName || "Nombre"} {pd.lastName || "Apellido"}
          </h1>
          {pd.jobTitle && (
            <div style={{ fontStyle: "italic", fontSize: 14, color: red }}>
              {pd.jobTitle}
            </div>
          )}
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.3em", marginTop: 6 }}>—— § ——</div>
        </div>

        {/* Summary */}
        {visible("summary") && summary && (
          <Section n="I." t={config.language === "en" ? "DE LA EXPOSICIÓN PRELIMINAR" : "DE LA EXPOSICIÓN PRELIMINAR"} red={red}>
            <p style={{ margin: 0, textAlign: "justify", textIndent: 24, lineHeight: 1.65 }}>{summary}</p>
          </Section>
        )}

        {/* Work Experience */}
        {visible("workExperience") && workExperience.length > 0 && (
          <Section n="II." t={label("workExperience").toUpperCase()} red={red}>
            {workExperience.map((job) => (
              <div key={job.id} style={{ marginBottom: 8 }}>
                <span style={{ fontStyle: "italic", color: red }}>
                  {job.startDate?.match(/\d{4}/)?.[0]}{job.currentlyWorking ? ` → ${present}` : job.endDate?.match(/\d{4}/)?.[0] ? ` — ${job.endDate.match(/\d{4}/)?.[0]}` : ""}
                </span>
                {" — "}
                <b>{job.employer}</b>
                {job.jobTitle && <> — <span>{job.jobTitle}{job.city ? ` · ${job.city}` : ""}</span></>}
                {job.description && (
                  <div className="resume-desc" style={{ fontSize: 11, marginTop: 4, paddingLeft: 16, lineHeight: 1.55 }}
                    dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Education */}
        {visible("education") && education.length > 0 && (
          <Section n="III." t={label("education").toUpperCase()} red={red}>
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
          </Section>
        )}

        {/* Certifications / Projects */}
        {visible("certifications") && certifications.length > 0 && (
          <Section n="IV." t={label("certifications").toUpperCase()} red={red}>
            <ol style={{ margin: 0, paddingLeft: 22, lineHeight: 1.7 }}>
              {certifications.map((cert) => (
                <li key={cert.id}>
                  {cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}{cert.date ? ` · ${cert.date}` : ""}
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Languages & Contact */}
        {(visible("languages") || pd.email || pd.phone) && (
          <Section n="V." t={config.language === "en" ? "LANGUAGES & CONTACT" : "IDIOMAS Y CONTACTO"} red={red}>
            <p style={{ margin: 0, lineHeight: 1.7 }}>
              {visible("languages") && languages.length > 0 && (
                <><b>{config.language === "en" ? "Languages" : "Idiomas"}:</b> {languages.map(l => `${l.name}${l.level ? ` (${l.level.toUpperCase()})` : ""}`).join(" · ")}<br /></>
              )}
              {(pd.city || pd.country) && <><b>{config.language === "en" ? "Address" : "Domicilio"}:</b> {[pd.city, pd.country].filter(Boolean).join(", ")}<br /></>}
              {pd.email && <><b>{config.language === "en" ? "Email" : "Correo"}:</b> {pd.email}{pd.phone ? <>&nbsp; · &nbsp;<b>{config.language === "en" ? "Phone" : "Teléfono"}:</b> {pd.phone}</> : ""}</>}
            </p>
          </Section>
        )}

        {/* Closing signature */}
        <div style={{ marginTop: 28, textAlign: "right" }}>
          <div style={{ fontStyle: "italic", fontSize: 12 }}>POR TANTO,</div>
          <div style={{ fontStyle: "italic", fontSize: 12, marginTop: 4 }}>
            Solicito a usted considerar el presente memorial como suficiente expresión de mis méritos profesionales.
          </div>
          <div style={{ fontFamily: "'Pinyon Script', cursive", fontSize: 36, marginTop: 18, color: red, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            {pd.firstName || "Firma"}
          </div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.18em", color: gold }}>
            FIRMADO · {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ n, t, red, children }: { n: string; t: string; red: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        <span style={{ color: red }}>{n}</span>&nbsp;&nbsp;{t}
      </h2>
      {children}
    </div>
  )
}
