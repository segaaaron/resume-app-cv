"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"
import { getResumeLabels } from "@/lib/utils/resumeLabels"

export default function RisoDesignerTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const L = getResumeLabels(config.language)
  const present = L.present

  const cream = "#f4e9d3"
  const red = config.colorScheme || "#e94f37"
  const blue = "#1d3557"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: cream, color: blue,
      fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontSize: 11, padding: 0,
      display: "flex", flexDirection: "column", overflow: "hidden", position: "relative",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Risograph blob overlays */}
      <div style={{
        position: "absolute", top: -100, right: -100, width: 360, height: 360,
        borderRadius: "50%", background: red, mixBlendMode: "multiply", opacity: 0.85,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }} />
      <div style={{
        position: "absolute", top: 240, left: -80, width: 220, height: 220,
        borderRadius: "50%", background: "#3a7d44", mixBlendMode: "multiply", opacity: 0.75,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }} />

      {/* Header */}
      <header style={{ padding: "60px 56px 30px", position: "relative" }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.3em" }}>
          RISO PRINT · {new Date().getFullYear()}
        </div>
        <h1 style={{
          fontFamily: "'Archivo Black', 'Inter', sans-serif", fontSize: 84, lineHeight: 0.9,
          margin: "12px 0 0", letterSpacing: "-0.04em", textTransform: "uppercase",
        }}>
          {pd.firstName || "First"}<br />{pd.lastName || "Last"}
        </h1>
        <div style={{ fontSize: 18, marginTop: 10, fontWeight: 700 }}>
          {pd.jobTitle || "Designer"}
        </div>
      </header>

      {/* Main grid */}
      <main style={{
        padding: "0 56px 48px", display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 32, flex: 1, position: "relative",
      }}>
        {/* Left column */}
        <section>
          {visible("summary") && summary && (
            <>
              <H red={red} blue={blue}>{L.profile}</H>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6 }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H red={red} blue={blue}>{label("workExperience")}</H>
              {workExperience.map((job) => (
                <div key={job.id} style={{ marginBottom: 10, paddingBottom: 8, borderBottom: `1px dashed ${blue}` }}>
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10 }}>
                    {job.startDate?.match(/\d{4}/)?.[0]}
                    {job.currentlyWorking
                      ? ` — ${present}`
                      : job.endDate?.match(/\d{4}/)?.[0]
                      ? ` — ${job.endDate.match(/\d{4}/)?.[0]}`
                      : ""}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 12.5 }}>{job.employer}</div>
                  <div style={{ fontSize: 11 }}>{job.jobTitle}</div>
                  {job.description && (
                    <div className="resume-desc" style={{ fontSize: 10.5, marginTop: 4, lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              ))}
            </>
          )}

          {visible("projects") && projects.length > 0 && (
            <>
              <H red={red} blue={blue}>{label("projects")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, fontSize: 11.5 }}>
                {projects.map((p) => (
                  <li key={p.id}>{p.name}{p.description ? ` · ${p.description}` : ""}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Right column */}
        <section>
          {visible("skills") && skills.length > 0 && (
            <>
              <H red={red} blue={blue}>{label("skills")}</H>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skills.map((sk) => (
                  <span key={sk.id} style={{
                    background: blue, color: cream, padding: "5px 11px",
                    fontSize: 10.5, fontWeight: 700,
                    WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                  }}>{sk.name}</span>
                ))}
              </div>
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <H red={red} blue={blue}>{label("education")}</H>
              {education.map((edu) => (
                <div key={edu.id} style={{ marginBottom: 10, paddingBottom: 8, borderBottom: `1px dashed ${blue}` }}>
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10 }}>
                    {edu.startDate?.match(/\d{4}/)?.[0]}
                    {edu.currentlyStudying
                      ? ` — ${present}`
                      : edu.endDate?.match(/\d{4}/)?.[0]
                      ? ` — ${edu.endDate.match(/\d{4}/)?.[0]}`
                      : ""}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 12.5 }}>{edu.institution}</div>
                  <div style={{ fontSize: 11 }}>{edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}</div>
                </div>
              ))}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H red={red} blue={blue}>{label("certifications")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, fontSize: 11 }}>
                {certifications.map((cert) => (
                  <li key={cert.id}>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}{cert.date ? ` · ${cert.date}` : ""}</li>
                ))}
              </ul>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H red={red} blue={blue}>{label("languages")}</H>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, lineHeight: 1.85 }}>
                {languages.map((lang) => (
                  <div key={lang.id}>{lang.name} · {lang.level.toUpperCase()}</div>
                ))}
              </div>
            </>
          )}

          <H red={red} blue={blue}>{L.contact}</H>
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
      <footer style={{
        background: blue, color: cream, padding: "14px 56px",
        display: "flex", justifyContent: "space-between",
        fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.2em",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <span>★ {config.language === "en" ? "HANDMADE" : "HECHO A MANO"}</span>
        <span>RISO 2 {config.language === "en" ? "COLORS" : "COLORES"}</span>
        <span>CV · {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}

function H({ children, red, blue }: { children: React.ReactNode; red: string; blue: string }) {
  return (
    <h3 style={{
      fontFamily: "'Archivo Black', 'Inter', sans-serif", fontSize: 14,
      margin: "20px 0 10px", textTransform: "uppercase", color: red,
    }}>
      {children}
    </h3>
  )
}
