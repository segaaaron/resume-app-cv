"use client"

/**
 * Luxe Apex — Charcoal tech-luxe · Compass ornament + monoline pills.
 * Source: planillas-lujosas-Jun-29026/cv-luxe-2026.jsx (LuxeApex, 2026-06-03).
 *
 * Design fidelity:
 *  - Bg #141418 with ice-blue #9fb6cf accents and monospaced micro-labels.
 *  - 4 corner brackets (LxCorner) + radial LxCompass ornament beside name.
 *  - Two-column body: Experience left (diamond ticks), Stack + Languages + Education right.
 *  - Print-safe: WebkitPrintColorAdjust on all coloured surfaces.
 *
 * Font mapping:
 *  - "Space Grotesk" → var(--font-jakarta) sans stack.
 *  - "Geist Mono" → "Courier New" monospace stack.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-space-grotesk), "Space Grotesk", "Space Grotesk", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'
const MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, "Courier New", monospace'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}
const SKILL_PCT: Record<string, number> = {
  beginner: 40, intermediate: 65, advanced: 85, expert: 96,
}

// Corner filigree bracket
function LxCorner({ color, pos, size = 34 }: { color: string; pos: "tl" | "tr" | "bl" | "br"; size?: number }) {
  const map: Record<typeof pos, { top?: number; left?: number; right?: number; bottom?: number; rot: number }> = {
    tl: { top: 18, left: 18, rot: 0 },
    tr: { top: 18, right: 18, rot: 90 },
    bl: { bottom: 18, left: 18, rot: 270 },
    br: { bottom: 18, right: 18, rot: 180 },
  }
  const p = map[pos]
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      style={{
        position: "absolute",
        top: p.top,
        left: p.left,
        right: p.right,
        bottom: p.bottom,
        transform: `rotate(${p.rot}deg)`,
        pointerEvents: "none",
      }}
    >
      <path d="M2 18 V4 a2 2 0 0 1 2 -2 H18" fill="none" stroke={color} strokeWidth="1" />
      <path d="M9 18 V11 a2 2 0 0 1 2 -2 H18" fill="none" stroke={color} strokeWidth="0.7" opacity="0.7" />
      <circle cx="4" cy="4" r="1.3" fill={color} />
    </svg>
  )
}

// Radial compass tick ornament (from source LxCompass)
function LxCompass({ size = 92, color, ink }: { size?: number; color: string; ink: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      {Array.from({ length: 48 }).map((_, i) => {
        const a = (i / 48) * Math.PI * 2
        const long = i % 4 === 0
        const r1 = long ? 36 : 40
        const r2 = 44
        return (
          <line
            key={i}
            x1={50 + Math.cos(a) * r1}
            y1={50 + Math.sin(a) * r1}
            x2={50 + Math.cos(a) * r2}
            y2={50 + Math.sin(a) * r2}
            stroke={color}
            strokeWidth={long ? 1 : 0.5}
            opacity={long ? 0.85 : 0.4}
          />
        )
      })}
      <circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth="0.6" opacity="0.5" />
      <path d="M50 24 L56 50 L50 76 L44 50 Z" fill={color} opacity="0.85" />
      <circle cx="50" cy="50" r="3" fill={ink} stroke={color} strokeWidth="1" />
    </svg>
  )
}

function LxHead({ color, line, children }: { color: string; line: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 13px" }}>
      <span
        style={{
          fontFamily: "inherit",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          color,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: line, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
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

export default function LuxeApexTemplate() {
  const bg = "#141418"
  const panel = "#1b1b21"
  const cream = "#e7e8ec"
  const mut = "#7b7d88"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const ice = designAccent(config.colorScheme, "#9fb6cf")
  const line = "rgba(159,182,207,0.2)"
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications,
  } = data
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()
  const skillPct = (lvl: string) => SKILL_PCT[lvl] ?? 70

  const firstLine = pd.firstName || "Your"
  const lastLine = pd.lastName || "Name"

  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.email) contacts.push([<IcoMail key="m" />, pd.email])
  if (pd.phone) contacts.push([<IcoPhone key="p" />, pd.phone])
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contacts.push([<IcoPin key="i" />, place])
  if (pd.website) contacts.push([<IcoGlobe key="g" />, pd.website])

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: bg,
        color: cream,
        fontFamily: SANS,
        overflow: "hidden",
        position: "relative",
        padding: "46px 50px 40px",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <LxCorner color={ice} pos="tl" />
      <LxCorner color={ice} pos="tr" />
      <LxCorner color={ice} pos="bl" />
      <LxCorner color={ice} pos="br" />

      {/* MASTHEAD */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center", marginBottom: 6 }}>
        <div>
          {pd.jobTitle && (
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: "0.32em",
                color: ice,
                marginBottom: 12,
                textTransform: "uppercase",
              }}
            >
              {"// "}{pd.jobTitle}
            </div>
          )}
          <h1
            style={{
              fontWeight: 700,
              fontSize: 52,
              margin: 0,
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              color: "#fff",
            }}
          >
            {firstLine}<br />{lastLine}
          </h1>
        </div>
        <LxCompass size={92} color={ice} ink={bg} />
      </div>

      {contacts.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 18px",
            fontFamily: MONO,
            fontSize: 10.5,
            color: mut,
            margin: "18px 0",
            paddingBottom: 18,
            borderBottom: `1px solid ${line}`,
          }}
        >
          {contacts.map(([I, t], i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ color: ice, fontSize: 12, display: "grid", placeItems: "center" }}>{I}</span>
              {t}
            </span>
          ))}
        </div>
      )}

      {visible("summary") && summary && (
        <p style={{ fontSize: 12.5, lineHeight: 1.65, color: "#b6b8c2", margin: "0 0 24px", maxWidth: 620 }}>
          {summary}
        </p>
      )}

      {/* BODY */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 38 }}>
        {/* LEFT — EXPERIENCE */}
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <LxHead color={ice} line={line}>{labelFor("workExperience")}</LxHead>
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
                      width: 7,
                      height: 7,
                      border: `1.5px solid ${ice}`,
                      transform: "rotate(45deg)",
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 700, color: "#fff" }}>{e.jobTitle}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9.5, color: ice, whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: mut, marginBottom: 5 }}>
                    {e.employer}{e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 11, color: "#b6b8c2", lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* RIGHT — STACK / LANGUAGES / EDUCATION */}
        <div>
          {visible("skills") && skills.length > 0 && (
            <>
              <LxHead color={ice} line={line}>{labelFor("skills")}</LxHead>
              <div style={{ marginBottom: 22 }}>
                {skills.map((s) => {
                  const p = skillPct(s.level)
                  return (
                    <div key={s.id} style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontFamily: MONO,
                          fontSize: 10,
                          color: cream,
                          marginBottom: 4,
                        }}
                      >
                        <span>{s.name}</span>
                        <span style={{ color: ice }}>{p}%</span>
                      </div>
                      <div
                        style={{
                          height: 3,
                          background: panel,
                          borderRadius: 2,
                          WebkitPrintColorAdjust: "exact",
                          printColorAdjust: "exact",
                        }}
                      >
                        <div
                          style={{
                            width: `${p}%`,
                            height: "100%",
                            background: ice,
                            borderRadius: 2,
                            WebkitPrintColorAdjust: "exact",
                            printColorAdjust: "exact",
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <LxHead color={ice} line={line}>{labelFor("languages")}</LxHead>
              <div style={{ marginBottom: 22 }}>
                {languages.map((l) => (
                  <div
                    key={l.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: MONO,
                      fontSize: 10.5,
                      color: "#b6b8c2",
                      marginBottom: 6,
                    }}
                  >
                    <span>{l.name}</span>
                    <span style={{ color: ice }}>{langLbl(l.level)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <LxHead color={ice} line={line}>{labelFor("certifications")}</LxHead>
              <div style={{ marginBottom: 22 }}>
                {certifications.map((c) => (
                  <div key={c.id} style={{ marginBottom: 9, breakInside: "avoid" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", lineHeight: 1.25 }}>{c.name}</div>
                    {c.issuer && <div style={{ fontFamily: MONO, fontSize: 9.5, color: mut }}>{c.issuer}</div>}
                    {c.date && <div style={{ fontFamily: MONO, fontSize: 9.5, color: ice, marginTop: 2 }}>{c.date}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <LxHead color={ice} line={line}>{labelFor("education")}</LxHead>
              {education.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    {ed.degree}{ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9.5, color: mut }}>
                    {ed.institution}{ed.city ? `, ${ed.city}` : ""}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9.5, color: ice, marginTop: 2 }}>
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
