"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function DublinTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  // Small-caps section header with SVG divider line
  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* 12x12 max inline icon */}
        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
          <rect x="0" y="0" width="8" height="8" fill={accent} opacity="0.7" />
        </svg>
        <h2 style={{
          fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "#1f2937",
          fontVariant: "small-caps",
        }}>
          {title}
        </h2>
      </div>
      {/* SVG dashed rule */}
      <svg width="100%" height="4" style={{ display: "block", marginTop: 4 }} aria-hidden="true">
        <line x1="0" y1="2" x2="100%" y2="2" stroke="#d1d5db" strokeWidth="0.8" strokeDasharray="3 2" />
      </svg>
    </div>
  )

  return (
    <div style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff", padding: "28px 36px" }}>
      {/* Header — compact */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{
          fontWeight: 800, fontSize: "20px", color: "#111827",
          lineHeight: 1.1, marginBottom: 2, letterSpacing: "0.01em",
        }}>
          {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
        </h1>
        {pd.jobTitle && (
          <p style={{ fontSize: "9px", color: accent, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 6 }}>
            {pd.jobTitle}
          </p>
        )}
        {/* Dense contact row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 12px" }}>
          {pd.email    && <span style={{ fontSize: "7.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}><Mail size={7} color={accent} />{pd.email}</span>}
          {pd.phone    && <span style={{ fontSize: "7.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}><Phone size={7} color={accent} />{pd.phone}</span>}
          {(pd.city || pd.country) && <span style={{ fontSize: "7.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={7} color={accent} />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
          {pd.website  && <span style={{ fontSize: "7.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}><Globe size={7} color={accent} />{pd.website}</span>}
          {pd.linkedin && <span style={{ fontSize: "7.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}><Link2 size={7} color={accent} />{pd.linkedin}</span>}
          {pd.github   && <span style={{ fontSize: "7.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}><GitFork size={7} color={accent} />{pd.github}</span>}
        </div>
        <div style={{ height: "1.5px", backgroundColor: accent, marginTop: 8 }} />
      </div>

      {/* Summary */}
      {visible("summary") && summary && (
        <div style={{ marginBottom: 12 }}>
          <SectionHeader title={label("summary")} />
          <p style={{ fontSize: "9px", color: "#4b5563", lineHeight: 1.6 }}>{summary}</p>
        </div>
      )}

      {/* Work Experience — dense */}
      {visible("workExperience") && workExperience.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <SectionHeader title={label("workExperience")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {workExperience.map((job) => (
              <div key={job.id} className="resume-entry">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: "9.5px", color: "#111827" }}>{job.jobTitle}</p>
                  <span style={{ fontSize: "7.5px", color: "#9ca3af" }}>
                    {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                  </span>
                </div>
                <p style={{ fontSize: "8.5px", color: accent, fontWeight: 600, marginBottom: 3 }}>
                  {job.employer}{job.city ? `, ${job.city}` : ""}
                </p>
                {job.description && (
                  <div className="resume-desc" style={{ fontSize: "8.5px", color: "#4b5563", lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {visible("education") && education.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <SectionHeader title={label("education")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {education.map((edu) => (
              <div key={edu.id} className="resume-entry">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{ fontWeight: 700, fontSize: "9.5px", color: "#111827" }}>
                    {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                  </p>
                  <span style={{ fontSize: "7.5px", color: "#9ca3af" }}>
                    {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                  </span>
                </div>
                <p style={{ fontSize: "8.5px", color: accent, fontWeight: 600 }}>
                  {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two columns: Skills + Languages */}
      {((visible("skills") && skills.length > 0) || (visible("languages") && languages.length > 0)) && (
        <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
          {visible("skills") && skills.length > 0 && (
            <div style={{ flex: 1 }}>
              <SectionHeader title={label("skills")} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 6px" }}>
                {skills.map((sk) => (
                  <span key={sk.id} style={{
                    fontSize: "8px", color: "#374151",
                    border: `1px solid #d1d5db`, borderRadius: 2,
                    padding: "1px 5px",
                  }}>
                    {sk.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {visible("languages") && languages.length > 0 && (
            <div style={{ flex: 1 }}>
              <SectionHeader title={label("languages")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {languages.map((lang) => (
                  <div key={lang.id} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "8.5px", color: "#374151" }}>{lang.name}</span>
                    <span style={{ fontSize: "7.5px", color: accent }}>{lang.level.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Certifications */}
      {visible("certifications") && certifications.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <SectionHeader title={label("certifications")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {certifications.map((cert) => (
              <div key={cert.id} className="resume-entry" style={{ display: "flex", gap: 8 }}>
                <span style={{ color: accent, fontSize: "8px" }}>•</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "9px", color: "#111827" }}>{cert.name}</p>
                  {(cert.issuer || cert.date) && <p style={{ fontSize: "8px", color: "#6b7280" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {visible("projects") && projects.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <SectionHeader title={label("projects")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {projects.map((proj) => (
              <div key={proj.id} className="resume-entry">
                <p style={{ fontWeight: 700, fontSize: "9.5px", color: "#111827", marginBottom: 1 }}>{proj.name}</p>
                {proj.role && <p style={{ fontSize: "8.5px", color: accent, fontWeight: 600, marginBottom: 2 }}>{proj.role}</p>}
                {proj.description && <p style={{ fontSize: "8.5px", color: "#4b5563", lineHeight: 1.5 }}>{proj.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volunteer */}
      {visible("volunteer") && volunteer.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <SectionHeader title={label("volunteer")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {volunteer.map((vol) => (
              <div key={vol.id} className="resume-entry">
                <p style={{ fontWeight: 700, fontSize: "9.5px", color: "#111827" }}>{vol.role}</p>
                <p style={{ fontSize: "8.5px", color: accent, fontWeight: 600 }}>{vol.organization}</p>
                {vol.description && <p style={{ fontSize: "8.5px", color: "#4b5563", lineHeight: 1.5, marginTop: 2 }}>{vol.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {visible("references") && references.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <SectionHeader title={label("references")} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {references.map((ref) => (
              <div key={ref.id} style={{ minWidth: 130 }}>
                <p style={{ fontWeight: 600, fontSize: "9px", color: "#111827" }}>{ref.name}</p>
                {ref.company && <p style={{ fontSize: "8px", color: accent }}>{ref.company}</p>}
                {ref.phone && <p style={{ fontSize: "8px", color: "#6b7280" }}>{ref.phone}</p>}
                {ref.email && <p style={{ fontSize: "8px", color: "#6b7280" }}>{ref.email}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
