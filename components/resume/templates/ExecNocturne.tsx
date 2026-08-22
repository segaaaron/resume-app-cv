"use client"

/**
 * Exec Nocturne — Executive · Plum & Rose-Gold.
 * Source: planillas-lujosas-Jun-29026/cv-exec-d.jsx (ExecNocturne, 2026-06-03).
 *
 * Design fidelity:
 *  - Exact palette: bg #241229, bgDk #1b0e20, rose #cf9f86, roseHi #e6c4ad, cream #efe4ea, mut #9a829a.
 *  - Radial highlight + plum diagonal gradient.
 *  - Art-nouveau scroll flourish (mirrored S-curves) sitting above the name.
 *  - Diamond-framed section icons (45° rotated frames with counter-rotated glyphs).
 *  - Last name in italic rose; ring gauges from skill levels; language bars.
 *  - Print-safe: WebkitPrintColorAdjust on every coloured surface.
 *
 * Font mapping:
 *  - "Cormorant Garamond" → var(--font-playfair) + Georgia fallback.
 *  - "Geist" → var(--font-jakarta) + system sans fallback.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'var(--font-cormorant), "Cormorant Garamond", "Playfair Display", Georgia, serif'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}
const LANG_PCT: Record<string, number> = { a1: 20, a2: 35, b1: 55, b2: 70, c1: 85, c2: 95, native: 100 }
const SKILL_PCT: Record<string, number> = { beginner: 45, intermediate: 65, advanced: 85, expert: 95 }

const Glyphs = {
  work: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="7.5" width="17" height="12" rx="1.5" />
      <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5" />
    </svg>
  ),
  edu: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5 4 8.5l8 3.5 8-3.5L12 5z" />
      <path d="M7 10.5v4c2.4 1.6 7.6 1.6 10 0v-4" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4l2.2 4.6 5 .7-3.6 3.5.9 5L12 15.4 7.5 17.8l.9-5L4.8 9.3l5-.7z" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="6" width="17" height="12" rx="1.5" />
      <path d="m4 7.5 8 5 8-5" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 3.5h3l1.3 4-1.8 1.3a10 10 0 0 0 4.7 4.7l1.3-1.8 4 1.3v3a1.8 1.8 0 0 1-1.9 1.8A15 15 0 0 1 4.7 5.4 1.8 1.8 0 0 1 6.5 3.5z" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.5 10c0 4.7-6.5 10.5-6.5 10.5S5.5 14.7 5.5 10a6.5 6.5 0 0 1 13 0z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  ),
} as const

type GlyphKey = keyof typeof Glyphs

function Gauge({ pct, label, rose, cream }: { pct: number; label: string; rose: string; cream: string }) {
  const r = 22
  const c = 2 * Math.PI * r
  const off = c * (1 - pct / 100)
  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 60 60" width="58" height="58">
        <circle cx="30" cy="30" r={r} fill="none" stroke={`${rose}2e`} strokeWidth="3.5" />
        <circle cx="30" cy="30" r={r} fill="none" stroke={rose} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 30 30)" />
        <text x="30" y="30" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-jakarta), sans-serif" fontSize="12" fontWeight="700" fill={cream}>
          {pct}
        </text>
      </svg>
      <div style={{ fontSize: 9, color: "#cbb6c4", marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function ExecNocturneTemplate() {
  const bg = "#241229"
  const bgDk = "#1b0e20"
  const cream = "#efe4ea"
  const mut = "#9a829a"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#cf9f86")
  const rose = accent
  const roseHi = accent
  const line = `${accent}38`
  const data = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = data
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const Dia = ({ k, sz = 26 }: { k: GlyphKey; sz?: number }) => (
    <span
      style={{
        width: sz,
        height: sz,
        transform: "rotate(45deg)",
        border: `1px solid ${rose}`,
        display: "inline-grid",
        placeItems: "center",
        flexShrink: 0,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <span style={{ transform: "rotate(-45deg)", color: rose, fontSize: sz * 0.46, display: "grid", placeItems: "center" }}>
        {Glyphs[k]}
      </span>
    </span>
  )

  const Flourish = (
    <svg viewBox="0 0 240 34" width="220" height="31" style={{ display: "block", margin: "0 auto" }}>
      <path d="M120 17 C100 17 98 5 82 7 C70 8 70 20 82 19 C92 18 90 9 78 11" fill="none" stroke={rose} strokeWidth="1" />
      <path d="M120 17 C140 17 142 5 158 7 C170 8 170 20 158 19 C148 18 150 9 162 11" fill="none" stroke={rose} strokeWidth="1" />
      <circle cx="120" cy="17" r="3" fill={rose} />
      <path d="M40 17h54M146 17h54" stroke={rose} strokeWidth="0.7" opacity="0.5" />
      <circle cx="40" cy="17" r="1.6" fill={rose} />
      <circle cx="200" cy="17" r="1.6" fill={rose} />
    </svg>
  )

  const Sec = ({ k, children }: { k: GlyphKey; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 13, margin: "0 0 15px" }}>
      <Dia k={k} sz={26} />
      <span style={{ fontFamily: "inherit", fontSize: 19, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: roseHi }}>
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

  const firstLine = pd.firstName || "Your"
  const lastLine = pd.lastName || "Name"

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: `radial-gradient(ellipse 80% 50% at 50% -5%, ${accent}1a, transparent 60%), linear-gradient(170deg, ${bg}, ${bgDk})`,
        color: cream,
        fontFamily: "inherit",
        overflow: "hidden",
        padding: "40px 50px 36px",
        position: "relative",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 6 }}>{Flourish}</div>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 50, margin: 0, lineHeight: 0.98, color: "#fff" }}>
          {firstLine} <span style={{ fontStyle: "italic", color: rose }}>{lastLine}</span>
        </h1>
        {pd.jobTitle && (
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: rose, margin: "8px 0 12px" }}>
            {pd.jobTitle}
          </div>
        )}
        {contacts.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "5px 16px", fontSize: 10, color: mut }}>
            {contacts.map(([k, t], i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ color: rose, fontSize: 12 }}>{Glyphs[k]}</span>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {visible("summary") && summary && (
        <p style={{ textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 15, lineHeight: 1.55, color: "#d8c8d4", maxWidth: 520, margin: "20px auto 26px" }}>
          {summary}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 36 }}>
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <Sec k="work">{labelFor("workExperience")}</Sec>
              {workExperience.map((e) => (
                <div key={e.id} className="resume-entry" style={{ marginBottom: 15, breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontFamily: "inherit", fontSize: 19, fontWeight: 600, color: "#fff" }}>{e.jobTitle}</div>
                    <div style={{ fontSize: 9.5, color: rose, whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: rose, marginBottom: 4 }}>
                    {e.employer}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 10.5, color: "#c3b3c0", lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <Sec k="edu">{labelFor("education")}</Sec>
              {education.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontFamily: "inherit", fontSize: 16, color: "#fff" }}>
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
              <Sec k="star">{labelFor("skills")}</Sec>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px 6px", marginBottom: 22 }}>
                {skills.map((s) => (
                  <Gauge key={s.id} pct={SKILL_PCT[s.level] ?? 70} label={s.name} rose={rose} cream={cream} />
                ))}
              </div>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <Sec k="star">{labelFor("languages")}</Sec>
              {languages.map((l) => {
                const pct = LANG_PCT[l.level] ?? 60
                return (
                  <div key={l.id} style={{ marginBottom: 9 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, marginBottom: 4 }}>
                      <span>{l.name}</span>
                      <span style={{ color: rose }}>{langLbl(l.level)}</span>
                    </div>
                    <div style={{ height: 2, background: `${rose}2e`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: rose, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    </div>
                  </div>
                )
              })}
            </>
          )}
          {visible("certifications") && certifications.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <Sec k="edu">{labelFor("certifications")}</Sec>
              <div style={{ marginBottom: 22 }}>
                {certifications.map((c) => (
                  <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 8, breakInside: "avoid" }}>
                    <span style={{ color: rose, fontSize: 8, marginTop: 3, flexShrink: 0 }}>◆</span>
                    <div>
                      <div style={{ fontSize: 11, color: cream, fontWeight: 600, lineHeight: 1.3 }}>{c.name}</div>
                      {(c.issuer || c.date) && (
                        <div style={{ fontSize: 9.5, color: mut }}>
                          {c.issuer}{c.issuer && c.date ? " · " : ""}{c.date}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
