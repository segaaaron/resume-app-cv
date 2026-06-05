"use client"

/**
 * Exec Sovereign — Executive · Navy Rail & Grid.
 * Source: planillas-lujosas-Jun-29026/cv-exec-a.jsx (ExecSovereign, 2026-06-03).
 *
 * Design fidelity:
 *  - Exact palette: main #16161b, side #0e1622, gold #c6a256, cream #e8e6dd, mut #838aa0.
 *  - Navy left rail with circular photo frame, contact, skills grid, languages bars.
 *  - Charcoal main with profile band, timeline with diamond markers, education footer.
 *  - Print-safe: WebkitPrintColorAdjust on every coloured surface.
 *
 * Font mapping:
 *  - "Playfair Display" → var(--font-playfair) + Georgia fallback.
 *  - "Geist" → var(--font-jakarta) + system sans fallback.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"

const SERIF = 'var(--font-playfair), "Playfair Display", Georgia, "Times New Roman", serif'
const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}
const LANG_PCT: Record<string, number> = { a1: 20, a2: 35, b1: 55, b2: 70, c1: 85, c2: 95, native: 100 }

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
const IcoLink = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2" />
  </svg>
)
const IcoGlobe = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
  </svg>
)
const IcoBulb = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 2 2 2 4h4c0-2 1-3 2-4a6 6 0 0 0-4-10z" />
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

export default function ExecSovereignTemplate() {
  const main = "#16161b"
  const side = "#0e1622"
  const cream = "#e8e6dd"
  const mut = "#838aa0"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = config.colorScheme || "#c6a256"
  const gold = accent
  const line = `${accent}3d`
  const lineS = `${accent}47`
  const data = useTemplateSectionData()
  const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = data
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const present = config.language === "en" ? "Present" : "Presente"
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const firstLine = pd.firstName || "Your"
  const lastLine = pd.lastName || "Name"
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"

  const SideHead = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 12px" }}>
      <span style={{ color: gold, fontSize: 13 }}>{icon}</span>
      <span style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: cream }}>
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: lineS }} />
    </div>
  )
  const MainHead = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 14px" }}>
      <span style={{ color: gold, fontSize: 13 }}>{icon}</span>
      <span style={{ fontFamily: "inherit", fontSize: 13, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: cream }}>
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: line }} />
    </div>
  )

  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.email) contacts.push([<IcoMail key="m" />, pd.email])
  if (pd.phone) contacts.push([<IcoPhone key="p" />, pd.phone])
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contacts.push([<IcoPin key="i" />, place])
  if (pd.website) contacts.push([<IcoLink key="l" />, pd.website])

  return (
    <div
      data-print-layout="sidebar-left"
      style={{
        width: "100%",
        minHeight: "297mm",
        display: "grid",
        gridTemplateColumns: "268px 1fr",
        fontFamily: "inherit",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* LEFT — navy rail */}
      <div
        style={{
          background: side,
          color: cream,
          padding: "40px 28px",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <div style={{ padding: 5, border: `1px solid ${gold}`, borderRadius: "50%", width: "fit-content", margin: "0 auto 22px" }}>
          <div
            style={{
              width: 124,
              height: 124,
              borderRadius: "50%",
              overflow: "hidden",
              background: "#0a0f17",
              display: "grid",
              placeItems: "center",
            }}
          >
            {config.photoUrl ? (
              <img
                src={config.photoUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: `center ${config.photoPosition ?? 15}%`,
                  display: "block",
                }}
              />
            ) : (
              <span style={{ color: "rgba(232,230,221,0.55)", fontSize: 42, fontWeight: 300 }}>{initials}</span>
            )}
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 26, margin: 0, lineHeight: 1.05, color: "#fff" }}>
            {firstLine}
            <br />
            {lastLine}
          </h1>
          {pd.jobTitle && (
            <div style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: gold, marginTop: 8 }}>
              {pd.jobTitle}
            </div>
          )}
        </div>

        {contacts.length > 0 && (
          <>
            <SideHead icon={<IcoGlobe />}>{config.language === "en" ? "Contact" : "Contacto"}</SideHead>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 10.5, color: "#c2c4cf", marginBottom: 24 }}>
              {contacts.map(([I, t], i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span style={{ color: gold, fontSize: 13, width: 15, display: "grid", placeItems: "center", flexShrink: 0 }}>{I}</span>
                  {t}
                </span>
              ))}
            </div>
          </>
        )}

        {visible("skills") && skills.length > 0 && (
          <>
            <SideHead icon={<IcoBulb />}>{labelFor("skills")}</SideHead>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px 10px",
                marginBottom: 24,
              }}
            >
              {skills.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10.5, color: cream }}>
                  <span style={{ width: 4, height: 4, background: gold, transform: "rotate(45deg)", flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  {s.name}
                </div>
              ))}
            </div>
          </>
        )}

        {visible("languages") && languages.length > 0 && (
          <>
            <SideHead icon={<IcoGlobe />}>{labelFor("languages")}</SideHead>
            <div style={{ marginBottom: 24 }}>
              {languages.map((l) => {
                const pct = LANG_PCT[l.level] ?? 60
                return (
                  <div key={l.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
                      <span>{l.name}</span>
                      <span style={{ color: gold }}>{langLbl(l.level)}</span>
                    </div>
                    <div style={{ height: 2, background: "rgba(255,255,255,0.12)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: gold, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <SideHead icon={<IcoShield />}>{labelFor("certifications")}</SideHead>
            <div>
              {certifications.map((c) => (
                <div key={c.id} style={{ marginBottom: 10, breakInside: "avoid" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#fff", lineHeight: 1.25 }}>{c.name}</div>
                  {c.issuer && <div style={{ fontSize: 10, color: "#c2c4cf" }}>{c.issuer}</div>}
                  {c.date && <div style={{ fontSize: 9.5, color: gold, marginTop: 1 }}>{c.date}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MAIN — charcoal */}
      <div
        style={{
          background: main,
          color: cream,
          padding: "44px 40px",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {visible("summary") && summary && (
          <>
            <div style={{ fontFamily: "inherit", fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: 9 }}>
              {config.language === "en" ? "Profile" : "Perfil"}
            </div>
            <p style={{ fontSize: 11.5, lineHeight: 1.65, color: "#cbc5b4", margin: "0 0 26px" }}>{summary}</p>
          </>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <MainHead icon={<IcoChart />}>{labelFor("workExperience")}</MainHead>
            {workExperience.map((e) => (
              <div
                key={e.id}
                className="resume-entry"
                style={{
                  position: "relative",
                  paddingLeft: 20,
                  marginBottom: 18,
                  borderLeft: `1px solid ${line}`,
                  breakInside: "avoid",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: -5,
                    top: 4,
                    width: 9,
                    height: 9,
                    background: main,
                    border: `2px solid ${gold}`,
                    transform: "rotate(45deg)",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <div style={{ fontFamily: "inherit", fontSize: 16, fontWeight: 600, color: "#fff" }}>{e.jobTitle}</div>
                  <div style={{ fontSize: 9.5, color: gold, whiteSpace: "nowrap" }}>
                    {e.startDate}
                    {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: gold, marginBottom: 5 }}>
                  {e.employer}
                  {e.city ? ` · ${e.city}` : ""}
                </div>
                {e.description && (
                  <div
                    className="resume-desc"
                    style={{ fontSize: 10.5, color: "#b6b0a0", lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                  />
                )}
              </div>
            ))}
          </>
        )}

        {visible("education") && education.length > 0 && (
          <>
            <MainHead icon={<IcoShield />}>{labelFor("education")}</MainHead>
            {education.map((ed) => (
              <div key={ed.id} style={{ marginBottom: 8, breakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontFamily: "inherit", fontSize: 14.5, color: "#fff" }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 9.5, color: gold }}>
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
                <div style={{ fontSize: 10.5, color: mut }}>
                  {ed.institution}
                  {ed.city ? `, ${ed.city}` : ""}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
