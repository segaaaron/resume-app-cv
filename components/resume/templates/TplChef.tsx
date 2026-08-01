"use client"

/**
 * Le Chef — Charcoal & Copper · Menu 2026.
 * Source: planillas-lujosas-Jun-29026/cv-professions-a.jsx (TplChef, 2026-06-03).
 *
 * Design fidelity:
 *  - Palette: ink #211c18, accent #c2763a, cream #f6efe4. All preserved exactly.
 *  - Charcoal masthead with accent crossed-knife + whisk SVG @ opacity 0.14.
 *  - Playfair-style italic surname; Cormorant italic centered summary.
 *  - Two-column body: numbered courses (italic ordinals) left, Signature/Skills/Training right.
 *  - Print-safe: WebkitPrintColorAdjust on every coloured surface.
 *
 * Font mapping:
 *  - Source "Playfair Display" / "Cormorant Garamond" → var(--font-playfair) + Georgia fallback.
 *  - Source "Geist" → var(--font-jakarta) + system sans fallback.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'var(--font-playfair), "Playfair Display", "Cormorant Garamond", Georgia, "Times New Roman", serif'

export default function TplChefTemplate() {
  const ink = "#211c18"
  const cream = "#f6efe4"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#c2763a")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const firstLine = pd.firstName || "Your"
  const lastLine = pd.lastName || "Name"
  const place = [pd.city, pd.country].filter(Boolean).join(", ")

  // Icons (monoline, currentColor)
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
  const Globe = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
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
  if (pd.website) contacts.push([<Globe key="g" />, pd.website])

  // Section heading (dotted accent rule)
  const ChefH = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, fontWeight: 600, margin: "18px 0 12px", fontFamily: "inherit" }}>
      <span>{children}</span>
      <span style={{ flex: 1, borderTop: `1px dotted ${accent}88` }} />
    </div>
  )

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: cream,
        color: ink,
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Charcoal masthead */}
      <div
        style={{
          background: ink,
          color: cream,
          padding: "36px 48px 30px",
          position: "relative",
          overflow: "hidden",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* crossed knife + whisk SVG */}
        <svg viewBox="0 0 120 120" width="150" height="150" style={{ position: "absolute", top: -10, right: 20, opacity: 0.14 }}>
          <g stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round">
            <path d="M30 95 L78 30" />
            <path d="M78 30 q8 -10 14 -4 q6 6 -4 14 L78 44 Z" fill={accent} stroke="none" />
            <path d="M90 95 L52 40" />
            <ellipse cx="48" cy="34" rx="9" ry="15" transform="rotate(35 48 34)" />
            <path d="M44 26 q4 6 0 12 M52 30 q4 6 0 12" />
          </g>
        </svg>

        <div style={{ fontFamily: SERIF, fontSize: 14, letterSpacing: "0.4em", color: accent, marginBottom: 12 }}>
          ★ {config.language === "en" ? "CHEF ★ MENU 2026" : "CHEF ★ CARTA 2026"}
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: 50, fontWeight: 600, margin: 0, lineHeight: 0.96 }}>
          {firstLine}
          <br />
          <span style={{ fontStyle: "italic" }}>{lastLine}</span>
        </h1>
        {pd.jobTitle && (
          <div style={{ marginTop: 12, fontSize: 14, letterSpacing: "0.2em", textTransform: "uppercase", color: "#d8cdbb" }}>
            {pd.jobTitle}
          </div>
        )}
        {contacts.length > 0 && (
          <div style={{ display: "flex", gap: 22, marginTop: 18, fontSize: 12, color: "#c3b8a6", flexWrap: "wrap" }}>
            {contacts.map(([I, t], i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ color: accent, fontSize: 13, display: "grid", placeItems: "center" }}>{I}</span>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "26px 48px" }}>
        {visible("summary") && summary && (
          <p style={{ fontFamily: "inherit", fontSize: 19, fontStyle: "italic", lineHeight: 1.5, color: "#5a4d3e", textAlign: "center", margin: "0 auto 22px", maxWidth: 560 }}>
            {summary}
          </p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 34 }}>
          {/* Left — Courses (experience) */}
          <div>
            {visible("workExperience") && workExperience.length > 0 && (
              <>
                <ChefH>{config.language === "en" ? "The Courses — " : "Los Platos — "}{labelFor("workExperience")}</ChefH>
                {workExperience.map((e, i) => (
                  <div
                    key={e.id}
                    className="resume-entry"
                    style={{ display: "grid", gridTemplateColumns: "46px 1fr", gap: 12, marginBottom: 16, breakInside: "avoid" }}
                  >
                    <div style={{ fontFamily: SERIF, fontSize: 30, color: accent, fontStyle: "italic" }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{e.jobTitle}</div>
                        <div style={{ fontSize: 11, color: accent, fontWeight: 600, whiteSpace: "nowrap" }}>
                          {e.startDate}
                          {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                        </div>
                      </div>
                      <div style={{ fontSize: 12.5, color: "#8a7d6a", fontStyle: "italic", marginBottom: 4 }}>
                        {e.employer}
                        {e.city ? ` · ${e.city}` : ""}
                      </div>
                      {e.description && (
                        <div
                          className="resume-desc"
                          style={{ fontSize: 12, color: "#5a4d3e", lineHeight: 1.5 }}
                          dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Right column */}
          <div>
            {visible("projects") && projects.length > 0 && (
              <>
                <ChefH>{labelFor("projects")}</ChefH>
                {projects.map((s) => (
                  <div key={s.id} style={{ fontFamily: "inherit", fontSize: 16, color: ink, marginBottom: 4, display: "flex", gap: 8 }}>
                    <span style={{ color: accent }}>❧</span>
                    <span>
                      <strong style={{ fontWeight: 600 }}>{s.name}</strong>
                      {s.role ? ` — ${s.role}` : ""}
                    </span>
                  </div>
                ))}
              </>
            )}

            {visible("skills") && skills.length > 0 && (
              <>
                <ChefH>{labelFor("skills")}</ChefH>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {skills.map((s) => (
                    <span
                      key={s.id}
                      style={{
                        fontSize: 11,
                        border: `1px solid ${accent}55`,
                        color: "#5a4d3e",
                        padding: "4px 10px",
                        borderRadius: 2,
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
                <ChefH>{labelFor("education")}</ChefH>
                {education.map((ed) => (
                  <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {ed.degree}
                      {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "#8a7d6a" }}>
                      {ed.institution}
                      {ed.city ? `, ${ed.city}` : ""}
                    </div>
                    <div style={{ fontSize: 11.5, color: accent }}>
                      {ed.startDate}
                      {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                    </div>
                  </div>
                ))}
              </>
            )}

            {visible("certifications") && certifications.length > 0 && (
              <>
                <ChefH>{labelFor("certifications")}</ChefH>
                <div
                  style={{
                    background: ink,
                    color: cream,
                    padding: "12px 14px",
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                >
                  {certifications.map((c) => (
                    <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ color: accent, fontSize: 16, display: "grid", placeItems: "center" }}><Award /></span>
                      <span style={{ fontSize: 13, fontFamily: "inherit", fontStyle: "italic" }}>{c.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {visible("languages") && languages.length > 0 && (
              <>
                <ChefH>{labelFor("languages")}</ChefH>
                {languages.map((l) => (
                  <div
                    key={l.id}
                    style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, color: "#5a4d3e" }}
                  >
                    <span style={{ fontWeight: 600 }}>{l.name}</span>
                    <span style={{ color: accent }}>{l.level}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
