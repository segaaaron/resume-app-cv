"use client"

/**
 * Exec Porcelain — Executive · Ivory & Champagne Wave.
 * Source: planillas-lujosas-Jun-29026/cv-exec-c.jsx (ExecPorcelain, 2026-06-03).
 *
 * Design fidelity:
 *  - Exact palette: bg #f3efe7, ink #1b1a16, champagne #b08d4f, mut #8d8678, line #ddd6c8.
 *  - Ultra-thin monoline icon set (strokeWidth 1) replicated 1:1.
 *  - Signature guilloché wave band built procedurally (3 sine paths, gold/champagne).
 *  - Centered masthead → cursive italic summary → Experience timeline → Edu + Lang grid.
 *
 * Font mapping (Q3):
 *  - "Cormorant Garamond" / "Playfair" (display serif) → var(--font-playfair) + Georgia fallback.
 *  - "Geist" (body sans) → var(--font-jakarta) + system sans fallback.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'var(--font-playfair), "Cormorant Garamond", "Playfair Display", Georgia, "Times New Roman", serif'
const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

// ─── Ultra-thin monoline icons (strokeWidth 1) — exact source set ─────────────
const IcoWork = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="13" /><path d="M8 7V5h8v2M3 12h18" />
  </svg>
)
const IcoEdu = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8l9-4 9 4-9 4-9-4z" /><path d="M7 10.5V16c2.6 1.8 7.4 1.8 10 0v-5.5" />
  </svg>
)
const IcoSkill = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l3 5-9 13L3 8z" /><path d="M3 8h18M9 3l3 5 3-5M12 21 9 8M12 21l3-13" />
  </svg>
)
const IcoLang = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
  </svg>
)
const IcoMail = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5.5" width="18" height="13" /><path d="m3 7 9 6 9-6" />
  </svg>
)
const IcoPhone = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z" />
  </svg>
)
const IcoPin = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="2.4" />
  </svg>
)
const IcoCert = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" /><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
  </svg>
)

// Signature guilloché wave band — 3 sine paths layered at different phase/opacity.
// Reproduces source `wave()` factory exactly (amp=7, period 1/34, 3 layers).
function GuillocheWave({ champ, width = 520, height = 22 }: { champ: string; width?: number; height?: number }) {
  const make = (amp: number, phase: number, sw: number, op: number) => {
    let d = ""
    for (let x = 0; x <= width; x += 3) {
      const y = height / 2 + amp * Math.sin(x / 34 + phase)
      d += (x === 0 ? "M" : "L") + x + " " + y.toFixed(1) + " "
    }
    return <path d={d} fill="none" stroke={champ} strokeWidth={sw} opacity={op} />
  }
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      {make(7, 0, 0.8, 0.95)}
      {make(7, 1.1, 0.6, 0.6)}
      {make(7, 2.2, 0.5, 0.4)}
    </svg>
  )
}

export default function ExecPorcelainTemplate() {
  const bg = "#f3efe7"
  const ink = "#1b1a16"
  const mut = "#8d8678"
  const line = "#ddd6c8"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = config.colorScheme || "#b08d4f"
  const champ = accent
  const data = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, languages, skills, certifications } = data
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"

  const SectionHead = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 11, margin: "0 0 14px" }}>
      <span style={{ color: champ, fontSize: 17, display: "grid", placeItems: "center" }}>{icon}</span>
      <span
        style={{
          fontFamily: "inherit",
          fontSize: 21,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: ink,
        }}
      >
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: line, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
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
        color: ink,
        fontFamily: "inherit",
        overflow: "hidden",
        padding: "52px 60px 44px",
        position: "relative",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* MASTHEAD */}
      <div style={{ textAlign: "center" }}>
        {pd.jobTitle && (
          <div
            style={{
              fontSize: 10.5,
              letterSpacing: "0.55em",
              color: champ,
              marginBottom: 16,
              paddingLeft: "0.55em",
              textTransform: "uppercase",
            }}
          >
            {pd.jobTitle}
          </div>
        )}
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 500,
            fontSize: 64,
            margin: 0,
            lineHeight: 0.95,
            letterSpacing: "0.02em",
            color: ink,
          }}
        >
          {fullName}
        </h1>
        <div style={{ maxWidth: 340, margin: "18px auto 0" }}>
          <GuillocheWave champ={champ} />
        </div>
        {contacts.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "6px 24px",
              marginTop: 16,
              fontSize: 11,
              color: mut,
            }}
          >
            {contacts.map(([I, t], i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: champ, fontSize: 13, display: "grid", placeItems: "center" }}>{I}</span>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ITALIC SUMMARY (Cormorant) */}
      {visible("summary") && summary && (
        <p
          style={{
            textAlign: "center",
            fontFamily: SERIF,
            fontSize: 18,
            fontStyle: "italic",
            lineHeight: 1.5,
            color: "#46423a",
            maxWidth: 540,
            margin: "30px auto 34px",
          }}
        >
          {summary}
        </p>
      )}

      {/* EXPERIENCE */}
      {visible("workExperience") && workExperience.length > 0 && (
        <>
          <SectionHead icon={<IcoWork />}>{labelFor("workExperience")}</SectionHead>
          <div style={{ marginBottom: 30 }}>
            {workExperience.map((e, i) => {
              const last = i === workExperience.length - 1
              return (
                <div
                  key={e.id}
                  className="resume-entry"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "130px 1fr",
                    gap: 22,
                    paddingBottom: last ? 0 : 15,
                    marginBottom: last ? 0 : 15,
                    borderBottom: last ? "none" : `1px solid ${line}`,
                    breakInside: "avoid",
                  }}
                >
                  <div style={{ textAlign: "right", paddingTop: 3 }}>
                    <div style={{ fontSize: 10.5, color: champ, letterSpacing: "0.06em" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                    {e.city && <div style={{ fontSize: 10, color: mut, marginTop: 3 }}>{e.city}</div>}
                  </div>
                  <div>
                    <div style={{ fontFamily: "inherit", fontSize: 20, fontWeight: 600, lineHeight: 1.1, color: ink }}>
                      {e.jobTitle}
                    </div>
                    <div style={{ fontSize: 11, color: champ, letterSpacing: "0.04em", marginBottom: 5 }}>
                      {e.employer}
                    </div>
                    {e.description && (
                      <div
                        className="resume-desc"
                        style={{ fontSize: 11, color: "#57534a", lineHeight: 1.55 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* EDU + LANG (or EDU + SKILLS if no langs) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44 }}>
        {visible("education") && education.length > 0 && (
          <div>
            <SectionHead icon={<IcoEdu />}>{labelFor("education")}</SectionHead>
            {education.map((ed) => (
              <div key={ed.id} style={{ marginBottom: 10, breakInside: "avoid" }}>
                <div style={{ fontFamily: "inherit", fontSize: 18, fontWeight: 600, lineHeight: 1.15, color: ink }}>
                  {ed.degree}
                  {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                </div>
                <div style={{ fontSize: 11, color: mut }}>
                  {ed.institution}
                  {ed.city ? `, ${ed.city}` : ""}
                </div>
                <div style={{ fontSize: 10.5, color: champ, marginTop: 2 }}>
                  {ed.startDate}
                  {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}

        {visible("languages") && languages.length > 0 ? (
          <div>
            <SectionHead icon={<IcoLang />}>{labelFor("languages")}</SectionHead>
            {languages.map((l) => (
              <div
                key={l.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11.5,
                  padding: "4px 0",
                  borderBottom: `1px solid ${line}`,
                }}
              >
                <span>{l.name}</span>
                <span style={{ color: champ, letterSpacing: "0.04em" }}>{langLbl(l.level)}</span>
              </div>
            ))}
          </div>
        ) : visible("skills") && skills.length > 0 ? (
          <div>
            <SectionHead icon={<IcoSkill />}>{labelFor("skills")}</SectionHead>
            {skills.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11.5,
                  padding: "4px 0",
                  borderBottom: `1px solid ${line}`,
                }}
              >
                <span>{s.name}</span>
                <span style={{ color: champ, letterSpacing: "0.04em", textTransform: "capitalize" }}>{s.level}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Optional certifications strip below grid */}
      {visible("certifications") && certifications.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <SectionHead icon={<IcoCert />}>{labelFor("certifications")}</SectionHead>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px" }}>
            {certifications.map((c) => (
              <span key={c.id} style={{ fontSize: 11, color: "#57534a" }}>
                <strong style={{ color: ink }}>{c.name}</strong>
                {c.issuer ? ` — ${c.issuer}` : ""}
                {c.date ? ` · ${c.date}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
