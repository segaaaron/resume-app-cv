"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"

export default function TerminalCVTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = sd
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"

  const bg = "#1e1f2e"
  const panel = "#252638"
  const line = "#34354a"
  const text = "#e6e6f0"
  const dim = "#7f8094"
  const blue = "#6cb6ff"
  const purple = "#c39bff"
  const green = "#7cdba4"
  const orange = "#ffa657"
  const pink = "#ff7b9c"

  let lineNum = 0
  const Ln = ({ children, indent = 0 }: { children?: React.ReactNode; indent?: number }) => {
    lineNum += 1
    return (
      <div style={{ display: "flex", gap: 14, lineHeight: "1.6em" }}>
        <span style={{ color: dim, width: 22, textAlign: "right", userSelect: "none", flexShrink: 0 }}>{lineNum}</span>
        <span style={{ paddingLeft: indent * 16 }}>{children}</span>
      </div>
    )
  }

  const fullName = `${pd.firstName || "First"} ${pd.lastName || "Last"}`
  const jobTitle = pd.jobTitle || "Software Engineer"

  return (
    <div style={{
      minHeight: "297mm", background: bg, color: text,
      fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace", fontSize: 11.5,
      display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Title bar */}
      <div style={{ background: "#15161f", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${line}`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", display: "inline-block", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e", display: "inline-block", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840", display: "inline-block", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        </div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: dim }}>resume.swift — ~/cv/{new Date().getFullYear()}</div>
        <div style={{ fontSize: 10, color: dim }}>Xcode {new Date().getFullYear()}</div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", background: panel, borderBottom: `1px solid ${line}`, fontSize: 10.5, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        {["Navigator", "resume.swift", "experience.swift", "✓ Build Succeeded"].map((t, i) => (
          <div key={t} style={{ padding: "8px 14px", borderRight: `1px solid ${line}`, color: i === 1 ? text : dim, background: i === 1 ? bg : "transparent", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{t}</div>
        ))}
      </div>

      {/* Editor area */}
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", flex: 1, fontSize: 10.8 }}>
        {/* File navigator */}
        <aside style={{ background: panel, borderRight: `1px solid ${line}`, padding: "16px 12px", color: dim, lineHeight: 2, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          <div style={{ color: text, marginBottom: 10, fontWeight: 700 }}>📁 cv</div>
          <div style={{ paddingLeft: 12 }}>
            <div style={{ color: text }}>📄 resume.swift</div>
            <div>📄 profile.swift</div>
            <div>📄 experience.swift</div>
            <div>📄 skills.swift</div>
            <div>📁 education/</div>
            <div>📄 Package.swift</div>
            <div>📄 README.md</div>
          </div>
          <div style={{ marginTop: 24, color: text, fontWeight: 700 }}>🔧 Build</div>
          <div style={{ paddingLeft: 12 }}>
            <div style={{ color: green }}>● Compiled</div>
            <div>0 errors · 0 warnings</div>
          </div>
        </aside>

        {/* Code editor */}
        <div style={{ margin: 0, padding: "16px 18px", overflow: "hidden", fontFamily: "inherit", fontSize: "inherit" }}>
          <Ln><span style={{ color: dim, fontStyle: "italic" }}>{"// resume.swift — "}{jobTitle}{" · "}{new Date().getFullYear()}</span></Ln>
          <Ln />
          <Ln><span style={{ color: pink }}>import</span> <span style={{ color: purple }}>Foundation</span></Ln>
          <Ln><span style={{ color: pink }}>import</span> <span style={{ color: purple }}>SwiftUI</span></Ln>
          <Ln />
          <Ln><span style={{ color: pink }}>@main struct</span> <span style={{ color: purple }}>Resume</span>{": "}<span style={{ color: purple }}>Engineer</span> {"{"}</Ln>
          <Ln indent={1}><span style={{ color: pink }}>let</span> <span style={{ color: blue }}>name</span>{" = "}<span style={{ color: orange }}>"{fullName}"</span></Ln>
          <Ln indent={1}><span style={{ color: pink }}>let</span> <span style={{ color: blue }}>role</span>{" = "}<span style={{ color: orange }}>"{jobTitle}"</span></Ln>
          {pd.email && <Ln indent={1}><span style={{ color: pink }}>let</span> <span style={{ color: blue }}>email</span>{" = "}<span style={{ color: orange }}>"{pd.email}"</span></Ln>}
          {pd.phone && <Ln indent={1}><span style={{ color: pink }}>let</span> <span style={{ color: blue }}>phone</span>{" = "}<span style={{ color: orange }}>"{pd.phone}"</span></Ln>}
          <Ln />
          {visible("summary") && summary && (
            <>
              <Ln indent={1}><span style={{ color: dim, fontStyle: "italic" }}>{"// MARK: — Summary"}</span></Ln>
              <Ln indent={1}><span style={{ color: pink }}>let</span> <span style={{ color: blue }}>summary</span>{" = "}<span style={{ color: orange }}>"""</span></Ln>
              <Ln indent={2}><span style={{ color: orange }}>{summary.slice(0, 120)}{summary.length > 120 ? "..." : ""}</span></Ln>
              <Ln indent={1}><span style={{ color: orange }}>"""</span></Ln>
              <Ln />
            </>
          )}
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <Ln indent={1}><span style={{ color: dim, fontStyle: "italic" }}>{"// MARK: — Experience"}</span></Ln>
              <Ln indent={1}><span style={{ color: pink }}>let</span> <span style={{ color: blue }}>experience</span>{": ["}<span style={{ color: purple }}>Role</span>{"] = ["}</Ln>
              {workExperience.map((job) => {
                const range = job.currentlyWorking ? `—${present}` : job.endDate ? `—${job.endDate}` : ""
                return (
                  <Ln key={job.id} indent={2}>
                    <span style={{ color: purple }}>Role</span>
                    {"(co: "}
                    <span style={{ color: orange }}>{`"${job.employer}"`}</span>
                    {", role: "}
                    <span style={{ color: orange }}>{`"${job.jobTitle}"`}</span>
                    {", range: "}
                    <span style={{ color: orange }}>{`"${job.startDate}${range}"`}</span>
                    {"),"}
                  </Ln>
                )
              })}
              <Ln indent={1}>]</Ln>
              <Ln />
            </>
          )}
          {visible("skills") && skills.length > 0 && (
            <>
              <Ln indent={1}><span style={{ color: dim, fontStyle: "italic" }}>{"// MARK: — Stack"}</span></Ln>
              <Ln indent={1}><span style={{ color: pink }}>let</span> <span style={{ color: blue }}>skills</span>{" = ["}{skills.slice(0, 6).map((sk, i) => (
                <span key={sk.id}><span style={{ color: orange }}>"{sk.name}"</span>{i < Math.min(skills.length, 6) - 1 ? ", " : ""}</span>
              ))}{"]"}</Ln>
              <Ln />
            </>
          )}
          {visible("education") && education.length > 0 && (
            <>
              <Ln indent={1}><span style={{ color: dim, fontStyle: "italic" }}>{"// MARK: — Education"}</span></Ln>
              {education.map((edu) => (
                <div key={edu.id}>
                  <Ln indent={1}><span style={{ color: pink }}>let</span> <span style={{ color: blue }}>education</span>{" = "}<span style={{ color: purple }}>Degree</span>{"("}</Ln>
                  <Ln indent={2}>{"title: "}<span style={{ color: orange }}>"{edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}"</span>{","}</Ln>
                  {edu.institution && <Ln indent={2}>{"school: "}<span style={{ color: orange }}>"{edu.institution}"</span>{","}</Ln>}
                  {(edu.startDate || edu.endDate) && <Ln indent={2}>{"years: "}<span style={{ color: orange }}>"{edu.startDate}{edu.endDate ? `—${edu.endDate}` : ""}"</span></Ln>}
                  <Ln indent={1}>{")"}</Ln>
                </div>
              ))}
              <Ln />
            </>
          )}
          {visible("languages") && languages.length > 0 && (
            <>
              <Ln indent={1}><span style={{ color: pink }}>let</span> <span style={{ color: blue }}>spoken</span>{" = ["}{languages.map((lang, i) => (
                <span key={lang.id}><span style={{ color: orange }}>"{lang.name}"</span>{i < languages.length - 1 ? ", " : ""}</span>
              ))}{"]"}</Ln>
            </>
          )}
          <Ln>{"}"}</Ln>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ background: "#15161f", padding: "8px 16px", borderTop: `1px solid ${line}`, display: "flex", justifyContent: "space-between", fontSize: 10, color: dim, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <span>● Build Succeeded</span>
        <span>UTF-8 · Swift 5.10</span>
        <span>main · ✓ clean</span>
      </div>
    </div>
  )
}
