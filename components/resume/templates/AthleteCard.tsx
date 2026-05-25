"use client"

import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { fmtDesc } from "@/lib/utils"

const SKILL_PCT: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 }

export default function AthleteCardTemplate() {
  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections }))
  )
  const sd = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = sd

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const present = config.language === "en" ? "Present" : "Presente"

  const orange = config.colorScheme || "#f5a623"
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase()
  const navy = "#0c1f3d"
  const cream = "#f4ebd5"
  const ink = "#101010"

  function H({ children }: { children: React.ReactNode }) {
    return (
      <h2 style={{
        fontFamily: "'Inter Tight', 'Inter', sans-serif",
        fontWeight: 800, fontSize: 14, margin: "16px 0 8px",
        textTransform: "uppercase", letterSpacing: "0.06em", color: navy,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>{children}</h2>
    )
  }

  // Use first 2 letters of name as jersey number fallback, or take first skill pct
  const jerseyDisplay = pd.jobTitle ? pd.jobTitle.slice(0, 2).toUpperCase() : "★"

  return (
    <div data-print-layout="single-column" style={{
      minHeight: "297mm", background: cream, color: ink,
      fontFamily: "'Inter Tight', 'Inter', sans-serif", fontSize: 11,
      padding: 36, display: "flex", flexDirection: "column",
      WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
    }}>
      {/* Trading card header */}
      <div style={{
        background: navy, color: cream, padding: "16px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        border: `4px solid ${orange}`,
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}>
        <div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, letterSpacing: "0.3em", color: orange }}>
            ★ TRADING CARD · {new Date().getFullYear()} ★
          </div>
          <h1 style={{
            fontFamily: "'Inter Tight', 'Inter', sans-serif",
            fontWeight: 900, fontSize: 46, margin: "6px 0 0",
            letterSpacing: "-0.03em", color: cream,
            textTransform: "uppercase",
          }}>
            {pd.firstName || "First"} {pd.lastName || "Last"}
          </h1>
          <div style={{ fontSize: 13, color: orange }}>
            {pd.jobTitle || ""}
            {(pd.city || pd.country) ? ` · ${[pd.city, pd.country].filter(Boolean).join(", ")}` : ""}
          </div>
        </div>
        {/* Photo or decorative number */}
        <div style={{ width: 90, height: 90, borderRadius: "50%", border: `3px solid ${orange}`, flexShrink: 0, backgroundColor: orange + "22", display: "flex", alignItems: "center", justifyContent: "center", color: orange, fontWeight: 800, fontSize: 28 }}>
          {config.photoUrl ? <img src={config.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%`, borderRadius: "inherit" }} /> : (initials || "N")}
        </div>
      </div>

      {/* Two-column stats + skills */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 16 }}>
        {/* Skills as attribute bars */}
        {visible("skills") && skills.length > 0 && (
          <div style={{ background: "#fff", border: `2px solid ${navy}`, padding: 16, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, color: navy, letterSpacing: "0.2em", marginBottom: 10 }}>
              {label("skills").toUpperCase()} · 0–100
            </div>
            {skills.slice(0, 8).map((sk) => {
              const pct = SKILL_PCT[sk.level] ?? 50
              return (
                <div key={sk.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 36px", alignItems: "center", gap: 10, padding: "5px 0" }}>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {sk.name.slice(0, 10).toUpperCase()}
                  </span>
                  <div style={{ height: 10, background: "#eee", borderRadius: 2, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: orange, borderRadius: 2, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  </div>
                  <span style={{ fontFamily: "'Inter Tight', 'Inter'", fontWeight: 800, fontSize: 14 }}>{pct}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Contact + languages as "stats" */}
        <div style={{ background: orange, color: navy, padding: 16, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: "0.2em", marginBottom: 10 }}>
            CONTACT · INFO
          </div>
          {[
            [config.language === "en" ? "EMAIL" : "EMAIL", pd.email || "—"],
            [config.language === "en" ? "PHONE" : "TEL", pd.phone || "—"],
            ["LINKEDIN", pd.linkedin || pd.website || "—"],
          ].map((s) => (
            <div key={s[0]} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${navy}`, fontSize: 11 }}>
              <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.1em", fontSize: 9 }}>{s[0]}</span>
              <span style={{ fontWeight: 600, fontSize: 11, textAlign: "right", maxWidth: 140, wordBreak: "break-all" }}>{s[1]}</span>
            </div>
          ))}
          {visible("languages") && languages.length > 0 && languages.slice(0, 3).map((lang) => (
            <div key={lang.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${navy}`, fontSize: 11 }}>
              <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.1em", fontSize: 9 }}>{lang.name.toUpperCase()}</span>
              <span style={{ fontWeight: 800, fontSize: 14 }}>{lang.level.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {visible("summary") && summary && (
        <>
          <H>{label("summary")}</H>
          <p style={{ margin: 0, lineHeight: 1.65 }}>{summary}</p>
        </>
      )}

      {/* Work Experience as career timeline */}
      {visible("workExperience") && workExperience.length > 0 && (
        <>
          <H>{label("workExperience")}</H>
          {workExperience.map((job) => {
            const startYear = job.startDate?.match(/\d{4}/)?.[0] ?? job.startDate ?? ""
            const endStr = job.currentlyWorking ? present : (job.endDate?.match(/\d{4}/)?.[0] ?? job.endDate ?? "")
            return (
              <div key={job.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr", padding: "8px 0", borderBottom: "1px dashed #888", gap: 10 }}>
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: orange, fontWeight: 700, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  {startYear}{endStr ? `–${endStr}` : ""}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>{job.employer}</div>
                  <div style={{ fontSize: 11, color: "#555" }}>{job.jobTitle}{job.city ? ` · ${job.city}` : ""}</div>
                  {job.description && (
                    <div className="resume-desc" style={{ fontSize: 10.5, color: "#444", marginTop: 4 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(job.description) }} />
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Certifications + Education two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 14 }}>
        {visible("certifications") && certifications.length > 0 && (
          <div>
            <H>{label("certifications")}</H>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.85, fontSize: 11 }}>
              {certifications.map((cert) => (
                <li key={cert.id}>{cert.name}{cert.issuer ? ` · ${cert.issuer}` : ""}</li>
              ))}
            </ul>
          </div>
        )}

        {visible("education") && education.length > 0 && (
          <div>
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
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: "auto", paddingTop: 14,
        borderTop: `2px solid ${navy}`,
        display: "flex", justifyContent: "space-between",
        fontFamily: "ui-monospace, monospace", fontSize: 10,
      }}>
        <span style={{ color: navy }}>{pd.email || ""}</span>
        <span style={{ color: navy }}>{pd.phone || ""}</span>
        <span style={{ color: orange, fontWeight: 700, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          ★ {new Date().getFullYear()} ★
        </span>
      </footer>
    </div>
  )
}
