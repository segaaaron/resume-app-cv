"use client"

/**
 * Aurora — Header fluido con ola SVG + columna lateral.
 * SVGs propios: ola de transición, arcos dobles en títulos, puntos timeline.
 * Ideal para creativos, marketing, diseño y comunicación.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

const SKILL_W: Record<string, number> = { beginner: 25, intermediate: 52, advanced: 76, expert: 100 }
const LANG_W: Record<string, number> = { a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100 }

export default function AuroraTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects, hobbies, volunteer,
  } = sectionData
  const color = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const hexToRgb = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  })
  const rgb = color.startsWith("#") ? hexToRgb(color) : { r: 42, g: 114, b: 215 }
  const darker = `rgb(${Math.max(0, rgb.r - 55)},${Math.max(0, rgb.g - 55)},${Math.max(0, rgb.b - 55)})`

  return (
    <div style={{ minHeight: "297mm", backgroundColor: "#fff", fontFamily: "inherit" }}>

      {/* ── HEADER with SVG wave ───────────────────────────────────────────── */}
      <div style={{
        position: "relative",
        background: `linear-gradient(135deg, ${darker} 0%, ${color} 100%)`,
        paddingBottom: "58px",
      }}>
        <div style={{ padding: "28px 32px 0 32px", position: "relative" }}>
          {/* Decorative background bubbles SVG */}
          <svg
            style={{ position: "absolute", top: 0, right: 0, opacity: 0.07, pointerEvents: "none" }}
            width="240" height="150" viewBox="0 0 240 150"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="200" cy="30" r="90" fill="white" />
            <circle cx="90" cy="130" r="55" fill="white" />
            <circle cx="240" cy="120" r="40" fill="white" />
          </svg>

          {[pd.firstName, pd.lastName].filter(Boolean).join(" ") && (
            <h1 style={{
              fontSize: 34, fontWeight: 900, color: "#fff",
              letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: 5, position: "relative",
            }}>
              {[pd.firstName, pd.lastName].filter(Boolean).join(" ")}
            </h1>
          )}
          {pd.jobTitle && (
            <p style={{
              fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.72)",
              letterSpacing: "0.26em", textTransform: "uppercase", marginBottom: 14,
            }}>
              {pd.jobTitle}
            </p>
          )}

          {/* Contact row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 18px", fontSize: "9.5px", color: "rgba(255,255,255,0.62)" }}>
            {pd.email    && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Mail size={9} />{pd.email}</span>}
            {pd.phone    && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Phone size={9} />{pd.phone}</span>}
            {(pd.city || pd.country) && (
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <MapPin size={9} />{[pd.city, pd.country].filter(Boolean).join(", ")}
              </span>
            )}
            {pd.website  && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Globe size={9} />{pd.website}</span>}
            {pd.linkedin && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Link2 size={9} />{pd.linkedin}</span>}
            {pd.github   && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><GitFork size={9} />{pd.github}</span>}
          </div>
        </div>

        {/* ── SVG Wave ── */}
        <svg
          style={{ position: "absolute", bottom: 0, left: 0, width: "100%", display: "block" }}
          viewBox="0 0 794 58" preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Back wave (semi-transparent white) */}
          <path
            d="M0,28 C140,62 260,4 420,36 C560,64 660,14 794,34 L794,58 L0,58 Z"
            fill="rgba(255,255,255,0.18)"
          />
          {/* Front wave (solid white) */}
          <path
            d="M0,38 C120,66 240,12 390,42 C530,68 660,22 794,44 L794,58 L0,58 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", paddingTop: 12 }}>

        {/* Main column */}
        <div style={{ flex: 1, padding: "0 22px 32px 32px" }}>
          {visible("summary") && summary && (
            <AuroraSection title={label("summary")} color={color}>
              <p style={{ fontSize: "10.5px", color: "#555", lineHeight: 1.78 }}>{summary}</p>
            </AuroraSection>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <AuroraSection title={label("workExperience")} color={color}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {workExperience.map((job, idx) => (
                  <div key={job.id} className="resume-entry" style={{ position: "relative", paddingLeft: 16 }}>
                    {/* Timeline connector line */}
                    {idx < workExperience.length - 1 && (
                      <div style={{
                        position: "absolute", left: 4, top: 14, bottom: -12,
                        width: 1, background: `linear-gradient(to bottom, ${color}50, transparent)`,
                      }} />
                    )}
                    {/* SVG bullet — filled circle with inner ring */}
                    <svg style={{ position: "absolute", left: 0, top: 4 }} width="10" height="10" viewBox="0 0 10 10">
                      <circle cx="5" cy="5" r="4" fill={color} />
                      <circle cx="5" cy="5" r="2" fill="white" />
                    </svg>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <p style={{ fontSize: "11px", fontWeight: 700, color: "#1a1a2e" }}>{job.jobTitle}</p>
                      <span style={{ fontSize: "9.5px", color: "#aaa", flexShrink: 0, marginLeft: 8 }}>
                        {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                      </span>
                    </div>
                    <p style={{ fontSize: "10.5px", fontWeight: 600, color, marginBottom: 2 }}>
                      {job.employer}{job.city ? ` · ${job.city}` : ""}
                    </p>
                    {job.description && (
                      <div className="resume-desc"
                        style={{ fontSize: "10.5px", color: "#5a5a6a", lineHeight: 1.65 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </AuroraSection>
          )}

          {visible("education") && education.length > 0 && (
            <AuroraSection title={label("education")} color={color}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry" style={{ paddingLeft: 16, position: "relative" }}>
                    {/* SVG bullet — open circle */}
                    <svg style={{ position: "absolute", left: 0, top: 4 }} width="10" height="10" viewBox="0 0 10 10">
                      <circle cx="5" cy="5" r="4" fill="none" stroke={color} strokeWidth="1.8" />
                    </svg>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <p style={{ fontSize: "11px", fontWeight: 700, color: "#1a1a2e" }}>
                        {edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}
                      </p>
                      <span style={{ fontSize: "9.5px", color: "#aaa", flexShrink: 0, marginLeft: 8 }}>
                        {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                      </span>
                    </div>
                    <p style={{ fontSize: "10.5px", fontWeight: 600, color }}>
                      {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                    </p>
                    {edu.description && (
                      <p style={{ fontSize: "10.5px", color: "#5a5a6a", lineHeight: 1.65 }}>{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </AuroraSection>
          )}

          {visible("projects") && projects.length > 0 && (
            <AuroraSection title={label("projects")} color={color}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry" style={{ paddingLeft: 16, position: "relative" }}>
                    {/* SVG bullet — diamond */}
                    <svg style={{ position: "absolute", left: 0, top: 5 }} width="10" height="10" viewBox="0 0 10 10">
                      <polygon points="5,0 10,5 5,10 0,5" fill={color} />
                    </svg>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#1a1a2e" }}>{proj.name}</p>
                    {proj.role && <p style={{ fontSize: "10.5px", fontWeight: 600, color }}>{proj.role}</p>}
                    {proj.description && (
                      <p style={{ fontSize: "10.5px", color: "#5a5a6a", lineHeight: 1.65 }}>{proj.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </AuroraSection>
          )}

          {visible("volunteer") && volunteer.length > 0 && (
            <AuroraSection title={label("volunteer")} color={color}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {volunteer.map((vol) => (
                  <div key={vol.id} className="resume-entry" style={{ paddingLeft: 16, position: "relative" }}>
                    <svg style={{ position: "absolute", left: 0, top: 4 }} width="10" height="10" viewBox="0 0 10 10">
                      <circle cx="5" cy="5" r="4" fill={color} opacity="0.45" />
                      <circle cx="5" cy="5" r="2" fill={color} />
                    </svg>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <p style={{ fontSize: "11px", fontWeight: 700, color: "#1a1a2e" }}>{vol.role}</p>
                      <span style={{ fontSize: "9.5px", color: "#aaa", flexShrink: 0, marginLeft: 8 }}>
                        {vol.startDate}{vol.endDate ? ` – ${vol.endDate}` : ""}
                      </span>
                    </div>
                    <p style={{ fontSize: "10.5px", fontWeight: 600, color }}>{vol.organization}</p>
                    {vol.description && (
                      <p style={{ fontSize: "10.5px", color: "#5a5a6a", lineHeight: 1.65 }}>{vol.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </AuroraSection>
          )}
        </div>

        {/* Sidebar */}
        <div style={{
          width: "188px", flexShrink: 0, padding: "0 24px 32px 16px",
          borderLeft: `1.5px solid ${color}22`,
        }}>
          {visible("skills") && skills.length > 0 && (
            <AuroraSide title={label("skills")} color={color}>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {skills.map((sk) => (
                  <div key={sk.id}>
                    <span style={{ fontSize: "10px", color: "#444", fontWeight: 500 }}>{sk.name}</span>
                    <div style={{
                      height: 5, borderRadius: 99,
                      backgroundColor: `${color}1a`, overflow: "hidden", marginTop: 3,
                    }}>
                      <div style={{
                        height: "100%", borderRadius: 99,
                        width: `${SKILL_W[sk.level] ?? 55}%`,
                        background: `linear-gradient(to right, ${color}, ${color}bb)`,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </AuroraSide>
          )}

          {visible("languages") && languages.length > 0 && (
            <AuroraSide title={label("languages")} color={color}>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <span style={{ fontSize: "10px", color: "#444", fontWeight: 500 }}>{lang.name}</span>
                    <div style={{
                      height: 5, borderRadius: 99,
                      backgroundColor: `${color}1a`, overflow: "hidden", marginTop: 3,
                    }}>
                      <div style={{
                        height: "100%", borderRadius: 99,
                        width: `${LANG_W[lang.level] ?? 55}%`,
                        background: `linear-gradient(to right, ${color}, ${color}bb)`,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </AuroraSide>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <AuroraSide title={label("certifications")} color={color}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {certifications.map((cert) => (
                  <div key={cert.id} style={{ paddingLeft: 8, borderLeft: `2px solid ${color}` }}>
                    <p style={{ fontSize: "10px", fontWeight: 700, color: "#333", lineHeight: 1.3 }}>{cert.name}</p>
                    {(cert.issuer || cert.date) && (
                      <p style={{ fontSize: "9px", color: "#999" }}>
                        {cert.issuer}{cert.date ? ` · ${cert.date}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </AuroraSide>
          )}

          {visible("hobbies") && hobbies && (
            <AuroraSide title={label("hobbies")} color={color}>
              <p style={{ fontSize: "10px", color: "#555", lineHeight: 1.7 }}>{hobbies}</p>
            </AuroraSide>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function AuroraSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {/* Section title with SVG double-arc accent */}
      <div className="resume-section-title" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,12 Q10,0 20,12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M3,12 Q10,3 17,12" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.35" />
        </svg>
        <span style={{
          fontSize: "9.5px", fontWeight: 900, letterSpacing: "0.26em",
          textTransform: "uppercase", color,
        }}>
          {title}
        </span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${color}50, transparent)` }} />
      </div>
      {children}
    </div>
  )
}

function AuroraSide({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p className="resume-section-title" style={{
        fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.25em",
        textTransform: "uppercase", color, marginBottom: 10,
      }}>
        {title}
      </p>
      {children}
    </div>
  )
}
