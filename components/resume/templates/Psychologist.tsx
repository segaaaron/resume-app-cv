"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function PsychologistTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present

  const cream = "#f6f0e6"
  const ink = "#2b2218"
  const olive = designAccent(config.colorScheme, "#6f7a4a")
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
  const terracotta = "#c97a55"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: cream,
      color: ink,
      fontFamily: "'Lora', serif",
      fontSize: 12,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Split header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: 280 }}>
        {/* Left — olive, name */}
        <div style={{
          background: olive,
          color: cream,
          padding: 36,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", marginBottom: 12, border: `2px solid ${cream}`, backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: cream, fontWeight: 800, fontSize: 24 }}>
            {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : (initials || "N")}
          </div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.25em" }}>★ CURRÍCULUM</div>
          <h1 style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 46, lineHeight: 1, margin: "12px 0 6px", fontWeight: 500 }}>
            {pd.firstName || "Nombre"}<br />{pd.lastName || "Apellido"}
          </h1>
          {pd.jobTitle && (
            <div style={{ fontSize: 14 }}>{pd.jobTitle}</div>
          )}
        </div>

        {/* Right — terracotta, quote/summary */}
        <div style={{
          background: terracotta,
          padding: 36,
          color: cream,
          position: "relative",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}>
          {summary && visible("summary") && (
            <div style={{ position: "absolute", top: 36, right: 36, fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: 15, lineHeight: 1.45, textAlign: "right", maxWidth: 220 }}>
              <span style={{ fontSize: 60, lineHeight: 0, position: "relative", top: 18 }}>{'"'}</span>
              <p style={{ margin: "10px 0 0" }}>{summary}</p>
            </div>
          )}
          <div style={{ position: "absolute", bottom: 36, right: 36, fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.2em" }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && <div>{pd.phone}</div>}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main style={{ padding: "30px 40px", display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 28, flex: 1 }}>
        {/* Left column */}
        <section>
          {/* Work Experience */}
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H olive={olive}><SectionIcon sectionId="workExperience" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("workExperience")}</H>
              {workExperience.map((job) => (
                <div key={job.id} style={{ display: "grid", gridTemplateColumns: "84px 1fr", padding: "9px 0", borderBottom: `1px dotted ${olive}`, gap: 12 }}>
                  <div style={{ fontStyle: "italic", color: terracotta, fontSize: 11.5 }}>
                    {job.startDate?.match(/\d{4}/)?.[0]}{job.currentlyWorking ? ` → ${present}` : job.endDate?.match(/\d{4}/)?.[0] ? `—${job.endDate.match(/\d{4}/)?.[0]}` : ""}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{job.employer}</div>
                    <div style={{ fontSize: 11 }}>{job.jobTitle}{job.city ? ` · ${job.city}` : ""}</div>
                    {job.description && (
                      <div className="resume-desc" style={{ fontSize: 11, marginTop: 4, lineHeight: 1.55 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Skills */}
          {visible("skills") && skills.length > 0 && (
            <>
              <H olive={olive}><SectionIcon sectionId="skills" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("skills")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85 }}>
                {skills.map((sk) => (
                  <li key={sk.id}>{sk.name}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Right column */}
        <section>
          {/* Education */}
          {visible("education") && education.length > 0 && (
            <>
              <H olive={olive}><SectionIcon sectionId="education" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("education")}</H>
              <p style={{ margin: 0, lineHeight: 1.7 }}>
                {education.map((edu, i) => (
                  <span key={edu.id}>
                    {i > 0 && <br />}
                    <b>{edu.endDate?.match(/\d{4}/)?.[0] || edu.startDate?.match(/\d{4}/)?.[0]}</b>
                    {" · "}
                    {edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}
                    {edu.institution ? ` · ${edu.institution}` : ""}
                  </span>
                ))}
              </p>
            </>
          )}

          {/* Certifications */}
          {visible("certifications") && certifications.length > 0 && (
            <>
              <H olive={olive}><SectionIcon sectionId="certifications" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("certifications")}</H>
              <p style={{ margin: 0, lineHeight: 1.7 }}>
                {certifications.map((cert, i) => (
                  <span key={cert.id}>
                    {i > 0 && <br />}
                    {cert.date?.match(/\d{4}/)?.[0] ? <b>{cert.date.match(/\d{4}/)?.[0]}</b> : ""}
                    {cert.date?.match(/\d{4}/)?.[0] ? " · " : ""}
                    {cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}
                  </span>
                ))}
              </p>
            </>
          )}

          {/* Languages */}
          {visible("languages") && languages.length > 0 && (
            <>
              <H olive={olive}><SectionIcon sectionId="languages" size={12} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{label("languages")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85 }}>
                {languages.map((lang) => (
                  <li key={lang.id}>{lang.name}{lang.level ? ` · ${lang.level.toUpperCase()}` : ""}</li>
                ))}
              </ul>
            </>
          )}

          {/* Contact */}
          <H olive={olive}>{L.contact}</H>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, lineHeight: 1.85 }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && <div>{pd.phone}</div>}
            {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(" · ")}</div>}
            {pd.linkedin && <div>{pd.linkedin}</div>}
            {pd.website && <div>{pd.website}</div>}
          </div>
        </section>
      </main>
    </div>
  )
}

function H({ olive, children }: { olive: string; children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "'Lora', serif",
      fontStyle: "italic",
      fontSize: 22,
      color: olive,
      margin: "16px 0 8px",
      fontWeight: 600,
    }}>
      {children}
    </h2>
  )
}
