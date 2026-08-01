"use client"

/**
 * Elite Cuvée — Chef / hospitality dark luxe menu (charcoal + gold).
 * Source: planillas-lujosas-Jun-29026/cv-elite-d.jsx (EliteCuvee, 2026-06-04).
 *
 * Design fidelity:
 *  - Palette: ink #16120c, gold #c39a4e, cream #f3ecdd, stone #9a8f78.
 *  - Two-column: serif editorial left + portrait rail right with gradient overlay.
 *  - NumSec uses Roman numerals (I, II, III) in gold.
 *  - MiniLabel = tracked gold uppercase mini label.
 *
 * Font mapping: Cormorant Garamond / Playfair → Georgia serif stack.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'
const SERIF = 'Georgia, "Times New Roman", serif'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]

export default function EliteCuveeTemplate() {
  const ink = "#16120c"
  const cream = "#f3ecdd"
  const stone = "#9a8f78"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const gold = designAccent(config.colorScheme, "#c39a4e")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const firstLine = pd.firstName || "Your"
  const lastLine = pd.lastName || "Name"
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"

  const NumSec = ({ n, label }: { n: string; label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "26px 0 16px" }}>
      <span style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: gold }}>{n}</span>
      <span style={{ fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#fff" }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: `${gold}40`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
    </div>
  )
  const MiniLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontFamily: "inherit", fontSize: 10.5, letterSpacing: "0.28em", textTransform: "uppercase", color: gold, marginBottom: 12, fontWeight: 600 }}>
      {children}
    </div>
  )

  // icons
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
      data-print-layout="sidebar-right"
      style={{
        width: "100%",
        minHeight: "297mm",
        display: "grid",
        gridTemplateColumns: "1fr 286px",
        background: ink,
        color: cream,
        fontFamily: "inherit",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* LEFT */}
      <div style={{ padding: "50px 44px 40px 50px", position: "relative" }}>
        {pd.jobTitle && (
          <div style={{ fontFamily: "inherit", fontSize: 10.5, letterSpacing: "0.44em", color: gold, marginBottom: 22, textTransform: "uppercase" }}>
            {pd.jobTitle}
          </div>
        )}
        <h1 style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 500, margin: 0, lineHeight: 0.9, color: "#fff" }}>
          {firstLine}
          <br />
          <span style={{ fontStyle: "italic" }}>{lastLine}</span>
        </h1>
        {visible("summary") && summary && (
          <p style={{ fontSize: 18, fontStyle: "italic", lineHeight: 1.5, color: "#d4cbb6", margin: "20px 0 8px", maxWidth: 430 }}>
            {summary}
          </p>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <NumSec n={ROMAN[0]} label={labelFor("workExperience")} />
            {workExperience.map((e) => (
              <div key={e.id} className="resume-entry" style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 13, breakInside: "avoid" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, color: "#fff", lineHeight: 1.1 }}>
                    {e.jobTitle}
                    <span style={{ color: gold, fontStyle: "italic", fontSize: 17 }}> · {e.employer}</span>
                  </div>
                  {e.description && (
                    <div
                      className="resume-desc"
                      style={{ fontFamily: "inherit", fontSize: 11, color: stone, lineHeight: 1.5, marginTop: 3 }}
                      dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                    />
                  )}
                </div>
                <div style={{ fontFamily: "inherit", fontSize: 11, color: gold, whiteSpace: "nowrap" }}>
                  {e.startDate}
                  {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                </div>
              </div>
            ))}
          </>
        )}

        {visible("education") && education.length > 0 && (
          <>
            <NumSec n={ROMAN[1]} label={labelFor("education")} />
            {education.map((ed) => (
              <div key={ed.id} className="resume-entry" style={{ marginBottom: 10, breakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <div style={{ fontSize: 18, color: "#fff" }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? " — " : ""}
                    {ed.fieldOfStudy && <span style={{ fontStyle: "italic" }}>{ed.fieldOfStudy}</span>}
                  </div>
                  <div style={{ fontFamily: "inherit", fontSize: 11, color: gold, whiteSpace: "nowrap" }}>
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
                <div style={{ fontFamily: "inherit", fontSize: 11, color: stone, marginTop: 4 }}>
                  {ed.institution}
                  {ed.city ? ` · ${ed.city}` : ""}
                </div>
              </div>
            ))}
          </>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <>
            <NumSec n={ROMAN[2]} label={labelFor("certifications")} />
            <div style={{ fontFamily: "inherit", display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11.5, color: "#d4cbb6" }}>
              {certifications.map((c) => (
                <span key={c.id} style={{ border: `1px solid ${gold}55`, padding: "4px 10px", borderRadius: 3 }}>{c.name}</span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* RIGHT rail */}
      <div style={{ borderLeft: `1px solid ${gold}33`, display: "flex", flexDirection: "column", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <div style={{ position: "relative", height: 300 }}>
          {config.photoUrl ? (
            <img
              src={config.photoUrl}
              alt=""
              style={{
                width: "100%", height: 300, objectFit: "cover", display: "block",
                objectPosition: `center ${config.photoPosition ?? 15}%`,
                filter: "grayscale(1) contrast(1.05) brightness(0.92)",
              }}
            />
          ) : (
            <div style={{ width: "100%", height: 300, background: "#1f1a13", display: "grid", placeItems: "center", color: `${gold}aa`, fontSize: 64, fontFamily: "inherit" }}>
              {initials}
            </div>
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(22,18,12,0.1),rgba(22,18,12,0.85))", pointerEvents: "none", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        </div>
        <div style={{ padding: "26px 28px" }}>
          {contacts.length > 0 && (
            <>
              <MiniLabel>{config.language === "en" ? "Kitchen" : "Contacto"}</MiniLabel>
              <div style={{ fontFamily: "inherit", display: "flex", flexDirection: "column", gap: 11, fontSize: 11.5, color: "#d4cbb6", marginBottom: 24 }}>
                {contacts.map(([I, t], i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: gold, fontSize: 13, width: 15, display: "grid", placeItems: "center" }}>{I}</span>
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}

          {visible("skills") && skills.length > 0 && (
            <>
              <MiniLabel>{labelFor("skills")}</MiniLabel>
              <div style={{ fontFamily: "inherit" }}>
                {skills.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, color: "#d4cbb6", padding: "7px 0", borderBottom: i < skills.length - 1 ? `1px solid ${gold}1f` : "none" }}>
                    <span style={{ width: 4, height: 4, background: gold, transform: "rotate(45deg)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    {s.name}
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <MiniLabel>{labelFor("languages")}</MiniLabel>
              <div style={{ fontFamily: "inherit" }}>
                {languages.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#d4cbb6", padding: "5px 0" }}>
                    <span>{l.name}</span>
                    <span style={{ color: gold }}>{langLbl(l.level)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
