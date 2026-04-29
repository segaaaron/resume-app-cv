"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function OsloTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  // Minimal geometric SVG icons per section (different shape each)
  const CircleIcon = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <circle cx="5" cy="5" r="4" fill="none" stroke={accent} strokeWidth="1.5" />
    </svg>
  )
  const SquareIcon = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <rect x="1" y="1" width="8" height="8" fill="none" stroke={accent} strokeWidth="1.5" />
    </svg>
  )
  const TriangleIcon = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <polygon points="5,1 9,9 1,9" fill="none" stroke={accent} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
  const DiamondIcon = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <polygon points="5,1 9,5 5,9 1,5" fill="none" stroke={accent} strokeWidth="1.5" />
    </svg>
  )
  const HexIcon = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <polygon points="5,1 8.5,3 8.5,7 5,9 1.5,7 1.5,3" fill="none" stroke={accent} strokeWidth="1.5" />
    </svg>
  )
  const CrossIcon = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <line x1="5" y1="1" x2="5" y2="9" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1" y1="5" x2="9" y2="5" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
  const StarIcon = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <polygon points="5,1 6.2,4 9.5,4 7,6 8,9 5,7 2,9 3,6 0.5,4 3.8,4" fill="none" stroke={accent} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  )

  const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      {icon}
      <h2 style={{
        fontWeight: 700, fontSize: "9px", letterSpacing: "0.2em",
        textTransform: "uppercase", color: "#1f2937",
      }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: "0.8px", backgroundColor: "#e5e7eb" }} />
    </div>
  )

  return (
    <div style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff", padding: "36px 44px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontWeight: 300, fontSize: "32px", letterSpacing: "0.15em",
          textTransform: "uppercase", color: "#111827", marginBottom: 4, lineHeight: 1.1,
        }}>
          {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "YOUR NAME"}
        </h1>
        {pd.jobTitle && (
          <p style={{ fontSize: "10px", color: "#6b7280", letterSpacing: "0.1em", marginBottom: 10 }}>
            {pd.jobTitle}
          </p>
        )}
        {/* Accent line under name */}
        <div style={{ width: "60px", height: "2px", backgroundColor: accent }} />
        {/* Contact row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", marginTop: 12 }}>
          {pd.email    && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Mail size={9} color={accent} />{pd.email}</span>}
          {pd.phone    && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Phone size={9} color={accent} />{pd.phone}</span>}
          {(pd.city || pd.country) && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><MapPin size={9} color={accent} />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
          {pd.website  && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Globe size={9} color={accent} />{pd.website}</span>}
          {pd.linkedin && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Link2 size={9} color={accent} />{pd.linkedin}</span>}
          {pd.github   && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><GitFork size={9} color={accent} />{pd.github}</span>}
        </div>
      </div>

      {/* Summary */}
      {visible("summary") && summary && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={label("summary")} icon={<DiamondIcon />} />
          <p style={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.7 }}>{summary}</p>
        </div>
      )}

      {/* Work Experience */}
      {visible("workExperience") && workExperience.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={label("workExperience")} icon={<CircleIcon />} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {workExperience.map((job) => (
              <div key={job.id} className="resume-entry">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>{job.jobTitle}</p>
                  <span style={{ fontSize: "9px", color: "#9ca3af" }}>
                    {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                  </span>
                </div>
                <p style={{ fontSize: "9.5px", color: accent, marginBottom: 5 }}>
                  {job.employer}{job.city ? `, ${job.city}` : ""}
                </p>
                {job.description && (
                  <div style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }}
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
          <SectionHeader title={label("education")} icon={<SquareIcon />} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {education.map((edu) => (
              <div key={edu.id} className="resume-entry">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>
                    {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                  </p>
                  <span style={{ fontSize: "9px", color: "#9ca3af" }}>
                    {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                  </span>
                </div>
                <p style={{ fontSize: "9.5px", color: accent }}>{edu.institution}{edu.city ? `, ${edu.city}` : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {visible("skills") && skills.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={label("skills")} icon={<TriangleIcon />} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px" }}>
            {skills.map((sk) => (
              <span key={sk.id} style={{
                fontSize: "9px", color: "#374151",
                borderBottom: `1px solid ${accent}`, paddingBottom: "1px",
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
          <SectionHeader title={label("languages")} icon={<HexIcon />} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
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
          <SectionHeader title={label("certifications")} icon={<StarIcon />} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {certifications.map((cert) => (
              <div key={cert.id} className="resume-entry">
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
          <SectionHeader title={label("projects")} icon={<CrossIcon />} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {projects.map((proj) => (
              <div key={proj.id} className="resume-entry">
                <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827", marginBottom: 2 }}>{proj.name}</p>
                {proj.role && <p style={{ fontSize: "9.5px", color: accent, marginBottom: 3 }}>{proj.role}</p>}
                {proj.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.6 }}>{proj.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volunteer */}
      {visible("volunteer") && volunteer.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={label("volunteer")} icon={<DiamondIcon />} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {volunteer.map((vol) => (
              <div key={vol.id} className="resume-entry">
                <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>{vol.role}</p>
                <p style={{ fontSize: "9.5px", color: accent }}>{vol.organization}</p>
                {vol.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.6, marginTop: 3 }}>{vol.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {visible("references") && references.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader title={label("references")} icon={<CircleIcon />} />
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
        </div>
      )}
    </div>
  )
}
