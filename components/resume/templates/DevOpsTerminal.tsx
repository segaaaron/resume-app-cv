"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function DevOpsTerminalTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const bg = "#0a0a0a"
  const green = config.colorScheme || "#00ff88"
  const amber = "#ffae00"
  const red = "#ff4d4d"
  const text = "#dcdcdc"
  const dim = "#666"

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const location = [pd.city, pd.country].filter(Boolean).join(", ")

  const now = new Date()
  const timestamp = `${String(now.getMonth() + 1).padStart(2, "0")}·${String(now.getDate()).padStart(2, "0")}·${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

  type LogLevel = "INFO" | "WARN" | "ERR" | "OK" | "DBG" | null
  type LogRow = [LogLevel, string | null, string | null, string?]

  function LogLine({ row }: { row: LogRow }) {
    if (row[0] === null) {
      return <div style={{ color: dim }}>{row[3]}</div>
    }
    const levelColor = row[0] === "OK" ? green : row[0] === "WARN" ? amber : row[0] === "ERR" ? red : dim
    return (
      <div style={{ display: "grid", gridTemplateColumns: "70px 160px 1fr", lineHeight: 1.6 }}>
        <span style={{ color: levelColor }}>[{row[0]}]</span>
        <span style={{ color: amber }}>{row[1]}=</span>
        <span style={{ color: text }}>{row[2]}</span>
      </div>
    )
  }

  const separator: LogRow = [null, null, null, "========================================================="]

  const rows: LogRow[] = [
    ["INFO", "boot", fullName + (pd.jobTitle ? ` — ${pd.jobTitle}` : "")],
  ]

  if (location) rows.push(["INFO", "loc", location + (config.language === "en" ? " · timezone=local" : " · zona=local")])
  if (pd.phone) rows.push(["INFO", "phone", pd.phone + (pd.email ? ` · email=${pd.email}` : "")])
  if (pd.linkedin) rows.push(["INFO", "web", pd.linkedin])
  if (pd.website) rows.push(["INFO", "site", pd.website])
  rows.push(["DBG", "status", config.language === "en" ? "available=true · open_to_offers=true" : "disponible=true · abierto_a_ofertas=true"])

  if (visible("summary") && summary) {
    rows.push(separator)
    rows.push(["INFO", label("summary").toLowerCase().replace(/\s+/g, "_"), summary])
  }

  // workExperience rendered separately in JSX to support bullet sub-lines

  if (visible("skills") && skills.length > 0) {
    rows.push(separator)
    const chunkSize = 6
    for (let i = 0; i < skills.length; i += chunkSize) {
      const chunk = skills.slice(i, i + chunkSize)
      rows.push(["INFO", "stack", chunk.map((s) => s.name).join(" · ")])
    }
  }

  if (visible("education") && education.length > 0) {
    rows.push(separator)
    education.forEach((edu) => {
      const year = edu.endDate?.match(/\d{4}/)?.[0] ?? edu.startDate?.match(/\d{4}/)?.[0] ?? ""
      const degree = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(" ")
      rows.push(["INFO", "edu", `[${year}] ${degree}${edu.institution ? ` · ${edu.institution}` : ""}`])
    })
  }

  if (visible("certifications") && certifications.length > 0) {
    rows.push(separator)
    const certStr = certifications.map((c) => c.name).join(" · ")
    rows.push(["INFO", "cert", certStr])
  }

  if (visible("languages") && languages.length > 0) {
    rows.push(separator)
    const langStr = languages.map((l) => `${l.name}${l.level ? `(${l.level.toUpperCase()})` : ""}`).join(" · ")
    rows.push(["INFO", "langs", langStr])
  }

  if (visible("projects") && projects && projects.length > 0) {
    rows.push(separator)
    projects.forEach((proj) => {
      rows.push(["INFO", "oss", `${proj.name}${proj.url ? ` — ${proj.url}` : ""}${proj.description ? ` — ${proj.description.slice(0, 60)}` : ""}`])
    })
  }

  rows.push(separator)
  rows.push(["OK", "ready", config.language === "en" ? "open to new opportunities · remote/hybrid" : "abierto a nuevas oportunidades · remoto/híbrido"])

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: bg, color: text,
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: 11, padding: 0, display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Top bar */}
      <div style={{
        background: "#1a1a1a", color: "#ccc", padding: "6px 14px",
        fontSize: 10, display: "flex", justifyContent: "space-between",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <span>● ● ● &nbsp; ~/career $ tail -f resume.log</span>
        <span>{timestamp}</span>
      </div>

      {/* Log content */}
      <div style={{ padding: "20px 22px", flex: 1 }}>
        {rows.map((row, i) => (
          <LogLine key={i} row={row} />
        ))}

        {/* Work experience with bullets */}
        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <LogLine row={separator} />
            {workExperience.map((job) => {
              const start = job.startDate?.match(/\d{4}/)?.[0] ?? ""
              const end = job.currentlyWorking ? present.slice(0, 4) : (job.endDate?.match(/\d{4}/)?.[0] ?? "")
              const range = start && end ? `[${start}→${end}]` : start ? `[${start}→]` : ""
              const bullets = job.description
                ? job.description.replace(/<br\s*\/?>/gi, "\n").replace(/([^\n])\s*•\s+/g, "$1\n• ").split("\n").map(l => l.replace(/^[•\-]\s*/, "").trim()).filter(Boolean)
                : []
              return (
                <div key={job.id}>
                  <div style={{ display: "grid", gridTemplateColumns: "70px 160px 1fr", lineHeight: 1.6 }}>
                    <span style={{ color: dim }}>[INFO]</span>
                    <span style={{ color: amber }}>exp=</span>
                    <span style={{ color: text }}>{range} {job.employer || ""}{job.jobTitle ? ` · ${job.jobTitle}` : ""}{job.city ? ` · ${job.city}` : ""}</span>
                  </div>
                  {bullets.map((b, bi) => (
                    <div key={bi} style={{ display: "grid", gridTemplateColumns: "70px 160px 1fr", lineHeight: 1.6 }}>
                      <span style={{ color: dim }}>[DBG]</span>
                      <span style={{ color: amber }}>task=</span>
                      <span style={{ color: "#a6e3a1" }}>{b}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </>
        )}

        <div style={{ marginTop: 12, color: green }}>$ <span>▊</span></div>
      </div>

      {/* Status bar */}
      <div style={{
        background: "#1a1a1a", color: dim, padding: "5px 14px",
        display: "flex", justifyContent: "space-between", fontSize: 10,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <span>● connected</span>
        <span>load 0.42 · cpu 8% · mem 32%</span>
        <span>v{new Date().getFullYear()}.{String(now.getMonth() + 1).padStart(2, "0")}</span>
      </div>
    </div>
  )
}
