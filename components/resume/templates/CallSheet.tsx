"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"

export default function CallSheetTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const paper = "#f9f6ec"
  const ink = "#0c0c0c"
  const red = config.colorScheme || "#b21e1e"
  const yellow = "#f4c430"

  const today = new Date()
  const dateStr = `${String(today.getMonth() + 1).padStart(2, "0")} · ${String(today.getDate()).padStart(2, "0")} · ${today.getFullYear()}`

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: paper,
      color: ink,
      fontFamily: "'Inter', sans-serif",
      fontSize: 10,
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Top banner */}
      <div style={{
        background: yellow,
        color: ink,
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
        fontFamily: "ui-monospace, monospace",
        fontSize: 10,
        letterSpacing: "0.25em",
        fontWeight: 800,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>
        <span>{config.language === "en" ? "CALL SHEET · DAY 01 OF CAREER" : "HOJA DE LLAMADO · DÍA 01 DE CARRERA"}</span>
        <span>★ CONFIDENTIAL ★</span>
        <span>{dateStr}</span>
      </div>

      {/* Header */}
      <header style={{ padding: "24px 30px", borderBottom: `2px solid ${ink}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            {pd.jobTitle && (
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.3em", color: red }}>
                {config.language === "en" ? "PRODUCTION" : "PRODUCCIÓN"} · "{pd.jobTitle.toUpperCase()}"
              </div>
            )}
            <h1 style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontSize: 42, fontWeight: 900, margin: "4px 0 0", letterSpacing: "-0.025em" }}>
              {pd.firstName || "First"} {pd.lastName || "Last"}
            </h1>
            {pd.jobTitle && (
              <div style={{ fontSize: 13, fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 600 }}>{pd.jobTitle}</div>
            )}
          </div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, lineHeight: 1.7, textAlign: "right" }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && <div>{pd.phone}</div>}
            {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(" · ")}</div>}
            {pd.linkedin && <div>{pd.linkedin}</div>}
          </div>
        </div>
      </header>

      {/* Body */}
      <div style={{ padding: "20px 30px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Work experience table */}
        {visible("workExperience") && workExperience.length > 0 && (
          <Block title={`01 · ${config.language === "en" ? "CAST & CREW" : "REPARTO"} · ${label("workExperience").toUpperCase()}`} ink={ink} yellow={yellow}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
              <thead>
                <tr style={{ background: ink, color: paper, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  {[config.language === "en" ? "YR" : "AÑO", config.language === "en" ? "ROLE" : "ROL", config.language === "en" ? "COMPANY" : "EMPRESA", config.language === "en" ? "LOCATION" : "LUGAR"].map((h) => (
                    <th key={h} style={{ padding: "5px 8px", textAlign: "left", fontSize: 9, letterSpacing: "0.18em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workExperience.map((job, i) => (
                  <>
                    <tr key={job.id} style={{ background: i % 2 ? "#f3eee0" : paper, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                      <td style={{ padding: "5px 8px", borderRight: "1px solid #ddd" }}>
                        {job.startDate?.match(/\d{4}/)?.[0] || ""}
                        {job.currentlyWorking ? `—${present}` : job.endDate?.match(/\d{4}/)?.[0] ? `—${job.endDate.match(/\d{4}/)?.[0]}` : ""}
                      </td>
                      <td style={{ padding: "5px 8px", borderRight: "1px solid #ddd" }}>{job.jobTitle}</td>
                      <td style={{ padding: "5px 8px", borderRight: "1px solid #ddd", fontWeight: 700 }}>{job.employer}</td>
                      <td style={{ padding: "5px 8px" }}>{job.city}</td>
                    </tr>
                    {job.description && (
                      <tr key={`${job.id}-desc`} style={{ background: i % 2 ? "#f3eee0" : paper, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                        <td colSpan={4} style={{ padding: "2px 8px 8px 8px", borderBottom: "1px solid #ddd" }}>
                          <div className="resume-desc" style={{ fontSize: 10, color: "#444", lineHeight: 1.55 }}
                            dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </Block>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Education */}
          {visible("education") && education.length > 0 && (
            <Block title={`02 · ${config.language === "en" ? "LOCATIONS" : "LOCACIONES"} · ${label("education").toUpperCase()}`} ink={ink} yellow={yellow}>
              <div style={{ fontSize: 11, lineHeight: 1.7 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    {edu.endDate?.match(/\d{4}/)?.[0] && <b>{edu.endDate.match(/\d{4}/)?.[0]} · </b>}
                    {edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}
                    {edu.institution ? ` · ${edu.institution}` : ""}
                  </div>
                ))}
              </div>
            </Block>
          )}

          {/* Certifications or Projects */}
          {visible("certifications") && certifications.length > 0 ? (
            <Block title={`03 · ${label("certifications").toUpperCase()}`} ink={ink} yellow={yellow}>
              <div style={{ fontSize: 11, lineHeight: 1.7 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    {cert.date?.match(/\d{4}/)?.[0] ? `${cert.date.match(/\d{4}/)?.[0]} · ` : ""}
                    {cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}
                  </div>
                ))}
              </div>
            </Block>
          ) : visible("projects") && projects && projects.length > 0 ? (
            <Block title={`03 · ${label("projects").toUpperCase()}`} ink={ink} yellow={yellow}>
              <div style={{ fontSize: 11, lineHeight: 1.7 }}>
                {projects.map((proj) => (
                  <div key={proj.id}>
                    {proj.startDate?.match(/\d{4}/)?.[0] ? `${proj.startDate.match(/\d{4}/)?.[0]} · ` : ""}
                    <b>{proj.name}</b>
                  </div>
                ))}
              </div>
            </Block>
          ) : null}
        </div>

        {/* Skills + Languages */}
        <Block title={`04 · ${label("skills").toUpperCase()} · ${label("languages").toUpperCase()}`} ink={ink} yellow={yellow}>
          <div style={{ display: "flex", gap: 28, fontSize: 11, lineHeight: 1.65 }}>
            {visible("skills") && skills.length > 0 && (
              <div style={{ flex: 1 }}>
                <b style={{ color: red }}>{label("skills").toUpperCase()}</b>
                {" · "}
                {skills.map((sk, i) => (
                  <span key={sk.id}>{i > 0 ? " · " : ""}{sk.name}</span>
                ))}
              </div>
            )}
            {visible("languages") && languages.length > 0 && (
              <div style={{ flex: 1 }}>
                <b style={{ color: red }}>{label("languages").toUpperCase()}</b>
                {" · "}
                {languages.map((lang, i) => (
                  <span key={lang.id}>{i > 0 ? " · " : ""}{lang.name} {lang.level.toUpperCase()}</span>
                ))}
              </div>
            )}
            {summary && (
              <div style={{ flex: 2 }}>
                <b style={{ color: red }}>{config.language === "en" ? "BIO" : "BIO"}</b>
                {" · "}
                {summary}
              </div>
            )}
          </div>
        </Block>
      </div>

      {/* Footer */}
      <footer style={{
        background: ink,
        color: yellow,
        padding: "10px 30px",
        display: "flex",
        justifyContent: "space-between",
        fontFamily: "ui-monospace, monospace",
        fontSize: 9,
        letterSpacing: "0.3em",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>
        <span>★ ROLL TAPE</span>
        <span>{config.language === "en" ? "SAFETY MEETING 06:30" : "REUNIÓN 06:30"}</span>
        <span>WRAP TBD</span>
      </footer>
    </div>
  )
}

function Block({ title, children, ink, yellow }: { title: string; children: React.ReactNode; ink: string; yellow: string }) {
  return (
    <div style={{ border: `1.5px solid ${ink}`, background: "#fff" }}>
      <div style={{
        background: ink,
        color: yellow,
        padding: "5px 12px",
        fontFamily: "ui-monospace, monospace",
        fontSize: 9,
        letterSpacing: "0.25em",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>{title}</div>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  )
}
