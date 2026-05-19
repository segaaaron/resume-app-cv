"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"

// ── Icons ─────────────────────────────────────────────────────────────────────

const IcoPhone = () => (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02z"/>
  </svg>
)
const IcoMail = () => (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
)
const IcoPin = () => (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
  </svg>
)
const IcoLink = () => (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
  </svg>
)

// ── Bullets ───────────────────────────────────────────────────────────────────

const BulletCheck = ({ c }: { c: string }) => (
  <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="5.5" cy="5.5" r="5.5" fill={c} />
    <path d="M3 5.5l1.8 1.8L8.5 3.8" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
)

const BulletArrow = ({ c }: { c: string }) => (
  <svg width="12" height="10" viewBox="0 0 12 10" aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }}>
    <path d="M1 5h9M7 1.5l3.5 3.5L7 8.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
)

const BulletDiamond = ({ c }: { c: string }) => (
  <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
    <rect x="1.5" y="1.5" width="6" height="6" rx="0.8" fill={c} transform="rotate(45 4.5 4.5)" />
  </svg>
)

const NumBadge = ({ n, c }: { n: number; c: string }) => (
  <div style={{
    width: 20, height: 20, borderRadius: "50%", backgroundColor: c,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
  }}>
    <span style={{ fontSize: "8px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
      {String(n).padStart(2, "0")}
    </span>
  </div>
)

// ── Circular skill gauge ──────────────────────────────────────────────────────

function Gauge({ pct, color, name }: { pct: number; color: string; name: string }) {
  const S = 44, R = 17, C = 2 * Math.PI * R
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} aria-hidden="true"
        style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}>
        <circle cx={S / 2} cy={S / 2} r={R} fill="none" stroke="#ebebeb" strokeWidth="4" />
        <circle cx={S / 2} cy={S / 2} r={R} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${(pct / 100) * C} ${C}`} strokeLinecap="round"
          transform={`rotate(-90 ${S / 2} ${S / 2})`} />
        <text x={S / 2} y={S / 2 + 3} textAnchor="middle"
          fontSize="8" fontWeight="800" fill={color} fontFamily="inherit">
          {pct}
        </text>
      </svg>
      <p style={{ fontSize: "6.5px", color: "#555", textAlign: "center", maxWidth: 44, lineHeight: 1.2 }}>{name}</p>
    </div>
  )
}

// ── Segmented language bar ────────────────────────────────────────────────────

function Segments({ pct, color }: { pct: number; color: string }) {
  const n = 8, filled = Math.round((pct / 100) * n)
  return (
    <div style={{ display: "flex", gap: 2.5 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{
          width: 10, height: 5, borderRadius: 1,
          backgroundColor: i < filled ? color : "#e8e8e8",
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }} />
      ))}
    </div>
  )
}

const SKILL_PCT: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }
const LANG_PCT:  Record<string, number> = { a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100 }
const DARK = "#2a2e35"
const DARK2 = "#1f2329"   // slightly darker for contact strip

// ─────────────────────────────────────────────────────────────────────────────

export default function ThompsonTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience,
    education, skills, languages, certifications, projects, volunteer, references,
  } = sd

  const accent  = config.colorScheme
  const label   = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const SH = ({ t }: { t: string }) => (
    <div style={{ marginBottom: 10 }}>
      <p style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: DARK, marginBottom: 3 }}>{t}</p>
      <div style={{ height: 2, backgroundColor: accent, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
    </div>
  )

  const MH = ({ t }: { t: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
      <div style={{ width: 5, height: 22, borderRadius: 3, backgroundColor: accent, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      <p style={{ fontSize: "11px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: DARK }}>{t}</p>
    </div>
  )

  return (
    <div data-print-layout="single-column" style={{ minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff" }}>

      {/* ══ HEADER ═══════════════════════════════════════════════════════════
          Photo LEFT inside dark header · Name RIGHT · Contact strip below
      ════════════════════════════════════════════════════════════════════ */}

      {/* Top row: photo + name */}
      <div style={{
        backgroundColor: DARK,
        display: "flex", alignItems: "center",
        padding: "18px 28px 18px 24px", gap: 22,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        {/* Initials circle */}
        {(() => {
          const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
          return (
            <div style={{
              width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
              backgroundColor: "#3d424a", border: `3px solid ${accent}`,
              WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: accent, fontWeight: 900, fontSize: 26 }}>{initials || "N"}</span>
            </div>
          )
        })()}

        {/* Name + job title */}
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: "26px", fontWeight: 900, color: "#fff",
            lineHeight: 1.0, letterSpacing: "0.04em", textTransform: "uppercase",
            marginBottom: 6,
          }}>
            {pd.firstName || "First"}&nbsp;
            <span style={{ color: accent }}>{pd.lastName || "Name"}</span>
          </h1>
          {pd.jobTitle && (
            <p style={{
              fontSize: "8px", color: "rgba(255,255,255,0.45)",
              fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase",
            }}>
              {pd.jobTitle}
            </p>
          )}
        </div>
      </div>

      {/* Contact strip — slightly darker band */}
      <div style={{
        backgroundColor: DARK2,
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 20px",
        padding: "8px 28px",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        {pd.phone && (
          <span style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.6)", fontSize: "7.5px" }}>
            <IcoPhone /> {pd.phone}
          </span>
        )}
        {pd.email && (
          <span style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.6)", fontSize: "7.5px" }}>
            <IcoMail /> {pd.email}
          </span>
        )}
        {(pd.city || pd.country) && (
          <span style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.6)", fontSize: "7.5px" }}>
            <IcoPin /> {[pd.city, pd.country].filter(Boolean).join(", ")}
          </span>
        )}
        {pd.linkedin && (
          <span style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.6)", fontSize: "7.5px" }}>
            <IcoLink /> {pd.linkedin}
          </span>
        )}
        {pd.website && (
          <span style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.6)", fontSize: "7.5px" }}>
            <IcoLink /> {pd.website}
          </span>
        )}
      </div>

      {/* ══ BODY ═════════════════════════════════════════════════════════════ */}
      <div style={{ display: "flex" }}>

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        <div style={{
          width: "32%", flexShrink: 0,
          padding: "20px 14px 28px 18px",
          borderRight: "1.5px solid #ededed",
        }}>

          {visible("education") && education.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <SH t={label("education")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {education.map((edu, i) => (
                  <div key={edu.id} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <NumBadge n={i + 1} c={accent} />
                    <div style={{ flex: 1 }}>
                      {(edu.startDate || edu.endDate) && (
                        <p style={{ fontSize: "7.5px", fontWeight: 800, color: DARK, marginBottom: 1 }}>
                          {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                        </p>
                      )}
                      <p style={{ fontSize: "9px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3, marginBottom: 1 }}>{edu.degree}</p>
                      {edu.fieldOfStudy && <p style={{ fontSize: "7.5px", color: "#555" }}>{edu.fieldOfStudy}</p>}
                      {edu.institution  && <p style={{ fontSize: "7.5px", color: "#aaa", fontStyle: "italic" }}>{edu.institution}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <SH t={label("certifications")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {certifications.map((cert) => (
                  <div key={cert.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <BulletCheck c={accent} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "8.5px", fontWeight: 600, color: "#333", lineHeight: 1.3 }}>{cert.name}</p>
                      {(cert.issuer || cert.date) && <p style={{ fontSize: "7px", color: "#aaa" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible("skills") && skills.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <SH t={label("skills")} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 6px" }}>
                {skills.map((sk) => (
                  <Gauge key={sk.id} pct={SKILL_PCT[sk.level] ?? 50} color={accent} name={sk.name} />
                ))}
              </div>
            </div>
          )}

          {visible("languages") && languages.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <SH t={label("languages")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <p style={{ fontSize: "8.5px", fontWeight: 600, color: "#2a2a2a" }}>{lang.name}</p>
                      <p style={{ fontSize: "6.5px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.05em" }}>{lang.level}</p>
                    </div>
                    <Segments pct={LANG_PCT[lang.level] ?? 50} color={accent} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(pd.github || pd.website) && (
            <div style={{ marginBottom: 18 }}>
              <SH t="Links" />
              {[pd.github, pd.website].filter(Boolean).map((link, i) => (
                <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 6 }}>
                  <BulletDiamond c={accent} />
                  <p style={{ fontSize: "7.5px", color: "#444", wordBreak: "break-all", lineHeight: 1.4 }}>{link}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT MAIN ───────────────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: "20px 24px 28px 20px" }}>

          {visible("summary") && summary && (
            <div style={{ marginBottom: 20 }}>
              <MH t={label("summary")} />
              <p style={{ fontSize: "9px", color: "#444", lineHeight: 1.85 }}>{summary as string}</p>
            </div>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <MH t={label("workExperience")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {workExperience.map((job) => (
                  <div key={job.id} className="resume-entry">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                      <div>
                        <p style={{ fontWeight: 900, fontSize: "11px", color: DARK, lineHeight: 1.2 }}>{job.jobTitle}</p>
                        {job.employer && (
                          <p style={{ fontSize: "9px", color: accent, fontWeight: 700, marginTop: 1 }}>
                            {job.employer}{job.city ? `, ${job.city}` : ""}
                          </p>
                        )}
                      </div>
                      <span style={{
                        fontSize: "7px", fontWeight: 700, color: "#fff",
                        backgroundColor: DARK, borderRadius: 4,
                        padding: "2px 8px", flexShrink: 0, marginLeft: 8,
                        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                      }}>
                        {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                      </span>
                    </div>
                    {job.description && (() => {
                      const lines = job.description
                        .replace(/<\/?(ul|ol|li|p|div|br\s*\/?)>/gi, "\n")
                        .replace(/<[^>]+>/g, "")
                        .trim().split("\n")
                        .map((l) => l.trim()).filter((l) => l.length > 3)
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 5 }}>
                          {lines.map((line, i) => (
                            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                              <BulletArrow c={accent} />
                              <p style={{ fontSize: "8.5px", color: "#555", lineHeight: 1.65, flex: 1 }}>{line}</p>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible("projects") && projects.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <MH t={label("projects")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry" style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <BulletDiamond c={accent} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 800, fontSize: "10.5px", color: DARK, marginBottom: 1 }}>{proj.name}</p>
                      {proj.role && <p style={{ fontSize: "8px", color: accent, fontWeight: 700, marginBottom: 3 }}>{proj.role}</p>}
                      {proj.description && <p style={{ fontSize: "8.5px", color: "#555", lineHeight: 1.7 }}>{proj.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible("volunteer") && volunteer.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <MH t={label("volunteer")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {volunteer.map((vol) => (
                  <div key={vol.id} className="resume-entry" style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <BulletCheck c={vol.organization ? accent : "#aaa"} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: "10.5px", color: DARK, marginBottom: 1 }}>{vol.role}</p>
                      <p style={{ fontSize: "8px", color: "#aaa", marginBottom: 4 }}>{vol.organization}</p>
                      {vol.description && <p style={{ fontSize: "8.5px", color: "#555", lineHeight: 1.7 }}>{vol.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible("references") && references.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <MH t={label("references")} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {references.map((ref) => (
                  <div key={ref.id} style={{
                    minWidth: 130, padding: "10px 14px",
                    borderLeft: `4px solid ${accent}`, backgroundColor: "#fafafa",
                  }}>
                    <p style={{ fontWeight: 700, fontSize: "9.5px", color: DARK }}>{ref.name}</p>
                    {ref.company && <p style={{ fontSize: "8px", color: accent, marginTop: 1 }}>{ref.company}</p>}
                    {ref.phone   && <p style={{ fontSize: "8px", color: "#666", marginTop: 3 }}>{ref.phone}</p>}
                    {ref.email   && <p style={{ fontSize: "8px", color: "#666" }}>{ref.email}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ FOOTER — wave SVG + accent band ══════════════════════════════════ */}
      <div>
        <svg width="100%" height="12" viewBox="0 0 1000 12" preserveAspectRatio="none"
          style={{ display: "block" }} aria-hidden="true">
          <path d="M0 12 Q125 0 250 6 Q375 12 500 6 Q625 0 750 6 Q875 12 1000 6 V12 Z"
            fill={accent}
            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties} />
        </svg>
        <div style={{
          backgroundColor: accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexWrap: "wrap", gap: "4px 22px", padding: "6px 24px 10px",
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          {[
            { ico: <IcoMail />,  val: pd.email },
            { ico: <IcoPhone />, val: pd.phone },
            { ico: <IcoPin />,   val: [pd.city, pd.country].filter(Boolean).join(", ") || null },
            { ico: <IcoLink />,  val: pd.linkedin },
          ].filter((x) => x.val).map((x, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.9)", fontSize: "7px" }}>
              {x.ico} {x.val}
            </span>
          ))}
        </div>
      </div>

    </div>
  )
}
