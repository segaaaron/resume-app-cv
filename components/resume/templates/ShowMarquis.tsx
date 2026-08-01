"use client"

/**
 * Marquis — emerald + gold, horizontal photo band.
 * Source: planillas-lujosas-Jun-29026/cv-showcase.jsx (ShowMarquis).
 *
 * Palette: green #13352b, gold #c9ae6b/#caa867, ivory #f1ece0.
 * Top dark band overlays portrait + name; body has main column + sidebar with diamond bullets.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-jakarta), "Space Grotesk", "Inter", system-ui, -apple-system, sans-serif'
const SERIF = 'Georgia, "Times New Roman", serif'

const LANG_LEVEL_LABEL: Record<string, string> = {
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native",
}

export default function ShowMarquisTemplate() {
  const green = "#13352b"
  const gold = "#c9ae6b"
  const ivory = "#f1ece0"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const accent = designAccent(config.colorScheme, "#c9ae6b")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false
  const langLbl = (lvl: string) => LANG_LEVEL_LABEL[lvl] ?? lvl.toUpperCase()

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
  const Award = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" /><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
    </svg>
  )

  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.email) contacts.push([<Mail key="m" />, pd.email])
  if (pd.phone) contacts.push([<Phone key="p" />, pd.phone])
  if (place) contacts.push([<Pin key="i" />, place])
  if (pd.website) contacts.push([<Globe key="g" />, pd.website])

  const H = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 13px" }}>
      <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: green }}>{children}</span>
      <span style={{ flex: 1, height: 1, background: "#ddd6c6" }} />
    </div>
  )
  const Mini = ({ children, mt = 18 }: { children: React.ReactNode; mt?: number }) => (
    <div style={{ fontSize: 10.5, letterSpacing: "0.24em", textTransform: "uppercase", color: accent, fontWeight: 700, margin: "0 0 11px", marginTop: mt }}>
      {children}
    </div>
  )

  return (
    <div
      data-print-layout="sidebar-right"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: ivory,
        color: "#1f2b25",
        fontFamily: "inherit",
        overflow: "hidden",
        position: "relative",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Top band */}
      <div style={{ position: "relative", height: 210, background: green, overflow: "hidden", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        {config.photoUrl ? (
          <img
            src={config.photoUrl}
            alt=""
            style={{
              position: "absolute", top: 0, right: 0, width: 300, height: 210,
              objectFit: "cover",
              objectPosition: `center ${config.photoPosition ?? 15}%`,
              filter: "grayscale(1) contrast(1.05) brightness(0.82) sepia(0.25)",
              display: "block",
            }}
          />
        ) : (
          <div style={{ position: "absolute", top: 0, right: 0, width: 300, height: 210, background: "#1a4a3a", display: "grid", placeItems: "center", color: gold, fontSize: 60, fontWeight: 300 }}>
            {initials}
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${green} 42%, rgba(19,53,43,0.65) 60%, rgba(19,53,43,0.25) 100%)` }} />
        <div style={{ position: "relative", padding: "44px 48px", color: ivory }}>
          {pd.jobTitle && (
            <div style={{ fontSize: 11, letterSpacing: "0.4em", color: accent, marginBottom: 14, textTransform: "uppercase" }}>
              {pd.jobTitle}
            </div>
          )}
          <h1 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, margin: 0, lineHeight: 0.96, letterSpacing: "-0.01em" }}>
            {pd.firstName || "Your"}<br />{pd.lastName || "Name"}
          </h1>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${accent}, ${accent}00)` }} />
      </div>

      <div style={{ padding: "24px 48px", display: "grid", gridTemplateColumns: "1fr 230px", gap: 36 }}>
        <div>
          {visible("summary") && summary && (
            <p style={{ fontSize: 13, lineHeight: 1.65, color: "#3a463f", margin: "0 0 20px" }}>{summary}</p>
          )}

          {visible("workExperience") && workExperience.length > 0 && (
            <>
              <H>{labelFor("workExperience")}</H>
              {workExperience.map((e) => (
                <div key={e.id} className="resume-entry" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, paddingBottom: 13, marginBottom: 13, borderBottom: "1px solid #e0dacb", breakInside: "avoid" }}>
                  <div>
                    <div style={{ fontSize: 15.5, fontWeight: 700, color: green }}>{e.jobTitle}</div>
                    <div style={{ fontSize: 12, color: accent, fontWeight: 700, marginBottom: 4 }}>
                      {e.employer}{e.city ? ` · ${e.city}` : ""}
                    </div>
                    {e.description && (
                      <div
                        className="resume-desc"
                        style={{ fontSize: 12, color: "#48544c", lineHeight: 1.5 }}
                        dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                      />
                    )}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#8a9087", whiteSpace: "nowrap", paddingTop: 3 }}>
                    {e.startDate}
                    {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {visible("education") && education.length > 0 && (
            <>
              <H>{labelFor("education")}</H>
              {education.map((ed) => (
                <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: green }}>
                    {ed.degree}{ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "#8a9087" }}>
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
              <Mini mt={0}>{labelFor("skills")}</Mini>
              {skills.map((s, i, a) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#3a463f", padding: "7px 0", borderBottom: i < a.length - 1 ? "1px solid #e6e0d1" : "none" }}>
                  <span style={{ width: 4, height: 4, background: accent, transform: "rotate(45deg)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  {s.name}
                </div>
              ))}
            </>
          )}

          {visible("languages") && languages.length > 0 && (
            <>
              <Mini>{labelFor("languages")}</Mini>
              {languages.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#3a463f", padding: "4px 0" }}>
                  <span>{l.name}</span>
                  <span style={{ color: accent, fontWeight: 600 }}>{langLbl(l.level)}</span>
                </div>
              ))}
            </>
          )}

          {contacts.length > 0 && (
            <>
              <Mini>{config.language === "en" ? "Contact" : "Contacto"}</Mini>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 11.5, color: "#3a463f" }}>
                {contacts.map(([I, t], i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ color: accent, fontSize: 13 }}>{I}</span>{t}
                  </span>
                ))}
              </div>
            </>
          )}

          {visible("certifications") && certifications.length > 0 && certifications.slice(0, 1).map((c) => (
            <div key={c.id} style={{ marginTop: 14, background: green, color: ivory, borderRadius: 10, padding: "11px 13px", display: "flex", gap: 9, alignItems: "center", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              <span style={{ color: accent, fontSize: 15 }}><Award /></span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{c.name}</span>
            </div>
          ))}

          {visible("projects") && projects.length > 0 && (
            <>
              <Mini>{labelFor("projects")}</Mini>
              {projects.map((p) => (
                <div key={p.id} style={{ fontSize: 11.5, color: "#3a463f", marginBottom: 6, lineHeight: 1.4 }}>
                  <strong style={{ color: green }}>{p.name}</strong>
                  {p.role ? ` — ${p.role}` : ""}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
