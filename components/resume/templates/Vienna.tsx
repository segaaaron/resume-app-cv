"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function ViennaTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  // First initial of last name for monogram
  const monogram = (pd.lastName?.[0] || pd.firstName?.[0] || "").toUpperCase()

  // Small filled circle with white icon inside
  const CircleBadge = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      width: 18, height: 18, borderRadius: "50%",
      backgroundColor: accent, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {children}
    </div>
  )

  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
      borderLeft: `4px solid ${accent}`, paddingLeft: 10,
    }}>
      <h2 style={{
        fontWeight: 700, fontSize: "10px", letterSpacing: "0.12em",
        textTransform: "uppercase", color: "#1f2937",
      }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
    </div>
  )

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>
      {/* Header with faint monogram */}
      <div style={{ position: "relative", padding: "32px 44px 24px 44px", overflow: "hidden" }}>
        {/* Faint monogram background */}
        {monogram && (
          <div style={{
            position: "absolute", top: -10, right: 20,
            fontSize: "130px", fontWeight: 900, color: "#111827",
            opacity: 0.04, lineHeight: 1, userSelect: "none",
            letterSpacing: "-0.02em", pointerEvents: "none",
          }}>
            {monogram}
          </div>
        )}

        <div style={{ position: "relative" }}>
          <h1 style={{
            fontWeight: 800, fontSize: "28px", color: "#111827",
            lineHeight: 1.1, marginBottom: 4,
          }}>
            {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
          </h1>
          {pd.jobTitle && (
            <p style={{ fontSize: "11px", color: accent, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 12 }}>
              {pd.jobTitle}
            </p>
          )}

          {/* Initials circle */}
          {(() => {
            const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
            return (
              <div style={{
                position: "absolute", top: 0, right: 0,
                width: 80, height: 80, borderRadius: "50%",
                border: `3px solid ${accent}`, backgroundColor: `${accent}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ fontWeight: 900, fontSize: 26, color: accent }}>{initials || "N"}</span>}
              </div>
            )
          })()}

          {/* Contact row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px" }}>
            {pd.email    && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><CircleBadge><Mail size={8} color="white" /></CircleBadge>{pd.email}</span>}
            {pd.phone    && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><CircleBadge><Phone size={8} color="white" /></CircleBadge>{pd.phone}</span>}
            {(pd.city || pd.country) && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><CircleBadge><MapPin size={8} color="white" /></CircleBadge>{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
            {pd.website  && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><CircleBadge><Globe size={8} color="white" /></CircleBadge>{pd.website}</span>}
            {pd.linkedin && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><CircleBadge><Link2 size={8} color="white" /></CircleBadge>{pd.linkedin}</span>}
            {pd.github   && <span style={{ fontSize: "9px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><CircleBadge><GitFork size={8} color="white" /></CircleBadge>{pd.github}</span>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "0 44px 36px 44px" }}>
        {/* Summary */}
        {visible("summary") && summary && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title={label("summary")} />
            <p style={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.7, paddingLeft: 14 }}>{summary}</p>
          </div>
        )}

        {/* Work Experience */}
        {visible("workExperience") && workExperience.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title={label("workExperience")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingLeft: 14 }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 14 }}>
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px", paddingLeft: 14 }}>
              {skills.map((sk) => (
                <span key={sk.id} style={{
                  fontSize: "9px", color: "#374151",
                  backgroundColor: "#f3f4f6", border: `1px solid ${accent}`,
                  borderRadius: 3, padding: "3px 8px",
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", paddingLeft: 14 }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 14 }}>
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
            <SectionHeader title={label("projects")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 14 }}>
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
            <SectionHeader title={label("volunteer")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 14 }}>
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
            <SectionHeader title={label("references")} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, paddingLeft: 14 }}>
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
