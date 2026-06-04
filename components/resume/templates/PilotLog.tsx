"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"

export default function PilotLogTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const navy = "#0c2545"
  const paper = "#f6f1e4"
  const ink = "#0a0a0a"
  const red = config.colorScheme || "#c1352e"
  const gold = "#d4a942"

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h2 style={{
        fontFamily: "inherit",
        fontWeight: 800, fontSize: 13, margin: "14px 0 8px",
        textTransform: "uppercase", letterSpacing: "0.18em", color: red,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>{children}</h2>
    )
  }

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: paper, color: ink,
      fontFamily: "inherit", fontSize: 11,
      display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Header */}
      <header style={{
        background: navy, color: paper, padding: "26px 36px",
        display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.3em", color: gold }}>
            ★ PILOT LOGBOOK · ICAO STD ★
          </div>
          <h1 style={{
            fontFamily: "inherit",
            fontWeight: 900, fontSize: 44, margin: "8px 0 2px", letterSpacing: "-0.025em",
            color: paper,
          }}>
            {pd.firstName || "First"} {pd.lastName || "Last"}
          </h1>
          <div style={{ fontSize: 13, color: gold }}>
            {pd.jobTitle || ""}
          </div>
        </div>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke={gold} strokeWidth="2" />
          <path d="M40 14 L48 38 L70 40 L52 50 L58 70 L40 58 L22 70 L28 50 L10 40 L32 38 Z" fill={gold} />
        </svg>
      </header>

      {/* Stats bar — repurposed to show contact info as "stats" */}
      <div style={{
        padding: "20px 36px 0",
        display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0,
        border: `1.5px solid ${ink}`, margin: "20px 36px 0",
      }}>
        {[
          [pd.email || "—", config.language === "en" ? "EMAIL" : "EMAIL"],
          [pd.phone || "—", config.language === "en" ? "PHONE" : "TELÉFONO"],
          [[pd.city, pd.country].filter(Boolean).join(" / ") || "—", config.language === "en" ? "LOCATION" : "UBICACIÓN"],
          [pd.linkedin || pd.website || "—", "LINKEDIN / WEB"],
        ].map((m, i) => (
          <div key={i} style={{
            padding: "10px 12px",
            borderRight: i < 3 ? `1.5px solid ${ink}` : "none",
            textAlign: "center",
          }}>
            <div style={{ fontWeight: 800, fontSize: 11, letterSpacing: "-0.01em", wordBreak: "break-all" }}>{m[0]}</div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: red, letterSpacing: "0.18em", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{m[1]}</div>
          </div>
        ))}
      </div>

      {/* Main */}
      <main style={{ padding: "20px 36px", flex: 1 }}>

        {visible("summary") && summary && (
          <>
            <H>{label("summary")}</H>
            <p style={{ margin: "0 0 6px", lineHeight: 1.65, fontSize: 11.5 }}>{summary}</p>
          </>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <H>{label("workExperience")}</H>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
              <thead>
                <tr style={{ background: navy, color: paper, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  {(config.language === "en"
                    ? ["DATE", "ROLE", "EMPLOYER", "LOCATION", "NOTES"]
                    : ["FECHA", "CARGO", "EMPRESA", "UBICACIÓN", "NOTAS"]
                  ).map((h) => (
                    <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontSize: 9, letterSpacing: "0.18em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workExperience.map((job, i) => {
                  const startYear = job.startDate?.match(/\d{4}/)?.[0] ?? job.startDate ?? ""
                  const endYear = job.currentlyWorking ? present : (job.endDate?.match(/\d{4}/)?.[0] ?? job.endDate ?? "")
                  return (
                    <tr key={job.id} style={{ background: i % 2 ? "#ece7d8" : paper, borderBottom: "1px solid #ccc", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                      <td style={{ padding: "6px 8px", borderRight: "1px solid #ccc" }}>{startYear}{endYear ? `–${endYear}` : ""}</td>
                      <td style={{ padding: "6px 8px", borderRight: "1px solid #ccc", fontWeight: 700 }}>{job.jobTitle}</td>
                      <td style={{ padding: "6px 8px", borderRight: "1px solid #ccc" }}>{job.employer}</td>
                      <td style={{ padding: "6px 8px", borderRight: "1px solid #ccc" }}>{job.city || "—"}</td>
                      <td style={{ padding: "6px 8px" }}>
                        {job.description ? (
                          <div className="resume-desc" dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                        ) : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 18 }}>
          {visible("certifications") && certifications.length > 0 && (
            <section>
              <H>{label("certifications")}</H>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, fontSize: 11 }}>
                {certifications.map((cert) => (
                  <li key={cert.id}>
                    {cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}{cert.date ? ` · ${cert.date}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {visible("education") && education.length > 0 && (
            <section>
              <H>{label("education")}</H>
              {education.map((edu) => (
                <p key={edu.id} style={{ margin: "0 0 6px", lineHeight: 1.7, fontSize: 11.5 }}>
                  {edu.startDate?.match(/\d{4}/)?.[0] ?? edu.startDate
                    ? <><b>{edu.startDate?.match(/\d{4}/)?.[0] ?? edu.startDate}</b> · </>
                    : null}
                  {edu.degree}{edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ""}
                  {edu.institution ? ` · ${edu.institution}` : ""}
                </p>
              ))}
            </section>
          )}
        </div>

        {visible("skills") && skills.length > 0 && (
          <>
            <H>{label("skills")}</H>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 11, lineHeight: 1.85 }}>
              {skills.map((sk) => <span key={sk.id}>{sk.name}{sk.level ? ` · ${sk.level}` : ""}</span>)}
            </div>
          </>
        )}

        {visible("languages") && languages.length > 0 && (
          <>
            <H>{label("languages")}</H>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, lineHeight: 1.85 }}>
              {languages.map((lang) => `${lang.name} ${lang.level.toUpperCase()}`).join(" · ")}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: navy, color: gold, padding: "10px 36px",
        display: "flex", justifyContent: "space-between",
        fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.3em",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <span>{pd.firstName ? `${pd.firstName?.[0]}. ${pd.lastName?.[0]}.` : "—"}</span>
        <span>{new Date().getFullYear()}</span>
        <span>★ BLUE SKIES ★</span>
      </footer>
    </div>
  )
}
