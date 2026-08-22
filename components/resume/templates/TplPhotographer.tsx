"use client"

/**
 * Aperture (TplPhotographer) — contact-sheet inspired layout.
 * Source: planillas-lujosas-Jun-29026/cv-professions-b.jsx (TplPhotographer).
 *
 * Design fidelity:
 *  - Ink #161616 hero block w/ aperture SVG.
 *  - Contact strip with iconed cells, divided by hairlines.
 *  - Numbered contact-sheet frames (corner ticks) for experience.
 *  - Toolkit chips on ink, plus education + award rail.
 * Font: var(--font-jakarta) replaces "Space Grotesk".
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"


export default function TplPhotographerTemplate() {
  const ink = "#161616"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = config.colorScheme || ink
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
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contacts.push([<Pin key="i" />, place])
  if (pd.website) contacts.push([<Globe key="g" />, pd.website])

  const PhH = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: accent, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
      {children}
      <span style={{ flex: 1, height: 1, background: accent, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
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
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* HERO */}
      <div style={{ background: ink, color: "#fff", padding: "40px 48px 36px", position: "relative", overflow: "hidden", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <svg viewBox="0 0 100 100" width="120" height="120" style={{ position: "absolute", top: 18, right: 30, opacity: 0.5 }}>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" strokeWidth="2" />
          <g stroke="#fff" strokeWidth="1.6" fill="none">
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i * 60) * Math.PI / 180
              return <line key={i} x1={50 + 38 * Math.cos(a)} y1={50 + 38 * Math.sin(a)} x2={50 + 14 * Math.cos(a + 1)} y2={50 + 14 * Math.sin(a + 1)} />
            })}
          </g>
          <circle cx="50" cy="50" r="13" fill="none" stroke="#fff" strokeWidth="1.6" />
        </svg>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#888", marginBottom: 14 }}>
          f/1.8 · ISO 100 · {(pd.jobTitle || "PHOTOGRAPHER").toUpperCase()}
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 700, margin: 0, lineHeight: 0.94, letterSpacing: "-0.03em" }}>
          {firstLine}<br />{lastLine}
        </h1>
        {pd.jobTitle && (
          <div style={{ fontSize: 14, marginTop: 12, color: "#bbb", letterSpacing: "0.04em" }}>{pd.jobTitle}</div>
        )}
      </div>

      {/* CONTACT STRIP */}
      {contacts.length > 0 && (
        <div style={{ display: "flex", borderBottom: "1px solid #eee" }}>
          {contacts.map(([I, t], i) => (
            <span
              key={i}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 11,
                color: "#555",
                padding: "12px 14px",
                borderRight: i < contacts.length - 1 ? "1px solid #eee" : "none",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 13, display: "inline-flex" }}>{I}</span>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* BODY */}
      <div style={{ padding: "24px 48px 40px" }}>
        {visible("summary") && summary && (
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#333", margin: "0 0 22px" }}>{summary}</p>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <PhH>{labelFor("workExperience")}</PhH>
            {workExperience.map((e, i) => (
              <div key={e.id} className="resume-entry" style={{ display: "grid", gridTemplateColumns: "54px 1fr", gap: 14, marginBottom: 14, breakInside: "avoid" }}>
                <div style={{ aspectRatio: "1 / 1", background: ink, color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, position: "relative", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  <span style={{ position: "absolute", top: 3, left: 3, width: 5, height: 5, border: "1px solid #555" }} />
                  <span style={{ position: "absolute", bottom: 3, right: 3, width: 5, height: 5, border: "1px solid #555" }} />
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{e.jobTitle}</div>
                    <div style={{ fontSize: 11.5, color: "#888", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#888", marginBottom: 4 }}>
                    {e.employer}{e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 12, color: "#333", lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginTop: 8 }}>
          {visible("skills") && skills.length > 0 && (
            <div>
              <PhH>{labelFor("skills")}</PhH>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skills.map((s) => (
                  <span key={s.id} style={{ fontSize: 11.5, background: accent, color: "#fff", padding: "4px 11px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            {visible("education") && education.length > 0 && (
              <>
                <PhH>{labelFor("education")}</PhH>
                {education.map((ed) => (
                  <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {ed.degree}{ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      {ed.institution}
                      {ed.city ? `, ${ed.city}` : ""}
                      {" · "}{ed.startDate}
                      {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                    </div>
                  </div>
                ))}
              </>
            )}

            {visible("projects") && projects.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {projects.map((p) => (
                  <div key={p.id} style={{ fontSize: 12, color: "#333", marginTop: 6, display: "flex", gap: 7, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 14, color: accent, lineHeight: 1 }}><Award /></span>
                    <span>
                      <strong style={{ color: accent, fontWeight: 700 }}>{p.name}</strong>
                      {p.role ? ` — ${p.role}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {visible("certifications") && certifications.length > 0 && (
              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {certifications.map((c) => (
                  <span key={c.id} style={{ fontSize: 10.5, border: `1px solid ${accent}`, padding: "3px 9px", color: accent }}>
                    {c.name}
                  </span>
                ))}
              </div>
            )}

            {visible("languages") && languages.length > 0 && (
              <div style={{ marginTop: 14 }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#333", padding: "3px 0" }}>
                    <span>{l.name}</span>
                    <span style={{ color: "#888" }}>{l.level?.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
