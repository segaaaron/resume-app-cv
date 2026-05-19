"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function HotelCVTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const sand = "#e8dfcd"
  const ink = "#1a1a1a"
  const navy = config.colorScheme || "#1c3957"
  const gold = "#a98a4a"

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h2 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 22,
        color: navy,
        margin: "16px 0 8px",
        fontWeight: 500,
        fontStyle: "italic",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>{children}</h2>
    )
  }

  function Row({ y, co, p }: { y: string; co: string; p?: string }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "84px 1fr", padding: "8px 0", borderBottom: `1px solid ${gold}`, gap: 12 }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: navy, fontWeight: 700 }}>{y}</div>
        <div>
          <div style={{ fontWeight: 700 }}>{co}</div>
          {p && <div style={{ fontSize: 11, color: "#555" }}>{p}</div>}
        </div>
      </div>
    )
  }

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: sand,
      color: ink,
      fontFamily: "'Inter', sans-serif",
      fontSize: 11,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Header */}
      <header style={{
        background: navy,
        color: sand,
        padding: "30px 40px",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 20,
        alignItems: "center",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>
        <div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.3em", color: gold }}>
            · &nbsp;HOSPITALITY&nbsp; ·
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: 48, margin: "8px 0 4px", letterSpacing: "0.02em" }}>
            {pd.firstName || "First"} {pd.lastName || "Last"}
          </h1>
          {pd.jobTitle && (
            <div style={{ fontSize: 13, color: gold, fontStyle: "italic" }}>{pd.jobTitle}</div>
          )}
        </div>
        <div style={{ textAlign: "right", fontFamily: "ui-monospace, monospace", fontSize: 10, color: sand, lineHeight: 1.85 }}>
          {pd.email && <div>{pd.email}</div>}
          {pd.phone && <div>{pd.phone}</div>}
          {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(" · ")}</div>}
          {pd.linkedin && <div>{pd.linkedin}</div>}
          {pd.website && <div>{pd.website}</div>}
        </div>
      </header>

      {/* Gold stats bar */}
      {/* Gold divider */}
      <div style={{
        background: gold,
        color: navy,
        padding: "10px 40px",
        textAlign: "center",
        fontFamily: "ui-monospace, monospace",
        fontSize: 10,
        letterSpacing: "0.25em",
        fontWeight: 700,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>
        · &nbsp; CURRICULUM VITAE &nbsp; ·
      </div>

      {/* Main two-column */}
      <main style={{ padding: "30px 40px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 28, flex: 1 }}>
        {/* Left column */}
        <section>
          {visible("summary") && summary && (
            <>
              <H>{config.language === "en" ? "Director's letter" : "Carta del director"}</H>
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
                const company = `${job.employer || ""}${job.city ? ` · ${job.city}` : ""}`
                return (
                  <div key={job.id}>
                    <Row y={dateRange} co={company} p={job.jobTitle} />
                    {job.description && (
                      <div className="resume-desc" style={{ fontSize: 10.5, color: "#444", marginTop: 4, marginBottom: 4, paddingLeft: 96, lineHeight: 1.5 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                )
              })}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H>{label("certifications")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, lineHeight: 1.8 }}>
                {certifications.map((cert) => (
                  <li key={cert.id}>
                    {cert.name}
                    {cert.issuer && ` · ${cert.issuer}`}
                    {cert.date && ` · ${cert.date}`}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Right column */}
        <section>
          {visible("skills") && skills.length > 0 && (
            <>
              <H>{label("skills")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85 }}>
                {skills.map((sk) => (
                  <li key={sk.id}>{sk.name}</li>
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
                      {edu.fieldOfStudy && <>, {edu.fieldOfStudy}</>}
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
                    {lang.name} {lang.level}
                    {i < languages.length - 1 && " · "}
                  </span>
                ))}
              </p>
            </>
          )}

          {visible("projects") && projects && projects.length > 0 && (
            <>
              <H>{label("projects")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85 }}>
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
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        background: navy,
        color: gold,
        padding: "10px 40px",
        fontFamily: "ui-monospace, monospace",
        fontSize: 10,
        letterSpacing: "0.2em",
        textAlign: "center",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>
        · &nbsp; {config.language === "en" ? "WELCOMING GUESTS" : "EN SERVICIO"} · {new Date().getFullYear()} &nbsp; ·
      </footer>
    </div>
  )
}
