"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function GenevanoirTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme  // electric accent color
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const nearBlack = "#121212"
  const darkBadgeBg = "#222222"

  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      {/* Dark pill badge with accent border */}
      <div style={{
        backgroundColor: darkBadgeBg,
        border: `1px solid ${accent}`,
        borderRadius: 20,
        padding: "3px 12px",
        flexShrink: 0,
      }}>
        <h2 style={{
          fontWeight: 700, fontSize: "8.5px",
          letterSpacing: "0.16em", textTransform: "uppercase",
          color: "#fff",
        }}>
          {title}
        </h2>
      </div>
      <div style={{ flex: 1, height: "0.5px", backgroundColor: "#333" }} />
    </div>
  )

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>
      {/* Full-width near-black header */}
      <div style={{
        backgroundColor: nearBlack, padding: "28px 40px",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <h1 style={{
          fontWeight: 700, fontSize: "30px", color: "#fff",
          letterSpacing: "0.2em", textTransform: "uppercase",
          lineHeight: 1.1, marginBottom: 6,
        }}>
          {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "YOUR NAME"}
        </h1>
        {pd.jobTitle && (
          <p style={{ color: "#9ca3af", fontSize: "10px", letterSpacing: "0.08em", marginBottom: 14 }}>
            {pd.jobTitle}
          </p>
        )}
        {/* Contact row with accent icons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px" }}>
          {pd.email    && <span style={{ fontSize: "8.5px", color: "#9ca3af", display: "flex", alignItems: "center", gap: 5 }}><Mail size={8} color={accent} />{pd.email}</span>}
          {pd.phone    && <span style={{ fontSize: "8.5px", color: "#9ca3af", display: "flex", alignItems: "center", gap: 5 }}><Phone size={8} color={accent} />{pd.phone}</span>}
          {(pd.city || pd.country) && <span style={{ fontSize: "8.5px", color: "#9ca3af", display: "flex", alignItems: "center", gap: 5 }}><MapPin size={8} color={accent} />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
          {pd.website  && <span style={{ fontSize: "8.5px", color: "#9ca3af", display: "flex", alignItems: "center", gap: 5 }}><Globe size={8} color={accent} />{pd.website}</span>}
          {pd.linkedin && <span style={{ fontSize: "8.5px", color: "#9ca3af", display: "flex", alignItems: "center", gap: 5 }}><Link2 size={8} color={accent} />{pd.linkedin}</span>}
          {pd.github   && <span style={{ fontSize: "8.5px", color: "#9ca3af", display: "flex", alignItems: "center", gap: 5 }}><GitFork size={8} color={accent} />{pd.github}</span>}
        </div>
      </div>

      {/* Body — white */}
      <div style={{ padding: "24px 40px" }}>
        {/* Summary */}
        {visible("summary") && summary && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title={label("summary")} />
            <p style={{ fontSize: "10px", color: "#374151", lineHeight: 1.7 }}>{summary}</p>
          </div>
        )}

        {/* Work Experience */}
        {visible("workExperience") && workExperience.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title={label("workExperience")} />
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
            <SectionHeader title={label("education")} />
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
            <SectionHeader title={label("skills")} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 8px" }}>
              {skills.map((sk) => (
                <span key={sk.id} style={{
                  fontSize: "9px", color: "#374151",
                  border: `1px solid #d1d5db`,
                  borderRadius: 3, padding: "3px 8px",
                  backgroundColor: "#fafafa",
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
            <SectionHeader title={label("languages")} />
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
            <SectionHeader title={label("certifications")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {certifications.map((cert) => (
                <div key={cert.id} className="resume-entry" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 5, height: 5, backgroundColor: accent, marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "10px", color: "#111827" }}>{cert.name}</p>
                    {(cert.issuer || cert.date) && <p style={{ fontSize: "9px", color: "#6b7280" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {visible("projects") && projects.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title={label("projects")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map((proj) => (
                <div key={proj.id} className="resume-entry">
                  <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827", marginBottom: 2 }}>{proj.name}</p>
                  {proj.role && <p style={{ fontSize: "9.5px", color: accent, fontWeight: 600, marginBottom: 3 }}>{proj.role}</p>}
                  {proj.description && <p className="resume-desc" style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Volunteer */}
        {visible("volunteer") && volunteer.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title={label("volunteer")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {volunteer.map((vol) => (
                <div key={vol.id} className="resume-entry">
                  <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>{vol.role}</p>
                  <p style={{ fontSize: "9.5px", color: accent, fontWeight: 600 }}>{vol.organization}</p>
                  {vol.description && <p className="resume-desc" style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65, marginTop: 3 }} dangerouslySetInnerHTML={{ __html: fmtDesc(vol.description) }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* References */}
        {visible("references") && references.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title={label("references")} />
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
    </div>
  )
}
