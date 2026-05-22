"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function AnimatorCVTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present

  const cream = "#f6e9c7"
  const ink = "#1a1a1a"
  const red = config.colorScheme || "#e23a44"
  const blue = "#2a4ca8"

  // Film frames strip — 16 frames
  const frames = Array.from({ length: 16 }, (_, i) => i)

  const firstYear = workExperience.length > 0
    ? workExperience[workExperience.length - 1].startDate?.match(/\d{4}/)?.[0] || "—"
    : "—"
  const lastYear = workExperience.length > 0
    ? (workExperience[0].currentlyWorking ? present : workExperience[0].endDate?.match(/\d{4}/)?.[0] || present)
    : present

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: cream,
      color: ink,
      fontFamily: "'Inter Tight', 'Inter', sans-serif",
      fontSize: 11,
      padding: 36,
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `2px solid ${ink}`, paddingBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.25em", color: red }}>
            ANIMATIC · 24FPS · CV CYCLE
          </div>
          <h1 style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 900, fontSize: 48, margin: "6px 0 0", letterSpacing: "-0.03em" }}>
            {(pd.firstName || "FIRST").toUpperCase()} {(pd.lastName || "LAST").toUpperCase()}
          </h1>
          {pd.jobTitle && (
            <div style={{ fontSize: 13 }}>{pd.jobTitle}</div>
          )}
        </div>
        <div style={{
          background: red,
          color: cream,
          padding: "6px 12px",
          fontFamily: "ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: "0.18em",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}>● REC</div>
      </header>

      {/* Film strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 4, margin: "16px 0" }}>
        {frames.map((i) => (
          <div key={i} style={{
            aspectRatio: "16/10",
            background: i % 2 ? cream : "#fff",
            border: `1.5px solid ${ink}`,
            position: "relative",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}>
            <div style={{ position: "absolute", top: 2, left: 4, fontFamily: "ui-monospace, monospace", fontSize: 8, color: blue }}>
              {String(i + 1).padStart(3, "0")}
            </div>
            <svg viewBox="0 0 60 36" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <circle
                cx={20 + i * 1.5}
                cy={18 + Math.sin(i * 0.6) * 8}
                r={3 + i * 0.2}
                fill={i < 8 ? red : blue}
              />
            </svg>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: blue, letterSpacing: "0.2em", textAlign: "center", marginBottom: 16 }}>
        FIG. 1 · CAREER TIMELINE · {firstYear} → {lastYear}
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, flex: 1 }}>
        {/* Left — work + summary */}
        <section>
          {visible("summary") && summary && (
            <>
              <H red={red}>{config.language === "en" ? "Bio" : "Perfil"}</H>
              <p style={{ margin: "0 0 12px", lineHeight: 1.6, fontSize: 11.5 }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H red={red}>{config.language === "en" ? "Frames" : "Escenas"}</H>
              {workExperience.map((job) => (
                <div key={job.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr", padding: "8px 0", borderBottom: `1px dashed ${ink}`, gap: 12 }}>
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: red }}>
                    {job.startDate?.match(/\d{4}/)?.[0] || ""}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12.5 }}>{job.employer}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>
                      {job.jobTitle}
                      {job.city ? ` · ${job.city}` : ""}
                      {job.currentlyWorking ? ` — ${present}` : job.endDate?.match(/\d{4}/)?.[0] ? ` — ${job.endDate.match(/\d{4}/)?.[0]}` : ""}
                    </div>
                    {job.description && (
                      <div className="resume-desc" style={{ fontSize: 10.5, color: "#444", marginTop: 4, lineHeight: 1.5 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("projects") && projects && projects.length > 0 && (
            <>
              <H red={red}>{label("projects")}</H>
              {projects.map((proj) => (
                <div key={proj.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr", padding: "8px 0", borderBottom: `1px dashed ${ink}`, gap: 12 }}>
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: red }}>
                    {proj.startDate?.match(/\d{4}/)?.[0] || ""}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12.5 }}>{proj.name}</div>
                    {proj.description && (
                      <div className="resume-desc" style={{ fontSize: 11, color: "#555" }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </section>

        {/* Right — skills, edu, certs, langs, contact */}
        <section>
          {visible("skills") && skills.length > 0 && (
            <>
              <H red={red}>{label("skills")}</H>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {skills.map((sk) => (
                  <span key={sk.id} style={{
                    background: blue,
                    color: cream,
                    padding: "4px 9px",
                    fontSize: 10,
                    fontFamily: "ui-monospace, monospace",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}>{sk.name}</span>
                ))}
              </div>
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <H red={red}>{label("education")}</H>
              <div style={{ margin: 0, lineHeight: 1.7, fontSize: 11.5 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    {edu.endDate?.match(/\d{4}/)?.[0] && <b>{edu.endDate.match(/\d{4}/)?.[0]} · </b>}
                    {edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}
                    {edu.institution ? ` · ${edu.institution}` : ""}
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H red={red}>{label("certifications")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85 }}>
                {certifications.map((cert) => (
                  <li key={cert.id}>
                    {cert.date?.match(/\d{4}/)?.[0] ? `${cert.date.match(/\d{4}/)?.[0]} · ` : ""}
                    {cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H red={red}>{label("languages")}</H>
              <div style={{ lineHeight: 1.7, fontSize: 11.5 }}>
                {languages.map((lang) => (
                  <div key={lang.id}>{lang.name} · {lang.level.toUpperCase()}</div>
                ))}
              </div>
            </>
          )}

          <H red={red}>{L.contact}</H>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, lineHeight: 1.85 }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && <div>{pd.phone}</div>}
            {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(" · ")}</div>}
            {pd.linkedin && <div>{pd.linkedin}</div>}
            {pd.website && <div>{pd.website}</div>}
          </div>
        </section>
      </div>
    </div>
  )
}

function H({ children, red }: { children: React.ReactNode; red: string }) {
  return (
    <h2 style={{
      fontFamily: "'Inter Tight', 'Inter', sans-serif",
      fontWeight: 800,
      fontSize: 15,
      margin: "14px 0 8px",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      color: red,
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>{children}</h2>
  )
}
