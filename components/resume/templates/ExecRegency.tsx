"use client"

/**
 * Exec Regency — Executive · Banded Editorial.
 * Source: planillas-lujosas-Jun-29026/cv-exec-a.jsx (ExecRegency, 2026-06-03).
 *
 * Design fidelity:
 *  - Exact palette: bg #161410, gold #caa24c, cream #ece5d4, mut #8b8472.
 *  - Top gold rule + secondary thin rule, banded header with serif name.
 *  - Italic serif summary, single column with 3-col core competencies.
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


const IcoMail = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5.5" width="18" height="13" rx="1" /><path d="m3 7 9 6 9-6" />
  </svg>
)
const IcoPhone = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z" />
  </svg>
)
const IcoPin = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="2.4" />
  </svg>
)
const IcoChart = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" /><path d="M7 15l3-4 3 3 4-7" />
  </svg>
)
const IcoBulb = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 2 2 2 4h4c0-2 1-3 2-4a6 6 0 0 0-4-10z" />
  </svg>
)
const IcoShield = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
  </svg>
)
const IcoMedal = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="14" r="6" /><path d="M8.5 8 6 2h12l-2.5 6" />
  </svg>
)

export default function ExecRegencyTemplate() {
  const bg = "#ffffff"
  const cream = "#15171c"
  const mut = "#5a6070"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#caa24c")
  const gold = accent
  const line = `${accent}38`
  const data = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, certifications, projects } = data
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"

  const SectionHead = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 11, margin: "0 0 14px" }}>
      <span style={{ color: gold, fontSize: 14, display: "grid", placeItems: "center" }}>{icon}</span>
      <span style={{ fontFamily: "inherit", fontSize: 14, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: cream }}>
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
        color: cream,
        fontFamily: "inherit",
        overflow: "hidden",
        position: "relative",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Banded header */}
      <div
        style={{
          borderTop: `2px solid ${gold}`,
          borderBottom: `1px solid ${line}`,
          padding: "34px 50px 26px",
          position: "relative",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <div style={{ position: "absolute", top: 6, left: 50, right: 50, height: 1, background: line }} />
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 50,
            margin: 0,
            lineHeight: 0.96,
            color: "#15171c",
            letterSpacing: "0.01em",
          }}
        >
          {fullName}
        </h1>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12, flexWrap: "wrap", gap: 10 }}>
          {pd.jobTitle && (
            <div style={{ fontSize: 12.5, letterSpacing: "0.34em", textTransform: "uppercase", color: gold }}>
              {pd.jobTitle}
            </div>
          )}
          {contacts.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 10, color: mut }}>
              {contacts.map(([I, t], i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: gold, fontSize: 11, display: "grid", placeItems: "center" }}>{I}</span>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "26px 50px 34px" }}>
        {visible("summary") && summary && (
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 15,
              lineHeight: 1.55,
              color: "#7a766b",
              margin: "0 auto 26px",
              textAlign: "center",
              maxWidth: 600,
            }}
          >
            {summary}
          </p>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <SectionHead icon={<IcoChart />}>{labelFor("workExperience")}</SectionHead>
            <div style={{ marginBottom: 28 }}>
              {workExperience.map((e, i) => {
                const last = i === workExperience.length - 1
                return (
                  <div
                    key={e.id}
                    className="resume-entry"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 14,
                      paddingBottom: last ? 0 : 13,
                      marginBottom: last ? 0 : 13,
                      borderBottom: last ? "none" : `1px solid ${line}`,
                      breakInside: "avoid",
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: "inherit", fontSize: 16.5, fontWeight: 600, color: "#15171c" }}>{e.jobTitle}</div>
                      <div style={{ fontSize: 11, color: gold, marginBottom: 4 }}>
                        {e.employer}
                        {e.city ? ` · ${e.city}` : ""}
                      </div>
                      {e.description && (
                        <div
                          className="resume-desc"
                          style={{ fontSize: 10.5, color: "#777369", lineHeight: 1.5 }}
                          dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                        />
                      )}
                    </div>
                    <div style={{ fontSize: 9.5, color: gold, whiteSpace: "nowrap", paddingTop: 4 }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {visible("skills") && skills.length > 0 && (
          <>
            <SectionHead icon={<IcoBulb />}>{labelFor("skills")}</SectionHead>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px 18px",
                marginBottom: 28,
              }}
            >
              {skills.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: cream }}>
                  <span style={{ width: 5, height: 5, background: gold, transform: "rotate(45deg)", flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  {s.name}
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 34 }}>
          {visible("education") && education.length > 0 && (
            <div>
              <SectionHead icon={<IcoShield />}>{labelFor("education")}</SectionHead>
              {education.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 10, breakInside: "avoid" }}>
                  <div style={{ fontFamily: "inherit", fontSize: 14.5, color: "#15171c", lineHeight: 1.2 }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 10.5, color: mut }}>
                    {ed.institution}
                    {ed.city ? `, ${ed.city}` : ""}
                    {" · "}
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}

          {((visible("certifications") && certifications.length > 0) || (visible("projects") && projects.length > 0)) && (
            <div>
              <SectionHead icon={<IcoMedal />}>
                {visible("projects") && projects.length > 0
                  ? labelFor("projects")
                  : labelFor("certifications")}
              </SectionHead>
              <div style={{ fontSize: 10.5, color: "#78746a", lineHeight: 1.65 }}>
                {visible("projects") && projects.length > 0
                  ? projects.map((p) => (
                      <div key={p.id} style={{ display: "flex", gap: 8, marginBottom: 3 }}>
                        <span style={{ color: gold }}>✦</span>
                        <span>
                          <strong style={{ color: cream }}>{p.name}</strong>
                          {p.role ? ` — ${p.role}` : ""}
                        </span>
                      </div>
                    ))
                  : certifications.map((c) => (
                      <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 3 }}>
                        <span style={{ color: gold }}>✦</span>
                        <span>
                          <strong style={{ color: cream }}>{c.name}</strong>
                          {c.issuer ? ` — ${c.issuer}` : ""}
                        </span>
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
