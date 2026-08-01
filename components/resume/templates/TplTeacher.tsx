"use client"

/**
 * Chalkboard — Teacher · Warm & Friendly.
 * Source: planillas-lujosas-Jun-29026/cv-professions-a.jsx (TplTeacher, 2026-06-03).
 *
 * Design fidelity:
 *  - Palette: board #27403a, chalk #f3efe4, accent #f0b429. Wood underline #8a6a3a.
 *  - Chalkboard masthead with accent-coloured open-book SVG @ opacity 0.5.
 *  - Caveat-style script "✎ EDUCATOR" tag preserved as fallback serif italic.
 *  - Two-column body: lesson plan + experience cards left, side meta right.
 *  - Award pill in accent-yellow at bottom of side column.
 *  - Print-safe: WebkitPrintColorAdjust on every coloured surface.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

export default function TplTeacherTemplate() {
  const board = "#27403a"
  const chalk = "#f3efe4"
  const ink = "#2a2a26"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#f0b429")
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

  const Mail = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" />
    </svg>
  )
  const Phone = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.97.36 1.92.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.34 1.84.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
  const Pin = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
  const Award = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" /><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
    </svg>
  )

  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.email) contacts.push([<Mail key="m" />, pd.email])
  if (pd.phone) contacts.push([<Phone key="p" />, pd.phone])
  if (place) contacts.push([<Pin key="i" />, place])

  // Section heading with accent-yellow notebook icon
  const TeachH = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, fontWeight: 700, color: board, margin: "20px 0 12px" }}>
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          background: accent,
          display: "grid",
          placeItems: "center",
          fontSize: 13,
          color: board,
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        ✎
      </span>
      {children}
    </div>
  )

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: chalk,
        color: ink,
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Chalkboard masthead */}
      <div
        style={{
          background: board,
          color: chalk,
          padding: "40px 48px 34px",
          position: "relative",
          overflow: "hidden",
          borderBottom: "10px solid #8a6a3a",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <svg viewBox="0 0 80 80" width="84" height="84" style={{ position: "absolute", top: 24, right: 40, opacity: 0.5 }}>
          <g fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round">
            <path d="M10 26 L40 14 L70 26 L40 38 Z" />
            <path d="M22 32 v14 q18 12 36 0 v-14" />
            <path d="M70 26 v16" />
            <circle cx="70" cy="46" r="3" fill={accent} />
          </g>
        </svg>

        <div style={{ fontSize: 12, letterSpacing: "0.3em", color: accent, marginBottom: 12, fontStyle: "italic" }}>
          ✎ {config.language === "en" ? "EDUCATOR" : "EDUCADOR/A"}
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 700, margin: 0, lineHeight: 1, letterSpacing: "-0.01em" }}>{fullName}</h1>
        {pd.jobTitle && (
          <div style={{ fontSize: 15, marginTop: 8, color: "#bcd0c8" }}>
            {pd.jobTitle}
          </div>
        )}
        {contacts.length > 0 && (
          <div style={{ display: "flex", gap: 20, marginTop: 16, fontSize: 12, color: "#a8c0b6", flexWrap: "wrap" }}>
            {contacts.map(([I, t], i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ color: accent, fontSize: 13, display: "grid", placeItems: "center" }}>{I}</span>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "26px 48px", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 32 }}>
        {/* Main — Lesson Plan + Experience */}
        <div>
          {visible("summary") && summary && (
            <>
              <TeachH>{config.language === "en" ? "Lesson Plan" : "Plan de Clase"}</TeachH>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "#4a4a44", margin: "0 0 20px" }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <TeachH>{labelFor("workExperience")}</TeachH>
              {workExperience.map((e) => (
                <div
                  key={e.id}
                  className="resume-entry"
                  style={{
                    marginBottom: 15,
                    background: "#fff",
                    borderRadius: 12,
                    padding: "13px 16px",
                    boxShadow: "0 2px 10px rgba(39,64,58,0.06)",
                    breakInside: "avoid",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: board }}>{e.jobTitle}</div>
                    <span
                      style={{
                        fontSize: 11,
                        background: "#fdf3da",
                        color: "#a9791a",
                        padding: "2px 9px",
                        borderRadius: 20,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        WebkitPrintColorAdjust: "exact",
                        printColorAdjust: "exact",
                      }}
                    >
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#7a8a82", marginBottom: 5 }}>
                    {e.employer}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 12, color: "#4a4a44", lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Side */}
        <div>
          {visible("skills") && skills.length > 0 && (
            <>
              <TeachH>{labelFor("skills")}</TeachH>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                {skills.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      fontSize: 11.5,
                      background: "#e6efe9",
                      color: board,
                      padding: "5px 11px",
                      borderRadius: 8,
                      fontWeight: 600,
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

          {visible("projects") && projects.length > 0 && (
            <>
              <TeachH>{labelFor("projects")}</TeachH>
              {projects.map((s) => (
                <div key={s.id} style={{ fontSize: 12.5, color: "#4a4a44", marginBottom: 3, display: "flex", gap: 8 }}>
                  <span style={{ color: accent }}>★</span>
                  <span>
                    <strong style={{ color: board, fontWeight: 700 }}>{s.name}</strong>
                    {s.role ? ` — ${s.role}` : ""}
                  </span>
                </div>
              ))}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <TeachH>{labelFor("education")}</TeachH>
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: board }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "#7a8a82" }}>
                    {ed.institution}
                    {ed.city ? `, ${ed.city}` : ""}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#a9791a", fontWeight: 600 }}>
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <TeachH>{labelFor("languages")}</TeachH>
              {languages.map((l) => (
                <div
                  key={l.id}
                  style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, color: "#4a4a44" }}
                >
                  <span style={{ fontWeight: 600 }}>{l.name}</span>
                  <span style={{ color: "#7a8a82" }}>{l.level}</span>
                </div>
              ))}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <div
              style={{
                marginTop: 14,
                background: accent,
                color: board,
                padding: "11px 14px",
                borderRadius: 10,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              {certifications.map((c) => (
                <div key={c.id} style={{ display: "flex", gap: 9, alignItems: "center" }}>
                  <span style={{ fontSize: 16, display: "grid", placeItems: "center" }}><Award /></span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
