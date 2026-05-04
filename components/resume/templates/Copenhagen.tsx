"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

// Alternating tinted section backgrounds
const SECTION_TINTS = ["#EFF6FF", "#F0FDF4", "#FFF7ED", "#FDF4FF", "#EFF6FF", "#F0FDF4", "#FFF7ED"]
const SECTION_BORDER_COLORS = ["#bfdbfe", "#bbf7d0", "#fed7aa", "#e9d5ff", "#bfdbfe", "#bbf7d0", "#fed7aa"]

export default function CopenhagenTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  let sectionIndex = 0

  const SectionBlock = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => {
    if (!visible(id)) return null
    const tint = SECTION_TINTS[sectionIndex % SECTION_TINTS.length]
    const border = SECTION_BORDER_COLORS[sectionIndex % SECTION_BORDER_COLORS.length]
    sectionIndex++
    return (
      <div style={{
        backgroundColor: tint, borderRadius: 10,
        border: `1px solid ${border}`,
        padding: "16px 20px", marginBottom: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <h2 style={{
            fontWeight: 700, fontSize: "9.5px", letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#374151",
          }}>
            {title}
          </h2>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff", padding: "28px 32px" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        {/* Photo with rounded-rect frame */}
        {config.photoUrl && (
          <div style={{
            width: 80, height: 80, borderRadius: 12,
            overflow: "hidden", float: "right",
            border: `2px solid #e5e7eb`, marginLeft: 16,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%` }} />
          </div>
        )}
        <h1 style={{
          fontWeight: 700, fontSize: "26px", color: "#111827",
          lineHeight: 1.1, marginBottom: 4,
        }}>
          {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
        </h1>
        {pd.jobTitle && (
          <p style={{ fontSize: "10.5px", color: accent, fontWeight: 600, letterSpacing: "0.04em", marginBottom: 10 }}>
            {pd.jobTitle}
          </p>
        )}
        {/* Contact row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 14px" }}>
          {pd.email    && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Mail size={8} color={accent} />{pd.email}</span>}
          {pd.phone    && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Phone size={8} color={accent} />{pd.phone}</span>}
          {(pd.city || pd.country) && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><MapPin size={8} color={accent} />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
          {pd.website  && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Globe size={8} color={accent} />{pd.website}</span>}
          {pd.linkedin && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Link2 size={8} color={accent} />{pd.linkedin}</span>}
          {pd.github   && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><GitFork size={8} color={accent} />{pd.github}</span>}
        </div>
        <div style={{ clear: "both" }} />
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
                  <span style={{ fontSize: "8.5px", color: "#9ca3af" }}>
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
                  <span style={{ fontSize: "8.5px", color: "#9ca3af" }}>
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
                border: `1px solid #d1d5db`, borderRadius: 4,
                padding: "3px 8px", backgroundColor: "rgba(255,255,255,0.6)",
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
              <span key={lang.id} style={{ fontSize: "9px", color: "#374151" }}>
                {lang.name} <span style={{ color: accent }}>·</span> <span style={{ color: "#9ca3af" }}>{lang.level.toUpperCase()}</span>
              </span>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* Certifications */}
      {visible("certifications") && certifications.length > 0 && (
        <SectionBlock id="certifications" title={label("certifications")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {certifications.map((cert) => (
              <div key={cert.id} className="resume-entry">
                <p style={{ fontWeight: 600, fontSize: "10px", color: "#111827" }}>{cert.name}</p>
                {(cert.issuer || cert.date) && <p style={{ fontSize: "9px", color: "#6b7280" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
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
                {proj.description && <p className="resume-desc" style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />}
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
                {vol.description && <p className="resume-desc" style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65, marginTop: 3 }} dangerouslySetInnerHTML={{ __html: fmtDesc(vol.description) }} />}
              </div>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* References */}
      {visible("references") && references.length > 0 && (
        <SectionBlock id="references" title={label("references")}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
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
