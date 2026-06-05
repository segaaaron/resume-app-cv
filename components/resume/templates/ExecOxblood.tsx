"use client"

/**
 * Exec Oxblood — Executive · Bordeaux Wax Seal.
 * Source: planillas-lujosas-Jun-29026/cv-exec-c.jsx (ExecOxblood, 2026-06-03).
 *
 * Design fidelity:
 *  - Exact palette: cream #f4ece1, wine #591b29, wineDk #4a1622, gold #caa24c, ink #2a1a1d, mut #9a8478.
 *  - Bordeaux gradient left panel with wax-seal monogram (34 scalloped circles + 5-star ring).
 *  - Gold disc filled-glyph badges for contact, strengths, languages.
 *  - Cream right panel: serif name, gold accent, gold timeline with wine dot markers.
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

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

// Filled glyphs on gold discs
const Glyphs = {
  mail: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
      <path d="M3 6h18a1 1 0 0 1 1 1v.3l-10 6L2 7.3V7a1 1 0 0 1 1-1zm-1 3.5 9.4 5.6a1 1 0 0 0 1.1 0L22 9.5V17a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
      <path d="M6.5 3a1.5 1.5 0 0 1 1.4 1l1 2.6a1.5 1.5 0 0 1-.4 1.6L7.2 9.6a13 13 0 0 0 5.2 5.2l1.4-1.3a1.5 1.5 0 0 1 1.6-.3l2.6 1a1.5 1.5 0 0 1 1 1.4v2.5a1.6 1.6 0 0 1-1.7 1.6A16.5 16.5 0 0 1 3.7 6.7 1.6 1.6 0 0 1 5.3 5z" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
      <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  ),
  growth: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
      <path d="M3 3h2v16h16v2H3zM8 14l3.5-4 3 2.5L20 6v5h-2V9.4l-3.3 4-3-2.5L8.5 15z" />
    </svg>
  ),
  strat: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2zM9 19h6v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
      <path d="M4 4h7a2 2 0 0 1 2 2v14a3 3 0 0 0-2-1H4zm16 0h-5a2 2 0 0 0-2 2v13a3 3 0 0 1 2-1h5z" />
    </svg>
  ),
} as const

type GlyphKey = keyof typeof Glyphs

function Seal({ size, gold, wineDk, initials }: { size: number; gold: string; wineDk: string; initials: string }) {
  const scal = Array.from({ length: 34 }).map((_, i) => {
    const a = (i / 34) * Math.PI * 2
    return <circle key={i} cx={50 + Math.cos(a) * 43} cy={50 + Math.sin(a) * 43} r="3.4" fill={gold} />
  })
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: "block" }}>
      {scal}
      <circle cx="50" cy="50" r="41" fill={gold} />
      <circle cx="50" cy="50" r="36" fill="none" stroke={wineDk} strokeWidth="1.3" />
      {Array.from({ length: 5 }).map((_, i) => {
        const a = -Math.PI / 2 + (i / 5) * Math.PI * 2
        return <path key={i} d="M0-3 1 0 0 3 -1 0Z" fill={wineDk} transform={`translate(${50 + Math.cos(a) * 28} ${50 + Math.sin(a) * 28})`} />
      })}
      <text x="50" y="52" textAnchor="middle" dominantBaseline="central" fontFamily='var(--font-playfair), "Playfair Display", serif' fontSize="30" fontWeight="700" fill={wineDk}>
        {initials}
      </text>
    </svg>
  )
}

export default function ExecOxbloodTemplate() {
  const cream = "#f4ece1"
  const wine = "#591b29"
  const wineDk = "#4a1622"
  const ink = "#2a1a1d"
  const mut = "#9a8478"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = config.colorScheme || "#caa24c"
  const gold = accent
  const data = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = data
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const firstLine = pd.firstName || "Your"
  const lastLine = pd.lastName || "Name"
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "··"

  const Badge = ({ k, sz = 24 }: { k: GlyphKey; sz?: number }) => (
    <span
      style={{
        width: sz,
        height: sz,
        borderRadius: "50%",
        background: gold,
        color: wineDk,
        display: "inline-grid",
        placeItems: "center",
        fontSize: sz * 0.54,
        flexShrink: 0,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {Glyphs[k]}
    </span>
  )

  const Sec = ({ k, children, onCream }: { k: GlyphKey; children: React.ReactNode; onCream?: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 11, margin: "0 0 13px" }}>
      <Badge k={k} sz={24} />
      <span
        style={{
          fontFamily: "inherit",
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: onCream ? wine : "#fff",
        }}
      >
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: onCream ? "#e2d6c6" : "rgba(255,255,255,0.18)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
    </div>
  )

  const contacts: Array<[GlyphKey, string]> = []
  if (pd.email) contacts.push(["mail", pd.email])
  if (pd.phone) contacts.push(["phone", pd.phone])
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contacts.push(["pin", place])

  return (
    <div
      data-print-layout="sidebar-left"
      style={{
        width: "100%",
        minHeight: "297mm",
        display: "grid",
        gridTemplateColumns: "254px 1fr",
        fontFamily: "inherit",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Wine panel */}
      <div
        style={{
          background: `linear-gradient(160deg,${wine},${wineDk})`,
          color: "#f0e3d8",
          padding: "38px 26px",
          display: "flex",
          flexDirection: "column",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <Seal size={96} gold={gold} wineDk={wineDk} initials={initials} />
        </div>

        {contacts.length > 0 && (
          <>
            <Sec k="mail">{config.language === "en" ? "Contact" : "Contacto"}</Sec>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 10.5, color: "#e3d3c6", marginBottom: 26 }}>
              {contacts.map(([k, t], i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <Badge k={k} sz={24} />
                  {t}
                </span>
              ))}
            </div>
          </>
        )}

        {visible("skills") && skills.length > 0 && (
          <>
            <Sec k="strat">{labelFor("skills")}</Sec>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 26 }}>
              {skills.map((s) => (
                <span key={s.id} style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 11.5, color: "#ecdfd3" }}>
                  <Badge k="strat" sz={24} />
                  {s.name}
                </span>
              ))}
            </div>
          </>
        )}

        {visible("languages") && languages.length > 0 && (
          <>
            <Sec k="book">{labelFor("languages")}</Sec>
            <div style={{ marginBottom: 26 }}>
              {languages.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10.5,
                    padding: "4px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                >
                  <span>{l.name}</span>
                  <span style={{ color: gold }}>{langLbl(l.level)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <Sec k="book">{labelFor("certifications")}</Sec>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {certifications.map((c) => (
                <div key={c.id} style={{ breakInside: "avoid" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "#ecdfd3", lineHeight: 1.25 }}>{c.name}</div>
                  {c.issuer && <div style={{ fontSize: 10, color: "#d8c5b3" }}>{c.issuer}</div>}
                  {c.date && <div style={{ fontSize: 9.5, color: gold }}>{c.date}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Cream main */}
      <div
        style={{
          background: cream,
          color: ink,
          padding: "44px 42px",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <h1 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 46, margin: 0, lineHeight: 0.98, color: wine }}>
          {firstLine}
          <br />
          {lastLine}
        </h1>
        {pd.jobTitle && (
          <div style={{ fontSize: 11.5, letterSpacing: "0.32em", textTransform: "uppercase", color: gold, margin: "12px 0 18px" }}>
            {pd.jobTitle}
          </div>
        )}
        {visible("summary") && summary && (
          <p style={{ fontSize: 11.5, lineHeight: 1.65, color: "#5a4a44", margin: "0 0 26px" }}>{summary}</p>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <Sec k="growth" onCream>{labelFor("workExperience")}</Sec>
            <div style={{ marginBottom: 24 }}>
              {workExperience.map((e) => (
                <div
                  key={e.id}
                  className="resume-entry"
                  style={{
                    position: "relative",
                    paddingLeft: 18,
                    marginBottom: 15,
                    borderLeft: `2px solid ${gold}`,
                    breakInside: "avoid",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: -6,
                      top: 4,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: wine,
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontFamily: "inherit", fontSize: 16, fontWeight: 600, color: wine }}>{e.jobTitle}</div>
                    <div style={{ fontSize: 9.5, color: gold, whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#8a5a52", fontWeight: 600, marginBottom: 4 }}>
                    {e.employer}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 10.5, color: "#5a4a44", lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {visible("education") && education.length > 0 && (
          <>
            <Sec k="book" onCream>{labelFor("education")}</Sec>
            {education.map((ed) => (
              <div key={ed.id} style={{ marginBottom: 8, breakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontFamily: "inherit", fontSize: 15, fontWeight: 600, color: wine }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 9.5, color: gold }}>
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: mut }}>
                  {ed.institution}
                  {ed.city ? `, ${ed.city}` : ""}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
