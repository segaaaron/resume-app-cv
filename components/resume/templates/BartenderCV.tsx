"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function BartenderCVTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present

  const black = "#0d0a0a"
  const neon = config.colorScheme || "#ff2e63"
  const cyan = "#00d6c2"
  const cream = "#f5edd6"
  const gold = "#ffc645"

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h2 style={{
        fontFamily: "'Permanent Marker', cursive",
        fontSize: 22,
        color: gold,
        margin: "16px 0 8px",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>{children}</h2>
    )
  }

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: black,
      color: cream,
      fontFamily: "'Inter', sans-serif",
      fontSize: 11,
      padding: 0,
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Glow background */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,46,99,0.18), transparent 40%), radial-gradient(circle at 80% 80%, rgba(0,214,194,0.16), transparent 40%)`,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        pointerEvents: "none",
      }}></div>

      {/* Header */}
      <header style={{
        padding: "44px 48px 24px",
        textAlign: "center",
        position: "relative",
        borderBottom: `2px solid ${neon}`,
      }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.4em", color: cyan }}>
          ★ HAPPY HOUR · OPEN ★
        </div>
        <h1 style={{
          fontFamily: "'Permanent Marker', cursive",
          fontSize: 72,
          lineHeight: 0.95,
          margin: "10px 0 4px",
          color: neon,
          textShadow: `0 0 12px ${neon}`,
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}>
          {(pd.firstName || "FIRST").toUpperCase()} {(pd.lastName || "LAST").toUpperCase()}
        </h1>
        {pd.jobTitle && (
          <div style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, color: cyan }}>{pd.jobTitle}</div>
        )}
      </header>

      {/* Main two-column */}
      <main style={{ padding: "26px 48px", display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 28, flex: 1, position: "relative", zIndex: 1 }}>
        {/* Left column */}
        <section>
          {visible("summary") && summary && (
            <>
              <H>{config.language === "en" ? "House specialty — about me" : "Casa especialidad — sobre mí"}</H>
              <p style={{ margin: 0, lineHeight: 1.6, fontSize: 12 }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H>{label("workExperience")}</H>
              {workExperience.map((job) => {
                const startYear = job.startDate?.match(/\d{4}/)?.[0] ?? ""
                const endYear = job.currentlyWorking ? present : (job.endDate?.match(/\d{4}/)?.[0] ?? "")
                const dateRange = startYear && endYear ? `${startYear} — ${endYear}` : startYear || endYear
                return (
                  <div key={job.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", borderBottom: `1px dashed ${neon}`, padding: "8px 0" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: gold, fontFamily: "'Permanent Marker', cursive" }}>
                        {job.employer || job.jobTitle}
                      </div>
                      <div style={{ fontSize: 11, color: cream }}>{job.jobTitle}{job.city ? ` · ${job.city}` : ""}</div>
                      {job.description && (
                        <div className="resume-desc" style={{ fontSize: 10.5, color: "#aaa", marginTop: 3, lineHeight: 1.4 }}
                          dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                      )}
                    </div>
                    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: cyan, alignSelf: "center" }}>{dateRange}</div>
                  </div>
                )
              })}
            </>
          )}

          {visible("skills") && skills.length > 0 && (
            <>
              <H>{label("skills")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, fontSize: 11.5 }}>
                {skills.map((sk) => (
                  <li key={sk.id}>{sk.name}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Right column */}
        <section>
          {visible("certifications") && certifications.length > 0 && (
            <>
              <H>{label("certifications")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, fontSize: 11.5 }}>
                {certifications.map((cert) => (
                  <li key={cert.id}>
                    {cert.date && <><b>{cert.date?.match(/\d{4}/)?.[0] ?? cert.date}</b> · </>}
                    {cert.name}
                    {cert.issuer && ` · ${cert.issuer}`}
                  </li>
                ))}
              </ul>
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <H>{label("education")}</H>
              <p style={{ margin: 0, lineHeight: 1.7 }}>
                {education.map((edu, i) => {
                  const year = edu.endDate?.match(/\d{4}/)?.[0] ?? edu.startDate?.match(/\d{4}/)?.[0] ?? ""
                  return (
                    <span key={edu.id}>
                      {year && <><b>{year}</b> · </>}
                      {edu.degree && <>{edu.degree}</>}
                      {edu.institution && <> · {edu.institution}</>}
                      {i < education.length - 1 && <br />}
                    </span>
                  )
                })}
              </p>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H>{label("languages")}</H>
              <p style={{ margin: 0 }}>
                {languages.map((lang, i) => (
                  <span key={lang.id}>
                    {lang.name} · {lang.level}
                    {i < languages.length - 1 && " · "}
                  </span>
                ))}
              </p>
            </>
          )}

          {visible("projects") && projects && projects.length > 0 && (
            <>
              <H>{label("projects")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, fontSize: 11.5 }}>
                {projects.map((proj) => (
                  <li key={proj.id}>
                    <b>{proj.name}</b>
                    {proj.description && (
                      <span className="resume-desc" dangerouslySetInnerHTML={{ __html: ` — ${fmtDesc(proj.description)}` }} />
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Contact */}
          <H>{L.contact}</H>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, lineHeight: 1.85, color: cyan }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && <div>{pd.phone}</div>}
            {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(" · ")}</div>}
            {pd.linkedin && <div>{pd.linkedin}</div>}
            {pd.website && <div>{pd.website}</div>}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        background: neon,
        color: black,
        padding: "10px 48px",
        textAlign: "center",
        fontFamily: "'Permanent Marker', cursive",
        fontSize: 18,
        letterSpacing: "0.18em",
        position: "relative",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>
        ★ &nbsp; {config.language === "en" ? "CHEERS · CHEERS · CHEERS" : "CHEERS · ¡SALUD! · CIN CIN"} &nbsp; ★
      </footer>
    </div>
  )
}
