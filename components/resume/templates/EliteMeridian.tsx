"use client"

/**
 * Elite Meridian — Doctor / clinical luxe (navy + teal).
 * Source: planillas-lujosas-Jun-29026/cv-elite-d.jsx (EliteMeridian, 2026-06-04).
 *
 * Design fidelity:
 *  - Palette: navy #15314f, teal #1f9e9e, mist #eef5f5, stone #7a8a90.
 *  - Header: navy band with decorative ECG-line SVG (teal stroke 0.35 opacity),
 *    rounded-rect photo (104×116) with white padded frame.
 *  - Body: mist callout (summary), timeline list with teal dots (mist halo),
 *    sidebar with competencies list + languages + award badge.
 *
 * Font mapping: Geist (source) → Jakarta SANS stack.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

export default function EliteMeridianTemplate() {
  const navy = "#15314f"
  const mist = "#eef5f5"
  const stone = "#7a8a90"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const teal = designAccent(config.colorScheme, "#1f9e9e")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"

  const NumSec = ({ n, label }: { n: string; label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 15px" }}>
      <span style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: teal }}>{n}</span>
      <span style={{ fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: navy }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: "#e3eaea", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
    </div>
  )
  const MiniLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontFamily: "inherit", fontSize: 10.5, letterSpacing: "0.28em", textTransform: "uppercase", color: teal, marginBottom: 12, fontWeight: 600 }}>
      {children}
    </div>
  )

  // icons
  const Mail = () => <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></svg>
  const Phone = () => <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.97.36 1.92.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.34 1.84.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
  const Pin = () => <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>
  const Globe = () => <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" /></svg>

  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.email) contacts.push([<Mail key="m" />, pd.email])
  if (pd.phone) contacts.push([<Phone key="p" />, pd.phone])
  if (pd.website) contacts.push([<Globe key="g" />, pd.website])
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contacts.push([<Pin key="i" />, place])

  return (
    <div
      data-print-layout="single-column"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: "#fff",
        color: "#22333a",
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* HEADER */}
      <div style={{ background: navy, color: "#fff", padding: "34px 46px 30px", position: "relative", overflow: "hidden", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <svg viewBox="0 0 300 40" width="300" height="40" style={{ position: "absolute", top: 24, right: 30, opacity: 0.35 }}>
          <path d="M0 20 H120 l8 -15 l9 28 l8 -19 l6 6 H300" fill="none" stroke={teal} strokeWidth="2" />
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 24, position: "relative" }}>
          <div style={{ padding: 4, borderRadius: 16, background: "rgba(255,255,255,0.1)", flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            {config.photoUrl ? (
              <img
                src={config.photoUrl}
                alt=""
                style={{
                  width: 104, height: 116, borderRadius: 12, objectFit: "cover", display: "block",
                  objectPosition: `center ${config.photoPosition ?? 15}%`,
                  WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                }}
              />
            ) : (
              <div style={{ width: 104, height: 116, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "grid", placeItems: "center", color: teal, fontSize: 38, fontWeight: 700 }}>
                {initials}
              </div>
            )}
          </div>
          <div>
            {pd.jobTitle && (
              <div style={{ fontSize: 11, letterSpacing: "0.32em", color: teal, marginBottom: 8, textTransform: "uppercase" }}>
                {pd.jobTitle}
              </div>
            )}
            <h1 style={{ fontSize: 40, fontWeight: 700, margin: 0, lineHeight: 0.98, letterSpacing: "-0.02em" }}>
              {fullName}
            </h1>
            {contacts.length > 0 && (
              <div style={{ display: "flex", gap: 18, marginTop: 12, fontSize: 12, flexWrap: "wrap" }}>
                {contacts.map(([I, t], i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,0.88)" }}>
                    <span style={{ color: teal, fontSize: 13 }}>{I}</span>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "26px 46px 32px", display: "grid", gridTemplateColumns: "1fr 236px", gap: 34 }}>
        {/* LEFT */}
        <div>
          {visible("summary") && summary && (
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "#3a4a50", background: mist, borderRadius: 12, padding: "14px 16px", margin: "0 0 22px", borderLeft: `3px solid ${teal}`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              {summary}
            </p>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <NumSec n="01" label={labelFor("workExperience")} />
              {workExperience.map((e) => (
                <div key={e.id} className="resume-entry" style={{ marginBottom: 15, paddingLeft: 18, borderLeft: `2px solid ${mist}`, position: "relative", breakInside: "avoid", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  <span style={{ position: "absolute", left: -6, top: 4, width: 10, height: 10, borderRadius: "50%", background: teal, boxShadow: `0 0 0 3px ${mist}`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: navy }}>{e.jobTitle}</div>
                    <div style={{ fontSize: 11, color: teal, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: stone, marginBottom: 4 }}>
                    {e.employer}
                    {e.city ? ` · ${e.city}` : ""}
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontSize: 12, color: "#3a4a50", lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
              ))}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <NumSec n="02" label={labelFor("education")} />
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: navy }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 12, color: stone }}>
                    {ed.institution}
                    {" · "}
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div>
          {visible("skills") && skills.length > 0 && (
            <>
              <MiniLabel>{labelFor("skills")}</MiniLabel>
              {skills.map((s, i) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#3a4a50", padding: "7px 0", borderBottom: i < skills.length - 1 ? "1px solid #eef2f2" : "none" }}>
                  <span style={{ color: teal, fontSize: 12 }}>✚</span>
                  {s.name}
                </div>
              ))}
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <MiniLabel>{labelFor("languages")}</MiniLabel>
              {languages.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600 }}>{l.name}</span>
                  <span style={{ color: stone }}>{langLbl(l.level)}</span>
                </div>
              ))}
            </div>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <MiniLabel>{labelFor("certifications")}</MiniLabel>
              {certifications.map((c) => (
                <div key={c.id} style={{ marginTop: 12, background: navy, color: "#fff", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 9, alignItems: "center", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  <span style={{ color: teal, fontSize: 16 }}>★</span>
                  <span style={{ fontSize: 11.5, fontWeight: 600 }}>{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
