"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function FinanceTerminalTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const bg = "#0a0e0c"
  const green = "#36e08c"
  const amber = config.colorScheme || "#ffae00"
  const text = "#cfd0c5"
  const dim = "#6e7166"

  function H({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
      <h2 style={{
        fontSize: 11, color: amber, margin: "0 0 8px",
        letterSpacing: "0.18em", textTransform: "uppercase" as const,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        ...style,
      }}>
        {children}
      </h2>
    )
  }

  function EduItem({ y, h }: { y: string; h: string }) {
    return (
      <div style={{
        display: "grid", gridTemplateColumns: "50px 1fr", gap: 8,
        fontSize: 11, padding: "3px 0", borderBottom: `1px dashed ${dim}`,
      }}>
        <span style={{ color: amber, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{y}</span>
        <span>{h}</span>
      </div>
    )
  }

  function Stat({ l, v, c }: { l: string; v: string; c: string }) {
    return (
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto", gap: 8,
        fontSize: 11, padding: "4px 0", borderBottom: `1px dashed ${dim}`,
      }}>
        <span style={{ color: dim }}>{l}</span>
        <span style={{ color: c, fontWeight: 700, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{v}</span>
      </div>
    )
  }

  const now = new Date()
  const timestamp = `${String(now.getMonth() + 1).padStart(2, "0")}·${String(now.getDate()).padStart(2, "0")}·${String(now.getFullYear()).slice(2)}  ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`

  return (
    <div style={{
      minHeight: "297mm", background: bg, color: text,
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: 10.5, padding: 0, display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Top bar */}
      <div style={{
        background: amber, color: bg, padding: "6px 16px",
        display: "flex", justifyContent: "space-between",
        fontWeight: 800, fontSize: 11,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <span>► RESUME &lt;GO&gt;</span>
        <span>{(pd.lastName || "LAST").toUpperCase()}, {(pd.firstName || "FIRST")[0].toUpperCase()}. — {(pd.jobTitle || "PROFESSIONAL").toUpperCase()}</span>
        <span>{timestamp}</span>
      </div>

      {/* Name/title section */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${dim}` }}>
        <div style={{ color: green, fontSize: 11, letterSpacing: "0.18em", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          ● LIVE  ·  {certifications.slice(0, 2).map(c => c.name).join(" · ") || "PROFESSIONAL"}
        </div>
        <h1 style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 38, fontWeight: 700,
          color: text, margin: "10px 0 4px", letterSpacing: "-0.02em",
        }}>
          {(pd.firstName || "FIRST").toUpperCase()} {(pd.lastName || "LAST").toUpperCase()}
        </h1>
        <div style={{ color: amber, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          {(pd.jobTitle || "").toUpperCase()}
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", padding: 20, gap: 24, flex: 1 }}>
        {/* Left column */}
        <section>
          {visible("summary") && summary && (
            <>
              <H>1) {config.language === "en" ? "PROFILE" : "PERFIL"}</H>
              <p style={{ margin: "0 0 18px", color: text }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H>2) {label("workExperience").toUpperCase()}</H>
              <table style={{ width: "100%", fontSize: 10.5, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${dim}` }}>
                    <th style={{ textAlign: "left", padding: "5px 4px", color: amber, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>YR</th>
                    <th style={{ textAlign: "left", padding: "5px 4px", color: amber, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{config.language === "en" ? "ROLE" : "CARGO"}</th>
                    <th style={{ textAlign: "left", padding: "5px 4px", color: amber, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{config.language === "en" ? "FIRM" : "EMPRESA"}</th>
                    <th style={{ textAlign: "right", padding: "5px 4px", color: amber, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{config.language === "en" ? "LOC" : "LUGAR"}</th>
                  </tr>
                </thead>
                <tbody>
                  {workExperience.map((job) => {
                    const startY = job.startDate?.match(/\d{4}/)?.[0]?.slice(2) ?? ""
                    const endY = job.currentlyWorking
                      ? (config.language === "en" ? "Now" : "Hoy")
                      : job.endDate?.match(/\d{4}/)?.[0]?.slice(2) ?? ""
                    const range = startY && endY ? `${startY}—${endY}` : startY
                    return (
                      <>
                        <tr key={job.id} style={{ borderBottom: job.description ? "none" : `1px dashed ${dim}` }}>
                          <td style={{ padding: "5px 4px" }}>{range}</td>
                          <td style={{ padding: "5px 4px", color: text, fontWeight: 700 }}>{job.jobTitle}</td>
                          <td style={{ padding: "5px 4px" }}>{job.employer}</td>
                          <td style={{ padding: "5px 4px", textAlign: "right", color: dim }}>{job.city || ""}</td>
                        </tr>
                        {job.description && (
                          <tr key={`${job.id}-d`} style={{ borderBottom: `1px dashed ${dim}` }}>
                            <td />
                            <td colSpan={3} style={{ padding: "2px 4px 8px" }}>
                              <div className="resume-desc" style={{ fontSize: 10.5, color: text, lineHeight: 1.55, opacity: 0.8 }}
                                dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </>
          )}

          {visible("skills") && skills.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <H>3) {label("skills").toUpperCase()}</H>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skills.map((sk) => (
                  <span key={sk.id} style={{
                    background: dim, color: bg, padding: "3px 7px",
                    fontSize: 10, fontWeight: 700,
                    WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                  }}>
                    {sk.name.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {visible("projects") && projects && projects.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <H>4) {label("projects").toUpperCase()}</H>
              {projects.map((proj) => (
                <div key={proj.id} style={{ borderBottom: `1px dashed ${dim}`, padding: "5px 0" }}>
                  <div style={{ fontWeight: 700, color: text }}>{proj.name}</div>
                  {proj.description && (
                    <div className="resume-desc" style={{ fontSize: 10, color: dim, marginTop: 2 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right column */}
        <section>
          <H>4) {config.language === "en" ? "METRICS" : "DATOS"}</H>
          {pd.city && <Stat l={config.language === "en" ? "LOCATION" : "UBICACIÓN"} v={[pd.city, pd.country].filter(Boolean).join(", ").toUpperCase()} c={text} />}
          {pd.email && <Stat l="EMAIL" v={pd.email} c={text} />}
          {pd.phone && <Stat l="TEL" v={pd.phone} c={green} />}
          {pd.linkedin && <Stat l="LI" v={pd.linkedin} c={amber} />}

          {visible("education") && education.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <H>5) {label("education").toUpperCase()}</H>
              {education.map((edu) => (
                <EduItem
                  key={edu.id}
                  y={edu.endDate?.match(/\d{4}/)?.[0] ?? edu.startDate?.match(/\d{4}/)?.[0] ?? ""}
                  h={[edu.degree, edu.institution].filter(Boolean).join(" · ")}
                />
              ))}
            </div>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <H>6) {label("certifications").toUpperCase()}</H>
              {certifications.map((cert) => (
                <EduItem
                  key={cert.id}
                  y={cert.date?.match(/\d{4}/)?.[0] ?? ""}
                  h={cert.name}
                />
              ))}
            </div>
          )}

          {visible("languages") && languages.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <H>7) {label("languages").toUpperCase()}</H>
              <div style={{ fontSize: 10.5, lineHeight: 1.85 }}>
                {languages.map((l) => `${l.name} ▸ ${l.level.toUpperCase()}`).join("\n")}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Bottom bar */}
      <div style={{
        background: green, color: bg, padding: "5px 16px",
        fontSize: 10, fontWeight: 700,
        display: "flex", justifyContent: "space-between",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <span>HELP &lt;HELP&gt;</span>
        <span>● DATA NOMINAL · ALL SYSTEMS GREEN</span>
        <span>EOL</span>
      </div>
    </div>
  )
}
