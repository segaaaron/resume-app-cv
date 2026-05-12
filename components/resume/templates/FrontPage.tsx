"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function FrontPageTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const paper = "#f6f1e4"
  const ink = "#0a0a0a"
  const red = config.colorScheme || "#b22d2d"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: paper,
      color: ink,
      fontFamily: "'Playfair Display', serif",
      fontSize: 10.5,
      padding: 36,
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Masthead */}
      <div style={{ borderBottom: `4px double ${ink}`, paddingBottom: 8, textAlign: "center" }}>
        <div style={{ fontFamily: "'UnifrakturMaguntia', 'Playfair Display', serif", fontSize: 60, fontWeight: 700, lineHeight: 1, letterSpacing: "0.02em" }}>
          {pd.firstName || "First"} {pd.lastName || "Last"}
        </div>
        <div style={{
          borderTop: `1px solid ${ink}`,
          borderBottom: `1px solid ${ink}`,
          padding: "4px 0",
          marginTop: 6,
          fontFamily: "ui-monospace, monospace",
          fontSize: 10,
          letterSpacing: "0.18em",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>VOL. I · No. 001</span>
            <span>{[pd.city, pd.country].filter(Boolean).join(" · ") || "— · —"}</span>
            <span>{pd.email || "—"}</span>
          </div>
          {pd.linkedin && (
            <div style={{ textAlign: "center", marginTop: 3, borderTop: `0.5px solid ${ink}`, paddingTop: 3 }}>
              ⌁ {pd.linkedin}
            </div>
          )}
        </div>
      </div>

      {/* Headline */}
      <div style={{ marginTop: 14 }}>
        <div style={{ textAlign: "center", fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.3em", color: red, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          ★ EXCLUSIVE ★ CV INSIDE ★
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 48, lineHeight: 1, margin: "10px 0 6px", textAlign: "center", letterSpacing: "-0.01em" }}>
          {pd.firstName || "First"} {pd.lastName || "Last"}{pd.jobTitle ? `: ${pd.jobTitle}` : ""}
        </h1>
        {summary && (
          <div style={{ fontStyle: "italic", textAlign: "center", fontSize: 14 }}>{summary}</div>
        )}
      </div>

      {/* Multi-column body */}
      <div style={{ marginTop: 14, columnCount: 3, columnGap: 18, columnRule: `0.5px solid ${ink}`, fontSize: 11, lineHeight: 1.55, flex: 1 }}>
        {summary && (
          <p style={{ margin: "0 0 10px" }}>
            <span style={{ float: "left", fontFamily: "'Playfair Display', serif", fontSize: 52, lineHeight: 0.85, marginRight: 6, marginTop: 4, fontWeight: 900 }}>
              {(pd.firstName || "F")[0].toUpperCase()}
            </span>
            {summary}
          </p>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <H red={red}>{label("workExperience")}</H>
            {workExperience.map((job) => (
              <Line key={job.id} ink={ink}>
                {job.startDate?.match(/\d{4}/)?.[0] || ""}
                {job.currentlyWorking ? ` — ${present}` : job.endDate?.match(/\d{4}/)?.[0] ? ` — ${job.endDate.match(/\d{4}/)?.[0]}` : ""}
                {job.jobTitle ? ` — ${job.jobTitle}` : ""}
                {job.employer ? ` · ${job.employer}` : ""}
                {job.city ? ` · ${job.city}` : ""}
              </Line>
            ))}
          </>
        )}

        {visible("projects") && projects && projects.length > 0 && (
          <>
            <H red={red}>{label("projects")}</H>
            {projects.map((proj) => (
              <Line key={proj.id} ink={ink}>
                {proj.startDate?.match(/\d{4}/)?.[0] || ""}
                {proj.name ? ` · ${proj.name}` : ""}
                {proj.description ? ` · ${proj.description.replace(/<[^>]+>/g, "").slice(0, 60)}` : ""}
              </Line>
            ))}
          </>
        )}

        {visible("education") && education.length > 0 && (
          <>
            <H red={red}>{label("education")}</H>
            {education.map((edu) => (
              <Line key={edu.id} ink={ink}>
                {edu.endDate?.match(/\d{4}/)?.[0] || edu.startDate?.match(/\d{4}/)?.[0] || ""}
                {edu.degree ? ` · ${edu.degree}` : ""}
                {edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}
                {edu.institution ? ` · ${edu.institution}` : ""}
              </Line>
            ))}
          </>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <>
            <H red={red}>{label("certifications")}</H>
            {certifications.map((cert) => (
              <Line key={cert.id} ink={ink}>
                {cert.date?.match(/\d{4}/)?.[0] ? `● ${cert.date.match(/\d{4}/)?.[0]}` : "●"} {cert.name}{cert.issuer ? ` — ${cert.issuer}` : ""}
              </Line>
            ))}
          </>
        )}

        {visible("languages") && languages.length > 0 && (
          <>
            <H red={red}>{label("languages")}</H>
            {languages.map((lang) => (
              <Line key={lang.id} ink={ink}>{lang.name} · {lang.level.toUpperCase()}</Line>
            ))}
          </>
        )}

        {visible("skills") && skills.length > 0 && (
          <>
            <H red={red}>{label("skills")}</H>
            {skills.map((sk) => (
              <Line key={sk.id} ink={ink}>● {sk.name}</Line>
            ))}
          </>
        )}

        <H red={red}>{config.language === "en" ? "Contact" : "Contacto"}</H>
        {pd.email && <Line ink={ink}>{pd.email}</Line>}
        {pd.phone && <Line ink={ink}>{pd.phone}</Line>}
        {(pd.city || pd.country) && <Line ink={ink}>{[pd.city, pd.country].filter(Boolean).join(", ")}</Line>}
        {pd.linkedin && <Line ink={ink}>{pd.linkedin}</Line>}
        {pd.website && <Line ink={ink}>{pd.website}</Line>}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `2px solid ${ink}`, marginTop: 12, paddingTop: 6, display: "flex", justifyContent: "space-between", fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.18em" }}>
        <span>PRINTED ON RECYCLED · INDEPENDENT PRESS</span>
        <span>PAGE A1</span>
      </footer>
    </div>
  )
}

function H({ children, red }: { children: React.ReactNode; red: string }) {
  return (
    <h3 style={{
      fontFamily: "'Playfair Display', serif",
      fontSize: 16,
      margin: "10px 0 4px",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      color: red,
      fontWeight: 800,
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>{children}</h3>
  )
}

function Line({ children, ink }: { children: React.ReactNode; ink: string }) {
  return (
    <div style={{ borderBottom: `1px dotted #888`, padding: "2px 0", fontSize: 11 }}>{children}</div>
  )
}
