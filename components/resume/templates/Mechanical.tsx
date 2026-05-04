"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function MechanicalTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const paper = "#fafaf6"
  const ink = "#101010"
  const red = config.colorScheme || "#cc2a1c"
  const grey = "#666"

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const location = [pd.city, pd.country].filter(Boolean).join(", ")

  function H({ n, children }: { n?: string; children: React.ReactNode }) {
    return (
      <h2 style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 800, fontSize: 16, margin: "12px 0 8px", letterSpacing: "-0.01em" }}>
        {n && <span style={{ color: red, fontFamily: "ui-monospace, monospace", fontSize: 14 }}>{n}</span>}
        {n && "\u00A0\u00A0"}
        {children}
      </h2>
    )
  }

  function Item({ y, h, s }: { y: string; h: string; s?: string }) {
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: red }}>{y}</div>
        <div style={{ fontWeight: 700, fontSize: 12 }}>{h}</div>
        {s && <div style={{ fontSize: 11, color: "#555" }}>{s}</div>}
      </div>
    )
  }

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: paper, color: ink,
      fontFamily: "'Inter Tight', 'Inter', sans-serif", fontSize: 11,
      padding: 40, display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Header */}
      <header style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.25em", color: red }}>
          ★ TECHNICAL DRAWING · CV ASSEMBLY
        </div>
        <h1 style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 900, fontSize: 50, margin: "6px 0 2px", letterSpacing: "-0.03em" }}>
          {fullName.toUpperCase()}
        </h1>
        {pd.jobTitle && (
          <div style={{ fontSize: 13 }}>{pd.jobTitle}</div>
        )}
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, flex: 1 }}>
        {/* Left — diagram */}
        <div style={{ border: `1.5px solid ${ink}`, padding: 16, background: "#fff", position: "relative" }}>
          <svg width="100%" height="380" viewBox="0 0 320 380">
            {/* Exploded diagram shapes */}
            <circle cx="160" cy="80" r="36" fill="none" stroke={ink} strokeWidth="1.5" />
            <text x="160" y="85" textAnchor="middle" fontSize="11" fontFamily="'Inter Tight', 'Inter'" fontWeight="700">EXP</text>

            <line x1="160" y1="116" x2="160" y2="150" stroke={ink} strokeWidth="0.8" strokeDasharray="3 2" />

            <rect x="120" y="150" width="80" height="50" fill="none" stroke={ink} strokeWidth="1.5" />
            <text x="160" y="180" textAnchor="middle" fontSize="11" fontFamily="'Inter Tight', 'Inter'" fontWeight="700">EDU</text>

            <line x1="160" y1="200" x2="160" y2="230" stroke={ink} strokeWidth="0.8" strokeDasharray="3 2" />

            <polygon points="160,230 200,260 160,290 120,260" fill="none" stroke={ink} strokeWidth="1.5" />
            <text x="160" y="265" textAnchor="middle" fontSize="11" fontFamily="'Inter Tight', 'Inter'" fontWeight="700">SKL</text>

            <line x1="160" y1="290" x2="160" y2="320" stroke={ink} strokeWidth="0.8" strokeDasharray="3 2" />

            <ellipse cx="160" cy="345" rx="50" ry="20" fill="none" stroke={ink} strokeWidth="1.5" />
            <text x="160" y="350" textAnchor="middle" fontSize="11" fontFamily="'Inter Tight', 'Inter'" fontWeight="700">CTC</text>

            {/* Callouts */}
            <line x1="200" y1="80" x2="270" y2="60" stroke={red} strokeWidth="0.8" />
            <circle cx="200" cy="80" r="3" fill={red} />
            <text x="275" y="64" fontSize="9" fontFamily="ui-monospace">① experience</text>

            <line x1="200" y1="175" x2="270" y2="155" stroke={red} strokeWidth="0.8" />
            <circle cx="200" cy="175" r="3" fill={red} />
            <text x="275" y="159" fontSize="9" fontFamily="ui-monospace">② education</text>

            <line x1="200" y1="260" x2="270" y2="240" stroke={red} strokeWidth="0.8" />
            <circle cx="200" cy="260" r="3" fill={red} />
            <text x="275" y="244" fontSize="9" fontFamily="ui-monospace">③ skills</text>

            <line x1="210" y1="345" x2="270" y2="325" stroke={red} strokeWidth="0.8" />
            <circle cx="210" cy="345" r="3" fill={red} />
            <text x="275" y="329" fontSize="9" fontFamily="ui-monospace">④ contact</text>

            {/* Dimension line */}
            <line x1="40" y1="40" x2="40" y2="360" stroke={grey} strokeWidth="0.6" />
            <text x="34" y="200" fontSize="8" fill={grey} fontFamily="ui-monospace" transform="rotate(-90, 34, 200)">A4 — 1:1</text>
          </svg>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: grey, textAlign: "center", letterSpacing: "0.18em" }}>
            FIG. 1 — EXPLODED VIEW
          </div>
        </div>

        {/* Right — content */}
        <section>
          {visible("summary") && summary && (
            <>
              <H n="✦">{label("summary")}</H>
              <p style={{ margin: "0 0 12px", fontSize: 11, lineHeight: 1.65, color: "#333" }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H n="①">{label("workExperience")}</H>
              {workExperience.map((job) => {
                const start = job.startDate?.match(/\d{4}/)?.[0] ?? ""
                const end = job.currentlyWorking ? present : (job.endDate?.match(/\d{4}/)?.[0] ?? "")
                const range = start && end ? `${start}—${end}` : start || end
                return (
                  <div key={job.id} style={{ marginBottom: 10 }}>
                    <Item y={range} h={job.employer || ""} s={`${job.jobTitle || ""}${job.city ? ` · ${job.city}` : ""}`} />
                    {job.description && (
                      <div className="resume-desc" style={{ fontSize: 10, color: "#555", marginTop: -4 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                )
              })}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <H n="②">{label("education")}</H>
              {education.map((edu) => {
                const year = edu.endDate?.match(/\d{4}/)?.[0] ?? edu.startDate?.match(/\d{4}/)?.[0] ?? ""
                return (
                  <p key={edu.id} style={{ margin: "0 0 6px", fontSize: 11.5, lineHeight: 1.7 }}>
                    {year && <><b>{year}</b> · </>}
                    {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(" ")}
                    {edu.institution ? ` · ${edu.institution}` : ""}
                  </p>
                )
              })}
            </>
          )}

          {visible("skills") && skills.length > 0 && (
            <>
              <H n="③">{label("skills")}</H>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {skills.map((sk) => (
                  <span key={sk.id} style={{
                    background: ink, color: paper, padding: "3px 8px",
                    fontSize: 10, fontFamily: "ui-monospace, monospace",
                    WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                  }}>{sk.name}</span>
                ))}
              </div>
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H>{label("certifications")}</H>
              <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.85 }}>
                {certifications.map((cert) => (
                  <li key={cert.id}>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}</li>
                ))}
              </ul>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H>{label("languages")}</H>
              <p style={{ margin: 0 }}>
                {languages.map((l, i) => <span key={l.id}>{l.name}{l.level ? ` (${l.level.toUpperCase()})` : ""}{i < languages.length - 1 ? " · " : ""}</span>)}
              </p>
            </>
          )}

          {visible("projects") && projects && projects.length > 0 && (
            <>
              <H>{label("projects")}</H>
              {projects.map((proj) => (
                <p key={proj.id} style={{ margin: "0 0 6px", fontSize: 11, lineHeight: 1.6 }}>
                  <b>{proj.name}</b>{proj.url ? ` — ${proj.url}` : ""}
                  {proj.description ? <><br /><span className="resume-desc" style={{ color: "#555", fontSize: 10 }} dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} /></> : null}
                </p>
              ))}
            </>
          )}

          <H n="④">{config.language === "en" ? "Contact" : "Contacto"}</H>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, lineHeight: 1.85 }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && <div>{pd.phone}</div>}
            {location && <div>{location}</div>}
            {pd.linkedin && <div>{pd.linkedin}</div>}
            {pd.website && <div>{pd.website}</div>}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: 14, borderTop: `1.5px solid ${ink}`, padding: "8px 0",
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
        fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.2em",
      }}>
        <div>{(pd.lastName || "CV").toUpperCase().replace(/\s/g, "")}</div>
        <div>{`${String(new Date().getMonth() + 1).padStart(2, "0")}·${new Date().getFullYear()}`}</div>
        <div>SCALE 1:1</div>
        <div>UNITS · MM</div>
        <div>SHEET 01</div>
      </footer>
    </div>
  )
}
