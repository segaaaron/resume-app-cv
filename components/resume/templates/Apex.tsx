"use client"

/**
 * Apex — Bold full-width header with diagonal color block, two-column body.
 * Section headers use a filled accent pill on the left edge (novoresume style).
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

const SKILL_W: Record<string, number> = { beginner: 22, intermediate: 50, advanced: 75, expert: 100 }
const LANG_W: Record<string, number> = { a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100 }

export default function ApexTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const PillHeader = ({ title }: { title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div style={{
        backgroundColor: accent, color: "#fff",
        fontSize: "7.5px", fontWeight: 800, letterSpacing: "0.18em",
        textTransform: "uppercase", padding: "3px 10px", borderRadius: "999px",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        {title}
      </div>
      <div style={{ flex: 1, height: "0.5px", backgroundColor: "#e5e7eb" }} />
    </div>
  )

  return (
    <div style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>
      {/* HEADER — full-width colored block with diagonal clip */}
      <div style={{
        backgroundColor: accent,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        position: "relative", overflow: "hidden",
        padding: "28px 40px 40px",
        clipPath: "polygon(0 0, 100% 0, 100% 78%, 0 100%)",
        marginBottom: "-16px",
      }}>
        {/* Faint circle decoration top-right */}
        <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true"
          style={{ position: "absolute", top: -20, right: -20, opacity: 0.12 }}>
          <circle cx="60" cy="60" r="55" stroke="#fff" strokeWidth="1.5" fill="none" />
          <circle cx="60" cy="60" r="40" stroke="#fff" strokeWidth="1" fill="none" />
          <circle cx="60" cy="60" r="25" stroke="#fff" strokeWidth="0.5" fill="none" />
        </svg>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {config.photoUrl && (
            <div style={{
              width: "82px", height: "82px", borderRadius: "50%",
              overflow: "hidden", border: "3px solid rgba(255,255,255,0.6)",
              flexShrink: 0,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%` }} />
            </div>
          )}
          <div>
            <h1 style={{
              fontSize: "28px", fontWeight: 900, color: "#fff",
              lineHeight: 1.1, letterSpacing: "-0.01em", marginBottom: 5,
            }}>
              {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "YOUR NAME"}
            </h1>
            {pd.jobTitle && (
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)", fontWeight: 400, letterSpacing: "0.05em" }}>
                {pd.jobTitle}
              </p>
            )}
          </div>
        </div>

        {/* Contact strip */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", marginTop: 14 }}>
          {pd.email    && <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", gap: 5 }}><Mail size={8} color="rgba(255,255,255,0.7)" />{pd.email}</span>}
          {pd.phone    && <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", gap: 5 }}><Phone size={8} color="rgba(255,255,255,0.7)" />{pd.phone}</span>}
          {(pd.city || pd.country) && <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", gap: 5 }}><MapPin size={8} color="rgba(255,255,255,0.7)" />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
          {pd.website  && <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", gap: 5 }}><Globe size={8} color="rgba(255,255,255,0.7)" />{pd.website}</span>}
          {pd.linkedin && <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", gap: 5 }}><Link2 size={8} color="rgba(255,255,255,0.7)" />{pd.linkedin}</span>}
          {pd.github   && <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", gap: 5 }}><GitFork size={8} color="rgba(255,255,255,0.7)" />{pd.github}</span>}
        </div>
      </div>

      {/* BODY — two columns */}
      <div style={{ display: "flex", padding: "28px 40px 32px", gap: 28 }}>
        {/* LEFT MAIN */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {visible("summary") && summary && (
            <div style={{ marginBottom: 20 }}>
              <PillHeader title={label("summary")} />
              <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.75 }}>{summary}</p>
            </div>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <PillHeader title={label("workExperience")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {workExperience.map((job) => (
                  <div key={job.id} className="resume-entry">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                      <p style={{ fontWeight: 800, fontSize: "10.5px", color: "#111827" }}>{job.jobTitle}</p>
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
              <PillHeader title={label("education")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry">
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
                    {edu.description && <p style={{ fontSize: "9px", color: "#6b7280", marginTop: 2 }}>{edu.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible("projects") && projects.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <PillHeader title={label("projects")} />
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
              <PillHeader title={label("volunteer")} />
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
              <PillHeader title={label("references")} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
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

        {/* RIGHT SIDEBAR — 30% */}
        <div style={{ width: "30%", flexShrink: 0 }}>
          {visible("skills") && skills.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <PillHeader title={label("skills")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {skills.map((sk) => {
                  const pct = SKILL_W[sk.level] ?? 55
                  return (
                    <div key={sk.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <p style={{ fontSize: "8.5px", color: "#374151" }}>{sk.name}</p>
                      </div>
                      <div style={{ height: "4px", backgroundColor: "#f3f4f6", borderRadius: 999 }}>
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

          {visible("languages") && languages.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <PillHeader title={label("languages")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {languages.map((lang) => {
                  const pct = LANG_W[lang.level] ?? 55
                  return (
                    <div key={lang.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <p style={{ fontSize: "8.5px", color: "#374151" }}>{lang.name}</p>
                        <p style={{ fontSize: "7px", color: "#9ca3af", textTransform: "uppercase" }}>{lang.level}</p>
                      </div>
                      <div style={{ height: "4px", backgroundColor: "#f3f4f6", borderRadius: 999 }}>
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

          {visible("certifications") && certifications.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <PillHeader title={label("certifications")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {certifications.map((cert) => (
                  <div key={cert.id} style={{
                    padding: "6px 8px",
                    borderLeft: `2px solid ${accent}`,
                    backgroundColor: "#f9fafb",
                  }}>
                    <p style={{ fontSize: "8.5px", fontWeight: 700, color: "#111827" }}>{cert.name}</p>
                    {(cert.issuer || cert.date) && <p style={{ fontSize: "7.5px", color: "#6b7280", marginTop: 1 }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
