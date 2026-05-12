"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function FieldJournalTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const paper = "#ede2c8"
  const ink = "#1f1a0e"
  const green = config.colorScheme || "#3e5a2a"
  const red = "#8a3a1f"

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h2 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontStyle: "italic",
        fontSize: 22,
        color: green,
        margin: "16px 0 8px",
        fontWeight: 700,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}>{children}</h2>
    )
  }

  function Item({ y, h, s }: { y: string; h: string; s: string }) {
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: red }}>{y}</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 14, fontWeight: 700 }}>{h}</div>
        <div style={{ fontStyle: "italic", fontSize: 11.5 }}>{s}</div>
      </div>
    )
  }

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const location = [pd.city, pd.country].filter(Boolean).join(", ")
  const month = String(new Date().getMonth() + 1).padStart(2, "0")
  const year = new Date().getFullYear()

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: paper,
      color: ink,
      fontFamily: "'EB Garamond', Georgia, serif",
      fontSize: 12,
      padding: 56,
      position: "relative",
      backgroundImage: "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)",
      backgroundSize: "100% 26px",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Header */}
      <header style={{ borderBottom: `2px solid ${ink}`, paddingBottom: 14, marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.18em", color: red }}>
          <span>{config.language === "en" ? "FIELD NOTEBOOK · VOL. I" : "CUADERNO DE CAMPO · VOL. I"}</span>
          <span>{month} · {year}</span>
          {location && <span>{location.toUpperCase()}</span>}
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: "italic",
          fontSize: 52,
          fontWeight: 700,
          margin: "8px 0 4px",
          letterSpacing: "-0.01em",
          lineHeight: 1.05,
        }}>
          {pd.jobTitle || (config.language === "en" ? "Professional" : "Profesional")}
        </h1>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 400 }}>
          {fullName}
        </div>
      </header>

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32 }}>
        <section>
          {visible("summary") && summary && (
            <>
              <H>{config.language === "en" ? "Field Notes" : "Cuaderno de campo"}</H>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, textAlign: "justify" }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H>{label("workExperience")}</H>
              {workExperience.map((job) => {
                const startYear = job.startDate?.match(/\d{4}/)?.[0] ?? ""
                const endYear = job.currentlyWorking ? "→" : (job.endDate?.match(/\d{4}/)?.[0] ?? "")
                const yr = startYear && endYear ? `${startYear} — ${endYear}` : startYear || endYear
                return (
                  <div key={job.id} style={{ marginBottom: 8 }}>
                    <Item
                      y={yr}
                      h={job.jobTitle}
                      s={[job.employer, job.city].filter(Boolean).join(" · ")}
                    />
                    {job.description && (
                      <div className="resume-desc" style={{ fontSize: 11, marginTop: 2, lineHeight: 1.6, marginLeft: 0 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                )
              })}
            </>
          )}

          {visible("skills") && skills.length > 0 && (
            <>
              <H>{label("skills")}</H>
              <p style={{ margin: 0, fontStyle: "italic", fontSize: 12, lineHeight: 1.7 }}>
                {skills.map((sk, i) => (
                  <span key={sk.id}>{sk.name}{i < skills.length - 1 ? " · " : ""}</span>
                ))}
              </p>
            </>
          )}

          {visible("projects") && projects && projects.length > 0 && (
            <>
              <H>{label("projects")}</H>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, lineHeight: 1.7 }}>
                {projects.map((p) => (
                  <li key={p.id}><em>{p.name}</em>{p.description ? ` — ${p.description}` : ""}</li>
                ))}
              </ol>
            </>
          )}
        </section>

        <section>
          {/* Decorative field map SVG */}
          <div style={{ width: "100%", height: 160, background: "#d6cdb0", border: `1.5px solid ${ink}`, position: "relative", marginBottom: 12, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            <svg width="100%" height="100%" viewBox="0 0 200 160">
              <path d="M0 80 Q40 40 80 90 T160 70 L200 90 L200 160 L0 160 Z" fill={green} opacity="0.3" />
              <path d="M0 100 Q40 60 80 110 T160 90 L200 110" stroke={green} fill="none" strokeWidth="1.5" />
              <circle cx="50" cy="105" r="4" fill={red} />
              <circle cx="120" cy="92" r="4" fill={red} />
              <circle cx="170" cy="105" r="4" fill={red} />
              <text x="55" y="120" fontSize="8" fill={ink}>site A</text>
              <text x="125" y="105" fontSize="8" fill={ink}>site B</text>
              <text x="175" y="118" fontSize="8" fill={ink}>site C</text>
            </svg>
            <div style={{ position: "absolute", top: 6, left: 8, fontFamily: "ui-monospace, monospace", fontSize: 9, color: ink }}>
              fig. 1 — {config.language === "en" ? "field sites" : "sitios de campo"}
            </div>
          </div>

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H>{label("certifications")}</H>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, lineHeight: 1.7 }}>
                {certifications.map((cert) => (
                  <li key={cert.id}><em>{cert.name}</em>{cert.issuer ? ` · ${cert.issuer}` : ""}{cert.date ? ` · ${cert.date}` : ""}</li>
                ))}
              </ol>
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <H>{label("education")}</H>
              {education.map((edu) => {
                const startYear = edu.startDate?.match(/\d{4}/)?.[0] ?? ""
                const endYear = edu.currentlyStudying ? "→" : (edu.endDate?.match(/\d{4}/)?.[0] ?? "")
                const yr = startYear && endYear ? `${startYear} — ${endYear}` : startYear || endYear
                return (
                  <Item
                    key={edu.id}
                    y={yr}
                    h={`${edu.degree}${edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}`}
                    s={edu.institution || ""}
                  />
                )
              })}
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H>{label("languages")}</H>
              <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.7 }}>
                {languages.map((lang, i) => (
                  <span key={lang.id}>{lang.name} · {lang.level.toUpperCase()}{i < languages.length - 1 ? <br /> : null}</span>
                ))}
              </p>
            </>
          )}

          <H>{config.language === "en" ? "Contact" : "Contacto"}</H>
          <p style={{ margin: 0, fontFamily: "ui-monospace, monospace", fontSize: 10.5, lineHeight: 1.85 }}>
            {pd.email && <>{pd.email}<br /></>}
            {pd.phone && <>{pd.phone}<br /></>}
            {location && <>{location}<br /></>}
            {pd.linkedin && <>{pd.linkedin}<br /></>}
            {pd.website && <>{pd.website}</>}
          </p>
        </section>
      </div>

      {/* Footer */}
      <footer style={{
        position: "absolute",
        left: 56,
        right: 56,
        bottom: 36,
        borderTop: `1px solid ${ink}`,
        paddingTop: 8,
        display: "flex",
        justifyContent: "space-between",
        fontFamily: "ui-monospace, monospace",
        fontSize: 9,
        letterSpacing: "0.18em",
      }}>
        <span>{config.language === "en" ? "NOTEBOOK p. 1" : "CUADERNO p. 1"}</span>
        <span>★ {fullName.toUpperCase()}</span>
        <span>{month} · {year}</span>
      </footer>
    </div>
  )
}
