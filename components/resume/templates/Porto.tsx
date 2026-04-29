"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function PortoTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"

  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <div style={{ width: 6, height: 6, backgroundColor: accent, transform: "rotate(45deg)" }} />
      <h2 style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#1f2937" }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
    </div>
  )

  return (
    <div style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>
      {/* Diagonal split header */}
      <div style={{ position: "relative", height: "120px", overflow: "hidden" }}>
        {/* Left half accent background */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundColor: accent,
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }} />
        {/* White diagonal overlay covering right side */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polygon points="55,0 100,0 100,100 45,100" fill="white" />
        </svg>

        {/* Name overlay — left half white text, right half dark text */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center",
          paddingLeft: 36, paddingRight: 36,
        }}>
          {/* Left portion — white text on accent */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <h1 style={{
              fontWeight: 800, fontSize: "26px", lineHeight: 1.1,
              color: "#fff", letterSpacing: "0.03em", whiteSpace: "nowrap",
            }}>
              {fullName}
            </h1>
            {pd.jobTitle && (
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "10px", marginTop: 4, letterSpacing: "0.08em" }}>
                {pd.jobTitle}
              </p>
            )}
          </div>
        </div>

        {/* Name overlay clipped to right half — dark text */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 3,
          clipPath: "polygon(55% 0, 100% 0, 100% 100%, 45% 100%)",
          display: "flex", alignItems: "center",
          paddingLeft: 36, paddingRight: 36,
        }}>
          <div>
            <h1 style={{
              fontWeight: 800, fontSize: "26px", lineHeight: 1.1,
              color: "#111827", letterSpacing: "0.03em", whiteSpace: "nowrap",
            }}>
              {fullName}
            </h1>
            {pd.jobTitle && (
              <p style={{ color: "#6b7280", fontSize: "10px", marginTop: 4, letterSpacing: "0.08em" }}>
                {pd.jobTitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contact row */}
      <div style={{
        backgroundColor: "#f9fafb",
        padding: "10px 36px",
        display: "flex", flexWrap: "wrap", gap: "6px 18px",
        borderBottom: "1px solid #e5e7eb",
      }}>
        {pd.email    && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Mail size={8} color={accent} />{pd.email}</span>}
        {pd.phone    && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Phone size={8} color={accent} />{pd.phone}</span>}
        {(pd.city || pd.country) && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><MapPin size={8} color={accent} />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
        {pd.website  && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Globe size={8} color={accent} />{pd.website}</span>}
        {pd.linkedin && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Link2 size={8} color={accent} />{pd.linkedin}</span>}
        {pd.github   && <span style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><GitFork size={8} color={accent} />{pd.github}</span>}
      </div>

      {/* Body */}
      <div style={{ padding: "24px 36px" }}>
        {/* Summary */}
        {visible("summary") && summary && (
          <div style={{ marginBottom: 18 }}>
            <SectionHeader title={label("summary")} />
            <p style={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.7 }}>{summary}</p>
          </div>
        )}

        {/* Work Experience */}
        {visible("workExperience") && workExperience.length > 0 && (
          <div style={{ marginBottom: 18 }}>
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
                    <div style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two columns: Education + Skills */}
        <div style={{ display: "flex", gap: 24, marginBottom: 18 }}>
          {/* Education */}
          {visible("education") && education.length > 0 && (
            <div style={{ flex: 1 }}>
              <SectionHeader title={label("education")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry">
                    <p style={{ fontWeight: 700, fontSize: "10px", color: "#111827" }}>
                      {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                    </p>
                    <p style={{ fontSize: "9px", color: accent, fontWeight: 600 }}>
                      {edu.institution}
                    </p>
                    <p style={{ fontSize: "8.5px", color: "#9ca3af" }}>
                      {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {visible("skills") && skills.length > 0 && (
            <div style={{ flex: 1 }}>
              <SectionHeader title={label("skills")} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 8px" }}>
                {skills.map((sk) => (
                  <span key={sk.id} style={{
                    fontSize: "8.5px", color: "#374151",
                    border: `1px solid ${accent}`, borderRadius: 2,
                    padding: "2px 7px",
                  }}>
                    {sk.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Languages */}
        {visible("languages") && languages.length > 0 && (
          <div style={{ marginBottom: 18 }}>
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
          <div style={{ marginBottom: 18 }}>
            <SectionHeader title={label("certifications")} />
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
          <div style={{ marginBottom: 18 }}>
            <SectionHeader title={label("projects")} />
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
          <div style={{ marginBottom: 18 }}>
            <SectionHeader title={label("volunteer")} />
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
          <div style={{ marginBottom: 18 }}>
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
