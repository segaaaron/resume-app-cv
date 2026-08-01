"use client"

/**
 * Drafting (TplArchitect) — blueprint grid layout.
 * Source: planillas-lujosas-Jun-29026/cv-professions-b.jsx (TplArchitect).
 *
 * Design fidelity:
 *  - Blueprint grid background (24px lines, #e4e9ec).
 *  - Inner frame border, DWG · 001 · A4 tag at top-right.
 *  - Diamond markers for experience entries.
 *  - Mono body + Jakarta display for headings.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"


export default function TplArchitectTemplate() {
  const steel = "#5b7b8a"
  const grid = "linear-gradient(#e4e9ec 1px,transparent 1px),linear-gradient(90deg,#e4e9ec 1px,transparent 1px)"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const blue = designAccent(config.colorScheme, "#2f4858")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"

  const Award = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" /><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
    </svg>
  )

  const ArchH = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, letterSpacing: "0.1em", color: blue, marginBottom: 12, paddingBottom: 5, borderBottom: `1px solid ${steel}66`, textTransform: "uppercase" }}>
      {children}
    </div>
  )

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: "#fbfcfc",
        backgroundImage: grid,
        backgroundSize: "24px 24px",
        color: "#1f2a30",
        fontFamily: "inherit",
        position: "relative",
        padding: "44px 48px",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <div style={{ position: "absolute", inset: 16, border: `1px solid ${steel}55`, pointerEvents: "none", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      <div style={{ position: "absolute", top: 22, right: 24, fontSize: 9, color: steel, letterSpacing: "0.1em" }}>DWG · 001 · A4</div>

      <div style={{ borderBottom: `2px solid ${blue}`, paddingBottom: 18, marginBottom: 20, position: "relative", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.3em", color: steel, marginBottom: 10 }}>
          — {(pd.jobTitle || "ARCHITECT").toUpperCase()} · LICENSED
        </div>
        <h1 style={{ fontFamily: "inherit", fontSize: 46, fontWeight: 700, margin: 0, color: blue, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {fullName}
        </h1>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 10, gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, color: steel }}>{pd.jobTitle}</div>
          <div style={{ fontSize: 10.5, textAlign: "right", color: "#5a6a72", lineHeight: 1.7 }}>
            {pd.email}<br />
            {[pd.phone, [pd.city, pd.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>

      {visible("summary") && summary && (
        <p style={{ fontSize: 12, lineHeight: 1.6, color: "#3a4a52", margin: "0 0 22px", maxWidth: 600 }}>{summary}</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 30, position: "relative" }}>
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <ArchH>{labelFor("workExperience")}</ArchH>
              {workExperience.map((e) => (
                <div key={e.id} className="resume-entry" style={{ marginBottom: 15, paddingLeft: 20, position: "relative", breakInside: "avoid" }}>
                  <span style={{ position: "absolute", left: 0, top: 3, width: 11, height: 11, border: `2px solid ${blue}`, transform: "rotate(45deg)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  <div style={{ fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: blue }}>{e.jobTitle}</div>
                  <div style={{ fontSize: 11, color: steel, marginBottom: 4 }}>
                    {e.employer} · {e.startDate}
                    {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 11, color: "#3a4a52", lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <div>
          {visible("skills") && skills.length > 0 && (
            <>
              <ArchH>{labelFor("skills")}</ArchH>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
                {skills.map((s) => (
                  <span key={s.id} style={{ fontSize: 10.5, border: `1px solid ${steel}`, padding: "3px 9px", color: blue }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {visible("projects") && projects.length > 0 && (
            <>
              <ArchH>{labelFor("projects")}</ArchH>
              {projects.map((p) => (
                <div key={p.id} style={{ fontSize: 11.5, color: "#3a4a52", marginBottom: 3 }}>
                  <span style={{ color: blue, marginRight: 6 }}>▪</span>
                  <strong style={{ color: blue, fontWeight: 700 }}>{p.name}</strong>
                  {p.role ? ` — ${p.role}` : ""}
                </div>
              ))}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <ArchH>{labelFor("education")}</ArchH>
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontFamily: "inherit", fontSize: 12.5, color: blue, fontWeight: 700 }}>
                    {ed.degree}{ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 10.5, color: steel }}>
                    {ed.institution} · {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <ArchH>{labelFor("certifications")}</ArchH>
              <div style={{ fontSize: 11, color: "#3a4a52", display: "flex", flexDirection: "column", gap: 4 }}>
                {certifications.map((c) => (
                  <div key={c.id} style={{ display: "flex", gap: 7, alignItems: "center" }}>
                    <span style={{ color: blue, fontSize: 13 }}><Award /></span>
                    {c.name}
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <ArchH>{labelFor("languages")}</ArchH>
              {languages.map((l) => (
                <div key={l.id} style={{ fontSize: 11, color: "#3a4a52", display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span>{l.name}</span>
                  <span style={{ color: steel }}>{l.level?.toUpperCase()}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
