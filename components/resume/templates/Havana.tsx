"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

const SKILL_W: Record<string, string> = { beginner: "22%", intermediate: "50%", advanced: "75%", expert: "100%" }
const LANG_W: Record<string, string> = { a1: "17%", a2: "33%", b1: "50%", b2: "67%", c1: "83%", c2: "100%", native: "100%" }

export default function HavanaTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const SideSection = ({ title }: { title: string }) => (
    <p style={{
      color: "rgba(255,255,255,0.6)", fontSize: "7.5px",
      letterSpacing: "0.18em", textTransform: "uppercase",
      marginBottom: 8, fontWeight: 700,
      borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: 4,
    }}>
      {title}
    </p>
  )

  const MainSectionHeader = ({ title }: { title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <div style={{ width: 6, height: 6, backgroundColor: accent, borderRadius: "50%", flexShrink: 0 }} />
      <h2 style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1f2937" }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
    </div>
  )

  return (
    <div style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>
      {/* Full-width name band above both columns */}
      <div style={{
        backgroundColor: accent, padding: "14px 0",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <div style={{ paddingLeft: "calc(38% + 28px)" }}>
          <h1 style={{
            fontWeight: 800, fontSize: "22px", color: "#fff",
            lineHeight: 1.1, letterSpacing: "0.03em",
          }}>
            {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
          </h1>
          {pd.jobTitle && (
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "9.5px", marginTop: 2, letterSpacing: "0.06em" }}>
              {pd.jobTitle}
            </p>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "flex", minHeight: "calc(297mm - 62px)" }}>
        {/* LEFT SIDEBAR — terracota/accent 38% */}
        <div style={{
          width: "38%", flexShrink: 0,
          backgroundColor: accent,
          padding: "24px 20px",
          display: "flex", flexDirection: "column",
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          {/* Photo circular with white border */}
          {config.photoUrl && (
            <div style={{
              width: 90, height: 90, borderRadius: "50%",
              overflow: "hidden", flexShrink: 0,
              border: "4px solid rgba(255,255,255,0.85)",
              marginBottom: 16, alignSelf: "center",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%` }} />
            </div>
          )}

          {/* Contact */}
          <div style={{ marginBottom: 16 }}>
            <SideSection title="Contacto" />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {pd.email    && <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}><Mail size={9} color="rgba(255,255,255,0.75)" /><span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.85)", wordBreak: "break-all", lineHeight: 1.4 }}>{pd.email}</span></div>}
              {pd.phone    && <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}><Phone size={9} color="rgba(255,255,255,0.75)" /><span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.85)" }}>{pd.phone}</span></div>}
              {(pd.city || pd.country) && <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}><MapPin size={9} color="rgba(255,255,255,0.75)" /><span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.85)" }}>{[pd.city, pd.country].filter(Boolean).join(", ")}</span></div>}
              {pd.website  && <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}><Globe size={9} color="rgba(255,255,255,0.75)" /><span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.85)" }}>{pd.website}</span></div>}
              {pd.linkedin && <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}><Link2 size={9} color="rgba(255,255,255,0.75)" /><span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.85)" }}>{pd.linkedin}</span></div>}
              {pd.github   && <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}><GitFork size={9} color="rgba(255,255,255,0.75)" /><span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.85)" }}>{pd.github}</span></div>}
            </div>
          </div>

          {/* Skills */}
          {visible("skills") && skills.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <SideSection title={label("skills")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {skills.map((sk) => (
                  <div key={sk.id}>
                    <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.9)", marginBottom: 3 }}>{sk.name}</p>
                    <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: SKILL_W[sk.level] ?? "55%", backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {visible("languages") && languages.length > 0 && (
            <div>
              <SideSection title={label("languages")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.9)", marginBottom: 3 }}>{lang.name}</p>
                    <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: LANG_W[lang.level] ?? "55%", backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT MAIN */}
        <div style={{ flex: 1, padding: "24px 26px", display: "flex", flexDirection: "column" }}>
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
                      <div style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.65 }}
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
    </div>
  )
}
