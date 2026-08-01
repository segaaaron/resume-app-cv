"use client"

/**
 * Luxe Régent — Deep emerald executive · Trajectory bar chart.
 * Source: planillas-lujosas-Jun-29026/cv-luxe-2026.jsx (LuxeRegent, 2026-06-03).
 *
 * Design fidelity:
 *  - Emerald #173b32 hero band + champagne #cdb892 accents over paper #f5f4f0.
 *  - Concentric ring SVG behind name; LxBars trajectory chart top-right.
 *  - 4-cell metric band under hero (derived from store: years experience, etc.).
 *  - Two-column body: Experience left, Core Skills + Languages + Award card right.
 *
 * Font mapping:
 *  - "Archivo" → var(--font-jakarta) system sans stack.
 *  - "Georgia" serif preserved for hero numerals + name.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-archivo), "Archivo", "Archivo", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'
const SERIF = 'Georgia, "Times New Roman", serif'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}
const SKILL_PCT: Record<string, number> = {
  beginner: 40, intermediate: 65, advanced: 85, expert: 96,
}

// Career trajectory bar chart (from source LxBars)
function LxBars({ color, base, w = 188, h = 80 }: { color: string; base: string; w?: number; h?: number }) {
  const data = [38, 50, 47, 66, 78, 92]
  const bw = (w - (data.length - 1) * 8) / data.length
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: "block", overflow: "visible" }}>
      <line x1="0" y1={h - 1} x2={w} y2={h - 1} stroke={base} strokeWidth="1" opacity="0.4" />
      {data.map((v, i) => {
        const bh = (v / 100) * (h - 8)
        return (
          <rect
            key={i}
            x={i * (bw + 8)}
            y={h - bh}
            width={bw}
            height={bh}
            rx="1.5"
            fill={color}
            opacity={0.42 + i * 0.1}
          />
        )
      })}
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
          fontWeight: 700,
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
const IcoAward = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" /><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
  </svg>
)

export default function LuxeRegentTemplate() {
  const green = "#173b32"
  const paper = "#f5f4f0"
  const ink = "#22332c"
  const slate = "#6e7a72"
  const line = "#e3e0d6"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#cdb892")
  const champ = accent
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, projects, certifications,
  } = data
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()
  const skillPct = (lvl: string) => SKILL_PCT[lvl] ?? 70

  const firstLine = pd.firstName || "Your"
  const lastLine = pd.lastName || "Name"

  // Derived stats: years (from work experience count, fallback labels)
  const yearsCount = workExperience.length
  const stats: Array<[string, string]> = [
    [`${yearsCount || 1}+`, config.language === "en" ? "Roles" : "Roles"],
    [`${education.length || 1}`, config.language === "en" ? "Studies" : "Estudios"],
    [`${skills.length}`, config.language === "en" ? "Skills" : "Skills"],
    [`${languages.length}`, config.language === "en" ? "Languages" : "Idiomas"],
  ]

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
        background: paper,
        color: ink,
        fontFamily: SANS,
        overflow: "hidden",
        position: "relative",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* HERO BAND */}
      <div
        style={{
          background: green,
          color: "#fff",
          padding: "42px 50px 30px",
          position: "relative",
          overflow: "hidden",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <svg
          viewBox="0 0 200 200"
          width="220"
          height="220"
          style={{ position: "absolute", top: -40, right: -30, opacity: 0.12 }}
        >
          <circle cx="100" cy="100" r="90" fill="none" stroke={champ} strokeWidth="1" />
          <circle cx="100" cy="100" r="60" fill="none" stroke={champ} strokeWidth="1" />
          <circle cx="100" cy="100" r="30" fill="none" stroke={champ} strokeWidth="1" />
        </svg>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center", position: "relative" }}>
          <div>
            {pd.jobTitle && (
              <div style={{ fontSize: 10.5, letterSpacing: "0.4em", color: champ, marginBottom: 12, textTransform: "uppercase" }}>
                {pd.jobTitle}
              </div>
            )}
            <h1
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: 48,
                margin: 0,
                lineHeight: 0.95,
                letterSpacing: "-0.01em",
              }}
            >
              {firstLine}<br />{lastLine}
            </h1>
            {contacts.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px 18px", marginTop: 16, fontSize: 11 }}>
                {contacts.map(([I, t], i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,0.85)" }}>
                    <span style={{ color: champ, fontSize: 12, display: "grid", placeItems: "center" }}>{I}</span>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ width: 200 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: champ, marginBottom: 8, textAlign: "right" }}>
              {config.language === "en" ? "CAREER TRAJECTORY" : "TRAYECTORIA"}
            </div>
            <LxBars color={champ} base="#fff" />
          </div>
        </div>
      </div>

      {/* METRIC BAND */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          background: green,
          borderTop: `1px solid ${champ}33`,
          padding: "0 50px 22px",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {stats.map(([n, l], i) => (
          <div
            key={i}
            style={{
              padding: "0 0 0 18px",
              borderLeft: i ? `1px solid ${champ}33` : "none",
              color: "#fff",
            }}
          >
            <div style={{ fontFamily: "inherit", fontSize: 27, fontWeight: 700, color: champ, lineHeight: 1 }}>{n}</div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* BODY */}
      <div style={{ padding: "26px 50px", display: "grid", gridTemplateColumns: "1fr 232px", gap: 38 }}>
        <div>
          {visible("summary") && summary && (
            <p style={{ fontSize: 12, lineHeight: 1.6, color: "#454f49", margin: "0 0 22px" }}>{summary}</p>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <LxHead color={green} line={line}>{labelFor("workExperience")}</LxHead>
              {workExperience.map((e, i, a) => (
                <div
                  key={e.id}
                  className="resume-entry"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 14,
                    paddingBottom: i < a.length - 1 ? 13 : 0,
                    marginBottom: i < a.length - 1 ? 13 : 0,
                    borderBottom: i < a.length - 1 ? `1px solid ${line}` : "none",
                    breakInside: "avoid",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: green }}>{e.jobTitle}</div>
                    <div style={{ fontSize: 11.5, color: "#9a7d3e", fontWeight: 600, marginBottom: 4 }}>
                      {e.employer}{e.city ? ` · ${e.city}` : ""}
                    </div>
                    {e.description && (
                      <div
                        className="resume-desc"
                        style={{ fontSize: 11, color: "#454f49", lineHeight: 1.5 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                      />
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: slate, whiteSpace: "nowrap", paddingTop: 3 }}>
                    {e.startDate}
                    {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <LxHead color={green} line={line}>{labelFor("education")}</LxHead>
              {education.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: green }}>
                    {ed.degree}{ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 11, color: slate }}>
                    {ed.institution}{ed.city ? `, ${ed.city}` : ""} · {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {visible("skills") && skills.length > 0 && (
            <>
              <LxHead color={green} line={line}>{labelFor("skills")}</LxHead>
              <div style={{ marginBottom: 22 }}>
                {skills.map((s) => {
                  const p = skillPct(s.level)
                  return (
                    <div key={s.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: ink, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                        <span style={{ color: "#9a7d3e" }}>{p}</span>
                      </div>
                      <div style={{ height: 4, background: "#e6e3d8", borderRadius: 3, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                        <div style={{ width: `${p}%`, height: "100%", background: green, borderRadius: 3, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <LxHead color={green} line={line}>{labelFor("languages")}</LxHead>
              <div style={{ marginBottom: 22 }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{l.name}</span>
                    <span style={{ color: slate }}>{langLbl(l.level)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <LxHead color={green} line={line}>{labelFor("certifications")}</LxHead>
              <div style={{ marginBottom: 22 }}>
                {certifications.map((c) => (
                  <div key={c.id} style={{ marginBottom: 9, breakInside: "avoid" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: green, lineHeight: 1.25 }}>{c.name}</div>
                    {c.issuer && <div style={{ fontSize: 10.5, color: "#9a7d3e", fontWeight: 600 }}>{c.issuer}</div>}
                    {c.date && <div style={{ fontSize: 10, color: slate }}>{c.date}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visible("projects") && projects.length > 0 && (
            <div
              style={{
                marginTop: 16,
                background: green,
                color: "#fff",
                borderRadius: 10,
                padding: "12px 14px",
                display: "flex",
                gap: 9,
                alignItems: "center",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              <span style={{ color: champ, fontSize: 15, display: "grid", placeItems: "center" }}><IcoAward /></span>
              <span style={{ fontSize: 10.5, fontWeight: 600 }}>
                {projects[0].name}{projects[0].role ? ` — ${projects[0].role}` : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
