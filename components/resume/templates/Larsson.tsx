"use client"

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"

const SKILL_DOTS: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3, expert: 5 }
const LANG_DOTS: Record<string, number> = { a1: 1, a2: 2, b1: 3, b2: 4, c1: 4, c2: 5, native: 5 }

function DotRating({ value, max = 5, filled, empty }: { value: number; max?: number; filled: string; empty: string }) {
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          style={{
            width: "6px", height: "6px", borderRadius: "50%",
            backgroundColor: i < value ? filled : empty,
            WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
          }}
        />
      ))}
    </div>
  )
}

export default function LarssonTemplate() {
  const { config, sections } = useResumeStore()
  const sectionData = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects, volunteer, references,
  } = sectionData
  const accent = config.colorScheme
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const NAVY = "#1c2333"
  const NAVY_DARK = "#141824"

  return (
    <div data-print-layout="sidebar-left" style={{ display: "flex", minHeight: "297mm", fontFamily: "inherit", backgroundColor: "#fff", "--pdf-sidebar-bg": "#1c2333", "--pdf-main-bg": "#fff", "--pdf-sidebar-width": "34%" } as React.CSSProperties}>

      {/* ── SIDEBAR ──────────────────────────────────── */}
      <div style={{
        width: "34%", flexShrink: 0, display: "flex", flexDirection: "column",
        backgroundColor: NAVY, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>

        {/* Header block — darker navy */}
        <div style={{
          backgroundColor: NAVY_DARK, padding: "30px 20px 22px",
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          {/* Diamond photo frame */}
          {config.photoUrl ? (
            <div style={{
              width: "84px", height: "84px",
              borderRadius: "50%",
              overflow: "hidden",
              border: `3px solid ${accent}`,
              marginBottom: 14, flexShrink: 0,
              WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.photoUrl} alt=""
                style={{
                  width: "100%", height: "100%",
                  objectFit: "cover",
                  objectPosition: `center ${config.photoPosition ?? 20}%`,
                }}
              />
            </div>
          ) : (
            <div style={{
              width: "84px", height: "84px", borderRadius: "50%",
              border: `2px solid ${accent}`, marginBottom: 14, flexShrink: 0,
            }} />
          )}

          <h1 style={{ fontSize: "13.5px", fontWeight: 800, color: "#fff", lineHeight: 1.2, letterSpacing: "0.02em", marginBottom: 5 }}>
            {[pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"}
          </h1>
          {pd.jobTitle && (
            <p style={{ fontSize: "7.5px", color: accent, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {pd.jobTitle}
            </p>
          )}
        </div>

        {/* Sidebar sections */}
        <div style={{ padding: "18px 20px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Contact */}
          <div>
            <p style={{
              fontSize: "7px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)", marginBottom: 10,
            }}>
              Contact
            </p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { label: "Email", value: pd.email },
                { label: "Phone", value: pd.phone },
                { label: "Location", value: [pd.city, pd.country].filter(Boolean).join(", ") || null },
                { label: "LinkedIn", value: pd.linkedin },
                { label: "Website", value: pd.website },
                { label: "GitHub", value: pd.github },
              ].filter(f => f.value).map((field, i) => (
                <div key={i} style={{
                  paddingTop: 7, paddingBottom: 7,
                  borderBottom: "0.5px solid rgba(255,255,255,0.07)",
                }}>
                  <p style={{ fontSize: "6.5px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2 }}>
                    {field.label}
                  </p>
                  <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.82)", wordBreak: "break-all", lineHeight: 1.4 }}>
                    {field.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Education in sidebar */}
          {visible("education") && education.length > 0 && (
            <div>
              <p style={{
                fontSize: "7px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)", marginBottom: 10,
              }}>
                {label("education")}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {education.map((edu) => (
                  <div key={edu.id} style={{ paddingBottom: 10, borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ fontSize: "9px", fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 2 }}>
                      {edu.institution}
                    </p>
                    <p style={{ fontSize: "8px", color: accent, marginBottom: 5 }}>
                      {edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}
                    </p>
                    {/* Short accent bar */}
                    <div style={{ height: "2px", width: "22px", backgroundColor: accent, borderRadius: 999, marginBottom: 4, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    {(edu.startDate || edu.endDate) && (
                      <p style={{ fontSize: "7.5px", color: "rgba(255,255,255,0.38)" }}>
                        {edu.startDate}{edu.currentlyStudying ? ` – ${present}` : edu.endDate ? ` – ${edu.endDate}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {visible("skills") && skills.length > 0 && (
            <div>
              <p style={{
                fontSize: "7px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)", marginBottom: 10,
              }}>
                {label("skills")}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {skills.map((sk) => (
                  <div key={sk.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.82)" }}>{sk.name}</p>
                    <DotRating value={SKILL_DOTS[sk.level] ?? 3} filled={accent} empty="rgba(255,255,255,0.18)" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {visible("languages") && languages.length > 0 && (
            <div>
              <p style={{
                fontSize: "7px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)", marginBottom: 10,
              }}>
                {label("languages")}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {languages.map((lang) => (
                  <div key={lang.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.82)" }}>{lang.name}</p>
                    <DotRating value={LANG_DOTS[lang.level] ?? 3} filled={accent} empty="rgba(255,255,255,0.18)" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── MAIN ─────────────────────────────────────── */}
      <div style={{ flex: 1, padding: "36px 28px 32px", backgroundColor: "#fff" }}>

        {/* Section header component: TITLE ──────── */}
        {/* Defined inline as a closure for simplicity */}

        {visible("summary") && summary && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <h2 style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: NAVY, whiteSpace: "nowrap" }}>
                {label("summary")}
              </h2>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
            </div>
            <p style={{ fontSize: "9.5px", color: "#4b5563", lineHeight: 1.8 }}>{summary}</p>
          </div>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <h2 style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: NAVY, whiteSpace: "nowrap" }}>
                {label("workExperience")}
              </h2>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {workExperience.map((job) => (
                <div key={job.id} className="resume-entry">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 1 }}>
                    <p style={{ fontWeight: 800, fontSize: "10px", color: NAVY }}>{job.jobTitle}</p>
                    <span style={{ fontSize: "7.5px", color: "#9ca3af", flexShrink: 0, marginLeft: 10 }}>
                      {job.startDate}{job.currentlyWorking ? ` – ${present}` : job.endDate ? ` – ${job.endDate}` : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: "8.5px", color: accent, fontWeight: 700, marginBottom: 5 }}>
                    {job.employer}{job.city ? `, ${job.city}` : ""}
                  </p>
                  {/* Short accent underline */}
                  <div style={{ height: "1.5px", width: "18px", backgroundColor: accent, borderRadius: 999, marginBottom: 6, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  {job.description && (
                    <div className="resume-desc" style={{ fontSize: "9px", color: "#4b5563", lineHeight: 1.75 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <h2 style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: NAVY, whiteSpace: "nowrap" }}>
                {label("certifications")}
              </h2>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p style={{ fontWeight: 700, fontSize: "10px", color: NAVY }}>{cert.name}</p>
                  {(cert.issuer || cert.date) && <p style={{ fontSize: "8.5px", color: "#6b7280" }}>{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("projects") && projects.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <h2 style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: NAVY, whiteSpace: "nowrap" }}>
                {label("projects")}
              </h2>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map((proj) => (
                <div key={proj.id} className="resume-entry">
                  <p style={{ fontWeight: 800, fontSize: "10px", color: NAVY, marginBottom: 2 }}>{proj.name}</p>
                  {proj.role && <p style={{ fontSize: "8.5px", color: accent, fontWeight: 600, marginBottom: 4 }}>{proj.role}</p>}
                  {proj.description && <p style={{ fontSize: "9px", color: "#4b5563", lineHeight: 1.75 }}>{proj.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("volunteer") && volunteer.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <h2 style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: NAVY, whiteSpace: "nowrap" }}>
                {label("volunteer")}
              </h2>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {volunteer.map((vol) => (
                <div key={vol.id} className="resume-entry">
                  <p style={{ fontWeight: 700, fontSize: "10px", color: NAVY }}>{vol.role}</p>
                  <p style={{ fontSize: "8.5px", color: accent }}>{vol.organization}</p>
                  {vol.description && <p style={{ fontSize: "9px", color: "#4b5563", lineHeight: 1.75, marginTop: 3 }}>{vol.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {visible("references") && references.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <h2 style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: NAVY, whiteSpace: "nowrap" }}>
                {label("references")}
              </h2>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {references.map((ref) => (
                <div key={ref.id} style={{ minWidth: 140 }}>
                  <p style={{ fontWeight: 700, fontSize: "10px", color: NAVY }}>{ref.name}</p>
                  {ref.company && <p style={{ fontSize: "8.5px", color: accent }}>{ref.company}</p>}
                  {ref.phone && <p style={{ fontSize: "8.5px", color: "#6b7280" }}>{ref.phone}</p>}
                  {ref.email && <p style={{ fontSize: "8.5px", color: "#6b7280" }}>{ref.email}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
