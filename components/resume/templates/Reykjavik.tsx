"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function ReykjavikTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const labelColor = "#9ca3af"

  // Section wrapper — rotated label in 18% left margin + 82% content
  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => {
    if (!visible(id)) return null
    return (
      <div style={{ display: "flex", gap: 0, marginBottom: 22, position: "relative", minHeight: 40 }}>
        {/* Rotated label column — 18% */}
        <div style={{ width: "18%", flexShrink: 0, position: "relative" }}>
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%) rotate(-90deg)",
            whiteSpace: "nowrap",
            fontSize: "8px", fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: labelColor,
          }}>
            {title}
          </div>
        </div>
        {/* Thin vertical separator */}
        <div style={{ width: "1px", backgroundColor: "#e5e7eb", flexShrink: 0, marginRight: 24 }} />
        {/* Content 82% */}
        <div style={{ flex: 1, paddingTop: 2 }}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff", padding: "32px 32px 32px 0" }}>
      {/* Header — uses the left 18% for label + 82% for content pattern */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
        <div style={{ width: "18%", flexShrink: 0 }} />
        <div style={{ width: "1px", backgroundColor: accent, flexShrink: 0, marginRight: 24 }} />
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontWeight: 700, fontSize: "26px", color: "#111827",
            lineHeight: 1.1, marginBottom: 4,
          }}>
            {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
          </h1>
          {pd.jobTitle && (
            <p style={{ fontSize: "10.5px", color: "#6b7280", marginBottom: 10, letterSpacing: "0.04em" }}>
              {pd.jobTitle}
            </p>
          )}
          {/* Contact row inline with icons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 14px" }}>
            {pd.email    && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Mail size={8} color={accent} />{pd.email}</span>}
            {pd.phone    && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Phone size={8} color={accent} />{pd.phone}</span>}
            {(pd.city || pd.country) && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><MapPin size={8} color={accent} />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
            {pd.website  && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Globe size={8} color={accent} />{pd.website}</span>}
            {pd.linkedin && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Link2 size={8} color={accent} />{pd.linkedin}</span>}
            {pd.github   && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><GitFork size={8} color={accent} />{pd.github}</span>}
          </div>
        </div>
      </div>

      {/* Summary */}
      {visible("summary") && summary && (
        <Section id="summary" title={label("summary")}>
          <p style={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.7 }}>{summary}</p>
        </Section>
      )}

      {/* Work Experience */}
      {visible("workExperience") && workExperience.length > 0 && (
        <Section id="workExperience" title={label("workExperience")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {workExperience.map((job) => (
              <div key={job.id} className="resume-entry">
                {/* Inline small icon for each entry */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <svg width="7" height="7" viewBox="0 0 7 7" aria-hidden="true">
                      <circle cx="3.5" cy="3.5" r="3" fill={accent} opacity="0.6" />
                    </svg>
                    <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>{job.jobTitle}</p>
                  </div>
                  <span style={{ fontSize: "8.5px", color: "#9ca3af" }}>
                    {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                  </span>
                </div>
                <p style={{ fontSize: "9.5px", color: accent, fontWeight: 600, marginBottom: 5, paddingLeft: 13 }}>
                  {job.employer}{job.city ? `, ${job.city}` : ""}
                </p>
                {job.description && (
                  <div className="resume-desc" style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65, paddingLeft: 13 }}
                    dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {visible("education") && education.length > 0 && (
        <Section id="education" title={label("education")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {education.map((edu) => (
              <div key={edu.id} className="resume-entry">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <svg width="7" height="7" viewBox="0 0 7 7" aria-hidden="true">
                      <rect x="0.5" y="0.5" width="6" height="6" fill={accent} opacity="0.6" />
                    </svg>
                    <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>
                      {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                    </p>
                  </div>
                  <span style={{ fontSize: "8.5px", color: "#9ca3af" }}>
                    {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                  </span>
                </div>
                <p style={{ fontSize: "9.5px", color: accent, fontWeight: 600, paddingLeft: 13 }}>
                  {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {visible("skills") && skills.length > 0 && (
        <Section id="skills" title={label("skills")}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px" }}>
            {skills.map((sk) => (
              <span key={sk.id} style={{
                fontSize: "9px", color: "#374151",
                border: `1px solid #e5e7eb`, borderRadius: 3,
                padding: "3px 8px",
              }}>
                {sk.name}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Languages */}
      {visible("languages") && languages.length > 0 && (
        <Section id="languages" title={label("languages")}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
            {languages.map((lang) => (
              <div key={lang.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="7" height="7" viewBox="0 0 7 7" aria-hidden="true">
                  <polygon points="3.5,0.5 6.5,3.5 3.5,6.5 0.5,3.5" fill={accent} opacity="0.6" />
                </svg>
                <span style={{ fontSize: "9px", color: "#374151", fontWeight: 600 }}>{lang.name}</span>
                <span style={{ fontSize: "8px", color: "#9ca3af" }}>{lang.level.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {visible("certifications") && certifications.length > 0 && (
        <Section id="certifications" title={label("certifications")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {certifications.map((cert) => (
              <div key={cert.id} className="resume-entry">
                <p style={{ fontWeight: 600, fontSize: "10px", color: "#111827" }}>{cert.name}</p>
                {(cert.issuer || cert.date) && <p style={{ fontSize: "9px", color: "#6b7280" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Projects */}
      {visible("projects") && projects.length > 0 && (
        <Section id="projects" title={label("projects")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {projects.map((proj) => (
              <div key={proj.id} className="resume-entry">
                <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827", marginBottom: 2 }}>{proj.name}</p>
                {proj.role && <p style={{ fontSize: "9.5px", color: accent, fontWeight: 600, marginBottom: 3 }}>{proj.role}</p>}
                {proj.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }}>{proj.description}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Volunteer */}
      {visible("volunteer") && volunteer.length > 0 && (
        <Section id="volunteer" title={label("volunteer")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {volunteer.map((vol) => (
              <div key={vol.id} className="resume-entry">
                <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>{vol.role}</p>
                <p style={{ fontSize: "9.5px", color: accent, fontWeight: 600 }}>{vol.organization}</p>
                {vol.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65, marginTop: 3 }}>{vol.description}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* References */}
      {visible("references") && references.length > 0 && (
        <Section id="references" title={label("references")}>
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
        </Section>
      )}
    </div>
  )
}
