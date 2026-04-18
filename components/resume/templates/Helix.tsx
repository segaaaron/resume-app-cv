"use client"

/**
 * Helix — Sidebar oscuro con patrón hexagonal SVG, progreso circular SVG para skills.
 * SVGs propios: grid hex, anillos de progreso, conectores timeline diamante, bracket tech.
 * Ideal para ingenieros, devs, data scientists, perfiles técnicos.
 */
import { fmtDesc } from "@/lib/utils"
import { useResumeStore } from "@/stores/resumeStore"
import { Mail, Phone, MapPin, Globe, Link2, GitFork } from "lucide-react"

const DARK  = "#0d1117"
const DARK2 = "#161b22"

const SKILL_PCT: Record<string, number> = { beginner: 25, intermediate: 52, advanced: 76, expert: 100 }
const LANG_PCT:  Record<string, number> = { elementary: 18, limited: 38, professional: 58, full_professional: 80, native: 100 }

/* SVG circular progress ring */
function RingProgress({ pct, color, size = 30 }: { pct: number; color: string; size?: number }) {
  const r    = (size - 5) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function HelixTemplate() {
  const { sectionData, config, sections } = useResumeStore()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects, hobbies, volunteer,
  } = sectionData
  const color   = config.colorScheme
  const label   = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()

  return (
    <div style={{ display: "flex", minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>

      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <div style={{ width: "212px", flexShrink: 0, backgroundColor: DARK, position: "relative", overflow: "hidden" }}>

        {/* ── SVG hexagonal background pattern ── */}
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="helix-hex" x="0" y="0" width="32" height="36.8" patternUnits="userSpaceOnUse">
              <polygon
                points="16,2 30,10 30,26 16,34 2,26 2,10"
                fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="1"
              />
              <polygon
                points="16,7 25,12 25,22 16,27 7,22 7,12"
                fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#helix-hex)`} />
          {/* Top glow */}
          <ellipse cx="106" cy="0" rx="100" ry="70" fill={color} opacity="0.09" />
          {/* Bottom subtle glow */}
          <ellipse cx="106" cy="842" rx="80" ry="60" fill={color} opacity="0.06" />
        </svg>

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0" }}>

          {/* Photo / Initials inside hexagonal SVG clip */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <svg width="94" height="108" viewBox="0 0 94 108" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <clipPath id="hex-photo-clip">
                  <polygon points="47,1 93,27 93,81 47,107 1,81 1,27" />
                </clipPath>
              </defs>
              {/* Hex background */}
              <polygon points="47,1 93,27 93,81 47,107 1,81 1,27" fill={DARK2} stroke={color} strokeWidth="2" />
              {config.photoUrl ? (
                <image
                  href={config.photoUrl} x="1" y="1" width="92" height="106"
                  clipPath="url(#hex-photo-clip)" preserveAspectRatio="xMidYMid slice"
                />
              ) : (
                <text x="47" y="64" textAnchor="middle" fill={color} fontSize="26" fontWeight="800">
                  {initials}
                </text>
              )}
            </svg>
            {/* Outer dashed hex ring */}
            <svg
              style={{ position: "absolute", top: -9, left: -9 }}
              width="112" height="126" viewBox="0 0 112 126"
            >
              <polygon
                points="56,3 109,32 109,94 56,123 3,94 3,32"
                fill="none" stroke={color} strokeWidth="1.2"
                opacity="0.28" strokeDasharray="5 3.5"
              />
            </svg>
          </div>

          {/* Name */}
          <p style={{
            color: "#fff", fontSize: 13, fontWeight: 800,
            textAlign: "center", letterSpacing: "0.05em",
            marginBottom: 3, padding: "0 16px", lineHeight: 1.25,
          }}>
            {[pd.firstName, pd.lastName].filter(Boolean).join(" ")}
          </p>
          {pd.jobTitle && (
            <p style={{
              color, fontSize: "8.5px", fontWeight: 600,
              textAlign: "center", letterSpacing: "0.22em",
              textTransform: "uppercase", marginBottom: 18, padding: "0 12px",
            }}>
              {pd.jobTitle}
            </p>
          )}

          {/* SVG diamond divider */}
          <svg width="160" height="10" viewBox="0 0 160 10" style={{ marginBottom: 16 }}>
            <line x1="0" y1="5" x2="68" y2="5" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
            <polygon points="80,0 90,5 80,10 70,5" fill={color} opacity="0.85" />
            <line x1="92" y1="5" x2="160" y2="5" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
          </svg>

          {/* CONTACT */}
          <div style={{ width: "100%", padding: "0 18px", marginBottom: 18 }}>
            <HelixSideTitle title={config.language === "en" ? "Contact" : "Contacto"} color={color} />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {pd.email    && <SideContact icon={<Mail size={9} />} text={pd.email} color={color} />}
              {pd.phone    && <SideContact icon={<Phone size={9} />} text={pd.phone} color={color} />}
              {(pd.city || pd.country) && (
                <SideContact icon={<MapPin size={9} />} text={[pd.city, pd.country].filter(Boolean).join(", ")} color={color} />
              )}
              {pd.website  && <SideContact icon={<Globe size={9} />} text={pd.website} color={color} />}
              {pd.linkedin && <SideContact icon={<Link2 size={9} />} text={pd.linkedin} color={color} />}
              {pd.github   && <SideContact icon={<GitFork size={9} />} text={pd.github} color={color} />}
            </div>
          </div>

          {/* SKILLS with ring progress */}
          {visible("skills") && skills.length > 0 && (
            <div style={{ width: "100%", padding: "0 18px", marginBottom: 18 }}>
              <HelixSideTitle title={label("skills")} color={color} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {skills.slice(0, 9).map((sk) => (
                  <div key={sk.id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <RingProgress pct={SKILL_PCT[sk.level] ?? 55} color={color} size={30} />
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.78)", fontWeight: 500 }}>
                      {sk.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LANGUAGES */}
          {visible("languages") && languages.length > 0 && (
            <div style={{ width: "100%", padding: "0 18px", marginBottom: 18 }}>
              <HelixSideTitle title={label("languages")} color={color} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.78)", fontWeight: 500 }}>{lang.name}</span>
                    <div style={{ height: 4, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, width: `${LANG_PCT[lang.level] ?? 55}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CERTIFICATIONS */}
          {visible("certifications") && certifications.length > 0 && (
            <div style={{ width: "100%", padding: "0 18px" }}>
              <HelixSideTitle title={label("certifications")} color={color} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {certifications.map((cert) => (
                  <div key={cert.id} style={{ paddingLeft: 8, borderLeft: `2px solid ${color}55` }}>
                    <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.82)", lineHeight: 1.3 }}>{cert.name}</p>
                    {(cert.issuer || cert.date) && (
                      <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.38)" }}>
                        {cert.issuer}{cert.date ? ` · ${cert.date}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible("hobbies") && hobbies && (
            <div style={{ width: "100%", padding: "0 18px", marginTop: 18 }}>
              <HelixSideTitle title={label("hobbies")} color={color} />
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{hobbies}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, backgroundColor: "#fff", padding: "26px 26px 28px 22px" }}>

        {/* Name header with tech bracket SVG */}
        <div style={{ marginBottom: 18, paddingBottom: 12, borderBottom: `2px solid ${color}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Left bracket */}
            <svg width="14" height="26" viewBox="0 0 14 26">
              <path d="M12,2 L4,2 L4,24 L12,24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: DARK, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {[pd.firstName, pd.lastName].filter(Boolean).join(" ")}
              </h1>
              {pd.jobTitle && (
                <p style={{ fontSize: "9.5px", fontWeight: 600, color: "#777", letterSpacing: "0.22em", textTransform: "uppercase", marginTop: 3 }}>
                  {pd.jobTitle}
                </p>
              )}
            </div>
            {/* Right bracket */}
            <svg width="14" height="26" viewBox="0 0 14 26" style={{ marginLeft: "auto" }}>
              <path d="M2,2 L10,2 L10,24 L2,24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {visible("summary") && summary && (
          <HelixSection title={label("summary")} color={color}>
            <p style={{ fontSize: "10.5px", color: "#555", lineHeight: 1.75 }}>{summary}</p>
          </HelixSection>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <HelixSection title={label("workExperience")} color={color}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {workExperience.map((job, idx) => (
                <div key={job.id} className="resume-entry" style={{ position: "relative", paddingLeft: 20 }}>
                  {/* Timeline connector */}
                  {idx < workExperience.length - 1 && (
                    <div style={{
                      position: "absolute", left: 6, top: 14, bottom: -12,
                      width: 1, backgroundColor: `${color}28`,
                    }} />
                  )}
                  {/* SVG diamond bullet */}
                  <svg style={{ position: "absolute", left: 0, top: 4 }} width="13" height="13" viewBox="0 0 13 13">
                    <polygon points="6.5,0 13,6.5 6.5,13 0,6.5" fill={color} />
                    <polygon points="6.5,3.5 9.5,6.5 6.5,9.5 3.5,6.5" fill="white" />
                  </svg>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: DARK }}>{job.jobTitle}</p>
                    <span style={{ fontSize: "9.5px", color: "#aaa", flexShrink: 0, marginLeft: 8 }}>
                      {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: "10.5px", fontWeight: 600, color, marginBottom: 2 }}>
                    {job.employer}{job.city ? ` · ${job.city}` : ""}
                  </p>
                  {job.description && (
                    <div
                      style={{ fontSize: "10.5px", color: "#5a5a6a", lineHeight: 1.65 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }}
                    />
                  )}
                </div>
              ))}
            </div>
          </HelixSection>
        )}

        {visible("education") && education.length > 0 && (
          <HelixSection title={label("education")} color={color}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {education.map((edu) => (
                <div key={edu.id} className="resume-entry" style={{ paddingLeft: 20, position: "relative" }}>
                  {/* SVG target bullet */}
                  <svg style={{ position: "absolute", left: 0, top: 4 }} width="13" height="13" viewBox="0 0 13 13">
                    <circle cx="6.5" cy="6.5" r="5.5" fill="none" stroke={color} strokeWidth="1.5" />
                    <circle cx="6.5" cy="6.5" r="2.5" fill={color} />
                  </svg>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: DARK }}>
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
          </HelixSection>
        )}

        {visible("projects") && projects.length > 0 && (
          <HelixSection title={label("projects")} color={color}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map((proj) => (
                <div key={proj.id} className="resume-entry" style={{ paddingLeft: 20, position: "relative" }}>
                  {/* SVG plus-in-square */}
                  <svg style={{ position: "absolute", left: 0, top: 3 }} width="13" height="13" viewBox="0 0 13 13">
                    <rect x="1" y="1" width="11" height="11" rx="2" fill="none" stroke={color} strokeWidth="1.5" />
                    <line x1="6.5" y1="4" x2="6.5" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="4" y1="6.5" x2="9" y2="6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: DARK }}>{proj.name}</p>
                  {proj.role && <p style={{ fontSize: "10.5px", fontWeight: 600, color }}>{proj.role}</p>}
                  {proj.description && (
                    <p style={{ fontSize: "10.5px", color: "#5a5a6a", lineHeight: 1.65 }}>{proj.description}</p>
                  )}
                </div>
              ))}
            </div>
          </HelixSection>
        )}

        {visible("volunteer") && volunteer.length > 0 && (
          <HelixSection title={label("volunteer")} color={color}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {volunteer.map((vol) => (
                <div key={vol.id} className="resume-entry" style={{ paddingLeft: 20, position: "relative" }}>
                  <svg style={{ position: "absolute", left: 0, top: 4 }} width="13" height="13" viewBox="0 0 13 13">
                    <polygon points="6.5,1 12,4.5 12,8.5 6.5,12 1,8.5 1,4.5" fill="none" stroke={color} strokeWidth="1.5" />
                  </svg>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: DARK }}>{vol.role}</p>
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
          </HelixSection>
        )}
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function HelixSideTitle({ title, color }: { title: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      <svg width="10" height="10" viewBox="0 0 10 10">
        <polygon points="5,0 10,5 5,10 0,5" fill={color} />
      </svg>
      <span style={{ fontSize: "8.5px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color }}>
        {title}
      </span>
    </div>
  )
}

function SideContact({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
      <span style={{ color, marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.56)", lineHeight: 1.4, wordBreak: "break-all" }}>
        {text}
      </span>
    </div>
  )
}

function HelixSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="resume-section-title" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        {/* SVG nested diamond */}
        <svg width="16" height="16" viewBox="0 0 16 16">
          <polygon points="8,0 16,8 8,16 0,8" fill={color} opacity="0.15" />
          <polygon points="8,3 13,8 8,13 3,8" fill={color} />
        </svg>
        <span style={{ fontSize: "9.5px", fontWeight: 900, letterSpacing: "0.26em", textTransform: "uppercase", color }}>
          {title}
        </span>
        <div style={{ flex: 1, height: 1, backgroundColor: `${color}2a` }} />
      </div>
      {children}
    </div>
  )
}
