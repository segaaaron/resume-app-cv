"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

const SKILL_W: Record<string, string> = { beginner: "22%", intermediate: "50%", advanced: "75%", expert: "100%" }
const LANG_W: Record<string, string> = { a1: "17%", a2: "33%", b1: "50%", b2: "67%", c1: "83%", c2: "100%", native: "100%" }

export default function KyotoTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const sidebarBg = "#F7F5F0"
  const charcoal = "#2C2C2C"

  // Brushstroke-style inline SVG label per section
  const BrushLabel = ({ title }: { title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      {/* brushstroke accent — hand-drawn underline SVG */}
      <svg width="14" height="8" viewBox="0 0 14 8" aria-hidden="true">
        <path d="M2,6 Q7,1 12,5" stroke={charcoal} strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <p style={{
        fontSize: "8.5px", fontWeight: 700, letterSpacing: "0.18em",
        textTransform: "uppercase", color: charcoal,
      }}>
        {title}
      </p>
    </div>
  )

  const MainSectionHeader = ({ title }: { title: string }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <svg width="14" height="8" viewBox="0 0 14 8" aria-hidden="true">
          <path d="M2,6 Q7,1 12,5" stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
        <h2 style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: charcoal }}>
          {title}
        </h2>
      </div>
      <div style={{ height: "0.8px", backgroundColor: "#d1d5db", marginTop: 6 }} />
    </div>
  )

  return (
    <div data-print-layout="sidebar-left" style={{ display: "flex", minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff", fontWeight: 300, "--pdf-sidebar-bg": "#F7F5F0", "--pdf-main-bg": "#fff", "--pdf-sidebar-width": "35%" } as React.CSSProperties}>
      {/* SIDEBAR */}
      <div style={{
        width: "35%", flexShrink: 0,
        backgroundColor: sidebarBg,
        padding: "32px 20px",
        display: "flex", flexDirection: "column", gap: 20,
      }}>
        {/* Initials in thin square frame */}
        {(() => {
          const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
          return (
            <div style={{
              width: "100px", height: "100px",
              border: `2px solid ${charcoal}`,
              flexShrink: 0, alignSelf: "center",
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: `${charcoal}0d`,
            }}>
              <span style={{ fontWeight: 700, fontSize: 32, color: charcoal }}>{initials || "N"}</span>
            </div>
          )
        })()}

        {/* Name in sidebar */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontWeight: 700, fontSize: "16px", color: charcoal, lineHeight: 1.2, letterSpacing: "0.04em" }}>
            {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
          </h1>
          {pd.jobTitle && (
            <p style={{ fontSize: "9px", color: accent, marginTop: 4, letterSpacing: "0.08em" }}>{pd.jobTitle}</p>
          )}
        </div>

        {/* Contact */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {pd.email    && <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Mail size={9} color={charcoal} /><span style={{ fontSize: "8.5px", color: "#555", wordBreak: "break-all" }}>{pd.email}</span></div>}
          {pd.phone    && <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Phone size={9} color={charcoal} /><span style={{ fontSize: "8.5px", color: "#555" }}>{pd.phone}</span></div>}
          {(pd.city || pd.country) && <div style={{ display: "flex", alignItems: "center", gap: 7 }}><MapPin size={9} color={charcoal} /><span style={{ fontSize: "8.5px", color: "#555" }}>{[pd.city, pd.country].filter(Boolean).join(", ")}</span></div>}
          {pd.website  && <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Globe size={9} color={charcoal} /><span style={{ fontSize: "8.5px", color: "#555" }}>{pd.website}</span></div>}
          {pd.linkedin && <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Link2 size={9} color={charcoal} /><span style={{ fontSize: "8.5px", color: "#555" }}>{pd.linkedin}</span></div>}
          {pd.github   && <div style={{ display: "flex", alignItems: "center", gap: 7 }}><GitFork size={9} color={charcoal} /><span style={{ fontSize: "8.5px", color: "#555" }}>{pd.github}</span></div>}
        </div>

        {/* Skills */}
        {visible("skills") && skills.length > 0 && (
          <div>
            <BrushLabel title={label("skills")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {skills.map((sk) => (
                <div key={sk.id}>
                  <p style={{ fontSize: "9px", color: charcoal, marginBottom: 3 }}>{sk.name}</p>
                  <div style={{ height: "3px", backgroundColor: "#d6d0c8", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: SKILL_W[sk.level] ?? "55%", backgroundColor: accent, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {visible("languages") && languages.length > 0 && (
          <div>
            <BrushLabel title={label("languages")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {languages.map((lang) => (
                <div key={lang.id}>
                  <p style={{ fontSize: "9px", color: charcoal, marginBottom: 3 }}>{lang.name}</p>
                  <div style={{ height: "3px", backgroundColor: "#d6d0c8", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: LANG_W[lang.level] ?? "55%", backgroundColor: accent, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications in sidebar */}
        {visible("certifications") && certifications.length > 0 && (
          <div>
            <BrushLabel title={label("certifications")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p style={{ fontSize: "9px", fontWeight: 600, color: charcoal }}>{cert.name}</p>
                  {(cert.issuer || cert.date) && <p style={{ fontSize: "8px", color: "#777" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "32px 28px", backgroundColor: "#fff", display: "flex", flexDirection: "column" }}>
        {/* Summary */}
        {visible("summary") && summary && (
          <div style={{ marginBottom: 20 }}>
            <MainSectionHeader title={label("summary")} />
            <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.75, fontWeight: 300 }}>{summary}</p>
          </div>
        )}

        {/* Work Experience */}
        {visible("workExperience") && workExperience.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <MainSectionHeader title={label("workExperience")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ fontWeight: 700, fontSize: "10.5px", color: charcoal }}>{job.jobTitle}</p>
                    <span style={{ fontSize: "8.5px", color: "#9ca3af" }}>
                      {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: "9px", color: accent, fontWeight: 600, marginBottom: 5 }}>
                    {job.employer}{job.city ? `, ${job.city}` : ""}
                  </p>
                  {job.description && (
                    <div className="resume-desc" style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65, fontWeight: 300 }}
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
            <MainSectionHeader title={label("education")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {education.map((edu) => (
                <div key={edu.id} className="resume-entry">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ fontWeight: 700, fontSize: "10.5px", color: charcoal }}>
                      {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                    </p>
                    <span style={{ fontSize: "8.5px", color: "#9ca3af" }}>
                      {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: "9px", color: accent, fontWeight: 600 }}>
                    {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                  </p>
                  {edu.description && <p style={{ fontSize: "9px", color: "#6b7280", marginTop: 3, fontWeight: 300 }}>{edu.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {visible("projects") && projects.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <MainSectionHeader title={label("projects")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map((proj) => (
                <div key={proj.id} className="resume-entry">
                  <p style={{ fontWeight: 700, fontSize: "10.5px", color: charcoal, marginBottom: 2 }}>{proj.name}</p>
                  {proj.role && <p style={{ fontSize: "9px", color: accent, fontWeight: 600, marginBottom: 3 }}>{proj.role}</p>}
                  {proj.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65, fontWeight: 300 }}>{proj.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Volunteer */}
        {visible("volunteer") && volunteer.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <MainSectionHeader title={label("volunteer")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {volunteer.map((vol) => (
                <div key={vol.id} className="resume-entry">
                  <p style={{ fontWeight: 700, fontSize: "10.5px", color: charcoal }}>{vol.role}</p>
                  <p style={{ fontSize: "9px", color: accent, fontWeight: 600 }}>{vol.organization}</p>
                  {vol.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65, fontWeight: 300, marginTop: 3 }}>{vol.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* References */}
        {visible("references") && references.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <MainSectionHeader title={label("references")} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {references.map((ref) => (
                <div key={ref.id} style={{ minWidth: 140 }}>
                  <p style={{ fontWeight: 600, fontSize: "10px", color: charcoal }}>{ref.name}</p>
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
