"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function SommelierTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present

  const burgundy = config.colorScheme || "#5a1322"
  const cream = "#efe6cf"
  const gold = "#c9a23a"
  const ink = "#1a0a0a"

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h2 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 22,
        color: burgundy,
        margin: "14px 0 8px",
        fontWeight: 600,
        fontStyle: "italic",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>{children}</h2>
    )
  }

  function Item({ y, h, s }: { y: string; h: string; s?: string }) {
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontStyle: "italic", color: gold, fontSize: 11 }}>{y}</div>
        <div style={{ fontWeight: 700 }}>{h}</div>
        {s && <div style={{ fontSize: 11, fontStyle: "italic" }}>{s}</div>}
      </div>
    )
  }

  const initials = `${pd.firstName?.[0] ?? ""}${pd.lastName?.[0] ?? ""}`.toUpperCase() || "CV"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: cream,
      color: ink,
      fontFamily: "'EB Garamond', serif",
      fontSize: 11.5,
      padding: 56,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Decorative borders */}
      <div style={{ position: "absolute", inset: 36, border: `1px solid ${burgundy}`, pointerEvents: "none", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}></div>
      <div style={{ position: "absolute", inset: 42, border: `2px solid ${burgundy}`, pointerEvents: "none", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}></div>

      {/* Header label area */}
      <div style={{ padding: 18, position: "relative", textAlign: "center" }}>
        {/* Initials circle */}
        <div style={{
          width: 56,
          height: 56,
          border: `2px solid ${burgundy}`,
          borderRadius: "50%",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 24,
          fontWeight: 600,
          color: burgundy,
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
          overflow: "hidden",
        }}>
          {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : (initials || "N")}
        </div>

        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.4em", marginTop: 14, color: burgundy }}>
          ·&nbsp; {config.language === "en" ? "PRIVATE RESERVE" : "RESERVA · PRIVADA"} &nbsp;·
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 56, fontWeight: 500, margin: "12px 0 4px", letterSpacing: "0.04em", color: burgundy }}>
          {pd.firstName || "First"} {pd.lastName || "Last"}
        </h1>
        <div style={{ width: 200, height: 1, background: gold, margin: "0 auto", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}></div>
        {pd.jobTitle && (
          <div style={{ fontStyle: "italic", fontSize: 16, marginTop: 8 }}>{pd.jobTitle}</div>
        )}
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.4em", marginTop: 14, color: burgundy }}>
          VINTAGE · {new Date().getFullYear()}
        </div>
      </div>

      {/* Two-column main */}
      <main style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, flex: 1 }}>
        {/* Left column */}
        <section>
          {visible("summary") && summary && (
            <>
              <H>{config.language === "en" ? "Tasting notes" : "Notas de cata"}</H>
              <p style={{ margin: 0, lineHeight: 1.65, fontStyle: "italic", fontSize: 12 }}>{summary}</p>
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
                  <Item
                    key={job.id}
                    y={dateRange}
                    h={`${job.employer || ""}${job.city ? ` · ${job.city}` : ""}`}
                    s={job.jobTitle}
                  />
                )
              })}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H>{label("certifications")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, fontSize: 11.5 }}>
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

          {visible("education") && education.length > 0 && (
            <>
              <H>{label("education")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, fontSize: 11.5 }}>
                {education.map((edu) => (
                  <li key={edu.id}>
                    {edu.degree && <>{edu.degree}</>}
                    {edu.fieldOfStudy && <>, {edu.fieldOfStudy}</>}
                    {edu.institution && <> · {edu.institution}</>}
                    {edu.endDate && <> · {edu.endDate?.match(/\d{4}/)?.[0] ?? edu.endDate}</>}
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
              <p style={{ margin: 0, fontStyle: "italic", lineHeight: 1.7, fontSize: 12 }}>
                {skills.map((sk) => sk.name).join(" · ")}
              </p>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H>{label("languages")}</H>
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                {languages.map((lang, i) => (
                  <span key={lang.id}>
                    {lang.name} · {lang.level}
                    {i < languages.length - 1 && <>&nbsp;·&nbsp;</>}
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
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, lineHeight: 1.85 }}>
            {pd.email && <div>{pd.email}</div>}
            {pd.phone && <div>{pd.phone}</div>}
            {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(" · ")}</div>}
            {pd.linkedin && <div>{pd.linkedin}</div>}
            {pd.website && <div>{pd.website}</div>}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ position: "relative", textAlign: "center", padding: "10px 24px", fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.35em", color: burgundy }}>
        ·&nbsp; {pd.firstName?.toUpperCase() ?? ""}{pd.lastName ? ` ${pd.lastName.toUpperCase()}` : ""} &nbsp;·&nbsp; {new Date().getFullYear()} &nbsp;·
      </footer>
    </div>
  )
}
