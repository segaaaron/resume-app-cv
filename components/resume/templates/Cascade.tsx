"use client"

/**
 * Cascade — Wide left sidebar with gradient from accent to dark, plus
 * decorative SVG wave between sidebar and main. Main area uses
 * timeline-style left border with dot markers per entry.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

const SKILL_W: Record<string, number> = { beginner: 22, intermediate: 50, advanced: 75, expert: 100 }
const LANG_W: Record<string, number> = { a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100 }

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export default function CascadeTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const SideLabel = ({ title }: { title: string }) => (
    <p style={{
      fontSize: "7.5px", fontWeight: 800, letterSpacing: "0.22em",
      textTransform: "uppercase", color: "rgba(255,255,255,0.5)",
      marginBottom: 8, paddingBottom: 5,
      borderBottom: "0.5px solid rgba(255,255,255,0.15)",
    }}>
      {title}
    </p>
  )

  const TimelineHeader = ({ id, title }: { id: string; title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{
        width: "28px", height: "28px", borderRadius: "50%",
        backgroundColor: accent, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <SectionIcon sectionId={id} color="#fff" size={14} strokeWidth={2.5} />
      </div>
      <h2 style={{
        fontSize: "9px", fontWeight: 800, letterSpacing: "0.15em",
        textTransform: "uppercase", color: "#111827",
      }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: "0.5px", backgroundColor: "#e5e7eb" }} />
    </div>
  )

  const TimelineEntry = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", gap: 12 }}>
      {/* Timeline line + dot */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", border: `2px solid ${accent}`, backgroundColor: "#fff", flexShrink: 0 }} />
        <div style={{ flex: 1, width: "1px", backgroundColor: "#e5e7eb", marginTop: 4 }} />
      </div>
      <div style={{ flex: 1, paddingBottom: 14 }}>{children}</div>
    </div>
  )

  return (
    <div data-print-layout="sidebar-left" style={{ display: "flex", minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff", "--pdf-sidebar-bg": accent, "--pdf-main-bg": "#fff", "--pdf-sidebar-width": "33%" } as React.CSSProperties}>
      {/* SIDEBAR */}
      <div style={{
        width: "33%", flexShrink: 0,
        background: `linear-gradient(175deg, ${accent} 0%, #1a1a2e 100%)`,
        padding: "0 0 28px",
        display: "flex", flexDirection: "column",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        {/* Photo area */}
        <div style={{ padding: "28px 20px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {(() => {
            const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
            return (
              <div style={{
                width: "88px", height: "88px", borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.4)",
                marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.15)",
              }}>
                {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ color: "#fff", fontWeight: 900, fontSize: 28 }}>{initials || "N"}</span>}
              </div>
            )
          })()}
          <h1 style={{
            fontSize: "15px", fontWeight: 900, color: "#fff",
            textAlign: "center", lineHeight: 1.2, letterSpacing: "0.01em", marginBottom: 4,
          }}>
            {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
          </h1>
          {pd.jobTitle && (
            <p style={{
              fontSize: "8px", color: "rgba(255,255,255,0.75)", textAlign: "center",
              letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600,
            }}>
              {pd.jobTitle}
            </p>
          )}
        </div>

        {/* Divider wave SVG */}
        <svg viewBox="0 0 100 8" preserveAspectRatio="none"
          style={{ width: "100%", height: "8px", display: "block", opacity: 0.3 }}
          aria-hidden="true">
          <path d="M0,4 Q25,0 50,4 T100,4 L100,8 L0,8 Z" fill="white" />
        </svg>

        {/* Contact + skill sections */}
        <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <SideLabel title="Contacto" />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {pd.email    && <div style={{ display: "flex", gap: 7, alignItems: "flex-start" }}><Mail size={8} color="rgba(255,255,255,0.6)" style={{ marginTop: 1, flexShrink: 0 }} /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.8)", wordBreak: "break-all", lineHeight: 1.4 }}>{pd.email}</span></div>}
              {pd.phone    && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><Phone size={8} color="rgba(255,255,255,0.6)" /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.8)" }}>{pd.phone}</span></div>}
              {(pd.city || pd.country) && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><MapPin size={8} color="rgba(255,255,255,0.6)" /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.8)" }}>{[pd.city, pd.country].filter(Boolean).join(", ")}</span></div>}
              {pd.website  && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><Globe size={8} color="rgba(255,255,255,0.6)" /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.8)" }}>{pd.website}</span></div>}
              {pd.linkedin && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><Link2 size={8} color="rgba(255,255,255,0.6)" /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.8)" }}>{pd.linkedin}</span></div>}
              {pd.github   && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><GitFork size={8} color="rgba(255,255,255,0.6)" /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.8)" }}>{pd.github}</span></div>}
            </div>
          </div>

          {visible("skills") && skills.length > 0 && (
            <div>
              <SideLabel title={label("skills")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {skills.map((sk) => {
                  const pct = SKILL_W[sk.level] ?? 55
                  return (
                    <div key={sk.id}>
                      <p style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>{sk.name}</p>
                      <div style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 999 }}>
                        <div style={{
                          height: "100%", width: `${pct}%`, borderRadius: 999,
                          backgroundColor: "rgba(255,255,255,0.7)",
                          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {visible("languages") && languages.length > 0 && (
            <div>
              <SideLabel title={label("languages")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {languages.map((lang) => {
                  const pct = LANG_W[lang.level] ?? 55
                  return (
                    <div key={lang.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <p style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.85)" }}>{lang.name}</p>
                        <p style={{ fontSize: "7px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>{lang.level}</p>
                      </div>
                      <div style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 999 }}>
                        <div style={{
                          height: "100%", width: `${pct}%`, borderRadius: 999,
                          backgroundColor: "rgba(255,255,255,0.7)",
                          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <div>
              <SideLabel title={label("certifications")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <p style={{ fontSize: "8.5px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{cert.name}</p>
                    {(cert.issuer || cert.date) && <p style={{ fontSize: "7.5px", color: "rgba(255,255,255,0.45)" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
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
            <TimelineHeader id="summary" title={label("summary")} />
            <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.75, paddingLeft: 38 }}>{summary}</p>
          </div>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <TimelineHeader id="workExperience" title={label("workExperience")} />
            <div style={{ paddingLeft: 10 }}>
              {workExperience.map((job) => (
                <TimelineEntry key={job.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 }}>
                    <p style={{ fontWeight: 800, fontSize: "10.5px", color: "#111827" }}>{job.jobTitle}</p>
                    <span style={{ fontSize: "8px", color: "#9ca3af", flexShrink: 0, marginLeft: 8 }}>
                      {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: "9px", color: accent, fontWeight: 700, marginBottom: 4 }}>
                    {job.employer}{job.city ? `, ${job.city}` : ""}
                  </p>
                  {job.description && (
                    <div className="resume-desc" style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </TimelineEntry>
              ))}
            </div>
          </div>
        )}

        {visible("education") && education.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <TimelineHeader id="education" title={label("education")} />
            <div style={{ paddingLeft: 10 }}>
              {education.map((edu) => (
                <TimelineEntry key={edu.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>
                      {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                    </p>
                    <span style={{ fontSize: "8px", color: "#9ca3af", flexShrink: 0, marginLeft: 8 }}>
                      {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: "9px", color: accent, fontWeight: 600 }}>
                    {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                  </p>
                </TimelineEntry>
              ))}
            </div>
          </div>
        )}

        {visible("projects") && projects.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <TimelineHeader id="projects" title={label("projects")} />
            <div style={{ paddingLeft: 10 }}>
              {projects.map((proj) => (
                <TimelineEntry key={proj.id}>
                  <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827", marginBottom: 2 }}>{proj.name}</p>
                  {proj.role && <p style={{ fontSize: "9px", color: accent, fontWeight: 600, marginBottom: 3 }}>{proj.role}</p>}
                  {proj.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }}>{proj.description}</p>}
                </TimelineEntry>
              ))}
            </div>
          </div>
        )}

        {visible("volunteer") && volunteer.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <TimelineHeader id="volunteer" title={label("volunteer")} />
            <div style={{ paddingLeft: 10 }}>
              {volunteer.map((vol) => (
                <TimelineEntry key={vol.id}>
                  <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>{vol.role}</p>
                  <p style={{ fontSize: "9px", color: accent }}>{vol.organization}</p>
                  {vol.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65, marginTop: 3 }}>{vol.description}</p>}
                </TimelineEntry>
              ))}
            </div>
          </div>
        )}

        {visible("references") && references.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <TimelineHeader id="references" title={label("references")} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, paddingLeft: 38 }}>
              {references.map((ref) => (
                <div key={ref.id} style={{ minWidth: 140 }}>
                  <p style={{ fontWeight: 700, fontSize: "10px", color: "#111827" }}>{ref.name}</p>
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
