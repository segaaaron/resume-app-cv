"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"

export default function CodeEditorTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const bg = "#1e1e2e"
  const line = "#313244"
  const text = "#cdd6f4"
  const dim = "#7c7f93"
  const red = "#f38ba8"
  const green = "#a6e3a1"
  const yellow = "#f9e2af"
  const blue = config.colorScheme || "#89b4fa"
  const purple = "#cba6f7"

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const location = [pd.city, pd.country].filter(Boolean).join(", ")

  let lineNum = 0
  const nextLine = () => ++lineNum

  function K({ children }: { children: React.ReactNode }) {
    return <span style={{ color: purple }}>{children}</span>
  }
  function S({ children }: { children: React.ReactNode }) {
    return <span style={{ color: green }}>{children}</span>
  }
  function V({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return <span style={{ color: blue, ...style }}>{children}</span>
  }
  function Comment({ children }: { children: React.ReactNode }) {
    return <div style={{ color: dim, fontStyle: "italic" }}>{children}</div>
  }
  function Line({ children }: { children?: React.ReactNode }) {
    const n = nextLine()
    return (
      <div style={{ display: "flex" }}>
        <span style={{ width: 36, flexShrink: 0, color: dim, fontSize: 10.5, textAlign: "right", paddingRight: 12, userSelect: "none" }}>{n}</span>
        <div style={{ flex: 1 }}>{children || "\u00A0"}</div>
      </div>
    )
  }
  function Indent({ children }: { children?: React.ReactNode }) {
    const n = nextLine()
    return (
      <div style={{ display: "flex" }}>
        <span style={{ width: 36, flexShrink: 0, color: dim, fontSize: 10.5, textAlign: "right", paddingRight: 12, userSelect: "none" }}>{n}</span>
        <div style={{ flex: 1, paddingLeft: 22 }}>{children || "\u00A0"}</div>
      </div>
    )
  }

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: bg, color: text,
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: 11.5, padding: 0, display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Title bar */}
      <div style={{
        background: "#181825", padding: "8px 16px", display: "flex",
        alignItems: "center", gap: 8, borderBottom: `1px solid ${line}`,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: red, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: yellow, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: green, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        </div>
        <div style={{ marginLeft: 12, color: dim, fontSize: 11 }}>resume.ts &nbsp;·&nbsp; ~/career/{new Date().getFullYear()}</div>
      </div>

      {/* Code area */}
      <div style={{ flex: 1, padding: "12px 0", lineHeight: 1.6 }}>
        <Line><Comment>// resume.ts — {fullName}{pd.jobTitle ? ` · ${pd.jobTitle}` : ""}</Comment></Line>
        <Line><K>import</K> {" { "}<span style={{ color: text }}>Career</span>, <span style={{ color: text }}>Skill</span>, <span style={{ color: text }}>Project</span>{" } "}<K>from</K> <S>"./career"</S>;</Line>
        <Line />

        {/* Personal details object */}
        <Line><K>const</K> <V style={{ color: yellow }}>me</V>: <span style={{ color: text }}>Career</span> = {"{"}</Line>
        {pd.firstName || pd.lastName ? (
          <Indent>name: <S>"{fullName}"</S>,</Indent>
        ) : null}
        {pd.jobTitle ? (
          <Indent>title: <S>"{pd.jobTitle}"</S>,</Indent>
        ) : null}
        {pd.email ? (
          <Indent>email: <S>"{pd.email}"</S>,</Indent>
        ) : null}
        {pd.phone ? (
          <Indent>phone: <S>"{pd.phone}"</S>,</Indent>
        ) : null}
        {pd.linkedin ? (
          <Indent>github: <S>"{pd.linkedin}"</S>,</Indent>
        ) : null}
        {pd.website ? (
          <Indent>website: <S>"{pd.website}"</S>,</Indent>
        ) : null}
        {location ? (
          <Indent>basedIn: <S>"{location}"</S>,</Indent>
        ) : null}
        <Line>{"}"}</Line>
        <Line />

        {/* Summary */}
        {visible("summary") && summary && (
          <>
            <Line><Comment>// MARK: summary</Comment></Line>
            <Line><K>const</K> <V style={{ color: yellow }}>profile</V> = <S>"{summary.slice(0, 120)}{summary.length > 120 ? "…" : ""}"</S>;</Line>
            <Line />
          </>
        )}

        {/* Work experience */}
        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <Line><Comment>// MARK: {label("workExperience").toLowerCase()}</Comment></Line>
            <Line><K>const</K> <V style={{ color: yellow }}>jobs</V>: <V>Job</V>[] = [</Line>
            {workExperience.map((job) => {
              const start = job.startDate?.match(/\d{4}/)?.[0] ?? ""
              const end = job.currentlyWorking ? present.slice(0, 2) : (job.endDate?.match(/\d{4}/)?.[0] ?? "")
              const range = start && end ? `${start}—${end}` : start || end
              const bullets = job.description
                ? job.description.replace(/<br\s*\/?>/gi, "\n").replace(/([^\n])\s*•\s+/g, "$1\n• ").split("\n").map(l => l.replace(/^[•\-]\s*/, "").trim()).filter(Boolean)
                : []
              return (
                <div key={job.id}>
                  <Indent>
                    {"{ "}years: <S>"{range}"</S>, co: <S>"{job.employer || ""}"</S>, role: <S>"{job.jobTitle || ""}"</S>{bullets.length ? "," : " },"}
                  </Indent>
                  {bullets.length > 0 && (
                    <>
                      <Indent>{"  description: ["}</Indent>
                      {bullets.map((b, bi) => (
                        <Indent key={bi}>{"    "}<S>"{b}"</S>,</Indent>
                      ))}
                      <Indent>{"  ],"}</Indent>
                      <Indent>{"}"}{","}</Indent>
                    </>
                  )}
                </div>
              )
            })}
            <Line>];</Line>
            <Line />
          </>
        )}

        {/* Skills */}
        {visible("skills") && skills.length > 0 && (
          <>
            <Line><Comment>// MARK: {label("skills").toLowerCase()}</Comment></Line>
            <Line><K>const</K> <V style={{ color: yellow }}>stack</V>: <V>Skill</V>[] = [</Line>
            {/* Render skills in groups of 4 */}
            {Array.from({ length: Math.ceil(skills.length / 4) }).map((_, gi) => {
              const group = skills.slice(gi * 4, gi * 4 + 4)
              return (
                <Indent key={gi}>
                  {group.map((sk, i) => (
                    <span key={sk.id}><S>"{sk.name}"</S>{i < group.length - 1 || gi < Math.ceil(skills.length / 4) - 1 ? ", " : ""}</span>
                  ))}
                </Indent>
              )
            })}
            <Line>];</Line>
            <Line />
          </>
        )}

        {/* Education */}
        {visible("education") && education.length > 0 && (
          <>
            <Line><Comment>// MARK: {label("education").toLowerCase()}</Comment></Line>
            <Line><K>const</K> <V style={{ color: yellow }}>edu</V> = {"{"}</Line>
            {education.map((edu) => {
              const year = edu.endDate?.match(/\d{4}/)?.[0] ?? edu.startDate?.match(/\d{4}/)?.[0] ?? ""
              const degree = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(" ")
              return (
                <Indent key={edu.id}>
                  {edu.institution ? <><V>{edu.institution.replace(/\s+/g, "_").toLowerCase()}</V>: <S>"{degree}{year ? ` · ${year}` : ""}"</S>,</> : <S>"{degree}"</S>}
                </Indent>
              )
            })}
            <Line>{"}"}</Line>
            <Line />
          </>
        )}

        {/* Certifications */}
        {visible("certifications") && certifications.length > 0 && (
          <>
            <Line><Comment>// MARK: {label("certifications").toLowerCase()}</Comment></Line>
            <Line><K>const</K> <V style={{ color: yellow }}>certs</V> = [</Line>
            {certifications.map((cert) => (
              <Indent key={cert.id}><S>"{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}"</S>,</Indent>
            ))}
            <Line>];</Line>
            <Line />
          </>
        )}

        {/* Projects */}
        {visible("projects") && projects && projects.length > 0 && (
          <>
            <Line><Comment>// MARK: {label("projects").toLowerCase()}</Comment></Line>
            <Line><K>const</K> <V style={{ color: yellow }}>oss</V> = [</Line>
            {projects.map((proj) => (
              <Indent key={proj.id}><S>"{proj.name}{proj.url ? ` — ${proj.url}` : ""}"</S>,</Indent>
            ))}
            <Line>];</Line>
            <Line />
          </>
        )}

        {/* Languages */}
        {visible("languages") && languages.length > 0 && (
          <>
            <Line><Comment>// MARK: {label("languages").toLowerCase()}</Comment></Line>
            <Line><K>const</K> <V style={{ color: yellow }}>spoken</V> = [{languages.map((l, i) => <span key={l.id}><S>"{l.name}{l.level ? ` (${l.level.toUpperCase()})` : ""}"</S>{i < languages.length - 1 ? ", " : ""}</span>)}];</Line>
            <Line />
          </>
        )}

        <Line><K>export default</K> <V style={{ color: yellow }}>Hired</V>(<V style={{ color: yellow }}>me</V>);</Line>
      </div>

      {/* Status bar */}
      <div style={{
        background: blue, color: bg, padding: "5px 16px",
        display: "flex", justifyContent: "space-between", fontSize: 10,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <span>● TypeScript</span>
        <span>● No errors · prettier ✓</span>
        <span>UTF-8 · LF</span>
      </div>
    </div>
  )
}
