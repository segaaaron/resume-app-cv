"use client"

/**
 * Exec Citadel — Executive · Art-Deco Navy.
 * Source: planillas-lujosas-Jun-29026/cv-exec-b.jsx (ExecCitadel, 2026-06-03).
 *
 * Design fidelity:
 *  - Exact palette: bg #0e1320, gold #cbab5c, cream #e7e5da, mut #808799.
 *  - Two concentric Art-Deco border frames (1px gold lines, inner faded).
 *  - Centered masthead with mirrored Chevron flourishes flanking a gold diamond.
 *  - Two-column body: experience + education left, expertise + trajectory right.
 *  - Print-safe: WebkitPrintColorAdjust on every coloured surface.
 *
 * Font mapping:
 *  - "Playfair Display" → var(--font-playfair) + Georgia fallback.
 *  - "Geist" → var(--font-jakarta) + system sans fallback.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'var(--font-playfair), "Playfair Display", Georgia, "Times New Roman", serif'
const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

const IcoMail = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5.5" width="18" height="13" rx="1" /><path d="m3 7 9 6 9-6" />
  </svg>
)
const IcoPhone = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z" />
  </svg>
)
const IcoPin = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="2.4" />
  </svg>
)
const IcoChart = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" /><path d="M7 15l3-4 3 3 4-7" />
  </svg>
)
const IcoShield = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
  </svg>
)
const IcoBulb = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 2 2 2 4h4c0-2 1-3 2-4a6 6 0 0 0-4-10z" />
  </svg>
)
const IcoGauge = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 14l4-6M21 14a9 9 0 1 0-18 0" /><circle cx="12" cy="14" r="1.2" fill="currentColor" />
  </svg>
)

function Chevron({ flip, gold }: { flip?: boolean; gold: string }) {
  return (
    <svg viewBox="0 0 60 12" width="56" height="11" style={{ transform: flip ? "scaleX(-1)" : "none" }}>
      <path d="M0 6h40l8-5M0 6h40l8 5" fill="none" stroke={gold} strokeWidth="1" />
      <path d="M52 1l6 5-6 5" fill="none" stroke={gold} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ExecCitadelTemplate() {
  const bg = "#0e1320"
  const cream = "#e7e5da"
  const mut = "#808799"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = config.colorScheme || "#cbab5c"
  const gold = accent
  const line = `${accent}3d`
  const lineFaint = `${accent}1f`
  const data = useTemplateSectionData()
  const { personalDetails: pd, workExperience, education, skills, certifications } = data
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"

  const fullName = ([pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name").toUpperCase()

  const SectionHead = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 13px" }}>
      <span style={{ color: gold, fontSize: 13 }}>{icon}</span>
      <span style={{ fontFamily: "inherit", fontSize: 13, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: cream }}>
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: line }} />
    </div>
  )

  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.email) contacts.push([<IcoMail key="m" />, pd.email])
  if (pd.phone) contacts.push([<IcoPhone key="p" />, pd.phone])
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contacts.push([<IcoPin key="i" />, place])

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: bg,
        color: cream,
        fontFamily: "inherit",
        overflow: "hidden",
        position: "relative",
        padding: "42px 48px 36px",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Art-Deco double frame */}
      <div style={{ position: "absolute", inset: 14, border: `1px solid ${line}`, pointerEvents: "none", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      <div style={{ position: "absolute", inset: 19, border: `1px solid ${lineFaint}`, pointerEvents: "none", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />

      {/* Masthead */}
      <div style={{ textAlign: "center", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 8 }}>
          <Chevron gold={gold} />
          <span style={{ width: 6, height: 6, background: gold, transform: "rotate(45deg)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
          <Chevron flip gold={gold} />
        </div>
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 42,
            margin: 0,
            lineHeight: 1,
            color: "#fff",
            letterSpacing: "0.04em",
          }}
        >
          {fullName}
        </h1>
        {pd.jobTitle && (
          <div style={{ fontSize: 11.5, letterSpacing: "0.42em", textTransform: "uppercase", color: gold, margin: "10px 0 12px" }}>
            {pd.jobTitle}
          </div>
        )}
        {contacts.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "5px 18px", fontSize: 10, color: mut }}>
            {contacts.map(([I, t], i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: gold, fontSize: 11 }}>{I}</span>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: line, margin: "22px 0 24px" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 34 }}>
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <SectionHead icon={<IcoChart />}>{labelFor("workExperience")}</SectionHead>
              {workExperience.map((e) => (
                <div key={e.id} className="resume-entry" style={{ marginBottom: 15, breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontFamily: "inherit", fontSize: 15.5, fontWeight: 600, color: "#fff" }}>{e.jobTitle}</div>
                    <div style={{ fontSize: 9.5, color: gold, whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 10.5, color: gold, marginBottom: 5 }}>
                    {e.employer}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 10.5, color: "#b3b1a6", lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <SectionHead icon={<IcoShield />}>{labelFor("education")}</SectionHead>
              {education.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontFamily: "inherit", fontSize: 14, color: "#fff" }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 10, color: mut }}>
                    {ed.institution}
                    {ed.city ? `, ${ed.city}` : ""}
                    {" · "}
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div>
          {visible("skills") && skills.length > 0 && (
            <>
              <SectionHead icon={<IcoBulb />}>{labelFor("skills")}</SectionHead>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 10px",
                  marginBottom: 22,
                }}
              >
                {skills.map((s) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10.5, color: cream }}>
                    <span style={{ width: 4, height: 4, background: gold, transform: "rotate(45deg)", flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    {s.name}
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <SectionHead icon={<IcoShield />}>{labelFor("certifications")}</SectionHead>
              <div style={{ marginBottom: 22 }}>
                {certifications.map((c) => (
                  <div key={c.id} style={{ marginBottom: 9, breakInside: "avoid" }}>
                    <div style={{ fontFamily: "inherit", fontSize: 12, color: "#fff" }}>{c.name}</div>
                    {(c.issuer || c.date) && (
                      <div style={{ fontSize: 9.5, color: gold }}>
                        {c.issuer || ""}{c.issuer && c.date ? " · " : ""}{c.date || ""}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Trajectory ornament box */}
          <SectionHead icon={<IcoGauge />}>{config.language === "en" ? "Trajectory" : "Trayectoria"}</SectionHead>
          <div style={{ border: `1px solid ${line}`, borderRadius: 8, padding: "14px 14px 10px" }}>
            <svg viewBox="0 0 200 70" width="100%" height="70" style={{ display: "block" }}>
              <path d="M0 60 Q40 50 80 45 T160 20 L200 10" fill="none" stroke={gold} strokeWidth="1.4" />
              <path d="M0 60 Q40 50 80 45 T160 20 L200 10" fill="none" stroke={cream} strokeWidth="0.4" opacity="0.5" />
              {[
                [0, 60],
                [80, 45],
                [160, 20],
                [200, 10],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="2.4" fill={gold} />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
