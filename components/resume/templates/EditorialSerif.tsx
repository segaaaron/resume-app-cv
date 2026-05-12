"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function EditorialSerifTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const ink = "#2a221c"
  const cream = "#f5efe4"
  const rule = "#d9d0bf"
  const muted = "#6b5e4d"

  const now = new Date()
  const yearStr = now.getFullYear()
  const monthNames = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"]
  const monthStr = monthNames[now.getMonth()]

  // Drop cap: first letter of summary
  const summaryText = summary || ""
  const firstChar = summaryText[0] || ""
  const restSummary = summaryText.slice(1)

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: cream, color: ink,
      fontFamily: "'Inter', sans-serif", fontSize: 10.5, lineHeight: 1.6,
      padding: "56px 64px", display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Masthead */}
      <header style={{ borderBottom: `2px solid ${ink}`, paddingBottom: 16, marginBottom: 24 }}>

        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: 84,
          lineHeight: 0.9, margin: 0, letterSpacing: "-0.03em", fontStyle: "italic",
        }}>
          {pd.firstName || "Nombre"}<br />
          <span style={{ fontStyle: "normal" }}>{pd.lastName || "Apellido"}</span>
        </h1>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12 }}>
          {pd.jobTitle && (
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 18, color: accent }}>
              {pd.jobTitle}
            </div>
          )}
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, color: muted, textAlign: "right" }}>
            {pd.email && <div>{pd.email}</div>}
            {(pd.phone || pd.city) && <div>{[pd.phone, pd.city, pd.country].filter(Boolean).join(" · ")}</div>}
            {pd.website && <div>{pd.website}</div>}
            {pd.linkedin && <div>{pd.linkedin}</div>}
          </div>
        </div>
      </header>

      {/* Drop cap intro */}
      {visible("summary") && summaryText && (
        <section style={{ marginBottom: 28, columnCount: 2, columnGap: 28, columnRule: `1px solid ${rule}` }}>
          <p style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13.5, lineHeight: 1.55 }}>
            {firstChar && (
              <span style={{ float: "left", fontSize: 56, lineHeight: 0.8, paddingRight: 6, paddingTop: 4, fontWeight: 900, color: accent }}>{firstChar}</span>
            )}
            {restSummary}
          </p>
        </section>
      )}

      {/* Three-column body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28, flex: 1 }}>
        {/* Col 1: Experience */}
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 18, margin: "0 0 10px", color: accent, fontWeight: 700 }}>{label("workExperience")}</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {workExperience.map((job) => (
                  <li key={job.id} className="resume-entry" style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${rule}` }}>
                    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: accent, letterSpacing: "0.15em" }}>
                      {job.startDate}{job.currentlyWorking ? ` →` : job.endDate ? ` · ${job.endDate}` : ""}
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontWeight: 700, marginTop: 2 }}>{job.jobTitle}</div>
                    <div style={{ fontStyle: "italic", color: muted, fontSize: 10.5 }}>{job.employer}{job.city ? `, ${job.city}` : ""}</div>
                    {job.description && (
                      <div className="resume-desc" style={{ marginTop: 4, fontSize: 10 }} dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Col 2: Certifications / Projects */}
        <div>
          {visible("certifications") && certifications.length > 0 && (
            <>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 18, margin: "0 0 10px", color: accent, fontWeight: 700 }}>{label("certifications")}</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {certifications.map((cert) => (
                  <li key={cert.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${rule}` }}>
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontWeight: 700 }}>{cert.name}</div>
                    {cert.issuer && <div style={{ fontStyle: "italic", color: muted, fontSize: 10.5 }}>{cert.issuer}</div>}
                    {cert.date && <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: accent }}>{cert.date}</div>}
                  </li>
                ))}
              </ul>
            </>
          )}
          {visible("projects") && projects.length > 0 && (
            <>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 18, margin: "16px 0 10px", color: accent, fontWeight: 700 }}>{label("projects")}</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {projects.map((proj) => (
                  <li key={proj.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${rule}` }}>
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontWeight: 700 }}>{proj.name}</div>
                    {proj.role && <div style={{ fontStyle: "italic", color: muted, fontSize: 10.5 }}>{proj.role}</div>}
                    {proj.description && <div className="resume-desc" style={{ marginTop: 4, fontSize: 10 }} dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Col 3: Education + Languages */}
        <div>
          {visible("education") && education.length > 0 && (
            <>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 18, margin: "0 0 10px", color: accent, fontWeight: 700 }}>{label("education")}</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {education.map((edu) => (
                  <li key={edu.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${rule}` }}>
                    {edu.startDate && <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: accent, letterSpacing: "0.15em" }}>{edu.startDate}</div>}
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontWeight: 700, marginTop: 2 }}>{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}</div>
                    <div style={{ fontStyle: "italic", color: muted, fontSize: 10.5 }}>{edu.institution}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
          {visible("languages") && languages.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 18, margin: "0 0 10px", color: accent, fontWeight: 700 }}>{label("languages")}</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {languages.map((lang) => (
                  <li key={lang.id} style={{ fontSize: 10.5, paddingBottom: 4 }}>
                    <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>{lang.name}</span>
                    <span style={{ color: muted }}> · {lang.level.toUpperCase()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Footer skills strip */}
      <footer style={{ marginTop: 28, borderTop: `1px solid ${ink}`, paddingTop: 14, display: "flex", justifyContent: "space-between", fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.18em", color: muted, flexWrap: "wrap", gap: 8 }}>
        {skills.length > 0 ? (
          skills.map((sk, i) => (
            <span key={sk.id}>{i > 0 && <span style={{ marginRight: 8 }}>·</span>}{sk.name.toUpperCase()}</span>
          ))
        ) : (
          <span>{pd.jobTitle?.toUpperCase() || "CURRICULUM VITAE"}</span>
        )}
      </footer>
    </div>
  )
}
