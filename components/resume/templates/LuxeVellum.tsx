"use client"

/**
 * Luxe Vellum — Ivory editorial minimal · Guilloché rosette.
 * Source: planillas-lujosas-Jun-29026/cv-luxe-2026.jsx (LuxeVellum, 2026-06-03).
 *
 * Design fidelity:
 *  - Centered masthead with custom guilloché rosette (30 rotated ellipses + concentric rings).
 *  - Burgundy accent #8a4b3c on ivory #faf8f3 paper.
 *  - Diamond divider, italic serif summary, two-column body (Capabilities pills + Education).
 *  - Experience uses left-aligned period column (120px) + content column.
 *
 * Font mapping:
 *  - "Cormorant Garamond" / "DM Serif Display" → Georgia fallback (SERIF).
 *  - "Geist" body sans → var(--font-jakarta).
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'var(--font-playfair), "DM Serif Display", "Cormorant Garamond", Georgia, "Times New Roman", serif'
const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

// Guilloché rosette ornament (from source LxRosette)
function LxRosette({ size = 88, color }: { size?: number; color: string }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} style={{ display: "block", margin: "0 auto" }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <ellipse
          key={i}
          cx="60" cy="60" rx="11" ry="52"
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          opacity="0.55"
          transform={`rotate(${i * 12} 60 60)`}
        />
      ))}
      <circle cx="60" cy="60" r="46" fill="none" stroke={color} strokeWidth="0.7" />
      <circle cx="60" cy="60" r="18" fill="none" stroke={color} strokeWidth="0.8" />
      <circle cx="60" cy="60" r="3.4" fill={color} />
    </svg>
  )
}

function LxHead({ accent, line, children }: { accent: string; line: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 13px" }}>
      <span
        style={{
          fontFamily: "inherit",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          color: accent,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: line, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
    </div>
  )
}

function LxDivider({ accent, line }: { accent: string; line: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "24px 0 26px" }}>
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${line})` }} />
      <span
        style={{
          width: 6,
          height: 6,
          background: accent,
          transform: "rotate(45deg)",
          flexShrink: 0,
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      />
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${line},transparent)` }} />
    </div>
  )
}

export default function LuxeVellumTemplate() {
  const paper = "#faf8f3"
  const ink = "#211f1b"
  const soft = "#8a8478"
  const line = "#e6e1d6"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#8a4b3c")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, certifications,
  } = data
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"

  const firstLine = pd.firstName || "Your"
  const lastLine = pd.lastName || "Name"

  const contacts = [pd.email, pd.phone, [pd.city, pd.country].filter(Boolean).join(", "), pd.website].filter(Boolean) as string[]

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: paper,
        color: ink,
        fontFamily: "inherit",
        overflow: "hidden",
        padding: "48px 64px 42px",
        position: "relative",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* MASTHEAD */}
      <div style={{ textAlign: "center" }}>
        <LxRosette size={88} color={accent} />
        {pd.jobTitle && (
          <div
            style={{
              fontFamily: "inherit",
              fontSize: 10,
              letterSpacing: "0.46em",
              color: accent,
              margin: "14px 0 8px",
              paddingLeft: "0.5em",
              textTransform: "uppercase",
            }}
          >
            {pd.jobTitle}
          </div>
        )}
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: 56,
            margin: 0,
            lineHeight: 0.95,
            color: ink,
          }}
        >
          {firstLine} {lastLine}
        </h1>
        {contacts.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "6px 20px",
              marginTop: 14,
              fontFamily: "inherit",
              fontSize: 10.5,
              color: soft,
            }}
          >
            {contacts.map((t, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {i > 0 && (
                  <span
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: "50%",
                      background: accent,
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  />
                )}
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <LxDivider accent={accent} line={line} />

      {/* SUMMARY */}
      {visible("summary") && summary && (
        <p
          style={{
            textAlign: "center",
            fontSize: 17,
            fontStyle: "italic",
            lineHeight: 1.55,
            color: "#444039",
            maxWidth: 560,
            margin: "0 auto 30px",
          }}
        >
          {summary}
        </p>
      )}

      {/* EXPERIENCE */}
      {visible("workExperience") && workExperience.length > 0 && (
        <>
          <LxHead accent={accent} line={line}>{labelFor("workExperience")}</LxHead>
          {workExperience.map((e, i, a) => (
            <div
              key={e.id}
              className="resume-entry"
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: 20,
                paddingBottom: i < a.length - 1 ? 14 : 0,
                marginBottom: i < a.length - 1 ? 14 : 0,
                borderBottom: i < a.length - 1 ? `1px solid ${line}` : "none",
                breakInside: "avoid",
              }}
            >
              <div
                style={{
                  fontFamily: "inherit",
                  fontSize: 10,
                  color: accent,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  paddingTop: 5,
                }}
              >
                {e.startDate}
                {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
              </div>
              <div>
                <div style={{ fontFamily: "inherit", fontSize: 20, color: ink, lineHeight: 1.1 }}>{e.jobTitle}</div>
                <div style={{ fontStyle: "italic", fontSize: 15, color: accent, marginBottom: 5 }}>
                  {e.employer}{e.city ? ` · ${e.city}` : ""}
                </div>
                {e.description && (
                  <div
                    className="resume-desc"
                    style={{ fontFamily: "inherit", fontSize: 11, color: "#5a554c", lineHeight: 1.55 }}
                    dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                  />
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {/* BOTTOM TWO-COL */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 40, marginTop: 24 }}>
        {visible("skills") && skills.length > 0 && (
          <div>
            <LxHead accent={accent} line={line}>{labelFor("skills")}</LxHead>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {skills.map((s) => (
                <span
                  key={s.id}
                  style={{
                    fontFamily: "inherit",
                    fontSize: 10.5,
                    color: "#4a463e",
                    border: `1px solid ${line}`,
                    padding: "5px 12px",
                    borderRadius: 20,
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
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
            <LxHead accent={accent} line={line}>{labelFor("education")}</LxHead>
            {education.map((ed) => (
              <div key={ed.id} style={{ marginBottom: 8, breakInside: "avoid" }}>
                <div style={{ fontFamily: "inherit", fontSize: 17, color: ink, lineHeight: 1.15 }}>
                  {ed.degree}{ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                </div>
                <div style={{ fontFamily: "inherit", fontSize: 10.5, color: soft }}>
                  {ed.institution}{ed.city ? `, ${ed.city}` : ""}
                </div>
                <div style={{ fontFamily: "inherit", fontSize: 10, color: accent, marginTop: 2 }}>
                  {ed.startDate}
                  {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CERTIFICATIONS — fallback row if present */}
      {visible("certifications") && certifications.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <LxHead accent={accent} line={line}>{labelFor("certifications")}</LxHead>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", fontFamily: "inherit", fontSize: 10.5, color: "#4a463e" }}>
            {certifications.map((c) => (
              <span key={c.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: accent }}>✦</span>
                {c.name}{c.issuer ? ` — ${c.issuer}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
