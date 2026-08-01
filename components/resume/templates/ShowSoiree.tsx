"use client"

/**
 * Soirée — black & champagne art-deco.
 * Source: planillas-lujosas-Jun-29026/cv-showcase.jsx (ShowSoiree).
 *
 * Palette: black #0f0f10, accent #c8a45c, smoke #d8d4cb.
 * Two columns: dark left with deco fans + accent accent surname; right photo rail with grayscale portrait.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { SectionIcon } from "@/lib/resume/section-icons"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'Georgia, "Playfair Display", "Times New Roman", serif'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

export default function ShowSoireeTemplate() {
  const black = "#0f0f10"
  const smoke = "#d8d4cb"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#c8a45c")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"
  const place = [pd.city, pd.country].filter(Boolean).join(", ")

  const Fan = ({ style }: { style: React.CSSProperties }) => (
    <svg viewBox="0 0 40 20" width="60" height="30" style={{ position: "absolute", ...style }}>
      <g stroke={accent} strokeWidth="0.8" fill="none" opacity="0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M20 20 L${4 + i * 8} 2`} />
        ))}
        <path d="M2 20 H38" />
      </g>
    </svg>
  )

  const Mail = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" />
    </svg>
  )
  const Phone = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.97.36 1.92.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.34 1.84.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
  const Pin = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
  const Globe = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
    </svg>
  )

  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.email) contacts.push([<Mail key="m" />, pd.email])
  if (pd.phone) contacts.push([<Phone key="p" />, pd.phone])
  if (pd.website) contacts.push([<Globe key="g" />, pd.website])
  if (place) contacts.push([<Pin key="i" />, place])

  const SoH = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 13px" }}>
      <span style={{ fontSize: 11, letterSpacing: "0.26em", textTransform: "uppercase", color: accent, fontWeight: 600 }}>
        <SectionIcon sectionId={id} size={11} strokeWidth={2.25} style={{ display: "inline-block", verticalAlign: "-0.12em", marginRight: 5 }} />{children}
      </span>
      <span style={{ flex: 1, height: 1, background: `${accent}33` }} />
    </div>
  )
  const SoMini = ({ children, mt = 20 }: { children: React.ReactNode; mt?: number }) => (
    <div style={{ fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: accent, fontWeight: 600, margin: "0 0 11px", marginTop: mt }}>
      {children}
    </div>
  )

  return (
    <div
      data-print-layout="sidebar-right"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: black,
        color: smoke,
        fontFamily: "inherit",
        overflow: "hidden",
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr 262px",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <Fan style={{ top: 16, left: 16 }} />

      <div style={{ padding: "52px 40px 40px 48px", position: "relative" }}>
        {pd.jobTitle && (
          <div style={{ fontSize: 11, letterSpacing: "0.46em", color: accent, marginBottom: 16, textTransform: "uppercase" }}>
            {pd.jobTitle}
          </div>
        )}
        <h1 style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 600, margin: 0, lineHeight: 0.92, color: "#fff", letterSpacing: "0.01em" }}>
          {pd.firstName || "Your"}<br /><span style={{ color: accent }}>{pd.lastName || "Name"}</span>
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 22px" }}>
          <span style={{ width: 30, height: 1, background: accent, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
          <span style={{ fontSize: 10.5, letterSpacing: "0.2em", color: "#8a857c", textTransform: "uppercase" }}>
            {config.language === "en" ? "Curriculum Vitae" : "Currículum Vitae"}
          </span>
        </div>

        {visible("summary") && summary && (
          <p style={{ fontSize: 12.5, lineHeight: 1.65, color: "#b0aca3", margin: "0 0 26px", maxWidth: 380 }}>{summary}</p>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <SoH id="workExperience">{labelFor("workExperience")}</SoH>
            {workExperience.map((e) => (
              <div key={e.id} className="resume-entry" style={{ marginBottom: 13, breakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{e.jobTitle}</span>
                  <span style={{ fontSize: 10.5, color: accent, whiteSpace: "nowrap" }}>
                    {e.startDate}
                    {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: accent, marginBottom: 3 }}>
                  {e.employer}{e.city ? ` · ${e.city}` : ""}
                </div>
                {e.description && (
                  <div
                    className="resume-desc"
                    style={{ fontSize: 11.5, color: "#9a958c", lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                  />
                )}
              </div>
            ))}
          </>
        )}

        {visible("education") && education.length > 0 && (
          <>
            <SoH id="education">{labelFor("education")}</SoH>
            {education.map((ed) => (
              <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                <div style={{ fontSize: 14, color: "#fff" }}>
                  {ed.degree}{ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                </div>
                <div style={{ fontSize: 11, color: "#8a857c" }}>
                  {ed.institution} · {ed.startDate}
                  {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Right photo rail */}
      <div style={{ position: "relative", borderLeft: `1px solid ${accent}33` }}>
        {config.photoUrl ? (
          <img
            src={config.photoUrl}
            alt=""
            style={{
              width: 262, height: 300, objectFit: "cover",
              objectPosition: `center ${config.photoPosition ?? 15}%`,
              filter: "grayscale(1) contrast(1.1) brightness(0.85)",
              display: "block",
            }}
          />
        ) : (
          <div style={{ width: 262, height: 300, background: "#1a1a1c", display: "grid", placeItems: "center", color: accent, fontSize: 64, fontWeight: 300 }}>
            {initials}
          </div>
        )}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 300, background: "linear-gradient(180deg, rgba(15,15,16,0.2), rgba(15,15,16,0.92))", pointerEvents: "none" }} />

        <div style={{ padding: "0 26px", marginTop: -8, position: "relative" }}>
          {visible("skills") && skills.length > 0 && (
            <>
              <SoMini mt={0}>{labelFor("skills")}</SoMini>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 }}>
                {skills.map((s) => (
                  <span key={s.id} style={{ fontSize: 10, border: `1px solid ${accent}55`, color: accent, padding: "4px 9px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <SoMini>{labelFor("languages")}</SoMini>
              {languages.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#b0aca3", padding: "4px 0", borderBottom: `1px solid ${accent}1f` }}>
                  <span>{l.name}</span>
                  <span style={{ color: accent }}>{langLbl(l.level)}</span>
                </div>
              ))}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <SoMini>{labelFor("certifications")}</SoMini>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {certifications.map((c) => (
                  <span key={c.id} style={{ fontSize: 10, border: `1px solid ${accent}55`, color: accent, padding: "4px 9px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    {c.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {contacts.length > 0 && (
            <>
              <SoMini>{config.language === "en" ? "Contact" : "Contacto"}</SoMini>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 11, color: "#b0aca3" }}>
                {contacts.map(([I, t], i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <span style={{ color: accent, fontSize: 12 }}>{I}</span>{t}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <Fan style={{ bottom: 16, right: 16, transform: "rotate(180deg)" }} />
      </div>
    </div>
  )
}
