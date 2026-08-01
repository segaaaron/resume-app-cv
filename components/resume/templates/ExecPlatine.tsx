"use client"

/**
 * Exec Platine — Executive · Black & Platinum Type.
 * Source: planillas-lujosas-Jun-29026/cv-exec-d.jsx (ExecPlatine, 2026-06-03).
 *
 * Design fidelity:
 *  - Exact palette: bg #0c0c0d, bone #ece9e2, plat #a9a9ad, mut #76767a, line rgba(169,169,173,0.2).
 *  - Brutalist Swiss-luxe typography: huge uppercase Archivo name, outline index numerals.
 *  - Compass mark icon (concentric ring + crosshair) top-right.
 *  - Mono utility caps for company/location/period.
 *  - A — / B — / C — alphabetic section indices instead of icons.
 *  - Print-safe: WebkitPrintColorAdjust on every coloured surface.
 *
 * Font mapping:
 *  - "Archivo" (display) → var(--font-jakarta) at heavy weight 800.
 *  - "Geist Mono" → MONO = '"Courier New", monospace'.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-archivo), "Archivo", "Inter", system-ui, -apple-system, sans-serif'
const MONO = '"Geist Mono", "JetBrains Mono", "Courier New", monospace'

export default function ExecPlatineTemplate() {
  const bg = "#0c0c0d"
  const bone = "#ece9e2"
  const mut = "#76767a"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#a9a9ad")
  const plat = accent
  const line = `${accent}33`
  const data = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, certifications } = data
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"

  const firstLine = (pd.firstName || "Your").toUpperCase()
  const lastLine = (pd.lastName || "Name").toUpperCase()

  const IndexNumeral = ({ n }: { n: string }) => (
    <span
      style={{
        fontFamily: "inherit",
        fontWeight: 800,
        fontSize: 46,
        lineHeight: 1,
        color: "transparent",
        WebkitTextStroke: `1px ${plat}`,
        letterSpacing: "-0.02em",
        display: "block",
      }}
    >
      {n}
    </span>
  )

  const CompassMark = (
    <svg viewBox="0 0 40 40" width="34" height="34">
      <circle cx="20" cy="20" r="18" fill="none" stroke={plat} strokeWidth="1" />
      <path d="M20 2v36M2 20h36" stroke={plat} strokeWidth="0.5" opacity="0.5" />
      <circle cx="20" cy="20" r="3" fill={bone} />
    </svg>
  )

  const SectionHead = ({ letter, label }: { letter: string; label: string }) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 18 }}>
      <span style={{ fontFamily: MONO, fontSize: 10, color: plat, letterSpacing: "0.2em" }}>{letter} —</span>
      <h2 style={{ fontFamily: "inherit", fontWeight: 800, fontSize: 18, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0, color: bone }}>
        {label}
      </h2>
      <span style={{ flex: 1, height: 1, background: line }} />
    </div>
  )

  const SubHead = ({ letter, label }: { letter: string; label: string }) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
      <span style={{ fontFamily: MONO, fontSize: 10, color: plat, letterSpacing: "0.2em" }}>{letter} —</span>
      <h2 style={{ fontFamily: "inherit", fontWeight: 800, fontSize: 15, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0, color: bone }}>
        {label}
      </h2>
    </div>
  )

  // Mono contact band
  const contactParts: string[] = []
  if (pd.email) contactParts.push(pd.email)
  if (pd.phone) contactParts.push(pd.phone)
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contactParts.push(place)
  if (pd.website) contactParts.push(pd.website)

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: bg,
        color: bone,
        fontFamily: SANS,
        overflow: "hidden",
        padding: "46px 52px 40px",
        position: "relative",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Masthead */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          {pd.jobTitle && (
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.3em", color: plat, marginBottom: 14 }}>
              {pd.jobTitle.toUpperCase()}
            </div>
          )}
          <h1
            style={{
              fontFamily: "inherit",
              fontWeight: 800,
              fontSize: 62,
              margin: 0,
              lineHeight: 0.85,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#fff",
            }}
          >
            {firstLine}
            <br />
            {lastLine}
          </h1>
        </div>
        {CompassMark}
      </div>

      {/* Contact rule */}
      {contactParts.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px 20px",
            fontFamily: MONO,
            fontSize: 10,
            color: mut,
            padding: "18px 0",
            borderTop: `1px solid ${line}`,
            borderBottom: `1px solid ${line}`,
            margin: "22px 0 26px",
          }}
        >
          {contactParts.map((t, i) => (
            <span key={i} style={{ display: "flex", gap: 14 }}>
              {i > 0 && <span style={{ color: plat }}>·</span>}
              {t}
            </span>
          ))}
        </div>
      )}

      {visible("summary") && summary && (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#c7c4bc", margin: "0 0 30px", maxWidth: 540 }}>{summary}</p>
      )}

      {visible("workExperience") && workExperience.length > 0 && (
        <>
          <SectionHead letter="A" label={labelFor("workExperience")} />
          {workExperience.map((e, i) => {
            const last = i === workExperience.length - 1
            return (
              <div
                key={e.id}
                className="resume-entry"
                style={{
                  display: "grid",
                  gridTemplateColumns: "54px 1fr auto",
                  gap: 20,
                  alignItems: "start",
                  paddingBottom: last ? 0 : 16,
                  marginBottom: last ? 0 : 16,
                  borderBottom: last ? "none" : `1px solid ${line}`,
                  breakInside: "avoid",
                }}
              >
                <IndexNumeral n={String(i + 1).padStart(2, "0")} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: "#fff", letterSpacing: "-0.01em" }}>{e.jobTitle}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: plat, margin: "3px 0 6px" }}>
                    {(e.employer || "").toUpperCase()}
                    {e.city ? ` · ${e.city.toUpperCase()}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 11, color: "#b3b0a8", lineHeight: 1.55 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: mut, whiteSpace: "nowrap", paddingTop: 4 }}>
                  {e.startDate}
                  {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                </div>
              </div>
            )
          })}
        </>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, marginTop: 22 }}>
        {visible("skills") && skills.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <SubHead letter="B" label={labelFor("skills")} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {skills.map((s) => (
                <span
                  key={s.id}
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    color: bone,
                    border: `1px solid ${line}`,
                    padding: "5px 11px",
                  }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {visible("education") && education.length > 0 && (
          <div>
            <SubHead letter="C" label={labelFor("education")} />
            {education.map((ed) => (
              <div key={ed.id} style={{ marginBottom: 10, breakInside: "avoid" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
                  {ed.degree}
                  {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: plat, marginTop: 3 }}>
                  {(ed.institution || "").toUpperCase()}
                  {ed.city ? ` · ${ed.city.toUpperCase()}` : ""}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: mut, marginTop: 2 }}>
                  {ed.startDate}
                  {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <SubHead letter="D" label={labelFor("certifications")} />
            {certifications.map((c) => (
              <div key={c.id} style={{ marginBottom: 10, breakInside: "avoid" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", lineHeight: 1.25 }}>{c.name}</div>
                {c.issuer && (
                  <div style={{ fontFamily: MONO, fontSize: 10, color: plat, marginTop: 3 }}>
                    {c.issuer.toUpperCase()}
                  </div>
                )}
                {c.date && (
                  <div style={{ fontFamily: MONO, fontSize: 10, color: mut, marginTop: 2 }}>
                    {c.date}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
