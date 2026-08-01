"use client"

/**
 * Elite Aura — creative designer: gradient + sparkles + glassy cards + circular photo.
 * Source: planillas-lujosas-Jun-29026/cv-elite-b.jsx (EliteAura, 2026-06-04).
 *
 * Design fidelity:
 *  - Background: linear-gradient peach→pink→lilac.
 *  - Decorative: two outline/solid circles + Spark stars (SVG).
 *  - Glassy white cards (rgba 0.62 + blur) for Expertise / Contact / Experience / Education.
 *  - Pill (dark) section headers; skill bars use pink→purple gradient.
 *
 * Font mapping: Space Grotesk / Bricolage Grotesque → Jakarta SANS stack.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

const SKILL_PCT: Record<string, number> = {
  beginner: 55, intermediate: 70, advanced: 85, expert: 95,
}
const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

const Spark = ({ s = 18, c = "#fff", style }: { s?: number; c?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} style={style}>
    <path d="M12 0 C12.6 6.5 17.5 11.4 24 12 C17.5 12.6 12.6 17.5 12 24 C11.4 17.5 6.5 12.6 0 12 C6.5 11.4 11.4 6.5 12 0 Z" fill={c} />
  </svg>
)

export default function EliteAuraTemplate() {
  const dark = "#241b3a"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#7b5cff")
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

  const first = (pd.firstName || "Your").toUpperCase()
  const last = (pd.lastName || "Name").toUpperCase()
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"

  const Pill = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "inline-block", background: dark, color: "#fff", padding: "6px 18px", borderRadius: 30, fontSize: 12.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
      {children}
    </div>
  )

  const Card = ({ children, mb = 16 }: { children: React.ReactNode; mb?: number }) => (
    <div style={{ background: "rgba(255,255,255,0.62)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", borderRadius: 22, padding: "18px 20px", marginBottom: mb, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
      {children}
    </div>
  )

  // Inline icons
  const Mail = () => <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></svg>
  const Phone = () => <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.97.36 1.92.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.34 1.84.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
  const Globe = () => <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" /></svg>
  const Pin = () => <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>

  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.phone) contacts.push([<Phone key="p" />, pd.phone])
  if (pd.email) contacts.push([<Mail key="m" />, pd.email])
  if (pd.website) contacts.push([<Globe key="g" />, pd.website])
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contacts.push([<Pin key="i" />, place])

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: "linear-gradient(150deg,#fde3c4 0%,#f8c2d6 46%,#cdbcf2 100%)",
        color: dark,
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
        padding: "44px 46px",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* decorative */}
      <div style={{ position: "absolute", top: 120, left: -40, width: 150, height: 150, border: "2px solid rgba(255,255,255,0.6)", borderRadius: "50%", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      <div style={{ position: "absolute", bottom: 60, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.25)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
      <Spark s={26} c="#fff" style={{ position: "absolute", top: 38, right: 250 }} />
      <Spark s={16} c={dark} style={{ position: "absolute", top: 150, right: 60, opacity: 0.5 }} />
      <Spark s={20} c="#fff" style={{ position: "absolute", bottom: 120, left: 40 }} />

      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", gap: 24 }}>
        <div>
          <h1 style={{ fontFamily: "inherit", fontSize: 58, fontWeight: 800, margin: 0, lineHeight: 0.86, letterSpacing: "-0.03em", color: dark }}>
            {first}
            <br />
            {last}
          </h1>
          {pd.jobTitle && (
            <div style={{ display: "inline-block", marginTop: 14, background: "#fff", color: dark, padding: "7px 18px", borderRadius: 30, fontSize: 13.5, fontWeight: 700, letterSpacing: "0.12em", boxShadow: "0 6px 18px rgba(120,80,140,0.18)", textTransform: "uppercase", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              {pd.jobTitle}
            </div>
          )}
        </div>
        <div style={{ position: "relative", flexShrink: 0 }}>
          {config.photoUrl ? (
            <img
              src={config.photoUrl}
              alt=""
              style={{
                width: 150, height: 150, borderRadius: "50%", objectFit: "cover",
                objectPosition: `center ${config.photoPosition ?? 15}%`,
                boxShadow: "0 0 0 7px #fff, 0 14px 34px rgba(120,80,140,0.28)",
                WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
              }}
            />
          ) : (
            <div style={{ width: 150, height: 150, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", color: dark, fontSize: 54, fontWeight: 700, boxShadow: "0 0 0 7px #fff, 0 14px 34px rgba(120,80,140,0.28)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              {initials}
            </div>
          )}
          <span style={{ position: "absolute", top: -6, right: 8, width: 16, height: 16, borderRadius: "50%", background: "#ff7aa8", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
          <span style={{ position: "absolute", bottom: 10, left: -10, width: 12, height: 12, borderRadius: "50%", background: accent, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        </div>
      </div>

      {visible("summary") && summary && (
        <p style={{ marginTop: 24, fontSize: 13.5, lineHeight: 1.6, color: "#3a3050", maxWidth: 720, position: "relative" }}>
          {summary}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 26, marginTop: 30, position: "relative" }}>
        {/* LEFT */}
        <div>
          {visible("skills") && skills.length > 0 && (
            <Card>
              <Pill>{labelFor("skills")}</Pill>
              {skills.map((s) => {
                const v = skillPct(s.level)
                return (
                  <div key={s.id} style={{ marginBottom: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5, fontWeight: 600 }}>
                      <span>{s.name}</span>
                      <span style={{ color: accent }}>{v}%</span>
                    </div>
                    <div style={{ height: 7, background: "rgba(36,27,58,0.12)", borderRadius: 4, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                      <div style={{ width: `${v}%`, height: "100%", background: `linear-gradient(90deg,#ff7aa8,${accent})`, borderRadius: 4, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    </div>
                  </div>
                )
              })}
            </Card>
          )}

          {contacts.length > 0 && (
            <Card mb={0}>
              <Pill>{config.language === "en" ? "Contact" : "Contacto"}</Pill>
              <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 12.5 }}>
                {contacts.map(([I, t], i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 11, fontWeight: 500 }}>
                    <span style={{ width: 30, height: 30, borderRadius: "50%", background: dark, color: "#fff", display: "grid", placeItems: "center", fontSize: 13, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{I}</span>
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {visible("languages") && languages.length > 0 && (
            <Card mb={0}>
              <Pill>{labelFor("languages")}</Pill>
              {languages.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600 }}>{l.name}</span>
                  <span style={{ color: accent }}>{langLbl(l.level)}</span>
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* RIGHT */}
        <div>
          {visible("workExperience") && workExperience.length > 0 && (
            <Card>
              <Pill>{labelFor("workExperience")}</Pill>
              {workExperience.map((e) => (
                <div key={e.id} className="resume-entry" style={{ marginBottom: 13, paddingLeft: 16, position: "relative", breakInside: "avoid" }}>
                  <span style={{ position: "absolute", left: 0, top: 5, width: 9, height: 9, borderRadius: "50%", background: accent, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{e.jobTitle}</div>
                    <div style={{ fontSize: 11, color: accent, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#6a5d80", fontWeight: 600, marginBottom: 2 }}>
                    {e.employer}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 11.5, color: "#4a4458", lineHeight: 1.45 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </Card>
          )}

          {visible("education") && education.length > 0 && (
            <Card mb={0}>
              <Pill>{labelFor("education")}</Pill>
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 10, breakInside: "avoid" }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "#6a5d80" }}>
                    {ed.institution}
                    {" · "}
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
              {visible("certifications") && certifications.length > 0 && (
                <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
                  {certifications.map((c) => (
                    <span key={c.id} style={{ fontSize: 11, background: dark, color: "#fff", padding: "4px 11px", borderRadius: 20, fontWeight: 600, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                      {c.name}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
