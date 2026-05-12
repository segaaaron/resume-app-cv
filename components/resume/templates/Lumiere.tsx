"use client"

/**
 * Lumière — Art Deco de lujo con ornamentos SVG simétricos.
 * SVGs propios: flourishes curvos en nombre, divisores diamante, corner brackets, rating diamonds.
 * Ideal para ejecutivos, directivos, abogados, finanzas, roles de alta dirección.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

const SKILL_W: Record<string, number> = { beginner: 25, intermediate: 52, advanced: 76, expert: 100 }
const LANG_W:  Record<string, number> = { a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100 }

/* Art Deco ornamental divider SVG */
function OrnamentDivider({ color, width = 380 }: { color: string; width?: number }) {
  const cx = width / 2
  return (
    <svg width={width} height="20" viewBox={`0 0 ${width} 20`} xmlns="http://www.w3.org/2000/svg">
      {/* Main center line */}
      <line x1="0" y1="10" x2={cx - 24} y2="10" stroke={color} strokeWidth="0.5" opacity="0.35" />
      <line x1={cx + 24} y1="10" x2={width} y2="10" stroke={color} strokeWidth="0.5" opacity="0.35" />
      {/* Serif ticks left */}
      <line x1="0" y1="7" x2="18" y2="7" stroke={color} strokeWidth="0.4" opacity="0.2" />
      <line x1="0" y1="13" x2="18" y2="13" stroke={color} strokeWidth="0.4" opacity="0.2" />
      {/* Serif ticks right */}
      <line x1={width - 18} y1="7" x2={width} y2="7" stroke={color} strokeWidth="0.4" opacity="0.2" />
      <line x1={width - 18} y1="13" x2={width} y2="13" stroke={color} strokeWidth="0.4" opacity="0.2" />
      {/* Side diamonds */}
      <polygon points={`${cx - 20},10 ${cx - 12},5 ${cx - 4},10 ${cx - 12},15`} fill="none" stroke={color} strokeWidth="0.7" opacity="0.45" />
      {/* Center diamond (filled) */}
      <polygon points={`${cx},4 ${cx + 8},10 ${cx},16 ${cx - 8},10`} fill={color} opacity="0.85" />
      {/* Right mirror diamonds */}
      <polygon points={`${cx + 4},10 ${cx + 12},5 ${cx + 20},10 ${cx + 12},15`} fill="none" stroke={color} strokeWidth="0.7" opacity="0.45" />
    </svg>
  )
}

/* Section ornament SVG */
function DiamondOrnament({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <polygon points="7,0 14,7 7,14 0,7" fill="none" stroke={color} strokeWidth="1" />
      <polygon points="7,3 11,7 7,11 3,7" fill={color} />
    </svg>
  )
}

export default function LumiereTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects, hobbies, volunteer,
  } = sectionData
  const color   = config.colorScheme
  const label   = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", backgroundColor: "#faf9f7", fontFamily: "inherit" }}>

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div style={{
        padding: "32px 44px 24px 44px",
        textAlign: "center",
        backgroundColor: "#fff",
        borderBottom: `1px solid ${color}1a`,
      }}>
        {/* Top corner bracket ornament */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <svg width="340" height="26" viewBox="0 0 340 26" xmlns="http://www.w3.org/2000/svg">
            {/* Left corner bracket */}
            <path d="M0,26 L0,8 L18,8" fill="none" stroke={color} strokeWidth="1.8" opacity="0.55" strokeLinecap="square" />
            {/* Right corner bracket */}
            <path d="M340,26 L340,8 L322,8" fill="none" stroke={color} strokeWidth="1.8" opacity="0.55" strokeLinecap="square" />
            {/* Top decoration */}
            <line x1="24" y1="8" x2="148" y2="8" stroke={color} strokeWidth="0.4" opacity="0.28" />
            <line x1="192" y1="8" x2="316" y2="8" stroke={color} strokeWidth="0.4" opacity="0.28" />
            {/* Center diamond cluster at top */}
            <polygon points="170,2 178,8 170,14 162,8" fill={color} opacity="0.75" />
            {/* Small accent dots */}
            <circle cx="150" cy="8" r="2" fill={color} opacity="0.4" />
            <circle cx="190" cy="8" r="2" fill={color} opacity="0.4" />
          </svg>
        </div>

        {/* Name with symmetric SVG flourishes */}
        {[pd.firstName, pd.lastName].filter(Boolean).join(" ") && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 8 }}>
            {/* Left flourish */}
            <svg width="44" height="32" viewBox="0 0 44 32" xmlns="http://www.w3.org/2000/svg">
              <path d="M40,30 Q22,28 10,18 Q2,10 6,3" fill="none" stroke={color} strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
              <path d="M44,26 Q28,24 18,16" fill="none" stroke={color} strokeWidth="0.5" opacity="0.28" strokeLinecap="round" />
              <circle cx="6" cy="3" r="2.5" fill={color} opacity="0.5" />
              <circle cx="44" cy="26" r="1.5" fill={color} opacity="0.3" />
            </svg>

            <h1 style={{
              fontSize: 32, fontWeight: 800,
              color: "#1a1a1a", letterSpacing: "0.12em",
              textTransform: "uppercase", lineHeight: 1,
            }}>
              <span style={{ fontWeight: 800 }}>{pd.firstName?.toUpperCase()}</span>
              {pd.firstName && pd.lastName ? " " : ""}
              <span style={{ fontWeight: 200, letterSpacing: "0.18em" }}>{pd.lastName?.toUpperCase()}</span>
            </h1>

            {/* Right flourish (mirrored) */}
            <svg width="44" height="32" viewBox="0 0 44 32" xmlns="http://www.w3.org/2000/svg" style={{ transform: "scaleX(-1)" }}>
              <path d="M40,30 Q22,28 10,18 Q2,10 6,3" fill="none" stroke={color} strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
              <path d="M44,26 Q28,24 18,16" fill="none" stroke={color} strokeWidth="0.5" opacity="0.28" strokeLinecap="round" />
              <circle cx="6" cy="3" r="2.5" fill={color} opacity="0.5" />
              <circle cx="44" cy="26" r="1.5" fill={color} opacity="0.3" />
            </svg>
          </div>
        )}

        {pd.jobTitle && (
          <p style={{
            fontSize: 10.5, fontWeight: 400, color: "#999",
            letterSpacing: "0.42em", textTransform: "uppercase", marginBottom: 18,
          }}>
            {pd.jobTitle}
          </p>
        )}

        {/* Ornamental divider */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <OrnamentDivider color={color} width={380} />
        </div>

        {/* Contact info */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "5px 20px", fontSize: "9.5px", color: "#777" }}>
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

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", paddingTop: 22 }}>

        {/* Main column */}
        <div style={{ flex: 1, padding: "0 28px 32px 44px" }}>
          {visible("summary") && summary && (
            <LumiereSection title={label("summary")} color={color}>
              <p style={{ fontSize: "10.5px", color: "#606060", lineHeight: 1.82, fontStyle: "italic", textAlign: "center" }}>
                &ldquo;{summary}&rdquo;
              </p>
            </LumiereSection>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <LumiereSection title={label("workExperience")} color={color}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {workExperience.map((job) => (
                  <div key={job.id} className="resume-entry">
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "baseline",
                      borderBottom: `0.5px solid ${color}1a`, paddingBottom: 4, marginBottom: 5,
                    }}>
                      <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "0.02em" }}>
                        {job.jobTitle}
                      </p>
                      <span style={{ fontSize: "9.5px", color: "#aaa", fontStyle: "italic", flexShrink: 0, marginLeft: 8 }}>
                        {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                      </span>
                    </div>
                    <p style={{ fontSize: "10.5px", fontWeight: 600, color, marginBottom: 4, letterSpacing: "0.04em" }}>
                      {job.employer}{job.city ? ` · ${job.city}` : ""}
                    </p>
                    {job.description && (
                      <div className="resume-desc"
                        style={{ fontSize: "10.5px", color: "#5a5a6a", lineHeight: 1.72 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </LumiereSection>
          )}

          {visible("education") && education.length > 0 && (
            <LumiereSection title={label("education")} color={color}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <p style={{ fontSize: "11px", fontWeight: 700, color: "#1a1a1a" }}>
                        {edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}
                      </p>
                      <span style={{ fontSize: "9.5px", color: "#aaa", fontStyle: "italic", flexShrink: 0, marginLeft: 8 }}>
                        {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                      </span>
                    </div>
                    <p style={{ fontSize: "10.5px", fontWeight: 600, color }}>
                      {edu.institution}{edu.city ? `, ${edu.city}` : ""}
                    </p>
                    {edu.description && (
                      <p className="resume-desc" style={{ fontSize: "10.5px", color: "#5a5a6a", lineHeight: 1.72 }} dangerouslySetInnerHTML={{ __html: fmtDesc(edu.description) }} />
                    )}
                  </div>
                ))}
              </div>
            </LumiereSection>
          )}

          {visible("projects") && projects.length > 0 && (
            <LumiereSection title={label("projects")} color={color}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry">
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#1a1a1a" }}>{proj.name}</p>
                    {proj.role && <p style={{ fontSize: "10.5px", fontWeight: 600, color }}>{proj.role}</p>}
                    {proj.description && (
                      <p className="resume-desc" style={{ fontSize: "10.5px", color: "#5a5a6a", lineHeight: 1.72 }} dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />
                    )}
                  </div>
                ))}
              </div>
            </LumiereSection>
          )}

          {visible("volunteer") && volunteer.length > 0 && (
            <LumiereSection title={label("volunteer")} color={color}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {volunteer.map((vol) => (
                  <div key={vol.id} className="resume-entry">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <p style={{ fontSize: "11px", fontWeight: 700, color: "#1a1a1a" }}>{vol.role}</p>
                      <span style={{ fontSize: "9.5px", color: "#aaa", fontStyle: "italic", flexShrink: 0, marginLeft: 8 }}>
                        {vol.startDate}{vol.endDate ? ` – ${vol.endDate}` : ""}
                      </span>
                    </div>
                    <p style={{ fontSize: "10.5px", fontWeight: 600, color }}>{vol.organization}</p>
                    {vol.description && (
                      <p className="resume-desc" style={{ fontSize: "10.5px", color: "#5a5a6a", lineHeight: 1.72 }} dangerouslySetInnerHTML={{ __html: fmtDesc(vol.description) }} />
                    )}
                  </div>
                ))}
              </div>
            </LumiereSection>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ width: "186px", flexShrink: 0, padding: "0 32px 32px 14px", borderLeft: `0.5px solid ${color}28` }}>
          {visible("skills") && skills.length > 0 && (
            <LumiereSide title={label("skills")} color={color}>
              {skills.map((sk) => (
                <div key={sk.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: "10px", color: "#444", letterSpacing: "0.02em" }}>{sk.name}</span>
                    {/* Diamond rating (4 diamonds) */}
                    <div style={{ display: "flex", gap: 2.5 }}>
                      {[25, 50, 75, 100].map((thresh) => (
                        <svg key={thresh} width="6" height="6" viewBox="0 0 6 6">
                          <polygon
                            points="3,0 6,3 3,6 0,3"
                            fill={(SKILL_W[sk.level] ?? 0) >= thresh ? color : "none"}
                            stroke={color} strokeWidth="0.6" opacity="0.75"
                          />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </LumiereSide>
          )}

          {visible("languages") && languages.length > 0 && (
            <LumiereSide title={label("languages")} color={color}>
              {languages.map((lang) => (
                <div key={lang.id} style={{ marginBottom: 9 }}>
                  <span style={{ fontSize: "10px", color: "#444", letterSpacing: "0.02em" }}>{lang.name}</span>
                  {/* Art Deco flat bar (no border-radius) */}
                  <div style={{ height: 3, backgroundColor: `${color}1a`, marginTop: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${LANG_W[lang.level] ?? 55}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
            </LumiereSide>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <LumiereSide title={label("certifications")} color={color}>
              {certifications.map((cert) => (
                <div key={cert.id} style={{ marginBottom: 9 }}>
                  <p style={{ fontSize: "10px", fontWeight: 600, color: "#333", lineHeight: 1.4 }}>{cert.name}</p>
                  {(cert.issuer || cert.date) && (
                    <p style={{ fontSize: "9px", color: "#aaa", fontStyle: "italic" }}>
                      {cert.issuer}{cert.date ? ` · ${cert.date}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </LumiereSide>
          )}

          {visible("hobbies") && hobbies && (
            <LumiereSide title={label("hobbies")} color={color}>
              <p style={{ fontSize: "10px", color: "#666", lineHeight: 1.72, fontStyle: "italic" }}>{hobbies}</p>
            </LumiereSide>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function LumiereSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {/* Centered section title with symmetric diamond ornaments */}
      <div className="resume-section-title" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 0.5, backgroundColor: color, opacity: 0.28 }} />
        <DiamondOrnament color={color} />
        <span style={{ fontSize: "8.5px", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color }}>
          {title}
        </span>
        <DiamondOrnament color={color} />
        <div style={{ flex: 1, height: 0.5, backgroundColor: color, opacity: 0.28 }} />
      </div>
      {children}
    </div>
  )
}

function LumiereSide({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="resume-section-title" style={{ marginBottom: 10 }}>
        <p style={{ fontSize: "8.5px", fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color, marginBottom: 6 }}>
          {title}
        </p>
        {/* Small Art Deco divider */}
        <svg width="140" height="10" viewBox="0 0 140 10">
          <line x1="0" y1="5" x2="56" y2="5" stroke={color} strokeWidth="0.5" opacity="0.3" />
          <polygon points="70,0 80,5 70,10 60,5" fill={color} opacity="0.65" />
          <line x1="84" y1="5" x2="140" y2="5" stroke={color} strokeWidth="0.5" opacity="0.3" />
        </svg>
      </div>
      {children}
    </div>
  )
}
