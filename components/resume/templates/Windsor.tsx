"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function WindsorTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const navy = "#1B2A4A"
  const gold = "#C9A84C"

  const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <div style={{
        width: 20, height: 20, backgroundColor: navy, borderRadius: 2,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {icon}
      </div>
      <h2 style={{ fontWeight: 700, fontSize: "9.5px", letterSpacing: "0.15em", textTransform: "uppercase", color: navy }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#d1d5db" }} />
    </div>
  )

  const FilledSquare = () => (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" fill={gold} />
    </svg>
  )
  const FilledCircle = () => (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
      <circle cx="4" cy="4" r="3" fill={gold} />
    </svg>
  )
  const FilledDiamond = () => (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
      <polygon points="4,1 7,4 4,7 1,4" fill={gold} />
    </svg>
  )
  const FilledTriangle = () => (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
      <polygon points="4,1 7,7 1,7" fill={gold} />
    </svg>
  )

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>
      {/* Full-width dark navy header */}
      <div style={{
        backgroundColor: navy, padding: "28px 36px",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontWeight: 600, fontSize: "26px", color: "#fff",
              letterSpacing: "0.04em", lineHeight: 1.15, marginBottom: 4,
            }}>
              {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
            </h1>
            {pd.jobTitle && (
              <p style={{ color: gold, fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 14 }}>
                {pd.jobTitle}
              </p>
            )}
            {/* Contact row in header */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px" }}>
              {pd.email    && <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 5 }}><Mail size={8} color={gold} />{pd.email}</span>}
              {pd.phone    && <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 5 }}><Phone size={8} color={gold} />{pd.phone}</span>}
              {(pd.city || pd.country) && <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 5 }}><MapPin size={8} color={gold} />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
              {pd.website  && <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 5 }}><Globe size={8} color={gold} />{pd.website}</span>}
              {pd.linkedin && <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 5 }}><Link2 size={8} color={gold} />{pd.linkedin}</span>}
              {pd.github   && <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 5 }}><GitFork size={8} color={gold} />{pd.github}</span>}
            </div>
          </div>

          {/* Initials with gold ring */}
          {(() => {
            const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
            return (
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                border: `4px solid ${gold}`, flexShrink: 0,
                backgroundColor: "rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ color: gold, fontWeight: 900, fontSize: 26 }}>{initials || "N"}</span>}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Gold accent bar */}
      <div style={{ height: "3px", backgroundColor: gold, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />

      {/* Body */}
      <div style={{ padding: "24px 36px" }}>
        {/* Summary */}
        {visible("summary") && summary && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title={label("summary")} icon={<FilledDiamond />} />
            <p style={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.7 }}>{summary}</p>
          </div>
        )}

        {/* Work Experience */}
        {visible("workExperience") && workExperience.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title={label("workExperience")} icon={<FilledSquare />} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                    <p style={{ fontWeight: 700, fontSize: "10.5px", color: navy }}>{job.jobTitle}</p>
                    <span style={{ fontSize: "9px", color: "#9ca3af" }}>
                      {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: "9.5px", color: gold, fontWeight: 600, marginBottom: 5 }}>
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
            <SectionHeader title={label("education")} icon={<FilledCircle />} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {education.map((edu) => (
                <div key={edu.id} className="resume-entry">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ fontWeight: 700, fontSize: "10.5px", color: navy }}>
                      {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                    </p>
                    <span style={{ fontSize: "9px", color: "#9ca3af" }}>
                      {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: "9.5px", color: gold, fontWeight: 600 }}>
                    {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                  </p>
                  {edu.description && <p style={{ fontSize: "9px", color: "#6b7280", marginTop: 3 }}>{edu.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two columns for skills + languages */}
        {((visible("skills") && skills.length > 0) || (visible("languages") && languages.length > 0)) && (
          <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
            {visible("skills") && skills.length > 0 && (
              <div style={{ flex: 1 }}>
                <SectionHeader title={label("skills")} icon={<FilledTriangle />} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 10px" }}>
                  {skills.map((sk) => (
                    <span key={sk.id} style={{
                      fontSize: "9px", color: navy, border: `1px solid ${gold}`,
                      borderRadius: 2, padding: "2px 7px",
                    }}>
                      {sk.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {visible("languages") && languages.length > 0 && (
              <div style={{ flex: 1 }}>
                <SectionHeader title={label("languages")} icon={<FilledDiamond />} />
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {languages.map((lang) => (
                    <div key={lang.id} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "9.5px", color: navy }}>{lang.name}</span>
                      <span style={{ fontSize: "8.5px", color: gold }}>{lang.level.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Certifications */}
        {visible("certifications") && certifications.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title={label("certifications")} icon={<FilledCircle />} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {certifications.map((cert) => (
                <div key={cert.id} className="resume-entry" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 4, height: 4, backgroundColor: gold, marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "10px", color: navy }}>{cert.name}</p>
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
            <SectionHeader title={label("projects")} icon={<FilledSquare />} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map((proj) => (
                <div key={proj.id} className="resume-entry">
                  <p style={{ fontWeight: 700, fontSize: "10.5px", color: navy, marginBottom: 2 }}>{proj.name}</p>
                  {proj.role && <p style={{ fontSize: "9.5px", color: gold, fontWeight: 600, marginBottom: 3 }}>{proj.role}</p>}
                  {proj.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }}>{proj.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Volunteer */}
        {visible("volunteer") && volunteer.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title={label("volunteer")} icon={<FilledTriangle />} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {volunteer.map((vol) => (
                <div key={vol.id} className="resume-entry">
                  <p style={{ fontWeight: 700, fontSize: "10.5px", color: navy }}>{vol.role}</p>
                  <p style={{ fontSize: "9.5px", color: gold, fontWeight: 600 }}>{vol.organization}</p>
                  {vol.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65, marginTop: 3 }}>{vol.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* References */}
        {visible("references") && references.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title={label("references")} icon={<FilledDiamond />} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {references.map((ref) => (
                <div key={ref.id} style={{ minWidth: 140 }}>
                  <p style={{ fontWeight: 600, fontSize: "10px", color: navy }}>{ref.name}</p>
                  {ref.company && <p style={{ fontSize: "9px", color: gold }}>{ref.company}</p>}
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
