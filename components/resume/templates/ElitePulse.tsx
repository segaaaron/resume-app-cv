"use client"

/**
 * Elite Pulse — bold marketing CV: gradient header band + timeline + skill bars.
 * Source: planillas-lujosas-Jun-29026/cv-elite-b.jsx (ElitePulse, 2026-06-04).
 *
 * Design fidelity:
 *  - Header: navy→indigo→violet gradient with magenta + cyan blur orbs.
 *  - Circular photo with white ring; magenta pill role badge; cyan icons.
 *  - Body: vertical timeline (magenta→cyan gradient line) + skill bars.
 *  - PuH = small section header with magenta swatch + uppercase.
 *
 * Font mapping: Space Grotesk / Bricolage Grotesque → Jakarta SANS stack.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-space-grotesk), "Space Grotesk", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

const SKILL_PCT: Record<string, number> = {
  beginner: 55, intermediate: 70, advanced: 85, expert: 95,
}
const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

export default function ElitePulseTemplate() {
  const c1 = "#15123a"
  const cy = "#22d3c5"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const mag = designAccent(config.colorScheme, "#ff3d68")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()
  const skillPct = (lvl: string) => SKILL_PCT[lvl] ?? 75

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"

  // icons
  const Mail = () => <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></svg>
  const Phone = () => <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.97.36 1.92.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.34 1.84.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
  const Globe = () => <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" /></svg>
  const Pin = () => <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>

  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.email) contacts.push([<Mail key="m" />, pd.email])
  if (pd.phone) contacts.push([<Phone key="p" />, pd.phone])
  if (pd.website) contacts.push([<Globe key="g" />, pd.website])
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contacts.push([<Pin key="i" />, place])

  const PuH = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 13.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: c1, margin: "20px 0 12px", display: "flex", alignItems: "center", gap: 9 }}>
      <span style={{ width: 18, height: 4, background: mag, borderRadius: 2, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      {children}
    </div>
  )

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: "#f6f7fb",
        color: "#1a1c2e",
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* header band */}
      <div
        style={{
          background: `linear-gradient(120deg,${c1} 0%,#2a1f6b 60%,#4a2a8a 100%)`,
          color: "#fff",
          padding: "34px 46px 30px",
          position: "relative",
          overflow: "hidden",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <div style={{ position: "absolute", top: -60, right: -30, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,61,104,0.35)", filter: "blur(8px)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        <div style={{ position: "absolute", bottom: -70, right: 120, width: 150, height: 150, borderRadius: "50%", background: "rgba(34,211,197,0.3)", filter: "blur(6px)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 26, position: "relative" }}>
          {config.photoUrl ? (
            <img
              src={config.photoUrl}
              alt=""
              style={{
                width: 128, height: 128, borderRadius: "50%", objectFit: "cover",
                objectPosition: `center ${config.photoPosition ?? 15}%`,
                boxShadow: "0 0 0 5px rgba(255,255,255,0.25)",
                flexShrink: 0,
                WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
              }}
            />
          ) : (
            <div style={{ width: 128, height: 128, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 48, fontWeight: 700, boxShadow: "0 0 0 5px rgba(255,255,255,0.25)", flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              {initials}
            </div>
          )}
          <div>
            <h1 style={{ fontFamily: "inherit", fontSize: 50, fontWeight: 800, margin: 0, lineHeight: 0.9, letterSpacing: "-0.03em" }}>
              {fullName}
            </h1>
            {pd.jobTitle && (
              <div style={{ display: "inline-flex", gap: 8, marginTop: 12, alignItems: "center" }}>
                <span style={{ background: mag, padding: "5px 14px", borderRadius: 6, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  {pd.jobTitle}
                </span>
              </div>
            )}
            {contacts.length > 0 && (
              <div style={{ display: "flex", gap: 18, marginTop: 14, fontSize: 12, flexWrap: "wrap" }}>
                {contacts.map(([I, t], i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,0.9)" }}>
                    <span style={{ color: cy, fontSize: 14 }}>{I}</span>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 46px 32px", display: "grid", gridTemplateColumns: "1fr 250px", gap: 32 }}>
        {/* LEFT */}
        <div>
          {visible("summary") && summary && (
            <>
              <PuH>{config.language === "en" ? "Summary" : "Resumen"}</PuH>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "#3a3850", margin: 0 }}>{summary}</p>
            </>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <PuH>{labelFor("workExperience")}</PuH>
              <div style={{ position: "relative", paddingLeft: 24 }}>
                <span style={{ position: "absolute", left: 7, top: 4, bottom: 6, width: 2, background: `linear-gradient(${mag},${cy})`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                {workExperience.map((e) => (
                  <div key={e.id} className="resume-entry" style={{ position: "relative", marginBottom: 17, breakInside: "avoid" }}>
                    <span style={{ position: "absolute", left: -24, top: 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", border: `3px solid ${mag}`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: c1 }}>{e.jobTitle}</div>
                      <span style={{ fontSize: 11, background: "#efe9ff", color: "#5a2a9a", padding: "2px 10px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                        {e.startDate}
                        {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: mag, fontWeight: 700, marginBottom: 3 }}>
                      {e.employer}
                      {e.city ? ` · ${e.city}` : ""}
                    </div>
                    {e.description && (
                      <div
                        className="resume-desc"
                        style={{ fontSize: 12, color: "#50526a", lineHeight: 1.5 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <PuH>{labelFor("education")}</PuH>
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: c1 }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "#8a8ca0" }}>
                    {ed.institution}
                    {" · "}
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* RIGHT */}
        <div>
          {visible("skills") && skills.length > 0 && (
            <>
              <PuH>{labelFor("skills")}</PuH>
              {skills.map((s) => {
                const v = skillPct(s.level)
                return (
                  <div key={s.id} style={{ marginBottom: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5, fontWeight: 600 }}>
                      <span>{s.name}</span>
                      <span style={{ color: mag }}>{v}%</span>
                    </div>
                    <div style={{ height: 7, background: "#e7e4f2", borderRadius: 4, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                      <div style={{ width: `${v}%`, height: "100%", background: `linear-gradient(90deg,${mag},${cy})`, borderRadius: 4, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <PuH>{labelFor("certifications")}</PuH>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {certifications.map((c) => (
                  <span key={c.id} style={{ fontSize: 11, background: "#fff", border: "1px solid #e0ddf0", color: c1, padding: "5px 11px", borderRadius: 7, fontWeight: 600, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    {c.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <PuH>{labelFor("languages")}</PuH>
              {languages.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{l.name}</span>
                  <span style={{ color: "#8a8ca0" }}>{langLbl(l.level)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
