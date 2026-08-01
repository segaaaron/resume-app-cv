"use client"

/**
 * Elite Atlas — structured premium showpiece.
 * Source: planillas-lujosas-Jun-29026/cv-elite-c.jsx (EliteAtlas, 2026-06-03).
 *
 * Design fidelity:
 *  - Exact palette: ink #1c1b19, bone #f5f1e8, accent #c08433, stone #8a857a.
 *  - Numbered sections (01, 02, 03) with accent numerals and hairline divider.
 *  - Left charcoal panel hosts photo + Contact / Expertise / Tools / Languages.
 *  - Right bone panel hosts hero name, summary, Experience, Education, Awards.
 *  - Print-safe: WebkitPrintColorAdjust on every coloured surface.
 *
 * Font mapping (Q3):
 *  - "Space Grotesk" (source) → var(--font-jakarta) with system sans fallback.
 *  - "Archivo" (display headline) → same Jakarta stack; weight 700 preserved.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-space-grotesk), "Space Grotesk", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

export default function EliteAtlasTemplate() {
  const ink = "#1c1b19"
  const bone = "#f5f1e8"
  const stone = "#8a857a"
  const divider = "#dcd5c5"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#c08433")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"
  const firstLine = pd.firstName || "Your"
  const lastLine = pd.lastName || "Name"

  // Decorative section number + label + hairline rule
  const SectionRule = ({ n, label }: { n: string; label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 16px" }}>
      <span style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: accent, letterSpacing: "0.05em" }}>{n}</span>
      <span style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: ink }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: divider }} />
    </div>
  )
  const SideLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 10.5, letterSpacing: "0.28em", textTransform: "uppercase", color: accent, marginBottom: 13, fontWeight: 600 }}>
      {children}
    </div>
  )

  // Inline monoline icons (exact reproduction of source Ico set)
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
  const Award = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" /><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
    </svg>
  )

  // Contact pairs (drop empties to mirror "no inventar")
  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.email) contacts.push([<Mail key="m" />, pd.email])
  if (pd.phone) contacts.push([<Phone key="p" />, pd.phone])
  if (pd.website) contacts.push([<Globe key="g" />, pd.website])
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contacts.push([<Pin key="i" />, place])

  // Determine if templates expect photo (source has dedicated portrait slot).
  // Initials fallback when no photoUrl, in line with Apex.tsx style.
  const initials = [pd.firstName?.[0], pd.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "·"

  return (
    <div
      data-print-layout="sidebar-left"
      style={{
        width: "100%",
        minHeight: "297mm",
        display: "grid",
        gridTemplateColumns: "296px 1fr",
        fontFamily: "inherit",
        background: bone,
        color: ink,
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* LEFT — photo + meta on charcoal */}
      <div
        style={{
          background: ink,
          color: bone,
          display: "flex",
          flexDirection: "column",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* Portrait area with gradient + accent tag */}
        <div style={{ position: "relative", height: 318, flexShrink: 0, background: "#27241f" }}>
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
                filter: "grayscale(1) contrast(1.04) brightness(0.96)",
              }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "rgba(245,241,232,0.55)", fontSize: 64, fontWeight: 300, letterSpacing: "0.04em" }}>
              {initials}
            </div>
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(28,27,25,0) 55%, rgba(28,27,25,0.9) 100%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "absolute", left: 28, right: 28, bottom: 18 }}>
            <div style={{ width: 30, height: 3, background: accent, marginBottom: 10, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
            <div style={{ fontSize: 11, letterSpacing: "0.34em", textTransform: "uppercase", color: accent }}>
              {config.language === "en" ? "Portfolio 2026" : "Portafolio 2026"}
            </div>
          </div>
        </div>

        <div style={{ padding: "26px 28px 30px", flex: 1, display: "flex", flexDirection: "column" }}>
          {contacts.length > 0 && (
            <>
              <SideLabel>{config.language === "en" ? "Contact" : "Contacto"}</SideLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 26 }}>
                {contacts.map(([I, t], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, fontSize: 11.5, color: "rgba(245,241,232,0.82)" }}>
                    <span style={{ color: accent, fontSize: 14, width: 16, display: "grid", placeItems: "center" }}>{I}</span>
                    {t}
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("skills") && skills.length > 0 && (
            <>
              <SideLabel>{labelFor("skills")}</SideLabel>
              <div style={{ marginBottom: 26 }}>
                {skills.map((s, i) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      fontSize: 11.5,
                      color: "rgba(245,241,232,0.9)",
                      padding: "7px 0",
                      borderBottom: i < skills.length - 1 ? "1px solid rgba(245,241,232,0.1)" : "none",
                    }}
                  >
                    <span style={{ width: 4, height: 4, background: accent, borderRadius: "50%", flexShrink: 0, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                    {s.name}
                  </div>
                ))}
              </div>
            </>
          )}

          {visible("certifications") && certifications.length > 0 && (
            <>
              <SideLabel>{labelFor("certifications")}</SideLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 26 }}>
                {certifications.map((c) => (
                  <span
                    key={c.id}
                    style={{
                      fontSize: 10.5,
                      border: "1px solid rgba(245,241,232,0.22)",
                      color: "rgba(245,241,232,0.85)",
                      padding: "4px 10px",
                      borderRadius: 3,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <SideLabel>{labelFor("languages")}</SideLabel>
              {languages.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11.5,
                    padding: "5px 0",
                    color: "rgba(245,241,232,0.82)",
                  }}
                >
                  <span>{l.name}</span>
                  <span style={{ color: accent }}>{langLbl(l.level)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* RIGHT — content */}
      <div style={{ padding: "52px 50px 40px", position: "relative", background: bone }}>
        <div
          style={{
            position: "absolute",
            top: 50,
            right: 50,
            fontFamily: "inherit",
            fontSize: 11,
            letterSpacing: "0.2em",
            color: stone,
          }}
        >
          CV — 01
        </div>
        {pd.jobTitle && (
          <div style={{ fontSize: 12, letterSpacing: "0.4em", textTransform: "uppercase", color: accent, marginBottom: 16 }}>
            {pd.jobTitle}
          </div>
        )}
        <h1
          style={{
            fontFamily: "inherit",
            fontSize: 56,
            fontWeight: 300,
            margin: 0,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            color: ink,
          }}
        >
          {firstLine}
          <br />
          <span style={{ fontWeight: 700 }}>{lastLine}</span>
        </h1>

        {visible("summary") && summary && (
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#54504a", margin: "22px 0 32px", maxWidth: 430 }}>
            {summary}
          </p>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <SectionRule n="01" label={labelFor("workExperience")} />
            <div style={{ marginBottom: 30 }}>
              {workExperience.map((e, i) => {
                const last = i === workExperience.length - 1
                return (
                  <div
                    key={e.id}
                    className="resume-entry"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 16,
                      paddingBottom: last ? 0 : 16,
                      marginBottom: last ? 0 : 16,
                      borderBottom: last ? "none" : "1px solid #e6dfcf",
                      breakInside: "avoid",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: ink }}>{e.jobTitle}</div>
                      <div style={{ fontSize: 12.5, color: accent, fontWeight: 600, marginBottom: 6 }}>
                        {e.employer}
                        {e.city ? ` · ${e.city}` : ""}
                      </div>
                      {e.description && (
                        <div
                          className="resume-desc"
                          style={{ fontSize: 12.5, color: "#5a564f", lineHeight: 1.55, maxWidth: 420 }}
                          dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                        />
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: stone, whiteSpace: "nowrap", paddingTop: 3, letterSpacing: "0.02em" }}>
                      {e.startDate}
                      {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 36 }}>
          {visible("education") && education.length > 0 && (
            <div>
              <SectionRule n="02" label={labelFor("education")} />
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 10, breakInside: "avoid" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: ink }}>
                    {ed.degree}
                    {ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 12.5, color: accent, fontWeight: 600 }}>
                    {ed.institution}
                    {ed.city ? `, ${ed.city}` : ""}
                  </div>
                  <div style={{ fontSize: 11.5, color: stone, marginTop: 2 }}>
                    {ed.startDate}
                    {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}

          {visible("projects") && projects.length > 0 && (
            <div>
              <SectionRule n="03" label={labelFor("projects")} />
              {projects.map((p) => (
                <div key={p.id} style={{ display: "flex", gap: 9, fontSize: 12, color: "#5a564f", marginBottom: 7, lineHeight: 1.4 }}>
                  <span style={{ color: accent, fontSize: 13, marginTop: 1 }}><Award /></span>
                  <span>
                    <strong style={{ color: ink, fontWeight: 700 }}>{p.name}</strong>
                    {p.role ? ` — ${p.role}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
