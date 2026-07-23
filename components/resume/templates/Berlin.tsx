"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

export default function BerlinTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const mono = "'Courier New', Courier, monospace"

  const SectionHeader = ({ id, title }: { id: string; title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      <SectionIcon sectionId={id} color={accent} size={12} strokeWidth={2.25} />
      <h2 style={{
        fontFamily: mono, fontWeight: 700, fontSize: "9.5px",
        letterSpacing: "0.18em", textTransform: "uppercase", color: "#111827",
      }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb", marginLeft: 4 }} />
    </div>
  )

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: mono, backgroundColor: "#fff", padding: "36px 44px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: mono, fontWeight: 700, fontSize: "24px",
          color: "#111827", lineHeight: 1.1, marginBottom: 2,
          letterSpacing: "-0.01em",
        }}>
          {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "your.name"}
        </h1>
        {pd.jobTitle && (
          <p style={{ fontFamily: mono, fontSize: "10px", color: accent, marginBottom: 10, letterSpacing: "0.04em" }}>
            {`// ${pd.jobTitle}`}
          </p>
        )}
        {/* Initials circle */}
        {(() => {
          const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
          return (
            <div style={{ width: 70, height: 70, borderRadius: "50%", border: `2px solid ${accent}`, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${accent}18` }}>
              {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ fontFamily: mono, fontWeight: 700, fontSize: "20px", color: accent }}>{initials || "N"}</span>}
            </div>
          )
        })()}
        {/* Contact row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
          {pd.email    && <span style={{ fontFamily: mono, fontSize: "8px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Mail size={8} color={accent} />{pd.email}</span>}
          {pd.phone    && <span style={{ fontFamily: mono, fontSize: "8px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Phone size={8} color={accent} />{pd.phone}</span>}
          {(pd.city || pd.country) && <span style={{ fontFamily: mono, fontSize: "8px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><MapPin size={8} color={accent} />{[pd.city, pd.country].filter(Boolean).join(", ")}</span>}
          {pd.website  && <span style={{ fontFamily: mono, fontSize: "8px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Globe size={8} color={accent} />{pd.website}</span>}
          {pd.linkedin && <span style={{ fontFamily: mono, fontSize: "8px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><Link2 size={8} color={accent} />{pd.linkedin}</span>}
          {pd.github   && <span style={{ fontFamily: mono, fontSize: "8px", color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}><GitFork size={8} color={accent} />{pd.github}</span>}
        </div>
        <div style={{ width: "100%", height: "1px", backgroundColor: "#e5e7eb", marginTop: 14 }} />
      </div>

      {/* Summary */}
      {visible("summary") && summary && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader id="summary" title={label("summary")} />
          <p style={{ fontFamily: mono, fontSize: "9.5px", color: "#4b5563", lineHeight: 1.75 }}>{summary}</p>
        </div>
      )}

      {/* Work Experience */}
      {visible("workExperience") && workExperience.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader id="workExperience" title={label("workExperience")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {workExperience.map((job) => (
              <div key={job.id} className="resume-entry">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                  <p style={{ fontFamily: mono, fontWeight: 700, fontSize: "10px", color: "#111827" }}>{job.jobTitle}</p>
                  <span style={{ fontFamily: mono, fontSize: "8px", color: "#9ca3af" }}>
                    {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                  </span>
                </div>
                <p style={{ fontFamily: mono, fontSize: "9px", color: accent, marginBottom: 5 }}>
                  {job.employer}{job.city ? `, ${job.city}` : ""}
                </p>
                {job.description && (
                  <div className="resume-desc" style={{ fontFamily: mono, fontSize: "9px", color: "#4b5563", lineHeight: 1.7 }}
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
          <SectionHeader id="education" title={label("education")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {education.map((edu) => (
              <div key={edu.id} className="resume-entry">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{ fontFamily: mono, fontWeight: 700, fontSize: "10px", color: "#111827" }}>
                    {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                  </p>
                  <span style={{ fontFamily: mono, fontSize: "8px", color: "#9ca3af" }}>
                    {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                  </span>
                </div>
                <p style={{ fontFamily: mono, fontSize: "9px", color: accent }}>
                  {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills as tag chips with border */}
      {visible("skills") && skills.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader id="skills" title={label("skills")} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 8px" }}>
            {skills.map((sk) => (
              <span key={sk.id} style={{
                fontFamily: mono, fontSize: "8.5px", color: accent,
                border: `1px solid ${accent}`, borderRadius: 2,
                padding: "2px 8px",
              }}>
                {sk.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {visible("languages") && languages.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader id="languages" title={label("languages")} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 16px" }}>
            {languages.map((lang) => (
              <span key={lang.id} style={{ fontFamily: mono, fontSize: "9px", color: "#374151" }}>
                {lang.name} <span style={{ color: accent }}>@</span> <span style={{ color: "#9ca3af" }}>{lang.level}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {visible("certifications") && certifications.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader id="certifications" title={label("certifications")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {certifications.map((cert) => (
              <div key={cert.id} className="resume-entry" style={{ display: "flex", gap: 8 }}>
                <span style={{ fontFamily: mono, color: accent, fontSize: "9px" }}>—</span>
                <div>
                  <p style={{ fontFamily: mono, fontWeight: 700, fontSize: "9.5px", color: "#111827" }}>{cert.name}</p>
                  {(cert.issuer || cert.date) && <p style={{ fontFamily: mono, fontSize: "8.5px", color: "#6b7280" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {visible("projects") && projects.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader id="projects" title={label("projects")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {projects.map((proj) => (
              <div key={proj.id} className="resume-entry">
                <p style={{ fontFamily: mono, fontWeight: 700, fontSize: "10px", color: "#111827", marginBottom: 2 }}>
                  {`[${proj.name}]`}
                </p>
                {proj.role && <p style={{ fontFamily: mono, fontSize: "9px", color: accent, marginBottom: 3 }}>{proj.role}</p>}
                {proj.description && <p style={{ fontFamily: mono, fontSize: "9px", color: "#4b5563", lineHeight: 1.65 }}>{proj.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volunteer */}
      {visible("volunteer") && volunteer.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader id="volunteer" title={label("volunteer")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {volunteer.map((vol) => (
              <div key={vol.id} className="resume-entry">
                <p style={{ fontFamily: mono, fontWeight: 700, fontSize: "10px", color: "#111827" }}>{vol.role}</p>
                <p style={{ fontFamily: mono, fontSize: "9px", color: accent }}>{vol.organization}</p>
                {vol.description && <p style={{ fontFamily: mono, fontSize: "9px", color: "#4b5563", lineHeight: 1.65, marginTop: 3 }}>{vol.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {visible("references") && references.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader id="references" title={label("references")} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {references.map((ref) => (
              <div key={ref.id} style={{ minWidth: 140 }}>
                <p style={{ fontFamily: mono, fontWeight: 700, fontSize: "9.5px", color: "#111827" }}>{ref.name}</p>
                {ref.company && <p style={{ fontFamily: mono, fontSize: "8.5px", color: accent }}>{ref.company}</p>}
                {ref.phone && <p style={{ fontFamily: mono, fontSize: "8.5px", color: "#6b7280" }}>{ref.phone}</p>}
                {ref.email && <p style={{ fontFamily: mono, fontSize: "8.5px", color: "#6b7280" }}>{ref.email}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
