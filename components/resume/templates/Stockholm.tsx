"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

const SKILL_PCT: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }
const LANG_PCT: Record<string, number> = { a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100 }

export default function StockholmTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const skyBlue = accent
  const sidebarBg = "#F3F4F6"

  const SideSectionTitle = ({ title }: { title: string }) => (
    <p style={{
      fontSize: "8px", fontWeight: 700, letterSpacing: "0.18em",
      textTransform: "uppercase", color: skyBlue,
      marginBottom: 8,
      borderBottom: `1.5px solid ${skyBlue}`,
      paddingBottom: 4,
    }}>
      {title}
    </p>
  )

  const MainSectionHeader = ({ title }: { title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: skyBlue, flexShrink: 0 }} />
      <h2 style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#1f2937" }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
    </div>
  )

  const ProgressBar = ({ pct, label: barLabel }: { pct: number; label: string }) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: "9px", color: "#374151" }}>{barLabel}</span>
        <span style={{ fontSize: "8px", color: skyBlue, fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: "5px", backgroundColor: "#e5e7eb", borderRadius: 3 }}>
        <div style={{
          height: "100%", width: `${pct}%`, backgroundColor: skyBlue,
          borderRadius: 3,
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }} />
      </div>
    </div>
  )

  return (
    <div data-print-layout="sidebar-left" style={{ display: "flex", minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>
      {/* LEFT SIDEBAR */}
      <div style={{
        width: "40%", flexShrink: 0,
        backgroundColor: sidebarBg,
        padding: "28px 20px",
        display: "flex", flexDirection: "column",
      }}>
        {/* Photo */}
        {config.photoUrl && (
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            overflow: "hidden", border: `3px solid ${skyBlue}`,
            marginBottom: 16, alignSelf: "center", flexShrink: 0,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%` }} />
          </div>
        )}

        {/* Contact */}
        <div style={{ marginBottom: 18 }}>
          <SideSectionTitle title="Contacto" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pd.email    && <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}><Mail size={9} color={skyBlue} /><span style={{ fontSize: "8.5px", color: "#4b5563", wordBreak: "break-all" }}>{pd.email}</span></div>}
            {pd.phone    && <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}><Phone size={9} color={skyBlue} /><span style={{ fontSize: "8.5px", color: "#4b5563" }}>{pd.phone}</span></div>}
            {(pd.city || pd.country) && <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}><MapPin size={9} color={skyBlue} /><span style={{ fontSize: "8.5px", color: "#4b5563" }}>{[pd.city, pd.country].filter(Boolean).join(", ")}</span></div>}
            {pd.website  && <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}><Globe size={9} color={skyBlue} /><span style={{ fontSize: "8.5px", color: "#4b5563" }}>{pd.website}</span></div>}
            {pd.linkedin && <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}><Link2 size={9} color={skyBlue} /><span style={{ fontSize: "8.5px", color: "#4b5563" }}>{pd.linkedin}</span></div>}
            {pd.github   && <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}><GitFork size={9} color={skyBlue} /><span style={{ fontSize: "8.5px", color: "#4b5563" }}>{pd.github}</span></div>}
          </div>
        </div>

        {/* Skills with labeled progress bars */}
        {visible("skills") && skills.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SideSectionTitle title={label("skills")} />
            {skills.map((sk) => (
              <ProgressBar key={sk.id} pct={SKILL_PCT[sk.level] ?? 55} label={sk.name} />
            ))}
          </div>
        )}

        {/* Languages with progress bars */}
        {visible("languages") && languages.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SideSectionTitle title={label("languages")} />
            {languages.map((lang) => (
              <ProgressBar key={lang.id} pct={LANG_PCT[lang.level] ?? 55} label={lang.name} />
            ))}
          </div>
        )}

        {/* Certifications */}
        {visible("certifications") && certifications.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SideSectionTitle title={label("certifications")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p style={{ fontSize: "9px", fontWeight: 600, color: "#374151" }}>{cert.name}</p>
                  {(cert.issuer || cert.date) && <p style={{ fontSize: "8px", color: "#9ca3af" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT MAIN */}
      <div style={{ flex: 1, padding: "28px 26px", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontWeight: 800, fontSize: "24px", color: "#111827", lineHeight: 1.1, marginBottom: 4 }}>
            {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
          </h1>
          {pd.jobTitle && (
            <p style={{ fontSize: "10.5px", color: skyBlue, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>
              {pd.jobTitle}
            </p>
          )}
          <div style={{ height: "2px", backgroundColor: skyBlue, width: "60px" }} />
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
                  <p style={{ fontSize: "9.5px", color: skyBlue, fontWeight: 600, marginBottom: 5 }}>
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
                  <p style={{ fontSize: "9.5px", color: skyBlue, fontWeight: 600 }}>
                    {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                  </p>
                  {edu.description && <p style={{ fontSize: "9px", color: "#6b7280", marginTop: 3 }}>{edu.description}</p>}
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
                  {proj.role && <p style={{ fontSize: "9.5px", color: skyBlue, fontWeight: 600, marginBottom: 3 }}>{proj.role}</p>}
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
                  <p style={{ fontSize: "9.5px", color: skyBlue, fontWeight: 600 }}>{vol.organization}</p>
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
                  {ref.company && <p style={{ fontSize: "9px", color: skyBlue }}>{ref.company}</p>}
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
