"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function ZurichTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  let sectionCounter = 0

  const SectionBlock = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => {
    if (!visible(id)) return null
    sectionCounter++
    const num = String(sectionCounter).padStart(2, "0")
    return (
      <div style={{ position: "relative", marginBottom: 22 }}>
        {/* Large muted number behind section header */}
        <div style={{
          position: "absolute", top: -8, left: -4,
          fontSize: "52px", fontWeight: 900, color: "#d1d5db",
          lineHeight: 1, opacity: 0.35, userSelect: "none",
          letterSpacing: "-0.03em",
        }}>
          {num}
        </div>
        {/* Section header */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingTop: 6 }}>
          <h2 style={{
            fontWeight: 800, fontSize: "10px", letterSpacing: "0.16em",
            textTransform: "uppercase", color: "#1f2937",
          }}>
            {title}
          </h2>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
        </div>
        <div style={{ position: "relative" }}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff", padding: "36px 44px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontWeight: 800, fontSize: "28px", color: "#111827",
          letterSpacing: "0.02em", lineHeight: 1.1, marginBottom: 4,
        }}>
          {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
        </h1>
        {pd.jobTitle && (
          <p style={{ fontSize: "11px", color: accent, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 12 }}>
            {pd.jobTitle}
          </p>
        )}
        {/* Contact row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
          {pd.email    && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Mail size={9} color={accent} />{pd.email}</span>}
          {pd.phone    && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Phone size={9} color={accent} />{pd.phone}</span>}
          {(pd.city || pd.country) && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><MapPin size={9} color={accent} />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
          {pd.website  && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Globe size={9} color={accent} />{pd.website}</span>}
          {pd.linkedin && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Link2 size={9} color={accent} />{pd.linkedin}</span>}
          {pd.github   && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><GitFork size={9} color={accent} />{pd.github}</span>}
        </div>
        {/* Thin accent rule */}
        <div style={{ height: "2px", backgroundColor: accent, marginTop: 16, width: "80px" }} />
      </div>

      {/* Summary */}
      {visible("summary") && summary && (
        <SectionBlock id="summary" title={label("summary")}>
          <p style={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.7 }}>{summary}</p>
        </SectionBlock>
      )}

      {/* Work Experience */}
      {visible("workExperience") && workExperience.length > 0 && (
        <SectionBlock id="workExperience" title={label("workExperience")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {workExperience.map((job) => (
              <div key={job.id} className="resume-entry">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                  <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>{job.jobTitle}</p>
                  <span style={{ fontSize: "9px", color: "#9ca3af" }}>
                    {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                  </span>
                </div>
                <p style={{ fontSize: "9.5px", color: accent, fontWeight: 600, marginBottom: 5 }}>
                  {job.employer}{job.city ? `, ${job.city}` : ""}
                </p>
                {job.description && (
                  <div className="resume-desc" style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }}
                    dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                )}
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* Education */}
      {visible("education") && education.length > 0 && (
        <SectionBlock id="education" title={label("education")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {education.map((edu) => (
              <div key={edu.id} className="resume-entry">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>
                    {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                  </p>
                  <span style={{ fontSize: "9px", color: "#9ca3af" }}>
                    {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                  </span>
                </div>
                <p style={{ fontSize: "9.5px", color: accent, fontWeight: 600 }}>
                  {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                </p>
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* Skills */}
      {visible("skills") && skills.length > 0 && (
        <SectionBlock id="skills" title={label("skills")}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px" }}>
            {skills.map((sk) => (
              <span key={sk.id} style={{
                fontSize: "9px", color: "#374151",
                border: `1px solid ${accent}`, borderRadius: 2,
                padding: "3px 8px",
              }}>
                {sk.name}
              </span>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* Languages */}
      {visible("languages") && languages.length > 0 && (
        <SectionBlock id="languages" title={label("languages")}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
            {languages.map((lang) => (
              <div key={lang.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "9.5px", color: "#374151", fontWeight: 600 }}>{lang.name}</span>
                <span style={{ fontSize: "8.5px", color: accent }}>{lang.level.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* Certifications */}
      {visible("certifications") && certifications.length > 0 && (
        <SectionBlock id="certifications" title={label("certifications")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {certifications.map((cert) => (
              <div key={cert.id} className="resume-entry" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 5, height: 5, backgroundColor: accent, marginTop: 3, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: "10px", color: "#111827" }}>{cert.name}</p>
                  {(cert.issuer || cert.date) && <p style={{ fontSize: "9px", color: "#6b7280" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
                </div>
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* Projects */}
      {visible("projects") && projects.length > 0 && (
        <SectionBlock id="projects" title={label("projects")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {projects.map((proj) => (
              <div key={proj.id} className="resume-entry">
                <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827", marginBottom: 2 }}>{proj.name}</p>
                {proj.role && <p style={{ fontSize: "9.5px", color: accent, fontWeight: 600, marginBottom: 3 }}>{proj.role}</p>}
                {proj.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }}>{proj.description}</p>}
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* Volunteer */}
      {visible("volunteer") && volunteer.length > 0 && (
        <SectionBlock id="volunteer" title={label("volunteer")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {volunteer.map((vol) => (
              <div key={vol.id} className="resume-entry">
                <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>{vol.role}</p>
                <p style={{ fontSize: "9.5px", color: accent, fontWeight: 600 }}>{vol.organization}</p>
                {vol.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65, marginTop: 3 }}>{vol.description}</p>}
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* References */}
      {visible("references") && references.length > 0 && (
        <SectionBlock id="references" title={label("references")}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {references.map((ref) => (
              <div key={ref.id} style={{ minWidth: 140 }}>
                <p style={{ fontWeight: 600, fontSize: "10px", color: "#111827" }}>{ref.name}</p>
                {ref.company && <p style={{ fontSize: "9px", color: accent }}>{ref.company}</p>}
                {ref.phone && <p style={{ fontSize: "9px", color: "#6b7280" }}>{ref.phone}</p>}
                {ref.email && <p style={{ fontSize: "9px", color: "#6b7280" }}>{ref.email}</p>}
              </div>
            ))}
          </div>
        </SectionBlock>
      )}
    </div>
  )
}
