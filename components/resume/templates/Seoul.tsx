"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function SeoulTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const nearBlack = "#1C1C1E"

  // Color-coded contact indicators (colored dot per contact type)
  const contactIndicators: Record<string, string> = {
    email: "#22c55e",   // green
    phone: "#3b82f6",   // blue
    address: "#f59e0b", // amber
    website: "#8b5cf6", // purple
    linkedin: "#0ea5e9", // sky
    github: "#6b7280",   // gray
  }

  // Diamond divider for sections in main body
  const DiamondDivider = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <polygon points="5,1 9,5 5,9 1,5" fill={accent} opacity="0.7" />
    </svg>
  )

  const MainSectionHeader = ({ title }: { title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <DiamondDivider />
      <h2 style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#1f2937" }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
    </div>
  )

  return (
    <div data-print-layout="sidebar-left" style={{ display: "flex", minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#FAFAFA" }}>
      {/* LEFT SIDEBAR — near-black with subtle dot grid texture */}
      <div style={{
        width: "30%", flexShrink: 0,
        backgroundColor: nearBlack,
        padding: "28px 16px",
        display: "flex", flexDirection: "column",
        position: "relative", overflow: "hidden",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        {/* SVG dot grid texture pattern */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.12, pointerEvents: "none" }}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="dotgrid" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="6" cy="6" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotgrid)" />
        </svg>

        {/* Photo */}
        {config.photoUrl && (
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            overflow: "hidden", flexShrink: 0,
            border: "4px solid rgba(255,255,255,0.2)",
            marginBottom: 14, alignSelf: "center",
            position: "relative", zIndex: 1,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%` }} />
          </div>
        )}

        {/* Name */}
        <div style={{ textAlign: "center", marginBottom: 20, position: "relative", zIndex: 1 }}>
          <h1 style={{ fontWeight: 700, fontSize: "15px", color: "#fff", lineHeight: 1.2 }}>
            {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
          </h1>
          {pd.jobTitle && (
            <p style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.6)", marginTop: 4, letterSpacing: "0.06em" }}>
              {pd.jobTitle}
            </p>
          )}
        </div>

        {/* Contact with colored dot indicators */}
        <div style={{ marginBottom: 18, position: "relative", zIndex: 1 }}>
          <p style={{
            fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.4)",
            marginBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 4,
          }}>Contacto</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {pd.email    && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: contactIndicators.email, flexShrink: 0 }} />
              <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.75)", wordBreak: "break-all" }}>{pd.email}</span>
            </div>}
            {pd.phone    && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: contactIndicators.phone, flexShrink: 0 }} />
              <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.75)" }}>{pd.phone}</span>
            </div>}
            {(pd.city || pd.country) && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: contactIndicators.address, flexShrink: 0 }} />
              <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.75)" }}>{[pd.city, pd.country].filter(Boolean).join(", ")}</span>
            </div>}
            {pd.website  && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: contactIndicators.website, flexShrink: 0 }} />
              <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.75)" }}>{pd.website}</span>
            </div>}
            {pd.linkedin && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: contactIndicators.linkedin, flexShrink: 0 }} />
              <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.75)" }}>{pd.linkedin}</span>
            </div>}
            {pd.github   && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: contactIndicators.github, flexShrink: 0 }} />
              <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.75)" }}>{pd.github}</span>
            </div>}
          </div>
        </div>

        {/* Skills */}
        {visible("skills") && skills.length > 0 && (
          <div style={{ marginBottom: 16, position: "relative", zIndex: 1 }}>
            <p style={{
              fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.18em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.4)",
              marginBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 4,
            }}>{label("skills")}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {skills.map((sk) => (
                <span key={sk.id} style={{
                  fontSize: "8px", color: "rgba(255,255,255,0.8)",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 3, padding: "2px 6px",
                  border: `1px solid rgba(255,255,255,0.15)`,
                }}>
                  {sk.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {visible("languages") && languages.length > 0 && (
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{
              fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.18em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.4)",
              marginBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 4,
            }}>{label("languages")}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {languages.map((lang) => (
                <div key={lang.id} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.8)" }}>{lang.name}</span>
                  <span style={{ fontSize: "7.5px", color: accent }}>{lang.level.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT MAIN */}
      <div style={{ flex: 1, padding: "28px 26px", backgroundColor: "#FAFAFA", display: "flex", flexDirection: "column" }}>
        {/* Summary */}
        {visible("summary") && summary && (
          <div style={{ marginBottom: 18 }}>
            <MainSectionHeader title={label("summary")} />
            <p style={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.7 }}>{summary}</p>
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

        {/* Projects */}
        {visible("projects") && projects.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <MainSectionHeader title={label("projects")} />
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
