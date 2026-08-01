"use client"

/**
 * Exec Terra — Executive · Terracotta Arches.
 * Source: planillas-lujosas-Jun-29026/cv-exec-d.jsx (ExecTerra, 2026-06-03).
 *
 * Design fidelity:
 *  - Exact palette: bg #f2e9db, ink #3a2c22, terra #b4543a, bronze #9c6b3f, mut #9a8a78, line #e2d5c2.
 *  - Architectural double arch SVG headlining the masthead (initials inside arch).
 *  - Colonnade SVG strip below masthead (7 small arches).
 *  - Filled terracotta tile section icons; experience entries use ⌂ house glyph markers.
 *  - Print-safe: WebkitPrintColorAdjust on every coloured surface.
 *
 * Font mapping:
 *  - "Playfair Display" → var(--font-playfair) + Georgia fallback.
 *  - "Geist" → var(--font-jakarta) + system sans fallback.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'var(--font-playfair), "Playfair Display", Georgia, "Times New Roman", serif'
const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

const Glyphs = {
  work: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V9l8-5 8 5v12" /><path d="M9 21v-6h6v6M4 13h16" />
    </svg>
  ),
  edu: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4 3 8l9 4 9-4-9-4z" /><path d="M7 10v5c2.5 1.8 7.5 1.8 10 0v-5M21 8v5" />
    </svg>
  ),
  skill: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l2.5 5 5.5.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 7 8.5 5.5L20.5 7" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h3.5l1.5 4.5-2 1.5a11 11 0 0 0 5 5l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 5 5a2 2 0 0 1 1-2z" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 10c0 5-7 11-7 11s-7-6-7-11a7 7 0 0 1 14 0z" /><circle cx="12" cy="10" r="2.4" />
    </svg>
  ),
  lang: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
    </svg>
  ),
} as const

type GlyphKey = keyof typeof Glyphs

export default function ExecTerraTemplate() {
  const bg = "#f2e9db"
  const ink = "#3a2c22"
  const bronze = "#9c6b3f"
  const mut = "#9a8a78"
  const line = "#e2d5c2"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#b4543a")
  const terra = accent
  const data = useTemplateSectionData()
  const { personalDetails: pd, workExperience, education, skills, languages, certifications } = data
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "··"

  const Tile = ({ k, sz = 30, fill }: { k: GlyphKey; sz?: number; fill?: boolean }) => (
    <span
      style={{
        width: sz,
        height: sz,
        borderRadius: 9,
        background: fill ? terra : "#fff",
        border: fill ? "none" : `1px solid ${line}`,
        color: fill ? "#fff" : terra,
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

  const ArchMono = (
    <svg viewBox="0 0 120 112" width="116" height="108" style={{ display: "block", margin: "0 auto" }}>
      <path d="M14 106V52a46 46 0 0 1 92 0v54" fill="none" stroke={terra} strokeWidth="1.5" />
      <path d="M24 106V52a36 36 0 0 1 72 0v54" fill="none" stroke={bronze} strokeWidth="0.7" opacity="0.55" />
      <path d="M60 8l5 7-5 7-5-7z" fill={terra} />
      <text x="60" y="68" textAnchor="middle" dominantBaseline="central" fontFamily='var(--font-playfair), "Playfair Display", serif' fontSize="30" fontWeight="600" fill={ink}>
        {initials}
      </text>
    </svg>
  )

  const Colonnade = ({ n = 7 }: { n?: number }) => (
    <svg viewBox="0 0 280 24" width="100%" height="22" preserveAspectRatio="none" style={{ display: "block" }}>
      {Array.from({ length: n }).map((_, i) => {
        const w = 280 / n
        const x = i * w
        return <path key={i} d={`M${x + 3} 22V12a${w / 2 - 3} ${w / 2 - 3} 0 0 1 ${w - 6} 0v10`} fill="none" stroke={terra} strokeWidth="0.9" opacity="0.5" />
      })}
    </svg>
  )

  const Sec = ({ k, children }: { k: GlyphKey; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 11, margin: "0 0 14px" }}>
      <Tile k={k} sz={30} fill />
      <span style={{ fontFamily: "inherit", fontSize: 17, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: ink }}>
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: line, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
    </div>
  )

  const contacts: Array<[GlyphKey, string]> = []
  if (pd.email) contacts.push(["mail", pd.email])
  if (pd.phone) contacts.push(["phone", pd.phone])
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contacts.push(["pin", place])

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: `radial-gradient(ellipse 70% 50% at 50% 0%, #f7f0e4, transparent 70%), ${bg}`,
        color: ink,
        fontFamily: "inherit",
        overflow: "hidden",
        padding: "40px 50px 36px",
        position: "relative",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <div style={{ textAlign: "center" }}>
        {ArchMono}
        <h1 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 42, margin: "10px 0 0", lineHeight: 1, color: ink }}>
          {fullName}
        </h1>
        {pd.jobTitle && (
          <div style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: terra, margin: "9px 0 12px" }}>
            {pd.jobTitle}
          </div>
        )}
        {contacts.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "6px 16px", fontSize: 10.5, color: mut }}>
            {contacts.map(([k, t], i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: terra, fontSize: 13 }}>{Glyphs[k]}</span>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ margin: "18px 0 22px" }}>
        <Colonnade />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 36 }}>
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <Sec k="work">{labelFor("workExperience")}</Sec>
              {workExperience.map((e) => (
                <div
                  key={e.id}
                  className="resume-entry"
                  style={{ position: "relative", paddingLeft: 20, marginBottom: 15, breakInside: "avoid" }}
                >
                  <span style={{ position: "absolute", left: 0, top: 3, color: terra, fontSize: 13 }}>⌂</span>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontFamily: "inherit", fontSize: 16.5, fontWeight: 600, color: ink }}>{e.jobTitle}</div>
                    <div style={{ fontSize: 9.5, color: bronze, whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: terra, fontWeight: 600, marginBottom: 4 }}>
                    {e.employer}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 10.5, color: "#5e4f43", lineHeight: 1.5 }}
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
                      padding: "12px 4px",
                      background: "#fff",
                      border: `1px solid ${line}`,
                      borderRadius: 10,
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  >
                    <Tile k="skill" sz={26} />
                    <span style={{ fontSize: 9.5, color: "#5e4f43", textAlign: "center" }}>{s.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <Sec k="edu">{labelFor("education")}</Sec>
              {education.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 14, breakInside: "avoid" }}>
                  <div style={{ fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: ink, lineHeight: 1.2 }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 10, color: mut }}>
                    {ed.institution}
                    {ed.city ? `, ${ed.city}` : ""}
                  </div>
                  <div style={{ fontSize: 9.5, color: terra, marginTop: 2 }}>
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Sec k="lang">{labelFor("languages")}</Sec>
              {languages.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10.5,
                    padding: "3px 0",
                    borderBottom: `1px solid ${line}`,
                  }}
                >
                  <span>{l.name}</span>
                  <span style={{ color: terra }}>{langLbl(l.level)}</span>
                </div>
              ))}
            </div>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <Sec k="edu">{labelFor("certifications")}</Sec>
              {certifications.map((c) => (
                <div key={c.id} style={{ marginBottom: 12, breakInside: "avoid" }}>
                  <div style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: ink, lineHeight: 1.25 }}>{c.name}</div>
                  {c.issuer && <div style={{ fontSize: 10, color: mut }}>{c.issuer}</div>}
                  {c.date && <div style={{ fontSize: 9.5, color: terra, marginTop: 2 }}>{c.date}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
