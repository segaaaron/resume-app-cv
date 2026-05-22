"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"

export default function HerbariumCVTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const cream = "#f0e7c8"
  const ink = "#1d2515"
  const green = config.colorScheme || "#3a5a2a"
  const red = "#8a3a1f"

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h2 style={{
        fontFamily: "'EB Garamond', Georgia, serif",
        fontStyle: "italic", fontSize: 22, color: green,
        margin: "14px 0 8px", fontWeight: 700,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>{children}</h2>
    )
  }

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: cream, color: ink,
      fontFamily: "'EB Garamond', Georgia, serif", fontSize: 11.5,
      padding: 36, position: "relative", display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Botanical border decoration */}
      <div style={{ position: "absolute", inset: 22, border: `1px solid ${green}`, pointerEvents: "none", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      <div style={{ position: "absolute", inset: 27, border: `0.5px solid ${green}`, pointerEvents: "none", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />

      {/* Header */}
      <header style={{ position: "relative", padding: "18px 18px 0", textAlign: "center" }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.35em", color: red, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          · HERBARIUM · CV · No. {new Date().getFullYear()} ·
        </div>
        <h1 style={{
          fontFamily: "'EB Garamond', Georgia, serif",
          fontStyle: "italic", fontSize: 46, fontWeight: 700,
          margin: "10px 0 4px", color: ink,
        }}>
          {pd.firstName || "First"} {pd.lastName || "Last"}
        </h1>
        <div style={{ fontSize: 14 }}>
          {pd.jobTitle || ""}
          {(pd.city || pd.country) ? ` · ${[pd.city, pd.country].filter(Boolean).join(", ")}` : ""}
        </div>
      </header>

      {/* Two-column main */}
      <main style={{ position: "relative", padding: 18, display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 28, flex: 1 }}>

        {/* Left column */}
        <section>

          {visible("summary") && summary && (
            <>
              <H>{config.language === "en" ? "Specimen" : "Espécimen"}</H>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, fontStyle: "italic" }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H>{label("workExperience")}</H>
              {workExperience.map((job) => {
                const startYear = job.startDate?.match(/\d{4}/)?.[0] ?? job.startDate ?? ""
                const endStr = job.currentlyWorking ? present : (job.endDate?.match(/\d{4}/)?.[0] ?? job.endDate ?? "")
                return (
                  <div key={job.id} style={{ display: "grid", gridTemplateColumns: "55px 1fr", padding: "7px 0", borderBottom: `1px dashed ${green}`, gap: 10 }}>
                    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: red, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                      {startYear}{endStr ? `–${endStr}` : ""}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{job.employer || job.jobTitle}</div>
                      <div style={{ fontSize: 11, fontStyle: "italic" }}>
                        {job.employer ? job.jobTitle : ""}{job.city ? ` · ${job.city}` : ""}
                      </div>
                      {job.description && (
                        <div className="resume-desc" style={{ fontSize: 11, color: "#3a3a1a", marginTop: 3 }}
                          dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {visible("skills") && skills.length > 0 && (
            <>
              <H>{label("skills")}</H>
              <p style={{ margin: 0, fontStyle: "italic", fontSize: 11.5, lineHeight: 1.7 }}>
                {skills.map((sk, i) => (
                  <span key={sk.id}><i>{sk.name}</i>{i < skills.length - 1 ? " · " : ""}</span>
                ))}
              </p>
            </>
          )}

          {visible("projects") && projects && projects.length > 0 && (
            <>
              <H>{label("projects")}</H>
              {projects.map((proj) => (
                <div key={proj.id} style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{proj.name}</div>
                  {proj.description && (
                    <div className="resume-desc" style={{ fontSize: 11, fontStyle: "italic", color: "#3a3a1a" }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(proj.description) }} />
                  )}
                </div>
              ))}
            </>
          )}
        </section>

        {/* Right column */}
        <section style={{ position: "relative" }}>
          {/* Botanical SVG illustration */}
          <svg width="100%" height="180" viewBox="0 0 200 180">
            <line x1="100" y1="20" x2="100" y2="170" stroke={green} strokeWidth="1.5" />
            {[40, 70, 100, 130].map((y, i) => (
              <g key={i}>
                <ellipse
                  cx={i % 2 ? 70 : 130} cy={y} rx="22" ry="9"
                  fill="none" stroke={green} strokeWidth="1"
                  transform={`rotate(${i % 2 ? -25 : 25} ${i % 2 ? 70 : 130} ${y})`}
                />
                <line x1="100" y1={y} x2={i % 2 ? 80 : 120} y2={y - 2} stroke={green} strokeWidth="0.8" />
              </g>
            ))}
            <circle cx="100" cy="20" r="6" fill={red} style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties} />
            <text x="100" y="178" textAnchor="middle" fontSize="9" fontStyle="italic" fontFamily="'EB Garamond', Georgia, serif">
              {pd.jobTitle ? pd.jobTitle.split(" ").slice(0, 3).join(" ") : "Curriculum Vitæ"}
            </text>
          </svg>

          {visible("education") && education.length > 0 && (
            <>
              <H>{label("education")}</H>
              <p style={{ margin: 0, lineHeight: 1.7, fontSize: 11.5 }}>
                {education.map((edu) => (
                  <span key={edu.id}>
                    <b>{edu.startDate?.match(/\d{4}/)?.[0] ?? edu.startDate ?? ""}</b>
                    {" · "}{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}
                    {edu.institution ? ` · ${edu.institution}` : ""}<br />
                  </span>
                ))}
              </p>
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H>{label("certifications")}</H>
              <p style={{ margin: 0, lineHeight: 1.7, fontSize: 11.5 }}>
                {certifications.map((cert) => (
                  <span key={cert.id}>
                    {cert.date?.match(/\d{4}/)?.[0] ?? cert.date ?? ""}
                    {" · "}{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}<br />
                  </span>
                ))}
              </p>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H>{label("languages")}</H>
              <p style={{ margin: 0 }}>
                {languages.map((lang, i) => (
                  <span key={lang.id}>
                    {lang.name} {lang.level.toUpperCase()}{i < languages.length - 1 ? " · " : ""}
                  </span>
                ))}
              </p>
            </>
          )}

          {/* Contact */}
          <H>{config.language === "en" ? "Collection" : "Recolección"}</H>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, lineHeight: 1.85 }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && <div>{pd.phone}</div>}
            {pd.linkedin && <div>{pd.linkedin}</div>}
            {pd.website && <div>{pd.website}</div>}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        position: "relative", textAlign: "center",
        padding: "10px 18px",
        fontFamily: "ui-monospace, monospace", fontSize: 9,
        letterSpacing: "0.35em", color: green,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        · COLLECTED &amp; PRESSED · {new Date().getFullYear()} ·
      </footer>
    </div>
  )
}
