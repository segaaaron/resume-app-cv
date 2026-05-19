"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

const SKILL_W: Record<string, string> = { beginner: "22%", intermediate: "50%", advanced: "75%", expert: "100%" }
const LANG_W: Record<string, string> = { a1: "17%", a2: "33%", b1: "50%", b2: "67%", c1: "83%", c2: "100%", native: "100%" }

export default function LisbonTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects, volunteer, references } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  // Darker shade of accent for gradient
  const darkerAccent = accent + "CC"

  // Custom filled geometric SVG icons per section type
  const BriefcaseIcon = () => (
    <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
      <rect x="1" y="4" width="9" height="6" rx="1" fill={accent} />
      <path d="M3.5,4 V2.5 Q3.5,1.5 5.5,1.5 Q7.5,1.5 7.5,2.5 V4" fill={accent} />
      <rect x="0.5" y="6" width="10" height="0.8" fill="rgba(255,255,255,0.3)" />
    </svg>
  )
  const GradCapIcon = () => (
    <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
      <polygon points="5.5,1 10.5,4 5.5,7 0.5,4" fill={accent} />
      <path d="M8.5,5 V8.5" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2.5,5.5 V8 Q5.5,9.5 8.5,8 V5.5" fill={accent} opacity="0.7" />
    </svg>
  )
  const StarIconFilled = () => (
    <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
      <polygon points="5.5,1 6.8,4 10.5,4 7.5,6.5 8.5,10 5.5,8 2.5,10 3.5,6.5 0.5,4 4.2,4" fill={accent} />
    </svg>
  )
  const GlobeIconFilled = () => (
    <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
      <circle cx="5.5" cy="5.5" r="4.5" fill={accent} opacity="0.15" />
      <circle cx="5.5" cy="5.5" r="4.5" fill="none" stroke={accent} strokeWidth="1.2" />
      <ellipse cx="5.5" cy="5.5" rx="2" ry="4.5" fill="none" stroke={accent} strokeWidth="1" />
      <line x1="1" y1="5.5" x2="10" y2="5.5" stroke={accent} strokeWidth="1" />
    </svg>
  )
  const FolderIcon = () => (
    <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
      <path d="M1,3 Q1,2 2,2 L4,2 L5,3 L9,3 Q10,3 10,4 L10,9 Q10,10 9,10 L2,10 Q1,10 1,9 Z" fill={accent} />
    </svg>
  )
  const CertIconFilled = () => (
    <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
      <circle cx="5.5" cy="4.5" r="3" fill={accent} />
      <path d="M3.5,7 L3,10 L5.5,8.5 L8,10 L7.5,7" fill={accent} opacity="0.7" />
    </svg>
  )

  const SideSection = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {icon}
        <p style={{
          color: "#fff", fontSize: "8px", fontWeight: 700,
          letterSpacing: "0.18em", textTransform: "uppercase",
        }}>
          {title}
        </p>
      </div>
    </div>
  )

  const MainSectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      {icon}
      <h2 style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#1f2937" }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
    </div>
  )

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>
      {/* Full-width gradient header */}
      <div style={{
        background: `linear-gradient(135deg, ${accent} 0%, ${darkerAccent} 100%)`,
        padding: "24px 0 0 0",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <div style={{ display: "flex" }}>
          {/* Sidebar header portion */}
          <div style={{ width: "36%", padding: "0 20px 24px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Hexagonal initials */}
            {(() => {
              const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
              return (
                <div style={{
                  width: 80, height: 80, marginBottom: 10,
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  flexShrink: 0, backgroundColor: "rgba(255,255,255,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : <span style={{ color: "#fff", fontWeight: 900, fontSize: 24 }}>{initials || "N"}</span>}
                </div>
              )
            })()}
          </div>
          {/* Main header portion */}
          <div style={{ flex: 1, padding: "0 28px 24px 0", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h1 style={{ fontWeight: 800, fontSize: "24px", color: "#fff", lineHeight: 1.1, marginBottom: 4 }}>
              {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
            </h1>
            {pd.jobTitle && (
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "10px", letterSpacing: "0.08em", marginBottom: 0 }}>
                {pd.jobTitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ display: "flex", minHeight: "calc(297mm - 100px)" }}>
        {/* LEFT SIDEBAR */}
        <div style={{
          width: "36%", flexShrink: 0,
          backgroundColor: accent,
          padding: "20px 20px",
          display: "flex", flexDirection: "column",
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          {/* Contact */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {pd.email    && <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}><Mail size={9} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8.5px", color: "#fff", opacity: 0.85, wordBreak: "break-all", lineHeight: 1.4 }}>{pd.email}</span></div>}
              {pd.phone    && <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}><Phone size={9} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8.5px", color: "#fff", opacity: 0.85 }}>{pd.phone}</span></div>}
              {(pd.city || pd.country) && <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}><MapPin size={9} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8.5px", color: "#fff", opacity: 0.85 }}>{[pd.city, pd.country].filter(Boolean).join(", ")}</span></div>}
              {pd.website  && <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}><Globe size={9} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8.5px", color: "#fff", opacity: 0.85 }}>{pd.website}</span></div>}
              {pd.linkedin && <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}><Link2 size={9} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8.5px", color: "#fff", opacity: 0.85 }}>{pd.linkedin}</span></div>}
              {pd.github   && <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}><GitFork size={9} color="rgba(255,255,255,0.7)" /><span style={{ fontSize: "8.5px", color: "#fff", opacity: 0.85 }}>{pd.github}</span></div>}
            </div>
          </div>

          <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.3)", marginBottom: 16 }} />

          {/* Skills */}
          {visible("skills") && skills.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <SideSection title={label("skills")} icon={<StarIconFilled />} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {skills.map((sk) => (
                  <div key={sk.id}>
                    <p style={{ fontSize: "9px", color: "#fff", opacity: 0.9, marginBottom: 3 }}>{sk.name}</p>
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
            <div style={{ marginBottom: 16 }}>
              <SideSection title={label("languages")} icon={<GlobeIconFilled />} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <p style={{ fontSize: "9px", color: "#fff", opacity: 0.9, marginBottom: 3 }}>{lang.name}</p>
                    <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: LANG_W[lang.level] ?? "55%", backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {visible("certifications") && certifications.length > 0 && (
            <div>
              <SideSection title={label("certifications")} icon={<CertIconFilled />} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <p style={{ fontSize: "9px", fontWeight: 600, color: "#fff", opacity: 0.9 }}>{cert.name}</p>
                    {(cert.issuer || cert.date) && <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.6)" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT MAIN */}
        <div style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column" }}>
          {/* Summary */}
          {visible("summary") && summary && (
            <div style={{ marginBottom: 18 }}>
              <MainSectionHeader title={label("summary")} icon={<StarIconFilled />} />
              <p style={{ fontSize: "10px", color: "#4b5563", lineHeight: 1.7 }}>{summary}</p>
            </div>
          )}

          {/* Work Experience */}
          {visible("workExperience") && workExperience.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <MainSectionHeader title={label("workExperience")} icon={<BriefcaseIcon />} />
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
              <MainSectionHeader title={label("education")} icon={<GradCapIcon />} />
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
                    {edu.description && <p style={{ fontSize: "9px", color: "#6b7280", marginTop: 3 }}>{edu.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {visible("projects") && projects.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <MainSectionHeader title={label("projects")} icon={<FolderIcon />} />
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
              <MainSectionHeader title={label("volunteer")} icon={<StarIconFilled />} />
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
              <MainSectionHeader title={label("references")} icon={<StarIconFilled />} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
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
