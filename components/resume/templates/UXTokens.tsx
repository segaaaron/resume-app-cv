"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function UXTokensTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const bg = "#0f1115"
  const card = "#171a21"
  const line = "#262a33"
  const text = "#e6e7ea"
  const dim = "#8a8e97"
  const accent = config.colorScheme || "#7cf0bd"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: bg, color: text,
      fontFamily: "'Inter', sans-serif", fontSize: 11,
      padding: 36, display: "flex", flexDirection: "column", gap: 16,
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Identity card */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
        background: card, borderRadius: 12, border: `1px solid ${line}`,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <div style={{
          width: 8, height: 40, background: accent, borderRadius: 2, flexShrink: 0,
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }} />
        {(() => {
          const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
          return (
            <div style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, backgroundColor: accent, display: "flex", alignItems: "center", justifyContent: "center", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              <span style={{ color: bg, fontWeight: 800, fontSize: 18 }}>{initials || "N"}</span>
            </div>
          )
        })()}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: dim, letterSpacing: "0.2em" }}>
            token: identity/name
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {pd.firstName || "First"} {pd.lastName || "Last"}
          </div>
          {pd.jobTitle && (
            <div style={{ fontSize: 12, color: dim }}>{pd.jobTitle}</div>
          )}
        </div>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: dim, textAlign: "right", lineHeight: 1.85, flexShrink: 0 }}>
          {pd.email && <div>{pd.email}</div>}
          {pd.phone && <div>{pd.phone}</div>}
          {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(" · ")}</div>}
          {pd.linkedin && <div>{pd.linkedin}</div>}
          {pd.website && <div>{pd.website}</div>}
        </div>
      </div>

      {/* Summary */}
      {visible("summary") && summary && (
        <Card title="token: summary/profile" card={card} line={line} dim={dim}>
          <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.65, color: text }}>{summary}</p>
        </Card>
      )}

      {/* Work Experience */}
      {visible("workExperience") && workExperience.length > 0 && (
        <Card title={`role/${label("workExperience").toLowerCase().replace(/\s/g, "_")}`} card={card} line={line} dim={dim}>
          {workExperience.map((job, i) => (
            <div key={job.id} style={{
              display: "grid", gridTemplateColumns: "110px 1fr",
              gap: 14, padding: "10px 0",
              borderBottom: i < workExperience.length - 1 ? `1px solid ${line}` : "none",
              alignItems: "start",
            }}>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: accent, lineHeight: 1.5 }}>
                {job.startDate?.match(/\d{4}/)?.[0]}
                {job.currentlyWorking
                  ? `—${present}`
                  : job.endDate?.match(/\d{4}/)?.[0]
                  ? `—${job.endDate.match(/\d{4}/)?.[0]}`
                  : ""}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{job.employer}</span>
                  <span style={{ color: dim, fontSize: 11 }}>{job.jobTitle}</span>
                </div>
                {job.description && (
                  <div className="resume-desc" style={{ fontSize: 10.5, color: dim, marginTop: 4, lineHeight: 1.55 }}
                    dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Skills + Education row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {visible("skills") && skills.length > 0 && (
          <Card title={`skills/${label("skills").toLowerCase()}`} card={card} line={line} dim={dim}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {skills.map((sk) => (
                <span key={sk.id} style={{
                  background: line, padding: "4px 9px", borderRadius: 4,
                  fontSize: 10.5, fontFamily: "ui-monospace, monospace",
                  WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                }}>{sk.name}</span>
              ))}
            </div>
          </Card>
        )}

        {visible("education") && education.length > 0 && (
          <Card title={`education/${label("education").toLowerCase()}`} card={card} line={line} dim={dim}>
            <div style={{ fontSize: 11.5, lineHeight: 1.7 }}>
              {education.map((edu) => (
                <div key={edu.id}>
                  <b style={{ color: accent }}>{edu.endDate?.match(/\d{4}/)?.[0] || edu.startDate?.match(/\d{4}/)?.[0]}</b>
                  {" · "}
                  {edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}
                  {edu.institution ? ` · ${edu.institution}` : ""}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Languages + Certifications row */}
      {(visible("languages") && languages.length > 0) || (visible("certifications") && certifications.length > 0) || (visible("projects") && projects.length > 0) ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {visible("languages") && languages.length > 0 && (
            <Card title={`lang/${label("languages").toLowerCase()}`} card={card} line={line} dim={dim}>
              <div style={{ fontSize: 11.5, lineHeight: 1.7 }}>
                {languages.map((lang) => (
                  <div key={lang.id}>
                    <b style={{ color: accent }}>{lang.level.toUpperCase()}</b> · {lang.name}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <Card title={`certs/${label("certifications").toLowerCase()}`} card={card} line={line} dim={dim}>
              <div style={{ fontSize: 11, lineHeight: 1.7 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    {cert.date?.match(/\d{4}/)?.[0] && <b style={{ color: accent }}>{cert.date.match(/\d{4}/)?.[0]}</b>}
                    {cert.date?.match(/\d{4}/)?.[0] ? " · " : ""}{cert.name}
                    {cert.issuer ? ` · ${cert.issuer}` : ""}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {visible("projects") && projects.length > 0 && !(visible("certifications") && certifications.length > 0) && (
            <Card title={`projects/${label("projects").toLowerCase()}`} card={card} line={line} dim={dim}>
              <div style={{ fontSize: 11, lineHeight: 1.7 }}>
                {projects.map((p) => (
                  <div key={p.id}><b style={{ color: accent }}>{p.name}</b>{p.description ? ` · ${p.description}` : ""}</div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  )
}

function Card({ title, card, line, dim, children }: { title: string; card: string; line: string; dim: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: card, borderRadius: 12, padding: 16, border: `1px solid ${line}`,
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      <div style={{
        fontFamily: "ui-monospace, monospace", fontSize: 10, color: dim,
        letterSpacing: "0.18em", marginBottom: 10,
      }}>{title}</div>
      {children}
    </div>
  )
}
