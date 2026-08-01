"use client"

/**
 * Vitals (TplDoctor) — clinical teal sidebar layout.
 * Source: planillas-lujosas-Jun-29026/cv-professions-b.jsx (TplDoctor).
 *
 * Design fidelity:
 *  - Teal #0f8a8a sidebar w/ pulse line SVG + cross emblem.
 *  - Soft #e6f5f5 panels for summary + skill chips.
 *  - Timeline dots w/ ring shadow on experience entries.
 *  - Round teal icon badges on main section headings.
 */

import { fmtDesc } from "@/lib/utils"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { designAccent } from "@/lib/resume/template-accent"
import { useShallow } from "zustand/react/shallow"

const SANS = 'var(--font-jakarta), "Inter", system-ui, -apple-system, "Segoe UI", sans-serif'

const LANG_PCT: Record<string, number> = {
  a1: 25, a2: 40, b1: 55, b2: 70, c1: 85, c2: 95, native: 100,
}

export default function TplDoctorTemplate() {
  const soft = "#e6f5f5"

  const { config, sections } = useResumeStore(
    useShallow((s) => ({ config: s.config, sections: s.sections })),
  )
  const teal = designAccent(config.colorScheme, "#0f8a8a")
  const data = useTemplateSectionData()
  const {
    personalDetails: pd, summary, workExperience, education,
    skills, languages, certifications, projects,
  } = data
  const present = config.language === "en" ? "Present" : "Presente"
  const labelFor = (id: string) => sections.find((s) => s.id === id)?.label ?? id
  const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

  const fullName = [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name"

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
  const Brief = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
  const Cap = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" />
    </svg>
  )
  const Code = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  )

  const contacts: Array<[React.ReactNode, string]> = []
  if (pd.email) contacts.push([<Mail key="m" />, pd.email])
  if (pd.phone) contacts.push([<Phone key="p" />, pd.phone])
  const place = [pd.city, pd.country].filter(Boolean).join(", ")
  if (place) contacts.push([<Pin key="i" />, place])
  if (pd.website) contacts.push([<Globe key="g" />, pd.website])

  const DrSideH = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#cfeeee", marginBottom: 11, fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.25)", paddingBottom: 6 }}>
      {children}
    </div>
  )
  const DrMainH = ({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "20px 0 12px", fontSize: 15, fontWeight: 700, color: "#10403f" }}>
      <span style={{ width: 27, height: 27, borderRadius: 8, background: teal, color: "#fff", display: "grid", placeItems: "center", fontSize: 13, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        {icon}
      </span>
      {children}
    </div>
  )

  return (
    <div
      data-print-layout="sidebar-left"
      style={{
        width: "100%",
        minHeight: "297mm",
        background: "#fff",
        color: "#1c2e2e",
        fontFamily: "inherit",
        display: "grid",
        gridTemplateColumns: "250px 1fr",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* SIDEBAR */}
      <div style={{ background: teal, color: "#eafafa", padding: "44px 24px", position: "relative", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <svg viewBox="0 0 200 40" width="100%" height="34" style={{ position: "absolute", top: 14, left: 0, opacity: 0.4 }}>
          <path d="M0 20 H60 l8 -14 l10 28 l8 -20 l6 6 H200" fill="none" stroke="#eafafa" strokeWidth="2" />
        </svg>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 24, marginBottom: 22 }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(255,255,255,0.14)", border: "2px solid rgba(255,255,255,0.4)", display: "grid", placeItems: "center", position: "relative", overflow: "hidden" }}>
            {config.photoUrl ? (
              <img
                src={config.photoUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${config.photoPosition ?? 15}%` }}
              />
            ) : (
              <svg viewBox="0 0 40 40" width="40" height="40"><g stroke="#eafafa" strokeWidth="3" strokeLinecap="round"><path d="M20 8 v24 M8 20 h24" /></g></svg>
            )}
          </div>
        </div>

        {contacts.length > 0 && (
          <>
            <DrSideH>{config.language === "en" ? "Contact" : "Contacto"}</DrSideH>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 11.5, marginBottom: 24 }}>
              {contacts.map(([I, t], i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 9, color: "#cfeeee" }}>
                  <span style={{ fontSize: 13, display: "inline-flex" }}>{I}</span>{t}
                </span>
              ))}
            </div>
          </>
        )}

        {visible("certifications") && certifications.length > 0 && (
          <>
            <DrSideH>{labelFor("certifications")}</DrSideH>
            <div style={{ marginBottom: 24 }}>
              {certifications.map((c) => (
                <div key={c.id} style={{ fontSize: 11.5, color: "#eafafa", marginBottom: 5, display: "flex", gap: 8 }}>
                  <span>✚</span>{c.name}
                </div>
              ))}
            </div>
          </>
        )}

        {visible("languages") && languages.length > 0 && (
          <>
            <DrSideH>{labelFor("languages")}</DrSideH>
            {languages.map((l) => {
              const pct = LANG_PCT[l.level] ?? 60
              return (
                <div key={l.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3 }}>
                    <span>{l.name}</span>
                    <span style={{ color: "#a8dcdc" }}>{l.level?.toUpperCase()}</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#eafafa", borderRadius: 2, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* MAIN */}
      <div style={{ padding: "44px 40px 40px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: teal, marginBottom: 8, fontWeight: 600 }}>
          {pd.jobTitle || (config.language === "en" ? "Physician" : "Médico")}
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 700, margin: 0, color: "#10403f", lineHeight: 1, letterSpacing: "-0.02em" }}>{fullName}</h1>
        {pd.jobTitle && (
          <div style={{ fontSize: 15, color: teal, marginTop: 7, fontWeight: 500 }}>{pd.jobTitle}</div>
        )}

        {visible("summary") && summary && (
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#3a504f", marginTop: 16, background: soft, borderRadius: 12, padding: "14px 16px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            {summary}
          </p>
        )}

        {visible("workExperience") && workExperience.length > 0 && (
          <>
            <DrMainH icon={<Brief />}>{labelFor("workExperience")}</DrMainH>
            {workExperience.map((e) => (
              <div key={e.id} className="resume-entry" style={{ marginBottom: 15, paddingLeft: 18, borderLeft: `2px solid ${soft}`, position: "relative", breakInside: "avoid", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                <span style={{ position: "absolute", left: -6, top: 4, width: 10, height: 10, borderRadius: "50%", background: teal, boxShadow: `0 0 0 3px ${soft}`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: "#10403f" }}>{e.jobTitle}</div>
                  <div style={{ fontSize: 11.5, color: teal, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {e.startDate}
                    {e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: "#7a908f", marginBottom: 5 }}>
                  {e.employer}{e.city ? ` · ${e.city}` : ""}
                </div>
                {e.description && (
                  <div
                    className="resume-desc"
                    style={{ fontSize: 12, color: "#3a504f", lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{ __html: fmtDesc(e.description) }}
                  />
                )}
              </div>
            ))}
          </>
        )}

        {visible("skills") && skills.length > 0 && (
          <>
            <DrMainH icon={<Code />}>{labelFor("skills")}</DrMainH>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {skills.map((s) => (
                <span key={s.id} style={{ fontSize: 11.5, background: soft, color: teal, padding: "5px 11px", borderRadius: 8, fontWeight: 600, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  {s.name}
                </span>
              ))}
            </div>
          </>
        )}

        {visible("education") && education.length > 0 && (
          <>
            <DrMainH icon={<Cap />}>{labelFor("education")}</DrMainH>
            {education.map((ed) => (
              <div key={ed.id} className="resume-entry" style={{ marginBottom: 8, breakInside: "avoid" }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: "#10403f" }}>
                  {ed.degree}{ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}
                </div>
                <div style={{ fontSize: 12, color: "#7a908f" }}>
                  {ed.institution} · {ed.startDate}
                  {ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}
                </div>
              </div>
            ))}
          </>
        )}

        {visible("projects") && projects.length > 0 && (
          <>
            <DrMainH icon={<Brief />}>{labelFor("projects")}</DrMainH>
            {projects.map((p) => (
              <div key={p.id} style={{ fontSize: 12, color: "#3a504f", marginBottom: 4 }}>
                <strong style={{ color: "#10403f", fontWeight: 700 }}>{p.name}</strong>
                {p.role ? ` — ${p.role}` : ""}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
