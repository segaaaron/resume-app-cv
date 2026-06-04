"use client"

/**
 * Caméo — fashion · symmetric accent.
 * Source: planillas-lujosas-Jun-29026/cv-showcase.jsx (ShowCameo).
 *
 * Palette: ink #2b2530, accent #bd7d86, cream #f7f1ec.
 * Centred circular portrait with double-ring, decorative ornament, italic accent surname.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'Georgia, "Cormorant Garamond", "Times New Roman", serif'
const SANS = 'var(--font-jakarta), "Geist", "Inter", system-ui, -apple-system, sans-serif'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

export default function ShowCameoTemplate() {
  const ink = "#2b2530"
  const cream = "#f7f1ec"
  const mute = "#9a8f93"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = config.colorScheme || "#bd7d86"
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

  const Deco = () => (
    <svg viewBox="0 0 60 12" width="80" height="16">
      <g stroke={accent} strokeWidth="1" fill="none">
        <path d="M0 6h22M38 6h22" />
        <path d="M30 1l4 5-4 5-4-5z" fill={accent} stroke="none" />
        <circle cx="24" cy="6" r="1.4" fill={accent} stroke="none" />
        <circle cx="36" cy="6" r="1.4" fill={accent} stroke="none" />
      </g>
    </svg>
  )

  const H = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 9px" }}>
      <span style={{ fontFamily: "inherit", fontSize: 10.5, letterSpacing: "0.24em", textTransform: "uppercase", color: accent, fontWeight: 600 }}>
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: `${accent}33` }} />
    </div>
  )

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: cream,
        color: ink,
        fontFamily: "inherit",
        overflow: "hidden",
        position: "relative",
        padding: "44px 56px",
        textAlign: "center",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <div style={{ padding: 6, borderRadius: "50%", background: cream, boxShadow: `0 0 0 1px ${accent}, 0 0 0 9px ${cream}, 0 0 0 10px ${accent}55`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          {config.photoUrl ? (
            <img
              src={config.photoUrl}
              alt=""
              style={{
                width: 116, height: 116, borderRadius: "50%", objectFit: "cover",
                objectPosition: `center ${config.photoPosition ?? 15}%`,
                display: "block",
              }}
            />
          ) : (
            <div style={{ width: 116, height: 116, borderRadius: "50%", background: `${accent}22`, display: "grid", placeItems: "center", color: accent, fontSize: 42, fontWeight: 600 }}>
              {initials}
            </div>
          )}
        </div>
      </div>

      <h1 style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 500, margin: 0, lineHeight: 1, letterSpacing: "0.01em" }}>
        {pd.firstName || "Your"} <span style={{ fontStyle: "italic", color: accent }}>{pd.lastName || "Name"}</span>
      </h1>
      {pd.jobTitle && (
        <div style={{ fontFamily: "inherit", fontSize: 11, letterSpacing: "0.4em", color: mute, margin: "10px 0 8px", textTransform: "uppercase" }}>
          {pd.jobTitle}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center" }}><Deco /></div>

      {visible("summary") && summary && (
        <p style={{ fontSize: 16, fontStyle: "italic", lineHeight: 1.5, color: "#5a4f55", margin: "14px auto 22px", maxWidth: 440 }}>
          {summary}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, textAlign: "left", marginTop: 6 }}>
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H>{labelFor("workExperience")}</H>
              {workExperience.map((e) => (
                <div key={e.id} className="resume-entry" style={{ marginBottom: 12, breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 17 }}>{e.jobTitle}</span>
                    <span style={{ fontFamily: "inherit", fontSize: 10, color: accent, whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </span>
                  </div>
                  <div style={{ fontFamily: "inherit", fontSize: 10, color: accent, fontWeight: 600, marginBottom: 2 }}>
                    {e.employer}{e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontFamily: "inherit", fontSize: 10.5, color: "#6a5f63", lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <H>{labelFor("education")}</H>
              {education.map((ed) => (
                <div key={ed.id} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 16 }}>
                    {ed.degree}{ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontFamily: "inherit", fontSize: 10, color: mute }}>
                    {ed.institution} · {ed.startDate}
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
              <H>{labelFor("skills")}</H>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {skills.map((s) => (
                  <span key={s.id} style={{ fontFamily: "inherit", fontSize: 10, color: accent, border: `1px solid ${accent}55`, padding: "4px 11px", borderRadius: 20, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <H>{labelFor("languages")}</H>
              {languages.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontFamily: "inherit", fontSize: 11, color: "#5a4f55", padding: "4px 0", borderBottom: `1px solid ${accent}22` }}>
                  <span>{l.name}</span>
                  <span style={{ color: accent }}>{langLbl(l.level)}</span>
                </div>
              ))}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <H>{labelFor("certifications")}</H>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {certifications.map((c) => (
                  <span key={c.id} style={{ fontFamily: "inherit", fontSize: 10, color: accent, border: `1px solid ${accent}55`, padding: "4px 11px", borderRadius: 20, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    {c.name}
                  </span>
                ))}
              </div>
            </>
          )}

          <H>{config.language === "en" ? "Contact" : "Contacto"}</H>
          <div style={{ fontFamily: "inherit", fontSize: 10.5, color: "#5a4f55", lineHeight: 1.9 }}>
            {pd.email}
            {pd.website ? <>{pd.email ? " · " : ""}{pd.website}</> : null}
            {(pd.email || pd.website) && <br />}
            {pd.phone}
            {pd.phone && place ? " · " : ""}
            {place}
          </div>
        </div>
      </div>
    </div>
  )
}
