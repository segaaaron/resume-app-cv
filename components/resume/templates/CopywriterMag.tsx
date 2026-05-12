"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { fmtDesc } from "@/lib/utils"

export default function CopywriterMagTemplate() {
  const { config, sections } = useResumeStore()
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications, projects } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const cream = "#f4ecdc"
  const ink = "#101010"
  const coral = config.colorScheme || "#ec5b3c"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm",
      background: cream,
      color: ink,
      fontFamily: "'EB Garamond', 'Garamond', Georgia, serif",
      fontSize: 12,
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "16px 36px",
        fontFamily: "ui-monospace, monospace",
        fontSize: 10,
        letterSpacing: "0.3em",
        borderBottom: `1px solid ${ink}`,
      }}>
        <span>—   {config.language === "en" ? "ESSAY" : "ENSAYO"}   —</span>
        <span>{(pd.lastName || "WORDS").toUpperCase()}, INC.</span>
        <span>{config.language === "en" ? "FEATURE" : "ESPECIAL"} / {String(new Date().getMonth() + 1).padStart(2, "0")}·{String(new Date().getFullYear()).slice(2)}</span>
      </div>

      {/* Main */}
      <main style={{ padding: "40px 56px", flex: 1 }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.3em", color: coral }}>
          {config.language === "en" ? "BY THE WORD" : "POR LA PALABRA"}
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: 80, lineHeight: 0.9, margin: "12px 0 14px", letterSpacing: "-0.025em" }}>
          {pd.jobTitle ? `${pd.jobTitle}.` : `${pd.firstName || "First"} ${pd.lastName || "Last"}.`}
        </h1>
        <div style={{ fontSize: 18, fontStyle: "italic", color: coral, marginBottom: 20 }}>
          {config.language === "en" ? "An essay-CV by " : "Un ensayo-CV de "}
          <b>{pd.firstName || "First"} {pd.lastName || "Last"}</b>
          {pd.jobTitle ? `, ${pd.jobTitle.toLowerCase()}.` : "."}
        </div>

        {/* Two-column body */}
        <div style={{ columnCount: 2, columnGap: 32, fontSize: 13, lineHeight: 1.65 }}>
          {/* Drop cap summary */}
          {summary && (
            <p style={{ margin: "0 0 12px" }}>
              <span style={{
                float: "left",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 76,
                lineHeight: 0.8,
                marginRight: 8,
                marginTop: 6,
                color: coral,
                fontWeight: 900,
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}>
                {(summary[0] || "I").toUpperCase()}
              </span>
              {summary.slice(1)}
            </p>
          )}

          {/* Work experience as prose */}
          {visible("workExperience") && workExperience.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <b>{label("workExperience")}.</b>
              {workExperience.map((job) => (
                <div key={job.id} style={{ marginTop: 7 }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>
                    {job.startDate?.match(/\d{4}/)?.[0] || ""}
                    {job.currentlyWorking ? `—${present}` : job.endDate?.match(/\d{4}/)?.[0] ? `—${job.endDate.match(/\d{4}/)?.[0]}` : ""}
                    {job.jobTitle ? ` · ${job.jobTitle}` : ""}
                    {job.employer ? ` · ${job.employer}` : ""}
                    {job.city ? `, ${job.city}` : ""}
                  </div>
                  {job.description && (
                    <div className="resume-desc" style={{ fontSize: 11, lineHeight: 1.55, marginTop: 2 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education as prose */}
          {visible("education") && education.length > 0 && (
            <p>
              <b>{label("education")}.</b>{" "}
              {education.map((edu, i) => (
                <span key={edu.id}>
                  {i > 0 ? ". " : ""}
                  {edu.endDate?.match(/\d{4}/)?.[0] || edu.startDate?.match(/\d{4}/)?.[0] || ""}
                  {edu.degree ? ` · ${edu.degree}` : ""}
                  {edu.fieldOfStudy ? ` ${edu.fieldOfStudy}` : ""}
                  {edu.institution ? ` · ${edu.institution}` : ""}
                </span>
              ))}
              .
            </p>
          )}

          {/* Certifications as prose */}
          {visible("certifications") && certifications.length > 0 && (
            <p>
              <b>{label("certifications")}.</b>{" "}
              {certifications.map((cert, i) => (
                <span key={cert.id}>
                  {i > 0 ? ", " : ""}
                  {cert.name}{cert.issuer ? ` (${cert.issuer})` : ""}
                  {cert.date?.match(/\d{4}/)?.[0] ? ` ${cert.date.match(/\d{4}/)?.[0]}` : ""}
                </span>
              ))}
              .
            </p>
          )}

          {/* Projects as prose */}
          {visible("projects") && projects && projects.length > 0 && (
            <p>
              <b>{label("projects")}.</b>{" "}
              {projects.map((proj, i) => (
                <span key={proj.id}>
                  {i > 0 ? ". " : ""}
                  {proj.name}
                  {proj.startDate?.match(/\d{4}/)?.[0] ? ` ${proj.startDate.match(/\d{4}/)?.[0]}` : ""}
                </span>
              ))}
              .
            </p>
          )}

          {/* Languages as prose */}
          {visible("languages") && languages.length > 0 && (
            <p>
              <b>{label("languages")}.</b>{" "}
              {languages.map((lang, i) => (
                <span key={lang.id}>{i > 0 ? ", " : ""}{lang.name} {lang.level.toUpperCase()}</span>
              ))}
              .
            </p>
          )}

          {/* Skills as prose */}
          {visible("skills") && skills.length > 0 && (
            <p>
              <b>{label("skills")}.</b>{" "}
              {skills.map((sk, i) => (
                <span key={sk.id}>{i > 0 ? ", " : ""}{sk.name}</span>
              ))}
              .
            </p>
          )}

          {/* Contact */}
          <p style={{ margin: 0 }}>
            <b>{config.language === "en" ? "Contact." : "Contacto."}</b>{" "}
            {[pd.email, pd.phone, [pd.city, pd.country].filter(Boolean).join(", "), pd.linkedin, pd.website].filter(Boolean).join(" · ")}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${ink}`, padding: "12px 36px", textAlign: "center", fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 14 }}>
        ~ {config.language === "en" ? "continued on next page" : "continúa en la siguiente página"} ~
      </footer>
    </div>
  )
}
