"use client"

/**
 * Gazette (editorial2) — flyer with giant years.
 * Source: planillas-lujosas-Jun-29026/cv-premium.jsx (TplEditorial).
 *
 * Palette: ink #2b2823, accent #cdbfa6, paper #efe9dd.
 * Two columns: left rail (contact/edu/skills/langs) + right dark column (photo/name/about/work).
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'
const SCRIPT = '"Caveat", "Brush Script MT", cursive'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

function yrs(dateStr: string | undefined): [string, string] {
  const m = (dateStr || "").match(/\d{4}/)
  const s = m ? m[0] : "2020"
  return [s.slice(0, 2), s.slice(2)]
}

export default function TplGazetteTemplate() {
  const ink = "#2b2823"
  const paper = "#efe9dd"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#cdbfa6")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications,
  } = data

  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"
  const place = [pd.city, pd.country].filter(Boolean).join(", ")

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
  if (pd.phone) contacts.push([<Phone key="p" />, pd.phone])
  if (pd.email) contacts.push([<Mail key="m" />, pd.email])
  if (pd.website) contacts.push([<Globe key="g" />, pd.website])
  if (place) contacts.push([<Pin key="i" />, place])

  const VertHead = ({ label }: { label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: ink }}>{label}</span>
      <span style={{ flex: 1, borderTop: `1px dotted ${accent}` }} />
    </div>
  )

  return (
    <div
      data-print-layout="sidebar-right"
      style={{
        width: "100%",
        minHeight: "297mm",
        display: "grid",
        gridTemplateColumns: "1fr 300px",
        fontFamily: "inherit",
        background: paper,
        color: ink,
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* LEFT RAIL */}
      <div style={{ padding: "46px 36px 36px 44px" }}>
        {contacts.length > 0 && (
          <>
            <VertHead label={config.language === "en" ? "Contact" : "Contacto"} />
            <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 11.5, color: "#5a5347", marginBottom: 22 }}>
              {contacts.map(([I, t], i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ fontSize: 13 }}>{I}</span>{t}
                </span>
              ))}
            </div>
          </>
        )}

        {visible("education") && education.length > 0 && (
          <>
            <VertHead label={labelFor("education")} />
            {education.map((ed) => (
              <div key={ed.id} className="resume-entry" style={{ marginBottom: 14, breakInside: "avoid" }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 2 }}>
                  {ed.degree}{ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                </div>
                <div style={{ fontSize: 11.5, color: "#7a7263" }}>
                  {ed.institution}{ed.city ? `, ${ed.city}` : ""}
                  <br />
                  {ed.startDate}
                  {ed.currentlyStudying
                    ? ` — ${config.language === "en" ? "Present" : "Presente"}`
                    : ed.endDate ? ` — ${ed.endDate}` : ""}
                </div>
              </div>
            ))}
          </>
        )}

        {visible("skills") && skills.length > 0 && (
          <>
            <VertHead label={labelFor("skills")} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 }}>
              {skills.map((s) => (
                <span key={s.id} style={{ fontSize: 10.5, border: `1px solid ${accent}`, padding: "3px 9px", color: "#5a5347", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  {s.name}
                </span>
              ))}
            </div>
          </>
        )}

        {visible("languages") && languages.length > 0 && (
          <>
            <VertHead label={labelFor("languages")} />
            {languages.map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4, color: "#5a5347" }}>
                <span>{l.name}</span>
                <span style={{ color: "#9a917f" }}>{langLbl(l.level)}</span>
              </div>
            ))}
          </>
        )}

        <div style={{ marginTop: 34, fontFamily: SCRIPT, fontSize: 30, color: ink }}>{fullName}</div>
      </div>

      {/* RIGHT DARK COLUMN */}
      <div style={{ background: ink, color: paper, padding: "40px 30px", position: "relative", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          {config.photoUrl ? (
            <img
              src={config.photoUrl}
              alt=""
              style={{
                width: 200, height: 220, objectFit: "cover", borderRadius: 10,
                objectPosition: `center ${config.photoPosition ?? 15}%`,
                display: "block",
              }}
            />
          ) : (
            <div style={{ width: 200, height: 220, borderRadius: 10, background: "#3a352f", display: "grid", placeItems: "center", color: accent, fontSize: 56, fontWeight: 300 }}>
              {initials}
            </div>
          )}
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, textAlign: "center", letterSpacing: "0.02em", textTransform: "uppercase", lineHeight: 1, color: "#fff" }}>
          {fullName}
        </h1>
        {pd.jobTitle && (
          <div style={{ textAlign: "center", fontSize: 12, letterSpacing: "0.3em", color: accent, marginTop: 8, textTransform: "uppercase" }}>
            {pd.jobTitle}
          </div>
        )}

        {visible("summary") && summary && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 14px" }}>
              <span style={{ flex: 1, height: 1, background: accent, opacity: 0.5 }} />
              <span style={{ fontSize: 11, letterSpacing: "0.25em", color: accent }}>
                {labelFor("summary").toUpperCase()}
              </span>
              <span style={{ flex: 1, height: 1, background: accent, opacity: 0.5 }} />
            </div>
            <p style={{ fontSize: 11.5, lineHeight: 1.6, color: "#d8d0c1", margin: "0 0 22px", textAlign: "center" }}>
              {summary}
            </p>
          </>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 11, letterSpacing: "0.25em", color: accent, textTransform: "uppercase" }}>
                {labelFor("workExperience")}
              </span>
              <span style={{ flex: 1, borderTop: `1px dotted ${accent}` }} />
            </div>
            {workExperience.map((e) => {
              const [a, b] = yrs(e.startDate)
              return (
                <div key={e.id} className="resume-entry" style={{ display: "grid", gridTemplateColumns: "46px 1fr", gap: 12, marginBottom: 14, breakInside: "avoid" }}>
                  <div style={{ fontWeight: 800, lineHeight: 0.9, color: accent }}>
                    <div style={{ fontSize: 26 }}>{a}</div>
                    <div style={{ fontSize: 26 }}>{b}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: "#fff" }}>{e.jobTitle}</div>
                    <div style={{ fontSize: 10.5, color: accent, marginBottom: 3 }}>
                      {e.employer}{e.city ? ` · ${e.city}` : ""}
                    </div>
                    {e.description && (
                      <div
                        className="resume-desc"
                        style={{ fontSize: 10.5, color: "#c3bbab", lineHeight: 1.45 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 12px" }}>
              <span style={{ fontSize: 11, letterSpacing: "0.25em", color: accent, textTransform: "uppercase" }}>
                {labelFor("certifications")}
              </span>
              <span style={{ flex: 1, borderTop: `1px dotted ${accent}` }} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {certifications.map((c) => (
                <span key={c.id} style={{ fontSize: 10.5, border: `1px solid ${accent}55`, color: "#d8d0c1", padding: "3px 9px" }}>
                  {c.name}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
