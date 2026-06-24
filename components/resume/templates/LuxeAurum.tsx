"use client"

/**
 * Luxe Aurum — Cream & Gold sidebar · Circular skill gauges.
 * Source: planillas-lujosas-Jun-29026/cv-luxe-2026.jsx (LuxeAurum, 2026-06-03).
 *
 * Design fidelity:
 *  - Two-column layout: sand sidebar (262px) + paper main panel.
 *  - Sidebar hosts circular avatar (gold ring), three LxRing gauges (top 3 skills),
 *    Contact, Languages, Certified list.
 *  - Main hosts spaced kicker title, oversized serif name (italic gold last name),
 *    summary, Experience timeline (diamond markers), Education.
 *  - Print-safe: WebkitPrintColorAdjust on every coloured surface.
 *
 * Font mapping:
 *  - "Cormorant Garamond" (display serif) → Georgia fallback.
 *  - "Geist" (body sans) → var(--font-jakarta) + system sans fallback.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'var(--font-playfair), "Cormorant Garamond", "Playfair Display", Georgia, "Times New Roman", serif'
const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

const LANG_LEVEL_PCT: Record<string, number> = {
  a1: 17, a2: 33, b1: 50, b2: 67, c1: 83, c2: 100, native: 100,
}
const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}
const SKILL_PCT: Record<string, number> = {
  beginner: 40, intermediate: 65, advanced: 85, expert: 96,
}

// Section header w/ gold label + hairline
function LxHead({ gold, line, children }: { gold: string; line: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 13px" }}>
      <span
        style={{
          fontFamily: "inherit",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          color: gold,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: line, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
    </div>
  )
}

// Circular ring gauge (from source LxRing)
function LxRing({ pct, label, val, color, track, ink }: { pct: number; label: string; val: string; color: string; track: string; ink: string }) {
  const r = 14
  const c = 2 * Math.PI * r
  const off = c * (1 - pct / 100)
  return (
    <div style={{ textAlign: "center", width: 36 }}>
      <svg viewBox="0 0 34 34" width="34" height="34">
        <circle cx="17" cy="17" r={r} fill="none" stroke={track} strokeWidth="2" opacity="0.5" />
        <circle
          cx="17" cy="17" r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform="rotate(-90 17 17)"
        />
        <text
          x="17" y="17"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily='"Inter", sans-serif'
          fontSize="9"
          fontWeight="600"
          fill={ink}
        >
          {val}
        </text>
      </svg>
      <div
        style={{
          fontFamily: "inherit",
          fontSize: 7,
          letterSpacing: "0.03em",
          lineHeight: 1.15,
          color: ink,
          marginTop: 3,
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 40,
        }}
      >
        {label}
      </div>
    </div>
  )
}

const IcoMail = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" />
  </svg>
)
const IcoPhone = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.97.36 1.92.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.34 1.84.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)
const IcoPin = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const IcoGlobe = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
  </svg>
)

export default function LuxeAurumTemplate() {
  const paper = "#f7f3ea"
  const sand = "#efe8d8"
  const ink = "#2a2620"
  const mut = "#8a8270"
  const line = "#e0d8c4"
  const track = "#e3dac6"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const gold = config.colorScheme || "#a8843a"
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications,
  } = data
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"
  const langPct = (lvl: string) => LANG_LEVEL_PCT[lvl] ?? 55
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()
  const skillPct = (lvl: string) => SKILL_PCT[lvl] ?? 70

  const firstLine = pd.firstName || "Your"
  const lastLine = pd.lastName || "Name"
  const gauges = skills.map((s) => ({ label: s.name, pct: skillPct(s.level) }))

  return (
    <div
      data-print-layout="sidebar-left"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: paper,
        color: ink,
        fontFamily: "inherit",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "262px 1fr",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* SIDEBAR */}
      <div
        style={{
          background: sand,
          padding: "44px 30px",
          display: "flex",
          flexDirection: "column",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {config.photoUrl && (
          <div
            style={{
              padding: 5,
              borderRadius: "50%",
              border: `1px solid ${gold}`,
              alignSelf: "center",
              marginBottom: 22,
            }}
          >
            <img
              src={config.photoUrl}
              alt={firstLine}
              style={{
                width: 128,
                height: 128,
                borderRadius: "50%",
                objectFit: "cover",
                objectPosition: `center ${config.photoPosition ?? 15}%`,
                display: "block",
              }}
            />
          </div>
        )}

        {gauges.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", marginBottom: 26, gap: "12px 7px" }}>
            {gauges.map((g, i) => (
              <LxRing
                key={i}
                pct={g.pct}
                val={`${g.pct}`}
                label={g.label}
                color={gold}
                track={track}
                ink={ink}
              />
            ))}
          </div>
        )}

        <LxHead gold={gold} line={line}>{config.language === "en" ? "Contact" : "Contacto"}</LxHead>
        <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 11, color: "#534e44", marginBottom: 26 }}>
          {pd.email && (
            <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ color: gold, fontSize: 13, width: 15, display: "grid", placeItems: "center" }}><IcoMail /></span>
              {pd.email}
            </span>
          )}
          {pd.phone && (
            <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ color: gold, fontSize: 13, width: 15, display: "grid", placeItems: "center" }}><IcoPhone /></span>
              {pd.phone}
            </span>
          )}
          {(pd.city || pd.country) && (
            <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ color: gold, fontSize: 13, width: 15, display: "grid", placeItems: "center" }}><IcoPin /></span>
              {[pd.city, pd.country].filter(Boolean).join(", ")}
            </span>
          )}
          {pd.website && (
            <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ color: gold, fontSize: 13, width: 15, display: "grid", placeItems: "center" }}><IcoGlobe /></span>
              {pd.website}
            </span>
          )}
        </div>

        {visible("languages") && languages.length > 0 && (
          <>
            <LxHead gold={gold} line={line}>{labelFor("languages")}</LxHead>
            <div style={{ marginBottom: 26 }}>
              {languages.map((l) => (
                <div key={l.id} style={{ marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{l.name}</span>
                    <span style={{ color: mut }}>{langLbl(l.level)}</span>
                  </div>
                  <div style={{ height: 3, background: track, borderRadius: 2, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    <div style={{ width: `${langPct(l.level)}%`, height: "100%", background: gold, borderRadius: 2, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <>
            <LxHead gold={gold} line={line}>{labelFor("certifications")}</LxHead>
            <div style={{ fontSize: 10.5, color: "#534e44", lineHeight: 1.7 }}>
              {certifications.map((c) => (
                <div key={c.id} style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: gold }}>✦</span>
                  <span>{c.name}{c.issuer ? ` — ${c.issuer}` : ""}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* MAIN */}
      <div style={{ padding: "50px 46px 40px" }}>
        {pd.jobTitle && (
          <div style={{ fontSize: 10.5, letterSpacing: "0.42em", color: gold, marginBottom: 10, textTransform: "uppercase", paddingLeft: "0.4em" }}>
            {pd.jobTitle}
          </div>
        )}
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 58,
            margin: 0,
            lineHeight: 0.92,
            color: ink,
            letterSpacing: "-0.01em",
          }}
        >
          {firstLine}<br />
          <span style={{ fontStyle: "italic", color: gold }}>{lastLine}</span>
        </h1>

        {visible("summary") && summary && (
          <p style={{ fontSize: 12.5, lineHeight: 1.65, color: "#54503f", margin: "20px 0 28px", maxWidth: 460 }}>
            {summary}
          </p>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <LxHead gold={gold} line={line}>{labelFor("workExperience")}</LxHead>
            {workExperience.map((e) => (
              <div
                key={e.id}
                className="resume-entry"
                style={{ position: "relative", paddingLeft: 20, marginBottom: 16, borderLeft: `2px solid ${line}`, breakInside: "avoid" }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: -6,
                    top: 3,
                    width: 10,
                    height: 10,
                    background: paper,
                    border: `2px solid ${gold}`,
                    transform: "rotate(45deg)",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <div style={{ fontFamily: "inherit", fontSize: 21, fontWeight: 600, color: ink, lineHeight: 1.05 }}>{e.jobTitle}</div>
                  <div style={{ fontSize: 10, color: gold, whiteSpace: "nowrap", fontWeight: 500 }}>
                    {e.startDate}
                    {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: mut, fontWeight: 600, marginBottom: 5 }}>
                  {e.employer}{e.city ? ` · ${e.city}` : ""}
                </div>
                {e.description && (
                  <div
                    className="resume-desc"
                    style={{ fontSize: 11, color: "#54503f", lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                  />
                )}
              </div>
            ))}
          </>
        )}

        {visible("education") && education.length > 0 && (
          <>
            <LxHead gold={gold} line={line}>{labelFor("education")}</LxHead>
            {education.map((ed) => (
              <div key={ed.id} style={{ marginBottom: 8, breakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <div style={{ fontFamily: "inherit", fontSize: 19, fontWeight: 600, color: ink }}>
                    {ed.degree}{ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 10, color: gold, whiteSpace: "nowrap" }}>
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: mut }}>
                  {ed.institution}{ed.city ? `, ${ed.city}` : ""}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
