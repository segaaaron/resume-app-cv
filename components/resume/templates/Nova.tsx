"use client"

/**
 * Nova — Editorial split header: giant serif name left + accent color block right.
 * Single column body with numbered section labels (01 · 02 · 03) and dotted dividers.
 * Inspired by Enhancv "Newcast" / high-end magazine layout.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function NovaTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  let sectionIdx = 0
  const nextIdx = () => { sectionIdx++; return String(sectionIdx).padStart(2, "0") }

  const SectionHeader = ({ id, title }: { id: string; title: string }) => {
    const num = nextIdx()
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: "22px", fontWeight: 900, color: accent, lineHeight: 1, letterSpacing: "-0.03em", opacity: 0.18 }}>
          {num}
        </span>
        <SectionIcon sectionId={id} color={accent} size={13} strokeWidth={2.25} />
        <h2 style={{
          fontSize: "9px", fontWeight: 800, letterSpacing: "0.2em",
          textTransform: "uppercase", color: "#111827",
        }}>
          {title}
        </h2>
        {/* dotted divider */}
        <div style={{ flex: 1, borderTop: "1.5px dotted #d1d5db" }} />
      </div>
    )
  }

  const SKILL_W: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>
      {/* HEADER — split layout */}
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* Left — white, name */}
        <div style={{ flex: 1, padding: "32px 36px 24px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <p style={{
            fontSize: "8px", fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "#9ca3af", marginBottom: 8,
          }}>
            Curriculum Vitae
          </p>
          <h1 style={{
            fontSize: "36px", fontWeight: 900, color: "#111827",
            lineHeight: 1.0, letterSpacing: "-0.02em",
          }}>
            {pd.firstName || "Your"}<br />
            <span style={{ color: accent }}>{pd.lastName || "Name"}</span>
          </h1>
          {pd.jobTitle && (
            <p style={{
              fontSize: "10px", color: "#6b7280", marginTop: 8,
              letterSpacing: "0.05em",
            }}>
              {pd.jobTitle}
            </p>
          )}
        </div>
        {/* Right — accent block with contact */}
        <div style={{
          width: "38%", flexShrink: 0,
          backgroundColor: accent,
          padding: "28px 20px",
          display: "flex", flexDirection: "column", justifyContent: "center", gap: 8,
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          {(() => {
            const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
            return (
              <div style={{
                width: "64px", height: "64px",
                border: "2px solid rgba(255,255,255,0.5)",
                borderRadius: "4px", marginBottom: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.15)",
              }}>
                {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ color: "#fff", fontWeight: 900, fontSize: 22 }}>{initials || "N"}</span>}
              </div>
            )
          })()}
          {pd.email    && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><Mail size={8} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.95)", wordBreak: "break-all" }}>{pd.email}</span></div>}
          {pd.phone    && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><Phone size={8} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.95)" }}>{pd.phone}</span></div>}
          {(pd.city || pd.country) && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><MapPin size={8} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.95)" }}>{[pd.city, pd.country].filter(Boolean).join(", ")}</span></div>}
          {pd.website  && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><Globe size={8} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.95)" }}>{pd.website}</span></div>}
          {pd.linkedin && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><Link2 size={8} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.95)" }}>{pd.linkedin}</span></div>}
          {pd.github   && <div style={{ display: "flex", gap: 7, alignItems: "center" }}><GitFork size={8} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8px", color: "rgba(255,255,255,0.95)" }}>{pd.github}</span></div>}
        </div>
      </div>

      {/* BODY */}
      <div style={{ padding: "24px 36px 32px" }}>
        {visible("summary") && summary && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader id="summary" title={label("summary")} />
            <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.75 }}>{summary}</p>
          </div>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader id="workExperience" title={label("workExperience")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry" style={{ display: "flex", gap: 16 }}>
                  {/* Date column */}
                  <div style={{ width: "80px", flexShrink: 0, textAlign: "right" }}>
                    <span style={{ fontSize: "8px", color: "#9ca3af", lineHeight: 1.4 }}>
                      {job.startDate && <>{job.startDate}<br />{job.currentlyWorking ? present : job.endDate}</>}
                    </span>
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 800, fontSize: "10.5px", color: "#111827", marginBottom: 1 }}>{job.jobTitle}</p>
                    <p style={{ fontSize: "9px", color: accent, fontWeight: 700, marginBottom: 5 }}>
                      {job.employer}{job.city ? `, ${job.city}` : ""}
                    </p>
                    {job.description && (
                      <div className="resume-desc" style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("education") && education.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader id="education" title={label("education")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {education.map((edu) => (
                <div key={edu.id} className="resume-entry" style={{ display: "flex", gap: 16 }}>
                  <div style={{ width: "80px", flexShrink: 0, textAlign: "right" }}>
                    <span style={{ fontSize: "8px", color: "#9ca3af", lineHeight: 1.4 }}>
                      {edu.startDate && <>{edu.startDate}<br />{edu.currentlyStudying ? present : edu.endDate}</>}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>
                      {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                    </p>
                    <p style={{ fontSize: "9px", color: accent, fontWeight: 600 }}>
                      {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills row */}
        {visible("skills") && skills.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader id="skills" title={label("skills")} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px" }}>
              {skills.map((sk) => {
                const dots = SKILL_W[sk.level] ?? 2
                return (
                  <div key={sk.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{ fontSize: "9px", color: "#374151" }}>{sk.name}</p>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1,2,3,4].map((d) => (
                        <div key={d} style={{
                          width: "5px", height: "5px", borderRadius: "50%",
                          backgroundColor: d <= dots ? accent : "#e5e7eb",
                          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                        }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Two-column: Languages + Certifications side by side */}
        {(visible("languages") && languages.length > 0) || (visible("certifications") && certifications.length > 0) ? (
          <div style={{ display: "flex", gap: 28, marginBottom: 20 }}>
            {visible("languages") && languages.length > 0 && (
              <div style={{ flex: 1 }}>
                <SectionHeader id="languages" title={label("languages")} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {languages.map((lang) => (
                    <div key={lang.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: "9px", color: "#374151" }}>{lang.name}</p>
                      <span style={{
                        fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.05em",
                        color: "#fff", backgroundColor: accent, padding: "1px 6px", borderRadius: "999px",
                        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                      }}>
                        {lang.level.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {visible("certifications") && certifications.length > 0 && (
              <div style={{ flex: 1 }}>
                <SectionHeader id="certifications" title={label("certifications")} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {certifications.map((cert) => (
                    <div key={cert.id}>
                      <p style={{ fontWeight: 700, fontSize: "9.5px", color: "#111827" }}>{cert.name}</p>
                      {(cert.issuer || cert.date) && <p style={{ fontSize: "8px", color: "#6b7280" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {visible("projects") && projects.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader id="projects" title={label("projects")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map((proj) => (
                <div key={proj.id} className="resume-entry">
                  <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827", marginBottom: 2 }}>{proj.name}</p>
                  {proj.role && <p style={{ fontSize: "9px", color: accent, fontWeight: 600, marginBottom: 3 }}>{proj.role}</p>}
                  {proj.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }}>{proj.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("volunteer") && volunteer.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader id="volunteer" title={label("volunteer")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {volunteer.map((vol) => (
                <div key={vol.id} className="resume-entry">
                  <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>{vol.role}</p>
                  <p style={{ fontSize: "9px", color: accent }}>{vol.organization}</p>
                  {vol.description && <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65, marginTop: 3 }}>{vol.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("references") && references.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader id="references" title={label("references")} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
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
