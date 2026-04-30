"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

const SKILL_PCT: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }

function Lab({ children, red, style = {} }: { children: React.ReactNode; red: string; style?: React.CSSProperties }) {
  return (
    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9.5, letterSpacing: "0.2em", color: red, textTransform: "uppercase", marginBottom: 10, ...style }}>
      {children}
    </div>
  )
}

function SkillRow({ l, v, ink, grid }: { l: string; v: number; ink: string; grid: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5 }}>
        <span>{l}</span>
        <span style={{ fontFamily: "ui-monospace, monospace", color: "#555" }}>{v}%</span>
      </div>
      <div style={{ height: 4, background: grid, marginTop: 3, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <div style={{ height: 4, width: `${v}%`, background: ink, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      </div>
    </div>
  )
}

export default function DataDrivenTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = sd
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"

  const ink = "#0a0a0a"
  const paper = "#fafafa"
  const grid = "#ececec"
  const red = config.colorScheme

  const yearsExp = (() => {
    if (pd.yearsOfExperience && parseInt(pd.yearsOfExperience) > 0) return pd.yearsOfExperience
    if (workExperience.length === 0) return "0"
    const oldest = workExperience[workExperience.length - 1]
    if (!oldest.startDate) return "0"
    const yr = parseInt(oldest.startDate.match(/\d{4}/)?.[0] || "NaN")
    if (isNaN(yr)) return "0"
    return String(new Date().getFullYear() - yr)
  })()

  // Sparkline points — evenly spaced up-trend based on # jobs
  const sparkPoints = (() => {
    const count = Math.max(workExperience.length, 2)
    return Array.from({ length: count }, (_, i) => {
      const x = Math.round((i / (count - 1)) * 380)
      const y = Math.round(36 - (i / (count - 1)) * 32)
      return `${x},${y}`
    }).join(" ")
  })()

  const sparkDots = sparkPoints.split(" ").map((pt) => {
    const [x, y] = pt.split(",").map(Number)
    return { x, y }
  })

  return (
    <div style={{
      minHeight: "297mm", background: paper, color: ink,
      fontFamily: "'Inter Tight', 'Inter', sans-serif", fontSize: 10.5, lineHeight: 1.5,
      padding: 44, display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Header: big number + name */}
      <header style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, padding: "24px 0", borderBottom: `1px solid ${ink}` }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 168, lineHeight: 0.85, letterSpacing: "-0.07em" }}>{yearsExp}</div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.18em", color: red, marginTop: 4, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            {config.language === "en" ? "YEARS EXPERIENCE" : "AÑOS DE EXPERIENCIA"}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <h1 style={{ fontWeight: 800, fontSize: 36, lineHeight: 1, margin: 0, letterSpacing: "-0.03em" }}>
            {pd.firstName || "First"} {pd.lastName || "Last"}
          </h1>
          {pd.jobTitle && <div style={{ fontSize: 13, marginTop: 8 }}>{pd.jobTitle}</div>}
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, marginTop: 12, color: "#555", lineHeight: 1.85 }}>
            {pd.email && <div>↗ {pd.email}</div>}
            {pd.phone && <div>↗ {pd.phone}</div>}
            {(pd.city || pd.country) && <div>↗ {[pd.city, pd.country].filter(Boolean).join(", ")}</div>}
          </div>
        </div>
      </header>

      {/* Metric strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, padding: "20px 0", borderBottom: `1px solid ${ink}` }}>
        {[
          [String(workExperience.length), config.language === "en" ? "companies" : "empresas"],
          [String(skills.length), config.language === "en" ? "skills" : "habilidades"],
          [String(education.length), config.language === "en" ? "degrees" : "títulos"],
          [String(certifications.length), config.language === "en" ? "certs" : "certs"],
          [String(languages.length), config.language === "en" ? "languages" : "idiomas"],
        ].map(([k, v]) => (
          <div key={v}>
            <div style={{ fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em" }}>{k}</div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.15em", color: red, textTransform: "uppercase", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 28, padding: "20px 0", flex: 1 }}>
        {/* Experience */}
        <div>
          {visible("summary") && summary && (
            <>
              <Lab red={red}>00 · {label("summary")}</Lab>
              <p style={{ margin: "0 0 16px", fontSize: 11 }}>{summary}</p>
            </>
          )}
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <Lab red={red}>01 · {label("workExperience")}</Lab>
              {workExperience.map((job) => (
                <div key={job.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr 100px", gap: 10, padding: "10px 0", borderBottom: `1px dashed ${grid}`, alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10 }}>
                    {job.startDate}{job.currentlyWorking ? `→` : job.endDate ? `→${job.endDate}` : ""}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{job.employer}</div>
                    <div style={{ fontSize: 10.5, color: "#555" }}>{job.jobTitle}</div>
                    {job.description && (
                      <div className="resume-desc" style={{ fontSize: 10, color: "#555", marginTop: 4 }} dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                  <div style={{ height: 8, background: grid, position: "relative", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: "80%", background: ink, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Right column */}
        <div>
          {visible("skills") && skills.length > 0 && (
            <>
              <Lab red={red}>02 · {label("skills")}</Lab>
              {skills.map((sk) => (
                <SkillRow key={sk.id} l={sk.name} v={SKILL_PCT[sk.level] ?? 50} ink={ink} grid={grid} />
              ))}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <Lab red={red} style={{ marginTop: 18 }}>03 · {label("education")}</Lab>
              {education.map((edu) => (
                <div key={edu.id} style={{ fontSize: 11.5, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}</div>
                  {edu.institution && <div style={{ color: "#555" }}>{edu.institution}{edu.startDate ? ` · ${edu.startDate}${edu.endDate ? `—${edu.endDate}` : ""}` : ""}</div>}
                </div>
              ))}
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <Lab red={red} style={{ marginTop: 18 }}>04 · {label("languages")}</Lab>
              {languages.map((lang) => (
                <div key={lang.id} style={{ fontSize: 11, marginBottom: 4 }}>{lang.name} · {lang.level.toUpperCase()}</div>
              ))}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <Lab red={red} style={{ marginTop: 18 }}>05 · {label("certifications")}</Lab>
              {certifications.map((cert) => (
                <div key={cert.id} style={{ fontSize: 11, marginBottom: 4 }}>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}</div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Sparkline footer */}
      <footer style={{ borderTop: `1px solid ${ink}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Lab red={red} style={{ marginBottom: 0 }}>Career sparkline</Lab>
        <svg width="380" height="40" viewBox="0 0 380 40">
          <polyline points={sparkPoints} fill="none" stroke={ink} strokeWidth="1.5" />
          {sparkDots.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={i === sparkDots.length - 1 ? 4 : 2} fill={i === sparkDots.length - 1 ? red : ink} />
          ))}
        </svg>
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: "#555" }}>
          {workExperience.length > 0 ? `${workExperience[workExperience.length - 1].startDate?.slice(0, 4) || "?"} → ${new Date().getFullYear()}` : ""}
        </span>
      </footer>
    </div>
  )
}
