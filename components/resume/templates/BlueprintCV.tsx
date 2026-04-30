"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function BlueprintCVTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const blue = "#0d3b66"
  const lineColor = "rgba(255,255,255,0.18)"
  const white = "#f6f8fb"
  const subdue = "#9ec1e8"
  const faint = "#cfdef0"

  // Section labels for SVG floor plan
  const expLabel = label("workExperience").toUpperCase()
  const eduLabel = label("education").toUpperCase()
  const projLabel = label("projects").toUpperCase()
  const skillLabel = label("skills").toUpperCase()
  const contactLabel = config.language === "en" ? "CONTACT" : "CONTACTO"

  return (
    <div style={{
      minHeight: "297mm", background: blue, color: white,
      fontFamily: "'Inter Tight', 'Inter', sans-serif", fontSize: 10.5,
      padding: 0, position: "relative",
      backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
      backgroundSize: "24px 24px",
      display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      <div style={{ padding: "44px 56px", flex: 1 }}>
        {/* Sheet header */}
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.25em", color: subdue }}>
          SHEET 01 OF 01 · CV · {new Date().getFullYear()} · A4
        </div>
        <h1 style={{
          fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 800, fontSize: 64,
          lineHeight: 0.95, margin: "16px 0 8px", letterSpacing: "-0.025em",
        }}>
          {pd.firstName || "First"} {pd.lastName || "Last"}
        </h1>
        {pd.jobTitle && (
          <div style={{ fontSize: 14, color: subdue }}>{pd.jobTitle}</div>
        )}

        {/* Floor plan SVG */}
        <svg width="100%" height="240" viewBox="0 0 700 240" style={{ marginTop: 28 }}>
          <rect x="20" y="20" width="660" height="200" fill="none" stroke={white} strokeWidth="1.5" />
          <rect x="40" y="40" width="200" height="90" fill="none" stroke={white} strokeWidth="1" />
          <rect x="40" y="150" width="200" height="50" fill="none" stroke={white} strokeWidth="1" />
          <rect x="260" y="40" width="180" height="160" fill="none" stroke={white} strokeWidth="1" />
          <rect x="460" y="40" width="200" height="100" fill="none" stroke={white} strokeWidth="1" />
          <rect x="460" y="160" width="200" height="50" fill="none" stroke={white} strokeWidth="1" />
          <text x="140" y="90" fill={white} fontSize="10" textAnchor="middle" fontFamily="'Inter Tight', 'Inter'">{expLabel}</text>
          <text x="140" y="180" fill={white} fontSize="10" textAnchor="middle" fontFamily="'Inter Tight', 'Inter'">{eduLabel}</text>
          <text x="350" y="125" fill={white} fontSize="10" textAnchor="middle" fontFamily="'Inter Tight', 'Inter'">{projLabel}</text>
          <text x="560" y="95" fill={white} fontSize="10" textAnchor="middle" fontFamily="'Inter Tight', 'Inter'">{skillLabel}</text>
          <text x="560" y="190" fill={white} fontSize="10" textAnchor="middle" fontFamily="'Inter Tight', 'Inter'">{contactLabel}</text>
          {/* Dimension line */}
          <line x1="20" y1="10" x2="680" y2="10" stroke={white} strokeWidth="0.5" />
          <line x1="20" y1="6" x2="20" y2="14" stroke={white} />
          <line x1="680" y1="6" x2="680" y2="14" stroke={white} />
          <text x="350" y="7" fill={white} fontSize="8" textAnchor="middle" fontFamily="ui-monospace, monospace">12.0 m</text>
        </svg>

        {/* Body grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 24, marginTop: 24 }}>
          {/* Column 1: Experience + Summary */}
          <div>
            {visible("summary") && summary && (
              <>
                <BpH color={subdue}>00 · {config.language === "en" ? "Profile" : "Perfil"}</BpH>
                <p style={{ fontSize: 10.5, margin: "0 0 16px", lineHeight: 1.6, color: faint }}>{summary}</p>
              </>
            )}

            {visible("workExperience") && workExperience.length > 0 && (
              <>
                <BpH color={subdue}>01 · {label("workExperience")}</BpH>
                {workExperience.map((job) => (
                  <BpItem key={job.id}
                    year={`${job.startDate?.match(/\d{4}/)?.[0] ?? ""}${job.currentlyWorking ? `—${present}` : job.endDate?.match(/\d{4}/)?.[0] ? `—${job.endDate.match(/\d{4}/)?.[0]}` : ""}`}
                    heading={job.employer || ""}
                    sub={job.jobTitle || ""}
                    desc={job.description}
                    white={white} subdue={subdue} faint={faint}
                  />
                ))}
              </>
            )}
          </div>

          {/* Column 2: Education + Skills */}
          <div>
            {visible("education") && education.length > 0 && (
              <>
                <BpH color={subdue}>02 · {label("education")}</BpH>
                {education.map((edu) => (
                  <BpItem key={edu.id}
                    year={edu.endDate?.match(/\d{4}/)?.[0] || edu.startDate?.match(/\d{4}/)?.[0] || ""}
                    heading={edu.institution || ""}
                    sub={`${edu.degree || ""}${edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}`}
                    white={white} subdue={subdue} faint={faint}
                  />
                ))}
              </>
            )}

            {visible("skills") && skills.length > 0 && (
              <>
                <BpH color={subdue} style={{ marginTop: 16 }}>03 · {label("skills")}</BpH>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, lineHeight: 1.8 }}>
                  {skills.map((sk, i) => (
                    <span key={sk.id}>{sk.name}{i < skills.length - 1 ? " · " : ""}</span>
                  ))}
                </div>
              </>
            )}

            {visible("languages") && languages.length > 0 && (
              <>
                <BpH color={subdue} style={{ marginTop: 16 }}>04 · {label("languages")}</BpH>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, lineHeight: 1.8 }}>
                  {languages.map((lang) => (
                    <div key={lang.id}>{lang.name} · {lang.level.toUpperCase()}</div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Column 3: Projects / Certifications + Contact */}
          <div>
            {visible("projects") && projects.length > 0 && (
              <>
                <BpH color={subdue}>05 · {label("projects")}</BpH>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10.5, lineHeight: 1.8 }}>
                  {projects.map((p) => (
                    <li key={p.id}>{p.name}{p.description ? ` · ${p.description}` : ""}</li>
                  ))}
                </ul>
              </>
            )}

            {visible("certifications") && certifications.length > 0 && (
              <>
                <BpH color={subdue} style={{ marginTop: visible("projects") && projects.length > 0 ? 16 : 0 }}>
                  {visible("projects") && projects.length > 0 ? "06" : "05"} · {label("certifications")}
                </BpH>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10.5, lineHeight: 1.8 }}>
                  {certifications.map((cert) => (
                    <li key={cert.id}>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}</li>
                  ))}
                </ul>
              </>
            )}

            <BpH color={subdue} style={{ marginTop: 16 }}>
              {[visible("projects") && projects.length, visible("certifications") && certifications.length].filter(Boolean).length + 5} · {contactLabel}
            </BpH>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, lineHeight: 1.8 }}>
              {pd.email && <div>{pd.email}</div>}
              {pd.phone && <div>{pd.phone}</div>}
              {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(", ")}</div>}
              {pd.linkedin && <div>{pd.linkedin}</div>}
              {pd.website && <div>{pd.website}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Title block bottom */}
      <div style={{
        borderTop: `1px solid ${white}`, padding: "14px 56px",
        display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: 0, fontSize: 10, fontFamily: "ui-monospace, monospace",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        {[
          ["PROJECT", `CV / ${(pd.firstName || "") + " " + (pd.lastName || "")}`],
          ["SCALE", "1:50"],
          ["DATE", `${String(new Date().getMonth() + 1).padStart(2, "0")}·${new Date().getFullYear()}`],
          ["DRAWING", `${(pd.firstName?.[0] || "") + (pd.lastName?.[0] || "")}`],
        ].map(([k, v]) => (
          <div key={k} style={{ borderRight: `1px solid ${lineColor}`, paddingRight: 12 }}>
            <div style={{ color: subdue, fontSize: 8, letterSpacing: "0.2em" }}>{k}</div>
            <div>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BpH({ children, color, style }: { children: React.ReactNode; color: string; style?: React.CSSProperties }) {
  return (
    <h3 style={{
      fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.22em",
      color, margin: "0 0 8px", textTransform: "uppercase", ...style,
    }}>
      {children}
    </h3>
  )
}

function BpItem({ year, heading, sub, desc, white, subdue, faint }: {
  year: string; heading: string; sub: string; desc?: string;
  white: string; subdue: string; faint: string;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, color: subdue }}>{year}</div>
      <div style={{ fontWeight: 700, fontSize: 12, color: white }}>{heading}</div>
      <div style={{ fontSize: 10.5, color: faint }}>{sub}</div>
      {desc && (
        <div className="resume-desc" style={{ fontSize: 10, color: faint, marginTop: 3, lineHeight: 1.5 }}
          dangerouslySetInnerHTML={{ __html: desc }} />
      )}
    </div>
  )
}
