"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

const SKILL_PCT: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }

export default function HelsinkiTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const MainSectionHeader = ({ title }: { title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <h2 style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#111827" }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
    </div>
  )

  return (
    <div style={{ display: "flex", minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>
      {/* LEFT SIDEBAR — narrow 25% with skill timeline */}
      <div style={{
        width: "25%", flexShrink: 0,
        backgroundColor: "#f9fafb",
        padding: "28px 14px",
        display: "flex", flexDirection: "column",
        borderRight: "1px solid #e5e7eb",
      }}>
        {/* Skills timeline */}
        {visible("skills") && skills.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{
              fontSize: "8px", fontWeight: 700, letterSpacing: "0.15em",
              textTransform: "uppercase", color: accent, marginBottom: 10,
            }}>
              {label("skills")}
            </p>
            {/* Timeline SVG connected dots */}
            <div style={{ position: "relative", paddingLeft: 18 }}>
              {/* Vertical SVG line */}
              <svg
                width="2" height={skills.length * 28}
                style={{ position: "absolute", left: 6, top: 4 }}
                aria-hidden="true"
              >
                <line x1="1" y1="0" x2="1" y2={skills.length * 28} stroke="#d1d5db" strokeWidth="1.5" />
              </svg>
              {skills.map((sk, i) => (
                <div key={sk.id} style={{ position: "relative", marginBottom: i < skills.length - 1 ? 16 : 0 }}>
                  {/* Timeline dot */}
                  <div style={{
                    position: "absolute", left: -14,
                    width: 8, height: 8, borderRadius: "50%",
                    backgroundColor: accent, top: 2,
                    border: "2px solid white",
                    boxShadow: `0 0 0 1px ${accent}`,
                  }} />
                  <p style={{ fontSize: "8.5px", color: "#374151", fontWeight: 600, marginBottom: 2 }}>{sk.name}</p>
                  <div style={{ height: "3px", backgroundColor: "#e5e7eb", borderRadius: 2 }}>
                    <div style={{
                      height: "100%", width: `${SKILL_PCT[sk.level] ?? 55}%`,
                      backgroundColor: accent, borderRadius: 2,
                      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {visible("languages") && languages.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{
              fontSize: "8px", fontWeight: 700, letterSpacing: "0.15em",
              textTransform: "uppercase", color: accent, marginBottom: 8,
            }}>
              {label("languages")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {languages.map((lang) => (
                <div key={lang.id}>
                  <p style={{ fontSize: "8.5px", color: "#374151", fontWeight: 600 }}>{lang.name}</p>
                  <p style={{ fontSize: "7.5px", color: "#9ca3af" }}>{lang.level.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        <div>
          <p style={{
            fontSize: "8px", fontWeight: 700, letterSpacing: "0.15em",
            textTransform: "uppercase", color: accent, marginBottom: 8,
          }}>
            Contacto
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pd.email    && <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}><Mail size={8} color={accent} /><span style={{ fontSize: "7.5px", color: "#4b5563", wordBreak: "break-all" }}>{pd.email}</span></div>}
            {pd.phone    && <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}><Phone size={8} color={accent} /><span style={{ fontSize: "7.5px", color: "#4b5563" }}>{pd.phone}</span></div>}
            {(pd.city || pd.country) && <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}><MapPin size={8} color={accent} /><span style={{ fontSize: "7.5px", color: "#4b5563" }}>{[pd.city, pd.country].filter(Boolean).join(", ")}</span></div>}
            {pd.website  && <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}><Globe size={8} color={accent} /><span style={{ fontSize: "7.5px", color: "#4b5563" }}>{pd.website}</span></div>}
            {pd.linkedin && <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}><Link2 size={8} color={accent} /><span style={{ fontSize: "7.5px", color: "#4b5563" }}>{pd.linkedin}</span></div>}
            {pd.github   && <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}><GitFork size={8} color={accent} /><span style={{ fontSize: "7.5px", color: "#4b5563" }}>{pd.github}</span></div>}
          </div>
        </div>
      </div>

      {/* RIGHT MAIN */}
      <div style={{ flex: 1, padding: "28px 26px", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontWeight: 800, fontSize: "24px", color: "#111827", lineHeight: 1.1, marginBottom: 4 }}>
            {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
          </h1>
          {pd.jobTitle && (
            <p style={{ fontSize: "10px", color: "#6b7280", letterSpacing: "0.05em", marginBottom: 8 }}>
              {pd.jobTitle}
            </p>
          )}
        </div>

        {/* Summary */}
        {visible("summary") && summary && (
          <div style={{ marginBottom: 18 }}>
            <MainSectionHeader title={label("summary")} />
            <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.7 }}>{summary}</p>
          </div>
        )}

        {/* Work Experience */}
        {visible("workExperience") && workExperience.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <MainSectionHeader title={label("workExperience")} />
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
          </div>
        )}

        {/* Education */}
        {visible("education") && education.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <MainSectionHeader title={label("education")} />
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
          </div>
        )}

        {/* Projects — with tech chip tags */}
        {visible("projects") && projects.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <MainSectionHeader title={label("projects")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {projects.map((proj) => (
                <div key={proj.id} className="resume-entry" style={{
                  border: "1px solid #e5e7eb", borderRadius: 6,
                  padding: "10px 12px",
                  backgroundColor: "#fafafa",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <p style={{ fontWeight: 700, fontSize: "10px", color: "#111827" }}>{proj.name}</p>
                    {proj.role && (
                      <span style={{
                        fontSize: "7.5px", color: accent, border: `1px solid ${accent}`,
                        borderRadius: 3, padding: "1px 6px", fontWeight: 600, flexShrink: 0, marginLeft: 6,
                      }}>
                        {proj.role}
                      </span>
                    )}
                  </div>
                  {proj.description && <p style={{ fontSize: "9px", color: "#4b5563", lineHeight: 1.6 }}>{proj.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {visible("certifications") && certifications.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <MainSectionHeader title={label("certifications")} />
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

        {/* Volunteer */}
        {visible("volunteer") && volunteer.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <MainSectionHeader title={label("volunteer")} />
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
            <MainSectionHeader title={label("references")} />
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
          </div>
        )}
      </div>
    </div>
  )
}
