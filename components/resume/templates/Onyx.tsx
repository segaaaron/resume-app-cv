"use client"

/**
 * Onyx — Full dark background, two columns.
 * Header: name + title + contact in dark card. Left column: white card main content.
 * Right column: dark sidebar with light text. Premium dark-mode aesthetic.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

const SKILL_W: Record<string, number> = { beginner: 22, intermediate: 50, advanced: 75, expert: 100 }
const LANG_W: Record<string, number> = { a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100 }

export default function OnyxTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  // White canvas — the dark ground is what made this illegible on paper. Panels keep a
  // faint tint so the structure survives; text values were re-grounded to be readable.
  const bg = "#ffffff"
  const surface = "#f3f3f3"
  const border = "#2a2a2a"

  const SideLabel = ({ id, title }: { id: string; title: string }) => (
    <div style={{ marginBottom: 10 }}>
      <p style={{
        fontSize: "7.5px", fontWeight: 800, letterSpacing: "0.22em",
        textTransform: "uppercase", color: accent, marginBottom: 5,
      }}>
        <SectionIcon sectionId={id} size={11} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{title}
      </p>
      <div style={{ height: "0.5px", backgroundColor: border }} />
    </div>
  )

  const MainLabel = ({ id, title }: { id: string; title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{ width: "3px", height: "16px", backgroundColor: accent, borderRadius: 2, flexShrink: 0 }} />
      <h2 style={{
        fontSize: "9px", fontWeight: 800, letterSpacing: "0.15em",
        textTransform: "uppercase", color: "#15171c",
      }}>
        <SectionIcon sectionId={id} size={11} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{title}
      </h2>
      <div style={{ flex: 1, height: "0.5px", backgroundColor: border }} />
    </div>
  )

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", fontFamily: "inherit",
      backgroundColor: bg,
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* HEADER */}
      <div style={{
        backgroundColor: surface,
        borderBottom: `1px solid ${border}`,
        padding: "28px 36px",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        display: "flex", alignItems: "center", gap: 20,
      }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: `2px solid ${accent}`, flexShrink: 0, backgroundColor: accent + "22", display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontWeight: 800, fontSize: 24 }}>
          {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : (initials || "N")}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: "26px", fontWeight: 900, color: "#15171c",
            lineHeight: 1.1, letterSpacing: "-0.01em", marginBottom: 3,
          }}>
            {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
          </h1>
          {pd.jobTitle && (
            <p style={{ fontSize: "10px", color: accent, fontWeight: 600, letterSpacing: "0.04em", marginBottom: 10 }}>
              {pd.jobTitle}
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 18px" }}>
            {pd.email    && <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 5 }}><Mail size={8} color={accent} />{pd.email}</span>}
            {pd.phone    && <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 5 }}><Phone size={8} color={accent} />{pd.phone}</span>}
            {(pd.city || pd.country) && <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 5 }}><MapPin size={8} color={accent} />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
            {pd.website  && <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 5 }}><Globe size={8} color={accent} />{pd.website}</span>}
            {pd.linkedin && <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 5 }}><Link2 size={8} color={accent} />{pd.linkedin}</span>}
            {pd.github   && <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 5 }}><GitFork size={8} color={accent} />{pd.github}</span>}
          </div>
        </div>
        {/* Decorative accent bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <div style={{ width: "40px", height: "3px", backgroundColor: accent, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
          <div style={{ width: "24px", height: "3px", backgroundColor: accent, opacity: 0.5, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
          <div style={{ width: "14px", height: "3px", backgroundColor: accent, opacity: 0.25, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: "flex" }}>
        {/* MAIN */}
        <div style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column" }}>
          {visible("summary") && summary && (
            <div style={{ marginBottom: 20 }}>
              <MainLabel id="summary" title={label("summary")} />
              <p style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.65)", lineHeight: 1.75 }}>{summary}</p>
            </div>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <MainLabel id="workExperience" title={label("workExperience")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {workExperience.map((job) => (
                  <div key={job.id} className="resume-entry" style={{
                    backgroundColor: surface,
                    border: `1px solid ${border}`,
                    padding: "10px 12px",
                    borderRadius: "4px",
                    WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                      <p style={{ fontWeight: 800, fontSize: "10.5px", color: "#15171c" }}>{job.jobTitle}</p>
                      <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.35)", flexShrink: 0, marginLeft: 8 }}>
                        {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                      </span>
                    </div>
                    <p style={{ fontSize: "9px", color: accent, fontWeight: 700, marginBottom: 5 }}>
                      {job.employer}{job.city ? `, ${job.city}` : ""}
                    </p>
                    {job.description && (
                      <div className="resume-desc" style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible("education") && education.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <MainLabel id="education" title={label("education")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry" style={{
                    backgroundColor: surface,
                    border: `1px solid ${border}`,
                    padding: "10px 12px",
                    borderRadius: "4px",
                    WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#15171c" }}>
                        {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                      </p>
                      <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.35)", flexShrink: 0, marginLeft: 8 }}>
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
              <MainLabel id="projects" title={label("projects")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry" style={{
                    backgroundColor: surface, border: `1px solid ${border}`,
                    padding: "10px 12px", borderRadius: "4px",
                    WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                  }}>
                    <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#15171c", marginBottom: 2 }}>{proj.name}</p>
                    {proj.role && <p style={{ fontSize: "9px", color: accent, fontWeight: 600, marginBottom: 3 }}>{proj.role}</p>}
                    {proj.description && <p className="resume-desc" style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible("volunteer") && volunteer.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <MainLabel id="volunteer" title={label("volunteer")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {volunteer.map((vol) => (
                  <div key={vol.id} className="resume-entry">
                    <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#15171c" }}>{vol.role}</p>
                    <p style={{ fontSize: "9px", color: accent }}>{vol.organization}</p>
                    {vol.description && <p className="resume-desc" style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.6)", lineHeight: 1.65, marginTop: 3 }} dangerouslySetInnerHTML={{ __html: fmtDesc(vol.description) }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible("references") && references.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <MainLabel id="references" title={label("references")} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {references.map((ref) => (
                  <div key={ref.id} style={{ minWidth: 140 }}>
                    <p style={{ fontWeight: 700, fontSize: "10px", color: "#15171c" }}>{ref.name}</p>
                    {ref.company && <p style={{ fontSize: "9px", color: accent }}>{ref.company}</p>}
                    {ref.phone && <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.45)" }}>{ref.phone}</p>}
                    {ref.email && <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.45)" }}>{ref.email}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{
          width: "31%", flexShrink: 0, padding: "24px 18px",
          borderLeft: `1px solid ${border}`,
          display: "flex", flexDirection: "column", gap: 18,
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          {visible("skills") && skills.length > 0 && (
            <div>
              <SideLabel id="skills" title={label("skills")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {skills.map((sk) => {
                  const pct = SKILL_W[sk.level] ?? 55
                  return (
                    <div key={sk.id}>
                      <p style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.75)", marginBottom: 4 }}>{sk.name}</p>
                      <div style={{ height: "3px", backgroundColor: border, borderRadius: 999 }}>
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
            <div>
              <SideLabel id="languages" title={label("languages")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {languages.map((lang) => {
                  const pct = LANG_W[lang.level] ?? 55
                  return (
                    <div key={lang.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <p style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.75)" }}>{lang.name}</p>
                        <p style={{ fontSize: "7px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>{lang.level}</p>
                      </div>
                      <div style={{ height: "3px", backgroundColor: border, borderRadius: 999 }}>
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
            <div>
              <SideLabel id="certifications" title={label("certifications")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {certifications.map((cert) => (
                  <div key={cert.id} style={{
                    padding: "6px 8px", borderLeft: `2px solid ${accent}`,
                    backgroundColor: surface,
                    WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                  }}>
                    <p style={{ fontSize: "8.5px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{cert.name}</p>
                    {(cert.issuer || cert.date) && <p style={{ fontSize: "7.5px", color: "rgba(255,255,255,0.4)" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
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
