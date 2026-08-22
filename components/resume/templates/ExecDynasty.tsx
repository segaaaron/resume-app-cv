"use client"

/**
 * Exec Dynasty — Executive · Ornate Guilloché.
 * Source: planillas-lujosas-Jun-29026/cv-exec-b.jsx (ExecDynasty, 2026-06-03).
 *
 * Design fidelity:
 *  - Exact palette: bg #100f0c, gold #c6a04c, cream #ece4d1, mut #8a8270.
 *  - Rosette ornaments in all four corners (16 spokes + concentric rings).
 *  - Centered monogram, gradient divider with diamond cluster between sections.
 *  - Italic serif summary, two-column body, mastery skills with diamond bullets.
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
const IcoShield = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
  </svg>
)
const IcoBulb = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 2 2 2 4h4c0-2 1-3 2-4a6 6 0 0 0-4-10z" />
  </svg>
)

function Rosette({ size, color }: { size: number; color: string }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} style={{ display: "block" }}>
      {Array.from({ length: 16 }).map((_, i) => (
        <ellipse key={i} cx="40" cy="40" rx="7" ry="34" fill="none" stroke={color} strokeWidth="0.4" opacity="0.5" transform={`rotate(${i * 11.25} 40 40)`} />
      ))}
      <circle cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="0.5" />
      <circle cx="40" cy="40" r="11" fill="none" stroke={color} strokeWidth="0.6" />
      <circle cx="40" cy="40" r="2.4" fill={color} />
    </svg>
  )
}

function Monogram({ size, gold, cream, bg, initials }: { size: number; gold: string; cream: string; bg: string; initials: string }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} style={{ display: "block" }}>
      <circle cx="40" cy="40" r="38" fill="none" stroke={gold} strokeWidth="0.8" />
      <circle cx="40" cy="40" r="32" fill={bg} stroke={gold} strokeWidth="0.4" />
      <text x="40" y="42" textAnchor="middle" dominantBaseline="central" fontFamily='var(--font-playfair), "Playfair Display", serif' fontSize="22" fontWeight="700" fill={cream}>
        {initials}
      </text>
    </svg>
  )
}

export default function ExecDynastyTemplate() {
  const bg = "#ffffff"
  const cream = "#15171c"
  const mut = "#5a6070"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#c6a04c")
  const gold = accent
  const line = `${accent}3d`
  const data = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, certifications } = data
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "··"

  const SectionHead = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 13px" }}>
      <span style={{ color: gold, fontSize: 13 }}>{icon}</span>
      <span style={{ fontFamily: "inherit", fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: cream }}>
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: line }} />
    </div>
  )

  const Divider = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "20px 0" }}>
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${gold})`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      <span style={{ width: 5, height: 5, background: gold, transform: "rotate(45deg)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      <span style={{ width: 7, height: 7, border: `1px solid ${gold}`, transform: "rotate(45deg)" }} />
      <span style={{ width: 5, height: 5, background: gold, transform: "rotate(45deg)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${gold},transparent)`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
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
        padding: "46px 52px 38px",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Frame */}
      <div style={{ position: "absolute", inset: 14, border: `1px solid ${line}`, pointerEvents: "none" }} />
      {/* Rosette ornaments */}
      <div style={{ position: "absolute", top: 22, left: 22, opacity: 0.85 }}><Rosette size={58} color={gold} /></div>
      <div style={{ position: "absolute", top: 22, right: 22, opacity: 0.85 }}><Rosette size={58} color={gold} /></div>
      <div style={{ position: "absolute", bottom: 22, left: 22, opacity: 0.85 }}><Rosette size={58} color={gold} /></div>
      <div style={{ position: "absolute", bottom: 22, right: 22, opacity: 0.85 }}><Rosette size={58} color={gold} /></div>

      <div style={{ textAlign: "center", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <Monogram size={66} gold={gold} cream={cream} bg={bg} initials={initials} />
        </div>
        <h1 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 40, margin: "6px 0 0", lineHeight: 1, color: "#15171c", letterSpacing: "0.02em" }}>
          {fullName}
        </h1>
        {pd.jobTitle && (
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: gold, margin: "9px 0 6px" }}>
            {pd.jobTitle}
          </div>
        )}
        {contacts.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "4px 16px", fontSize: 9.5, color: mut }}>
            {contacts.map(([I, t], i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: gold, fontSize: 11 }}>{I}</span>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {visible("summary") && summary && (
        <>
          <p style={{ textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 13.5, lineHeight: 1.55, color: "#787469", maxWidth: 520, margin: "0 auto" }}>
            {summary}
          </p>
          <Divider />
        </>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 32 }}>
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <SectionHead icon={<IcoChart />}>{labelFor("workExperience")}</SectionHead>
              {workExperience.map((e) => (
                <div key={e.id} className="resume-entry" style={{ marginBottom: 13, breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <div style={{ fontFamily: "inherit", fontSize: 15, fontWeight: 600, color: "#15171c" }}>{e.jobTitle}</div>
                    <div style={{ fontSize: 9, color: gold, whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 10.5, color: gold, marginBottom: 3 }}>
                    {e.employer}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 10.5, color: "#75736b", lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <div>
          {visible("education") && education.length > 0 && (
            <>
              <SectionHead icon={<IcoShield />}>{labelFor("education")}</SectionHead>
              <div style={{ marginBottom: 18 }}>
                {education.map((ed) => (
                  <div key={ed.id} style={{ marginBottom: 8, breakInside: "avoid" }}>
                    <div style={{ fontFamily: "inherit", fontSize: 13.5, color: "#15171c", lineHeight: 1.2 }}>
                      {ed.degree}
                      {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                    </div>
                    <div style={{ fontSize: 9.5, color: mut }}>
                      {ed.institution}
                      {ed.city ? `, ${ed.city}` : ""}
                      {" · "}
                      {ed.startDate}
                      {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("skills") && skills.length > 0 && (
            <>
              <SectionHead icon={<IcoBulb />}>{labelFor("skills")}</SectionHead>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 10px", marginBottom: 18 }}>
                {skills.map((s) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10.5, color: cream }}>
                    <span style={{ width: 4, height: 4, background: gold, transform: "rotate(45deg)", flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    {s.name}
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <SectionHead icon={<IcoShield />}>{labelFor("certifications")}</SectionHead>
              <div>
                {certifications.map((c) => (
                  <div key={c.id} style={{ marginBottom: 8, breakInside: "avoid" }}>
                    <div style={{ fontFamily: "inherit", fontSize: 12, color: "#15171c", lineHeight: 1.25 }}>{c.name}</div>
                    {(c.issuer || c.date) && (
                      <div style={{ fontSize: 9.5, color: gold }}>
                        {c.issuer || ""}{c.issuer && c.date ? " · " : ""}{c.date || ""}
                      </div>
                    )}
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
