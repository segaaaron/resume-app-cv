"use client"

/**
 * Mosaic — Grid-based bento layout. Header full-width, then body splits into
 * two unequal columns. Section headers use a filled square accent tile on left.
 * Skills shown as a 2-column grid of tag chips. Bold, modern, creative.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function MosaicTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const TileHeader = ({ title }: { title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      {/* Filled square tile */}
      <div style={{
        width: "16px", height: "16px", backgroundColor: accent, flexShrink: 0,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        {/* inner cross SVG for decorative fill */}
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <line x1="8" y1="3" x2="8" y2="13" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="3" y1="8" x2="13" y2="8" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        </svg>
      </div>
      <h2 style={{
        fontSize: "9px", fontWeight: 800, letterSpacing: "0.16em",
        textTransform: "uppercase", color: "#111827",
      }}>
        {title}
      </h2>
    </div>
  )

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* Name block */}
        <div style={{
          flex: 1, backgroundColor: "#f9fafb",
          padding: "28px 32px",
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          <div style={{ width: "70px", height: "70px", marginBottom: 12, border: `3px solid ${accent}`, borderRadius: "8px", backgroundColor: accent + "22", display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontWeight: 800, fontSize: 22 }}>
            {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : (initials || "N")}
          </div>
          <h1 style={{
            fontSize: "28px", fontWeight: 900, color: "#111827",
            lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 5,
          }}>
            {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
          </h1>
          {pd.jobTitle && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* small accent line */}
              <div style={{ width: "20px", height: "2px", backgroundColor: accent, flexShrink: 0 }} />
              <p style={{ fontSize: "9.5px", color: "#6b7280", letterSpacing: "0.04em" }}>{pd.jobTitle}</p>
            </div>
          )}
        </div>
        {/* Contact block — right, accent background */}
        <div style={{
          width: "36%", flexShrink: 0,
          backgroundColor: accent,
          padding: "28px 22px",
          display: "flex", flexDirection: "column", gap: 8, justifyContent: "center",
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          <p style={{
            fontSize: "7.5px", fontWeight: 800, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.6)",
            marginBottom: 4,
          }}>
            Contacto
          </p>
          {pd.email    && <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><Mail size={8} color="rgba(255,255,255,0.7)" style={{ marginTop: 1, flexShrink: 0 }} /><span style={{ fontSize: "8px", color: "#fff", wordBreak: "break-all", lineHeight: 1.4 }}>{pd.email}</span></div>}
          {pd.phone    && <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Phone size={8} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8px", color: "#fff" }}>{pd.phone}</span></div>}
          {(pd.city || pd.country) && <div style={{ display: "flex", gap: 8, alignItems: "center" }}><MapPin size={8} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8px", color: "#fff" }}>{[pd.city, pd.country].filter(Boolean).join(", ")}</span></div>}
          {pd.website  && <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Globe size={8} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8px", color: "#fff" }}>{pd.website}</span></div>}
          {pd.linkedin && <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Link2 size={8} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8px", color: "#fff" }}>{pd.linkedin}</span></div>}
          {pd.github   && <div style={{ display: "flex", gap: 8, alignItems: "center" }}><GitFork size={8} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8px", color: "#fff" }}>{pd.github}</span></div>}
        </div>
      </div>

      {/* BODY — two columns */}
      <div style={{ display: "flex", gap: 0 }}>
        {/* LEFT */}
        <div style={{ flex: 1, padding: "24px 28px 28px 32px" }}>
          {visible("summary") && summary && (
            <div style={{ marginBottom: 20 }}>
              <TileHeader title={label("summary")} />
              <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.75 }}>{summary}</p>
            </div>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <TileHeader title={label("workExperience")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {workExperience.map((job, i) => (
                  <div key={job.id} className="resume-entry">
                    {i > 0 && <div style={{ height: "0.5px", backgroundColor: "#f3f4f6", marginBottom: 14 }} />}
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
              <TileHeader title={label("education")} />
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible("projects") && projects.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <TileHeader title={label("projects")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry">
                    <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827", marginBottom: 2 }}>{proj.name}</p>
                    {proj.role && <p style={{ fontSize: "9px", color: accent, fontWeight: 600, marginBottom: 3 }}>{proj.role}</p>}
                    {proj.description && <p className="resume-desc" style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible("volunteer") && volunteer.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <TileHeader title={label("volunteer")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {volunteer.map((vol) => (
                  <div key={vol.id} className="resume-entry">
                    <p style={{ fontWeight: 700, fontSize: "10.5px", color: "#111827" }}>{vol.role}</p>
                    <p style={{ fontSize: "9px", color: accent }}>{vol.organization}</p>
                    {vol.description && <p className="resume-desc" style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65, marginTop: 3 }} dangerouslySetInnerHTML={{ __html: fmtDesc(vol.description) }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible("references") && references.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <TileHeader title={label("references")} />
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

        {/* RIGHT sidebar — light gray */}
        <div style={{
          width: "32%", flexShrink: 0,
          backgroundColor: "#f9fafb",
          padding: "24px 18px 28px",
          borderLeft: "1.5px solid #f3f4f6",
          display: "flex", flexDirection: "column", gap: 18,
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          {/* Skills as chips */}
          {visible("skills") && skills.length > 0 && (
            <div>
              <TileHeader title={label("skills")} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 6px" }}>
                {skills.map((sk) => (
                  <span key={sk.id} style={{
                    fontSize: "8px", fontWeight: 600,
                    color: accent, border: `1.5px solid ${accent}`,
                    padding: "2px 8px", borderRadius: "999px",
                    backgroundColor: "transparent",
                    WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                  }}>
                    {sk.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {visible("languages") && languages.length > 0 && (
            <div>
              <TileHeader title={label("languages")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {languages.map((lang) => (
                  <div key={lang.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: "9px", color: "#374151" }}>{lang.name}</p>
                    <span style={{
                      fontSize: "7px", fontWeight: 800, letterSpacing: "0.05em",
                      color: "#fff", backgroundColor: accent, padding: "1px 5px", borderRadius: "3px",
                      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                    }}>
                      {lang.level.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {visible("certifications") && certifications.length > 0 && (
            <div>
              <TileHeader title={label("certifications")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {certifications.map((cert) => (
                  <div key={cert.id} style={{
                    padding: "6px 8px", borderRadius: "4px",
                    backgroundColor: "#fff", border: "0.5px solid #e5e7eb",
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
