"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function BarcelonaTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  // Bold filled rounded-square iOS-style icons in accent
  const WorkIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="0" y="0" width="14" height="14" rx="3.5" fill={accent} />
      <rect x="2" y="5" width="10" height="7" rx="1" fill="white" opacity="0.9" />
      <path d="M4,5 V3.5 Q4,2.5 7,2.5 Q10,2.5 10,3.5 V5" fill="white" opacity="0.7" />
    </svg>
  )
  const EduIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="0" y="0" width="14" height="14" rx="3.5" fill={accent} />
      <polygon points="7,2 12,5 7,8 2,5" fill="white" opacity="0.9" />
      <path d="M4,6.5 V10" stroke="white" strokeWidth="1.5" opacity="0.8" strokeLinecap="round" />
      <path d="M10,6.5 V10" stroke="white" strokeWidth="1.5" opacity="0.8" strokeLinecap="round" />
      <path d="M4,10 Q7,11.5 10,10" fill="none" stroke="white" strokeWidth="1.5" opacity="0.8" strokeLinecap="round" />
    </svg>
  )
  const SkillIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="0" y="0" width="14" height="14" rx="3.5" fill={accent} />
      <polygon points="7,2 8.4,5.5 12,5.5 9.5,8 10.5,11.5 7,9.5 3.5,11.5 4.5,8 2,5.5 5.6,5.5" fill="white" opacity="0.9" />
    </svg>
  )
  const LangIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="0" y="0" width="14" height="14" rx="3.5" fill={accent} />
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="white" strokeWidth="1.2" opacity="0.9" />
      <ellipse cx="7" cy="7" rx="2" ry="4.5" fill="none" stroke="white" strokeWidth="1" opacity="0.8" />
      <line x1="2.5" y1="7" x2="11.5" y2="7" stroke="white" strokeWidth="1" opacity="0.8" />
    </svg>
  )
  const CertIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="0" y="0" width="14" height="14" rx="3.5" fill={accent} />
      <circle cx="7" cy="5.5" r="3" fill="white" opacity="0.9" />
      <path d="M4.5,8.5 L3.5,12 L7,10.5 L10.5,12 L9.5,8.5" fill="white" opacity="0.7" />
    </svg>
  )
  const ProjIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="0" y="0" width="14" height="14" rx="3.5" fill={accent} />
      <path d="M2,5 Q2,3.5 3.5,3.5 L5.5,3.5 L6.5,5 L11,5 Q12,5 12,6 L12,11 Q12,12 11,12 L3,12 Q2,12 2,11 Z" fill="white" opacity="0.9" />
    </svg>
  )
  const SummaryIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="0" y="0" width="14" height="14" rx="3.5" fill={accent} />
      <rect x="3" y="4" width="8" height="1.2" rx="0.6" fill="white" opacity="0.9" />
      <rect x="3" y="6.5" width="8" height="1.2" rx="0.6" fill="white" opacity="0.7" />
      <rect x="3" y="9" width="5" height="1.2" rx="0.6" fill="white" opacity="0.6" />
    </svg>
  )

  const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      {icon}
      <h2 style={{ fontWeight: 800, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#111827" }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: "1.5px", backgroundColor: "#f3f4f6" }} />
    </div>
  )

  return (
    <div style={{ display: "flex", minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>
      {/* LEFT MAIN */}
      <div style={{ flex: 1, padding: "32px 28px", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <h1 style={{
            fontWeight: 900, fontSize: "28px", color: "#111827",
            lineHeight: 1.05, marginBottom: 4, letterSpacing: "-0.01em",
          }}>
            {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
          </h1>
          {pd.jobTitle && (
            <p style={{ fontSize: "11px", color: accent, fontWeight: 700, marginBottom: 8, letterSpacing: "0.04em" }}>
              {pd.jobTitle}
            </p>
          )}
          {/* Contact row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 16px" }}>
            {pd.email    && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}><Mail size={8} color={accent} />{pd.email}</span>}
            {pd.phone    && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}><Phone size={8} color={accent} />{pd.phone}</span>}
            {(pd.city || pd.country) && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={8} color={accent} />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
            {pd.website  && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}><Globe size={8} color={accent} />{pd.website}</span>}
            {pd.linkedin && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}><Link2 size={8} color={accent} />{pd.linkedin}</span>}
            {pd.github   && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}><GitFork size={8} color={accent} />{pd.github}</span>}
          </div>
          <div style={{ height: "2px", backgroundColor: accent, marginTop: 10, borderRadius: 1 }} />
        </div>

        {/* Summary */}
        {visible("summary") && summary && (
          <div style={{ marginBottom: 18 }}>
            <SectionHeader title={label("summary")} icon={<SummaryIcon />} />
            <p style={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.7 }}>{summary}</p>
          </div>
        )}

        {/* Work Experience */}
        {visible("workExperience") && workExperience.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionHeader title={label("workExperience")} icon={<WorkIcon />} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                    <p style={{ fontWeight: 800, fontSize: "10.5px", color: "#111827" }}>{job.jobTitle}</p>
                    <span style={{ fontSize: "8.5px", color: "#9ca3af" }}>
                      {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: "9.5px", color: accent, fontWeight: 700, marginBottom: 5 }}>
                    {job.employer}{job.city ? `, ${job.city}` : ""}
                  </p>
                  {job.description && (
                    <div className="resume-desc" style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {visible("education") && education.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionHeader title={label("education")} icon={<EduIcon />} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {education.map((edu) => (
                <div key={edu.id} className="resume-entry">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ fontWeight: 800, fontSize: "10.5px", color: "#111827" }}>
                      {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                    </p>
                    <span style={{ fontSize: "8.5px", color: "#9ca3af" }}>
                      {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: "9.5px", color: accent, fontWeight: 700 }}>
                    {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {visible("projects") && projects.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionHeader title={label("projects")} icon={<ProjIcon />} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map((proj) => (
                <div key={proj.id} className="resume-entry">
                  <p style={{ fontWeight: 800, fontSize: "10.5px", color: "#111827", marginBottom: 2 }}>{proj.name}</p>
                  {proj.role && <p style={{ fontSize: "9.5px", color: accent, fontWeight: 700, marginBottom: 3 }}>{proj.role}</p>}
                  {proj.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }}>{proj.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Volunteer */}
        {visible("volunteer") && volunteer.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionHeader title={label("volunteer")} icon={<SummaryIcon />} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {volunteer.map((vol) => (
                <div key={vol.id} className="resume-entry">
                  <p style={{ fontWeight: 800, fontSize: "10.5px", color: "#111827" }}>{vol.role}</p>
                  <p style={{ fontSize: "9.5px", color: accent, fontWeight: 700 }}>{vol.organization}</p>
                  {vol.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65, marginTop: 3 }}>{vol.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* References */}
        {visible("references") && references.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionHeader title={label("references")} icon={<SummaryIcon />} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              {references.map((ref) => (
                <div key={ref.id} style={{ minWidth: 140 }}>
                  <p style={{ fontWeight: 700, fontSize: "10px", color: "#111827" }}>{ref.name}</p>
                  {ref.company && <p style={{ fontSize: "9px", color: accent }}>{ref.company}</p>}
                  {ref.phone && <p style={{ fontSize: "9px", color: "#6b7280" }}>{ref.phone}</p>}
                  {ref.email && <p style={{ fontSize: "9px", color: "#6b7280" }}>{ref.email}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR */}
      <div style={{
        width: "32%", flexShrink: 0,
        backgroundColor: "#f9fafb",
        padding: "32px 18px",
        borderLeft: "1px solid #e5e7eb",
        display: "flex", flexDirection: "column", gap: 18,
      }}>
        {/* Skills as chip grid */}
        {visible("skills") && skills.length > 0 && (
          <div>
            <SectionHeader title={label("skills")} icon={<SkillIcon />} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {skills.map((sk) => (
                <span key={sk.id} style={{
                  fontSize: "8.5px", color: accent,
                  border: `1px solid ${accent}`,
                  borderRadius: "999px",
                  padding: "3px 9px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}>
                  {sk.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {visible("languages") && languages.length > 0 && (
          <div>
            <SectionHeader title={label("languages")} icon={<LangIcon />} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {languages.map((lang) => (
                <div key={lang.id} style={{
                  border: `1px solid ${accent}`,
                  borderRadius: "999px",
                  padding: "3px 9px",
                  fontSize: "8.5px", color: "#374151",
                }}>
                  <span style={{ fontWeight: 600 }}>{lang.name}</span>
                  <span style={{ color: accent, marginLeft: 4 }}>{lang.level.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {visible("certifications") && certifications.length > 0 && (
          <div>
            <SectionHeader title={label("certifications")} icon={<CertIcon />} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p style={{ fontSize: "9px", fontWeight: 700, color: "#111827" }}>{cert.name}</p>
                  {(cert.issuer || cert.date) && <p style={{ fontSize: "8px", color: "#6b7280" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
