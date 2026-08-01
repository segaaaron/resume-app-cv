"use client"

/**
 * The Record — Journalist · Newsprint masthead layout.
 * Source: planillas-lujosas-Jun-29026/cv-professions-a.jsx (TplJournalist, 2026-06-03).
 *
 * Design fidelity:
 *  - Palette: ink #15130f, newsprint #f5f2ea, accent #c0392b. Preserved exactly.
 *  - Georgia serif body + Geist (sans) for masthead/labels — classic broadsheet treatment.
 *  - Top masthead row + double-rule centered name + section meta with accent byline.
 *  - 2-column justified lede with accent drop-cap; double-rule separator before content grid.
 *  - Career Front Page (experience) left + Beat/Education/Languages right with vertical rule.
 *  - Print-safe: WebkitPrintColorAdjust on every coloured surface.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'Georgia, "Times New Roman", serif'

export default function TplJournalistTemplate() {
  const ink = "#15130f"
  const bg = "#f5f2ea"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#c0392b")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  const summaryText = summary || ""
  const lede = summaryText.length > 1 ? summaryText.slice(1) : ""

  const Award = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" /><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
    </svg>
  )

  const contactLine = [pd.email, pd.phone, pd.website].filter(Boolean).join(" · ")

  const JrH = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        fontFamily: "inherit",
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.16em",
        color: ink,
        marginBottom: 12,
        paddingBottom: 5,
        borderBottom: `2px solid ${accent}`,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {children}
    </div>
  )

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: bg,
        color: ink,
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
        padding: "40px 46px",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Masthead row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "inherit",
          fontSize: 10.5,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#6a655c",
          borderBottom: `3px double ${ink}`,
          paddingBottom: 8,
        }}
      >
        <span>{config.language === "en" ? "The Daily Record" : "El Diario"}</span>
        <span>{config.language === "en" ? "Est. 2013 · Vol. XII" : "Fund. 2013 · Vol. XII"}</span>
        <span>{place || pd.country || ""}</span>
      </div>

      {/* Name title */}
      <h1
        style={{
          fontFamily: SERIF,
          fontSize: 64,
          fontWeight: 700,
          margin: "16px 0 6px",
          textAlign: "center",
          lineHeight: 0.95,
          letterSpacing: "-0.01em",
        }}
      >
        {fullName}
      </h1>

      {/* Byline rule */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 14,
          borderTop: `1px solid ${ink}`,
          borderBottom: `1px solid ${ink}`,
          padding: "7px 0",
          fontFamily: "inherit",
          flexWrap: "wrap",
        }}
      >
        {pd.jobTitle && (
          <span style={{ fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, fontWeight: 600 }}>
            {pd.jobTitle}
          </span>
        )}
        {pd.jobTitle && contactLine && <span style={{ color: "#aaa" }}>|</span>}
        {contactLine && (
          <span style={{ fontSize: 11.5, color: "#6a655c" }}>{contactLine}</span>
        )}
      </div>

      {/* Lede with drop-cap */}
      {visible("summary") && summaryText && (
        <p
          style={{
            fontSize: 14.5,
            lineHeight: 1.55,
            color: "#2a261f",
            margin: "18px 0",
            columnCount: 2,
            columnGap: 28,
            textAlign: "justify",
          }}
        >
          <span
            style={{
              float: "left",
              fontSize: 52,
              lineHeight: 0.8,
              fontWeight: 700,
              paddingRight: 8,
              paddingTop: 4,
              color: accent,
            }}
          >
            {summaryText.charAt(0)}
          </span>
          {lede}
        </p>
      )}

      {/* Body grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 30, borderTop: `3px double ${ink}`, paddingTop: 18 }}>
        {/* Left — Experience */}
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <JrH>{config.language === "en" ? "Career Front Page" : "Portada Profesional"}</JrH>
              {workExperience.map((e, i) => {
                const last = i === workExperience.length - 1
                return (
                  <div
                    key={e.id}
                    className="resume-entry"
                    style={{
                      marginBottom: 15,
                      paddingBottom: 13,
                      borderBottom: last ? "none" : "1px solid #d8d2c4",
                      breakInside: "avoid",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{e.jobTitle}</div>
                      <div style={{ fontFamily: "inherit", fontSize: 11, color: accent, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {e.startDate}
                        {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                      </div>
                    </div>
                    <div style={{ fontFamily: "inherit", fontSize: 11.5, color: "#7a7468", fontStyle: "italic", marginBottom: 5 }}>
                      {e.employer}
                      {e.city ? ` — ${e.city}` : ""}
                    </div>
                    {e.description && (
                      <div
                        className="resume-desc"
                        style={{ fontSize: 12.5, color: "#2a261f", lineHeight: 1.5 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                      />
                    )}
                  </div>
                )
              })}
            </>
          )}

          {visible("projects") && projects.length > 0 && (
            <>
              <JrH>{labelFor("projects")}</JrH>
              {projects.map((p) => (
                <div key={p.id} style={{ fontSize: 12.5, color: "#2a261f", lineHeight: 1.5, marginBottom: 5, display: "flex", gap: 8 }}>
                  <span style={{ color: accent }}>▪</span>
                  <span>
                    <strong style={{ fontWeight: 700 }}>{p.name}</strong>
                    {p.role ? ` — ${p.role}` : ""}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Right — Beat & meta */}
        <div style={{ fontFamily: "inherit", borderLeft: "1px solid #d8d2c4", paddingLeft: 22 }}>
          {visible("skills") && skills.length > 0 && (
            <>
              <JrH>{config.language === "en" ? "Beat & Skills" : "Especialidad & Skills"}</JrH>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {skills.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      fontSize: 11,
                      border: `1px solid ${ink}`,
                      padding: "3px 9px",
                      color: "#2a261f",
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <JrH>{labelFor("education")}</JrH>
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#7a7468" }}>
                    {ed.institution}
                    {ed.city ? `, ${ed.city}` : ""}
                  </div>
                  <div style={{ fontSize: 11, color: accent, fontWeight: 600 }}>
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <JrH>{labelFor("languages")}</JrH>
              {languages.map((l) => (
                <div
                  key={l.id}
                  style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3, color: "#2a261f" }}
                >
                  <span>{l.name}</span>
                  <span style={{ color: "#7a7468" }}>{l.level}</span>
                </div>
              ))}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <div
              style={{
                marginTop: 14,
                borderTop: `3px double ${ink}`,
                paddingTop: 10,
                fontSize: 11.5,
                color: "#2a261f",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {certifications.map((c) => (
                <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: accent, fontSize: 14, display: "grid", placeItems: "center" }}><Award /></span>
                  <span style={{ fontStyle: "italic", fontFamily: "inherit", fontSize: 13 }}>{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
