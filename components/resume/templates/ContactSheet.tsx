"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function ContactSheetTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const black = "#0a0a0a"
  const paper = "#1a1a1a"
  const red = config.colorScheme || "#e63946"
  const white = "#f5f5f0"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: black, color: white,
      fontFamily: "ui-monospace, monospace", fontSize: 10,
      padding: 36, display: "flex", flexDirection: "column", gap: 14,
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `1px solid ${white}`, paddingBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: red }}>
            ★ ROLL 24/36 · {config.language === "en" ? "KODAK PORTRA 400" : "KODAK PORTRA 400"}
          </div>
          <h1 style={{
            fontFamily: "'Inter Tight', 'Inter', sans-serif", fontSize: 56,
            fontWeight: 800, margin: "8px 0 0", letterSpacing: "-0.03em", lineHeight: 1,
          }}>
            {pd.firstName || "First"} {pd.lastName || "Last"}
          </h1>
          {pd.jobTitle && (
            <div style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontSize: 16, fontWeight: 500, marginTop: 4 }}>
              {pd.jobTitle}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", lineHeight: 1.7 }}>
          {pd.email && <div>{pd.email}</div>}
          {pd.phone && <div>{pd.phone}</div>}
          {(pd.city || pd.country) && <div>{[pd.city, pd.country].filter(Boolean).join(" · ").toUpperCase()}</div>}
          {pd.linkedin && <div>{pd.linkedin}</div>}
          {pd.website && <div>{pd.website}</div>}
        </div>
      </header>

      {/* Film contact strip — 12 frames */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            aspectRatio: "3/2", background: paper, position: "relative",
            border: "2px solid #2a2a2a",
            WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
          }}>
            <div style={{
              position: "absolute", inset: 8,
              background: `hsl(${i * 30},20%,${20 + i * 3}%)`,
              opacity: 0.6,
              WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
            }} />
            <div style={{ position: "absolute", top: 2, left: 4, fontSize: 8, color: red }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ position: "absolute", bottom: 2, right: 4, fontSize: 8, color: "#999" }}>
              · A
            </div>
          </div>
        ))}
      </div>

      {/* Summary strip */}
      {visible("summary") && summary && (
        <div style={{ padding: "10px 14px", background: paper, border: `1px solid #2a2a2a`, fontSize: 11, lineHeight: 1.6, color: "#ccc" }}>
          <span style={{ color: red, marginRight: 8 }}>// {config.language === "en" ? "BIO" : "PERFIL"}</span>
          {summary}
        </div>
      )}

      {/* Captions body */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 28, flex: 1 }}>
        {/* Left: Experience + Projects */}
        <section>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H red={red}>// {label("workExperience").toUpperCase()}</H>
              {workExperience.map((job) => (
                <div key={job.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr", padding: "8px 0", borderBottom: "1px dashed #444", fontSize: 11, gap: 8 }}>
                  <div style={{ color: red }}>
                    {job.startDate?.match(/\d{4}/)?.[0]}
                    {job.currentlyWorking
                      ? `—${present.slice(0, 4)}`
                      : job.endDate?.match(/\d{4}/)?.[0]
                      ? `—${job.endDate.match(/\d{4}/)?.[0]}`
                      : ""}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{job.employer}</div>
                    <div style={{ color: "#aaa" }}>{job.jobTitle}</div>
                    {job.description && (
                      <div className="resume-desc" style={{ fontSize: 10, color: "#888", marginTop: 3, lineHeight: 1.5 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("projects") && projects.length > 0 && (
            <>
              <H red={red} style={{ marginTop: 16 }}>// {label("projects").toUpperCase()}</H>
              <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.8, fontSize: 11 }}>
                {projects.map((p) => (
                  <li key={p.id}><span style={{ color: red }}>{p.name}</span>{p.description ? ` · ${p.description}` : ""}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Right: Skills, Education, Languages, Certifications */}
        <section>
          {visible("skills") && skills.length > 0 && (
            <>
              <H red={red}>// {label("skills").toUpperCase()}</H>
              <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.8, fontSize: 11 }}>
                {skills.map((sk) => (
                  <li key={sk.id}>{sk.name}{sk.level ? ` · ${sk.level}` : ""}</li>
                ))}
              </ul>
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <H red={red} style={{ marginTop: 16 }}>// {label("education").toUpperCase()}</H>
              <div style={{ lineHeight: 1.7, fontSize: 11 }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    {edu.endDate?.match(/\d{4}/)?.[0] || edu.startDate?.match(/\d{4}/)?.[0]}
                    {" · "}
                    {edu.degree}{edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}
                    {edu.institution ? ` · ${edu.institution}` : ""}
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H red={red} style={{ marginTop: 16 }}>// {label("languages").toUpperCase()}</H>
              <div style={{ lineHeight: 1.7, fontSize: 11 }}>
                {languages.map((lang) => (
                  <div key={lang.id}>{lang.name} · {lang.level.toUpperCase()}</div>
                ))}
              </div>
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H red={red} style={{ marginTop: 16 }}>// {label("certifications").toUpperCase()}</H>
              <div style={{ lineHeight: 1.7, fontSize: 11 }}>
                {certifications.map((cert) => (
                  <div key={cert.id}>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}</div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${white}`, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 9, letterSpacing: "0.2em" }}>
        <span>● PROCESSED · DEV {String(new Date().getMonth() + 1).padStart(2, "0")}·{new Date().getFullYear()}</span>
        <span>NEG NO. {(pd.firstName?.[0] || "X") + (pd.lastName?.[0] || "X")}—{new Date().getFullYear()}</span>
        <span>● ASA 400</span>
      </footer>
    </div>
  )
}

function H({ children, red, style }: { children: React.ReactNode; red: string; style?: React.CSSProperties }) {
  return (
    <h3 style={{ fontSize: 11, letterSpacing: "0.3em", color: red, margin: "0 0 10px", ...style }}>
      {children}
    </h3>
  )
}
