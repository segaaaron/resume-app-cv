"use client"

/**
 * Broadcast — Communicator · Magenta gradient.
 * Source: planillas-lujosas-Jun-29026/cv-professions-a.jsx (TplCommunicator, 2026-06-03).
 *
 * Design fidelity:
 *  - Palette: accententa #e6007e, violet #7b2ff7. Gradient 125deg violet→accententa on header.
 *  - Speech-bubble network SVG @ opacity 0.18 top-right.
 *  - Gradient-clipped section headings (background-clip:text).
 *  - Contact chips on translucent white pills inside header.
 *  - Two-column body: Brief + Experience timeline left, Toolkit/Specialties/Education/Languages right.
 *  - Language bars use gradient fill — width derived from level (a1..native).
 *  - Print-safe: WebkitPrintColorAdjust on every coloured surface.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

const LANG_LEVEL_PCT: Record<string, number> = {
  a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100,
}

export default function TplCommunicatorTemplate() {
  const vio = "#7b2ff7"
  const ink = "#1c1430"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = config.colorScheme || "#e6007e"
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
  const Globe = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
    </svg>
  )

  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.email) contacts.push([<Mail key="m" />, pd.email])
  if (pd.phone) contacts.push([<Phone key="p" />, pd.phone])
  if (place) contacts.push([<Pin key="i" />, place])
  if (pd.website) contacts.push([<Globe key="g" />, pd.website])

  // Gradient-clipped section heading.
  // Note: WebkitBackgroundClip + transparent text survives `window.print()` in Chromium
  // because the gradient is rendered as the text's mask; Tailwind utilities are insufficient.
  const CoH = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        fontSize: 13.5,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        margin: "20px 0 12px",
        background: `linear-gradient(90deg,${vio},${accent})`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
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
        background: "#fff",
        color: ink,
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Gradient masthead */}
      <div
        style={{
          background: `linear-gradient(125deg,${vio} 0%,${accent} 100%)`,
          color: "#fff",
          padding: "42px 48px 40px",
          position: "relative",
          overflow: "hidden",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* speech-bubble network */}
        <svg viewBox="0 0 200 200" width="190" height="190" style={{ position: "absolute", top: -20, right: -10, opacity: 0.18 }}>
          <g fill="none" stroke="#fff" strokeWidth="2.5">
            <rect x="40" y="40" width="60" height="42" rx="10" />
            <path d="M55 82 l-6 14 l18 -14" fill="#fff" stroke="none" />
            <rect x="110" y="90" width="50" height="36" rx="9" />
            <path d="M150 126 l4 12 l-14 -12" fill="#fff" stroke="none" />
            <circle cx="60" cy="140" r="7" fill="#fff" stroke="none" />
            <circle cx="150" cy="50" r="6" fill="#fff" stroke="none" />
            <path d="M67 120 L120 100 M100 70 L120 92" />
          </g>
        </svg>

        <div style={{ fontSize: 12, letterSpacing: "0.3em", opacity: 0.85, marginBottom: 12 }}>
          ◗ {config.language === "en" ? "COMMUNICATIONS" : "COMUNICACIONES"}
        </div>
        <h1 style={{ fontSize: 46, fontWeight: 700, margin: 0, lineHeight: 0.98, letterSpacing: "-0.02em" }}>{fullName}</h1>
        {pd.jobTitle && (
          <div style={{ fontSize: 16, marginTop: 9, color: "#ffe3f4", fontWeight: 500 }}>{pd.jobTitle}</div>
        )}
        {contacts.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
            {contacts.map(([I, t], i) => (
              <span
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 11.5,
                  background: "rgba(255,255,255,0.16)",
                  padding: "6px 12px",
                  borderRadius: 30,
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                }}
              >
                <span style={{ fontSize: 13, display: "grid", placeItems: "center" }}>{I}</span>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "26px 48px", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 32 }}>
        {/* Left */}
        <div>
          {visible("summary") && summary && (
            <>
              <CoH>{config.language === "en" ? "The Brief" : "El Brief"}</CoH>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#3a3252", margin: "0 0 20px" }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <CoH>{labelFor("workExperience")}</CoH>
              {workExperience.map((e) => (
                <div
                  key={e.id}
                  className="resume-entry"
                  style={{ marginBottom: 15, paddingLeft: 18, position: "relative", breakInside: "avoid" }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 5,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg,${vio},${accent})`,
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{e.jobTitle}</div>
                    <div style={{ fontSize: 11.5, color: accent, fontWeight: 600, whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#8a82a0", marginBottom: 5 }}>
                    {e.employer}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 12, color: "#3a3252", lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Right */}
        <div>
          {visible("skills") && skills.length > 0 && (
            <>
              <CoH>{labelFor("skills")}</CoH>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                {skills.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      fontSize: 11.5,
                      background: "linear-gradient(135deg,#fce4f3,#efe6ff)",
                      color: vio,
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
              <CoH>{labelFor("projects")}</CoH>
              {projects.map((s) => (
                <div key={s.id} style={{ fontSize: 12.5, color: "#3a3252", marginBottom: 3, display: "flex", gap: 8 }}>
                  <span style={{ color: accent }}>◆</span>
                  <span>
                    <strong style={{ fontWeight: 700 }}>{s.name}</strong>
                    {s.role ? ` — ${s.role}` : ""}
                  </span>
                </div>
              ))}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <CoH>{labelFor("education")}</CoH>
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "#8a82a0" }}>
                    {ed.institution}
                    {ed.city ? ` · ${ed.city}` : ""}
                  </div>
                  <div style={{ fontSize: 11.5, color: accent, fontWeight: 600 }}>
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <CoH>{labelFor("languages")}</CoH>
              {languages.map((l) => {
                const pct = LANG_LEVEL_PCT[l.level] ?? 60
                return (
                  <div key={l.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{l.name}</span>
                      <span style={{ color: "#8a82a0" }}>{l.level}</span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: "#f0e9fb",
                        borderRadius: 3,
                        WebkitPrintColorAdjust: "exact",
                        printColorAdjust: "exact",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: `linear-gradient(90deg,${vio},${accent})`,
                          borderRadius: 3,
                          WebkitPrintColorAdjust: "exact",
                          printColorAdjust: "exact",
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <CoH>{labelFor("certifications")}</CoH>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {certifications.map((c) => (
                  <span
                    key={c.id}
                    style={{
                      fontSize: 11,
                      border: `1px solid ${accent}55`,
                      color: vio,
                      padding: "4px 10px",
                      borderRadius: 8,
                    }}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
