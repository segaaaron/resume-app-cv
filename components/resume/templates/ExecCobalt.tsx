"use client"

/**
 * Exec Cobalt — Executive · Midnight Platinum Network.
 * Source: planillas-lujosas-Jun-29026/cv-exec-c.jsx (ExecCobalt, 2026-06-03).
 *
 * Design fidelity:
 *  - Exact palette: bg #0a0e1a, panel #141a2b, silver #aeb9cc, ice #e9edf4, mut #6e7896.
 *  - Radial gradient highlight top-right + signature network constellation hero.
 *  - Rounded tile icons (panel fill + silver border + silver glyph).
 *  - Cool tech-executive: Space Grotesk display + Geist Mono utility caps.
 *  - Print-safe: WebkitPrintColorAdjust on every coloured surface.
 *
 * Font mapping:
 *  - "Space Grotesk" → var(--font-jakarta) (Jakarta has same modern geometric feel).
 *  - "Geist Mono" → MONO = '"Courier New", monospace'.
 *  - "Geist" → var(--font-jakarta) body.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-space-grotesk), "Space Grotesk", "Space Grotesk", "Inter", system-ui, -apple-system, sans-serif'
const MONO = '"Geist Mono", "JetBrains Mono", "Courier New", monospace'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

const Glyphs = {
  work: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="1.5" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
    </svg>
  ),
  edu: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4 3 8l9 4 9-4-9-4z" />
      <path d="M7 10v5c2.5 1.8 7.5 1.8 10 0v-5" />
    </svg>
  ),
  skill: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4V6M12 18v2M4 12H6M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
      <path d="m3.5 7 8.5 5.5L20.5 7" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h3.5l1.5 4.5-2 1.5a11 11 0 0 0 5 5l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 5 5a2 2 0 0 1 1-2z" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 10c0 5-7 11-7 11s-7-6-7-11a7 7 0 0 1 14 0z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
      <path d="M6.94 5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0M3.4 8.5h3.1V21H3.4zm5.5 0h3v1.7h.05a3.3 3.3 0 0 1 3-1.6c3.2 0 3.8 2.1 3.8 4.8V21h-3.1v-5c0-1.2 0-2.7-1.66-2.7s-1.9 1.3-1.9 2.6V21H8.9z" />
    </svg>
  ),
  lang: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
    </svg>
  ),
} as const

type GlyphKey = keyof typeof Glyphs

function NetworkConstellation({ silver, ice, bg }: { silver: string; ice: string; bg: string }) {
  const w = 230
  const h = 120
  const nodes: Array<[number, number]> = [
    [18, 92], [54, 58], [88, 86], [120, 40], [150, 72], [186, 30], [214, 64],
  ]
  const edges: Array<[number, number]> = [
    [0, 1], [1, 2], [1, 3], [2, 4], [3, 4], [3, 5], [4, 6], [5, 6],
  ]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: "block", overflow: "visible" }}>
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={silver} strokeWidth="0.7" opacity="0.4" />
      ))}
      {nodes.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i === 5 ? 5 : 3} fill={i === 5 ? ice : bg} stroke={silver} strokeWidth="1" />
          {i === 5 && <circle cx={x} cy={y} r="9" fill="none" stroke={silver} strokeWidth="0.6" opacity="0.5" />}
        </g>
      ))}
    </svg>
  )
}

export default function ExecCobaltTemplate() {
  const bg = "#0a0e1a"
  const panel = "#141a2b"
  const ice = "#e9edf4"
  const mut = "#6e7896"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#aeb9cc")
  const silver = accent
  const line = `${accent}2e`
  const data = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = data
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const firstLine = pd.firstName || "Your"
  const lastLine = pd.lastName || "Name"

  const Tile = ({ k, sz = 28 }: { k: GlyphKey; sz?: number }) => (
    <span
      style={{
        width: sz,
        height: sz,
        borderRadius: 7,
        background: panel,
        border: `1px solid ${line}`,
        color: silver,
        display: "inline-grid",
        placeItems: "center",
        fontSize: sz * 0.5,
        flexShrink: 0,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {Glyphs[k]}
    </span>
  )

  const Sec = ({ k, children }: { k: GlyphKey; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 11, margin: "0 0 14px" }}>
      <Tile k={k} sz={28} />
      <span style={{ fontFamily: "inherit", fontSize: 13, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: ice }}>
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: line }} />
    </div>
  )

  const contacts: Array<[GlyphKey, string]> = []
  if (pd.email) contacts.push(["mail", pd.email])
  if (pd.phone) contacts.push(["phone", pd.phone])
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contacts.push(["pin", place])
  if (pd.website) contacts.push(["link", pd.website])

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: `radial-gradient(ellipse 80% 60% at 85% 0%, ${accent}12, transparent 60%), ${bg}`,
        color: ice,
        fontFamily: "inherit",
        overflow: "hidden",
        padding: "46px 48px 40px",
        position: "relative",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Hero */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 28, alignItems: "center", marginBottom: 12 }}>
        <div>
          {pd.jobTitle && (
            <div style={{ fontFamily: "inherit", fontSize: 11, letterSpacing: "0.34em", textTransform: "uppercase", color: silver, marginBottom: 12 }}>
              {pd.jobTitle}
            </div>
          )}
          <h1 style={{ fontFamily: "inherit", fontWeight: 700, fontSize: 50, margin: 0, lineHeight: 0.9, letterSpacing: "-0.02em", color: "#fff" }}>
            {firstLine}
            <br />
            {lastLine}
          </h1>
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.2em", color: mut, textAlign: "right", marginBottom: 6 }}>
            NETWORK · INFLUENCE
          </div>
          <NetworkConstellation silver={silver} ice={ice} bg={bg} />
        </div>
      </div>

      {/* Contact band */}
      {contacts.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 16px",
            fontSize: 10.5,
            color: mut,
            padding: "16px 0",
            borderTop: `1px solid ${line}`,
            borderBottom: `1px solid ${line}`,
            marginBottom: 24,
          }}
        >
          {contacts.map(([k, t], i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: silver, fontSize: 13 }}>{Glyphs[k]}</span>
              {t}
            </span>
          ))}
        </div>
      )}

      {visible("summary") && summary && (
        <p style={{ fontSize: 11.5, lineHeight: 1.65, color: "#c5ccdb", margin: "0 0 26px", maxWidth: 560 }}>{summary}</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 36 }}>
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <Sec k="work">{labelFor("workExperience")}</Sec>
              {workExperience.map((e) => (
                <div key={e.id} className="resume-entry" style={{ marginBottom: 16, breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontFamily: "inherit", fontSize: 15.5, fontWeight: 600, color: "#fff" }}>{e.jobTitle}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: silver, whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: silver, marginBottom: 5 }}>
                    {e.employer}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 10.5, color: "#aab2c4", lineHeight: 1.5 }}
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
              <Sec k="skill">{labelFor("skills")}</Sec>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
                {skills.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      padding: "12px 6px",
                      border: `1px solid ${line}`,
                      borderRadius: 8,
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  >
                    <Tile k="skill" sz={26} />
                    <span style={{ fontSize: 9.5, color: "#c5ccdb", textAlign: "center" }}>{s.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <Sec k="edu">{labelFor("education")}</Sec>
              {education.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 10, color: mut }}>
                    {ed.institution}
                    {ed.city ? `, ${ed.city}` : ""}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: silver, marginTop: 2 }}>
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Sec k="lang">{labelFor("languages")}</Sec>
              {languages.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10.5,
                    padding: "4px 0",
                    borderBottom: `1px solid ${line}`,
                  }}
                >
                  <span>{l.name}</span>
                  <span style={{ fontFamily: MONO, color: silver }}>{langLbl(l.level)}</span>
                </div>
              ))}
            </div>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Sec k="edu">{labelFor("certifications")}</Sec>
              {certifications.map((c) => (
                <div key={c.id} style={{ marginBottom: 9, breakInside: "avoid" }}>
                  <div style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: "#fff", lineHeight: 1.25 }}>{c.name}</div>
                  {c.issuer && <div style={{ fontSize: 10, color: mut }}>{c.issuer}</div>}
                  {c.date && <div style={{ fontFamily: MONO, fontSize: 9, color: silver, marginTop: 2 }}>{c.date}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
