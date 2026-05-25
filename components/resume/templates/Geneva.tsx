"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function GenevaTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  // Dashed SVG divider with unique icon centered on it
  const DashedDivider = ({ icon }: { icon: React.ReactNode }) => (
    <div style={{ position: "relative", display: "flex", alignItems: "center", marginBottom: 12 }}>
      <svg width="100%" height="12" style={{ position: "absolute" }} aria-hidden="true">
        <line x1="0" y1="6" x2="100%" y2="6" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
      <div style={{
        position: "relative", margin: "0 auto",
        backgroundColor: "#fff", padding: "0 10px",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        {icon}
      </div>
    </div>
  )

  const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{
        textAlign: "center", fontSize: "9.5px", fontWeight: 700,
        letterSpacing: "0.25em", textTransform: "uppercase", color: "#1f2937",
        marginBottom: 8,
      }}>
        {title}
      </h2>
      <DashedDivider icon={icon} />
    </div>
  )

  // Small unique SVG icons
  const WorkIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="1" y="4" width="10" height="7" rx="1" fill="none" stroke={accent} strokeWidth="1.2" />
      <path d="M4,4 V2.5 Q4,1 6,1 Q8,1 8,2.5 V4" fill="none" stroke={accent} strokeWidth="1.2" />
    </svg>
  )
  const EduIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <polygon points="6,1 11,4 6,7 1,4" fill="none" stroke={accent} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M3,5.5 V9" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9,5.5 V9" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M3,9 Q6,11 9,9" fill="none" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
  const SkillIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <polygon points="6,1 7.2,4.5 11,4.5 8,7 9,10.5 6,8.5 3,10.5 4,7 1,4.5 4.8,4.5" fill="none" stroke={accent} strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  )
  const LangIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="6" r="5" fill="none" stroke={accent} strokeWidth="1.2" />
      <ellipse cx="6" cy="6" rx="2.5" ry="5" fill="none" stroke={accent} strokeWidth="1.2" />
      <line x1="1" y1="6" x2="11" y2="6" stroke={accent} strokeWidth="1.2" />
    </svg>
  )
  const CertIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="5" r="3.5" fill="none" stroke={accent} strokeWidth="1.2" />
      <path d="M4,8 L3,11 L6,9.5 L9,11 L8,8" fill="none" stroke={accent} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
  const ProjIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="1" y="3" width="10" height="8" rx="1" fill="none" stroke={accent} strokeWidth="1.2" />
      <path d="M1,6 H11" stroke={accent} strokeWidth="1.2" />
      <path d="M4,1 V3 M8,1 V3" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
  const SummaryIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="6" r="5" fill="none" stroke={accent} strokeWidth="1.2" />
      <circle cx="6" cy="6" r="2" fill={accent} opacity="0.5" />
    </svg>
  )

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff", padding: "36px 44px" }}>
      {/* Header — centered all-caps */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{
          fontWeight: 700, fontSize: "28px",
          letterSpacing: "0.3em", textTransform: "uppercase",
          color: "#111827", lineHeight: 1.1, marginBottom: 6,
        }}>
          {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "YOUR NAME"}
        </h1>
        {pd.jobTitle && (
          <p style={{ fontSize: "10px", color: "#6b7280", letterSpacing: "0.12em", marginBottom: 10 }}>
            {pd.jobTitle}
          </p>
        )}
        {/* Contact row centered */}
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "6px 16px" }}>
          {pd.email    && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}><Mail size={8} color={accent} />{pd.email}</span>}
          {pd.phone    && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}><Phone size={8} color={accent} />{pd.phone}</span>}
          {(pd.city || pd.country) && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={8} color={accent} />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
          {pd.website  && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}><Globe size={8} color={accent} />{pd.website}</span>}
          {pd.linkedin && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}><Link2 size={8} color={accent} />{pd.linkedin}</span>}
          {pd.github   && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}><GitFork size={8} color={accent} />{pd.github}</span>}
        </div>
      </div>

      {/* Summary */}
      {visible("summary") && summary && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={label("summary")} icon={<SummaryIcon />} />
          <p style={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.7, textAlign: "center" }}>{summary}</p>
        </div>
      )}

      {/* Work Experience */}
      {visible("workExperience") && workExperience.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={label("workExperience")} icon={<WorkIcon />} />
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
        </div>
      )}

      {/* Education */}
      {visible("education") && education.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={label("education")} icon={<EduIcon />} />
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
        </div>
      )}

      {/* Skills */}
      {visible("skills") && skills.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={label("skills")} icon={<SkillIcon />} />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 14px" }}>
            {skills.map((sk) => (
              <span key={sk.id} style={{
                fontSize: "9px", color: "#374151",
                border: `1px solid #e5e7eb`, borderRadius: 2,
                padding: "3px 8px",
              }}>
                {sk.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {visible("languages") && languages.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={label("languages")} icon={<LangIcon />} />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 20px" }}>
            {languages.map((lang) => (
              <span key={lang.id} style={{ fontSize: "9px", color: "#374151" }}>
                {lang.name} <span style={{ color: accent }}>·</span> <span style={{ color: "#9ca3af" }}>{lang.level.toUpperCase()}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {visible("certifications") && certifications.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={label("certifications")} icon={<CertIcon />} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {certifications.map((cert) => (
              <div key={cert.id} className="resume-entry" style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 600, fontSize: "10px", color: "#111827" }}>{cert.name}</p>
                {(cert.issuer || cert.date) && <p style={{ fontSize: "9px", color: "#6b7280" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {visible("projects") && projects.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={label("projects")} icon={<ProjIcon />} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {projects.map((proj) => (
              <div key={proj.id} className="resume-entry">
                <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827", marginBottom: 2 }}>{proj.name}</p>
                {proj.role && <p style={{ fontSize: "9.5px", color: accent, fontWeight: 600, marginBottom: 3 }}>{proj.role}</p>}
                {proj.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }}>{proj.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volunteer */}
      {visible("volunteer") && volunteer.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={label("volunteer")} icon={<SummaryIcon />} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {volunteer.map((vol) => (
              <div key={vol.id} className="resume-entry">
                <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>{vol.role}</p>
                <p style={{ fontSize: "9.5px", color: accent, fontWeight: 600 }}>{vol.organization}</p>
                {vol.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65, marginTop: 3 }}>{vol.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {visible("references") && references.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={label("references")} icon={<SummaryIcon />} />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
            {references.map((ref) => (
              <div key={ref.id} style={{ minWidth: 140, textAlign: "center" }}>
                <p style={{ fontWeight: 600, fontSize: "10px", color: "#111827" }}>{ref.name}</p>
                {ref.company && <p style={{ fontSize: "9px", color: accent }}>{ref.company}</p>}
                {ref.phone && <p style={{ fontSize: "9px", color: "#6b7280" }}>{ref.phone}</p>}
                {ref.email && <p style={{ fontSize: "9px", color: "#6b7280" }}>{ref.email}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
