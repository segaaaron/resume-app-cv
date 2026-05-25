"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

const SKILL_W: Record<string, number> = { beginner: 22, intermediate: 50, advanced: 75, expert: 100 }
const LANG_W: Record<string, number> = { a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100 }

export default function TokyoTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const dark = "#0D0D0D"
  const sideW = "32%"

  const SideLabel = ({ title }: { title: string }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        {/* Small filled circle */}
        <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
          <circle cx="3" cy="3" r="3" fill={accent} />
        </svg>
        <p style={{
          fontSize: "7.5px", fontWeight: 800, letterSpacing: "0.2em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.5)",
        }}>
          {title}
        </p>
      </div>
      <div style={{ height: "0.5px", backgroundColor: "rgba(255,255,255,0.1)" }} />
    </div>
  )

  const MainLabel = ({ title }: { title: string }) => (
    <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
      {/* Horizontal rule left */}
      <div style={{ width: "18px", height: "2px", backgroundColor: accent, flexShrink: 0 }} />
      <h2 style={{
        fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.18em",
        textTransform: "uppercase", color: dark, whiteSpace: "nowrap",
      }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: "0.5px", backgroundColor: "#e5e7eb" }} />
    </div>
  )

  return (
    <div data-print-layout="sidebar-left" style={{ display: "flex", minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff", "--pdf-sidebar-bg": "#0D0D0D", "--pdf-main-bg": "#fff", "--pdf-sidebar-width": "32%" } as React.CSSProperties}>
      {/* SIDEBAR — almost black */}
      <div style={{
        width: sideW, flexShrink: 0,
        backgroundColor: dark,
        display: "flex", flexDirection: "column",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        {/* Header block with accent color strip */}
        <div style={{ position: "relative", overflow: "hidden" }}>
          {/* Diagonal accent slash */}
          <div style={{
            position: "absolute", bottom: 0, right: 0,
            width: "60px", height: "60px",
            backgroundColor: accent,
            clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
            WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
          }} />
          <div style={{ padding: "28px 18px 24px" }}>
            {(() => {
              const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
              return (
                <div style={{
                  width: "72px", height: "72px", borderRadius: "50%",
                  border: `2.5px solid ${accent}`,
                  marginBottom: 12, flexShrink: 0,
                  WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                  backgroundColor: `${accent}20`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ color: accent, fontWeight: 900, fontSize: 22 }}>{initials || "N"}</span>}
                </div>
              )
            })()}
            <h1 style={{
              fontSize: "15px", fontWeight: 900, color: "#fff",
              lineHeight: 1.15, letterSpacing: "0.01em", marginBottom: 3,
            }}>
              {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
            </h1>
            {pd.jobTitle && (
              <p style={{ fontSize: "8.5px", color: accent, fontWeight: 600, letterSpacing: "0.05em" }}>{pd.jobTitle}</p>
            )}
          </div>
        </div>

        {/* Contact */}
        <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <SideLabel title="Contacto" />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {pd.email    && <div style={{ display: "flex", gap: 7, alignItems: "flex-start" }}><Mail size={8} color={accent} style={{ flexShrink: 0, marginTop: 1 }} /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.7)", wordBreak: "break-all", lineHeight: 1.4 }}>{pd.email}</span></div>}
              {pd.phone    && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><Phone size={8} color={accent} /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.7)" }}>{pd.phone}</span></div>}
              {(pd.city || pd.country) && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><MapPin size={8} color={accent} /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.7)" }}>{[pd.city, pd.country].filter(Boolean).join(", ")}</span></div>}
              {pd.website  && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><Globe size={8} color={accent} /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.7)" }}>{pd.website}</span></div>}
              {pd.linkedin && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><Link2 size={8} color={accent} /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.7)" }}>{pd.linkedin}</span></div>}
              {pd.github   && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><GitFork size={8} color={accent} /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.7)" }}>{pd.github}</span></div>}
            </div>
          </div>

          {/* Skills */}
          {visible("skills") && skills.length > 0 && (
            <div>
              <SideLabel title={label("skills")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {skills.map((sk) => {
                  const pct = SKILL_W[sk.level] ?? 55
                  return (
                    <div key={sk.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <p style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.85)" }}>{sk.name}</p>
                        <p style={{ fontSize: "7.5px", color: "rgba(255,255,255,0.4)" }}>{pct}%</p>
                      </div>
                      {/* Track */}
                      <div style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 999 }}>
                        <div style={{
                          height: "100%", width: `${pct}%`, borderRadius: 999,
                          backgroundColor: accent,
                          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Languages */}
          {visible("languages") && languages.length > 0 && (
            <div>
              <SideLabel title={label("languages")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {languages.map((lang) => {
                  const pct = LANG_W[lang.level] ?? 55
                  return (
                    <div key={lang.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <p style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.85)" }}>{lang.name}</p>
                        <p style={{ fontSize: "7px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{lang.level}</p>
                      </div>
                      <div style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 999 }}>
                        <div style={{
                          height: "100%", width: `${pct}%`, borderRadius: 999,
                          backgroundColor: accent,
                          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Certifications */}
          {visible("certifications") && certifications.length > 0 && (
            <div>
              <SideLabel title={label("certifications")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <p style={{ fontSize: "8.5px", fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 1 }}>{cert.name}</p>
                    {(cert.issuer || cert.date) && <p style={{ fontSize: "7.5px", color: "rgba(255,255,255,0.4)" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "32px 28px", display: "flex", flexDirection: "column" }}>
        {visible("summary") && summary && (
          <div style={{ marginBottom: 20 }}>
            <MainLabel title={label("summary")} />
            <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.75 }}>{summary}</p>
          </div>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <MainLabel title={label("workExperience")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry" style={{ paddingLeft: "10px", borderLeft: `2px solid ${accent}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                    <p style={{ fontWeight: 800, fontSize: "10.5px", color: dark }}>{job.jobTitle}</p>
                    <span style={{ fontSize: "8px", color: "#9ca3af", flexShrink: 0, marginLeft: 8 }}>
                      {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: "9px", color: accent, fontWeight: 700, marginBottom: 5 }}>
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

        {visible("education") && education.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <MainLabel title={label("education")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {education.map((edu) => (
                <div key={edu.id} className="resume-entry" style={{ paddingLeft: "10px", borderLeft: `2px solid #e5e7eb` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ fontWeight: 700, fontSize: "10.5px", color: dark }}>
                      {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                    </p>
                    <span style={{ fontSize: "8px", color: "#9ca3af", flexShrink: 0, marginLeft: 8 }}>
                      {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: "9px", color: accent, fontWeight: 600 }}>
                    {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("projects") && projects.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <MainLabel title={label("projects")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map((proj) => (
                <div key={proj.id} className="resume-entry" style={{ paddingLeft: "10px", borderLeft: `2px solid ${accent}` }}>
                  <p style={{ fontWeight: 800, fontSize: "10.5px", color: dark, marginBottom: 2 }}>{proj.name}</p>
                  {proj.role && <p style={{ fontSize: "9px", color: accent, fontWeight: 600, marginBottom: 3 }}>{proj.role}</p>}
                  {proj.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }}>{proj.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("volunteer") && volunteer.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <MainLabel title={label("volunteer")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {volunteer.map((vol) => (
                <div key={vol.id} className="resume-entry" style={{ paddingLeft: "10px", borderLeft: `2px solid #e5e7eb` }}>
                  <p style={{ fontWeight: 700, fontSize: "10.5px", color: dark }}>{vol.role}</p>
                  <p style={{ fontSize: "9px", color: accent }}>{vol.organization}</p>
                  {vol.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65, marginTop: 3 }}>{vol.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("references") && references.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <MainLabel title={label("references")} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {references.map((ref) => (
                <div key={ref.id} style={{ minWidth: 140 }}>
                  <p style={{ fontWeight: 700, fontSize: "10px", color: dark }}>{ref.name}</p>
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
